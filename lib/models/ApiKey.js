import mongoose from "mongoose";
import crypto from "crypto";

const ApiKeySchema = new mongoose.Schema({
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
  key: {
    type: String,
    unique: true,
    required: true,
  },
  keyHash: {
    type: String,
    required: true,
  },
  permissions: [
    {
      type: String,
      enum: ["bots:read", "bots:write", "bots:delete", "conversations:read", "webhooks:read", "webhooks:write"],
    },
  ],
  lastUsedAt: Date,
  lastUsedIp: String,
  usageCount: {
    type: Number,
    default: 0,
  },
  rateLimit: {
    requestsPerMinute: { type: Number, default: 100 },
    requestsPerDay: { type: Number, default: 10000 },
  },
  restrictions: {
    allowedIps: [String],
    allowedDomains: [String],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ApiKeySchema.index({ teamId: 1 });
ApiKeySchema.index({ keyHash: 1 });
ApiKeySchema.index({ createdBy: 1 });

export default mongoose.models.ApiKey || mongoose.model("ApiKey", ApiKeySchema);
