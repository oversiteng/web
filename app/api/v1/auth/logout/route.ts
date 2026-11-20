import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types/api";
import { extractBearerToken } from "@/lib/auth/middleware";
import { revokeSessionByToken } from "@/lib/auth/sessionManager";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ loggedOut: boolean }>>> {
  const token = extractBearerToken(req);
  if (token) {
    await revokeSessionByToken(token);
  }

  const response = NextResponse.json<ApiResponse<{ loggedOut: boolean }>>({
    success: true,
    data: { loggedOut: true },
    message: "Logged out successfully",
  });

  // Clear HTTP cookie
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
