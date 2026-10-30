import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskReports, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/v1/tasks/:id/reports/:reportId/reject — Client Rejection / Dispute Initiation
export const POST = withAuth<{ id: string; reportId: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId, reportId } = await params;
      const body = await req.json().catch(() => ({}));
      const { reason } = body;

      if (!reason || typeof reason !== "string" || !reason.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Please state the reason for rejecting or requesting revision of the field deliverable.",
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
      const isOwner = task.userId === user.sub;

      if (!isAdmin && !isOwner) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Only the task owner or Mission Control can dispute deliverables.",
            },
          },
          { status: 403 }
        );
      }

      const existingReports = await db
        .select()
        .from(taskReports)
        .where(and(eq(taskReports.id, reportId), eq(taskReports.taskId, taskId)))
        .limit(1);

      if (existingReports.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Report not found for this task." } },
          { status: 404 }
        );
      }

      const now = new Date();

      // Mark report REJECTED with reason
      const [rejectedReport] = await db
        .update(taskReports)
        .set({
          status: "REJECTED",
          userReviewedAt: now,
          userRejectionReason: reason.trim(),
          updatedAt: now,
        })
        .where(eq(taskReports.id, reportId))
        .returning();

      // Move task to DISPUTED
      const [disputedTask] = await db
        .update(tasks)
        .set({
          status: "DISPUTED",
          updatedAt: now,
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Alert Mission Control
      await db.insert(notifications).values({
        userId: task.userId,
        type: "ALERT",
        title: "Dispute Escalated to Mission Control",
        body: `Client requested rectification on "${task.title}". Reason: ${reason.trim()}. Central Operations is investigating under the Satisfaction Guarantee.`,
        taskId: task.id,
      });

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          taskId: disputedTask.id,
          reportId: rejectedReport.id,
          status: disputedTask.status,
          reportStatus: rejectedReport.status,
          disputedAt: now.toISOString(),
          reason: reason.trim(),
          guaranteeCoverage: "Oversite Satisfaction Guarantee Active",
        },
        message: "Deliverable rejected. Task escalated to Mission Control for investigation.",
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
