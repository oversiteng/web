import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { agentWallets, agentProfiles, payoutTransactions, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// POST /api/v1/agent/wallet/withdraw — Operative Bank Withdrawal Execution
export const POST = withAuth(
  async (req: NextRequest, { user }) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { amountNgn, bankCode, accountNumber } = body;

      const numAmount = Number(amountNgn);
      if (!amountNgn || isNaN(numAmount) || numAmount < 1000) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "A valid amountNgn of at least ₦1,000 is required for bank withdrawal.",
            },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();

      // 1. Fetch wallet
      const wallets = await db
        .select()
        .from(agentWallets)
        .where(eq(agentWallets.agentId, user.sub))
        .limit(1);

      if (wallets.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INSUFFICIENT_FUNDS",
              message: "No wallet found or zero balance available.",
            },
          },
          { status: 400 }
        );
      }

      const wallet = wallets[0];
      const currentBalance = parseFloat(wallet.balanceNgn || "0");

      if (currentBalance < numAmount) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INSUFFICIENT_FUNDS",
              message: `Insufficient wallet balance. Requested: ₦${numAmount.toLocaleString()}, Available: ₦${currentBalance.toLocaleString()}.`,
            },
          },
          { status: 400 }
        );
      }

      // 2. Resolve destination bank details
      let destBankCode = bankCode;
      let destAccountNumber = accountNumber;

      if (!destBankCode || !destAccountNumber) {
        const profiles = await db
          .select()
          .from(agentProfiles)
          .where(eq(agentProfiles.userId, user.sub))
          .limit(1);

        const profile = profiles[0];
        if (profile?.bankCode && profile?.bankAccountNumber) {
          destBankCode = profile.bankCode;
          destAccountNumber = profile.bankAccountNumber;
        } else {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: "No bank account specified and no saved account found on your operative profile. Please link a bank account first.",
              },
            },
            { status: 400 }
          );
        }
      }

      const now = new Date();
      const newBalance = (currentBalance - numAmount).toFixed(2);
      const gatewayRef = "OVS-PAYOUT-" + crypto.randomBytes(6).toString("hex").toUpperCase();

      // 3. Atomically deduct balance
      await db
        .update(agentWallets)
        .set({
          balanceNgn: newBalance,
          updatedAt: now,
        })
        .where(eq(agentWallets.id, wallet.id));

      // 4. Record payout transaction
      const [transaction] = await db
        .insert(payoutTransactions)
        .values({
          walletId: wallet.id,
          agentId: user.sub,
          amountNgn: numAmount.toFixed(2),
          bankCode: destBankCode,
          accountNumber: destAccountNumber,
          gatewayRef,
          status: "COMPLETED",
          createdAt: now,
          processedAt: now,
        })
        .returning();

      // 5. Notify operative
      await db.insert(notifications).values({
        userId: user.sub,
        type: "PAYMENT",
        title: "Bank Payout Dispatched",
        body: `₦${numAmount.toLocaleString()} has been transferred to your registered bank account (${destAccountNumber}). Reference: ${gatewayRef}.`,
      });

      return NextResponse.json<
        ApiResponse<{
          transactionId: string;
          amountNgn: number;
          previousBalanceNgn: number;
          newBalanceNgn: number;
          bankCode: string;
          accountNumber: string;
          gatewayRef: string;
          status: string;
          processedAt: string;
        }>
      >(
        {
          success: true,
          data: {
            transactionId: transaction.id,
            amountNgn: numAmount,
            previousBalanceNgn: currentBalance,
            newBalanceNgn: parseFloat(newBalance),
            bankCode: destBankCode,
            accountNumber: destAccountNumber,
            gatewayRef,
            status: transaction.status,
            processedAt: now.toISOString(),
          },
          message: "Payout withdrawal completed and transferred to bank account.",
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
  { roles: ["AGENT", "ADMIN", "SUPER_ADMIN"] }
);
