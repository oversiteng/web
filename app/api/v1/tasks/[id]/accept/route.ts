import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/v1/tasks/:id/accept — Field operative accepts / claims a mission
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
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

      // Check if already assigned to a different agent
      if (task.agentId && task.agentId !== user.sub && !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CONFLICT",
              message: "This mission has already been claimed or assigned to another operative.",
            },
          },
          { status: 409 }
        );
      }

      // Check if task status allows accepting
      const acceptableStatuses = ["PENDING", "MATCHED", "DRAFT"];
      if (!acceptableStatuses.includes(task.status) && task.agentId !== user.sub) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_STATE",
              message: `Cannot accept task with status "${task.status}". Task must be pending or matched.`,
            },
          },
          { status: 400 }
        );
      }

      const assignedAgentId = user.role === "AGENT" ? user.sub : task.agentId || user.sub;
      const now = new Date();

      const [updatedTask] = await db
        .update(tasks)
        .set({
          agentId: assignedAgentId,
          status: "AGENT_EN_ROUTE",
          updatedAt: now,
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Notify the client that the operative is on the move
      await db.insert(notifications).values({
        userId: task.userId,
        type: "TASK_UPDATE",
        title: "Operative Confirmed",
        body: `An accredited field operative has accepted your mission "${task.title}" and is en route.`,
        taskId: task.id,
      });

      return NextResponse.json<
        ApiResponse<{
          taskId: string;
          agentId: string | null;
          status: string;
          updatedAt: string;
        }>
      >({
        success: true,
        data: {
          taskId: updatedTask.id,
          agentId: updatedTask.agentId,
          status: updatedTask.status,
          updatedAt: updatedTask.updatedAt.toISOString(),
        },
        message: "Mission accepted. Status set to AGENT_EN_ROUTE.",
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
  { roles: ["AGENT", "ADMIN", "SUPER_ADMIN"] }
);

