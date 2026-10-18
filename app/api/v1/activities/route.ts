import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PaginatedResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { tasks, notifications, payoutTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const db = getDb();

export interface ActivityItem {
  id: string;
  type: "TASK_UPDATE" | "PAYOUT" | "NOTIFICATION";
  title: string;
  description: string;
  status?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const isAgent = user.role === "AGENT";
    const activities: ActivityItem[] = [];

    if (isAgent) {
      // 1. Agent Task updates
      const agentTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.agentId, user.sub))
        .orderBy(desc(tasks.updatedAt))
        .limit(limit);

      for (const t of agentTasks) {
        activities.push({
          id: `task-${t.id}`,
          type: "TASK_UPDATE",
          title: t.title,
          description: `Task status changed to ${t.status}`,
          status: t.status,
          timestamp: (t.updatedAt || t.createdAt).toISOString(),
          metadata: {
            taskId: t.id,
            moduleType: t.moduleType,
          },
        });
      }

      // 2. Agent Payout updates
      const payouts = await db
        .select()
        .from(payoutTransactions)
        .where(eq(payoutTransactions.agentId, user.sub))
        .orderBy(desc(payoutTransactions.createdAt))
        .limit(limit);

      for (const p of payouts) {
        activities.push({
          id: `payout-${p.id}`,
          type: "PAYOUT",
          title: "Payout Request",
          description: `Payout of ₦${parseFloat(p.amountNgn).toLocaleString()} is ${p.status}`,
          status: p.status,
          timestamp: p.createdAt.toISOString(),
          metadata: {
            amountNgn: parseFloat(p.amountNgn),
            bankCode: p.bankCode,
          },
        });
      }
    } else {
      // 1. Client Task updates
      const clientTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, user.sub))
        .orderBy(desc(tasks.updatedAt))
        .limit(limit);

      for (const t of clientTasks) {
        activities.push({
          id: `task-${t.id}`,
          type: "TASK_UPDATE",
          title: t.title,
          description: `Request status: ${t.status}`,
          status: t.status,
          timestamp: (t.updatedAt || t.createdAt).toISOString(),
          metadata: {
            taskId: t.id,
            moduleType: t.moduleType,
          },
        });
      }

      // 2. Client Notifications
      const userNotifications = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, user.sub))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);

      for (const n of userNotifications) {
        activities.push({
          id: `notif-${n.id}`,
          type: "NOTIFICATION",
          title: n.title,
          description: n.body || "",
          timestamp: n.createdAt.toISOString(),
          metadata: {
            notificationType: n.type,
            isRead: n.isRead,
          },
        });
      }
    }

    // Sort chronologically descending and apply pagination offset/limit
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const paginatedActivities = activities.slice(offset, offset + limit);

    return NextResponse.json<PaginatedResponse<ActivityItem>>({
      success: true,
      data: paginatedActivities,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total: activities.length,
        totalPages: Math.ceil(activities.length / limit) || 1,
      },
    });
  } catch (error) {
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
});
