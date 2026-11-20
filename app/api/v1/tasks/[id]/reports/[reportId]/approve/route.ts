import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskReports, payments, agentWallets, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { resolveTaskDualPricing } from "@/lib/services/pricing";

// POST /api/v1/tasks/:id/reports/:reportId/approve — Final Report Approval & Agent Task Pay Credit
export const POST = withAuth<{ id: string; reportId: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId, reportId } = await params;
      const db = await getDbReady();

      const existingTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (existingTasks.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found." } },
          { status: 404 }
        );
      }

      const task = existingTasks[0];
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
      const isOwner = task.userId === user.sub;

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Only the task owner or Oversite Command can approve deliverables.",
            },
          },
          { status: 403 }
        );
      }

      const existingReports = await db
        .select()
        .from(taskReports)
        .where(and(eq(taskReports.id, reportId), eq(taskReports.taskId, taskId)))
        .limit(1);

      if (existingReports.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Report not found for this task." } },
          { status: 404 }
        );
      }

      const now = new Date();

      // 1. Mark report APPROVED
      const [approvedReport] = await db
        .update(taskReports)
        .set({
          status: "APPROVED",
          userReviewedAt: now,
          updatedAt: now,
        })
        .where(eq(taskReports.id, reportId))
        .returning();

      // 2. Mark task COMPLETED
      const [completedTask] = await db
        .update(tasks)
        .set({
          status: "COMPLETED",
          completedAt: now,
          updatedAt: now,
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // 3. Resolve Dual-Price Economics:
      // Client paid `clientPriceNgn` (e.g. ₦1,000), Agent earns `agentPayoutNgn` (e.g. ₦700)
      const dual = resolveTaskDualPricing(task);
      const agentCreditNgn = dual.agentPayoutNgn > 0 ? dual.agentPayoutNgn : 15000;

      // Mark payment record as settled (RELEASED in enum) if exists
      const taskPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.taskId, taskId))
        .limit(1);

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

      // 4. Credit Operative Wallet with exact `agentPayoutNgn` shown to the operative
      if (task.agentId) {
        const agentWallet = await db
          .select()
          .from(agentWallets)
          .where(eq(agentWallets.agentId, task.agentId))
          .limit(1);

        if (agentWallet.length > 0) {
          const prevBal = parseFloat(agentWallet[0].balanceNgn || "0");
          const prevEarned = parseFloat(agentWallet[0].totalEarnedNgn || "0");
          await db
            .update(agentWallets)
            .set({
              balanceNgn: (prevBal + agentCreditNgn).toFixed(2),
              totalEarnedNgn: (prevEarned + agentCreditNgn).toFixed(2),
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

        // Notify Operative with their exact Agent Task Pay
        await db.insert(notifications).values({
          userId: task.agentId,
          type: "PAYMENT",
          title: "Task Pay Credited to Wallet",
          body: `₦${agentCreditNgn.toLocaleString()} has been credited to your Oversite wallet for completing "${task.title}".`,
          taskId: task.id,
        });
      }

      // Notify User
      await db.insert(notifications).values({
        userId: task.userId,
        type: "TASK_UPDATE",
        title: "Task Completed & Certified",
        body: `The deliverables for "${task.title}" have been certified and completed. Thank you for choosing Oversite.`,
        taskId: task.id,
      });

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          reportId: approvedReport.id,
          taskId: completedTask.id,
          reportStatus: approvedReport.status,
          taskStatus: completedTask.status,
          clientPaidNgn: dual.clientPriceNgn,
          agentCreditedNgn: agentCreditNgn,
          platformMarginNgn: dual.platformMarginNgn,
          completedAt: now.toISOString(),
        },
        message: "Report approved, task completed, and operative wallet credited with Agent Task Pay.",
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
  }
);
