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
import { normalizeAgentTier } from "@/lib/constants/agentTypes";
import { realtimeBridge } from "@/lib/realtime/websocketHandlers";
import { sendEmailAsync } from "@/lib/services/mailService";

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
                formData: tasks.formData,
                locationAddress: tasks.locationAddress,
                createdAt: tasks.createdAt,
                completedAt: tasks.completedAt,
                updatedAt: tasks.updatedAt,
              })
              .from(tasks)
              .where(eq(tasks.agentId, targetUserId))
              .orderBy(desc(tasks.createdAt))
              .limit(40),
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

        const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
        const ratingsAndReports: Array<{
          id: string;
          taskId: string;
          taskTitle: string;
          moduleType: string;
          kind: "RATING" | "AUTO_GOOD_STANDING" | "ISSUE_REPORT";
          rating: number | null;
          comment: string;
          createdAt: string;
          status: string;
        }> = [];

        const taskHistory = agentTaskRecords.map((t) => {
          const breakdown = (t.pricingBreakdown as Record<string, any>) || {};
          const fd = (t.formData as Record<string, any>) || {};
          const agentPayoutNgn =
            typeof breakdown.agentPayoutNgn === "number"
              ? breakdown.agentPayoutNgn
              : parseFloat(t.priceNgn || "0");

          if (fd.clientRating) {
            ratingsAndReports.push({
              id: `rate-${t.id}`,
              taskId: t.id,
              taskTitle: t.title,
              moduleType: t.moduleType,
              kind: "RATING",
              rating: Number(fd.clientRating.rating || 5),
              comment:
                fd.clientRating.comment ||
                fd.clientRating.feedback ||
                "Client rated operative performance.",
              createdAt: fd.clientRating.ratedAt || t.createdAt.toISOString(),
              status: Number(fd.clientRating.rating || 5) <= 2 ? "LOW_RATING_FLAG" : "RECORDED",
            });
          } else if (t.status === "COMPLETED") {
            const compTime = t.completedAt
              ? t.completedAt.getTime()
              : t.updatedAt
              ? t.updatedAt.getTime()
              : t.createdAt.getTime();
            if (Date.now() - compTime > SEVEN_DAYS_MS) {
              ratingsAndReports.push({
                id: `auto-${t.id}`,
                taskId: t.id,
                taskTitle: t.title,
                moduleType: t.moduleType,
                kind: "AUTO_GOOD_STANDING",
                rating: 5,
                comment:
                  "Auto-verified 5.0 ★ after 7-day post-completion window elapsed with zero client disputes.",
                createdAt: (t.completedAt || t.createdAt).toISOString(),
                status: "AUTO_CREDITED",
              });
            }
          }

          if (Array.isArray(fd.clientIssues)) {
            for (const iss of fd.clientIssues) {
              ratingsAndReports.push({
                id: iss.id || `iss-${t.id}`,
                taskId: t.id,
                taskTitle: t.title,
                moduleType: t.moduleType,
                kind: "ISSUE_REPORT",
                rating: null,
                comment: iss.reason || "Client reported a deliverable discrepancy.",
                createdAt: iss.reportedAt || t.createdAt.toISOString(),
                status: iss.status || "OPEN",
              });
            }
          } else if (t.status === "DISPUTED") {
            ratingsAndReports.push({
              id: `disp-${t.id}`,
              taskId: t.id,
              taskTitle: t.title,
              moduleType: t.moduleType,
              kind: "ISSUE_REPORT",
              rating: 2,
              comment: "Task flagged as DISPUTED by client for Quality Control review.",
              createdAt: t.createdAt.toISOString(),
              status: "OPEN",
            });
          }

          return {
            id: t.id,
            title: t.title,
            moduleType: t.moduleType,
            status: t.status,
            amountNgn: agentPayoutNgn,
            locationAddress: t.locationAddress,
            clientRating: fd.clientRating || null,
            createdAt: t.createdAt.toISOString(),
            completedAt: t.completedAt ? t.completedAt.toISOString() : null,
          };
        });

        // Compute dynamic 7-day matured credibility/rating score
        const maturedScores = ratingsAndReports
          .map((r) => (r.rating !== null ? r.rating : r.kind === "ISSUE_REPORT" ? 2.0 : null))
          .filter((v): v is number => v !== null);
        const computedMaturedRating =
          maturedScores.length > 0
            ? Number(
                (
                  maturedScores.reduce((acc, s) => acc + s, 0) / maturedScores.length
                ).toFixed(2)
              )
            : parseFloat(agentRecords[0]?.rating || "5.0");

        userProfile.ratingsAndReports = ratingsAndReports;
        userProfile.disciplinaryLog = Array.isArray(rawDocs.disciplinaryLog)
          ? rawDocs.disciplinaryLog
          : [];

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
          rating: computedMaturedRating,
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
        emailVerified,
        disciplinaryAction,
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
      const currentDocs: Record<string, any> =
        targetUser.accreditationDocuments &&
        typeof targetUser.accreditationDocuments === "object"
          ? { ...(targetUser.accreditationDocuments as Record<string, any>) }
          : {};
      let docsChanged = false;
      const notificationsToSend: Array<{
        type: "SYSTEM" | "ALERT";
        title: string;
        body: string;
      }> = [];

      if (typeof emailVerified === "boolean") {
        currentDocs.emailVerified = emailVerified;
        currentDocs.emailVerifiedAt = emailVerified ? now.toISOString() : null;
        if (targetUser.role === "USER") {
          userUpdates.kycStatus = emailVerified ? "VERIFIED" : "PENDING";
        }
        docsChanged = true;
      }

      if (disciplinaryAction && typeof disciplinaryAction === "object") {
        const actionType = String(disciplinaryAction.actionType || "ISSUE_WARNING");
        const note = String(disciplinaryAction.note || "").trim();
        const targetDepartment = String(
          disciplinaryAction.targetDepartment || "Compliance & Legal Desk"
        );
        const logList = Array.isArray(currentDocs.disciplinaryLog)
          ? [...currentDocs.disciplinaryLog]
          : [];
        const entry = {
          id: `disc-${Date.now()}`,
          actionType,
          note:
            note ||
            (actionType === "ISSUE_WARNING"
              ? "Official compliance warning issued regarding recent task performance/report."
              : actionType === "REVOLVING_PROBATION"
              ? "Placed on 14-day revolving QA probation & mandatory deliverable audit."
              : `Escalated to ${targetDepartment} for specialized disciplinary review.`),
          targetDepartment: actionType === "ESCALATE_SPECIALIST" ? targetDepartment : null,
          taskId: disciplinaryAction.taskId || null,
          createdAt: now.toISOString(),
        };
        logList.unshift(entry);
        currentDocs.disciplinaryLog = logList;
        docsChanged = true;

        if (actionType === "SUSPEND_OPERATIVE") {
          userUpdates.isActive = false;
        }

        const notifTitle =
          actionType === "ISSUE_WARNING"
            ? "Official Conduct & Performance Warning"
            : actionType === "REVOLVING_PROBATION"
            ? "Notice: Revolving QA Probation Activated"
            : actionType === "ESCALATE_SPECIALIST"
            ? `Case Escalated to ${targetDepartment}`
            : "Account Suspended Pending Review";

        notificationsToSend.push({
          type: "ALERT",
          title: notifTitle,
          body: entry.note,
        });
      }
      if (typeof rejectionReason === "string") {
        currentDocs.kycReviewNote = rejectionReason.trim() || null;
        currentDocs.kycReviewedAt = now.toISOString();
        docsChanged = true;
      }

      if (kycStatus && ["PENDING", "SUBMITTED", "VERIFIED", "REJECTED"].includes(kycStatus)) {
        userUpdates.kycStatus = kycStatus;
        if (kycStatus === "VERIFIED") {
          userUpdates.ninVerificationStatus = "verified";
          userUpdates.addressVerificationStatus = "verified";
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
          docsChanged = true;
        }
      }
      if (ninVerificationStatus) {
        userUpdates.ninVerificationStatus = ninVerificationStatus;
        if (!documentKey) {
          const isApproved = ninVerificationStatus.toLowerCase() === "verified";
          notificationsToSend.push({
            type: isApproved ? "SYSTEM" : "ALERT",
            title: isApproved ? "NIN Verification Approved" : "NIN Verification Rejected",
            body: isApproved
              ? "Your 11-digit National Identification Number (NIN) has been verified by Central Operations."
              : rejectionReason
              ? `Your NIN verification was rejected: ${rejectionReason}`
              : "Your NIN verification was rejected. Please review and re-submit in your verification portal.",
          });
        }
      }
      if (nbaVerificationStatus) {
        userUpdates.nbaVerificationStatus = nbaVerificationStatus;
        const isApproved = nbaVerificationStatus.toLowerCase() === "verified";
        notificationsToSend.push({
          type: isApproved ? "SYSTEM" : "ALERT",
          title: isApproved ? "NBA Credentials Verified" : "NBA Verification Rejected",
          body: isApproved
            ? "Your Nigerian Bar Association (NBA) Supreme Court enrollment credential has been verified."
            : rejectionReason
            ? `Your NBA verification was rejected: ${rejectionReason}`
            : "Your NBA verification was rejected. Please re-submit your valid SCN and certificate.",
        });
      }
      if (addressVerificationStatus) {
        userUpdates.addressVerificationStatus = addressVerificationStatus;
        if (!documentKey) {
          const isApproved = addressVerificationStatus.toLowerCase() === "verified";
          notificationsToSend.push({
            type: isApproved ? "SYSTEM" : "ALERT",
            title: isApproved ? "Proof of Address Verified" : "Proof of Address Rejected",
            body: isApproved
              ? "Your residential address and utility bill have been verified by Central Operations."
              : rejectionReason
              ? `Your proof of address was rejected: ${rejectionReason}`
              : "Your proof of address requires re-submission.",
          });
        }
      }
      if (role && ["USER", "AGENT", "ADMIN", "SUPER_ADMIN"].includes(role)) {
        userUpdates.role = role;
      }

      if (documentKey && documentStatus) {
        const existingDocObj =
          currentDocs[documentKey] && typeof currentDocs[documentKey] === "object"
            ? currentDocs[documentKey]
            : { type: documentKey };
        currentDocs[documentKey] = {
          ...existingDocObj,
          status: documentStatus,
          reviewedAt: now.toISOString(),
          rejectionReason: documentStatus === "REJECTED" ? rejectionReason || null : null,
        };
        docsChanged = true;

        const readableDocLabel = documentKey
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());

        if (documentStatus === "REJECTED") {
          notificationsToSend.push({
            type: "ALERT",
            title: `${readableDocLabel} Rejected`,
            body: rejectionReason
              ? `Rejection reason: ${rejectionReason}. Please re-submit in your verification portal.`
              : `Your ${readableDocLabel} submission was rejected. Please upload a clearer document copy.`,
          });
        } else if (documentStatus === "VERIFIED") {
          notificationsToSend.push({
            type: "SYSTEM",
            title: `${readableDocLabel} Approved`,
            body: rejectionReason
              ? `Your ${readableDocLabel} has been verified. Note: ${rejectionReason}`
              : `Your ${readableDocLabel} has been verified by Central Operations.`,
          });
        }
      }

      // Bank Account Name Verification & Warning Notification
      if (
        bankVerificationStatus &&
        ["VERIFIED", "REJECTED", "WARNING", "PENDING"].includes(bankVerificationStatus)
      ) {
        currentDocs.bankVerification = {
          status: bankVerificationStatus,
          note: bankVerificationNote || null,
          reviewedAt: now.toISOString(),
        };
        docsChanged = true;

        if (bankVerificationStatus === "VERIFIED") {
          notificationsToSend.push({
            type: "SYSTEM",
            title: "Bank Account Details Verified",
            body: "Your payout bank account name has been verified to match your KYC documents. Withdrawals are enabled.",
          });
        } else if (bankVerificationStatus === "REJECTED") {
          notificationsToSend.push({
            type: "ALERT",
            title: "Bank Account Verification Rejected",
            body:
              bankVerificationNote ||
              "Your submitted bank account name does not match the name on your KYC verification documents. Please update your payout bank details immediately.",
          });
        } else if (bankVerificationStatus === "WARNING") {
          notificationsToSend.push({
            type: "ALERT",
            title: "Action Required: Bank Account Name Mismatch Warning",
            body:
              bankVerificationNote ||
              "Central Operations flagged a discrepancy between your bank account name and your verified identity documents. Please review and update your bank details to avoid payout holds.",
          });
        }
      }

      if (docsChanged) {
        userUpdates.accreditationDocuments = currentDocs;
      }

      const [updatedUser] = await db
        .update(users)
        .set(userUpdates)
        .where(eq(users.id, targetUserId))
        .returning();

      // Update Agent Tier if provided
      if (agentTier) {
        const canonicalTier = normalizeAgentTier(agentTier);
        const existingProfile = await db
          .select()
          .from(agentProfiles)
          .where(eq(agentProfiles.userId, targetUserId))
          .limit(1);

        if (existingProfile.length > 0) {
          await db
            .update(agentProfiles)
            .set({ tier: canonicalTier as any, updatedAt: now })
            .where(eq(agentProfiles.userId, targetUserId));
        } else {
          await db.insert(agentProfiles).values({
            userId: targetUserId,
            tier: canonicalTier as any,
          });
        }
      }

      // Send notification on overall KYC status change
      if (kycStatus === "VERIFIED") {
        notificationsToSend.push({
          type: "SYSTEM",
          title: "KYC & Accreditation Verified",
          body: rejectionReason
            ? `Your Oversite identity and compliance credentials have been verified. Note: ${rejectionReason}`
            : "Your Oversite identity and compliance credentials have been verified by Central Operations.",
        });
      } else if (kycStatus === "REJECTED") {
        notificationsToSend.push({
          type: "ALERT",
          title: "KYC Verification Action Required",
          body:
            rejectionReason ||
            "One or more of your KYC accreditation documents require re-submission. Please check your verification portal.",
        });
      }

      for (const notif of notificationsToSend) {
        const [inserted] = await db
          .insert(notifications)
          .values({
            userId: targetUserId,
            type: notif.type,
            title: notif.title,
            body: notif.body,
          })
          .returning();

        await realtimeBridge
          .publish({
            channel: `notifications:user:${targetUserId}`,
            event: "notification",
            payload: {
              id: inserted.id,
              type: notif.type,
              title: notif.title,
              body: notif.body,
              createdAt: now.toISOString(),
            },
          })
          .catch(() => {});

        await sendEmailAsync({
          to: targetUser.email,
          subject: `Oversite Verification Update: ${notif.title}`,
          template: "GENERAL_ALERT",
          payload: {
            title: notif.title,
            message: notif.body,
          },
        }).catch(() => {});
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
