import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types/api";
import { User } from "@/lib/types/user";
import { signToken, signRefreshToken } from "@/lib/auth/jwt";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";

export interface LoginResponseData {
  user: Partial<User> & {
    fullName?: string | null;
    ninVerificationStatus?: string;
    nbaVerificationStatus?: string;
  };
  token: string;
  accessToken: string;
  refreshToken: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<LoginResponseData>>> {
  try {
    const db = await getDbReady();
    const body = await req.json();
    const identifier = (body.email || body.phone || body.phoneNumber || "").trim().toLowerCase();
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

    const foundUsers = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        name: users.name,
        role: users.role,
        kycStatus: users.kycStatus,
        ninVerificationStatus: users.ninVerificationStatus,
        nbaVerificationStatus: users.nbaVerificationStatus,
        passwordHash: users.passwordHash,
        isActive: users.isActive,
      })
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.phone, identifier)))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid email/phone or password",
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
            message: "Invalid email/phone or password",
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
            message: "Invalid email/phone or password",
          },
        },
        { status: 401 }
      );
    }

    // Sign JWT tokens
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
    });

    const refreshToken = signRefreshToken(user.id);

    const response = NextResponse.json<ApiResponse<LoginResponseData>>({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          fullName: user.name,
          phone: user.phone,
          role: user.role,
          kycStatus: user.kycStatus,
          ninVerificationStatus: user.ninVerificationStatus,
          nbaVerificationStatus: user.nbaVerificationStatus,
          isActive: user.isActive,
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
