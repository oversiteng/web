import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types/api";
import { User, UserRole, AgentTier } from "@/lib/types/user";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";
import { getDbReady } from "@/lib/db/client";
import { users, agentProfiles } from "@/db/schema";
import { signToken, signRefreshToken } from "@/lib/auth/jwt";

export interface RegisterResponseData {
  user: Partial<User> & {
    fullName?: string | null;
    ninVerificationStatus?: string;
    nbaVerificationStatus?: string;
  };
  token: string;
  accessToken: string;
  refreshToken: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<RegisterResponseData>>> {
  try {
    const db = await getDbReady();
    const body = await req.json();

    const rawEmail = (body.email || "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const name = (body.name || body.fullName || "").trim();
    const phone = (body.phone || body.phoneNumber || "").trim() || null;

    // Strict role enforcement: Only USER or AGENT can be registered publicly
    let role: UserRole = "USER";
    if (body.role === "AGENT") {
      role = "AGENT";
    }

    // Input Validation
    if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
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

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Password must be at least 6 characters long",
          },
        },
        { status: 400 }
      );
    }

    // Check if email or phone already registered
    const existingConditions = [eq(users.email, rawEmail)];
    if (phone) {
      existingConditions.push(eq(users.phone, phone));
    }

    const existingUser = await db
      .select({ id: users.id, email: users.email, phone: users.phone })
      .from(users)
      .where(or(...existingConditions))
      .limit(1);

    if (existingUser.length > 0) {
      const isEmailMatch = existingUser[0].email === rawEmail;
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFLICT",
            message: isEmailMatch
              ? "An account with this email already exists"
              : "An account with this phone number already exists",
          },
        },
        { status: 409 }
      );
    }

    // Hash password with bcryptjs work factor 10
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user record
    const [newUser] = await db
      .insert(users)
      .values({
        email: rawEmail,
        passwordHash: hashedPassword,
        name: name || null,
        phone,
        role,
        kycStatus: "PENDING",
        ninVerificationStatus: "pending",
        nbaVerificationStatus: "pending",
        isActive: true,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
        kycStatus: users.kycStatus,
        ninVerificationStatus: users.ninVerificationStatus,
        nbaVerificationStatus: users.nbaVerificationStatus,
        isActive: users.isActive,
        createdAt: users.createdAt,
      });

    // If agent, create corresponding agent profile
    if (newUser.role === "AGENT") {
      const tier: AgentTier =
        body.tier && ["GENERAL", "TECHNICAL_SUPERVISOR", "INVESTIGATOR", "LEGAL_COUNSEL", "ENFORCEMENT_LIAISON"].includes(body.tier)
          ? (body.tier as AgentTier)
          : "GENERAL";

      await db.insert(agentProfiles).values({
        userId: newUser.id,
        tier,
        nbaNumber: body.nbaNumber || null,
        ninId: body.ninId || null,
        isAvailable: false,
      });
    }

    // Sign JWT tokens
    const token = signToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name || undefined,
    });

    const refreshToken = signRefreshToken(newUser.id);

    const response = NextResponse.json<ApiResponse<RegisterResponseData>>(
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
            ninVerificationStatus: newUser.ninVerificationStatus,
            nbaVerificationStatus: newUser.nbaVerificationStatus,
            isActive: newUser.isActive,
            createdAt: newUser.createdAt.toISOString(),
          },
          token,
          accessToken: token,
          refreshToken,
        },
        message: "User registered successfully",
      },
      { status: 201 }
    );

    // Set auth cookie for web application
    response.cookies.set("token", token, {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Auth Register Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: (error as Error).message },
      },
      { status: 500 }
    );
  }
}
