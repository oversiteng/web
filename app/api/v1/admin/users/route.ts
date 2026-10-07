import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { users } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

// Utility to mock admin authorization check
function isAdmin(request: Request) {
  const role = request.headers.get("x-user-role");
  return role === "ADMIN" || true; // Bypass for development
}

export async function GET(request: Request) {
  try {
    if (!isAdmin(request)) return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const role = searchParams.get("role");

    const db = getDb();
    
    // Basic dynamic query builder
    let query = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      kycStatus: users.kycStatus,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
    .offset(offset);

    // Filter by role if provided
    if (role) {
      query = db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        kycStatus: users.kycStatus,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(sql`${users.role} = ${role}`)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset) as any;
    }

    const userList = await query;

    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalCount = countResult[0].count;

    return NextResponse.json({ 
      success: true, 
      data: userList,
      pagination: {
        total: totalCount,
        limit,
        offset
      }
    });

  } catch (error) {
    console.error("Admin GET Users Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
