import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskReports, payments, agentWallets, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/v1/tasks/:id/reports/:reportId/approve — Client Final Approval & Secured Payment Settlement
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
              message: "Only the task owner or Mission Control can approve deliverables.",
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

      // 3. Financial Settlement
      let settledAmountNgn = task.priceNgn ? parseFloat(task.priceNgn) : 25000;

      // Update payment record to RELEASED if exists
      const taskPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.taskId, taskId))
        .limit(1);

      if (taskPayments.length > 0) {
        settledAmountNgn = parseFloat(taskPayments[0].amountNgn);
        await db
          .update(payments)
          .set({
            status: "RELEASED",
            escrowReleasedAt: now,
            updatedAt: now,
          })
          .where(eq(payments.id, taskPayments[0].id));
      }

      // Credit operative wallet if assigned
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
              balanceNgn: (prevBal + settledAmountNgn).toFixed(2),
              totalEarnedNgn: (prevEarned + settledAmountNgn).toFixed(2),
              updatedAt: now,
            })
            .where(eq(agentWallets.id, agentWallet[0].id));
        } else {
          await db.insert(agentWallets).values({
            agentId: task.agentId,
            balanceNgn: settledAmountNgn.toFixed(2),
            totalEarnedNgn: settledAmountNgn.toFixed(2),
          });
        }

        // Notify Operative
        await db.insert(notifications).values({
          userId: task.agentId,
          type: "PAYMENT",
          title: "Earnings Credited",
          body: `₦${settledAmountNgn.toLocaleString()} has been credited to your Oversite wallet for completing "${task.title}".`,
          taskId: task.id,
        });
      }

      // Notify User
      await db.insert(notifications).values({
        userId: task.userId,
        type: "TASK_UPDATE",
        title: "Mission Completed & Certified",
        body: `You have approved the deliverables for "${task.title}". Thank you for trusting Oversite.`,
        taskId: task.id,
      });

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          taskId: completedTask.id,
          reportId: approvedReport.id,
          status: completedTask.status,
          reportStatus: approvedReport.status,
          approvedAt: now.toISOString(),
          settledAmountNgn,
          guaranteeApplied: true,
        },
        message: "Deliverables approved. Task marked COMPLETED and payment settled with Oversite Satisfaction Guarantee.",
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
  { roles: ["USER", "ADMIN", "SUPER_ADMIN"] }
);
