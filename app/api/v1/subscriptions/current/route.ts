import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface CurrentSubscriptionResponse {
  planId: string;
  name: string;
  tier: "STARTER" | "PRO" | "ENTERPRISE";
  priceNgn: number;
  billingCycle: "monthly" | "annually";
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  features: string[];
  startDate: string;
  renewalDate: string;
}

// GET /api/v1/subscriptions/current — Get current user subscription
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    if (foundUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    const dbUser = foundUsers[0];
    const joinedDate = dbUser.createdAt;
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    const subscription: CurrentSubscriptionResponse = {
      planId: "plan-starter",
      name: "Starter Oversight",
      tier: "STARTER",
      priceNgn: 5000,
      billingCycle: "monthly",
      status: "ACTIVE",
      features: [
        "Access to all 7 service oversite modules",
        "Standard dispatch, 24-48 hours",
        "Message your agent directly",
      ],
      startDate: joinedDate.toISOString(),
      renewalDate: oneMonthFromNow.toISOString(),
    };

    return NextResponse.json<ApiResponse<CurrentSubscriptionResponse>>({
      success: true,
      data: subscription,
      message: "Current subscription retrieved",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
});

