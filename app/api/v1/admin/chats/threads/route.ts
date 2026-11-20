import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getDbReady } from "@/lib/db/client";
import { taskChats, tasks, users } from "@/db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  formatOperativeCode,
  resolveTaskDualPricing,
} from "@/lib/services/pricing";

const clientUser = alias(users, "client_user");
const agentUser = alias(users, "agent_user");

export interface AdminChatThread {
  taskId: string;
  taskTitle: string;
  moduleType: string;
  taskStatus: string;
  locationAddress: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  agentId: string | null;
  agentName: string | null;
  agentCode: string | null;
  clientPriceNgn: number;
  agentPayoutNgn: number;
  platformMarginNgn: number;
  pendingCount: number;
  totalMessages: number;
  lastMessagePreview: string;
  lastMessageAt: string;
  lastMessageStatus: string | null;
}

// GET /api/v1/admin/chats/threads — Grouped task chat directory for Admin Console
export const GET = withAuth(
  async (_req: NextRequest) => {
    try {
      const db = await getDbReady();

      const [taskRows, chatRows] = await Promise.all([
        db
          .select({
            id: tasks.id,
            title: tasks.title,
            moduleType: tasks.moduleType,
            status: tasks.status,
            locationAddress: tasks.locationAddress,
            priceNgn: tasks.priceNgn,
            pricingBreakdown: tasks.pricingBreakdown,
            formData: tasks.formData,
            userId: tasks.userId,
            agentId: tasks.agentId,
            updatedAt: tasks.updatedAt,
            createdAt: tasks.createdAt,
            clientName: clientUser.name,
            clientEmail: clientUser.email,
            agentName: agentUser.name,
          })
          .from(tasks)
          .leftJoin(clientUser, eq(tasks.userId, clientUser.id))
          .leftJoin(agentUser, eq(tasks.agentId, agentUser.id))
          .orderBy(desc(tasks.updatedAt))
          .limit(200),
        db
          .select({
            id: taskChats.id,
            taskId: taskChats.taskId,
            rawMessage: taskChats.rawMessage,
            moderatedMessage: taskChats.moderatedMessage,
            message: taskChats.message,
            messageType: taskChats.messageType,
            moderationStatus: taskChats.moderationStatus,
            createdAt: taskChats.createdAt,
          })
          .from(taskChats)
          .orderBy(asc(taskChats.createdAt)),
      ]);

      const chatsByTask = new Map<
        string,
        {
          total: number;
          pending: number;
          lastMsg: (typeof chatRows)[number] | null;
        }
      >();

      for (const c of chatRows) {
        const entry = chatsByTask.get(c.taskId) || {
          total: 0,
          pending: 0,
          lastMsg: null,
        };
        entry.total += 1;
        if (c.moderationStatus === "PENDING_REVIEW") {
          entry.pending += 1;
        }
        entry.lastMsg = c;
        chatsByTask.set(c.taskId, entry);
      }

      const threads: AdminChatThread[] = [];
      for (const t of taskRows) {
        const chatMeta = chatsByTask.get(t.id);
        const hasChats = Boolean(chatMeta && chatMeta.total > 0);
        const isActiveMission =
          Boolean(t.agentId) ||
          t.moduleType === "PROPERTY_OVERSITE" ||
          ["PENDING", "MATCHED", "AGENT_EN_ROUTE", "AGENT_ON_SITE", "IN_PROGRESS", "REPORT_SUBMITTED", "UNDER_REVIEW", "DISPUTED"].includes(
            t.status
          );

        if (!hasChats && !isActiveMission) continue;

        const dual = resolveTaskDualPricing(t);
        const lastMsg = chatMeta?.lastMsg || null;

        let preview = "No messages yet — open thread to message client or operative.";
        if (lastMsg) {
          const raw =
            lastMsg.moderatedMessage || lastMsg.rawMessage || lastMsg.message || "";
          if (lastMsg.messageType === "MILESTONE_UPDATE" || raw.startsWith("{")) {
            preview = "[Milestone / Field Update]";
          } else if (lastMsg.messageType === "ATTACHMENT" && !raw) {
            preview = "[Media Attachment]";
          } else {
            preview = raw.length > 72 ? `${raw.slice(0, 69)}...` : raw;
          }
        }

        threads.push({
          taskId: t.id,
          taskTitle: t.title,
          moduleType: t.moduleType,
          taskStatus: t.status,
          locationAddress: t.locationAddress || "Nigeria",
          clientId: t.userId,
          clientName: t.clientName || t.clientEmail || "Client",
          clientEmail: t.clientEmail || "",
          agentId: t.agentId,
          agentName: t.agentId ? t.agentName || "Field Operative" : null,
          agentCode: t.agentId ? formatOperativeCode(t.agentId) : null,
          clientPriceNgn: dual.clientPriceNgn,
          agentPayoutNgn: dual.agentPayoutNgn,
          platformMarginNgn: dual.platformMarginNgn,
          pendingCount: chatMeta?.pending || 0,
          totalMessages: chatMeta?.total || 0,
          lastMessagePreview: preview,
          lastMessageAt: (
            lastMsg?.createdAt ||
            t.updatedAt ||
            t.createdAt
          ).toISOString(),
          lastMessageStatus: lastMsg?.moderationStatus || null,
        });
      }

      threads.sort((a, b) => {
        if (a.pendingCount > 0 && b.pendingCount === 0) return -1;
        if (b.pendingCount > 0 && a.pendingCount === 0) return 1;
        return (
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
        );
      });

      return NextResponse.json({
        success: true,
        data: {
          threads,
          summary: {
            totalThreads: threads.length,
            threadsNeedingReview: threads.filter((t) => t.pendingCount > 0)
              .length,
            totalPendingMessages: threads.reduce(
              (acc, t) => acc + t.pendingCount,
              0
            ),
          },
        },
      });
    } catch (error) {
      console.error("[GET /api/v1/admin/chats/threads] Error:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: (error as Error).message,
          },
        },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);

