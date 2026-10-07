import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { users, agentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

// Utility to mock admin authorization check
function isAdmin(request: Request) {
  const role = request.headers.get("x-user-role");
  return role === "ADMIN" || true; // Bypass for development
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });

    const { id: targetUserId } = await params;
    const db = getDb();
    
    // Fetch the core user profile
    const userRecords = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      kycStatus: users.kycStatus,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, targetUserId)).limit(1);

    if (userRecords.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userProfile = userRecords[0];

    // If they are an agent, attach their agent profile data
    if (userProfile.role === "AGENT") {
      const agentRecords = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, targetUserId)).limit(1);
      if (agentRecords.length > 0) {
        Object.assign(userProfile, { agentProfile: agentRecords[0] });
      }
    }

    return NextResponse.json({ 
      success: true, 
      user: userProfile 
    });

  } catch (error) {
    console.error("Admin Get User Deep-Dive Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
