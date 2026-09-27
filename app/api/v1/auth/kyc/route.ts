import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { idType, idNumber, documentUrl, selfieUrl } = body;

    if (!idType || !idNumber) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "ID type and ID number are required" },
        },
        { status: 400 }
      );
    }

    // TODO: Update user.kycStatus to 'SUBMITTED' and insert audit record into db

    return NextResponse.json<ApiResponse<{ status: string; submittedAt: string }>>({
      success: true,
      data: {
        status: "SUBMITTED",
        submittedAt: new Date().toISOString(),
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
