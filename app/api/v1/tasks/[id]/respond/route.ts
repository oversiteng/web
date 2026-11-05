import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/v1/tasks/:id/respond — Operative responds to direct dispatch invitation
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const { action, reason } = body; // action: 'ACCEPT' | 'REJECT'

      if (!action || !["ACCEPT", "REJECT"].includes(action)) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Action must be ACCEPT or REJECT" },
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
          { success: false, error: { code: "NOT_FOUND", message: "Task not found." } },
          { status: 404 }
        );
      }

      const task = existingTasks[0];
      const now = new Date();

      if (action === "ACCEPT") {
        const [updatedTask] = await db
          .update(tasks)
          .set({
            agentId: user.sub,
            status: "AGENT_EN_ROUTE",
            updatedAt: now,
          })
          .where(eq(tasks.id, taskId))
          .returning();

        await db.insert(notifications).values({
          userId: task.userId,
          type: "TASK_UPDATE",
          title: "Operative Accepted Mission",
          body: `An operative has accepted your mission "${task.title}" and is mobilizing.`,
          taskId: task.id,
        });

        return NextResponse.json<ApiResponse<{ taskId: string; action: string; newStatus: string }>>({
          success: true,
          data: {
            taskId: updatedTask.id,
            action,
            newStatus: updatedTask.status,
          },
          message: "Mission accepted.",
        });
      } else {
        // REJECT action: unassign agent and return to dispatch queue
        const prevFormData = (task.formData as Record<string, any>) || {};
        const rejections = Array.isArray(prevFormData.rejections) ? prevFormData.rejections : [];
        rejections.push({
          agentId: user.sub,
          reason: reason || "Declined by operative",
          rejectedAt: now.toISOString(),
        });

        const [updatedTask] = await db
          .update(tasks)
          .set({
            agentId: null,
            status: "PENDING",
            formData: {
              ...prevFormData,
              rejections,
            },
            updatedAt: now,
          })
          .where(eq(tasks.id, taskId))
          .returning();

        return NextResponse.json<ApiResponse<{ taskId: string; action: string; newStatus: string }>>({
          success: true,
          data: {
            taskId: updatedTask.id,
            action,
            newStatus: updatedTask.status,
          },
          message: "Mission declined. Returned to matching pool.",
        });
      }
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
  { roles: ["AGENT", "ADMIN", "SUPER_ADMIN"] }
);
