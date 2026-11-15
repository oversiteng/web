import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import {
  tasks,
  users,
  agentProfiles,
  taskReports,
  payments,
  taskChats,
  agentWallets,
} from "@/db/schema";
import { eq, inArray, sql, desc } from "drizzle-orm";
import { resolveTaskDualPricing } from "@/lib/services/pricing";

export interface AdminAnalyticsData {
  totalGmvNgn: number;
  totalClientRevenueNgn: number;
  totalAgentPayoutsNgn: number;
  netPlatformMarginNgn: number;
  activeGroundTasks: number;
  verifiedAgentsCount: number;
  onlineAgentsCount: number;
  pendingQaAudits: number;
  pendingQuotesCount: number;
  pendingChatsCount: number;
  pendingKycCount: number;
  activeDisputesCount: number;
  moduleUtilization: { name: string; count: number; pct: number }[];
  recentActivityStream: {
    id: string;
    time: string;
    desc: string;
    status: string;
    moduleType: string;
    clientPriceNgn: number;
    agentPayoutNgn: number;
  }[];
}

export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const db = await getDbReady();

      // 1. Total Client Revenue (Paid to Oversite)
      const gmvResult = await db
        .select({
          totalGmv: sql<string>`COALESCE(SUM(CAST(${payments.amountNgn} AS NUMERIC)), 0)`,
        })
        .from(payments)
        .where(inArray(payments.status, ["CAPTURED", "RELEASED", "AUTHORIZED"]));

      const totalClientRevenueNgn = parseFloat(gmvResult[0]?.totalGmv || "0");

      // 2. Total Agent Payouts Credited across agentWallets
      const walletsResult = await db
        .select({
          totalCredited: sql<string>`COALESCE(SUM(CAST(${agentWallets.totalEarnedNgn} AS NUMERIC)), 0)`,
        })
        .from(agentWallets);
      const totalAgentPayoutsNgn = parseFloat(walletsResult[0]?.totalCredited || "0");

      const netPlatformMarginNgn = Math.max(0, totalClientRevenueNgn - totalAgentPayoutsNgn);

      // 3. Active Ground Tasks
      const activeTasksResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          inArray(tasks.status, [
            "PENDING",
            "MATCHED",
            "AGENT_EN_ROUTE",
            "AGENT_ON_SITE",
            "IN_PROGRESS",
            "REPORT_SUBMITTED",
          ])
        );
      const activeGroundTasks = Number(activeTasksResult[0]?.count || 0);

      // 4. Verified Field Agents & Online Agents
      const verifiedAgentsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.role} = 'AGENT' AND ${users.kycStatus} = 'VERIFIED'`);
      const verifiedAgentsCount = Number(verifiedAgentsResult[0]?.count || 0);

      const onlineAgentsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(agentProfiles)
        .where(eq(agentProfiles.isAvailable, true));
      const onlineAgentsCount = Number(onlineAgentsResult[0]?.count || 0);

      // 5. Actionable Queue Counters
      const [
        pendingQaResult,
        pendingQuotesResult,
        pendingChatsResult,
        pendingKycResult,
        activeDisputesResult,
      ] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(taskReports)
          .where(eq(taskReports.status, "SUBMITTED")),
        db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(inArray(tasks.quoteStatus, ["PENDING_ADMIN_PRICE", "COUNTER_OFFER"])),
        db
          .select({ count: sql<number>`count(*)` })
          .from(taskChats)
          .where(eq(taskChats.moderationStatus, "PENDING_REVIEW")),
        db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(inArray(users.kycStatus, ["SUBMITTED", "PENDING"])),
        db
          .select({ count: sql<number>`count(*)` })
          .from(tasks)
          .where(eq(tasks.status, "DISPUTED")),
      ]);

      const pendingQaAudits = Number(pendingQaResult[0]?.count || 0);
      const pendingQuotesCount = Number(pendingQuotesResult[0]?.count || 0);
      const pendingChatsCount = Number(pendingChatsResult[0]?.count || 0);
      const pendingKycCount = Number(pendingKycResult[0]?.count || 0);
      const activeDisputesCount = Number(activeDisputesResult[0]?.count || 0);

      // 6. Module Utilization
      const moduleCounts = await db
        .select({
          module: tasks.moduleType,
          count: sql<number>`count(*)`,
        })
        .from(tasks)
        .groupBy(tasks.moduleType);

      const totalTasksAll = moduleCounts.reduce((acc, curr) => acc + Number(curr.count), 0);
      const moduleUtilization = moduleCounts.map((m) => {
        const count = Number(m.count);
        const pct = totalTasksAll > 0 ? Math.round((count / totalTasksAll) * 100) : 0;
        return {
          name: m.module.replace(/_/g, " "),
          count,
          pct,
        };
      });

      // 7. Recent Activity Stream from latest tasks
      const latestTasks = await db
        .select()
        .from(tasks)
        .orderBy(desc(tasks.createdAt))
        .limit(8);

      const recentActivityStream = latestTasks.map((t) => {
        const dual = resolveTaskDualPricing(t);
        return {
          id: t.id,
          time: new Date(t.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          desc: `${t.title}`,
          status: t.status,
          moduleType: t.moduleType,
          clientPriceNgn: dual.clientPriceNgn,
          agentPayoutNgn: dual.agentPayoutNgn,
        };
      });

      const analytics: AdminAnalyticsData = {
        totalGmvNgn: totalClientRevenueNgn,
        totalClientRevenueNgn,
        totalAgentPayoutsNgn,
        netPlatformMarginNgn,
        activeGroundTasks,
        verifiedAgentsCount,
        onlineAgentsCount,
        pendingQaAudits,
        pendingQuotesCount,
        pendingChatsCount,
        pendingKycCount,
        activeDisputesCount,
        moduleUtilization,
        recentActivityStream,
      };

      return NextResponse.json<ApiResponse<AdminAnalyticsData>>({
        success: true,
        data: analytics,
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
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);
