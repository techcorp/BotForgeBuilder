import { connectDB } from "../../../../../lib/mongoose";
import Bot from "../../../../../lib/models/Bot";
import { withAuth } from "../../../../../lib/middleware";
import { rateLimit } from "../../../../../lib/rateLimit";
import { logger } from "../../../../../lib/logger";
import { logAudit } from "../../../../../lib/auditLog";

const limiter = rateLimit(50, 60000);

/**
 * @swagger
 * /api/v1/bots/{id}/archive:
 *   post:
 *     summary: Archive a chatbot
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
 *         description: Bot archived successfully
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

    bot.status = "archived";
    await bot.save();

    logger.info("Archive bot", { botId: id, userId: req.user._id });
    await logAudit(req, "ARCHIVE", "BOT", id);

    return res.status(200).json({
      success: true,
      message: "Bot archived successfully",
      data: { bot },
    });
  } catch (err) {
    logger.error("Bot archive error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}
