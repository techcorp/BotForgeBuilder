import { connectDB } from "../../../../lib/mongoose";
import Webhook from "../../../../lib/models/Webhook";
import { withAuth, withTeamAuth } from "../../../../lib/middleware";
import { rateLimit } from "../../../../lib/rateLimit";
import { logger } from "../../../../lib/logger";
import { logAudit } from "../../../../lib/auditLog";

const limiter = rateLimit(50, 60000);

/**
 * @swagger
 * /api/v1/webhooks/{id}:
 *   get:
 *     summary: Get webhook details
 *     security:
 *       - BearerAuth: []
 *   put:
 *     summary: Update webhook
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Delete webhook
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
    logger.error("Webhook detail API error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleGet(req, res, webhookId) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const webhook = await Webhook.findOne({
    _id: webhookId,
    teamId: req.teamId,
  }).select("-secret");

  if (!webhook) {
    return res.status(404).json({ success: false, error: "Webhook not found" });
  }

  return res.status(200).json({
    success: true,
    data: { webhook },
  });
}

async function handleUpdate(req, res, webhookId) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const webhook = await Webhook.findOne({
    _id: webhookId,
    teamId: req.teamId,
  });

  if (!webhook) {
    return res.status(404).json({ success: false, error: "Webhook not found" });
  }

  const { name, url, events, headers, isActive } = req.body;

  if (url) {
    try {
      new URL(url);
    } catch (err) {
      return res.status(400).json({ success: false, error: "Invalid URL format" });
    }
    webhook.url = url;
  }

  if (name) webhook.name = name;
  if (events) webhook.events = events;
  if (headers) webhook.headers = headers;
  if (isActive !== undefined) webhook.isActive = isActive;

  webhook.updatedAt = new Date();
  await webhook.save();

  logger.info("Update webhook", { webhookId, teamId: req.teamId });
  await logAudit(req, "UPDATE", "WEBHOOK", webhookId, { name, url, events });

  return res.status(200).json({
    success: true,
    data: { webhook: webhook.toObject({ transform: (doc, ret) => { delete ret.secret; return ret; } }) },
  });
}

async function handleDelete(req, res, webhookId) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const webhook = await Webhook.findOne({
    _id: webhookId,
    teamId: req.teamId,
  });

  if (!webhook) {
    return res.status(404).json({ success: false, error: "Webhook not found" });
  }

  await Webhook.deleteOne({ _id: webhookId });

  logger.info("Delete webhook", { webhookId, teamId: req.teamId });
  await logAudit(req, "DELETE", "WEBHOOK", webhookId);

  return res.status(200).json({
    success: true,
    message: "Webhook deleted successfully",
  });
}
