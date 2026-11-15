import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PaginatedResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users, agentProfiles } from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { formatOperativeCode } from "@/lib/services/pricing";

export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const searchParams = req.nextUrl.searchParams;
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
      const roleFilter = searchParams.get("role");
      const kycFilter = searchParams.get("kycStatus");

      const db = await getDbReady();
      const offset = (page - 1) * limit;

      const conditions = [];
      if (roleFilter && ["USER", "AGENT", "ADMIN", "SUPER_ADMIN"].includes(roleFilter)) {
        conditions.push(eq(users.role, roleFilter as any));
      }
      if (kycFilter && ["PENDING", "SUBMITTED", "VERIFIED", "REJECTED"].includes(kycFilter)) {
        conditions.push(eq(users.kycStatus, kycFilter as any));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [userList, countResult] = await Promise.all([
        db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
            phone: users.phone,
            state: users.state,
            location: users.location,
            role: users.role,
            kycStatus: users.kycStatus,
            ninVerificationStatus: users.ninVerificationStatus,
            nbaVerificationStatus: users.nbaVerificationStatus,
            addressVerificationStatus: users.addressVerificationStatus,
            isActive: users.isActive,
            createdAt: users.createdAt,
            agentTier: agentProfiles.tier,
            isAvailable: agentProfiles.isAvailable,
            rating: agentProfiles.rating,
            totalTasks: agentProfiles.totalTasks,
          })
          .from(users)
          .leftJoin(agentProfiles, eq(users.id, agentProfiles.userId))
          .where(whereClause)
          .orderBy(desc(users.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(whereClause),
      ]);

      const total = Number(countResult[0]?.count || 0);
      const totalPages = Math.ceil(total / limit) || 1;

      return NextResponse.json<PaginatedResponse<any>>({
        success: true,
        data: userList.map((u) => ({
          ...u,
          operativeCode: u.role === "AGENT" ? formatOperativeCode(u.id) : null,
          createdAt: u.createdAt.toISOString(),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        message: "Users retrieved successfully",
      });
    } catch (error) {
      console.error("Admin GET Users Error:", error);
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
