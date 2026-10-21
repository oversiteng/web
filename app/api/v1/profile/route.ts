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
        title: users.title,
        address: users.address,
        location: users.location,
        occupation: users.occupation,
        state: users.state,
        country: users.country,
        residence: users.residence,
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
    const {
      name,
      phone,
      title,
      address,
      location,
      occupation,
      state,
      country,
      residence,
      avatarUrl,
    } = body;

    // Only allow updating safe profile fields
    const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (title !== undefined) updates.title = title;
    if (address !== undefined) updates.address = address;
    if (location !== undefined) updates.location = location;
    if (occupation !== undefined) updates.occupation = occupation;
    if (state !== undefined) updates.state = state;
    if (country !== undefined) updates.country = country;
    if (residence !== undefined) updates.residence = residence;
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
        email: users.email,
        phone: users.phone,
        title: users.title,
        address: users.address,
        location: users.location,
        occupation: users.occupation,
        state: users.state,
        country: users.country,
        residence: users.residence,
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
