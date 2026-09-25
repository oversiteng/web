import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { User } from "@/lib/types/user";

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    // Only allow user to view their own profile unless admin
    if (user.role !== "ADMIN" && user.sub !== params.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not authorized to access this user profile" },
        },
        { status: 403 }
      );
    }

    // TODO: Query db.select().from(users).where(eq(users.id, params.id))
    return NextResponse.json<ApiResponse<Partial<User>>>({
      success: true,
      data: {
        id: params.id,
        email: "user@oversite.ng",
        name: "User Profile",
        role: "USER",
        kycStatus: "VERIFIED",
        isActive: true,
      },
    });
  }
);

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    if (user.role !== "ADMIN" && user.sub !== params.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not authorized to modify this user" },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    // TODO: Update user record in db

    return NextResponse.json<ApiResponse<Partial<User>>>({
      success: true,
      data: {
        id: params.id,
        ...body,
      },
    });
  }
);
