import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

export async function proxy(request) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/schedule") || pathname.startsWith("/api/shifts");
  const isAuthPage = pathname === "/" || pathname === "/register";

  let valid = false;
  if (token && process.env.JWT_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (isProtected && !valid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthPage && valid) {
    return NextResponse.redirect(new URL("/schedule", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/register", "/schedule/:path*", "/api/shifts/:path*"],
};
