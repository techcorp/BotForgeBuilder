import { connectDB } from "../../../../lib/mongoose";
import Bot from "../../../../lib/models/Bot";
import { withAuth, withTeamAuth } from "../../../../lib/middleware";
import { rateLimit } from "../../../../lib/rateLimit";
import { logger } from "../../../../lib/logger";
import { validateBotData } from "../../../../lib/validation";
import { logAudit } from "../../../../lib/auditLog";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const limiter = rateLimit(100, 60000);

/**
 * @swagger
 * /api/v1/bots:
 *   get:
 *     summary: List user's chatbots
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *       - in: query
 *         name: businessType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of bots
 *   post:
 *     summary: Create a new chatbot
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
 *               - businessName
 *             properties:
 *               name:
 *                 type: string
 *               businessName:
 *                 type: string
 *               businessType:
 *                 type: string
 *               businessDetails:
 *                 type: string
 *               tone:
 *                 type: string
 *               language:
 *                 type: string
 *               model:
 *                 type: object
 *     responses:
 *       201:
 *         description: Bot created successfully
 *       400:
 *         description: Validation error
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

  const page = Math.max(1, parseInt(req.query.page || "1"));
  const limit = Math.min(100, parseInt(req.query.limit || "10"));
  const skip = (page - 1) * limit;

  const filter = { createdBy: req.user._id };
  if (req.teamId) filter.teamId = req.teamId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.businessType) filter.businessType = req.query.businessType;

  const [bots, total] = await Promise.all([
    Bot.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Bot.countDocuments(filter),
  ]);

  logger.info("List bots", { userId: req.user._id, count: bots.length });

  return res.status(200).json({
    success: true,
    data: {
      bots,
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

  const validationErrors = validateBotData(req.body);
  if (validationErrors) {
    return res.status(400).json({ success: false, errors: validationErrors });
  }

  const { name, businessName, businessType, businessDetails, tone, language, model, customInstructions, welcomeMessage } = req.body;

  const botId = Date.now().toString();

  const bot = new Bot({
    id: botId,
    teamId: req.teamId,
    createdBy: req.user._id,
    name,
    businessName,
    businessType,
    businessDetails,
    tone: tone || "Friendly",
    language: language || "English",
    model,
    customInstructions,
    welcomeMessage,
    status: "draft",
  });

  await bot.save();

  logger.info("Create bot", { botId, userId: req.user._id });
  await logAudit(req, "CREATE", "BOT", botId, { name, businessName, businessType });

  return res.status(201).json({
    success: true,
    data: { bot },
  });
}
