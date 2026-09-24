import mongoose from "mongoose";
import crypto from "crypto";

const TeamInviteSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  role: {
    type: String,
    enum: ["admin", "manager", "editor", "viewer"],
    default: "editor",
  },
  token: {
    type: String,
    unique: true,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "expired"],
    default: "pending",
  },
  acceptedBy: mongoose.Schema.Types.ObjectId,
  acceptedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

TeamInviteSchema.index({ teamId: 1 });
TeamInviteSchema.index({ email: 1 });
TeamInviteSchema.index({ token: 1 });
TeamInviteSchema.index({ expiresAt: 1 });

export default mongoose.models.TeamInvite || mongoose.model("TeamInvite", TeamInviteSchema);
