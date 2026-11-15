import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { taskReports, tasks, users, reportMedia } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { resolveTaskDualPricing, formatOperativeCode } from "@/lib/services/pricing";

// GET /api/v1/admin/reports/pending — Mission Control Queue of Field Reports
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const db = await getDbReady();
      const statusFilter = req.nextUrl.searchParams.get("status") || "SUBMITTED";

      const whereClause =
        statusFilter === "ALL"
          ? undefined
          : eq(taskReports.status, statusFilter as any);

      const reports = await db
        .select({
          id: taskReports.id,
          taskId: taskReports.taskId,
          agentId: taskReports.agentId,
          agentName: users.name,
          agentEmail: users.email,
          taskTitle: tasks.title,
          moduleType: tasks.moduleType,
          taskPriceNgn: tasks.priceNgn,
          taskPricingBreakdown: tasks.pricingBreakdown,
          taskFormData: tasks.formData,
          summary: taskReports.summary,
          findings: taskReports.findings,
          checklist: taskReports.checklist,
          measurements: taskReports.measurements,
          incidentalExpenses: taskReports.incidentalExpenses,
          severity: taskReports.severity,
          completionPct: taskReports.completionPct,
          watermarkCode: taskReports.watermarkCode,
          officialNotes: taskReports.officialNotes,
          userRejectionReason: taskReports.userRejectionReason,
          status: taskReports.status,
          createdAt: taskReports.createdAt,
        })
        .from(taskReports)
        .innerJoin(tasks, eq(taskReports.taskId, tasks.id))
        .innerJoin(users, eq(taskReports.agentId, users.id))
        .where(whereClause)
        .orderBy(desc(taskReports.createdAt));

      const reportIds = reports.map((r) => r.id);
      const mediaRows =
        reportIds.length > 0
          ? await db
              .select()
              .from(reportMedia)
              .where(inArray(reportMedia.reportId, reportIds))
          : [];

      const enriched = reports.map((r) => {
        const dual = resolveTaskDualPricing({
          priceNgn: r.taskPriceNgn,
          pricingBreakdown: r.taskPricingBreakdown,
          formData: r.taskFormData,
        });
        return {
          ...r,
          operativeCode: formatOperativeCode(r.agentId),
          clientPriceNgn: dual.clientPriceNgn,
          agentPayoutNgn: dual.agentPayoutNgn,
          platformMarginNgn: dual.platformMarginNgn,
          media: mediaRows.filter((m) => m.reportId === r.id),
        };
      });

      return NextResponse.json<ApiResponse<typeof enriched>>({
        success: true,
        data: enriched,
        message: `Retrieved ${enriched.length} field report(s).`,
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
