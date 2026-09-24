import { connectDB } from "../../../lib/mongoose";
import Bot from "../../../lib/models/Bot";
import { withAuth, withTeamAuth, checkRole } from "../../../lib/middleware";
import { rateLimit } from "../../../lib/rateLimit";
import { logger } from "../../../lib/logger";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const limiter = rateLimit(100, 60000);

export default async function handler(req, res) {
  limiter(req, res, () => {});

  try {
    await connectDB();

    if (req.method === "GET") {
      return handleList(req, res);
    } else if (req.method === "POST") {
      return handleCreate(req, res);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    logger.error("Bots API error", { error: err.message });
    return res.status(500).json({ error: err.message });
  }
}

async function handleList(req, res) {
  await withAuth(req, res, () => {});
  if (!req.user) return;

  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "10");
  const skip = (page - 1) * limit;

  const filter = { createdBy: req.user._id };
  if (req.teamId) {
    filter.teamId = req.teamId;
  }

  const [bots, total] = await Promise.all([
    Bot.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Bot.countDocuments(filter),
  ]);

  logger.info("List bots", { userId: req.user._id, count: bots.length });

  return res.status(200).json({
    bots,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

async function handleCreate(req, res) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const { name, businessName, businessType, businessDetails, tone, language, model, customInstructions, welcomeMessage } = req.body;

  if (!name || !businessName) {
    return res.status(400).json({ error: "Name and business name are required" });
  }

  const botId = Date.now().toString();

  const bot = new Bot({
    id: botId,
    teamId: req.teamId,
    createdBy: req.user._id,
    name,
    businessName,
    businessType,
    businessDetails,
    tone,
    language,
    model,
    customInstructions,
    welcomeMessage,
    status: "draft",
  });

  await bot.save();

  logger.info("Create bot", { botId, userId: req.user._id });

  return res.status(201).json({ bot });
}
