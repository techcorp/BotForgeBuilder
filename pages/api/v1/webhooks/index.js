import { connectDB } from "../../../../lib/mongoose";
import Webhook from "../../../../lib/models/Webhook";
import { withAuth, withTeamAuth } from "../../../../lib/middleware";
import { rateLimit } from "../../../../lib/rateLimit";
import { logger } from "../../../../lib/logger";
import { logAudit } from "../../../../lib/auditLog";
import crypto from "crypto";

const limiter = rateLimit(50, 60000);

/**
 * @swagger
 * /api/v1/webhooks:
 *   get:
 *     summary: List webhooks for team
 *     security:
 *       - BearerAuth: []
 *   post:
 *     summary: Create a new webhook
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *               - events
 *             properties:
 *               name:
 *                 type: string
 *               url:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *               headers:
 *                 type: object
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
    logger.error("Webhooks API error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleList(req, res) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const page = Math.max(1, parseInt(req.query.page || "1"));
  const limit = Math.min(100, parseInt(req.query.limit || "10"));
  const skip = (page - 1) * limit;

  const [webhooks, total] = await Promise.all([
    Webhook.find({ teamId: req.teamId })
      .select("-secret")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Webhook.countDocuments({ teamId: req.teamId }),
  ]);

  logger.info("List webhooks", { teamId: req.teamId, count: webhooks.length });

  return res.status(200).json({
    success: true,
    data: {
      webhooks,
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

  const { name, url, events, headers } = req.body;

  if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: name, url, events",
    });
  }

  // Validate URL
  try {
    new URL(url);
  } catch (err) {
    return res.status(400).json({ success: false, error: "Invalid URL format" });
  }

  const secret = crypto.randomBytes(32).toString("hex");

  const webhook = new Webhook({
    teamId: req.teamId,
    createdBy: req.user._id,
    name,
    url,
    events,
    secret,
    headers: headers || {},
  });

  await webhook.save();

  logger.info("Create webhook", { webhookId: webhook._id, teamId: req.teamId });
  await logAudit(req, "CREATE", "WEBHOOK", webhook._id.toString(), { name, url, events });

  return res.status(201).json({
    success: true,
    data: {
      webhook: {
        ...webhook.toObject(),
        secret, // Return secret only on creation
      },
    },
  });
}
