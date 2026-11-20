import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskReport, ReportStatus } from "@/lib/types/task";
import { getDbReady } from "@/lib/db/client";
import { taskReports, reportMedia, tasks, taskChats } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const POST = withAuth(
  async (req: NextRequest, { user }) => {
    try {
      const body = await req.json();
      const { taskId, summary, findings, completionPct, media } = body;

      if (!taskId || !summary) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "VALIDATION_ERROR", message: "taskId and summary are required" },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();
      const [taskRow] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);

      if (!taskRow) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found." } },
          { status: 404 }
        );
      }

      const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
      if (!isAdmin && taskRow.agentId !== user.sub) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Only the assigned operative can submit reports for this task.",
            },
          },
          { status: 403 }
        );
      }

      const watermarkCode =
        "OVS-RPT-" +
        crypto
          .createHash("sha256")
          .update(taskId + Date.now().toString())
          .digest("hex")
          .substring(0, 10)
          .toUpperCase();

      const [newReport] = await db
        .insert(taskReports)
        .values({
          taskId,
          agentId: user.sub,
          summary,
          findings,
          watermarkCode,
          status: "SUBMITTED",
          completionPct: completionPct || 100,
        })
        .returning();

      const mediaUrls: string[] = [];
      if (media && Array.isArray(media) && media.length > 0) {
        for (const m of media) {
          if (m?.url) mediaUrls.push(String(m.url));
        }
        await db.insert(reportMedia).values(
          media.map((m: any) => ({
            reportId: newReport.id,
            mediaUrl: m.url,
            mediaType: m.type || "image",
            latitude: m.lat,
            longitude: m.lng,
          }))
        );
      }

      // Intercepted by Admin first: insert a FINAL_SUBMISSION card in taskChats with PENDING_REVIEW
      if (taskRow) {
        const cardPayload = JSON.stringify({
          cardType: "FINAL_SUBMISSION",
          milestoneTitle: `Final Inspection Report: ${taskRow.title || "Task"}`,
          stageDetails: summary,
          status: "Pending Admin Approval",
          mediaUrls,
          targetLink: `/dashboard/tasks/${taskId}#report`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
        });

        await db.insert(taskChats).values({
          taskId,
          senderId: user.sub,
          receiverId: taskRow.userId,
          rawMessage: cardPayload,
          message: cardPayload,
          moderationStatus: "PENDING_REVIEW",
          messageType: "MILESTONE_UPDATE",
        });
      }

      const createdReport: TaskReport = {
        ...newReport,
        status: newReport.status as ReportStatus,
        compiledAt: newReport.compiledAt ? newReport.compiledAt.toISOString() : null,
        userReviewedAt: newReport.userReviewedAt ? newReport.userReviewedAt.toISOString() : null,
        createdAt: newReport.createdAt.toISOString(),
        updatedAt: newReport.updatedAt.toISOString(),
      };

      return NextResponse.json<ApiResponse<TaskReport>>(
        {
          success: true,
          data: createdReport,
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
  { roles: ["AGENT", "ADMIN"] }
);
