import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskReports, reportMedia, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// POST /api/v1/admin/tasks/:id/reports/:reportId/compile — Mission Control Official Dossier Compilation
export const POST = withAuth<{ id: string; reportId: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId, reportId } = await params;
      const body = await req.json().catch(() => ({}));
      const { officialNotes, customWatermark } = body;

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

      const report = existingReports[0];

      // Official watermarking & PDF S3 key allocation
      const watermarkCode =
        customWatermark ||
        "OVS-DOSS-" +
          crypto
            .createHash("sha256")
            .update(reportId + taskId + Date.now().toString())
            .digest("hex")
            .substring(0, 10)
            .toUpperCase();

      const pdfS3Key = `dossiers/${task.moduleType.toLowerCase()}/${taskId}/${reportId}-official.pdf`;
      const notes = officialNotes || "Compiled and verified by Oversite Central Operations QA.";
      const now = new Date();

      // Update Report to UNDER_REVIEW (released for client final review)
      const [compiledReport] = await db
        .update(taskReports)
        .set({
          status: "UNDER_REVIEW",
          watermarkCode,
          pdfS3Key,
          officialNotes: notes,
          compiledAt: now,
          compiledBy: user.sub,
          updatedAt: now,
        })
        .where(eq(taskReports.id, reportId))
        .returning();

      // Update Task status to UNDER_REVIEW
      await db
        .update(tasks)
        .set({
          status: "UNDER_REVIEW",
          updatedAt: now,
        })
        .where(eq(tasks.id, taskId));

      // Send institutional notification to User
      await db.insert(notifications).values({
        userId: task.userId,
        type: "TASK_UPDATE",
        title: "Official Verified Dossier Ready",
        body: `Central Operations has compiled and certified the official field dossier for "${task.title}". Tap to review and confirm satisfaction.`,
        taskId: task.id,
      });

      // Fetch attached media
      const media = await db
        .select()
        .from(reportMedia)
        .where(eq(reportMedia.reportId, reportId));

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          reportId: compiledReport.id,
          taskId: compiledReport.taskId,
          status: compiledReport.status,
          watermarkCode: compiledReport.watermarkCode,
          pdfS3Key: compiledReport.pdfS3Key,
          officialNotes: compiledReport.officialNotes,
          compiledAt: now.toISOString(),
          compiledBy: user.sub,
          taskStatus: "UNDER_REVIEW",
          mediaCount: media.length,
        },
        message: "Report compiled into official Oversite dossier and released for user review.",
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
