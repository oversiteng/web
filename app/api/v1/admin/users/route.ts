import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PaginatedResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const searchParams = req.nextUrl.searchParams;
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
      const roleFilter = searchParams.get("role");

      const db = await getDbReady();
      const offset = (page - 1) * limit;

      let query = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          kycStatus: users.kycStatus,
          ninVerificationStatus: users.ninVerificationStatus,
          nbaVerificationStatus: users.nbaVerificationStatus,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users);

      let countQuery = db.select({ count: sql<number>`count(*)` }).from(users);

      if (roleFilter && ["USER", "AGENT", "ADMIN", "SUPER_ADMIN"].includes(roleFilter)) {
        // @ts-expect-error drizzle enum filter
        query = query.where(eq(users.role, roleFilter));
        // @ts-expect-error drizzle enum filter
        countQuery = countQuery.where(eq(users.role, roleFilter));
      }

      const [userList, countResult] = await Promise.all([
        query.orderBy(desc(users.createdAt)).limit(limit).offset(offset),
        countQuery,
      ]);

      const total = Number(countResult[0]?.count || 0);
      const totalPages = Math.ceil(total / limit) || 1;

      return NextResponse.json<PaginatedResponse<any>>({
        success: true,
        data: userList.map((u) => ({
          ...u,
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
