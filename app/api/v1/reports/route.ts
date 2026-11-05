import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PaginatedResponse } from "@/lib/types/api";
import { TaskReport, ReportStatus } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { taskReports, tasks } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

const db = getDb();

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status") as ReportStatus | null;
  const taskId = searchParams.get("taskId");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  const isSuper = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const isAgent = user.role === "AGENT";

  const conditions = [];

  if (isSuper) {
    // Admin can see all reports
  } else if (isAgent) {
    conditions.push(eq(taskReports.agentId, user.sub));
  } else {
    // Client can only see reports for tasks they own
    conditions.push(eq(tasks.userId, user.sub));
  }

  if (status) {
    conditions.push(eq(taskReports.status, status));
  }
  if (taskId) {
    conditions.push(eq(taskReports.taskId, taskId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [dbReports, totalCountResult] = await Promise.all([
    db
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
      })
      .from(taskReports)
      .innerJoin(tasks, eq(taskReports.taskId, tasks.id))
      .where(whereClause)
      .orderBy(desc(taskReports.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(taskReports)
      .innerJoin(tasks, eq(taskReports.taskId, tasks.id))
      .where(whereClause),
  ]);

  const total = Number(totalCountResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  const formattedReports: TaskReport[] = dbReports.map((r) => ({
    id: r.id,
    taskId: r.taskId,
    agentId: r.agentId,
    summary: r.summary,
    findings: r.findings,
    checklist: r.checklist,
    measurements: r.measurements,
    severity: r.severity,
    incidentalExpenses: r.incidentalExpenses,
    metadata: r.metadata,
    pdfS3Key: r.pdfS3Key,
    watermarkCode: r.watermarkCode,
    status: r.status as ReportStatus,
    completionPct: r.completionPct,
    officialNotes: r.officialNotes,
    compiledAt: r.compiledAt ? r.compiledAt.toISOString() : null,
    compiledBy: r.compiledBy,
    userReviewedAt: r.userReviewedAt ? r.userReviewedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return NextResponse.json<PaginatedResponse<TaskReport>>({
    success: true,
    data: formattedReports,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});
