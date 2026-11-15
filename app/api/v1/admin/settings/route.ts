import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { waitlist } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import {
  BASE_FEES,
  SERVICE_MINIMUM_HOURS,
  DEFAULT_PLATFORM_DEDUCTION_PCT,
  EXTRA_STOP_FEE,
  OFFICIAL_DOCS_FEE,
} from "@/lib/services/pricing";

// In-memory runtime config cache synced with defaults
let runtimePlatformConfig = {
  defaultDeductionPct: DEFAULT_PLATFORM_DEDUCTION_PCT,
  emergencySurchargePct: 30,
  manualQuoteThresholdNgn: 100000,
  extraStopFeeNgn: EXTRA_STOP_FEE,
  officialDocsFeeNgn: OFFICIAL_DOCS_FEE,
  moduleBaseFees: { ...BASE_FEES },
  minimumTurnaroundHours: { ...SERVICE_MINIMUM_HOURS },
  updatedAt: new Date().toISOString(),
};

export const GET = withAuth(
  async () => {
    try {
      const db = await getDbReady();
      const waitlistRows = await db
        .select()
        .from(waitlist)
        .orderBy(desc(waitlist.createdAt))
        .limit(100);

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: {
          config: runtimePlatformConfig,
          waitlist: waitlistRows.map((w) => ({
            ...w,
            createdAt: w.createdAt.toISOString(),
          })),
        },
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);

export const PUT = withAuth(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const {
        defaultDeductionPct,
        emergencySurchargePct,
        manualQuoteThresholdNgn,
        extraStopFeeNgn,
        officialDocsFeeNgn,
        moduleBaseFees,
        waitlistId,
        waitlistStatus,
      } = body;

      const db = await getDbReady();

      if (waitlistId && waitlistStatus) {
        const [updatedLead] = await db
          .update(waitlist)
          .set({ status: waitlistStatus })
          .where(eq(waitlist.id, waitlistId))
          .returning();

        return NextResponse.json<ApiResponse<any>>({
          success: true,
          data: updatedLead,
          message: `Waitlist lead status updated to ${waitlistStatus}.`,
        });
      }

      runtimePlatformConfig = {
        ...runtimePlatformConfig,
        ...(defaultDeductionPct !== undefined
          ? { defaultDeductionPct: Number(defaultDeductionPct) }
          : {}),
        ...(emergencySurchargePct !== undefined
          ? { emergencySurchargePct: Number(emergencySurchargePct) }
          : {}),
        ...(manualQuoteThresholdNgn !== undefined
          ? { manualQuoteThresholdNgn: Number(manualQuoteThresholdNgn) }
          : {}),
        ...(extraStopFeeNgn !== undefined ? { extraStopFeeNgn: Number(extraStopFeeNgn) } : {}),
        ...(officialDocsFeeNgn !== undefined
          ? { officialDocsFeeNgn: Number(officialDocsFeeNgn) }
          : {}),
        ...(moduleBaseFees && typeof moduleBaseFees === "object"
          ? {
              moduleBaseFees: {
                ...runtimePlatformConfig.moduleBaseFees,
                ...moduleBaseFees,
              },
            }
          : {}),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: { config: runtimePlatformConfig },
        message: "Platform pricing and operational parameters saved.",
      });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
        { status: 500 }
      );
    }
  },
  { roles: ["ADMIN", "SUPER_ADMIN"] }
);

