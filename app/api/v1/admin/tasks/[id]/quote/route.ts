import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  calculateClientBufferedHours,
  resolveTaskDualPricing,
  DEFAULT_PLATFORM_DEDUCTION_PCT,
} from "@/lib/services/pricing";

// PATCH /api/v1/admin/tasks/:id/quote
// Admin sets Client Service Quote (`priceNgn`), Agent Task Pay (`agentPayoutNgn`), and SLA hours
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const {
        priceNgn,
        agentPayoutNgn,
        agentTargetHours,
        pricingBreakdown,
        adminNotes,
        waypoints,
        purchaseItems,
        notifyClient = true,
      } = body;

      if (priceNgn === undefined && agentPayoutNgn === undefined) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Either priceNgn (Client Fee) or agentPayoutNgn (Agent Task Pay) is required.",
            },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();

      const existingTasks = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
      if (existingTasks.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
          { status: 404 }
        );
      }

      const task = existingTasks[0];
      const currentDual = resolveTaskDualPricing(task);

      const finalClientPriceNgn =
        priceNgn !== undefined && priceNgn !== null && priceNgn !== ""
          ? Number(priceNgn)
          : currentDual.clientPriceNgn;

      const finalAgentPayoutNgn =
        agentPayoutNgn !== undefined && agentPayoutNgn !== null && agentPayoutNgn !== ""
          ? Number(agentPayoutNgn)
          : currentDual.isAgentPayExplicitlySet
            ? currentDual.agentPayoutNgn
            : Math.round(finalClientPriceNgn * ((100 - DEFAULT_PLATFORM_DEDUCTION_PCT) / 100));

      const targetHours = Number(agentTargetHours || task.agentTargetHours || 24);
      const clientHours = calculateClientBufferedHours(targetHours);
      const deliveryDate = new Date(Date.now() + clientHours * 60 * 60 * 1000);

      const existingBreakdown =
        task.pricingBreakdown && typeof task.pricingBreakdown === "object"
          ? (task.pricingBreakdown as Record<string, any>)
          : {};
      const existingFormData =
        task.formData && typeof task.formData === "object"
          ? (task.formData as Record<string, any>)
          : {};

      const mergedBreakdown = {
        ...existingBreakdown,
        ...(pricingBreakdown || {}),
        quotedByAdmin: true,
        totalNgn: finalClientPriceNgn,
        agentPayoutNgn: finalAgentPayoutNgn,
        platformMarginNgn: Math.max(0, finalClientPriceNgn - finalAgentPayoutNgn),
        adminNotes: adminNotes ?? existingBreakdown.adminNotes,
        updatedAt: new Date().toISOString(),
      };

      const mergedFormData = {
        ...existingFormData,
        agentPayoutNgn: finalAgentPayoutNgn,
      };

      const isQuotingClient = priceNgn !== undefined && priceNgn !== null && priceNgn !== "";

      const [updatedTask] = await db
        .update(tasks)
        .set({
          priceNgn: String(finalClientPriceNgn),
          ...(isQuotingClient
            ? {
                quoteStatus: "OFFICIALLY_QUOTED",
                pricingMode: "ADMIN_MANUAL",
              }
            : {}),
          agentTargetHours: targetHours,
          clientPromisedHours: clientHours,
          clientPromisedDeliveryDate: deliveryDate,
          waypoints: waypoints || task.waypoints,
          purchaseItems: purchaseItems || task.purchaseItems,
          pricingBreakdown: mergedBreakdown,
          formData: mergedFormData,
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Send notification to the client only if we updated their official service quote
      if (isQuotingClient && notifyClient) {
        await db.insert(notifications).values({
          userId: task.userId,
          type: "TASK_UPDATE",
          title: "Official Service Quote Ready",
          body: `Your official Oversite service quote of ₦${Number(finalClientPriceNgn).toLocaleString()} for "${task.title}" is ready for review.`,
          taskId: task.id,
        });
      }

      // If an agent is already assigned and agentPayoutNgn was updated, notify the agent
      if (task.agentId && agentPayoutNgn !== undefined) {
        await db.insert(notifications).values({
          userId: task.agentId,
          type: "PAYMENT",
          title: "Task Payout Confirmed",
          body: `Oversite Command has set the task completion pay for "${task.title}" to ₦${Number(finalAgentPayoutNgn).toLocaleString()}.`,
          taskId: task.id,
        });
      }

      return NextResponse.json<
        ApiResponse<{
          taskId: string;
          quoteStatus: string;
          priceNgn: number;
          clientPriceNgn: number;
          agentPayoutNgn: number;
          platformMarginNgn: number;
          agentTargetHours: number;
          clientPromisedHours: number;
          clientPromisedDeliveryDate: string;
          message: string;
        }>
      >({
        success: true,
        data: {
          taskId: updatedTask.id,
          quoteStatus: updatedTask.quoteStatus || "OFFICIALLY_QUOTED",
          priceNgn: finalClientPriceNgn,
          clientPriceNgn: finalClientPriceNgn,
          agentPayoutNgn: finalAgentPayoutNgn,
          platformMarginNgn: Math.max(0, finalClientPriceNgn - finalAgentPayoutNgn),
          agentTargetHours: targetHours,
          clientPromisedHours: updatedTask.clientPromisedHours || clientHours,
          clientPromisedDeliveryDate:
            updatedTask.clientPromisedDeliveryDate?.toISOString() || deliveryDate.toISOString(),
          message: isQuotingClient
            ? "Client quote and Agent Task Pay updated."
            : `Agent Task Pay set to ₦${finalAgentPayoutNgn.toLocaleString()}.`,
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
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
