import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse, PaginatedResponse } from "@/lib/types/api";
import { DueDiligenceDossier, RiskRating } from "@/lib/types/task";
import { getDb } from "@/lib/db/client";
import { dueDiligenceDossiers, tasks } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

const db = getDb();

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  // Normal users only see their own dossiers; admins see all
  const isSuper = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const baseQuery = db
    .select({
      id: dueDiligenceDossiers.id,
      taskId: dueDiligenceDossiers.taskId,
      riskRating: dueDiligenceDossiers.riskRating,
      anonymized: dueDiligenceDossiers.anonymized,
      dossierPdfS3Key: dueDiligenceDossiers.dossierPdfS3Key,
      findings: dueDiligenceDossiers.findings,
      createdAt: dueDiligenceDossiers.createdAt,
      updatedAt: dueDiligenceDossiers.updatedAt,
    })
    .from(dueDiligenceDossiers)
    .innerJoin(tasks, eq(dueDiligenceDossiers.taskId, tasks.id));

  const whereCondition = isSuper ? undefined : eq(tasks.userId, user.sub);

  const [dbDossiers, totalCountResult] = await Promise.all([
    baseQuery
      .where(whereCondition)
      .orderBy(desc(dueDiligenceDossiers.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(dueDiligenceDossiers)
      .innerJoin(tasks, eq(dueDiligenceDossiers.taskId, tasks.id))
      .where(whereCondition),
  ]);

  const total = Number(totalCountResult[0]?.count || 0);
  const totalPages = Math.ceil(total / limit);

  const formattedDossiers: DueDiligenceDossier[] = dbDossiers.map((d) => ({
    id: d.id,
    taskId: d.taskId,
    riskRating: d.riskRating as RiskRating | null,
    anonymized: d.anonymized,
    dossierPdfS3Key: d.dossierPdfS3Key,
    findings: d.findings as Record<string, unknown> | null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return NextResponse.json<PaginatedResponse<DueDiligenceDossier>>({
    success: true,
    data: formattedDossiers,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { targetName, targetType, cacNumber, address, objectives, targetCompany, jurisdiction } = body;

    const finalTargetName = targetName || targetCompany;
    if (!finalTargetName) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "targetName or targetCompany is required" },
        },
        { status: 400 }
      );
    }

    // 1. Create task entry with module DUE_DILIGENCE
    const [createdTask] = await db
      .insert(tasks)
      .values({
        userId: user.sub,
        moduleType: "DUE_DILIGENCE",
        title: `Due Diligence: ${finalTargetName}`,
        description: objectives || `Comprehensive due diligence investigation for ${finalTargetName} (${targetType || "Corporate entity"}).`,
        status: "PENDING",
        formData: {
          targetName: finalTargetName,
          targetType: targetType || "CORPORATE",
          cacNumber: cacNumber || null,
          jurisdiction: jurisdiction || "Nigeria",
          address: address || null,
        },
      })
      .returning();

    // 2. Initialize due diligence dossier record
    const [createdDossier] = await db
      .insert(dueDiligenceDossiers)
      .values({
        taskId: createdTask.id,
        riskRating: "LOW",
        anonymized: false,
        findings: {
          targetName: finalTargetName,
          targetType: targetType || "CORPORATE",
          cacNumber: cacNumber || null,
          address: address || null,
          objectives: objectives || null,
        },
      })
      .returning();

    const formatted: DueDiligenceDossier = {
      id: createdDossier.id,
      taskId: createdDossier.taskId,
      riskRating: createdDossier.riskRating as RiskRating | null,
      anonymized: createdDossier.anonymized,
      dossierPdfS3Key: createdDossier.dossierPdfS3Key,
      findings: createdDossier.findings as Record<string, unknown> | null,
      createdAt: createdDossier.createdAt.toISOString(),
      updatedAt: createdDossier.updatedAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<DueDiligenceDossier>>(
      {
        success: true,
        data: formatted,
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
});
