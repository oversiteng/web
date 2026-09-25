import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types/api";
import { User } from "@/lib/types/user";
import { signToken } from "@/lib/auth/jwt";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/db/client";
import { users } from "@/db/schema";

const db = getDb();

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ user: Partial<User>; token: string }>>> {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Email and password are required" },
        },
        { status: 400 }
      );
    }

    const foundUsers = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (foundUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid email or password" } },
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

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          kycStatus: user.kycStatus,
          isActive: user.isActive,
        },
        token,
      },
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
