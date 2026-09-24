import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },
  action: {
    type: String,
    required: true,
    enum: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "EXPORT", "PUBLISH", "ARCHIVE"],
  },
  resource: {
    type: String,
    required: true,
    enum: ["BOT", "TEAM", "USER", "WEBHOOK", "API_KEY"],
  },
  resourceId: String,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ["SUCCESS", "FAILURE"],
    default: "SUCCESS",
  },
  error: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ teamId: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
