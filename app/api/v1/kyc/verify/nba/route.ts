import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { users, agentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

// Utility to get user ID from headers (Mock Auth for now)
function getUserId(request: Request) {
  return request.headers.get("x-user-id") || "0e477711-b37c-498e-9072-0bca7d8d250d";
}

export async function POST(request: Request) {
  try {
    const userId = getUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { nbaNumber } = body;

    if (!nbaNumber) {
      return NextResponse.json({ error: "NBA (Call-to-Bar) Number is required" }, { status: 400 });
    }

    // 1. Simulate 3rd-party API delay (Connecting to NBA Supreme Court Roll)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Simulate validation logic
    if (nbaNumber.startsWith("FAKE")) {
      return NextResponse.json({ 
        success: false, 
        message: "NBA Validation Failed. No record found in the Supreme Court registry." 
      }, { status: 422 });
    }

    const db = getDb();
    
    // 3. Upsert into agentProfiles table
    const existingAgent = await db.select().from(agentProfiles).where(eq(agentProfiles.userId, userId)).limit(1);
    
    if (existingAgent.length > 0) {
      await db.update(agentProfiles)
        .set({ nbaNumber, tier: "LEGAL_COUNSEL" })
        .where(eq(agentProfiles.userId, userId));
    } else {
      await db.insert(agentProfiles).values({
        userId,
        nbaNumber,
        tier: "LEGAL_COUNSEL",
      });
    }

    // 4. Update User KYC Status & promote to AGENT role if they aren't one
    const updatedUser = await db.update(users)
      .set({ 
        kycStatus: "VERIFIED", 
        role: "AGENT",
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        kycStatus: users.kycStatus,
        role: users.role,
        updatedAt: users.updatedAt
      });

    return NextResponse.json({ 
      success: true, 
      message: "NBA Credentials successfully verified. Promoted to Legal Counsel.",
      profile: updatedUser[0] 
    });

  } catch (error) {
    console.error("KYC NBA Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
