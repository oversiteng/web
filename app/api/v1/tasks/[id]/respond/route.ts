import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const body = await req.json();
      const { action, reason } = body; // action: 'ACCEPT' | 'REJECT'

      if (!action || !["ACCEPT", "REJECT"].includes(action)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Action must be ACCEPT or REJECT" },
          },
          { status: 400 }
        );
      }

      // TODO: If ACCEPT -> set status = 'AGENT_EN_ROUTE'
      // TODO: If REJECT -> unassign agentId, return status to 'PENDING', trigger rematch engine

      return NextResponse.json<ApiResponse<{ taskId: string; action: string; newStatus: string }>>({
        success: true,
        data: {
          taskId: params.id,
          action,
          newStatus: action === "ACCEPT" ? "AGENT_EN_ROUTE" : "PENDING",
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
  },
  { roles: ["AGENT", "ADMIN"] }
);
