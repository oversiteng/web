import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const body = await req.json();
    const { ninNumber } = body;

    const trimmedNin = typeof ninNumber === "string" ? ninNumber.trim() : "";
    if (!trimmedNin || trimmedNin.length < 11 || !/^\d{11}$/.test(trimmedNin)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "A valid 11-digit NIN is required",
          },
        },
        { status: 400 }
      );
    }

    // 1. Simulate 3rd-party API delay (e.g. connecting to Dojah, Smile Identity, or VerifyMe)
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 2. Mock verification rules for dev: any NIN starting with '99' fails verification
    if (trimmedNin.startsWith("99")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "KYC_VERIFICATION_FAILED",
            message: "NIN Validation Failed. The provided identity could not be verified.",
          },
        },
        { status: 422 }
      );
    }

    // 3. Update User KYC Status
    const [updatedUser] = await db
      .update(users)
      .set({
        kycStatus: "VERIFIED",
        ninVerificationStatus: "verified",
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.sub))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        kycStatus: users.kycStatus,
        ninVerificationStatus: users.ninVerificationStatus,
        updatedAt: users.updatedAt,
      });

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{
      id: string;
      email: string;
      name: string | null;
      kycStatus: string;
      ninVerificationStatus: string;
      updatedAt: string;
    }>>({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        kycStatus: updatedUser.kycStatus,
        ninVerificationStatus: updatedUser.ninVerificationStatus,
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
      message: "NIN successfully verified",
    });
  } catch (error) {
    console.error("KYC NIN Verification Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
});
