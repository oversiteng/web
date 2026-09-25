import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    if (user.role !== "ADMIN" && user.sub !== params.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not authorized to change availability" },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { isAvailable } = body;

    // TODO: Update agent_profiles.isAvailable in db

    return NextResponse.json<ApiResponse<{ isAvailable: boolean }>>({
      success: true,
      data: { isAvailable: Boolean(isAvailable) },
    });
  },
  { roles: ["AGENT", "ADMIN"] }
);
