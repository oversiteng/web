import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    // TODO: Retrieve watermarked PDF from S3 or generate on the fly
    const downloadUrl = `https://storage.oversite.ng/reports/${params.id}-watermarked.pdf`;

    return NextResponse.json<ApiResponse<{ downloadUrl: string; watermarkCode: string }>>({
      success: true,
      data: {
        downloadUrl,
        watermarkCode: "OVS-RPT-889X1",
      },
    });
  }
);
