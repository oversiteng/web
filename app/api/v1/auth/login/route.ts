import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types/api";
import { User } from "@/lib/types/user";
import { signToken, signRefreshToken } from "@/lib/auth/jwt";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/client";
import { users } from "@/db/schema";

const db = getDb();

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ user: Partial<User>; token: string }>>> {
  try {
    const body = await req.json();
    const identifier = (body.email || body.phone || body.phoneNumber || "").trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Email or phone number and password are required" },
        },
        { status: 400 }
      );
    }

    const foundUsers = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.phone, identifier)))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid email/phone or password" } },
        { status: 401 }
      );
    }

    const user = foundUsers[0];
    if (!user.passwordHash) {
       return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid email or password" } },
        { status: 401 }
      );
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name || undefined,
    });

    const refreshToken = signRefreshToken(user.id);

    const response = NextResponse.json({
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
          ninVerificationStatus: user.kycStatus.toLowerCase(),
          isActive: user.isActive,
        },
        token,
        accessToken: token,
        refreshToken,
      },
    });

    response.cookies.set("token", token, {
      path: "/",
      httpOnly: false, // allow client-side reading if needed
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
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
