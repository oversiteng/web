import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { tasks, payments, agentWallets } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const db = getDb();

// POST /api/v1/payments/disburse
// Authorizes the release of escrowed funds to the assigned Agent upon milestone approval.
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { taskId, milestoneId } = body;

    if (!taskId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "taskId is required" },
        },
        { status: 400 }
      );
    }

    // Verify task belongs to user (or user is admin)
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
    if (task.userId !== user.sub && user.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "You are not authorized to disburse funds for this task." },
        },
        { status: 403 }
      );
    }

    if (!task.agentId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "Cannot disburse funds: no agent assigned to task." },
        },
        { status: 400 }
      );
    }

    // Find escrowed or captured payment for this task
    const taskPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.taskId, taskId))
      .limit(1);

    const amountNgn = taskPayments.length > 0 ? parseFloat(taskPayments[0].amountNgn) : (task.priceNgn ? parseFloat(task.priceNgn) : 20000);

    // Update payment record to RELEASED
    if (taskPayments.length > 0) {
      await db
        .update(payments)
        .set({
          status: "RELEASED",
          escrowReleasedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, taskPayments[0].id));
    }

    // Credit agent's wallet
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
          balanceNgn: String(currentBalance + amountNgn),
          totalEarnedNgn: String(currentEarned + amountNgn),
          updatedAt: new Date(),
        })
        .where(eq(agentWallets.id, agentWallet[0].id));
    } else {
      await db.insert(agentWallets).values({
        agentId: task.agentId,
        balanceNgn: String(amountNgn),
        totalEarnedNgn: String(amountNgn),
      });
    }

    return NextResponse.json<
      ApiResponse<{
        taskId: string;
        milestoneId?: string;
        disbursedAmount: number;
        status: string;
        message: string;
      }>
    >({
      success: true,
      data: {
        taskId,
        milestoneId,
        disbursedAmount: amountNgn,
        status: "RELEASED",
        message: "Escrow funds released to agent successfully.",
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
