import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const db = getDb();

// POST /api/v1/tasks/:id/accept-quote
// Client accepts the quoted price and is prepared for payment escrow
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;

      const existingTasks = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.id, taskId),
            user.role === "ADMIN" ? undefined : eq(tasks.userId, user.sub)
          )
        )
        .limit(1);

      if (existingTasks.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found" } },
          { status: 404 }
        );
      }

      const task = existingTasks[0];

      const [updatedTask] = await db
        .update(tasks)
        .set({
          quoteStatus: "ACCEPTED",
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();

      return NextResponse.json<
        ApiResponse<{
          taskId: string;
          quoteStatus: string;
          priceNgn: number;
          message: string;
          checkoutReady: boolean;
        }>
      >({
        success: true,
        data: {
          taskId: updatedTask.id,
          quoteStatus: updatedTask.quoteStatus || "ACCEPTED",
          priceNgn: parseFloat(updatedTask.priceNgn || "0"),
          message: "Quote accepted. You may now initialize payment.",
          checkoutReady: true,
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
