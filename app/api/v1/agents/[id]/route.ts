import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { AgentProfile } from "@/lib/types/user";

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    // TODO: Fetch agent profile and associated user details
    const mockProfile: AgentProfile = {
      id: params.id,
      userId: "00000000-0000-0000-0000-000000000002",
      tier: "GENERAL",
      rating: 4.85,
      totalTasks: 24,
      isAvailable: true,
      serviceRadiusKm: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<AgentProfile>>({
      success: true,
      data: mockProfile,
    });
  }
);

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    // Only admin or the agent themselves can modify their profile
    if (user.role !== "ADMIN" && user.sub !== params.id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not authorized to modify this agent" },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    // TODO: Update agent_profiles record in db

    return NextResponse.json<ApiResponse<{ updated: boolean }>>({
      success: true,
      data: { updated: true },
    });
  }
);
