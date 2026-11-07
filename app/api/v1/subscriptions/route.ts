import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceNgn: number;
  billingCycle: "monthly" | "annually";
  features: string[];
  isCurrentPlan: boolean;
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  const plans: SubscriptionPlan[] = [
    {
      id: "plan-starter",
      name: "Starter Oversight",
      priceNgn: 0,
      billingCycle: "monthly",
      features: [
        "Pay-as-you-go task requests",
        "Standard diligence turnaround (72h)",
        "Direct chat with admin dispatch",
      ],
      isCurrentPlan: true,
    },
    {
      id: "plan-pro",
      name: "Professional Portfolio",
      priceNgn: 45000,
      billingCycle: "monthly",
      features: [
        "Up to 5 properties monitored simultaneously",
        "Priority 24h report turnaround",
        "Dedicated accredited project supervisor",
        "Automated monthly milestone audits",
      ],
      isCurrentPlan: false,
    },
    {
      id: "plan-enterprise",
      name: "Enterprise Developer",
      priceNgn: 150000,
      billingCycle: "monthly",
      features: [
        "Unlimited properties & site watches",
        "Dedicated legal counsel retainer access",
        "Drone mapping & 4K evidence vaulting",
        "Direct API integration & multi-user team seats",
      ],
      isCurrentPlan: false,
    },
  ];

  return NextResponse.json<ApiResponse<SubscriptionPlan[]>>({
    success: true,
    data: plans,
  });
});
