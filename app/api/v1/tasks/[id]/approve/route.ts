import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { taskReports } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { POST as approveReportHandler } from "../reports/[reportId]/approve/route";

// POST /api/v1/tasks/:id/approve — Convenience forwarder for task-level approval
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
        { success: false, error: { code: "NOT_FOUND", message: "No report found to approve for this task." } },
        { status: 404 }
      );
    }

    return approveReportHandler(req, {
      ...context,
      params: Promise.resolve({ id: taskId, reportId: reports[0].id }),
    });
  },
  { roles: ["USER", "ADMIN", "SUPER_ADMIN"] }
);
