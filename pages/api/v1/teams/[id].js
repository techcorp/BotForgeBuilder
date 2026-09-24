import { connectDB } from "../../../../lib/mongoose";
import Team from "../../../../lib/models/Team";
import { withAuth, withTeamAuth } from "../../../../lib/middleware";
import { rateLimit } from "../../../../lib/rateLimit";
import { logger } from "../../../../lib/logger";
import { logAudit } from "../../../../lib/auditLog";

const limiter = rateLimit(50, 60000);

/**
 * @swagger
 * /api/v1/teams/{id}:
 *   get:
 *     summary: Get team details
 *     security:
 *       - BearerAuth: []
 *   put:
 *     summary: Update team
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Delete team
 *     security:
 *       - BearerAuth: []
 */

export default async function handler(req, res) {
  limiter(req, res, () => {});

  try {
    await connectDB();

    const { id } = req.query;

    if (req.method === "GET") {
      return handleGet(req, res, id);
    } else if (req.method === "PUT") {
      return handleUpdate(req, res, id);
    } else if (req.method === "DELETE") {
      return handleDelete(req, res, id);
    } else {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }
  } catch (err) {
    logger.error("Team detail API error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleGet(req, res, teamId) {
  await withAuth(req, res, () => {});
  if (!req.user) return;

  const team = await Team.findById(teamId).populate("members.userId", "email firstName lastName");

  if (!team) {
    return res.status(404).json({ success: false, error: "Team not found" });
  }

  // Check membership
  const isMember = team.members.some(m => m.userId._id.toString() === req.user._id.toString());
  const isOwner = team.ownerId.toString() === req.user._id.toString();

  if (!isMember && !isOwner) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  return res.status(200).json({
    success: true,
    data: { team },
  });
}

async function handleUpdate(req, res, teamId) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const team = await Team.findById(teamId);

  if (!team) {
    return res.status(404).json({ success: false, error: "Team not found" });
  }

  // Only owner can update
  if (team.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: "Forbidden: Only owner can update team" });
  }

  const { name, description, website, logo } = req.body;

  if (name) team.name = name;
  if (description !== undefined) team.description = description;
  if (website !== undefined) team.website = website;
  if (logo !== undefined) team.logo = logo;

  team.updatedAt = new Date();
  await team.save();

  logger.info("Update team", { teamId, userId: req.user._id });
  await logAudit(req, "UPDATE", "TEAM", teamId, { name, description });

  return res.status(200).json({
    success: true,
    data: { team },
  });
}

async function handleDelete(req, res, teamId) {
  await withAuth(req, res, () => {});
  if (!req.user) return;

  const team = await Team.findById(teamId);

  if (!team) {
    return res.status(404).json({ success: false, error: "Team not found" });
  }

  // Only owner can delete
  if (team.ownerId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, error: "Forbidden: Only owner can delete team" });
  }

  await Team.findByIdAndDelete(teamId);

  logger.info("Delete team", { teamId, userId: req.user._id });
  await logAudit(req, "DELETE", "TEAM", teamId);

  return res.status(200).json({
    success: true,
    message: "Team deleted successfully",
  });
}
