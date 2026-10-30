import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskStatus } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { tasks, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const ALLOWED_STATUSES: TaskStatus[] = [
  "AGENT_EN_ROUTE",
  "AGENT_ON_SITE",
  "IN_PROGRESS",
  "REPORT_SUBMITTED",
  "UNDER_REVIEW",
  "COMPLETED",
  "CANCELLED",
];

// PATCH /api/v1/tasks/:id/status — Operative dispatch status progression
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const { status } = body;

      if (!status || !ALLOWED_STATUSES.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}`,
            },
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
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
      const isAssignedAgent = task.agentId === user.sub;

      if (!isAdmin && !isAssignedAgent) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "Only the assigned operative or Mission Control can update task progress." },
          },
          { status: 403 }
        );
      }

      const now = new Date();
      const isCompleted = status === "COMPLETED";

      const [updatedTask] = await db
        .update(tasks)
        .set({
          status: status as any,
          completedAt: isCompleted ? now : task.completedAt,
          updatedAt: now,
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Send institutional notification to User
      let notifTitle = "Field Operation Update";
      let notifBody = `Task "${task.title}" status updated to ${status}.`;

      if (status === "AGENT_EN_ROUTE") {
        notifTitle = "Operative En Route";
        notifBody = `Your accredited Oversite field operative is en route to the property.`;
      } else if (status === "AGENT_ON_SITE") {
        notifTitle = "Operative On Site";
        notifBody = `Your accredited Oversite field operative has arrived on site.`;
      } else if (status === "IN_PROGRESS") {
        notifTitle = "Inspection In Progress";
        notifBody = `On-site field audit and evidence collection is currently underway.`;
      }

      await db.insert(notifications).values({
        userId: task.userId,
        type: "TASK_UPDATE",
        title: notifTitle,
        body: notifBody,
        taskId: task.id,
      });

      return NextResponse.json<
        ApiResponse<{
          taskId: string;
          status: string;
          updatedAt: string;
        }>
      >({
        success: true,
        data: {
          taskId: updatedTask.id,
          status: updatedTask.status,
          updatedAt: updatedTask.updatedAt.toISOString(),
        },
        message: `Task progress advanced to ${status}.`,
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
