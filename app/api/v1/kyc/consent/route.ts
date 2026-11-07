import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/v1/kyc/consent — Operative Accreditation Background Check & Compliance Consent
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      consentBackgroundCheck,
      consentTermsAndConditions,
      signatureFullName,
    } = body;

    if (!consentBackgroundCheck || !consentTermsAndConditions) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Explicit consent for background checks and Oversite code of conduct is mandatory for operative accreditation.",
          },
        },
        { status: 400 }
      );
    }

    if (
      !signatureFullName ||
      typeof signatureFullName !== "string" ||
      signatureFullName.trim().length < 3
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "signatureFullName is required to legally attest compliance consent.",
          },
        },
        { status: 400 }
      );
    }

    const db = await getDbReady();
    const now = new Date();

    const [updatedUser] = await db
      .update(users)
      .set({
        consentSignedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, user.sub))
      .returning({
        id: users.id,
        name: users.name,
        consentSignedAt: users.consentSignedAt,
      });

    return NextResponse.json<
      ApiResponse<{
        userId: string;
        signatureFullName: string;
        consentSignedAt: string;
        verified: boolean;
      }>
    >({
      success: true,
      data: {
        userId: updatedUser.id,
        signatureFullName: signatureFullName.trim(),
        consentSignedAt: now.toISOString(),
        verified: true,
      },
      message: "Background check and compliance consent recorded successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
});
