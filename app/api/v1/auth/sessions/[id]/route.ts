import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { revokeSession } from "@/lib/auth/sessionManager";

export const runtime = "nodejs";

export const DELETE = withAuth(async (_req: NextRequest, { user, params }) => {
  try {
    const resolvedParams = await Promise.resolve(params);
    const sessionId = resolvedParams.id;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Session ID is required" } },
        { status: 400 }
      );
    }

    const revoked = await revokeSession(sessionId, user.sub);
    if (!revoked) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Session not found or already terminated" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Session successfully terminated.",
    });
  } catch (error) {
    console.error("Revoke session error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to terminate session" } },
      { status: 500 }
    );
  }
});

