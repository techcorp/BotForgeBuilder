import { clearAuthCookie } from "../../../lib/auth";

export default (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  clearAuthCookie(res);
  res.status(200).json({ message: "Logged out successfully" });
};
