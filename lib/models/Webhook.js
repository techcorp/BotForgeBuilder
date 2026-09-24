import mongoose from "mongoose";

const WebhookSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  events: [
    {
      type: String,
      enum: ["bot.created", "bot.updated", "bot.deleted", "bot.published", "conversation.started", "conversation.ended", "message.sent"],
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  secret: {
    type: String,
    required: true,
  },
  headers: {
    type: Map,
    of: String,
  },
  retryPolicy: {
    maxRetries: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 5000 },
  },
  statistics: {
    totalRequests: { type: Number, default: 0 },
    successfulRequests: { type: Number, default: 0 },
    failedRequests: { type: Number, default: 0 },
    lastRequestAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

WebhookSchema.index({ teamId: 1 });
WebhookSchema.index({ createdBy: 1 });
WebhookSchema.index({ isActive: 1 });

export default mongoose.models.Webhook || mongoose.model("Webhook", WebhookSchema);
