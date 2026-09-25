import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export const POST = withAuth(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { taskId, agentId, amountNgn } = body;

      if (!taskId || !agentId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "taskId and agentId are required" },
          },
          { status: 400 }
        );
      }

      // TODO: Credit agent_wallets balance and update payment.status = 'RELEASED'

      return NextResponse.json<ApiResponse<{ taskId: string; releasedAmount: number; status: string }>>({
        success: true,
        data: {
          taskId,
          releasedAmount: amountNgn || 20000,
          status: "RELEASED",
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
