import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Utility to mock admin authorization check
function isAdmin(request: Request) {
  const role = request.headers.get("x-user-role");
  return role === "ADMIN" || true; // Bypass for development
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdmin(request)) return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });

    const { id: targetUserId } = await params;
    const db = getDb();
    
    // Manually force the KYC status to VERIFIED
    const verifiedUser = await db.update(users)
      .set({ 
        kycStatus: "VERIFIED", 
        updatedAt: new Date() 
      })
      .where(eq(users.id, targetUserId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        kycStatus: users.kycStatus,
      });

    if (verifiedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Account for ${verifiedUser[0].email} has been manually verified by Admin`,
      user: verifiedUser[0] 
    });

  } catch (error) {
    console.error("Admin Manual Verify Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
