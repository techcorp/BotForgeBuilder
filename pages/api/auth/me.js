import { connectDB } from "../../../lib/mongoose";
import { withAuth, withErrorHandling } from "../../../lib/middleware";
import Team from "../../../lib/models/Team";

export default withErrorHandling(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await connectDB();
  await withAuth(req, res, () => {});

  if (!req.user) return;

  const team = req.teamId ? await Team.findById(req.teamId) : null;

  res.status(200).json({
    user: {
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      currentTeamId: req.user.currentTeamId,
      lastLogin: req.user.lastLogin,
    },
    team: team ? {
      id: team._id,
      name: team.name,
      plan: team.plan,
      botsLimit: team.botsLimit,
    } : null,
  });
});
