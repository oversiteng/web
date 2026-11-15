import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import {
  tasks,
  payments,
  agentWallets,
  payoutTransactions,
  users,
  agentProfiles,
  taskReports,
  notifications,
} from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { resolveTaskDualPricing, formatOperativeCode } from "@/lib/services/pricing";

const clientUser = alias(users, "client_user");
const agentUser = alias(users, "agent_user");

// GET /api/v1/admin/finance/overview — Revenue, Agent Task Pay Credits, Withdrawals & Refunds Ledger
export const GET = withAuth(
  async () => {
    try {
      const db = await getDbReady();

      // 1. Fetch payments joined with tasks, client, and agent
      const paymentRows = await db
        .select({
          payment: payments,
          task: tasks,
          clientName: clientUser.name,
          clientEmail: clientUser.email,
          agentName: agentUser.name,
        })
        .from(payments)
        .leftJoin(tasks, eq(payments.taskId, tasks.id))
        .leftJoin(clientUser, eq(payments.userId, clientUser.id))
        .leftJoin(agentUser, eq(tasks.agentId, agentUser.id))
        .orderBy(desc(payments.createdAt))
        .limit(100);

      // Also include paid/active tasks that may not have a separate payment row yet
      const taskRows = await db
        .select({
          task: tasks,
          clientName: clientUser.name,
          clientEmail: clientUser.email,
          agentName: agentUser.name,
        })
        .from(tasks)
        .leftJoin(clientUser, eq(tasks.userId, clientUser.id))
        .leftJoin(agentUser, eq(tasks.agentId, agentUser.id))
        .orderBy(desc(tasks.createdAt))
        .limit(60);

      const paymentByTaskId = new Map<string, (typeof paymentRows)[0]>();
      for (const p of paymentRows) {
        if (p.payment.taskId && !paymentByTaskId.has(p.payment.taskId)) {
          paymentByTaskId.set(p.payment.taskId, p);
        }
      }

      const taskRevenueLedger = taskRows.map(({ task: t, clientName, clientEmail, agentName }) => {
        const dual = resolveTaskDualPricing(t);
        const linkedPay = paymentByTaskId.get(t.id);
        const paymentStatus = linkedPay?.payment.status || (t.status === "COMPLETED" ? "RELEASED" : "CAPTURED");
        const clientPaidNgn = linkedPay
          ? parseFloat(linkedPay.payment.amountNgn || "0")
          : dual.clientPriceNgn;

        return {
          taskId: t.id,
          taskTitle: t.title,
          moduleType: t.moduleType,
          taskStatus: t.status,
          clientName: clientName || clientEmail?.split("@")[0] || "Client",
          agentId: t.agentId,
          agentName: agentName || null,
          operativeCode: t.agentId ? formatOperativeCode(t.agentId) : null,
          clientPaidNgn,
          agentPayoutNgn: dual.agentPayoutNgn,
          platformMarginNgn: Math.max(0, clientPaidNgn - dual.agentPayoutNgn),
          isAgentPayExplicitlySet: dual.isAgentPayExplicitlySet,
          paymentStatus,
          gatewayRef: linkedPay?.payment.gatewayRef || `OVS-${t.id.slice(0, 8).toUpperCase()}`,
          createdAt: t.createdAt.toISOString(),
        };
      });

      // 2. Operative Wallets joined with user & profile
      const walletsRows = await db
        .select({
          wallet: agentWallets,
          userName: users.name,
          userEmail: users.email,
          tier: agentProfiles.tier,
          bankCode: agentProfiles.bankCode,
          bankAccountNumber: agentProfiles.bankAccountNumber,
          bankAccountName: agentProfiles.bankAccountName,
        })
        .from(agentWallets)
        .innerJoin(users, eq(agentWallets.agentId, users.id))
        .leftJoin(agentProfiles, eq(agentWallets.agentId, agentProfiles.userId))
        .orderBy(desc(agentWallets.updatedAt));

      const agentWalletsLedger = walletsRows.map((w) => ({
        walletId: w.wallet.id,
        agentId: w.wallet.agentId,
        operativeCode: formatOperativeCode(w.wallet.agentId),
        agentName: w.userName || w.userEmail,
        agentEmail: w.userEmail,
        tier: w.tier || "GENERAL",
        balanceNgn: parseFloat(w.wallet.balanceNgn || "0"),
        totalEarnedNgn: parseFloat(w.wallet.totalEarnedNgn || "0"),
        bankCode: w.bankCode,
        bankAccountNumber: w.bankAccountNumber,
        bankAccountName: w.bankAccountName,
        updatedAt: w.wallet.updatedAt.toISOString(),
      }));

      // 3. Operative Bank Withdrawal Payouts
      const payoutRows = await db
        .select({
          payout: payoutTransactions,
          agentName: users.name,
          agentEmail: users.email,
        })
        .from(payoutTransactions)
        .innerJoin(users, eq(payoutTransactions.agentId, users.id))
        .orderBy(desc(payoutTransactions.createdAt))
        .limit(50);

      const payoutTransactionsLedger = payoutRows.map((p) => ({
        id: p.payout.id,
        agentId: p.payout.agentId,
        operativeCode: formatOperativeCode(p.payout.agentId),
        agentName: p.agentName || p.agentEmail,
        amountNgn: parseFloat(p.payout.amountNgn || "0"),
        bankCode: p.payout.bankCode,
        accountNumber: p.payout.accountNumber,
        gatewayRef: p.payout.gatewayRef,
        status: p.payout.status,
        createdAt: p.payout.createdAt.toISOString(),
        processedAt: p.payout.processedAt ? p.payout.processedAt.toISOString() : null,
      }));

      // 4. Disputed / Contested Tasks
      const disputedRows = await db
        .select({
          task: tasks,
          clientName: clientUser.name,
          agentName: agentUser.name,
        })
        .from(tasks)
        .leftJoin(clientUser, eq(tasks.userId, clientUser.id))
        .leftJoin(agentUser, eq(tasks.agentId, agentUser.id))
        .where(eq(tasks.status, "DISPUTED"))
        .orderBy(desc(tasks.updatedAt));

      const disputedTaskIds = disputedRows.map((d) => d.task.id);
      const disputedReports =
        disputedTaskIds.length > 0
          ? await db
              .select()
              .from(taskReports)
              .where(inArray(taskReports.taskId, disputedTaskIds))
          : [];

      const disputedTasks = disputedRows.map(({ task: t, clientName, agentName }) => {
        const dual = resolveTaskDualPricing(t);
        const rpt = disputedReports.find((r) => r.taskId === t.id);
        return {
          id: t.id,
          title: t.title,
          moduleType: t.moduleType,
          clientName: clientName || "Client",
          agentId: t.agentId,
          agentName: agentName || "Unassigned",
          operativeCode: t.agentId ? formatOperativeCode(t.agentId) : null,
          clientPriceNgn: dual.clientPriceNgn,
          agentPayoutNgn: dual.agentPayoutNgn,
          platformMarginNgn: dual.platformMarginNgn,
          userRejectionReason:
            rpt?.userRejectionReason || "Client requested deliverable verification / review.",
          reportWatermark: rpt?.watermarkCode || null,
          createdAt: t.createdAt.toISOString(),
        };
      });

      // 5. Compute KPI Totals
      const totalClientRevenueNgn = taskRevenueLedger
        .filter((r) => r.paymentStatus !== "REFUNDED" && r.paymentStatus !== "FAILED")
        .reduce((acc, curr) => acc + curr.clientPaidNgn, 0);

      const totalRefundedNgn = taskRevenueLedger
        .filter((r) => r.paymentStatus === "REFUNDED" || r.taskStatus === "CANCELLED")
        .reduce((acc, curr) => acc + curr.clientPaidNgn, 0);

      const totalAgentCreditedNgn = agentWalletsLedger.reduce(
        (acc, curr) => acc + curr.totalEarnedNgn,
        0
      );

      const totalBankWithdrawalsNgn = payoutTransactionsLedger
        .filter((p) => p.status === "COMPLETED")
        .reduce((acc, curr) => acc + curr.amountNgn, 0);

      const netPlatformMarginNgn = Math.max(0, totalClientRevenueNgn - totalAgentCreditedNgn);

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          summary: {
            totalClientRevenueNgn,
            totalAgentCreditedNgn,
            netPlatformMarginNgn,
            totalBankWithdrawalsNgn,
            totalRefundedNgn,
          },
          taskRevenueLedger,
          agentWalletsLedger,
          payoutTransactionsLedger,
          disputedTasks,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);

// POST /api/v1/admin/finance/overview — Resolve Contested Task (CREDIT_AGENT | REFUND_CLIENT | REMEDIATE)
export const POST = withAuth(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { taskId, action, adminNotes } = body;

      if (!taskId || !["CREDIT_AGENT", "REFUND_CLIENT", "REMEDIATE"].includes(action)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "taskId and valid action (CREDIT_AGENT, REFUND_CLIENT, REMEDIATE) required.",
            },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();
      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
      if (!task) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
          { status: 404 }
        );
      }

      const now = new Date();
      const dual = resolveTaskDualPricing(task);

      if (action === "CREDIT_AGENT") {
        const creditNgn = dual.agentPayoutNgn > 0 ? dual.agentPayoutNgn : 15000;

        await db
          .update(tasks)
          .set({ status: "COMPLETED", completedAt: now, updatedAt: now })
          .where(eq(tasks.id, taskId));

        await db
          .update(payments)
          .set({ status: "RELEASED", escrowReleasedAt: now, updatedAt: now })
          .where(eq(payments.taskId, taskId));

        if (task.agentId) {
          const [wallet] = await db
            .select()
            .from(agentWallets)
            .where(eq(agentWallets.agentId, task.agentId))
            .limit(1);

          if (wallet) {
            await db
              .update(agentWallets)
              .set({
                balanceNgn: (parseFloat(wallet.balanceNgn || "0") + creditNgn).toFixed(2),
                totalEarnedNgn: (parseFloat(wallet.totalEarnedNgn || "0") + creditNgn).toFixed(2),
                updatedAt: now,
              })
              .where(eq(agentWallets.id, wallet.id));
          } else {
            await db.insert(agentWallets).values({
              agentId: task.agentId,
              balanceNgn: creditNgn.toFixed(2),
              totalEarnedNgn: creditNgn.toFixed(2),
            });
          }

          await db.insert(notifications).values({
            userId: task.agentId,
            type: "PAYMENT",
            title: "Task Pay Credited After Review",
            body: `Oversite Command completed review of "${task.title}" and credited ₦${creditNgn.toLocaleString()} to your wallet.`,
            taskId: task.id,
          });
        }

        return NextResponse.json<ApiResponse<any>>({
          success: true,
          data: { taskId, action, creditedNgn: creditNgn },
          message: `Task completed and ₦${creditNgn.toLocaleString()} Agent Task Pay credited to operative.`,
        });
      }

      if (action === "REFUND_CLIENT") {
        await db
          .update(tasks)
          .set({ status: "CANCELLED", updatedAt: now })
          .where(eq(tasks.id, taskId));

        await db
          .update(payments)
          .set({ status: "REFUNDED", updatedAt: now })
          .where(eq(payments.taskId, taskId));

        await db.insert(notifications).values({
          userId: task.userId,
          type: "PAYMENT",
          title: "Service Payment Refunded",
          body: `Oversite Central Operations has processed a full refund of ₦${dual.clientPriceNgn.toLocaleString()} for "${task.title}".`,
          taskId: task.id,
        });

        return NextResponse.json<ApiResponse<any>>({
          success: true,
          data: { taskId, action, refundedNgn: dual.clientPriceNgn },
          message: "Task cancelled and client payment marked as refunded.",
        });
      }

      // REMEDIATE — Return task to IN_PROGRESS for operative re-inspection
      await db
        .update(tasks)
        .set({ status: "IN_PROGRESS", updatedAt: now })
        .where(eq(tasks.id, taskId));

      if (task.agentId) {
        await db.insert(notifications).values({
          userId: task.agentId,
          type: "ALERT",
          title: "Re-Inspection Directive Issued",
          body:
            adminNotes ||
            `Oversite Command requires additional field verification on "${task.title}" before completion credit.`,
          taskId: task.id,
        });
      }

      await db.insert(notifications).values({
        userId: task.userId,
        type: "TASK_UPDATE",
        title: "Follow-Up Field Verification Dispatched",
        body: `Oversite Operations has scheduled an immediate follow-up verification for "${task.title}".`,
        taskId: task.id,
      });

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: { taskId, action },
        message: "Task returned to active field progress for remediation.",
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);

