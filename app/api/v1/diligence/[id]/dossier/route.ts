import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { dueDiligenceDossiers, tasks } from "@/db/schema";
import { eq, or } from "drizzle-orm";

const db = getDb();

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { user, params }) => {
    const isSuper = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    const [dossier] = await db
      .select({
        id: dueDiligenceDossiers.id,
        taskId: dueDiligenceDossiers.taskId,
        riskRating: dueDiligenceDossiers.riskRating,
        anonymized: dueDiligenceDossiers.anonymized,
        dossierPdfS3Key: dueDiligenceDossiers.dossierPdfS3Key,
        findings: dueDiligenceDossiers.findings,
        taskUserId: tasks.userId,
        createdAt: dueDiligenceDossiers.createdAt,
      })
      .from(dueDiligenceDossiers)
      .innerJoin(tasks, eq(dueDiligenceDossiers.taskId, tasks.id))
      .where(or(eq(dueDiligenceDossiers.id, params.id), eq(dueDiligenceDossiers.taskId, params.id)))
      .limit(1);

    if (!dossier) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Due diligence dossier not found" },
        },
        { status: 404 }
      );
    }

    if (!isSuper && dossier.taskUserId !== user.sub) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "FORBIDDEN", message: "You are not authorized to view this confidential dossier" },
        },
        { status: 403 }
      );
    }

    const dossierUrl = dossier.dossierPdfS3Key
      ? `https://${process.env.AWS_S3_BUCKET || "oversite-vault"}.s3.amazonaws.com/${dossier.dossierPdfS3Key}`
      : `https://storage.oversite.ng/dossiers/${dossier.id}-confidential.pdf`;

    return NextResponse.json<ApiResponse<{
      id: string;
      taskId: string;
      riskRating: string | null;
      findings: any;
      dossierUrl: string;
      confidentialityNotice: string;
    }>>({
      success: true,
      data: {
        id: dossier.id,
        taskId: dossier.taskId,
        riskRating: dossier.riskRating,
        findings: dossier.findings,
        dossierUrl,
        confidentialityNotice:
          "This document is privileged and strictly confidential. Unauthorized dissemination is prohibited.",
      },
    });
  }
);
