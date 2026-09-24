import { connectDB } from "../../../lib/mongoose";
import User from "../../../lib/models/User";
import { generateToken, setAuthCookie } from "../../../lib/auth";
import { withErrorHandling } from "../../../lib/middleware";

export default withErrorHandling(async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await connectDB();

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  if (!user.isActive) {
    return res.status(401).json({ error: "Account is inactive" });
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id.toString(), user.currentTeamId?.toString());
  setAuthCookie(res, token);

  res.status(200).json({
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      currentTeamId: user.currentTeamId,
    },
    token,
  });
});
