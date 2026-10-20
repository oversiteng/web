import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected route path prefixes that require authentication
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/properties",
  "/projects",
  "/errands",
  "/legal",
  "/diligence",
  "/property-oversite",
  "/vault",
  "/enforcement",
  "/vulnerability",
  "/chat",
  "/notifications",
  "/more",
  "/agent",
];

// Helper to check basic JWT structure and expiration without native Node crypto in edge runtime
function isTokenValid(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Decode base64url payload
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const jsonStr = atob(base64);
    const payload = JSON.parse(jsonStr);

    // Check expiration
    if (payload.exp && typeof payload.exp === "number") {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        return false;
      }
    }

    return !!payload.sub;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    const tokenCookie = request.cookies.get("token")?.value;
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const token = tokenCookie || bearerToken;

    if (!token || !isTokenValid(token)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      
      const response = NextResponse.redirect(loginUrl);
      // Clean invalid token cookie if present
      if (tokenCookie) {
        response.cookies.delete("token");
      }
      return response;
    }
  }

  // If user is already logged in and visits /login or /register, redirect to /dashboard
  if (pathname === "/login" || pathname === "/register") {
    const tokenCookie = request.cookies.get("token")?.value;
    if (tokenCookie && isTokenValid(tokenCookie)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/properties/:path*",
    "/projects/:path*",
    "/errands/:path*",
    "/legal/:path*",
    "/diligence/:path*",
    "/property-oversite/:path*",
    "/vault/:path*",
    "/enforcement/:path*",
    "/vulnerability/:path*",
    "/chat/:path*",
    "/notifications/:path*",
    "/more/:path*",
    "/agent/:path*",
    "/login",
    "/register",
  ],
};
