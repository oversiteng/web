import { NextRequest, NextResponse } from "next/server";
import { withAuth, extractBearerToken } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { listUserSessions, revokeAllOtherSessions, createSession, ActiveSessionDto } from "@/lib/auth/sessionManager";

export const runtime = "nodejs";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const currentToken = extractBearerToken(req) || undefined;
    let sessions = await listUserSessions(user.sub, currentToken);

    // If no active sessions exist yet or none match current device token (e.g. user was logged in before session tracking was created),
    // automatically register this active device session on-the-fly.
    const hasCurrent = sessions.some((s) => s.isCurrent);
    if ((sessions.length === 0 || !hasCurrent) && currentToken) {
      await createSession({
        userId: user.sub,
        req,
        token: currentToken,
        userEmail: user.email,
        userName: user.name,
      });
      sessions = await listUserSessions(user.sub, currentToken);
    }

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
