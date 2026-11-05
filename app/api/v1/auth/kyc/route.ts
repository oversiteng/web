import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

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

    const db = await getDbReady();
    const now = new Date();

    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    const prevDocs = (existing?.accreditationDocuments as Record<string, any>) || {};

    await db
      .update(users)
      .set({
        kycStatus: "SUBMITTED",
        accreditationDocuments: {
          ...prevDocs,
          idType,
          idNumber,
          documentUrl: documentUrl || null,
          selfieUrl: selfieUrl || null,
          submittedAt: now.toISOString(),
        },
        updatedAt: now,
      })
      .where(eq(users.id, user.sub));

    return NextResponse.json<ApiResponse<{ status: string; submittedAt: string }>>({
      success: true,
      data: {
        status: "SUBMITTED",
        submittedAt: now.toISOString(),
      },
      message: "KYC documentation submitted successfully for compliance review.",
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
