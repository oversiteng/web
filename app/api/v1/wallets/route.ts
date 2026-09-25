import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { AgentWallet } from "@/lib/types/payment";

export const GET = withAuth(
  async (req: NextRequest, { user }) => {
    // TODO: Query agent_wallets where agent_id = user.sub
    const mockWallet: AgentWallet = {
      id: "00000000-0000-0000-0000-000000000060",
      agentId: user.sub,
      balanceNgn: 85000,
      totalEarnedNgn: 420000,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<AgentWallet>>({
      success: true,
      data: mockWallet,
    });
  },
  { roles: ["AGENT", "ADMIN"] }
);
