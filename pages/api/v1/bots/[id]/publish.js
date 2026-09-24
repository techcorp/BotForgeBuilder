import { connectDB } from "../../../../../lib/mongoose";
import Bot from "../../../../../lib/models/Bot";
import { withAuth } from "../../../../../lib/middleware";
import { rateLimit } from "../../../../../lib/rateLimit";
import { logger } from "../../../../../lib/logger";
import { logAudit } from "../../../../../lib/auditLog";

const limiter = rateLimit(50, 60000);

/**
 * @swagger
 * /api/v1/bots/{id}/publish:
 *   post:
 *     summary: Publish a chatbot
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bot published successfully
 */

export default async function handler(req, res) {
  limiter(req, res, () => {});

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    await connectDB();
    await withAuth(req, res, () => {});

    if (!req.user) return;

    const { id } = req.query;

    const bot = await Bot.findOne({ id });
    if (!bot) {
      return res.status(404).json({ success: false, error: "Bot not found" });
    }

    if (bot.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    // Validate required fields before publishing
    if (!bot.name || !bot.businessName || !bot.model || !bot.customInstructions) {
      return res.status(400).json({
        success: false,
        error: "Cannot publish: Missing required fields (name, businessName, model, customInstructions)",
      });
    }

    bot.status = "published";
    bot.publishedAt = new Date();
    await bot.save();

    logger.info("Publish bot", { botId: id, userId: req.user._id });
    await logAudit(req, "PUBLISH", "BOT", id);

    return res.status(200).json({
      success: true,
      message: "Bot published successfully",
      data: { bot },
    });
  } catch (err) {
    logger.error("Bot publish error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}
