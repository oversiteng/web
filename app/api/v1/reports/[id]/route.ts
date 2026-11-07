import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskReport, ReportStatus } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { taskReports, reportMedia, tasks } from "@/db/schema";
import { eq, or } from "drizzle-orm";

const db = getDb();

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    const isSuper = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    const [report] = await db
      .select({
        id: taskReports.id,
        taskId: taskReports.taskId,
        agentId: taskReports.agentId,
        summary: taskReports.summary,
        findings: taskReports.findings,
        checklist: taskReports.checklist,
        measurements: taskReports.measurements,
        severity: taskReports.severity,
        incidentalExpenses: taskReports.incidentalExpenses,
        metadata: taskReports.metadata,
        pdfS3Key: taskReports.pdfS3Key,
        watermarkCode: taskReports.watermarkCode,
        status: taskReports.status,
        completionPct: taskReports.completionPct,
        officialNotes: taskReports.officialNotes,
        compiledAt: taskReports.compiledAt,
        compiledBy: taskReports.compiledBy,
        userReviewedAt: taskReports.userReviewedAt,
        createdAt: taskReports.createdAt,
        updatedAt: taskReports.updatedAt,
        taskUserId: tasks.userId,
      })
      .from(taskReports)
      .innerJoin(tasks, eq(taskReports.taskId, tasks.id))
      .where(or(eq(taskReports.id, params.id), eq(taskReports.taskId, params.id)))
      .limit(1);

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Report not found" },
        },
        { status: 404 }
      );
    }

    if (!isSuper && report.taskUserId !== user.sub && report.agentId !== user.sub) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Not authorized to view this report" },
        },
        { status: 403 }
      );
    }

    // Also fetch any attached media
    const media = await db
      .select()
      .from(reportMedia)
      .where(eq(reportMedia.reportId, report.id));

    const formattedReport: TaskReport & { media?: any[] } = {
      id: report.id,
      taskId: report.taskId,
      agentId: report.agentId,
      summary: report.summary,
      findings: report.findings,
      checklist: report.checklist,
      measurements: report.measurements,
      severity: report.severity,
      incidentalExpenses: report.incidentalExpenses,
      metadata: report.metadata,
      pdfS3Key: report.pdfS3Key,
      watermarkCode: report.watermarkCode,
      status: report.status as ReportStatus,
      completionPct: report.completionPct,
      officialNotes: report.officialNotes,
      compiledAt: report.compiledAt ? report.compiledAt.toISOString() : null,
      compiledBy: report.compiledBy,
      userReviewedAt: report.userReviewedAt ? report.userReviewedAt.toISOString() : null,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      media,
    };

    return NextResponse.json<ApiResponse<typeof formattedReport>>({
      success: true,
      data: formattedReport,
    });
  }
);

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    const isSuper = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    if (!isSuper) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Only administrators can review and approve reports" },
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, officialNotes } = body;

    const [updated] = await db
      .update(taskReports)
      .set({
        status: status || "APPROVED",
        officialNotes: officialNotes || null,
        compiledAt: new Date(),
        compiledBy: user.sub,
        updatedAt: new Date(),
      })
      .where(eq(taskReports.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Report not found" },
        },
        { status: 404 }
      );
    }

    // If report approved, advance task to COMPLETED or REPORT_SUBMITTED
    if (status === "APPROVED") {
      await db
        .update(tasks)
        .set({ status: "REPORT_SUBMITTED", updatedAt: new Date() })
        .where(eq(tasks.id, updated.taskId));
    }

    return NextResponse.json<ApiResponse<{ id: string; status: string }>>({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
      },
    });
  }
);
