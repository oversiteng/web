import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PaginatedResponse } from "@/lib/types/api";
import { User, UserRole, KycStatus } from "@/lib/types/user";
import { getDb } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

const db = getDb();

export const GET = withAuth(
  async (req: NextRequest) => {
    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get("role") as UserRole | null;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = (page - 1) * limit;

    const conditions = [];
    if (role) {
      conditions.push(eq(users.role, role));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [dbUsers, totalCountResult] = await Promise.all([
      db
        .select({
          id: users.id,
          email: users.email,
          phone: users.phone,
          name: users.name,
          role: users.role,
          kycStatus: users.kycStatus,
          avatarUrl: users.avatarUrl,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause),
    ]);

    const total = Number(totalCountResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    const formattedUsers: User[] = dbUsers.map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      name: u.name,
      role: u.role as UserRole,
      kycStatus: u.kycStatus as KycStatus,
      avatarUrl: u.avatarUrl,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    return NextResponse.json<PaginatedResponse<User>>({
      success: true,
      data: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
