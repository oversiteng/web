import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { enable } = body;

    if (typeof enable !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "enable boolean flag is required" },
        },
        { status: 400 }
      );
    }

    return NextResponse.json<
      ApiResponse<{
        twoFactorEnabled: boolean;
        message: string;
      }>
    >({
      success: true,
      data: {
        twoFactorEnabled: enable,
        message: enable
          ? "Two-factor authentication has been enabled."
          : "Two-factor authentication has been disabled.",
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
