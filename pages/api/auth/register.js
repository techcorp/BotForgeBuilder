import { connectDB } from "../../../lib/mongoose";
import User from "../../../lib/models/User";
import Team from "../../../lib/models/Team";
import { generateToken, setAuthCookie } from "../../../lib/auth";
import { withErrorHandling } from "../../../lib/middleware";

export default withErrorHandling(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await connectDB();

  const { email, password, firstName, lastName, companyName } = req.body;

  if (!email || !password || !firstName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const user = new User({
    email,
    password,
    firstName,
    lastName,
  });

  await user.save();

  let team;
  if (companyName) {
    team = new Team({
      name: companyName,
      ownerId: user._id,
      members: [{ userId: user._id, role: "admin" }],
    });
    await team.save();
    user.currentTeamId = team._id;
    await user.save();
  }

  const token = generateToken(user._id.toString(), team?._id.toString());
  setAuthCookie(res, token);

  res.status(201).json({
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    team: team ? {
      id: team._id,
      name: team.name,
    } : null,
    token,
  });
});
