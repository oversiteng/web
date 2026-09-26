import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const body = await req.json();
      const { agentId } = body;

      if (!agentId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "agentId is required" },
          },
          { status: 400 }
        );
      }

      // TODO: Update tasks.agentId = agentId, status = 'MATCHED'
      // TODO: Dispatch push/email notification to agent

      return NextResponse.json<ApiResponse<{ taskId: string; agentId: string; status: string }>>({
        success: true,
        data: {
          taskId: params.id,
          agentId,
          status: "MATCHED",
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
  { roles: ["ADMIN"] }
);
