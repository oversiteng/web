import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { realtimeBridge } from "@/lib/realtime/websocketHandlers";
import { sendEmailAsync } from "@/lib/services/mailService";

export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id: targetUserId } = await params;
      const body = await req.json().catch(() => ({}));
      const reviewNote =
        typeof body?.kycNote === "string" && body.kycNote.trim()
          ? body.kycNote.trim()
          : typeof body?.rejectionReason === "string" && body.rejectionReason.trim()
          ? body.rejectionReason.trim()
          : null;

      const db = await getDbReady();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (existing.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
          { status: 404 }
        );
      }

      const now = new Date();
      const currentDocs =
        existing[0].accreditationDocuments &&
        typeof existing[0].accreditationDocuments === "object"
          ? { ...(existing[0].accreditationDocuments as Record<string, any>) }
          : {};

      for (const k of Object.keys(currentDocs)) {
        if (
          k !== "bankVerification" &&
          currentDocs[k] &&
          typeof currentDocs[k] === "object"
        ) {
          currentDocs[k] = {
            ...currentDocs[k],
            status: "VERIFIED",
            reviewedAt: now.toISOString(),
            rejectionReason: null,
          };
        }
      }
      currentDocs.kycReviewNote = reviewNote;
      currentDocs.kycReviewedAt = now.toISOString();

      const [verifiedUser] = await db
        .update(users)
        .set({
          kycStatus: "VERIFIED",
          ninVerificationStatus: "verified",
          addressVerificationStatus: "verified",
          accreditationDocuments: currentDocs,
          updatedAt: now,
        })
        .where(eq(users.id, targetUserId))
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          kycStatus: users.kycStatus,
          ninVerificationStatus: users.ninVerificationStatus,
          updatedAt: users.updatedAt,
        });

      const notifTitle = "KYC & Field Accreditation Approved";
      const notifBody = reviewNote
        ? `Your Oversite accreditation has been verified. Central Operations note: "${reviewNote}"`
        : "Your Oversite identity and compliance credentials have been verified by Central Operations. You are now eligible for priority task dispatch.";

      const [insertedNotif] = await db
        .insert(notifications)
        .values({
          userId: targetUserId,
          type: "SYSTEM",
          title: notifTitle,
          body: notifBody,
        })
        .returning();

      await realtimeBridge
        .publish({
          channel: `notifications:user:${targetUserId}`,
          event: "notification",
          payload: {
            id: insertedNotif.id,
            type: "SYSTEM",
            title: notifTitle,
            body: notifBody,
            createdAt: now.toISOString(),
          },
        })
        .catch(() => {});

      await sendEmailAsync({
        to: verifiedUser.email,
        subject: "Oversite Field Accreditation Verified",
        template: "GENERAL_ALERT",
        payload: {
          title: notifTitle,
          message: notifBody,
        },
      }).catch(() => {});

      return NextResponse.json<ApiResponse<{
        id: string;
        email: string;
        kycStatus: string;
        ninVerificationStatus: string;
      }>>({
        success: true,
        data: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          kycStatus: verifiedUser.kycStatus,
          ninVerificationStatus: verifiedUser.ninVerificationStatus,
        },
        message: `Account for ${verifiedUser.email} has been manually verified by Admin`,
      });
    } catch (error) {
      console.error("Admin Manual Verify Error:", error);
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
