import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id: targetUserId } = await params;
      const body = await req.json().catch(() => ({}));
      const db = await getDbReady();

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
          { status: 404 }
        );
      }

      // Toggle isActive unless explicitly provided in body
      const nextIsActive =
        typeof body.isActive === "boolean" ? body.isActive : !existing[0].isActive;

      const [updatedUser] = await db
        .update(users)
        .set({
          isActive: nextIsActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetUserId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          isActive: users.isActive,
          updatedAt: users.updatedAt,
        });

      await db.insert(notifications).values({
        userId: targetUserId,
        type: nextIsActive ? "SYSTEM" : "ALERT",
        title: nextIsActive ? "Account Reinstated" : "Account Suspended",
        body: nextIsActive
          ? "Your Oversite account access has been restored by Central Operations."
          : `Your account has been suspended by Central Operations. ${body.reason ? `Reason: ${body.reason}` : ""}`,
      });

      return NextResponse.json<ApiResponse<{ id: string; email: string; isActive: boolean }>>({
        success: true,
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          isActive: updatedUser.isActive,
        },
        message: nextIsActive
          ? `Account for ${updatedUser.email} has been reinstated`
          : `Account for ${updatedUser.email} has been suspended`,
      });
    } catch (error) {
      console.error("Admin Suspend User Error:", error);
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
