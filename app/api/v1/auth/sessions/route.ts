import { NextRequest, NextResponse } from "next/server";
import { withAuth, extractBearerToken } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { listUserSessions, revokeAllOtherSessions, ActiveSessionDto } from "@/lib/auth/sessionManager";

export const runtime = "nodejs";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const currentToken = extractBearerToken(req) || undefined;
    const sessions = await listUserSessions(user.sub, currentToken);

    return NextResponse.json({
      success: true,
      data: sessions,
      message: `Active sessions retrieved. User device limit: 2 maximum concurrent sessions.`,
    });
  } catch (error) {
    console.error("List sessions error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to list active sessions" } },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (req: NextRequest, { user }) => {
  try {
    const currentToken = extractBearerToken(req);
    if (!currentToken) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Valid session token required" } },
        { status: 401 }
      );
    }

    const count = await revokeAllOtherSessions(user.sub, currentToken);

    return NextResponse.json({
      success: true,
      data: { revokedCount: count },
      message: `${count} other session(s) terminated successfully.`,
    });
  } catch (error) {
    console.error("Revoke all sessions error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to terminate other sessions" } },
      { status: 500 }
    );
  }
});
