import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { LegalConsultation } from "@/lib/types/task";

export const GET = withAuth(async (req: NextRequest, { user }) => {
  // TODO: Fetch user's legal consultations
  const mockConsultations: LegalConsultation[] = [];

  return NextResponse.json<ApiResponse<LegalConsultation[]>>({
    success: true,
    data: mockConsultations,
  });
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { lawyerAgentId, scheduledAt, durationMins, notes } = body;

    if (!lawyerAgentId || !scheduledAt) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "lawyerAgentId and scheduledAt are required" },
        },
        { status: 400 }
      );
    }

    // TODO: Create task and legal_consultations record
    const created: LegalConsultation = {
      id: "00000000-0000-0000-0000-000000000090",
      taskId: "00000000-0000-0000-0000-000000000021",
      lawyerAgentId,
      scheduledAt,
      durationMins: durationMins || 60,
      retainerAmountNgn: 50000,
      status: "SCHEDULED",
      notes,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<LegalConsultation>>(
      {
        success: true,
        data: created,
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
