import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, payments, agentWallets, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { resolveTaskDualPricing } from "@/lib/services/pricing";

// POST /api/v1/payments/disburse
// Credits the assigned Operative's wallet with the agreed Agent Task Pay (`agentPayoutNgn`) upon task completion.
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { taskId, milestoneId, customAgentPayoutNgn } = body;

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "taskId is required" },
        },
        { status: 400 }
      );
    }

    const db = await getDbReady();

    const existingTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (existingTasks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Task not found" },
        },
        { status: 404 }
      );
    }

    const task = existingTasks[0];
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
    if (task.userId !== user.sub && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "You are not authorized to credit operative pay for this task.",
          },
        },
        { status: 403 }
      );
    }

    if (!task.agentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Cannot credit operative wallet: no operative assigned to task.",
          },
        },
        { status: 400 }
      );
    }

    const dual = resolveTaskDualPricing(task);
    const agentCreditNgn =
      customAgentPayoutNgn !== undefined && Number(customAgentPayoutNgn) > 0
        ? Number(customAgentPayoutNgn)
        : dual.agentPayoutNgn > 0
          ? dual.agentPayoutNgn
          : 15000;

    // Mark client payment record as settled (`RELEASED`) and task as `COMPLETED`
    const taskPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.taskId, taskId))
      .limit(1);

    const now = new Date();
    if (taskPayments.length > 0) {
      await db
        .update(payments)
        .set({
          status: "RELEASED",
          escrowReleasedAt: now,
          updatedAt: now,
        })
        .where(eq(payments.id, taskPayments[0].id));
    }

    await db
      .update(tasks)
      .set({
        status: "COMPLETED",
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(tasks.id, taskId));

    // Credit operative's wallet with `agentCreditNgn`
    const agentWallet = await db
      .select()
      .from(agentWallets)
      .where(eq(agentWallets.agentId, task.agentId))
      .limit(1);

    if (agentWallet.length > 0) {
      const currentBalance = parseFloat(agentWallet[0].balanceNgn || "0");
      const currentEarned = parseFloat(agentWallet[0].totalEarnedNgn || "0");
      await db
        .update(agentWallets)
        .set({
          balanceNgn: (currentBalance + agentCreditNgn).toFixed(2),
          totalEarnedNgn: (currentEarned + agentCreditNgn).toFixed(2),
          updatedAt: now,
        })
        .where(eq(agentWallets.id, agentWallet[0].id));
    } else {
      await db.insert(agentWallets).values({
        agentId: task.agentId,
        balanceNgn: agentCreditNgn.toFixed(2),
        totalEarnedNgn: agentCreditNgn.toFixed(2),
      });
    }

    await db.insert(notifications).values({
      userId: task.agentId,
      type: "PAYMENT",
      title: "Task Pay Credited",
      body: `₦${agentCreditNgn.toLocaleString()} has been credited to your Oversite wallet for "${task.title}".`,
      taskId: task.id,
    });

    return NextResponse.json<
      ApiResponse<{
        taskId: string;
        milestoneId?: string;
        clientPaidNgn: number;
        disbursedAmount: number;
        platformMarginNgn: number;
        status: string;
        message: string;
      }>
    >({
      success: true,
      data: {
        taskId,
        milestoneId,
        clientPaidNgn: dual.clientPriceNgn,
        disbursedAmount: agentCreditNgn,
        platformMarginNgn: Math.max(0, dual.clientPriceNgn - agentCreditNgn),
        status: "COMPLETED",
        message: `Agent Task Pay (₦${agentCreditNgn.toLocaleString()}) credited to operative wallet.`,
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
});
