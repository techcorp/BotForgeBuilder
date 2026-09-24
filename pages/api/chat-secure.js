import { connectDB } from "../lib/mongoose";
import Bot from "../lib/models/Bot";
import { withAuth } from "../lib/middleware";
import { rateLimit } from "../lib/rateLimit";
import { logger } from "../lib/logger";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const limiter = rateLimit(50, 60000);

async function fetchWithRetry(url, options, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

export default async function handler(req, res) {
  limiter(req, res, () => {});

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await connectDB();
    await withAuth(req, res, () => {});

    if (!req.user) return;

    const { botId, model, messages, systemPrompt } = req.body || {};

    if (!botId || !model || !messages || !systemPrompt) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const bot = await Bot.findOne({ id: botId });
    if (!bot) {
      return res.status(404).json({ error: "Bot not found" });
    }

    if (bot.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Forbidden: Not bot creator" });
    }

    const ZEN_KEY = process.env.ZEN_API_KEY;
    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

    if (!ZEN_KEY && !ANTHROPIC_KEY) {
      return res.status(500).json({ error: "No API key configured" });
    }

    const isDirectAnthropic = model.source === "anthropic-direct";

    try {
      let response, data;

      if (isDirectAnthropic) {
        if (!ANTHROPIC_KEY) return res.status(400).json({ error: "ANTHROPIC_API_KEY not set" });

        response = await fetchWithRetry(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",
            headers: {
              "x-api-key": ANTHROPIC_KEY,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: model.id,
              max_tokens: 2048,
              system: systemPrompt,
              messages,
            }),
          }
        );

        if (!response.ok) {
          data = await response.json();
          throw new Error(data.error?.message || "Anthropic API error");
        }

        data = await response.json();
      } else {
        if (!ZEN_KEY) return res.status(400).json({ error: "ZEN_API_KEY not set" });

        response = await fetchWithRetry(
          "https://api.zen.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${ZEN_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model.id,
              messages: [{ role: "system", content: systemPrompt }, ...messages],
              temperature: 0.7,
              max_tokens: 2048,
            }),
          }
        );

        if (!response.ok) {
          data = await response.json();
          throw new Error(data.error?.message || "Zen API error");
        }

        data = await response.json();
      }

      logger.info("Chat request", { botId, userId: req.user._id });

      bot.conversations += 1;
      bot.lastConversation = new Date();
      await bot.save();

      return res.status(200).json({ data });
    } catch (err) {
      logger.error("Chat API error", { error: err.message });
      return res.status(500).json({ error: err.message });
    }
  } catch (err) {
    logger.error("Secure chat error", { error: err.message });
    return res.status(500).json({ error: err.message });
  }
}
