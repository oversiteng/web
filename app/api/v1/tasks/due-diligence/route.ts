import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDb } from "@/lib/db/client";
import { tasks, dueDiligenceDossiers } from "@/db/schema";
import { ApiResponse } from "@/lib/types/api";

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const {
      tier = "STANDARD",
      subjectType,
      subjectDetails,
      subjectName,
      cacNumber,
      anonymizeRequest = false,
      priceNgn,
    } = body;

    const resolvedName = subjectName || subjectDetails?.name || subjectDetails?.title || "Subject";
    const resolvedType = subjectType || subjectDetails?.type || "INDIVIDUAL";

    const db = getDb();

    const result = await db.transaction(async (tx) => {
      const [newTask] = await tx
        .insert(tasks)
        .values({
          userId: user.sub,
          moduleType: "DUE_DILIGENCE",
          status: "PENDING",
          priority: "high",
          title: `Due Diligence: ${resolvedName}`,
          description: `Tier: ${tier} | Type: ${resolvedType}`,
          formData: {
            tier,
            subjectType: resolvedType,
            subjectDetails,
            cacNumber,
          },
          priceNgn: priceNgn || "50000.00",
        })
        .returning();

      const [newDossier] = await tx
        .insert(dueDiligenceDossiers)
        .values({
          taskId: newTask.id,
          anonymized: Boolean(anonymizeRequest),
        })
        .returning();

      return {
        task: {
          id: newTask.id,
          status: newTask.status,
          title: newTask.title,
          priceNgn: newTask.priceNgn,
          createdAt: newTask.createdAt.toISOString(),
        },
        dossier: {
          id: newDossier.id,
          anonymized: newDossier.anonymized,
          riskRating: newDossier.riskRating,
        },
      };
    });

    return NextResponse.json<ApiResponse<typeof result>>(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    const fullErrorStr = `${error?.message || ""} ${error?.cause?.message || ""} ${error?.cause?.detail || ""}`;
    const errCode = error?.code || error?.cause?.code;

    if (errCode === "23503" || fullErrorStr.includes("foreign key constraint") || fullErrorStr.includes("tasks_user_id_users_id_fk")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User account associated with this session no longer exists in database. Please re-authenticate.",
          },
        },
        { status: 401 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: error?.message || String(error) },
      },
      { status: 500 }
    );
  }
});
