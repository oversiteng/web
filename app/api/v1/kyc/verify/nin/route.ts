import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { users } from "@/db/schema";
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
    const { ninNumber } = body;

    if (!ninNumber || ninNumber.length < 11) {
      return NextResponse.json({ error: "Valid 11-digit NIN is required" }, { status: 400 });
    }

    // 1. Simulate 3rd-party API delay (e.g. connecting to Dojah, Smile Identity, or VerifyMe)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // 2. Simulate validation logic
    // For development, any NIN starting with '99' fails verification, everything else passes.
    if (ninNumber.startsWith("99")) {
      return NextResponse.json({ 
        success: false, 
        message: "NIN Validation Failed. The provided identity could not be verified." 
      }, { status: 422 });
    }

    // 3. Update User KYC Status
    const db = getDb();
    const updatedUser = await db.update(users)
      .set({ 
        kycStatus: "VERIFIED", 
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        kycStatus: users.kycStatus,
        updatedAt: users.updatedAt
      });

    return NextResponse.json({ 
      success: true, 
      message: "NIN successfully verified",
      profile: updatedUser[0] 
    });

  } catch (error) {
    console.error("KYC NIN Verification Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
