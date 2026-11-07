import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users, agentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id: targetUserId } = await params;
      const db = await getDbReady();

      const userRecords = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          title: users.title,
          address: users.address,
          location: users.location,
          occupation: users.occupation,
          state: users.state,
          country: users.country,
          role: users.role,
          kycStatus: users.kycStatus,
          ninVerificationStatus: users.ninVerificationStatus,
          nbaVerificationStatus: users.nbaVerificationStatus,
          avatarUrl: users.avatarUrl,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (userRecords.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
          { status: 404 }
        );
      }

      const userProfile: any = {
        ...userRecords[0],
        createdAt: userRecords[0].createdAt.toISOString(),
        updatedAt: userRecords[0].updatedAt.toISOString(),
      };

      if (userProfile.role === "AGENT") {
        const agentRecords = await db
          .select()
          .from(agentProfiles)
          .where(eq(agentProfiles.userId, targetUserId))
          .limit(1);

        if (agentRecords.length > 0) {
          userProfile.agentProfile = {
            ...agentRecords[0],
            createdAt: agentRecords[0].createdAt.toISOString(),
            updatedAt: agentRecords[0].updatedAt.toISOString(),
          };
        }
      }

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: userProfile,
        message: "User details retrieved successfully",
      });
    } catch (error) {
      console.error("Admin Get User Error:", error);
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
