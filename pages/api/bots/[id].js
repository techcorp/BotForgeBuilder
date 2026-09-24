import { connectDB } from "../../../lib/mongoose";
import Bot from "../../../lib/models/Bot";
import { withAuth, checkRole } from "../../../lib/middleware";
import { rateLimit } from "../../../lib/rateLimit";
import { logger } from "../../../lib/logger";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const limiter = rateLimit(100, 60000);

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
    logger.error("Bot API error", { error: err.message });
    return res.status(500).json({ error: err.message });
  }
}

async function handleGet(req, res, botId) {
  const bot = await Bot.findOne({ id: botId });
  if (!bot) {
    return res.status(404).json({ error: "Bot not found" });
  }

  if (bot.visibility === "private") {
    await withAuth(req, res, () => {});
    if (!req.user) return;

    if (bot.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Forbidden" });
    }
  }

  return res.status(200).json({ bot });
}

async function handleUpdate(req, res, botId) {
  await withAuth(req, res, () => {});
  if (!req.user) return;

  const bot = await Bot.findOne({ id: botId });
  if (!bot) {
    return res.status(404).json({ error: "Bot not found" });
  }

  if (bot.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Forbidden: Only creator can edit" });
  }

  const updated = await Bot.findOneAndUpdate({ id: botId }, req.body, { new: true });

  logger.info("Update bot", { botId, userId: req.user._id });

  return res.status(200).json({ bot: updated });
}

async function handleDelete(req, res, botId) {
  await withAuth(req, res, () => {});
  if (!req.user) return;

  const bot = await Bot.findOne({ id: botId });
  if (!bot) {
    return res.status(404).json({ error: "Bot not found" });
  }

  if (bot.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Forbidden: Only creator can delete" });
  }

  await Bot.findOneAndDelete({ id: botId });

  logger.info("Delete bot", { botId, userId: req.user._id });

  return res.status(200).json({ success: true });
}
