import { connectDB } from "../../../lib/mongoose";
import Bot from "../../../lib/models/Bot";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

export default async function handler(req, res) {
  try {
    await connectDB();

    switch (req.method) {
      case "GET": {
        const bots = await Bot.find().sort({ createdAt: -1 });
        return res.json(bots);
      }

      case "POST": {
        const bot = await Bot.create(req.body);
        return res.status(201).json(bot);
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
