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
  "/messages",
  "/notifications",
  "/more",
  "/billing",
  "/payments",
  "/documents",
  "/settings",
  "/security",
  "/support",
  "/about",
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

const JWT_SECRET =
  process.env.JWT_SECRET || "oversite-super-secure-dev-secret-key-32-chars-min";

function base64UrlToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Verify HMAC-SHA256 JWT signature and expiration using Web Crypto (Edge-compatible)
async function getValidPayload(
  token: string
): Promise<{ sub?: string; role?: string; exp?: number } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const dataToVerify = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const secretBytes = new TextEncoder().encode(JWT_SECRET);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      secretBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBytes = base64UrlToUint8Array(signatureB64);
    const isValidSignature = await crypto.subtle.verify(
      "HMAC",
      cryptoKey,
      signatureBytes,
      dataToVerify
    );

    if (!isValidSignature) return null;

    // Decode base64url payload
    let base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle CORS for all API routes (unblocks mobile apps & cross-origin clients)
  if (pathname.startsWith("/api/")) {
    const requestOrigin = request.headers.get("origin");
    const allowOrigin = requestOrigin || "*";

    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });
      response.headers.set("Access-Control-Allow-Origin", allowOrigin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-API-Key, X-Requested-With, Accept, Origin, Content-Length"
      );
      if (requestOrigin) {
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("Vary", "Origin");
      }
      response.headers.set("Access-Control-Max-Age", "86400");
      return response;
    }

    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", allowOrigin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-API-Key, X-Requested-With, Accept, Origin, Content-Length"
    );
    if (requestOrigin) {
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Vary", "Origin");
    }
    return response;
  }

  // Extract auth token
  const tokenCookie = request.cookies.get("token")?.value;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const token = tokenCookie || bearerToken;
  const payload = token ? await getValidPayload(token) : null;

  // Allow public access to /admin/login for staff authentication & onboarding
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // 2. Protect authenticated dashboard routes
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    if (!payload) {
      const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
      const loginUrl = new URL(isAdminPath ? "/admin/login" : "/login", request.url);
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
    "/messages",
    "/messages/:path*",
    "/notifications/:path*",
    "/more/:path*",
    "/billing",
    "/billing/:path*",
    "/payments",
    "/payments/:path*",
    "/documents",
    "/documents/:path*",
    "/settings",
    "/settings/:path*",
    "/security",
    "/security/:path*",
    "/support",
    "/support/:path*",
    "/about",
    "/about/:path*",
    "/agent",
    "/agent/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
