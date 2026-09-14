import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { jsonError, setAuthCookie, signToken } from "@/lib/auth";
import User from "@/models/User";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!USERNAME_RE.test(username)) {
      return jsonError("Username must be 3–32 letters, numbers, or underscores.");
    }
    if (!EMAIL_RE.test(email)) {
      return jsonError("Please enter a valid email address.");
    }
    if (password.length < 6) {
      return jsonError("Password must be at least 6 characters.");
    }

    await connectDB();

    const existing = await User.findOne({
      $or: [{ username: username.toLowerCase() }, { email }],
    });
    if (existing) {
      const taken =
        existing.username === username.toLowerCase()
          ? "That username is already taken."
          : "That email is already registered.";
      return jsonError(taken, 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      passwordHash,
    });

    const token = await signToken({
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
    });
    await setAuthCookie(token);

    return Response.json({
      user: {
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return jsonError("Username or email is already in use.", 409);
    }
    console.error(error);
    return jsonError("Could not create the account.", 500);
  }
}
