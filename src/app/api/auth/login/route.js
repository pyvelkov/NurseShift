import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { jsonError, setAuthCookie, signToken } from "@/lib/auth";
import User from "@/models/User";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || !password) {
      return jsonError("Username and password are required.");
    }

    await connectDB();
    const user = await User.findOne({ username });
    if (!user) {
      return jsonError("Invalid username or password.", 401);
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return jsonError("Invalid username or password.", 401);
    }

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
    console.error(error);
    return jsonError("Could not sign in.", 500);
  }
}
