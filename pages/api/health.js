import { connectDB } from "../../lib/mongoose";

export default async (req, res) => {
  try {
    await connectDB();
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  } catch (err) {
    res.status(503).json({
      status: "unhealthy",
      error: err.message,
    });
  }
};
