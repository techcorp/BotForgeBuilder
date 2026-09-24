import mongoose from "mongoose";

const IntegrationSchema = new mongoose.Schema({
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
  platform: {
    type: String,
    enum: ["slack", "discord", "teams", "telegram", "custom"],
    required: true,
  },
  config: {
    webhookUrl: String,
    channelId: String,
    channelName: String,
    botToken: String,
    clientId: String,
    clientSecret: String, // encrypted
    apiKey: String, // encrypted
    customHeaders: mongoose.Schema.Types.Mixed,
  },
  bots: [
    {
      botId: String,
      enabled: { type: Boolean, default: true },
      messageTemplate: String,
      includeUserInfo: { type: Boolean, default: false },
    },
  ],
  events: [
    {
      type: String,
      enum: ["conversation.started", "conversation.ended", "message.sent", "error.occurred"],
    },
  ],
  statistics: {
    totalForwarded: { type: Number, default: 0 },
    totalFailed: { type: Number, default: 0 },
    lastSyncAt: Date,
    lastErrorAt: Date,
    lastError: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  retryPolicy: {
    maxRetries: { type: Number, default: 3 },
    retryDelay: { type: Number, default: 5000 }, // milliseconds
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

IntegrationSchema.index({ teamId: 1 });
IntegrationSchema.index({ platform: 1 });
IntegrationSchema.index({ isActive: 1 });

export default mongoose.models.Integration || mongoose.model("Integration", IntegrationSchema);
