import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/v1/tasks/:id/quote/decline
// User declines the quoted price and cancels task
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json().catch(() => ({}));
      const { reason } = body;

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

      const [updatedTask] = await db
        .update(tasks)
        .set({
          quoteStatus: "DECLINED",
          status: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();

      return NextResponse.json<
        ApiResponse<{
          taskId: string;
          quoteStatus: string;
          status: string;
          reason?: string;
        }>
      >({
        success: true,
        data: {
          taskId: updatedTask.id,
          quoteStatus: updatedTask.quoteStatus || "DECLINED",
          status: updatedTask.status,
          reason,
        },
        message: "Quote declined. Task has been cancelled.",
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
