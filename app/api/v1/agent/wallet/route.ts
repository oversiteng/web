import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { agentWallets, agentProfiles, payoutTransactions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/v1/agent/wallet — Operative Wallet Overview & Balance Details
export const GET = withAuth(
  async (req: NextRequest, { user }) => {
    try {
      const db = await getDbReady();

      // Look up or initialize operative wallet
      let wallets = await db
        .select()
        .from(agentWallets)
        .where(eq(agentWallets.agentId, user.sub))
        .limit(1);

      let wallet = wallets[0];
      if (!wallet) {
        const [createdWallet] = await db
          .insert(agentWallets)
          .values({
            agentId: user.sub,
            balanceNgn: "0.00",
            totalEarnedNgn: "0.00",
          })
          .returning();
        wallet = createdWallet;
      }

      // Fetch operative profile bank details
      const profiles = await db
        .select()
        .from(agentProfiles)
        .where(eq(agentProfiles.userId, user.sub))
        .limit(1);

      const profile = profiles[0];

      // Calculate pending payouts in clearance
      const pendingPayouts = await db
        .select()
        .from(payoutTransactions)
        .where(
          and(
            eq(payoutTransactions.agentId, user.sub),
            eq(payoutTransactions.status, "PENDING")
          )
        );

      const pendingClearanceNgn = pendingPayouts.reduce(
        (sum, p) => sum + parseFloat(p.amountNgn),
        0
      );

      return NextResponse.json<
        ApiResponse<{
          walletId: string;
          agentId: string;
          balanceNgn: number;
          totalEarnedNgn: number;
          pendingClearanceNgn: number;
          currency: string;
          savedBank: {
            bankCode: string | null;
            bankAccountNumber: string | null;
            bankAccountName: string | null;
            isConfigured: boolean;
          };
          updatedAt: string;
        }>
      >({
        success: true,
        data: {
          walletId: wallet.id,
          agentId: wallet.agentId,
          balanceNgn: parseFloat(wallet.balanceNgn || "0"),
          totalEarnedNgn: parseFloat(wallet.totalEarnedNgn || "0"),
          pendingClearanceNgn,
          currency: "NGN",
          savedBank: {
            bankCode: profile?.bankCode || null,
            bankAccountNumber: profile?.bankAccountNumber || null,
            bankAccountName: profile?.bankAccountName || null,
            isConfigured: Boolean(
              profile?.bankCode && profile?.bankAccountNumber
            ),
          },
          updatedAt: wallet.updatedAt.toISOString(),
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
  { roles: ["AGENT", "ADMIN", "SUPER_ADMIN"] }
);
