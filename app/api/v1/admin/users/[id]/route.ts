import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import {
  users,
  agentProfiles,
  agentWallets,
  payoutTransactions,
  tasks,
  payments,
  notifications,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatOperativeCode } from "@/lib/services/pricing";

const ACTIVE_TASK_STATUSES = new Set([
  "PENDING",
  "MATCHED",
  "AGENT_EN_ROUTE",
  "AGENT_ON_SITE",
  "IN_PROGRESS",
  "REPORT_SUBMITTED",
  "UNDER_REVIEW",
]);

const PAID_PAYMENT_STATUSES = new Set([
  "AUTHORIZED",
  "CAPTURED",
  "ESCROWED",
  "RELEASED",
]);

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
        const [agentRecords, walletRecords, payoutRecords, agentTaskRecords] =
          await Promise.all([
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
            db
              .select()
              .from(payoutTransactions)
              .where(eq(payoutTransactions.agentId, targetUserId))
              .orderBy(desc(payoutTransactions.createdAt))
              .limit(25),
            db
              .select({
                id: tasks.id,
                title: tasks.title,
                moduleType: tasks.moduleType,
                status: tasks.status,
                priceNgn: tasks.priceNgn,
                pricingBreakdown: tasks.pricingBreakdown,
                locationAddress: tasks.locationAddress,
                createdAt: tasks.createdAt,
                completedAt: tasks.completedAt,
              })
              .from(tasks)
              .where(eq(tasks.agentId, targetUserId))
              .orderBy(desc(tasks.createdAt))
              .limit(25),
          ]);

        if (agentRecords.length > 0) {
          userProfile.agentProfile = {
            ...agentRecords[0],
            createdAt: agentRecords[0].createdAt.toISOString(),
            updatedAt: agentRecords[0].updatedAt.toISOString(),
          };
        }

        const walletBalanceNgn =
          walletRecords.length > 0 ? parseFloat(walletRecords[0].balanceNgn || "0") : 0;
        const totalEarnedNgn =
          walletRecords.length > 0 ? parseFloat(walletRecords[0].totalEarnedNgn || "0") : 0;

        userProfile.wallet = {
          balanceNgn: walletBalanceNgn,
          totalEarnedNgn,
        };

        const payouts = payoutRecords.map((p) => ({
          id: p.id,
          amountNgn: parseFloat(p.amountNgn || "0"),
          bankCode: p.bankCode,
          accountNumber: p.accountNumber,
          gatewayRef: p.gatewayRef,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
          processedAt: p.processedAt ? p.processedAt.toISOString() : null,
        }));

        const totalPaidOutNgn = payouts
          .filter((p) => p.status === "COMPLETED")
          .reduce((sum, p) => sum + p.amountNgn, 0);
        const pendingPayoutsNgn = payouts
          .filter((p) => p.status === "PENDING" || p.status === "PROCESSING")
          .reduce((sum, p) => sum + p.amountNgn, 0);

        const taskHistory = agentTaskRecords.map((t) => {
          const breakdown = (t.pricingBreakdown as Record<string, any>) || {};
          const agentPayoutNgn =
            typeof breakdown.agentPayoutNgn === "number"
              ? breakdown.agentPayoutNgn
              : parseFloat(t.priceNgn || "0");
          return {
            id: t.id,
            title: t.title,
            moduleType: t.moduleType,
            status: t.status,
            amountNgn: agentPayoutNgn,
            locationAddress: t.locationAddress,
            createdAt: t.createdAt.toISOString(),
            completedAt: t.completedAt ? t.completedAt.toISOString() : null,
          };
        });

        const completedTasks = taskHistory.filter((t) => t.status === "COMPLETED").length;
        const activeTasks = taskHistory.filter((t) => ACTIVE_TASK_STATUSES.has(t.status)).length;
        const disputedTasks = taskHistory.filter((t) => t.status === "DISPUTED").length;
        const totalTasks = Math.max(
          taskHistory.length,
          agentRecords[0]?.totalTasks || 0
        );
        const completionRate =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        userProfile.bankVerification = rawDocs.bankVerification || {
          status: agentRecords[0]?.bankAccountNumber ? "PENDING" : "NOT_SUBMITTED",
          note: null,
          reviewedAt: null,
        };
        userProfile.payouts = payouts;
        userProfile.taskHistory = taskHistory;
        userProfile.agentStats = {
          totalTasks,
          completedTasks,
          activeTasks,
          disputedTasks,
          completionRate,
          rating: parseFloat(agentRecords[0]?.rating || "0"),
          walletBalanceNgn,
          totalEarnedNgn,
          totalPaidOutNgn,
          pendingPayoutsNgn,
        };
        userProfile.subscription = {
          plan: "Standard Operative",
          status: "COMING_SOON",
          tier: agentRecords[0]?.tier || "GENERAL",
        };
      } else if (userProfile.role === "USER") {
        const [userTaskRecords, paymentRecords] = await Promise.all([
          db
            .select({
              id: tasks.id,
              title: tasks.title,
              moduleType: tasks.moduleType,
              status: tasks.status,
              priceNgn: tasks.priceNgn,
              locationAddress: tasks.locationAddress,
              createdAt: tasks.createdAt,
              completedAt: tasks.completedAt,
            })
            .from(tasks)
            .where(eq(tasks.userId, targetUserId))
            .orderBy(desc(tasks.createdAt))
            .limit(25),
          db
            .select()
            .from(payments)
            .where(eq(payments.userId, targetUserId))
            .orderBy(desc(payments.createdAt))
            .limit(25),
        ]);

        const taskHistory = userTaskRecords.map((t) => ({
          id: t.id,
          title: t.title,
          moduleType: t.moduleType,
          status: t.status,
          amountNgn: parseFloat(t.priceNgn || "0"),
          locationAddress: t.locationAddress,
          createdAt: t.createdAt.toISOString(),
          completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        }));

        const paymentHistory = paymentRecords.map((p) => ({
          id: p.id,
          taskId: p.taskId,
          amountNgn: parseFloat(p.amountNgn || "0"),
          gateway: p.gateway,
          gatewayRef: p.gatewayRef,
          status: p.status,
          createdAt: p.createdAt.toISOString(),
        }));

        const tasksRequested = taskHistory.length;
        const tasksSuccessful = taskHistory.filter((t) => t.status === "COMPLETED").length;
        const tasksActive = taskHistory.filter((t) => ACTIVE_TASK_STATUSES.has(t.status)).length;
        const tasksCancelled = taskHistory.filter(
          (t) => t.status === "CANCELLED" || t.status === "DISPUTED"
        ).length;

        const amountSpentOnCreditsNgn = paymentHistory
          .filter((p) => PAID_PAYMENT_STATUSES.has(p.status))
          .reduce((sum, p) => sum + p.amountNgn, 0);

        const creditBalance =
          typeof rawDocs.creditBalance === "number" ? rawDocs.creditBalance : 0;
        const creditsSpent =
          typeof rawDocs.creditsSpent === "number"
            ? rawDocs.creditsSpent
            : Math.round(amountSpentOnCreditsNgn / 1000);

        userProfile.taskHistory = taskHistory;
        userProfile.paymentHistory = paymentHistory;
        userProfile.userStats = {
          tasksRequested,
          tasksSuccessful,
          tasksActive,
          tasksCancelled,
          successRate:
            tasksRequested > 0 ? Math.round((tasksSuccessful / tasksRequested) * 100) : 0,
          creditBalance,
          creditsSpent,
          amountSpentOnCreditsNgn,
          userType: rawDocs.userTier || "Individual Client",
        };
        userProfile.subscription = {
          plan: rawDocs.subscriptionPlan || "Standard Client",
          status: "COMING_SOON",
          tier: rawDocs.userTier || "Standard",
        };
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

// PATCH /api/v1/admin/users/:id — Update KYC Status, Document Statuses, Bank Verification, Agent Tier, or NIN/NBA verification
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
        bankVerificationStatus,
        bankVerificationNote,
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

      // Bank Account Name Verification & Warning Notification
      if (
        bankVerificationStatus &&
        ["VERIFIED", "REJECTED", "WARNING", "PENDING"].includes(bankVerificationStatus)
      ) {
        const docs =
          (userUpdates.accreditationDocuments as Record<string, any>) ||
          (targetUser.accreditationDocuments &&
          typeof targetUser.accreditationDocuments === "object"
            ? { ...(targetUser.accreditationDocuments as Record<string, any>) }
            : {});

        docs.bankVerification = {
          status: bankVerificationStatus,
          note: bankVerificationNote || null,
          reviewedAt: now.toISOString(),
        };
        userUpdates.accreditationDocuments = docs;

        if (bankVerificationStatus === "VERIFIED") {
          await db.insert(notifications).values({
            userId: targetUserId,
            type: "SYSTEM",
            title: "Bank Account Details Verified",
            body: "Your payout bank account name has been verified to match your KYC documents. Withdrawals are enabled.",
          });
        } else if (bankVerificationStatus === "REJECTED") {
          await db.insert(notifications).values({
            userId: targetUserId,
            type: "ALERT",
            title: "Bank Account Verification Rejected",
            body:
              bankVerificationNote ||
              "Your submitted bank account name does not match the name on your KYC verification documents. Please update your payout bank details immediately.",
            metadata: { category: "BANK_VERIFICATION_WARNING", severity: "HIGH" },
          });
        } else if (bankVerificationStatus === "WARNING") {
          await db.insert(notifications).values({
            userId: targetUserId,
            type: "ALERT",
            title: "Action Required: Bank Account Name Mismatch Warning",
            body:
              bankVerificationNote ||
              "Central Operations flagged a discrepancy between your bank account name and your verified identity documents. Please review and update your bank details to avoid payout holds.",
            metadata: { category: "BANK_VERIFICATION_WARNING", severity: "WARNING" },
          });
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
          bankVerification: (updatedUser.accreditationDocuments as any)?.bankVerification || null,
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
