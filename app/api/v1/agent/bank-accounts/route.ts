import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { agentProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/v1/agent/bank-accounts — Link Verified Bank Account to Operative Profile
export const POST = withAuth(
  async (req: NextRequest, { user }) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { bankCode, bankAccountNumber, bankAccountName } = body;

      if (!bankCode || !bankAccountNumber || !bankAccountName) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "bankCode, bankAccountNumber, and bankAccountName are required.",
            },
          },
          { status: 400 }
        );
      }

      if (!/^\d{10}$/.test(String(bankAccountNumber).trim())) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "bankAccountNumber must be a 10-digit Nigerian NUBAN.",
            },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();
      const now = new Date();

      const existingProfiles = await db
        .select()
        .from(agentProfiles)
        .where(eq(agentProfiles.userId, user.sub))
        .limit(1);

      let savedProfile;
      if (existingProfiles.length > 0) {
        [savedProfile] = await db
          .update(agentProfiles)
          .set({
            bankCode: bankCode.trim(),
            bankAccountNumber: String(bankAccountNumber).trim(),
            bankAccountName: String(bankAccountName).trim(),
            updatedAt: now,
          })
          .where(eq(agentProfiles.id, existingProfiles[0].id))
          .returning();
      } else {
        [savedProfile] = await db
          .insert(agentProfiles)
          .values({
            userId: user.sub,
            bankCode: bankCode.trim(),
            bankAccountNumber: String(bankAccountNumber).trim(),
            bankAccountName: String(bankAccountName).trim(),
            createdAt: now,
            updatedAt: now,
          })
          .returning();
      }

      return NextResponse.json<
        ApiResponse<{
          bankCode: string;
          bankAccountNumber: string;
          bankAccountName: string;
          linkedAt: string;
        }>
      >({
        success: true,
        data: {
          bankCode: savedProfile.bankCode || bankCode,
          bankAccountNumber: savedProfile.bankAccountNumber || bankAccountNumber,
          bankAccountName: savedProfile.bankAccountName || bankAccountName,
          linkedAt: now.toISOString(),
        },
        message: "Bank account linked successfully to operative profile for 1-click payouts.",
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
  { roles: ["AGENT", "ADMIN", "SUPER_ADMIN"] }
);
