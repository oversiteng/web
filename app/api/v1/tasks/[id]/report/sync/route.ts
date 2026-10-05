import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { tasks, taskReports, reportMedia } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyToken, JwtPayload } from "@/lib/auth/jwt";
import { enqueueJob } from "@/lib/queue/backgroundQueue";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Missing or invalid token" } },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken<JwtPayload>(token);
    if (!decoded || !decoded.sub) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const taskId = resolvedParams.id;
    const body = await req.json();
    const { offlineCapturedAt, summary, findings, completionPct, media } = body;

    // Manual Validation
    if (!summary || completionPct === undefined || !Array.isArray(media)) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Missing required report fields" } },
        { status: 400 }
      );
    }

    const db = getDb();

    // Verify task exists and is assigned to this agent
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.agentId, decoded.sub)))
      .limit(1);

    if (!task) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Task not found or not assigned to you" } },
        { status: 404 }
      );
    }

    // Insert Report
    const [report] = await db.insert(taskReports).values({
      taskId,
      agentId: decoded.sub,
      summary,
      findings: findings || null,
      status: "SUBMITTED",
      completionPct: Number(completionPct),
      createdAt: offlineCapturedAt ? new Date(offlineCapturedAt) : new Date(),
    }).returning();

    // Insert Media Evidence
    if (media.length > 0) {
      const mediaValues = media.map((m: any) => ({
        reportId: report.id,
        mediaUrl: m.s3ObjectKey, // Maps to the S3 URL uploaded by the Flutter app
        mediaType: m.mediaType || "image/jpeg",
        latitude: m.latitude ? String(m.latitude) : null,
        longitude: m.longitude ? String(m.longitude) : null,
        capturedAt: m.capturedAt ? new Date(m.capturedAt) : new Date(),
      }));

      await db.insert(reportMedia).values(mediaValues);
    }

    // Enqueue PDF generation job in the background
    await enqueueJob({
      type: "GENERATE_WATERMARK_PDF",
      data: { reportId: report.id },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          reportId: report.id,
          status: report.status,
        },
        message: "Report synchronized successfully. PDF generation queued.",
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
}
