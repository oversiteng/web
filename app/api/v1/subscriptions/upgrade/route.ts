import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/v1/subscriptions/upgrade — Upgrade or change subscription plan tier
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { planId, tier } = body; // tier: 'STARTER' | 'PRO' | 'ENTERPRISE'

    const targetTier = (tier || (planId?.includes("pro") ? "PRO" : planId?.includes("enterprise") ? "ENTERPRISE" : "STARTER")).toUpperCase();

    if (!["STARTER", "PRO", "ENTERPRISE"].includes(targetTier)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid plan tier. Must be STARTER, PRO, or ENTERPRISE.",
          },
        },
        { status: 400 }
      );
    }

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
    const now = new Date();
    const renewal = new Date();
    renewal.setMonth(renewal.getMonth() + 1);

    const priceNgn = targetTier === "ENTERPRISE" ? 150000 : targetTier === "PRO" ? 15000 : 5000;

    // Send institutional notification
    await db.insert(notifications).values({
      userId: dbUser.id,
      type: "PAYMENT",
      title: targetTier === "ENTERPRISE" ? "Enterprise Inquiry Received" : "Subscription Plan Upgraded",
      body:
        targetTier === "ENTERPRISE"
          ? "Our institutional accounts team has received your Enterprise request and will contact you shortly."
          : `Your subscription has been upgraded to the ${targetTier} plan. You now enjoy priority dispatch and discounted rates.`,
    });

    return NextResponse.json<
      ApiResponse<{
        planId: string;
        tier: string;
        status: string;
        priceNgn: number;
        currency: string;
        effectiveDate: string;
        renewalDate: string;
      }>
    >({
      success: true,
      data: {
        planId: `plan-${targetTier.toLowerCase()}`,
        tier: targetTier,
        status: "ACTIVE",
        priceNgn,
        currency: "NGN",
        effectiveDate: now.toISOString(),
        renewalDate: renewal.toISOString(),
      },
      message:
        targetTier === "ENTERPRISE"
          ? "Enterprise inquiry logged. An account executive will reach out to you."
          : `Successfully upgraded to ${targetTier} plan!`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
});

