import { verifyToken, getTokenFromRequest, getTokenFromCookies } from "./auth";
import User from "./models/User";
import Team from "./models/Team";

export async function withAuth(req, res, next) {
  try {
    const token = getTokenFromRequest(req) || getTokenFromCookies(req);
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Unauthorized: User not found" });
    }

    req.user = user;
    req.teamId = decoded.teamId || user.currentTeamId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Token verification failed" });
  }
}

export async function withTeamAuth(req, res, next) {
  try {
    await withAuth(req, res, () => {});
    if (!req.user) return;

    const team = await Team.findById(req.teamId);
    if (!team) {
      return res.status(403).json({ error: "Forbidden: Team not found" });
    }

    const member = team.members.find(m => m.userId.toString() === req.user._id.toString());
    if (!member) {
      return res.status(403).json({ error: "Forbidden: Not a team member" });
    }

    req.team = team;
    req.memberRole = member.role;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Forbidden: Team verification failed" });
  }
}

export function checkRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.memberRole)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
}

export async function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error("API Error:", err);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  };
}
