import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

function hashPin(pin: string, userId: string): string {
  return crypto.createHash("sha256").update(`oversite_pin:${userId}:${pin}`).digest("hex");
}

// POST /api/v1/agent/wallet/pin — Set or Update 4-Digit Operative Withdrawal PIN
export const POST = withAuth(
  async (req: NextRequest, { user }) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { pin, currentPin } = body;

      if (!pin || typeof pin !== "string" || !/^\d{4}$/.test(pin.trim())) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "PIN must be an exact 4-digit numeric code.",
            },
          },
          { status: 400 }
        );
      }

      const db = await getDbReady();
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.id, user.sub))
        .limit(1);

      if (existingUsers.length === 0) {
        return NextResponse.json(
          { success: false, error: { code: "NOT_FOUND", message: "Operative not found." } },
          { status: 404 }
        );
      }

      const currentUser = existingUsers[0];
      const docs = (currentUser.accreditationDocuments as Record<string, any>) || {};

      // If a PIN already exists and currentPin was provided, verify it
      if (docs.withdrawalPinHash && currentPin) {
        const currentHash = hashPin(String(currentPin).trim(), user.sub);
        if (currentHash !== docs.withdrawalPinHash) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "INVALID_PIN",
                message: "Current withdrawal PIN is incorrect.",
              },
            },
            { status: 403 }
          );
        }
      }

      const newPinHash = hashPin(pin.trim(), user.sub);
      const updatedDocs = {
        ...docs,
        withdrawalPinHash: newPinHash,
        withdrawalPinUpdatedAt: new Date().toISOString(),
      };

      await db
        .update(users)
        .set({
          accreditationDocuments: updatedDocs,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.sub));

      return NextResponse.json<ApiResponse<{ hasWithdrawalPin: boolean; updatedAt: string }>>({
        success: true,
        data: {
          hasWithdrawalPin: true,
          updatedAt: updatedDocs.withdrawalPinUpdatedAt,
        },
        message: "4-digit operative withdrawal PIN saved successfully.",
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

