import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { tasks } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

const db = getDb();

// PATCH /api/v1/tasks/:id/assign
// Allows an authenticated AGENT to self-assign/accept an open task (as per mobile spec)
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const { action } = body;

      if (action !== "accept") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid action. Supported action is 'accept'.",
            },
          },
          { status: 400 }
        );
      }

      // Check if task exists and is available
      const existingTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (existingTasks.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Task not found." },
          },
          { status: 404 }
        );
      }

      const task = existingTasks[0];
      if (task.agentId && task.agentId !== user.sub) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "TASK_ALREADY_ASSIGNED",
              message: "Task is already claimed by another agent.",
            },
          },
          { status: 409 }
        );
      }

      // Assign to authenticated agent
      const [updatedTask] = await db
        .update(tasks)
        .set({
          agentId: user.sub,
          status: "MATCHED",
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();

      return NextResponse.json<
        ApiResponse<{
          taskId: string;
          agentId: string;
          status: string;
          message: string;
        }>
      >({
        success: true,
        data: {
          taskId: updatedTask.id,
          agentId: updatedTask.agentId!,
          status: updatedTask.status,
          message: "Task accepted successfully.",
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
  { roles: ["AGENT", "ADMIN"] }
);

// POST /api/v1/tasks/:id/assign
// Allows an ADMIN to assign any agentId to a task
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const { agentId } = body;

      if (!agentId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "agentId is required" },
          },
          { status: 400 }
        );
      }

      const [updatedTask] = await db
        .update(tasks)
        .set({
          agentId,
          status: "MATCHED",
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId))
        .returning();

      return NextResponse.json<
        ApiResponse<{ taskId: string; agentId: string; status: string }>
      >({
        success: true,
        data: {
          taskId: updatedTask?.id || taskId,
          agentId,
          status: "MATCHED",
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
