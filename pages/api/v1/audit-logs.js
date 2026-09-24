import { connectDB } from "../../../lib/mongoose";
import { withAuth, withTeamAuth } from "../../../lib/middleware";
import { rateLimit } from "../../../lib/rateLimit";
import { logger } from "../../../lib/logger";
import { getAuditLogs } from "../../../lib/auditLog";

const limiter = rateLimit(50, 60000);

/**
 * @swagger
 * /api/v1/audit-logs:
 *   get:
 *     summary: Get audit logs for team/user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, PUBLISH]
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *           enum: [BOT, TEAM, USER, WEBHOOK, API_KEY]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of audit logs
 */

export default async function handler(req, res) {
  limiter(req, res, () => {});

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    await connectDB();
    await withTeamAuth(req, res, () => {});

    if (!req.user) return;

    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(100, parseInt(req.query.limit || "50"));

    const filters = {
      teamId: req.teamId,
      page,
      limit,
      action: req.query.action,
      resource: req.query.resource,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const result = await getAuditLogs(filters);

    logger.info("Get audit logs", { teamId: req.teamId, count: result.logs.length });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    logger.error("Audit logs API error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}
