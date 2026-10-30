import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskReports, reportMedia, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { enqueueJob } from "@/lib/queue/backgroundQueue";
import crypto from "crypto";

// POST /api/v1/tasks/:id/report/sync — Offline-First Operative Report Syncing
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId } = await params;
      const body = await req.json();
      const {
        offlineCapturedAt,
        summary,
        findings,
        checklist,
        measurements,
        severity,
        incidentalExpenses,
        metadata,
        completionPct,
        media,
      } = body;

      if (!summary || !summary.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Summary is required to sync an operative report.",
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
              message: "Only the assigned field operative or Mission Control can sync report data.",
            },
          },
          { status: 403 }
        );
      }

      const watermarkCode =
        "OVS-SYNC-" +
        crypto
          .createHash("sha256")
          .update(taskId + user.sub + Date.now().toString())
          .digest("hex")
          .substring(0, 10)
          .toUpperCase();

      const capturedAtDate = offlineCapturedAt
        ? new Date(offlineCapturedAt)
        : new Date();

      const [report] = await db
        .insert(taskReports)
        .values({
          taskId,
          agentId: user.sub,
          summary: summary.trim(),
          findings: findings || null,
          checklist: checklist || null,
          measurements: measurements || null,
          severity: severity || "NONE",
          incidentalExpenses: incidentalExpenses || null,
          metadata: metadata || null,
          watermarkCode,
          status: "SUBMITTED",
          completionPct: completionPct !== undefined ? Number(completionPct) : 100,
          createdAt: capturedAtDate,
          updatedAt: new Date(),
        })
        .returning();

      // Insert Media Evidence
      if (media && Array.isArray(media) && media.length > 0) {
        const mediaValues = media.map((m: any) => ({
          reportId: report.id,
          mediaUrl: m.s3ObjectKey || m.mediaUrl || m.url,
          mediaType: m.mediaType || m.type || "image/jpeg",
          latitude: m.latitude !== undefined ? String(m.latitude) : (m.lat !== undefined ? String(m.lat) : null),
          longitude: m.longitude !== undefined ? String(m.longitude) : (m.lng !== undefined ? String(m.lng) : null),
          caption: m.caption || null,
          capturedAt: m.capturedAt ? new Date(m.capturedAt) : capturedAtDate,
        }));

        await db.insert(reportMedia).values(mediaValues);
      }

      // Update task status
      await db
        .update(tasks)
        .set({ status: "REPORT_SUBMITTED", updatedAt: new Date() })
        .where(eq(tasks.id, taskId));

      // Notify User
      await db.insert(notifications).values({
        userId: task.userId,
        type: "TASK_UPDATE",
        title: "Field Report Synchronized",
        body: `Operative observations for "${task.title}" have synchronized with Central Operations.`,
        taskId: task.id,
      });

      // Enqueue PDF generation job in the background (failsafe)
      try {
        await enqueueJob({
          type: "GENERATE_WATERMARK_PDF",
          data: { reportId: report.id },
        });
      } catch (qErr) {
        console.warn("Queue notice:", (qErr as Error).message);
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            reportId: report.id,
            status: report.status,
            watermarkCode: report.watermarkCode,
            offlineCapturedAt: capturedAtDate.toISOString(),
          },
          message: "Report synchronized successfully. Central Operations compilation queued.",
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
