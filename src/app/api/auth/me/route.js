import { getSession, jsonError } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return jsonError("Unauthorized", 401);
  }

  return Response.json({
    user: {
      username: session.username,
      email: session.email,
    },
  });
}
