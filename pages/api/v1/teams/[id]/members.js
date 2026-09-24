import { connectDB } from "../../../../../lib/mongoose";
import Team from "../../../../../lib/models/Team";
import TeamInvite from "../../../../../lib/models/TeamInvite";
import User from "../../../../../lib/models/User";
import { withAuth, withTeamAuth, checkRole } from "../../../../../lib/middleware";
import { rateLimit } from "../../../../../lib/rateLimit";
import { logger } from "../../../../../lib/logger";
import { logAudit } from "../../../../../lib/auditLog";
import crypto from "crypto";

const limiter = rateLimit(50, 60000);

/**
 * @swagger
 * /api/v1/teams/{id}/members:
 *   get:
 *     summary: List team members
 *     security:
 *       - BearerAuth: []
 *   post:
 *     summary: Invite user to team or update member role
 *     security:
 *       - BearerAuth: []
 */

export default async function handler(req, res) {
  limiter(req, res, () => {});

  try {
    await connectDB();

    const { id } = req.query;

    if (req.method === "GET") {
      return handleList(req, res, id);
    } else if (req.method === "POST") {
      return handleInvite(req, res, id);
    } else if (req.method === "DELETE") {
      return handleRemove(req, res, id);
    } else {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }
  } catch (err) {
    logger.error("Team members API error", { error: err.message });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function handleList(req, res, teamId) {
  await withAuth(req, res, () => {});
  if (!req.user) return;

  const team = await Team.findById(teamId).populate("members.userId", "email firstName lastName");

  if (!team) {
    return res.status(404).json({ success: false, error: "Team not found" });
  }

  // Check membership
  const isMember = team.members.some(m => m.userId._id.toString() === req.user._id.toString());
  if (!isMember) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  logger.info("List team members", { teamId, count: team.members.length });

  return res.status(200).json({
    success: true,
    data: {
      members: team.members,
    },
  });
}

async function handleInvite(req, res, teamId) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const team = await Team.findById(teamId);

  if (!team) {
    return res.status(404).json({ success: false, error: "Team not found" });
  }

  // Only admin/manager can invite
  const member = team.members.find(m => m.userId.toString() === req.user._id.toString());
  if (!member || !["admin", "manager"].includes(member.role)) {
    return res.status(403).json({ success: false, error: "Forbidden: Only admins/managers can invite" });
  }

  const { email, role = "editor" } = req.body;

  if (!email || !["admin", "manager", "editor", "viewer"].includes(role)) {
    return res.status(400).json({ success: false, error: "Invalid email or role" });
  }

  // Check if already a member
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const isMember = team.members.some(m => m.userId.toString() === existingUser._id.toString());
    if (isMember) {
      return res.status(400).json({ success: false, error: "User is already a team member" });
    }
  }

  const token = crypto.randomBytes(32).toString("hex");

  const invite = new TeamInvite({
    teamId,
    invitedBy: req.user._id,
    email,
    role,
    token,
  });

  await invite.save();

  logger.info("Invite to team", { teamId, email, role });
  await logAudit(req, "CREATE", "TEAM", teamId, { action: "invited user", email, role });

  return res.status(201).json({
    success: true,
    data: {
      invite: {
        id: invite._id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
        inviteUrl: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/join-team/${invite.token}`,
      },
    },
  });
}

async function handleRemove(req, res, teamId) {
  await withTeamAuth(req, res, () => {});
  if (!req.user) return;

  const team = await Team.findById(teamId);

  if (!team) {
    return res.status(404).json({ success: false, error: "Team not found" });
  }

  // Only admin can remove
  const member = team.members.find(m => m.userId.toString() === req.user._id.toString());
  if (!member || member.role !== "admin") {
    return res.status(403).json({ success: false, error: "Forbidden: Only admins can remove members" });
  }

  const { userId } = req.query;

  if (userId === req.user._id.toString()) {
    return res.status(400).json({ success: false, error: "Cannot remove yourself from team" });
  }

  team.members = team.members.filter(m => m.userId.toString() !== userId);
  await team.save();

  logger.info("Remove team member", { teamId, userId });
  await logAudit(req, "UPDATE", "TEAM", teamId, { action: "removed member", userId });

  return res.status(200).json({
    success: true,
    message: "Member removed successfully",
  });
}
