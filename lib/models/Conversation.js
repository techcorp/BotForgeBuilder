import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema({
  botId: {
    type: String,
    required: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  conversationId: {
    type: String,
    unique: true,
    required: true,
  },
  messages: [
    {
      role: { type: String, enum: ["user", "assistant"] },
      content: String,
      timestamp: { type: Date, default: Date.now },
    },
  ],
  metadata: {
    userEmail: String,
    userId: String,
    ipAddress: String,
    userAgent: String,
    language: String,
    timezone: String,
    source: { type: String, enum: ["web", "api", "embed", "slack", "discord"] },
  },
  status: {
    type: String,
    enum: ["active", "completed", "abandoned"],
    default: "active",
  },
  metrics: {
    messageCount: { type: Number, default: 0 },
    duration: { type: Number, default: 0 }, // seconds
    sentiment: { type: String, enum: ["positive", "neutral", "negative"] },
    satisfaction: { type: Number, min: 0, max: 5 }, // user rating
    topicDetected: String,
    resolutionStatus: { type: String, enum: ["resolved", "unresolved", "escalated"] },
  },
  integrations: {
    slackChannelId: String,
    discordChannelId: String,
    webhookEventSent: Boolean,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: Date,
});

ConversationSchema.index({ botId: 1, createdAt: -1 });
ConversationSchema.index({ teamId: 1, createdAt: -1 });
ConversationSchema.index({ conversationId: 1 });
ConversationSchema.index({ "metadata.userEmail": 1 });
ConversationSchema.index({ createdAt: -1 });

export default mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
