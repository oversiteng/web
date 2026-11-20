import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "@/lib/auth/jwt";
import { extractBearerToken } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { taskReports, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatOperativeCode } from "@/lib/services/pricing";
import { generateWatermarkedReportPdf } from "@/lib/services/pdfGenerator";

export const runtime = "nodejs";

/**
 * GET /api/v1/reports/[id]/pdf
 * Generates a live watermarked PDF dossier using pdfkit.
 * - Default / ?inline=1: Serves inline (Content-Disposition: inline) for in-app viewing.
 * - ?format=json: Returns metadata + in-app view URL.
 * - ?download=1: Attachment download (blocked for ADMIN/SUPER_ADMIN per Zero-Exfiltration DLP).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    let token = extractBearerToken(req);
    if (!token) {
      token = req.nextUrl.searchParams.get("token");
    }
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const user = verifyToken<JwtPayload>(token);
    if (!user?.sub) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Invalid token" },
        },
        { status: 401 }
      );
    }

    const db = await getDbReady();
    const rows = await db
      .select({
        report: taskReports,
        taskTitle: tasks.title,
        taskModule: tasks.moduleType,
        taskLocation: tasks.locationAddress,
        taskUserId: tasks.userId,
        taskAgentId: tasks.agentId,
      })
      .from(taskReports)
      .innerJoin(tasks, eq(taskReports.taskId, tasks.id))
      .where(eq(taskReports.id, id))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Report not found" },
        },
        { status: 404 }
      );
    }

    const { report, taskTitle, taskModule, taskLocation, taskUserId, taskAgentId } =
      rows[0];

    const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
    const isOwner = taskUserId === user.sub;
    const isAssignedAgent = taskAgentId === user.sub || report.agentId === user.sub;

    if (!isAdmin && !isOwner && !isAssignedAgent) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "Access denied to this dossier" },
        },
        { status: 403 }
      );
    }

    const watermarkCode =
      report.watermarkCode ||
      `OVS-DOSS-${report.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

    const format = req.nextUrl.searchParams.get("format");
    if (format === "json") {
      return NextResponse.json({
        success: true,
        data: {
          viewUrl: `/api/v1/reports/${report.id}/pdf?inline=1`,
          watermarkCode,
        },
      });
    }

    const wantsDownload =
      req.nextUrl.searchParams.get("download") === "1" && !isAdmin;

    const pdfBuffer = await generateWatermarkedReportPdf({
      reportId: report.id,
      watermarkCode,
      taskTitle,
      moduleType: taskModule,
      locationAddress: taskLocation || "Nigeria",
      operativeCode: formatOperativeCode(report.agentId),
      status: report.status,
      severity: report.severity || "NONE",
      completionPct: report.completionPct,
      summary: report.summary,
      findings: report.findings,
      officialNotes: report.officialNotes,
      measurements: report.measurements,
      checklist: report.checklist,
      compiledAt: (report.compiledAt || report.updatedAt || new Date()).toISOString(),
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${
          wantsDownload ? "attachment" : "inline"
        }; filename="Oversite-Dossier-${watermarkCode}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[GET /api/v1/reports/[id]/pdf] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate report PDF.",
        },
      },
      { status: 500 }
    );
  }
}
