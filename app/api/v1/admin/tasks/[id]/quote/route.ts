import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { tasks, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateClientBufferedHours } from "@/lib/services/pricing";

const db = getDb();

// PATCH /api/v1/admin/tasks/:id/quote
// Admin concierge sets manual pricing, items, and delivery SLA for tasks awaiting quote
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const {
        priceNgn,
        agentTargetHours,
        pricingBreakdown,
        adminNotes,
        waypoints,
        purchaseItems,
      } = body;

      if (!priceNgn) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "priceNgn is required to quote this task" },
          },
          { status: 400 }
        );
      }

      const existingTasks = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
      if (existingTasks.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
          { status: 404 }
        );
      }

      const task = existingTasks[0];
      const targetHours = agentTargetHours || task.agentTargetHours || 24;
      const clientHours = calculateClientBufferedHours(targetHours);
      const deliveryDate = new Date(Date.now() + clientHours * 60 * 60 * 1000);

      const [updatedTask] = await db
        .update(tasks)
        .set({
          priceNgn: String(priceNgn),
          quoteStatus: "PRICED",
          agentTargetHours: targetHours,
          clientPromisedHours: clientHours,
          clientPromisedDeliveryDate: deliveryDate,
          waypoints: waypoints || task.waypoints,
          purchaseItems: purchaseItems || task.purchaseItems,
          pricingBreakdown: pricingBreakdown || {
            quotedByAdmin: true,
            totalNgn: Number(priceNgn),
            adminNotes,
          },
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Send notification to the client that their quote is ready
      await db.insert(notifications).values({
        userId: task.userId,
        type: "TASK_UPDATE",
        title: "Service Quote Ready",
        body: `Your quote of ₦${Number(priceNgn).toLocaleString()} for "${task.title}" is ready for approval.`,
        taskId: task.id,
      });

      return NextResponse.json<
        ApiResponse<{
          taskId: string;
          quoteStatus: string;
          priceNgn: number;
          clientPromisedHours: number;
          clientPromisedDeliveryDate: string;
          message: string;
        }>
      >({
        success: true,
        data: {
          taskId: updatedTask.id,
          quoteStatus: updatedTask.quoteStatus || "PRICED",
          priceNgn: parseFloat(updatedTask.priceNgn || "0"),
          clientPromisedHours: updatedTask.clientPromisedHours || clientHours,
          clientPromisedDeliveryDate: updatedTask.clientPromisedDeliveryDate?.toISOString() || deliveryDate.toISOString(),
          message: "Task has been quoted and client notified.",
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
  { roles: ["ADMIN"] }
);
