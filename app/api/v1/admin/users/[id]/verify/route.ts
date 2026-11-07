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

      const [verifiedUser] = await db
        .update(users)
        .set({
          kycStatus: "VERIFIED",
          ninVerificationStatus: "verified",
          updatedAt: new Date(),
        })
        .where(eq(users.id, targetUserId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          kycStatus: users.kycStatus,
          ninVerificationStatus: users.ninVerificationStatus,
          updatedAt: users.updatedAt,
        });

      if (!verifiedUser) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
          { status: 404 }
        );
      }

      return NextResponse.json<ApiResponse<{
        id: string;
        email: string;
        kycStatus: string;
        ninVerificationStatus: string;
      }>>({
        success: true,
        data: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          kycStatus: verifiedUser.kycStatus,
          ninVerificationStatus: verifiedUser.ninVerificationStatus,
        },
        message: `Account for ${verifiedUser.email} has been manually verified by Admin`,
      });
    } catch (error) {
      console.error("Admin Manual Verify Error:", error);
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
