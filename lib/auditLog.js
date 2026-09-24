import AuditLog from "./models/AuditLog";
import { logger } from "./logger";

export async function logAudit(req, action, resource, resourceId, details = {}, status = "SUCCESS", error = null) {
  try {
    const auditEntry = new AuditLog({
      userId: req.user?._id,
      teamId: req.teamId || req.user?.currentTeamId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip || req.headers["x-forwarded-for"]?.split(",")[0] || "unknown",
      userAgent: req.headers["user-agent"],
      status,
      error: error?.message || error,
    });

    await auditEntry.save();
    logger.info("Audit log", { action, resource, resourceId, status });
  } catch (err) {
    logger.error("Failed to log audit", { error: err.message });
  }
}

export async function getAuditLogs(filters = {}) {
  try {
    const query = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.teamId) query.teamId = filters.teamId;
    if (filters.action) query.action = filters.action;
    if (filters.resource) query.resource = filters.resource;
    if (filters.resourceId) query.resourceId = filters.resourceId;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    const skip = (filters.page - 1) * filters.limit || 0;
    const limit = filters.limit || 50;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "email firstName lastName")
        .populate("teamId", "name"),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page: filters.page || 1,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (err) {
    logger.error("Failed to get audit logs", { error: err.message });
    throw err;
  }
}
