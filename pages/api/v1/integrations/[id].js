import { connectDB } from "../../../../lib/mongoose";
import Integration from "../../../../lib/models/Integration";
import { withAuth, withTeamAuth } from "../../../../lib/middleware";
import { rateLimit } from "../../../../lib/rateLimit";
import { logger } from "../../../../lib/logger";
import { logAudit } from "../../../../lib/auditLog";

const limiter = rateLimit(50, 60000);

/**
 * @swagger
 * /api/v1/integrations/{id}:
 *   get:
 *     summary: Get integration details
 *     security:
 *       - BearerAuth: []
 *   put:
 *     summary: Update integration
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Delete integration
 *     security:
 *       - BearerAuth: []
 */

export default async function handler(req, res) {
  limiter(req, res, () => {});

  try {
    await connectDB();

    const { id } = req.query;

    if (req.method === "GET") {
      return handleGet(req, res, id);
    } else if (req.method === "PUT") {
      return handleUpdate(req, res, id);
    } else if (req.method === "DELETE") {
      return handleDelete(req, res, id);
    } else {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }
  } catch (err) {
    logger.error("Integration detail API error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleGet(req, res, integrationId) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const integration = await Integration.findOne({
    _id: integrationId,
    teamId: req.teamId,
  }).select("-config.clientSecret -config.apiKey -config.botToken");

  if (!integration) {
    return res.status(404).json({ success: false, error: "Integration not found" });
  }

  return res.status(200).json({
    success: true,
    data: { integration },
  });
}

async function handleUpdate(req, res, integrationId) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const integration = await Integration.findOne({
    _id: integrationId,
    teamId: req.teamId,
  });

  if (!integration) {
    return res.status(404).json({ success: false, error: "Integration not found" });
  }

  const { name, isActive, events, bots, config } = req.body;

  if (name) integration.name = name;
  if (isActive !== undefined) integration.isActive = isActive;
  if (events) integration.events = events;
  if (bots) integration.bots = bots;
  if (config) {
    integration.config = { ...integration.config, ...config };
  }

  integration.updatedAt = new Date();
  await integration.save();

  logger.info("Update integration", { integrationId, teamId: req.teamId });
  await logAudit(req, "UPDATE", "WEBHOOK", integrationId, { name, isActive });

  return res.status(200).json({
    success: true,
    data: { integration },
  });
}

async function handleDelete(req, res, integrationId) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const integration = await Integration.findOne({
    _id: integrationId,
    teamId: req.teamId,
  });

  if (!integration) {
    return res.status(404).json({ success: false, error: "Integration not found" });
  }

  await Integration.deleteOne({ _id: integrationId });

  logger.info("Delete integration", { integrationId, teamId: req.teamId });
  await logAudit(req, "DELETE", "WEBHOOK", integrationId);

  return res.status(200).json({
    success: true,
    message: "Integration deleted successfully",
  });
}
