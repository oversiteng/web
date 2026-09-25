import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "./jwt";
import { UserRole } from "@/lib/types/user";

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
    const user = getAuthUser(req);

    if (!user) {
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

    if (options.roles && options.roles.length > 0) {
      if (!options.roles.includes(user.role)) {
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

    const resolvedParams = context?.params
      ? await Promise.resolve(context.params)
      : ({} as TParams);

    return handler(req, { user, params: resolvedParams });
  };
}
