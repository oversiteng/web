import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PaginatedResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { tasks, taskReports, reportMedia, dueDiligenceDossiers } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const db = getDb();

export interface VaultDocItem {
  id: string;
  name: string;
  category: "property" | "documents" | "diligence";
  type: "PDF" | "IMAGE" | "DOCUMENT";
  fileUrl: string;
  taskId?: string;
  taskTitle?: string;
  createdAt: string;
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const vaultDocs: VaultDocItem[] = [];

    // 1. Fetch user's tasks
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, user.sub));

    const taskIds = userTasks.map((t) => t.id);
    const taskMap = new Map(userTasks.map((t) => [t.id, t]));

    if (taskIds.length > 0) {
      // 2. Fetch task reports & report media
      for (const taskId of taskIds) {
        const task = taskMap.get(taskId)!;
        const reports = await db
          .select()
          .from(taskReports)
          .where(eq(taskReports.taskId, taskId));

        for (const r of reports) {
          vaultDocs.push({
            id: `rpt-${r.id}`,
            name: `${task.title} - Final Report.pdf`,
            category: task.moduleType === "DUE_DILIGENCE" ? "diligence" : "property",
            type: "PDF",
            fileUrl: `/api/v1/reports/${r.id}/pdf`,
            taskId: task.id,
            taskTitle: task.title,
            createdAt: r.createdAt.toISOString(),
          });

          // Report Media
          const media = await db
            .select()
            .from(reportMedia)
            .where(eq(reportMedia.reportId, r.id));

          for (const m of media) {
            vaultDocs.push({
              id: `med-${m.id}`,
              name: `Inspection Media (${m.mediaType})`,
              category: "property",
              type: m.mediaType === "video" ? "DOCUMENT" : "IMAGE",
              fileUrl: m.mediaUrl,
              taskId: task.id,
              taskTitle: task.title,
              createdAt: m.createdAt.toISOString(),
            });
          }
        }

        // 3. Due Diligence Dossiers
        const dossiers = await db
          .select()
          .from(dueDiligenceDossiers)
          .where(eq(dueDiligenceDossiers.taskId, taskId));

        for (const d of dossiers) {
          if (d.dossierPdfS3Key) {
            vaultDocs.push({
              id: `dos-${d.id}`,
              name: `${task.title} - Confidential Dossier.pdf`,
              category: "diligence",
              type: "PDF",
              fileUrl: `/api/v1/diligence/${d.id}/dossier`,
              taskId: task.id,
              taskTitle: task.title,
              createdAt: d.createdAt.toISOString(),
            });
          }
        }
      }
    }

    // Sort descending by date
    vaultDocs.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const filtered = category
      ? vaultDocs.filter((d) => d.category === category)
      : vaultDocs;

    return NextResponse.json<PaginatedResponse<VaultDocItem>>({
      success: true,
      data: filtered.slice(0, limit),
      pagination: {
        page: 1,
        limit,
        total: filtered.length,
        totalPages: 1,
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
});
