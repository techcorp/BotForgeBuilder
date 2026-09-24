import { connectDB } from "../../../../lib/mongoose";
import Bot from "../../../../lib/models/Bot";
import { withAuth } from "../../../../lib/middleware";
import { rateLimit } from "../../../../lib/rateLimit";
import { logger } from "../../../../lib/logger";
import { validateBotData } from "../../../../lib/validation";
import { logAudit } from "../../../../lib/auditLog";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const limiter = rateLimit(100, 60000);

/**
 * @swagger
 * /api/v1/bots/{id}:
 *   get:
 *     summary: Get chatbot details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *   put:
 *     summary: Update chatbot
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *   delete:
 *     summary: Delete chatbot
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    logger.error("Bot detail API error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleGet(req, res, botId) {
  const bot = await Bot.findOne({ id: botId });
  if (!bot) {
    return res.status(404).json({ success: false, error: "Bot not found" });
  }

  if (bot.visibility === "private") {
    await withAuth(req, res, () => {});
    if (!req.user) return;

    if (bot.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }
  }

  return res.status(200).json({
    success: true,
    data: { bot },
  });
}

async function handleUpdate(req, res, botId) {
  await withAuth(req, res, () => {});
  if (!req.user) return;

  const bot = await Bot.findOne({ id: botId });
  if (!bot) {
    return res.status(404).json({ success: false, error: "Bot not found" });
  }

  if (bot.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: "Forbidden: Only creator can edit" });
  }

  const validationErrors = validateBotData(req.body);
  if (validationErrors) {
    return res.status(400).json({ success: false, errors: validationErrors });
  }

  const updatedBot = await Bot.findOneAndUpdate(
    { id: botId },
    { ...req.body, updatedAt: new Date() },
    { new: true }
  );

  logger.info("Update bot", { botId, userId: req.user._id });
  await logAudit(req, "UPDATE", "BOT", botId, req.body);

  return res.status(200).json({
    success: true,
    data: { bot: updatedBot },
  });
}

async function handleDelete(req, res, botId) {
  await withAuth(req, res, () => {});
  if (!req.user) return;

  const bot = await Bot.findOne({ id: botId });
  if (!bot) {
    return res.status(404).json({ success: false, error: "Bot not found" });
  }

  if (bot.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: "Forbidden: Only creator can delete" });
  }

  await Bot.findOneAndDelete({ id: botId });

  logger.info("Delete bot", { botId, userId: req.user._id });
  await logAudit(req, "DELETE", "BOT", botId);

  return res.status(200).json({
    success: true,
    message: "Bot deleted successfully",
  });
}
