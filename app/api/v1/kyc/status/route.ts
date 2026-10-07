import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Utility to get user ID from headers (Mock Auth for now)
function getUserId(request: Request) {
  return request.headers.get("x-user-id") || "0e477711-b37c-498e-9072-0bca7d8d250d";
}

export async function GET(request: Request) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getDb();
    const userRecords = await db.select({
      kycStatus: users.kycStatus,
    }).from(users).where(eq(users.id, userId)).limit(1);

    if (userRecords.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      kycStatus: userRecords[0].kycStatus 
    });
  } catch (error) {
    console.error("KYC Status GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
