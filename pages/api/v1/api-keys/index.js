import { connectDB } from "../../../../lib/mongoose";
import ApiKey from "../../../../lib/models/ApiKey";
import { withAuth, withTeamAuth } from "../../../../lib/middleware";
import { rateLimit } from "../../../../lib/rateLimit";
import { logger } from "../../../../lib/logger";
import { logAudit } from "../../../../lib/auditLog";
import crypto from "crypto";

const limiter = rateLimit(50, 60000);

/**
 * @swagger
 * /api/v1/api-keys:
 *   get:
 *     summary: List API keys for team
 *     security:
 *       - BearerAuth: []
 *   post:
 *     summary: Create a new API key
 *     security:
 *       - BearerAuth: []
 */

export default async function handler(req, res) {
  limiter(req, res, () => {});

  try {
    await connectDB();

    if (req.method === "GET") {
      return handleList(req, res);
    } else if (req.method === "POST") {
      return handleCreate(req, res);
    } else {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }
  } catch (err) {
    logger.error("API keys error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleList(req, res) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const page = Math.max(1, parseInt(req.query.page || "1"));
  const limit = Math.min(100, parseInt(req.query.limit || "10"));
  const skip = (page - 1) * limit;

  const [keys, total] = await Promise.all([
    ApiKey.find({ teamId: req.teamId })
      .select("-keyHash -key")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ApiKey.countDocuments({ teamId: req.teamId }),
  ]);

  logger.info("List API keys", { teamId: req.teamId, count: keys.length });

  return res.status(200).json({
    success: true,
    data: {
      apiKeys: keys,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}

async function handleCreate(req, res) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const { name, permissions, restrictions, rateLimit: customRateLimit, expiresAt } = req.body;

  if (!name || !permissions || !Array.isArray(permissions) || permissions.length === 0) {
    return res.status(400).json({ success: false, error: "Name and permissions are required" });
  }

  const validPermissions = ["bots:read", "bots:write", "bots:delete", "conversations:read", "webhooks:read", "webhooks:write"];
  if (!permissions.every(p => validPermissions.includes(p))) {
    return res.status(400).json({ success: false, error: "Invalid permissions" });
  }

  // Generate API key
  const keyBytes = crypto.randomBytes(32);
  const key = `sk_${keyBytes.toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");

  const apiKey = new ApiKey({
    teamId: req.teamId,
    createdBy: req.user._id,
    name,
    key,
    keyHash,
    permissions,
    restrictions: restrictions || {},
    rateLimit: customRateLimit || { requestsPerMinute: 100, requestsPerDay: 10000 },
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
  });

  await apiKey.save();

  logger.info("Create API key", { apiKeyId: apiKey._id, teamId: req.teamId });
  await logAudit(req, "CREATE", "API_KEY", apiKey._id.toString(), { name, permissions });

  return res.status(201).json({
    success: true,
    data: {
      apiKey: {
        ...apiKey.toObject(),
        key, // Only return on creation
      },
    },
  });
}
