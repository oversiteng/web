import { NextRequest, NextResponse } from "next/server";
import { verifyOtp, generateOtpCode, storeOtp } from "@/lib/auth/otp";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq, ilike } from "drizzle-orm";
import { sendEmailAsync } from "@/lib/services/mailService";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ verified?: boolean; resent?: boolean }>>> {
  try {
    const body = await req.json();
    const { identifier, code, action } = body;
    const rawId = typeof identifier === "string" ? identifier.trim().toLowerCase() : "";

    if (!rawId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email address (identifier) is required",
          },
        },
        { status: 400 }
      );
    }

    const db = await getDbReady();

    // Resend OTP action
    if (action === "RESEND") {
      const [existingUser] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(ilike(users.email, rawId))
        .limit(1);

      const otpCode = generateOtpCode(6);
      await storeOtp(rawId, otpCode, 600);
      await sendEmailAsync({
        to: rawId,
        subject: "Verify Your Oversite Account",
        template: "OTP_VERIFICATION",
        payload: {
          code: otpCode,
          name: existingUser?.name || "Oversite User",
          expiresIn: "10 minutes",
        },
      });

      return NextResponse.json({
        success: true,
        data: { resent: true },
        message: "A new 6-digit verification code has been sent to your email.",
      });
    }

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "6-digit verification code is required" },
        },
        { status: 400 }
      );
    }

    const result = await verifyOtp(rawId, String(code));
    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "OTP_INVALID", message: result.reason || "Invalid code" },
        },
        { status: 400 }
      );
    }

    // Persist emailVerified: true (and kycStatus = VERIFIED for End Users)
    const [matchedUser] = await db
      .select()
      .from(users)
      .where(ilike(users.email, rawId))
      .limit(1);

    if (matchedUser) {
      const currentDocs =
        matchedUser.accreditationDocuments &&
        typeof matchedUser.accreditationDocuments === "object"
          ? { ...(matchedUser.accreditationDocuments as Record<string, any>) }
          : {};
      const nowIso = new Date().toISOString();
      currentDocs.emailVerified = true;
      currentDocs.emailVerifiedAt = nowIso;

      const nextKycStatus =
        matchedUser.role === "USER" ? "VERIFIED" : matchedUser.kycStatus;

      await db
        .update(users)
        .set({
          accreditationDocuments: currentDocs,
          kycStatus: nextKycStatus,
          updatedAt: new Date(),
        })
        .where(eq(users.id, matchedUser.id));
    }

    return NextResponse.json({
      success: true,
      data: { verified: true },
      message: "Email verified successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: (error as Error).message },
      },
      { status: 500 }
    );
  }
}
