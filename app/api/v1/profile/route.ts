import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Utility to get user ID from headers (Mock Auth for now)
function getUserId(request: Request) {
  // Using a fallback UUID from our database seed
  return request.headers.get("x-user-id") || "0e477711-b37c-498e-9072-0bca7d8d250d";
}

export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const userRecords = await db.select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      name: users.name,
      role: users.role,
      kycStatus: users.kycStatus,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (userRecords.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: userRecords[0] });
  } catch (error) {
    console.error("Profile GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, phone, avatarUrl } = body;

    const db = getDb();
    
    // Only allow updating safe fields
    const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

    // Check if only updatedAt is present
    if (Object.keys(updates).length === 1) {
       return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    const updatedUser = await db.update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        name: users.name,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        updatedAt: users.updatedAt
      });

    return NextResponse.json({ success: true, profile: updatedUser[0] });
  } catch (error) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    
    // Soft delete by setting isActive to false
    await db.update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true, message: "Account deactivated successfully" });
  } catch (error) {
    console.error("Profile DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
