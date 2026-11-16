import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types/api";
import { signToken, signRefreshToken, verifyToken } from "@/lib/auth/jwt";
import { eq } from "drizzle-orm";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { extractAdminPolicy } from "@/lib/auth/adminPermissions";
import { verifyOtp } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/sessionManager";
import { LoginResponseData } from "@/app/api/v1/auth/login/route";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<LoginResponseData>>> {
  try {
    const body = await req.json().catch(() => ({}));
    const twoFactorToken = String(body.twoFactorToken || "").trim();
    const code = String(body.code || "").trim();

    if (!twoFactorToken || !code) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "2FA challenge token and 6-digit code are required",
          },
        },
        { status: 400 }
      );
    }

    // Verify challenge token
    const tokenPayload = verifyToken<{ sub: string; email: string; role: any }>(twoFactorToken);
    if (!tokenPayload || !tokenPayload.sub) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Your 2FA session has expired. Please sign in again.",
          },
        },
        { status: 401 }
      );
    }

    const userId = tokenPayload.sub;

    // Verify OTP
    const otpResult = await verifyOtp(`2fa:${userId}`, code);
    if (!otpResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: otpResult.reason || "Invalid verification code",
          },
        },
        { status: 401 }
      );
    }

    const db = await getDbReady();
    const foundUsers = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        name: users.name,
        title: users.title,
        address: users.address,
        location: users.location,
        occupation: users.occupation,
        state: users.state,
        country: users.country,
        residence: users.residence,
        avatarUrl: users.avatarUrl,
        role: users.role,
        kycStatus: users.kycStatus,
        ninVerificationStatus: users.ninVerificationStatus,
        nbaVerificationStatus: users.nbaVerificationStatus,
        accreditationDocuments: users.accreditationDocuments,
        twoFactorEnabled: users.twoFactorEnabled,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "User account not found",
          },
        },
        { status: 404 }
      );
    }

    const user = foundUsers[0];

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "This account has been deactivated.",
          },
        },
        { status: 403 }
      );
    }

    const adminPolicy =
      user.role === "ADMIN" || user.role === "SUPER_ADMIN"
        ? extractAdminPolicy(user)
        : null;

    if (adminPolicy && adminPolicy.onboardingStatus === "SUSPENDED") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Your administrative access has been suspended.",
          },
        },
        { status: 403 }
      );
    }

    // Issue permanent auth tokens
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
    });

    const refreshToken = signRefreshToken(user.id);

    // Track active session & enforce max 2 concurrent active sessions ceiling
    await createSession({
      userId: user.id,
      req,
      token,
      userEmail: user.email,
      userName: user.name || undefined,
    });

    const response = NextResponse.json<ApiResponse<LoginResponseData>>({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          fullName: user.name,
          phone: user.phone,
          title: user.title,
          address: user.address,
          location: user.location,
          occupation: user.occupation,
          state: user.state,
          country: user.country,
          residence: user.residence,
          avatarUrl: user.avatarUrl,
          role: user.role,
          kycStatus: user.kycStatus,
          ninVerificationStatus: user.ninVerificationStatus,
          nbaVerificationStatus: user.nbaVerificationStatus,
          twoFactorEnabled: user.twoFactorEnabled,
          isActive: user.isActive,
          adminPolicy,
          createdAt: user.createdAt ? user.createdAt.toISOString() : undefined,
        },
        token,
        accessToken: token,
        refreshToken,
      },
      message: "Two-factor authentication verified successfully",
    });

    response.cookies.set("token", token, {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("2FA Verification Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: (error as Error).message },
      },
      { status: 500 }
    );
  }
}
