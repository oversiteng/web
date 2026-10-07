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

    // Await params since Next.js treats params as a Promise in App Router dynamic routes
    const { id: targetUserId } = await params;

    const db = getDb();
    
    // Suspend the user by setting isActive to false
    const suspendedUser = await db.update(users)
      .set({ 
        isActive: false, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, targetUserId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
      });

    if (suspendedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // (In the future, trigger SES email worker here: "Your account has been suspended")
    
    return NextResponse.json({ 
      success: true, 
      message: `Account for ${suspendedUser[0].email} has been suspended`,
      user: suspendedUser[0] 
    });

  } catch (error) {
    console.error("Admin Suspend User Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
