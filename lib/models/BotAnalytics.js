import mongoose from "mongoose";

const BotAnalyticsSchema = new mongoose.Schema({
  botId: {
    type: String,
    required: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  metrics: {
    totalConversations: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    totalUsers: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 }, // milliseconds
    avgMessageLength: { type: Number, default: 0 },
    avgConversationDuration: { type: Number, default: 0 }, // seconds
    avgSatisfactionScore: { type: Number, default: 0 },
  },
  sentiment: {
    positive: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
  },
  resolutions: {
    resolved: { type: Number, default: 0 },
    unresolved: { type: Number, default: 0 },
    escalated: { type: Number, default: 0 },
  },
  topTopics: [
    {
      topic: String,
      count: Number,
      sentiment: String,
    },
  ],
  trafficSource: {
    web: { type: Number, default: 0 },
    api: { type: Number, default: 0 },
    embed: { type: Number, default: 0 },
    slack: { type: Number, default: 0 },
    discord: { type: Number, default: 0 },
  },
  errors: {
    totalErrors: { type: Number, default: 0 },
    timeoutErrors: { type: Number, default: 0 },
    rateLimitErrors: { type: Number, default: 0 },
    apiErrors: { type: Number, default: 0 },
  },
  hourlyBreakdown: [
    {
      hour: Number,
      conversations: Number,
      messages: Number,
      avgResponse: Number,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

BotAnalyticsSchema.index({ botId: 1, date: -1 });
BotAnalyticsSchema.index({ teamId: 1, date: -1 });
BotAnalyticsSchema.index({ date: -1 });

export default mongoose.models.BotAnalytics || mongoose.model("BotAnalytics", BotAnalyticsSchema);
