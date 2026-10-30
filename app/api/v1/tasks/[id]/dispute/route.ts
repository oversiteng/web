import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { taskReports } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { POST as rejectReportHandler } from "../reports/[reportId]/reject/route";

// POST /api/v1/tasks/:id/dispute — Convenience forwarder for task-level dispute
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, context) => {
    const { id: taskId } = await context.params;
    const db = await getDbReady();

    const reports = await db
      .select()
      .from(taskReports)
      .where(eq(taskReports.taskId, taskId))
      .orderBy(desc(taskReports.createdAt))
      .limit(1);

    if (reports.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "No report found to dispute for this task." } },
        { status: 404 }
      );
    }

    return rejectReportHandler(req, {
      ...context,
      params: Promise.resolve({ id: taskId, reportId: reports[0].id }),
    });
  },
  { roles: ["USER", "ADMIN", "SUPER_ADMIN"] }
);
