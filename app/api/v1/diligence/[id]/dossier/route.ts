import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    // TODO: Verify permissions & return pre-signed download URL for dossier PDF
    const dossierUrl = `https://storage.oversite.ng/dossiers/${params.id}-confidential.pdf`;

    return NextResponse.json<ApiResponse<{ dossierUrl: string; confidentialityNotice: string }>>({
      success: true,
      data: {
        dossierUrl,
        confidentialityNotice:
          "This document is privileged and strictly confidential. Unauthorized dissemination is prohibited.",
      },
    });
  }
);
