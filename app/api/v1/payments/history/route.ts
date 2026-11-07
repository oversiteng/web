import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { PaginatedResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { payments, tasks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export interface PaymentHistoryItem {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  taskTitle: string;
  createdAt: string;
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const db = await getDbReady();

    const userPayments = await db
      .select({
        id: payments.id,
        reference: payments.gatewayRef,
        amountNgn: payments.amountNgn,
        gateway: payments.gateway,
        status: payments.status,
        createdAt: payments.createdAt,
        taskTitle: tasks.title,
      })
      .from(payments)
      .leftJoin(tasks, eq(payments.taskId, tasks.id))
      .where(eq(payments.userId, user.sub))
      .orderBy(desc(payments.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const history: PaymentHistoryItem[] = userPayments.map((p) => ({
      id: p.id,
      reference: p.reference || `TXN_${p.id.slice(0, 8)}`,
      amount: parseFloat(p.amountNgn),
      currency: "NGN",
      gateway: p.gateway,
      status: p.status,
      taskTitle: p.taskTitle || "Oversite Secured Service",
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json<PaginatedResponse<PaymentHistoryItem>>({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total: history.length,
        totalPages: 1,
      },
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
});
