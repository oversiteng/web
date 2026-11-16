import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { userNotificationPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export const GET = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const rows = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, user.sub))
      .limit(1);

    if (rows.length === 0) {
      // Default preferences
      return NextResponse.json({
        success: true,
        data: {
          emailTaskUpdates: true,
          emailSecurityAlerts: true,
          emailBillingReceipts: true,
          emailMarketing: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        emailTaskUpdates: rows[0].emailTaskUpdates,
        emailSecurityAlerts: rows[0].emailSecurityAlerts,
        emailBillingReceipts: rows[0].emailBillingReceipts,
        emailMarketing: rows[0].emailMarketing,
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch notification preferences" } },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      emailTaskUpdates,
      emailSecurityAlerts,
      emailBillingReceipts,
      emailMarketing,
    } = body;

    const db = await getDbReady();
    const existing = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, user.sub))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(userNotificationPreferences).values({
        userId: user.sub,
        emailTaskUpdates: emailTaskUpdates ?? true,
        emailSecurityAlerts: emailSecurityAlerts ?? true,
        emailBillingReceipts: emailBillingReceipts ?? true,
        emailMarketing: emailMarketing ?? false,
      });
    } else {
      await db
        .update(userNotificationPreferences)
        .set({
          ...(typeof emailTaskUpdates === "boolean" && { emailTaskUpdates }),
          ...(typeof emailSecurityAlerts === "boolean" && { emailSecurityAlerts }),
          ...(typeof emailBillingReceipts === "boolean" && { emailBillingReceipts }),
          ...(typeof emailMarketing === "boolean" && { emailMarketing }),
          updatedAt: new Date(),
        })
        .where(eq(userNotificationPreferences.userId, user.sub));
    }

    return NextResponse.json({
      success: true,
      message: "Notification preferences updated successfully",
    });
  } catch (error) {
    console.error("Update notifications error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to update notification preferences" } },
      { status: 500 }
    );
  }
});
