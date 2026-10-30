import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskMilestone } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskMilestones } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/v1/tasks/:id/milestones — Retrieve task operational milestones (Min milestone = 0 / standard fallback)
export const GET = withAuth<{ id: string }>(
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
      const rows = await db
        .select()
        .from(taskMilestones)
        .where(eq(taskMilestones.taskId, taskId))
        .orderBy(asc(taskMilestones.orderIndex), asc(taskMilestones.createdAt));

      let mapped: (TaskMilestone & {
        description?: string | null;
        orderIndex?: number;
        deliverableType?: string;
        checklist?: string[];
      })[] = [];

      if (rows.length > 0) {
        mapped = rows.map((m) => ({
          id: m.id,
          taskId: m.taskId,
          title: m.title,
          description: m.description,
          orderIndex: m.orderIndex,
          deliverableType: m.deliverableType,
          checklist: (m.checklist as string[]) || [],
          targetDate: m.targetDate ? m.targetDate.toISOString() : null,
          status: m.status as any,
          completionPct: m.completionPct,
          createdAt: m.createdAt.toISOString(),
        }));
      } else {
        // Institutional Standard Fallback: min milestone = 0 implies 1 standard comprehensive mission milestone
        mapped = [
          {
            id: `std-${task.id.slice(0, 8)}`,
            taskId: task.id,
            title: "Execute Oversite Field Operation",
            description: task.description || "Conduct verified on-site field operation and gather evidence.",
            orderIndex: 1,
            deliverableType: "INSPECTION_CHECKLIST",
            checklist: ["Perform on-site inspection", "Capture geotagged evidence", "Submit report dossier"],
            targetDate: task.clientPromisedDeliveryDate ? task.clientPromisedDeliveryDate.toISOString() : null,
            status: task.status === "COMPLETED" ? "COMPLETED" : "PENDING",
            completionPct: task.status === "COMPLETED" ? 100 : 0,
            createdAt: task.createdAt.toISOString(),
          },
        ];
      }

      return NextResponse.json<ApiResponse<typeof mapped>>({
        success: true,
        data: mapped,
        message: "Milestones retrieved successfully.",
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

// POST /api/v1/tasks/:id/milestones — Add an operational milestone to a task
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const {
        title,
        description,
        orderIndex = 0,
        deliverableType = "INSPECTION_CHECKLIST",
        checklist = [],
        targetDate,
      } = body;

      if (!title || typeof title !== "string" || !title.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "Milestone title is required." },
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

      const parsedTargetDate = targetDate ? new Date(targetDate) : null;

      const [created] = await db
        .insert(taskMilestones)
        .values({
          taskId,
          title: title.trim(),
          description: description?.trim() || null,
          orderIndex: Number(orderIndex) || 0,
          deliverableType,
          checklist: Array.isArray(checklist) ? checklist : null,
          targetDate: parsedTargetDate && !isNaN(parsedTargetDate.getTime()) ? parsedTargetDate : null,
          status: "PENDING",
          completionPct: 0,
        })
        .returning();

      return NextResponse.json<ApiResponse<TaskMilestone>>(
        {
          success: true,
          data: {
            id: created.id,
            taskId: created.taskId,
            title: created.title,
            targetDate: created.targetDate ? created.targetDate.toISOString() : null,
            status: created.status as any,
            completionPct: created.completionPct,
            createdAt: created.createdAt.toISOString(),
          },
          message: "Milestone created successfully.",
        },
        { status: 201 }
      );
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
