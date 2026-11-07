import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { taskReports, tasks, users, reportMedia } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/v1/admin/reports/pending — Mission Control Queue of Uncompiled Field Reports
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const db = await getDbReady();

      const pendingReports = await db
        .select({
          id: taskReports.id,
          taskId: taskReports.taskId,
          agentId: taskReports.agentId,
          agentName: users.name,
          agentEmail: users.email,
          taskTitle: tasks.title,
          moduleType: tasks.moduleType,
          summary: taskReports.summary,
          findings: taskReports.findings,
          severity: taskReports.severity,
          completionPct: taskReports.completionPct,
          watermarkCode: taskReports.watermarkCode,
          status: taskReports.status,
          createdAt: taskReports.createdAt,
        })
        .from(taskReports)
        .innerJoin(tasks, eq(taskReports.taskId, tasks.id))
        .innerJoin(users, eq(taskReports.agentId, users.id))
        .where(eq(taskReports.status, "SUBMITTED"))
        .orderBy(desc(taskReports.createdAt));

      return NextResponse.json<ApiResponse<typeof pendingReports>>({
        success: true,
        data: pendingReports,
        message: `Retrieved ${pendingReports.length} pending field report(s) awaiting compilation.`,
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
