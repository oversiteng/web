import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types/api";
import { User } from "@/lib/types/user";
import { signToken, signRefreshToken } from "@/lib/auth/jwt";
import { eq, or, ilike, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { extractAdminPolicy, AdminPolicy } from "@/lib/auth/adminPermissions";
import { generateOtpCode, storeOtp } from "@/lib/auth/otp";
import { sendEmailAsync } from "@/lib/services/mailService";
import { createSession } from "@/lib/auth/sessionManager";

export interface LoginResponseData {
  user?: Partial<User> & {
    fullName?: string | null;
    title?: string | null;
    address?: string | null;
    location?: string | null;
    occupation?: string | null;
    state?: string | null;
    country?: string | null;
    residence?: string | null;
    avatarUrl?: string | null;
    ninVerificationStatus?: string;
    nbaVerificationStatus?: string;
    adminPolicy?: AdminPolicy | null;
    twoFactorEnabled?: boolean;
  };
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<LoginResponseData>>> {
  try {
    const db = await getDbReady();
    const body = await req.json().catch(() => ({}));
    const rawIdentifier = body.email || body.phone || body.phoneNumber || body.identifier || "";
    const identifier = String(rawIdentifier).trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email or phone number and password are required",
          },
        },
        { status: 400 }
      );
    }

    // Generate phone variants if identifier contains digits
    const phoneCandidates: string[] = [identifier, String(rawIdentifier).trim()];
    const digitsOnly = identifier.replace(/\D/g, "");
    if (digitsOnly.length >= 7) {
      phoneCandidates.push(digitsOnly);
      if (digitsOnly.startsWith("234") && digitsOnly.length > 3) {
        phoneCandidates.push("+" + digitsOnly);
        phoneCandidates.push("0" + digitsOnly.slice(3));
      } else if (digitsOnly.startsWith("0") && digitsOnly.length > 1) {
        phoneCandidates.push("+234" + digitsOnly.slice(1));
        phoneCandidates.push("234" + digitsOnly.slice(1));
      } else {
        phoneCandidates.push("+234" + digitsOnly);
        phoneCandidates.push("0" + digitsOnly);
      }
    }

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
        passwordHash: users.passwordHash,
        twoFactorEnabled: users.twoFactorEnabled,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        or(
          ilike(users.email, identifier),
          inArray(users.phone, phoneCandidates)
        )
      )
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          },
        },
        { status: 401 }
      );
    }

    const user = foundUsers[0];

    // Check account status
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "This account has been deactivated. Please contact support.",
          },
        },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          },
        },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          },
        },
        { status: 401 }
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
            message: "Your administrative access has been suspended by the Super Admin.",
          },
        },
        { status: 403 }
      );
    }

    // Determine 2FA requirement:
    // Only accounts that have configured & activated 2FA (user.twoFactorEnabled === true)
    // receive the 2FA challenge on login.
    // This ensures newly provisioned Admins can sign in with their initial temporary password,
    // update their password, and set up 2FA themselves.
    // Once activated by the Admin, 2FA is permanently enforced on every subsequent login and cannot be disabled.
    const requiresTwoFactor = Boolean(user.twoFactorEnabled);

    if (requiresTwoFactor) {
      const otpCode = generateOtpCode(6);
      await storeOtp(`2fa:${user.id}`, otpCode, 10 * 60);

      // Temporary token valid for 10 minutes specifically for 2FA completion
      const twoFactorToken = signToken(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          name: user.name || undefined,
        },
        10 * 60
      );

      // Enqueue 2FA security code email asynchronously (< 5ms response)
      sendEmailAsync({
        to: user.email,
        subject: "Your Oversite Security Code",
        template: "2FA_CODE",
        payload: {
          code: otpCode,
          name: user.name || "User",
          expiresIn: "10 minutes",
        },
      }).catch((err) => console.error("[Auth Login] 2FA email dispatch failed:", err));

      return NextResponse.json({
        success: true,
        data: {
          requiresTwoFactor: true,
          twoFactorToken,
        },
        message: "Two-factor authentication required. Verification code has been sent to your email.",
      });
    }

    // Sign JWT tokens
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
    });

    const refreshToken = signRefreshToken(user.id);

    // Track session & enforce max 2 concurrent active sessions ceiling
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
      message: "Login successful",
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
    console.error("Auth Login Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: (error as Error).message },
      },
      { status: 500 }
    );
  }
}
