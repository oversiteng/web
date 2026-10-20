import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types/api";
import { User } from "@/lib/types/user";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { users, agentProfiles } from "@/db/schema";
import { signToken, signRefreshToken } from "@/lib/auth/jwt";

const db = getDb();
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<{ user: Partial<User> & { fullName?: string | null; ninVerificationStatus?: string }; token: string; accessToken: string; refreshToken: string }>>> {
  try {
    const body = await req.json();
    const { email, password } = body;
    const name = body.name || body.fullName;
    const phone = body.phone || body.phoneNumber;
    // Mobile spec uses CLIENT, DB uses USER
    let normalizedRole = body.role || "USER";
    if (normalizedRole === "CLIENT") {
      normalizedRole = "USER";
    }
    console.log({email, password})
    
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Email and password are required" },
        },
        { status: 400 }
      );
    }
    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: { code: "CONFLICT", message: "Email is already registered" } },
        { status: 409 }
      );
    }

    // Insert user record into db
    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: hashedPassword,
      name: name || null,
      phone: phone || null,
      role: normalizedRole,
      kycStatus: "PENDING",
      isActive: true,
    }).returning();

    // If agent, create agent profile
    if (newUser.role === "AGENT") {
      await db.insert(agentProfiles).values({
        userId: newUser.id,
        tier: "GENERAL",
        isAvailable: false,
      });
    }

    const token = signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name || undefined,
    });

    const refreshToken = signRefreshToken(newUser.id);

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            fullName: newUser.name,
            phone: newUser.phone,
            role: newUser.role,
            kycStatus: newUser.kycStatus,
            ninVerificationStatus: newUser.kycStatus.toLowerCase(),
            isActive: newUser.isActive,
          },
          token,
          accessToken: token,
          refreshToken,
        },
      },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      path: "/",
      httpOnly: false,
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
