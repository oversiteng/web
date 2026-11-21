import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { taskReports, tasks, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { POST as rejectReportHandler } from "../reports/[reportId]/reject/route";

// POST /api/v1/tasks/:id/dispute — Convenience forwarder for task-level dispute / issue report
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, context) => {
    const { id: taskId } = await context.params;
    const db = await getDbReady();

    // Clone request body so we can record the issue report on task.formData even if a taskReport row exists
    const bodyClone = await req.clone().json().catch(() => ({}));
    const issueReason =
      typeof bodyClone?.reason === "string" && bodyClone.reason.trim()
        ? bodyClone.reason.trim()
        : "Client reported an issue with operative execution";

    const [taskRow] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (taskRow) {
      const prevFormData = (taskRow.formData as Record<string, any>) || {};
      const clientIssues = Array.isArray(prevFormData.clientIssues)
        ? prevFormData.clientIssues
        : [];
      clientIssues.unshift({
        id: `iss-${Date.now()}`,
        reason: issueReason,
        reportedBy: context.user.sub,
        agentId: taskRow.agentId,
        reportedAt: new Date().toISOString(),
        status: "OPEN",
      });
      await db
        .update(tasks)
        .set({
          formData: {
            ...prevFormData,
            clientIssues,
          },
          updatedAt: new Date(),
        })
        .where(eq(tasks.id, taskId));
    }

    const reports = await db
      .select()
      .from(taskReports)
      .where(eq(taskReports.taskId, taskId))
      .orderBy(desc(taskReports.createdAt))
      .limit(1);

    if (reports.length === 0) {
      if (!taskRow) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found." } },
          { status: 404 }
        );
      }

      await db
        .update(tasks)
        .set({ status: "DISPUTED", updatedAt: new Date() })
        .where(eq(tasks.id, taskId));

      await db.insert(notifications).values({
        userId: taskRow.userId,
        type: "ALERT",
        title: "Issue Report Logged with Task Control",
        body: `Your report on "${taskRow.title}" ("${issueReason}") has been logged for Central Operations review.`,
        taskId: taskRow.id,
      });

      return NextResponse.json({
        success: true,
        data: {
          taskId,
          status: "DISPUTED",
          reason: issueReason,
        },
        message: "Issue report filed and escalated to Central Operations.",
      });
    }

    return rejectReportHandler(req, {
      ...context,
      params: Promise.resolve({ id: taskId, reportId: reports[0].id }),
    });
  },
  { roles: ["USER", "ADMIN", "SUPER_ADMIN"] }
);
