import { NextRequest, NextResponse } from "next/server";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateOtpCode, storeOtp } from "@/lib/auth/otp";
import { ApiResponse } from "@/lib/types/api";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ email: string; expiresIn: number; previewCode?: string }>>> {
  try {
    const body = await req.json();
    const email = body?.email ? String(body.email).trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "A valid email address is required",
          },
        },
        { status: 400 }
      );
    }

    const db = await getDbReady();
    const foundUsers = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "No registered account found with this email address",
          },
        },
        { status: 404 }
      );
    }

    const otpCode = generateOtpCode(6);
    await storeOtp(email, otpCode, 600); // 10 minutes

    console.log(`[AUTH] Password reset OTP for ${email}: ${otpCode}`);

    return NextResponse.json<
      ApiResponse<{ email: string; expiresIn: number; previewCode?: string }>
    >({
      success: true,
      data: {
        email,
        expiresIn: 600,
        previewCode: process.env.NODE_ENV !== "production" ? otpCode : undefined,
      },
      message: "Password reset OTP has been sent to your email",
    });
  } catch (error) {
    console.error("POST /api/v1/auth/forgot-password Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: (error as Error).message },
      },
      { status: 500 }
    );
  }
}
