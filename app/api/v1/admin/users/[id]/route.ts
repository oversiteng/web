import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users, agentProfiles, agentWallets, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { formatOperativeCode } from "@/lib/services/pricing";

export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id: targetUserId } = await params;
      const db = await getDbReady();

      const userRecords = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          title: users.title,
          address: users.address,
          location: users.location,
          occupation: users.occupation,
          state: users.state,
          country: users.country,
          role: users.role,
          kycStatus: users.kycStatus,
          ninVerificationStatus: users.ninVerificationStatus,
          nbaVerificationStatus: users.nbaVerificationStatus,
          addressVerificationStatus: users.addressVerificationStatus,
          accreditationDocuments: users.accreditationDocuments,
          consentSignedAt: users.consentSignedAt,
          avatarUrl: users.avatarUrl,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, targetUserId))
        .limit(1);

      if (userRecords.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
          { status: 404 }
        );
      }

      const rawDocs =
        userRecords[0].accreditationDocuments &&
        typeof userRecords[0].accreditationDocuments === "object"
          ? { ...(userRecords[0].accreditationDocuments as Record<string, any>) }
          : {};
      delete rawDocs.withdrawalPinHash;
      delete rawDocs.withdrawalPinUpdatedAt;

      const userProfile: any = {
        ...userRecords[0],
        operativeCode:
          userRecords[0].role === "AGENT" ? formatOperativeCode(userRecords[0].id) : null,
        accreditationDocuments: rawDocs,
        consentSignedAt: userRecords[0].consentSignedAt
          ? userRecords[0].consentSignedAt.toISOString()
          : null,
        createdAt: userRecords[0].createdAt.toISOString(),
        updatedAt: userRecords[0].updatedAt.toISOString(),
      };

      if (userProfile.role === "AGENT") {
        const [agentRecords, walletRecords] = await Promise.all([
          db
            .select()
            .from(agentProfiles)
            .where(eq(agentProfiles.userId, targetUserId))
            .limit(1),
          db
            .select()
            .from(agentWallets)
            .where(eq(agentWallets.agentId, targetUserId))
            .limit(1),
        ]);

        if (agentRecords.length > 0) {
          userProfile.agentProfile = {
            ...agentRecords[0],
            createdAt: agentRecords[0].createdAt.toISOString(),
            updatedAt: agentRecords[0].updatedAt.toISOString(),
          };
        }
        if (walletRecords.length > 0) {
          userProfile.wallet = {
            balanceNgn: parseFloat(walletRecords[0].balanceNgn || "0"),
            totalEarnedNgn: parseFloat(walletRecords[0].totalEarnedNgn || "0"),
          };
        }
      }

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: userProfile,
        message: "User details retrieved successfully",
      });
    } catch (error) {
      console.error("Admin Get User Error:", error);
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);

// PATCH /api/v1/admin/users/:id — Update KYC Status, Document Statuses, Agent Tier, or NIN/NBA verification
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params }) => {
    try {
      const { id: targetUserId } = await params;
      const body = await req.json();
      const {
        kycStatus,
        ninVerificationStatus,
        nbaVerificationStatus,
        addressVerificationStatus,
        agentTier,
        documentKey,
        documentStatus,
        rejectionReason,
        role,
      } = body;

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

      const targetUser = existing[0];
      const now = new Date();
      const userUpdates: Record<string, any> = { updatedAt: now };

      if (kycStatus && ["PENDING", "SUBMITTED", "VERIFIED", "REJECTED"].includes(kycStatus)) {
        userUpdates.kycStatus = kycStatus;
        if (kycStatus === "VERIFIED") {
          userUpdates.ninVerificationStatus = "verified";
          userUpdates.addressVerificationStatus = "verified";
          const currentDocs =
            targetUser.accreditationDocuments &&
            typeof targetUser.accreditationDocuments === "object"
              ? { ...(targetUser.accreditationDocuments as Record<string, any>) }
              : {};
          for (const k of Object.keys(currentDocs)) {
            if (currentDocs[k] && typeof currentDocs[k] === "object") {
              currentDocs[k] = {
                ...currentDocs[k],
                status: "VERIFIED",
                reviewedAt: now.toISOString(),
                rejectionReason: null,
              };
            }
          }
          userUpdates.accreditationDocuments = currentDocs;
        }
      }
      if (ninVerificationStatus) userUpdates.ninVerificationStatus = ninVerificationStatus;
      if (nbaVerificationStatus) userUpdates.nbaVerificationStatus = nbaVerificationStatus;
      if (addressVerificationStatus)
        userUpdates.addressVerificationStatus = addressVerificationStatus;
      if (role && ["USER", "AGENT", "ADMIN", "SUPER_ADMIN"].includes(role)) {
        userUpdates.role = role;
      }

      if (documentKey && documentStatus) {
        const docs =
          (userUpdates.accreditationDocuments as Record<string, any>) ||
          (targetUser.accreditationDocuments &&
          typeof targetUser.accreditationDocuments === "object"
            ? { ...(targetUser.accreditationDocuments as Record<string, any>) }
            : {});
        if (docs[documentKey] && typeof docs[documentKey] === "object") {
          docs[documentKey] = {
            ...docs[documentKey],
            status: documentStatus,
            reviewedAt: now.toISOString(),
            rejectionReason: documentStatus === "REJECTED" ? rejectionReason : undefined,
          };
          userUpdates.accreditationDocuments = docs;

          if (documentStatus === "REJECTED") {
            await db.insert(notifications).values({
              userId: targetUserId,
              type: "ALERT",
              title: `${documentKey.replace(/_/g, " ").toUpperCase()} Rejected`,
              body: rejectionReason
                ? `Rejection reason: ${rejectionReason}. Please re-submit.`
                : "Please re-submit a clearer document copy in your verification portal.",
            });
          }
        }
      }

      const [updatedUser] = await db
        .update(users)
        .set(userUpdates)
        .where(eq(users.id, targetUserId))
        .returning();

      // Update Agent Tier if provided
      if (
        agentTier &&
        [
          "GENERAL",
          "TECHNICAL_SUPERVISOR",
          "INVESTIGATOR",
          "LEGAL_COUNSEL",
          "ENFORCEMENT_LIAISON",
        ].includes(agentTier)
      ) {
        const existingProfile = await db
          .select()
          .from(agentProfiles)
          .where(eq(agentProfiles.userId, targetUserId))
          .limit(1);

        if (existingProfile.length > 0) {
          await db
            .update(agentProfiles)
            .set({ tier: agentTier as any, updatedAt: now })
            .where(eq(agentProfiles.userId, targetUserId));
        } else {
          await db.insert(agentProfiles).values({
            userId: targetUserId,
            tier: agentTier as any,
          });
        }
      }

      // Send notification on KYC status change
      if (kycStatus === "VERIFIED") {
        await db.insert(notifications).values({
          userId: targetUserId,
          type: "SYSTEM",
          title: "KYC & Accreditation Verified",
          body: "Your Oversite identity and compliance credentials have been verified by Central Operations.",
        });
      } else if (kycStatus === "REJECTED") {
        await db.insert(notifications).values({
          userId: targetUserId,
          type: "ALERT",
          title: "KYC Verification Action Required",
          body:
            rejectionReason ||
            "One or more of your KYC accreditation documents require re-submission. Please check your verification portal.",
        });
      }

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          id: updatedUser.id,
          kycStatus: updatedUser.kycStatus,
          ninVerificationStatus: updatedUser.ninVerificationStatus,
          nbaVerificationStatus: updatedUser.nbaVerificationStatus,
          addressVerificationStatus: updatedUser.addressVerificationStatus,
          agentTier: agentTier || undefined,
        },
        message: "User profile and accreditation updated successfully.",
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
