import { connectDB } from "../../../../lib/mongoose";
import Integration from "../../../../lib/models/Integration";
import { withAuth, withTeamAuth } from "../../../../lib/middleware";
import { rateLimit } from "../../../../lib/rateLimit";
import { logger } from "../../../../lib/logger";
import { logAudit } from "../../../../lib/auditLog";

const limiter = rateLimit(50, 60000);

/**
 * @swagger
 * /api/v1/integrations:
 *   get:
 *     summary: List integrations for team
 *     security:
 *       - BearerAuth: []
 *   post:
 *     summary: Create a new integration
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
    logger.error("Integrations API error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleList(req, res) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const page = Math.max(1, parseInt(req.query.page || "1"));
  const limit = Math.min(100, parseInt(req.query.limit || "10"));
  const skip = (page - 1) * limit;

  const [integrations, total] = await Promise.all([
    Integration.find({ teamId: req.teamId })
      .select("-config.clientSecret -config.apiKey -config.botToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Integration.countDocuments({ teamId: req.teamId }),
  ]);

  logger.info("List integrations", { teamId: req.teamId, count: integrations.length });

  return res.status(200).json({
    success: true,
    data: {
      integrations,
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

  const { name, platform, config, bots, events } = req.body;

  if (!name || !platform || !["slack", "discord", "teams", "telegram", "custom"].includes(platform)) {
    return res.status(400).json({ success: false, error: "Invalid name or platform" });
  }

  // Validate platform-specific config
  if (platform === "slack" && !config.webhookUrl) {
    return res.status(400).json({ success: false, error: "Slack integration requires webhookUrl" });
  }

  if (platform === "discord" && !config.webhookUrl) {
    return res.status(400).json({ success: false, error: "Discord integration requires webhookUrl" });
  }

  const integration = new Integration({
    teamId: req.teamId,
    createdBy: req.user._id,
    name,
    platform,
    config,
    bots: bots || [],
    events: events || ["conversation.ended"],
  });

  await integration.save();

  logger.info("Create integration", { integrationId: integration._id, platform, teamId: req.teamId });
  await logAudit(req, "CREATE", "WEBHOOK", integration._id.toString(), { name, platform });

  return res.status(201).json({
    success: true,
    data: { integration },
  });
}
