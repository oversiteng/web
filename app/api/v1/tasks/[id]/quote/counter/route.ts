import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/v1/tasks/:id/quote/counter
// User submits a counter-offer on a quoted task for Mission Control review
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const { counterPriceNgn, counterNote } = body;

      if (!counterPriceNgn || isNaN(Number(counterPriceNgn)) || Number(counterPriceNgn) <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "counterPriceNgn must be a valid positive amount." },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();

      const existingTasks = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.id, taskId),
            ["ADMIN", "SUPER_ADMIN"].includes(user.role) ? undefined : eq(tasks.userId, user.sub)
          )
        )
        .limit(1);

      if (existingTasks.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found." } },
          { status: 404 }
        );
      }

      const task = existingTasks[0];
      const prevFormData = (task.formData as Record<string, any>) || {};

      const counterOfferData = {
        counterPriceNgn: Number(counterPriceNgn),
        counterNote: counterNote ? String(counterNote).trim() : null,
        submittedAt: new Date().toISOString(),
        previousPriceNgn: task.priceNgn,
      };

      const [updatedTask] = await db
        .update(tasks)
        .set({
          quoteStatus: "COUNTER_OFFER",
          formData: {
            ...prevFormData,
            counterOffer: counterOfferData,
          },
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();

      return NextResponse.json<
        ApiResponse<{
          taskId: string;
          quoteStatus: string;
          counterPriceNgn: number;
          counterNote?: string;
          message: string;
        }>
      >({
        success: true,
        data: {
          taskId: updatedTask.id,
          quoteStatus: updatedTask.quoteStatus || "COUNTER_OFFER",
          counterPriceNgn: Number(counterPriceNgn),
          counterNote: counterNote?.trim(),
          message: "Counter-offer submitted to Oversite Mission Control for review.",
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
  }
);
