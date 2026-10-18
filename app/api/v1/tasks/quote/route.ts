import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { calculateTaskPricing, PricingCalculationInput, PricingBreakdown } from "@/lib/services/pricing";

// POST /api/v1/tasks/quote
// Computes instant itemized quote & progressive SLA buffer preview
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const body: PricingCalculationInput = await req.json();

    if (!body.moduleType) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "moduleType is required to calculate pricing" },
        },
        { status: 400 }
      );
    }

    const breakdown: PricingBreakdown = calculateTaskPricing(body);

    return NextResponse.json<ApiResponse<PricingBreakdown>>({
      success: true,
      data: breakdown,
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
