import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskReport, ReportStatus } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { taskReports, reportMedia, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const db = getDb();

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

      const watermarkCode = "OVS-RPT-" + crypto.createHash('sha256').update(taskId + Date.now().toString()).digest('hex').substring(0, 10).toUpperCase();

      const [newReport] = await db.insert(taskReports).values({
        taskId,
        agentId: user.sub,
        summary,
        findings,
        watermarkCode,
        status: "SUBMITTED",
        completionPct: completionPct || 100,
      }).returning();

      if (media && Array.isArray(media) && media.length > 0) {
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

      await db.update(tasks).set({ status: "REPORT_SUBMITTED" }).where(eq(tasks.id, taskId));

      const createdReport: TaskReport = {
        ...newReport,
        status: newReport.status as ReportStatus,
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
