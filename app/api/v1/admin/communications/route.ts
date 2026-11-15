import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import {
  users,
  agentProfiles,
  notifications,
  outboundEmails,
  waitlist,
} from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { sendEmailAsync } from "@/lib/services/mailService";
import { formatOperativeCode } from "@/lib/services/pricing";

interface FilterParams {
  targetGroup: "ALL" | "USER" | "AGENT" | "ADMIN" | "WAITLIST" | "CUSTOM";
  kycStatus?: string;
  agentTier?: string;
  availability?: string; // "ALL" | "ONLINE" | "OFFLINE"
  accountStatus?: string; // "ALL" | "ACTIVE" | "SUSPENDED"
  stateFilter?: string;
  customUserIds?: string[];
}

async function resolveMatchedRecipients(db: any, filters: FilterParams) {
  if (filters.targetGroup === "WAITLIST") {
    const leads = await db.select().from(waitlist).orderBy(desc(waitlist.createdAt));
    return leads.map((l: any) => ({
      id: l.id,
      userId: null,
      name: l.name || l.email.split("@")[0],
      email: l.email,
      role: "WAITLIST",
      state: l.interest || null,
      isWaitlist: true,
    }));
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      role: users.role,
      kycStatus: users.kycStatus,
      isActive: users.isActive,
      state: users.state,
      location: users.location,
      agentTier: agentProfiles.tier,
      isAvailable: agentProfiles.isAvailable,
    })
    .from(users)
    .leftJoin(agentProfiles, eq(users.id, agentProfiles.userId))
    .orderBy(desc(users.createdAt));

  return rows
    .filter((u: any) => {
      if (filters.targetGroup === "CUSTOM") {
        return Array.isArray(filters.customUserIds) && filters.customUserIds.includes(u.id);
      }
      if (filters.targetGroup === "USER" && u.role !== "USER") return false;
      if (filters.targetGroup === "AGENT" && u.role !== "AGENT") return false;
      if (
        filters.targetGroup === "ADMIN" &&
        u.role !== "ADMIN" &&
        u.role !== "SUPER_ADMIN"
      ) {
        return false;
      }

      if (filters.kycStatus && filters.kycStatus !== "ALL" && u.kycStatus !== filters.kycStatus) {
        return false;
      }

      if (filters.agentTier && filters.agentTier !== "ALL") {
        if (u.role !== "AGENT" || (u.agentTier || "GENERAL") !== filters.agentTier) {
          return false;
        }
      }

      if (filters.availability && filters.availability !== "ALL") {
        const isOnline = Boolean(u.isAvailable);
        if (filters.availability === "ONLINE" && !isOnline) return false;
        if (filters.availability === "OFFLINE" && isOnline) return false;
      }

      if (filters.accountStatus && filters.accountStatus !== "ALL") {
        if (filters.accountStatus === "ACTIVE" && !u.isActive) return false;
        if (filters.accountStatus === "SUSPENDED" && u.isActive) return false;
      }

      if (filters.stateFilter && filters.stateFilter.trim() !== "") {
        const q = filters.stateFilter.trim().toLowerCase();
        const st = `${u.state || ""} ${u.location || ""}`.toLowerCase();
        if (!st.includes(q)) return false;
      }

      return true;
    })
    .map((u: any) => ({
      id: u.id,
      userId: u.id,
      name: u.name || u.email.split("@")[0],
      email: u.email,
      role: u.role,
      kycStatus: u.kycStatus,
      agentTier: u.agentTier || (u.role === "AGENT" ? "GENERAL" : null),
      operativeCode: u.role === "AGENT" ? formatOperativeCode(u.id) : null,
      isAvailable: Boolean(u.isAvailable),
      isActive: Boolean(u.isActive),
      state: u.state || u.location || null,
      isWaitlist: false,
    }));
}

// GET /api/v1/admin/communications — Preview recipient count & load broadcast history
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const db = await getDbReady();
      const sp = req.nextUrl.searchParams;

      const targetGroup = (sp.get("targetGroup") as FilterParams["targetGroup"]) || "ALL";
      const kycStatus = sp.get("kycStatus") || "ALL";
      const agentTier = sp.get("agentTier") || "ALL";
      const availability = sp.get("availability") || "ALL";
      const accountStatus = sp.get("accountStatus") || "ALL";
      const stateFilter = sp.get("stateFilter") || "";
      const customIdsParam = sp.get("customUserIds") || "";
      const customUserIds = customIdsParam ? customIdsParam.split(",").filter(Boolean) : [];

      const [matchedRecipients, allUsersDirectory, recentEmails, recentNotifications] =
        await Promise.all([
          resolveMatchedRecipients(db, {
            targetGroup,
            kycStatus,
            agentTier,
            availability,
            accountStatus,
            stateFilter,
            customUserIds,
          }),
          db
            .select({
              id: users.id,
              name: users.name,
              email: users.email,
              role: users.role,
              kycStatus: users.kycStatus,
              state: users.state,
            })
            .from(users)
            .orderBy(desc(users.createdAt))
            .limit(200),
          db.select().from(outboundEmails).orderBy(desc(outboundEmails.createdAt)).limit(30),
          db
            .select({
              id: notifications.id,
              userId: notifications.userId,
              type: notifications.type,
              title: notifications.title,
              body: notifications.body,
              createdAt: notifications.createdAt,
              recipientName: users.name,
              recipientEmail: users.email,
            })
            .from(notifications)
            .leftJoin(users, eq(notifications.userId, users.id))
            .orderBy(desc(notifications.createdAt))
            .limit(30),
        ]);

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          matchedCount: matchedRecipients.length,
          sampleRecipients: matchedRecipients.slice(0, 12),
          directory: allUsersDirectory.map((u) => ({
            ...u,
            operativeCode: u.role === "AGENT" ? formatOperativeCode(u.id) : null,
          })),
          recentEmails: recentEmails.map((e) => ({
            ...e,
            status: "SENT",
            createdAt: e.createdAt.toISOString(),
          })),
          recentNotifications: recentNotifications.map((n) => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
          })),
        },
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

// POST /api/v1/admin/communications — Disburse Emails & In-App Notifications to Matched Audience
export const POST = withAuth(
  async (req: NextRequest, { user }) => {
    try {
      const body = await req.json();
      const {
        targetGroup = "ALL",
        kycStatus = "ALL",
        agentTier = "ALL",
        availability = "ALL",
        accountStatus = "ALL",
        stateFilter = "",
        customUserIds = [],
        channel = "BOTH", // "IN_APP" | "EMAIL" | "BOTH"
        notificationType = "SYSTEM", // "SYSTEM" | "ALERT" | "TASK_UPDATE" | "PAYMENT"
        title,
        message,
        actionLink,
      } = body;

      if (!title?.trim() || !message?.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Both title/subject and message body are required.",
            },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();
      const recipients = await resolveMatchedRecipients(db, {
        targetGroup,
        kycStatus,
        agentTier,
        availability,
        accountStatus,
        stateFilter,
        customUserIds,
      });

      if (recipients.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NO_RECIPIENTS",
              message: "No users matched the selected filter criteria.",
            },
          },
          { status: 400 }
        );
      }

      const sendInApp = channel === "IN_APP" || channel === "BOTH";
      const sendEmail = channel === "EMAIL" || channel === "BOTH";

      let notificationsDisbursed = 0;
      let emailsDisbursed = 0;

      // 1. Disburse In-App Notifications (for registered users with userId)
      if (sendInApp) {
        const registeredRecipients = recipients.filter((r: any) => Boolean(r.userId));
        if (registeredRecipients.length > 0) {
          const notifValues = registeredRecipients.map((r: any) => ({
            userId: r.userId,
            type: (["SYSTEM", "ALERT", "TASK_UPDATE", "PAYMENT", "CHAT"].includes(
              notificationType
            )
              ? notificationType
              : "SYSTEM") as any,
            title: title.trim(),
            body: message.trim(),
            metadata: {
              disbursedByAdmin: user.sub,
              targetGroup,
              actionLink: actionLink || null,
            },
          }));

          await db.insert(notifications).values(notifValues);
          notificationsDisbursed = notifValues.length;
        }
      }

      // 2. Disburse Emails via outboundEmails + SES background worker
      if (sendEmail) {
        const emailRecipients = recipients.filter((r: any) => Boolean(r.email));
        if (emailRecipients.length > 0) {
          const emailRows = emailRecipients.map((r: any) => ({
            userId: r.userId || null,
            toAddress: r.email,
            subject: title.trim(),
            template: `ADMIN_${notificationType}`,
            retries: 0,
          }));

          await db.insert(outboundEmails).values(emailRows);
          emailsDisbursed = emailRows.length;

          // Trigger async SES dispatch in background (non-blocking)
          for (const r of emailRecipients.slice(0, 50)) {
            sendEmailAsync({
              to: r.email,
              subject: title.trim(),
              template: `ADMIN_${notificationType}`,
              payload: {
                recipientName: r.name,
                message: message.trim(),
                actionLink: actionLink || null,
              },
            }).catch(() => null);
          }
        }
      }

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          matchedRecipients: recipients.length,
          notificationsDisbursed,
          emailsDisbursed,
          channel,
          targetGroup,
        },
        message: `Successfully disbursed ${notificationsDisbursed} in-app notification(s) and ${emailsDisbursed} email(s) to ${recipients.length} recipient(s).`,
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
