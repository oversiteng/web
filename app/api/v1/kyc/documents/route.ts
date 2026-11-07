import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/v1/kyc/documents — Ingest Operative Accreditation Documents
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { documentType, s3ObjectKey, documentUrl, metadata } = body;

    const fileRef = s3ObjectKey || documentUrl;
    if (!documentType || !fileRef) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "documentType and s3ObjectKey (or documentUrl) are required.",
          },
        },
        { status: 400 }
      );
    }

    const validTypes = [
      "UTILITY_BILL",
      "PROOF_OF_ADDRESS",
      "GUARANTOR_FORM",
      "GOVERNMENT_ID",
      "CAC_CERTIFICATE",
      "BAR_PRACTICING_LICENSE",
    ];

    const normalizedType = String(documentType).toUpperCase();
    if (!validTypes.includes(normalizedType)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid documentType. Permitted types: ${validTypes.join(", ")}.`,
          },
        },
        { status: 400 }
      );
    }

    const db = await getDbReady();

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found." } },
        { status: 404 }
      );
    }

    const currentUser = existingUsers[0];
    const prevDocs = (currentUser.accreditationDocuments as Record<string, any>) || {};

    const now = new Date();
    const docEntry = {
      type: normalizedType,
      fileRef,
      uploadedAt: now.toISOString(),
      metadata: metadata || null,
      status: "SUBMITTED",
    };

    const updatedDocs = {
      ...prevDocs,
      [normalizedType.toLowerCase()]: docEntry,
    };

    const isAddressDoc = ["UTILITY_BILL", "PROOF_OF_ADDRESS"].includes(normalizedType);

    await db
      .update(users)
      .set({
        accreditationDocuments: updatedDocs,
        addressVerificationStatus: isAddressDoc ? "submitted" : currentUser.addressVerificationStatus,
        updatedAt: now,
      })
      .where(eq(users.id, user.sub));

    return NextResponse.json<ApiResponse<typeof docEntry>>({
      success: true,
      data: docEntry,
      message: `${normalizedType} uploaded successfully and attached to operative accreditation file.`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
});
