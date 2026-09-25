import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { User } from "@/lib/types/user";

import { getDb } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const foundUsers = await db.select().from(users).where(eq(users.id, user.sub)).limit(1);

  if (foundUsers.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }

  const dbUser = foundUsers[0];

  return NextResponse.json<ApiResponse<Partial<User>>>({
    success: true,
    data: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || "User",
      phone: dbUser.phone,
      role: dbUser.role,
      kycStatus: dbUser.kycStatus,
      isActive: dbUser.isActive,
    },
  });
});
