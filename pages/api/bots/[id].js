import { connectDB } from "../../../lib/mongoose";
import Bot from "../../../lib/models/Bot";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

export default async function handler(req, res) {
  try {
    await connectDB();

    const { id } = req.query;

    switch (req.method) {
      case "GET": {
        const bot = await Bot.findOne({ id });
        if (!bot) return res.status(404).json({ error: "Bot not found" });
        return res.json(bot);
      }

      case "PUT": {
        const bot = await Bot.findOneAndUpdate({ id }, req.body, { new: true });
        if (!bot) return res.status(404).json({ error: "Bot not found" });
        return res.json(bot);
      }

      case "DELETE": {
        const bot = await Bot.findOneAndDelete({ id });
        if (!bot) return res.status(404).json({ error: "Bot not found" });
        return res.json({ success: true });
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
