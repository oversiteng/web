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
// Allows an ADMIN to assign any agentId to a task with an acceptance window (default 2 hours, dynamically scaled by SLA)
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const { agentId, acceptanceWindowHours } = body;

      if (!agentId) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "agentId is required" },
          },
          { status: 400 }
        );
      }

      const [existingTask] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      const now = new Date();
      const targetTurnaround = Number(existingTask?.agentTargetHours || 24);
      const defaultWindowHrs =
        targetTurnaround <= 6 ? 0.5 : targetTurnaround <= 12 ? 1 : 2;
      const effectiveWindowHrs =
        typeof acceptanceWindowHours === "number" && acceptanceWindowHours > 0
          ? acceptanceWindowHours
          : defaultWindowHrs;
      const acceptanceDeadline = new Date(
        now.getTime() + effectiveWindowHrs * 60 * 60 * 1000
      ).toISOString();

      const prevFormData =
        existingTask?.formData && typeof existingTask.formData === "object"
          ? (existingTask.formData as Record<string, any>)
          : {};

      const [updatedTask] = await db
        .update(tasks)
        .set({
          agentId,
          status: "MATCHED",
          formData: {
            ...prevFormData,
            assignedAt: now.toISOString(),
            acceptanceWindowHours: effectiveWindowHrs,
            acceptanceDeadline,
          },
          updatedAt: now,
        })
        .where(eq(tasks.id, taskId))
        .returning();

      return NextResponse.json<
        ApiResponse<{
          taskId: string;
          agentId: string;
          status: string;
          acceptanceDeadline: string;
        }>
      >({
        success: true,
        data: {
          taskId: updatedTask?.id || taskId,
          agentId,
          status: "MATCHED",
          acceptanceDeadline,
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
