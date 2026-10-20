import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDb } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const userRecords = await db
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
      })
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    if (userRecords.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: userRecords[0] });
  } catch (error) {
    console.error("Profile GET Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { name, phone, avatarUrl } = body;

    // Only allow updating safe fields
    const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ success: false, error: "No fields provided to update" }, { status: 400 });
    }

    const updatedUser = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, user.sub))
      .returning({
        id: users.id,
        name: users.name,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json({ success: true, profile: updatedUser[0] });
  } catch (error) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
});

export const DELETE = withAuth(async (req: NextRequest, { user }) => {
  try {
    // Soft delete by setting isActive to false
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, user.sub));

    return NextResponse.json({ success: true, message: "Account deactivated successfully" });
  } catch (error) {
    console.error("Profile DELETE Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
});
