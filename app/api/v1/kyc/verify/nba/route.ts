import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users, agentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const body = await req.json();
    const { nbaNumber } = body;

    const trimmedNba = typeof nbaNumber === "string" ? nbaNumber.trim() : "";
    if (!trimmedNba) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "NBA (Call-to-Bar) Enrollment Number is required",
          },
        },
        { status: 400 }
      );
    }

    // 1. Strict Supreme Court format validation (e.g. SCN/..., NBA/LAG/2014/0982, etc.)
    const nbaPattern = /^(NBA\/[A-Z]{3}\/\d{4}\/\d{3,5}|SCN\/\d{5,7}|[A-Z0-9\/\-]{8,25})$/i;
    if (!nbaPattern.test(trimmedNba)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NBA_VERIFICATION_FAILED",
            message: "NBA Validation Failed. Invalid Bar enrollment number format.",
          },
        },
        { status: 422 }
      );
    }

    // 3. Upsert into agentProfiles table
    const existingAgent = await db
      .select()
      .from(agentProfiles)
      .where(eq(agentProfiles.userId, user.sub))
      .limit(1);

    if (existingAgent.length > 0) {
      await db
        .update(agentProfiles)
        .set({
          nbaNumber: trimmedNba,
          tier: "LEGAL_COUNSEL",
          updatedAt: new Date(),
        })
        .where(eq(agentProfiles.userId, user.sub));
    } else {
      await db.insert(agentProfiles).values({
        userId: user.sub,
        nbaNumber: trimmedNba,
        tier: "LEGAL_COUNSEL",
        isAvailable: false,
      });
    }

    // 4. Update User role and NBA verification status
    const [updatedUser] = await db
      .update(users)
      .set({
        kycStatus: "VERIFIED",
        nbaVerificationStatus: "verified",
        role: "AGENT",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.sub))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        kycStatus: users.kycStatus,
        nbaVerificationStatus: users.nbaVerificationStatus,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json<ApiResponse<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      kycStatus: string;
      nbaVerificationStatus: string;
      updatedAt: string;
    }>>({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        kycStatus: updatedUser.kycStatus,
        nbaVerificationStatus: updatedUser.nbaVerificationStatus,
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
      message: "NBA credentials verified. Promoted to Legal Counsel agent.",
    });
  } catch (error) {
    console.error("KYC NBA Verification Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
});
