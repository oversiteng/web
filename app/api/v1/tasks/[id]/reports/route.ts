import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskReport, ReportStatus } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { taskReports, reportMedia, tasks, notifications } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import crypto from "crypto";

// POST /api/v1/tasks/:id/reports — Operative Dynamic Field Report Ingestion
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const {
        summary,
        findings,
        checklist,
        measurements,
        severity,
        incidentalExpenses,
        metadata,
        completionPct,
        offlineCapturedAt,
        media,
      } = body;

      if (!summary || typeof summary !== "string" || !summary.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Summary is required to submit an operative field report.",
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
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Task not found." },
          },
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
            error: {
              code: "FORBIDDEN",
              message: "Only the accredited operative assigned to this task or Mission Control can submit field reports.",
            },
          },
          { status: 403 }
        );
      }

      const validSeverities = ["NONE", "MINOR", "MODERATE", "CRITICAL"];
      const reportSeverity = severity && validSeverities.includes(severity.toUpperCase())
        ? severity.toUpperCase()
        : "NONE";

      const watermarkCode =
        "OVS-RAW-" +
        crypto
          .createHash("sha256")
          .update(taskId + user.sub + Date.now().toString())
          .digest("hex")
          .substring(0, 10)
          .toUpperCase();

      const createdAtDate = offlineCapturedAt ? new Date(offlineCapturedAt) : new Date();

      const [newReport] = await db
        .insert(taskReports)
        .values({
          taskId,
          agentId: user.sub,
          summary: summary.trim(),
          findings: findings ? findings.trim() : null,
          checklist: checklist || null,
          measurements: measurements || null,
          severity: reportSeverity,
          incidentalExpenses: incidentalExpenses || null,
          metadata: metadata || null,
          watermarkCode,
          status: "SUBMITTED",
          completionPct: completionPct !== undefined ? Math.min(100, Math.max(0, Number(completionPct))) : 100,
          createdAt: createdAtDate,
          updatedAt: new Date(),
        })
        .returning();

      let attachedMedia: any[] = [];
      if (media && Array.isArray(media) && media.length > 0) {
        const mediaToInsert = media.map((m: any) => ({
          reportId: newReport.id,
          mediaUrl: m.url || m.mediaUrl || m.s3ObjectKey,
          mediaType: m.type || m.mediaType || "image/jpeg",
          latitude: m.lat !== undefined ? String(m.lat) : (m.latitude !== undefined ? String(m.latitude) : null),
          longitude: m.lng !== undefined ? String(m.lng) : (m.longitude !== undefined ? String(m.longitude) : null),
          caption: m.caption || null,
          capturedAt: m.capturedAt ? new Date(m.capturedAt) : createdAtDate,
        }));

        attachedMedia = await db.insert(reportMedia).values(mediaToInsert).returning();
      }

      // Advance task status to REPORT_SUBMITTED
      await db
        .update(tasks)
        .set({ status: "REPORT_SUBMITTED", updatedAt: new Date() })
        .where(eq(tasks.id, taskId));

      // Notify User and Mission Control
      await db.insert(notifications).values({
        userId: task.userId,
        type: "TASK_UPDATE",
        title: "Field Report Received by Central Operations",
        body: `Operative has uploaded field observations for "${task.title}". Central Operations is now compiling your official verified dossier.`,
        taskId: task.id,
      });

      const responsePayload: TaskReport = {
        ...newReport,
        status: newReport.status as ReportStatus,
        compiledAt: newReport.compiledAt ? newReport.compiledAt.toISOString() : null,
        userReviewedAt: newReport.userReviewedAt ? newReport.userReviewedAt.toISOString() : null,
        createdAt: newReport.createdAt.toISOString(),
        updatedAt: newReport.updatedAt.toISOString(),
        media: attachedMedia.map((m) => ({
          id: m.id,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
          latitude: m.latitude ? parseFloat(m.latitude) : null,
          longitude: m.longitude ? parseFloat(m.longitude) : null,
          caption: m.caption,
          capturedAt: m.capturedAt ? m.capturedAt.toISOString() : null,
        })),
      };

      return NextResponse.json<ApiResponse<TaskReport>>(
        {
          success: true,
          data: responsePayload,
          message: "Field report submitted to Mission Control for official compilation.",
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
  },
  { roles: ["AGENT", "ADMIN", "SUPER_ADMIN"] }
);

// GET /api/v1/tasks/:id/reports — Retrieve Task Reports with Institutional Privacy Controls
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
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Task not found." },
          },
          { status: 404 }
        );
      }

      const task = existingTasks[0];
      const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(user.role);
      const isAssignedAgent = task.agentId === user.sub;
      const isOwner = task.userId === user.sub;

      if (!isAdmin && !isAssignedAgent && !isOwner) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "You are not authorized to view reports for this task.",
            },
          },
          { status: 403 }
        );
      }

      // Fetch reports
      const reports = await db
        .select()
        .from(taskReports)
        .where(eq(taskReports.taskId, taskId))
        .orderBy(desc(taskReports.createdAt));

      // Filter reports for USER: only see compiled/certified dossiers (UNDER_REVIEW, APPROVED)
      const visibleReports = reports.filter((r) => {
        if (isAdmin || isAssignedAgent) return true;
        // User only sees released dossiers
        return ["UNDER_REVIEW", "APPROVED"].includes(r.status);
      });

      // Fetch attached media for visible reports
      const reportIds = visibleReports.map((r) => r.id);
      let mediaMap: Record<string, any[]> = {};

      if (reportIds.length > 0) {
        const allMedia = await db
          .select()
          .from(reportMedia)
          .where(inArray(reportMedia.reportId, reportIds));

        for (const m of allMedia) {
          if (!mediaMap[m.reportId]) mediaMap[m.reportId] = [];
          mediaMap[m.reportId].push({
            id: m.id,
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
            latitude: m.latitude ? parseFloat(m.latitude) : null,
            longitude: m.longitude ? parseFloat(m.longitude) : null,
            caption: m.caption,
            capturedAt: m.capturedAt ? m.capturedAt.toISOString() : null,
          });
        }
      }

      const formattedReports: TaskReport[] = visibleReports.map((r) => ({
        ...r,
        status: r.status as ReportStatus,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        compiledAt: r.compiledAt ? r.compiledAt.toISOString() : null,
        userReviewedAt: r.userReviewedAt ? r.userReviewedAt.toISOString() : null,
        media: mediaMap[r.id] || [],
      }));

      return NextResponse.json<ApiResponse<TaskReport[]>>({
        success: true,
        data: formattedReports,
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
  { roles: ["USER", "AGENT", "ADMIN", "SUPER_ADMIN"] }
);
