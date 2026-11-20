import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "./jwt";
import { UserRole } from "@/lib/types/user";
import { validateSession } from "./sessionManager";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { extractAdminPolicy } from "./adminPermissions";

export interface AuthenticatedContext<TParams = Record<string, string>> {
  user: JwtPayload;
  params: TParams;
}

export type AuthenticatedHandler<TParams = Record<string, string>> = (
  req: NextRequest,
  ctx: AuthenticatedContext<TParams>
) => Promise<Response> | Response;

export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }

  // Also check cookie if header is not present
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const authCookie = cookies.find((c) => c.startsWith("token="));
    if (authCookie) {
      return decodeURIComponent(authCookie.substring(6));
    }
  }

  return null;
}

export function getAuthUser(request: Request): JwtPayload | null {
  const token = extractBearerToken(request);
  if (!token) return null;
  return verifyToken<JwtPayload>(token);
}

export function withAuth<TParams = Record<string, string>>(
  handler: AuthenticatedHandler<TParams>,
  options: { roles?: UserRole[] } = {}
) {
  return async (
    req: NextRequest,
    context: { params?: Promise<TParams> | TParams }
  ): Promise<Response> => {
    const token = extractBearerToken(req);
    const user = token ? verifyToken<JwtPayload>(token) : null;

    if (!token || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing or invalid authorization token",
          },
        },
        { status: 401 }
      );
    }

    // Verify session has not been revoked
    const isSessionValid = await validateSession(token);
    if (!isSessionValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Session has been revoked or expired. Please sign in again.",
          },
        },
        { status: 401 }
      );
    }

    // Verify account is still active and enforce AdminPolicy on /api/v1/admin/*
    const db = await getDbReady();
    const [dbUser] = await db
      .select({
        id: users.id,
        role: users.role,
        isActive: users.isActive,
        accreditationDocuments: users.accreditationDocuments,
      })
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    if (!dbUser || dbUser.isActive === false) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Account is deactivated or no longer exists.",
          },
        },
        { status: 403 }
      );
    }

    if (options.roles && options.roles.length > 0) {
      const hasRole =
        options.roles.includes(user.role) ||
        (user.role === "SUPER_ADMIN" && options.roles.includes("ADMIN"));

      if (!hasRole) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Insufficient permissions for this resource",
            },
          },
          { status: 403 }
        );
      }
    }

    // Enforce AdminPolicy on /api/v1/admin/* endpoints (except onboarding password setup)
    const pathname = req.nextUrl?.pathname || "";
    if (
      pathname.startsWith("/api/v1/admin/") &&
      pathname !== "/api/v1/admin/auth/setup-password" &&
      dbUser.role !== "SUPER_ADMIN"
    ) {
      const policy = extractAdminPolicy(dbUser);
      if (policy.onboardingStatus !== "APPROVED" || policy.mustChangePassword) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Admin onboarding approval and password setup are required.",
            },
          },
          { status: 403 }
        );
      }

      const method = req.method.toUpperCase();
      if (method === "GET" && !policy.canRead) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "Admin read permission denied." },
          },
          { status: 403 }
        );
      }
      if ((method === "POST" || method === "PUT" || method === "PATCH") && !policy.canWrite) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "Admin write permission denied." },
          },
          { status: 403 }
        );
      }
      if (method === "DELETE" && !policy.canDelete) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "Admin delete permission denied." },
          },
          { status: 403 }
        );
      }
    }

    const resolvedParams = context?.params
      ? await Promise.resolve(context.params)
      : ({} as TParams);

    return handler(req, { user, params: resolvedParams });
  };
}
