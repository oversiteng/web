import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { TaskReport } from "@/lib/types/task";

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    // TODO: Fetch report along with media attachments from db
    const mockReport: TaskReport = {
      id: params.id,
      taskId: "00000000-0000-0000-0000-000000000020",
      agentId: "00000000-0000-0000-0000-000000000002",
      summary: "Detailed physical site inspection completed successfully.",
      findings: "All perimeter boundaries intact. No encroachment detected.",
      watermarkCode: "OVS-RPT-889X1",
      status: "APPROVED",
      completionPct: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<TaskReport>>({
      success: true,
      data: mockReport,
    });
  }
);

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    const body = await req.json();
    const { status, notes } = body; // status: 'APPROVED' | 'REJECTED'

    // TODO: Admin QA approval workflow; release escrow upon approval
    return NextResponse.json<ApiResponse<{ id: string; status: string }>>({
      success: true,
      data: {
        id: params.id,
        status: status || "APPROVED",
      },
    });
  },
  { roles: ["ADMIN"] }
);
