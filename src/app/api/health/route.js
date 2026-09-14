export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    mongoConfigured: Boolean(process.env.MONGODB_URI),
    jwtConfigured: Boolean(process.env.JWT_SECRET),
  });
}
