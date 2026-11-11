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
  "/admin",
];

// User-client specific pages that agents should never view
const USER_CLIENT_ROUTES = [
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
];

// Helper to check basic JWT structure and expiration without native Node crypto in edge runtime
function getValidPayload(token: string): { sub?: string; role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

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
        return null;
      }
    }

    if (!payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

function getDashboardUrlForRole(role?: string): string {
  if (role === "AGENT") return "/agent/dashboard";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "/admin/dashboard";
  return "/dashboard";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle CORS for all API routes (unblocks mobile apps & cross-origin clients)
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "*";

    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, X-API-Key, Accept, Origin, Content-Length"
      );
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Max-Age", "86400");
      return response;
    }

    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, X-API-Key, Accept, Origin, Content-Length"
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
    return response;
  }

  // Extract auth token
  const tokenCookie = request.cookies.get("token")?.value;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const token = tokenCookie || bearerToken;
  const payload = token ? getValidPayload(token) : null;

  // 2. Protect authenticated dashboard routes
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);

      const response = NextResponse.redirect(loginUrl);
      if (tokenCookie) {
        response.cookies.delete("token");
      }
      return response;
    }

    // Role-based route redirection:
    // If an AGENT opens /dashboard or client user routes, redirect them to /agent/dashboard!
    const isUserClientRoute = USER_CLIENT_ROUTES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    );
    if (payload.role === "AGENT" && isUserClientRoute) {
      return NextResponse.redirect(new URL("/agent/dashboard", request.url));
    }

    // If a regular USER tries to access /agent routes, redirect them to /dashboard
    if (
      pathname.startsWith("/agent") &&
      payload.role !== "AGENT" &&
      payload.role !== "ADMIN" &&
      payload.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // If non-admin tries to access /admin routes, redirect to their role dashboard
    if (
      pathname.startsWith("/admin") &&
      payload.role !== "ADMIN" &&
      payload.role !== "SUPER_ADMIN"
    ) {
      const target = getDashboardUrlForRole(payload.role);
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  // 3. If user is already logged in and visits /login or /register, redirect to their role-specific dashboard
  if (pathname === "/login" || pathname === "/register") {
    if (payload) {
      const target = getDashboardUrlForRole(payload.role);
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard",
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
    "/agent",
    "/agent/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
