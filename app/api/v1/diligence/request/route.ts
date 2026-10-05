import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDb } from "@/lib/db/client";
import { tasks, dueDiligenceDossiers } from "@/db/schema";
import { ApiResponse } from "@/lib/types/api";

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { tier, subjectName, subjectType, cacNumber, anonymizeRequest } = body;

    if (!subjectName || !subjectType || !tier) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Tier, Subject Name, and Subject Type are required." },
        },
        { status: 400 }
      );
    }

    const db = getDb();

    // Execute within a transaction to ensure both the Task and Dossier are created together
    const result = await db.transaction(async (tx) => {
      // 1. Create the base Task for the Due Diligence request
      const [newTask] = await tx.insert(tasks).values({
        userId: user.sub,
        moduleType: "DUE_DILIGENCE",
        status: "PENDING",
        priority: "high",
        title: `Due Diligence: ${subjectName}`,
        description: `Tier: ${tier} | Type: ${subjectType} | CAC: ${cacNumber || "N/A"}`,
        formData: { tier, subjectName, subjectType, cacNumber },
        priceNgn: "50000.00", // Standard base price for Diligence, will be adjusted by tier in a real scenario
      }).returning();

      // 2. Initialize the highly confidential Dossier record
      const [newDossier] = await tx.insert(dueDiligenceDossiers).values({
        taskId: newTask.id,
        anonymized: Boolean(anonymizeRequest),
      }).returning();

      return {
        task: {
          id: newTask.id,
          status: newTask.status,
          title: newTask.title,
        },
        dossier: {
          id: newDossier.id,
          anonymized: newDossier.anonymized,
          riskRating: newDossier.riskRating,
        }
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
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
