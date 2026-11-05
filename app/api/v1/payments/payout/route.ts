import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, payments, agentWallets, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/v1/payments/payout — Disburse approved payment to agent wallet
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

      const db = await getDbReady();

      const [task] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (!task) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
          { status: 404 }
        );
      }

      const payoutAmount = amountNgn ? Number(amountNgn) : Number(task.priceNgn || 0);

      if (payoutAmount <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Payout amount must be greater than zero." },
          },
          { status: 400 }
        );
      }

      const now = new Date();

      // Find or create agent wallet
      const [existingWallet] = await db
        .select()
        .from(agentWallets)
        .where(eq(agentWallets.agentId, agentId))
        .limit(1);

      if (existingWallet) {
        const newBalance = (Number(existingWallet.balanceNgn) + payoutAmount).toFixed(2);
        const newEarned = (Number(existingWallet.totalEarnedNgn) + payoutAmount).toFixed(2);

        await db
          .update(agentWallets)
          .set({
            balanceNgn: newBalance,
            totalEarnedNgn: newEarned,
            updatedAt: now,
          })
          .where(eq(agentWallets.id, existingWallet.id));
      } else {
        await db.insert(agentWallets).values({
          agentId,
          balanceNgn: payoutAmount.toFixed(2),
          totalEarnedNgn: payoutAmount.toFixed(2),
        });
      }

      // Update payment record if exists
      await db
        .update(payments)
        .set({
          status: "RELEASED",
          escrowReleasedAt: now,
          updatedAt: now,
        })
        .where(eq(payments.taskId, taskId));

      // Notify operative
      await db.insert(notifications).values({
        userId: agentId,
        type: "PAYMENT",
        title: "Disbursement Credited",
        body: `₦${payoutAmount.toLocaleString()} has been credited to your Oversite operative wallet for completing "${task.title}".`,
        taskId: task.id,
      });

      return NextResponse.json<ApiResponse<{ taskId: string; releasedAmount: number; status: string }>>({
        success: true,
        data: {
          taskId,
          releasedAmount: payoutAmount,
          status: "RELEASED",
        },
        message: "Payment successfully disbursed to agent wallet.",
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
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
