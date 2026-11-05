import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { tasks, users, agentProfiles, taskReports, payments } from "@/db/schema";
import { eq, inArray, sql, desc } from "drizzle-orm";

export interface AdminAnalyticsData {
  totalGmvNgn: number;
  activeGroundTasks: number;
  verifiedAgentsCount: number;
  onlineAgentsCount: number;
  pendingQaAudits: number;
  moduleUtilization: { name: string; count: number; pct: number }[];
  recentActivityStream: { time: string; desc: string; status: string }[];
}

export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const db = await getDbReady();

      // 1. Total GMV (Captured + Released payments)
      const gmvResult = await db
        .select({
          totalGmv: sql<string>`COALESCE(SUM(CAST(${payments.amountNgn} AS NUMERIC)), 0)`,
        })
        .from(payments)
        .where(inArray(payments.status, ["CAPTURED", "RELEASED", "AUTHORIZED", "ESCROWED"]));

      const totalGmvNgn = parseFloat(gmvResult[0]?.totalGmv || "0");

      // 2. Active Ground Tasks
      const activeTasksResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          inArray(tasks.status, [
            "MATCHED",
            "AGENT_EN_ROUTE",
            "AGENT_ON_SITE",
            "IN_PROGRESS",
            "REPORT_SUBMITTED",
          ])
        );
      const activeGroundTasks = Number(activeTasksResult[0]?.count || 0);

      // 3. Verified Field Agents
      const verifiedAgentsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.role} = 'AGENT' AND ${users.kycStatus} = 'VERIFIED'`);
      const verifiedAgentsCount = Number(verifiedAgentsResult[0]?.count || 0);

      // 4. Online Agents
      const onlineAgentsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(agentProfiles)
        .where(eq(agentProfiles.isAvailable, true));
      const onlineAgentsCount = Number(onlineAgentsResult[0]?.count || 0);

      // 5. Pending QA Audits
      const pendingQaResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(taskReports)
        .where(eq(taskReports.status, "SUBMITTED"));
      const pendingQaAudits = Number(pendingQaResult[0]?.count || 0);

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
        .select({
          id: tasks.id,
          title: tasks.title,
          status: tasks.status,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .orderBy(desc(tasks.createdAt))
        .limit(6);

      const recentActivityStream = latestTasks.map((t) => ({
        time: new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        desc: `${t.title} (${t.status.replace(/_/g, " ")})`,
        status: t.status,
      }));

      const analytics: AdminAnalyticsData = {
        totalGmvNgn,
        activeGroundTasks,
        verifiedAgentsCount,
        onlineAgentsCount,
        pendingQaAudits,
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

