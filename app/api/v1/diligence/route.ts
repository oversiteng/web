import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse, PaginatedResponse } from "@/lib/types/api";
import { DueDiligenceDossier } from "@/lib/types/task";

export const GET = withAuth(async (req: NextRequest) => {
  // TODO: Fetch due diligence investigations
  const mockDossiers: DueDiligenceDossier[] = [];

  return NextResponse.json<PaginatedResponse<DueDiligenceDossier>>({
    success: true,
    data: mockDossiers,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  });
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { targetName, targetType, cacNumber, address, objectives } = body;

    if (!targetName || !targetType) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "targetName and targetType are required" },
        },
        { status: 400 }
      );
    }

    // TODO: Create task with moduleType = 'DUE_DILIGENCE' and initialize dossier record
    const mockDossier: DueDiligenceDossier = {
      id: "00000000-0000-0000-0000-000000000099",
      taskId: "00000000-0000-0000-0000-000000000022",
      riskRating: "LOW",
      anonymized: false,
      findings: {
        targetName,
        targetType,
        cacNumber,
        address,
        objectives,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<DueDiligenceDossier>>(
      {
        success: true,
        data: mockDossier,
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
