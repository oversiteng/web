import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id: targetUserId } = await params;
      const db = await getDbReady();

      const [suspendedUser] = await db
        .update(users)
        .set({
          isActive: false,
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

      if (!suspendedUser) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
          { status: 404 }
        );
      }

      return NextResponse.json<ApiResponse<{ id: string; email: string; isActive: boolean }>>({
        success: true,
        data: {
          id: suspendedUser.id,
          email: suspendedUser.email,
          isActive: suspendedUser.isActive,
        },
        message: `Account for ${suspendedUser.email} has been suspended`,
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
