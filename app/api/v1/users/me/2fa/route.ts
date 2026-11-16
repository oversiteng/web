import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const rows = await db
      .select({
        role: users.role,
        twoFactorEnabled: users.twoFactorEnabled,
      })
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    const isMandatory = rows[0].role === "ADMIN" || rows[0].role === "SUPER_ADMIN";
    const twoFactorEnabled = Boolean(rows[0].twoFactorEnabled);

    return NextResponse.json({
      success: true,
      data: {
        twoFactorEnabled,
        isMandatory,
        role: rows[0].role,
      },
    });
  } catch (error) {
    console.error("Fetch 2FA status error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch 2FA status" } },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEnabled = typeof body.enabled === "boolean" ? body.enabled : body.enable;
    const enabled = Boolean(rawEnabled);

    if (rawEnabled === undefined) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "'enabled' boolean is required" } },
        { status: 400 }
      );
    }

    const db = await getDbReady();
    const rows = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    const isMandatory = rows[0].role === "ADMIN" || rows[0].role === "SUPER_ADMIN";
    if (isMandatory && !enabled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Two-Factor Authentication is strictly mandatory for administrative accounts and cannot be disabled.",
          },
        },
        { status: 403 }
      );
    }

    await db
      .update(users)
      .set({
        twoFactorEnabled: enabled,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.sub));

    return NextResponse.json({
      success: true,
      data: {
        twoFactorEnabled: enabled,
        isMandatory,
      },
      message: `Two-Factor Authentication has been ${enabled ? "enabled" : "disabled"}.`,
    });
  } catch (error) {
    console.error("Update 2FA status error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update 2FA status" } },
      { status: 500 }
    );
  }
});
