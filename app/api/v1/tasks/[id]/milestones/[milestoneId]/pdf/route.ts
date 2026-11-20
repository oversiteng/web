import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { tasks, taskMilestones } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateWatermarkedReportPdf } from "@/lib/services/pdfGenerator";
import { formatOperativeCode } from "@/lib/services/pricing";
import { extractMilestoneMeta } from "../../route";

export const runtime = "nodejs";

// GET /api/v1/tasks/:id/milestones/:milestoneId/pdf — Watermarked Milestone PDF Report
export const GET = withAuth<{ id: string; milestoneId: string }>(
  async (req: NextRequest, { user, params }) => {
    try {
      const { id: taskId, milestoneId } = await params;
      const db = await getDbReady();

      const [task] = await db
        .select()
        .from(tasks)
        .where(eq(tasks.id, taskId))
        .limit(1);

      if (!task) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Task not found." } },
          { status: 404 }
        );
      }

      const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
      if (!isAdmin && task.userId !== user.sub && task.agentId !== user.sub) {
        return NextResponse.json(
          { success: false, error: { code: "FORBIDDEN", message: "Access denied." } },
          { status: 403 }
        );
      }

      const [milestone] = await db
        .select()
        .from(taskMilestones)
        .where(
          and(eq(taskMilestones.id, milestoneId), eq(taskMilestones.taskId, taskId))
        )
        .limit(1);

      if (!milestone) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Milestone not found." } },
          { status: 404 }
        );
      }

      const meta = extractMilestoneMeta(milestone.checklist);
      const watermarkCode = `OVS-MS-${milestone.id.slice(0, 8).toUpperCase()}`;

      const pdfBuffer = await generateWatermarkedReportPdf({
        reportId: milestone.id,
        watermarkCode,
        taskTitle: `${task.title} — Milestone: ${milestone.title}`,
        moduleType: task.moduleType,
        locationAddress: task.locationAddress || "Not specified",
        operativeCode: task.agentId ? formatOperativeCode(task.agentId) : "UNASSIGNED",
        status: milestone.status,
        severity: "NORMAL",
        completionPct: milestone.completionPct ?? 0,
        summary: milestone.description || `Milestone progress report for ${milestone.title}.`,
        findings: meta.agentNote || null,
        officialNotes: `Milestone #${(milestone.orderIndex ?? 0) + 1} certified by Oversite Operations.`,
        measurements: null,
        checklist: meta.items,
        compiledAt: (milestone.updatedAt || new Date()).toISOString(),
      });

      const download = req.nextUrl.searchParams.get("download") === "1";

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `${download ? "attachment" : "inline"}; filename="oversite-milestone-${milestone.id.slice(0, 8)}.pdf"`,
          "Cache-Control": "private, no-store, max-age=0",
        },
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
  }
);

