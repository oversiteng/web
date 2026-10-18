import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { tasks, properties, taskReports, agentWallets } from "@/db/schema";
import { eq, and, sql, notInArray } from "drizzle-orm";

const db = getDb();

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const isAgent = user.role === "AGENT";

    if (isAgent) {
      // Metrics for AGENT persona:
      // 1. Pending assignments (matched or pending acceptance)
      // 2. Active field tasks (in progress, on site, en route)
      // 3. Completed tasks
      // 4. Wallet balance & earnings

      const [pendingCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.agentId, user.sub),
            sql`${tasks.status} IN ('MATCHED', 'PENDING')`
          )
        );

      const [activeCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.agentId, user.sub),
            sql`${tasks.status} IN ('AGENT_EN_ROUTE', 'AGENT_ON_SITE', 'IN_PROGRESS', 'REPORT_SUBMITTED')`
          )
        );

      const [completedCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(
          and(
            eq(tasks.agentId, user.sub),
            eq(tasks.status, "COMPLETED")
          )
        );

      // Fetch or default agent wallet
      const walletRecords = await db
        .select()
        .from(agentWallets)
        .where(eq(agentWallets.agentId, user.sub))
        .limit(1);

      const wallet = walletRecords[0] || {
        balanceNgn: "0.00",
        totalEarnedNgn: "0.00",
      };

      return NextResponse.json<
        ApiResponse<{
          role: "AGENT";
          pendingAssignments: number;
          activeTasks: number;
          completedTasks: number;
          walletBalance: number;
          totalEarnings: number;
        }>
      >({
        success: true,
        data: {
          role: "AGENT",
          pendingAssignments: Number(pendingCountResult?.count || 0),
          activeTasks: Number(activeCountResult?.count || 0),
          completedTasks: Number(completedCountResult?.count || 0),
          walletBalance: parseFloat(wallet.balanceNgn || "0"),
          totalEarnings: parseFloat(wallet.totalEarnedNgn || "0"),
        },
      });
    }

    // Metrics for CLIENT persona:
    // 1. Active requests (tasks not completed or cancelled)
    // 2. Pending reports (under review or submitted awaiting review)
    // 3. Monitored properties count

    const [activeRequestsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, user.sub),
          notInArray(tasks.status, ["COMPLETED", "CANCELLED"])
        )
      );

    const [pendingReportsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(taskReports)
      .innerJoin(tasks, eq(taskReports.taskId, tasks.id))
      .where(
        and(
          eq(tasks.userId, user.sub),
          sql`${taskReports.status} IN ('SUBMITTED', 'UNDER_REVIEW')`
        )
      );

    const [propertiesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(properties)
      .where(eq(properties.userId, user.sub));

    return NextResponse.json<
      ApiResponse<{
        role: "CLIENT";
        activeRequests: number;
        pendingReports: number;
        monitoredProperties: number;
      }>
    >({
      success: true,
      data: {
        role: "CLIENT",
        activeRequests: Number(activeRequestsResult?.count || 0),
        pendingReports: Number(pendingReportsResult?.count || 0),
        monitoredProperties: Number(propertiesResult?.count || 0),
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
