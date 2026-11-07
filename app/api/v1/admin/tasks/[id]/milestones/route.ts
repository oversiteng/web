import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskMilestone } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskMilestones, notifications } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// POST /api/v1/admin/tasks/:id/milestones — Mission Control Directives & Dynamic Milestone Setup
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const { directives, milestones = [] } = body;

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

      // Update task description/directives if provided
      if (directives && typeof directives === "string" && directives.trim()) {
        await db
          .update(tasks)
          .set({
            description: directives.trim(),
            updatedAt: new Date(),
          })
          .where(eq(tasks.id, taskId));
      }

      // Add/replace milestones
      const createdMilestones = [];
      if (Array.isArray(milestones) && milestones.length > 0) {
        for (let i = 0; i < milestones.length; i++) {
          const m = milestones[i];
          const title = typeof m === "string" ? m : m.title;
          if (!title || !title.trim()) continue;

          const [created] = await db
            .insert(taskMilestones)
            .values({
              taskId,
              title: title.trim(),
              description: m.description ? String(m.description).trim() : null,
              orderIndex: m.orderIndex !== undefined ? Number(m.orderIndex) : i + 1,
              deliverableType: m.deliverableType || "INSPECTION_CHECKLIST",
              checklist: Array.isArray(m.checklist) ? m.checklist : null,
              targetDate: m.targetDate ? new Date(m.targetDate) : null,
              status: "PENDING",
              completionPct: 0,
            })
            .returning();

          createdMilestones.push(created);
        }
      }

      // If an agent is assigned, notify operative about new briefing directives
      if (task.agentId) {
        await db.insert(notifications).values({
          userId: task.agentId,
          type: "TASK_UPDATE",
          title: "Mission Directives Updated",
          body: `Central Operations has updated the operational milestones and field directives for task "${task.title}".`,
          taskId: task.id,
        });
      }

      const allMilestones = await db
        .select()
        .from(taskMilestones)
        .where(eq(taskMilestones.taskId, taskId))
        .orderBy(asc(taskMilestones.orderIndex));

      return NextResponse.json<ApiResponse<typeof allMilestones>>({
        success: true,
        data: allMilestones,
        message: "Mission Control directives and milestones established successfully.",
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
