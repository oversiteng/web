import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const foundUsers = await db
    .select()
    .from(users)
    .where(eq(users.id, user.sub))
    .limit(1);

  if (foundUsers.length === 0) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
      { status: 404 }
    );
  }

  const dbUser = foundUsers[0];

  return NextResponse.json<
    ApiResponse<{
      id: string;
      email: string;
      name: string;
      fullName: string;
      phone: string | null;
      role: string;
      kycStatus: string;
      ninVerificationStatus: string;
      avatarUrl: string | null;
      isActive: boolean;
      isDiasporaUser: boolean;
      preferredCurrency: string;
      joinedDate: string;
      createdAt: string;
      updatedAt: string;
    }>
  >({
    success: true,
    data: {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name || "User",
      fullName: dbUser.name || "User",
      phone: dbUser.phone,
      role: dbUser.role,
      kycStatus: dbUser.kycStatus,
      ninVerificationStatus: dbUser.kycStatus.toLowerCase(),
      avatarUrl: dbUser.avatarUrl || null,
      isActive: dbUser.isActive,
      // Extended fields requested by mobile spec
      isDiasporaUser: false,
      preferredCurrency: "NGN",
      joinedDate: dbUser.createdAt.toISOString(),
      createdAt: dbUser.createdAt.toISOString(),
      updatedAt: dbUser.updatedAt.toISOString(),
    },
  });
});

export const DELETE = withAuth(async (req: NextRequest, { user }) => {
  await db
    .update(users)
    .set({ isActive: false })
    .where(eq(users.id, user.sub));

  return NextResponse.json<ApiResponse<{ message: string }>>({
    success: true,
    data: { message: "Account deleted successfully" },
  });
});
