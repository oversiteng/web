import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/v1/tasks/:id/flag — Client or Admin flags an active mission / reports discrepancy
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const { reason, category } = body;

      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "A descriptive reason for flagging this mission is required.",
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
      const isOwner = task.userId === user.sub;
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Only the task requester or Mission Control can flag this task.",
            },
          },
          { status: 403 }
        );
      }

      const now = new Date();
      const prevFormData = (task.formData as Record<string, any>) || {};
      const flagHistory = Array.isArray(prevFormData.flagHistory) ? prevFormData.flagHistory : [];

      flagHistory.push({
        flaggedByUserId: user.sub,
        flaggedByRole: user.role,
        category: category || "GENERAL_DISPUTE",
        reason: reason.trim(),
        flaggedAt: now.toISOString(),
      });

      const [updatedTask] = await db
        .update(tasks)
        .set({
          status: "DISPUTED",
          formData: {
            ...prevFormData,
            flagHistory,
            currentDispute: {
              category: category || "GENERAL_DISPUTE",
              reason: reason.trim(),
              flaggedAt: now.toISOString(),
            },
          },
          updatedAt: now,
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Notify the requester
      await db.insert(notifications).values({
        userId: task.userId,
        type: "ALERT",
        title: "Mission Flagged for Arbitration",
        body: `Task "${task.title}" has been placed in DISPUTED status. Our compliance team has paused funds and opened an investigation.`,
        taskId: task.id,
      });

      // If assigned operative exists, notify them
      if (task.agentId) {
        await db.insert(notifications).values({
          userId: task.agentId,
          type: "ALERT",
          title: "Mission Under Dispute Review",
          body: `Task "${task.title}" has been flagged. Please check compliance dashboard or contact Mission Control.`,
          taskId: task.id,
        });
      }

      return NextResponse.json<
        ApiResponse<{
          taskId: string;
          status: string;
          flaggedAt: string;
          reason: string;
        }>
      >({
        success: true,
        data: {
          taskId: updatedTask.id,
          status: updatedTask.status,
          flaggedAt: now.toISOString(),
          reason: reason.trim(),
        },
        message: "Mission successfully flagged. Secured payment is paused pending administrative arbitration.",
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
  { roles: ["USER", "ADMIN", "SUPER_ADMIN"] }
);

