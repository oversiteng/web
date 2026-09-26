import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { PayoutTransaction } from "@/lib/types/payment";

export const POST = withAuth(
  async (req: NextRequest, { user }) => {
    try {
      const body = await req.json();
      const { amountNgn, bankCode, accountNumber } = body;

      if (!amountNgn || !bankCode || !accountNumber) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Amount, bankCode, and accountNumber are required" },
          },
          { status: 400 }
        );
      }

      // TODO: Check wallet balance >= amountNgn
      // TODO: Deduct balance, insert into payout_transactions
      // TODO: Call Paystack Transfers API or trigger batch payout

      const mockPayout: PayoutTransaction = {
        id: "00000000-0000-0000-0000-000000000070",
        walletId: "00000000-0000-0000-0000-000000000060",
        agentId: user.sub,
        amountNgn,
        bankCode,
        accountNumber,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };

      return NextResponse.json<ApiResponse<PayoutTransaction>>(
        {
          success: true,
          data: mockPayout,
        },
        { status: 201 }
      );
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
  { roles: ["AGENT"] }
);
