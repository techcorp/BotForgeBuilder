import { connectDB } from "../../../../lib/mongoose";
import Team from "../../../../lib/models/Team";
import { withAuth, withTeamAuth } from "../../../../lib/middleware";
import { rateLimit } from "../../../../lib/rateLimit";
import { logger } from "../../../../lib/logger";
import { logAudit } from "../../../../lib/auditLog";
import { validateTeamData } from "../../../../lib/validation";

const limiter = rateLimit(50, 60000);

/**
 * @swagger
 * /api/v1/teams:
 *   get:
 *     summary: List user's teams
 *     security:
 *       - BearerAuth: []
 *   post:
 *     summary: Create a new team
 *     security:
 *       - BearerAuth: []
 */

export default async function handler(req, res) {
  limiter(req, res, () => {});

  try {
    await connectDB();

    if (req.method === "GET") {
      return handleList(req, res);
    } else if (req.method === "POST") {
      return handleCreate(req, res);
    } else {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }
  } catch (err) {
    logger.error("Teams API error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleList(req, res) {
  await withAuth(req, res, () => {});
  if (!req.user) return;

  const teams = await Team.find({
    $or: [{ ownerId: req.user._id }, { "members.userId": req.user._id }],
  }).select("-members.userId");

  logger.info("List teams", { userId: req.user._id, count: teams.length });

  return res.status(200).json({
    success: true,
    data: {
      teams,
    },
  });
}

async function handleCreate(req, res) {
  await withAuth(req, res, () => {});
  if (!req.user) return;

  const { name, description, website } = req.body;

  const validationErrors = validateTeamData({ name, website });
  if (validationErrors) {
    return res.status(400).json({ success: false, errors: validationErrors });
  }

  const team = new Team({
    name,
    description,
    website,
    ownerId: req.user._id,
    members: [{ userId: req.user._id, role: "admin" }],
  });

  await team.save();

  // Update user's current team
  req.user.currentTeamId = team._id;
  await req.user.save();

  logger.info("Create team", { teamId: team._id, userId: req.user._id });
  await logAudit(req, "CREATE", "TEAM", team._id.toString(), { name });

  return res.status(201).json({
    success: true,
    data: { team },
  });
}
