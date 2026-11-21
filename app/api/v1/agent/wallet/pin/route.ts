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

// GET /api/v1/agent/wallet/pin — Check if current authenticated user has a withdrawal PIN configured
export const GET = withAuth(async (_req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();
    const existingUsers = await db
      .select({ accreditationDocuments: users.accreditationDocuments })
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found." } },
        { status: 404 }
      );
    }

    const docs = (existingUsers[0].accreditationDocuments as Record<string, any>) || {};
    const hasWithdrawalPin = Boolean(docs.withdrawalPinHash);

    return NextResponse.json<ApiResponse<{ hasWithdrawalPin: boolean; updatedAt: string | null }>>({
      success: true,
      data: {
        hasWithdrawalPin,
        updatedAt: docs.withdrawalPinUpdatedAt || null,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: (error as Error).message } },
      { status: 500 }
    );
  }
});

// POST /api/v1/agent/wallet/pin — Verify, Set, or Update 4-Digit Operative Withdrawal PIN
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { pin, currentPin, verifyOnly, resetViaOtp } = body;

    const db = await getDbReady();
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.id, user.sub))
      .limit(1);

    if (existingUsers.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "User not found." } },
        { status: 404 }
      );
    }

    const currentUser = existingUsers[0];
    const docs = (currentUser.accreditationDocuments as Record<string, any>) || {};

    // Mode 1: Verify current PIN only before advancing UI step
    if (verifyOnly) {
      if (!docs.withdrawalPinHash) {
        return NextResponse.json({
          success: true,
          data: { valid: true, hasWithdrawalPin: false },
        });
      }
      if (!currentPin || !/^\d{4}$/.test(String(currentPin).trim())) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "INVALID_PIN", message: "Please enter your 4-digit current PIN." },
          },
          { status: 400 }
        );
      }
      const candidateHash = hashPin(String(currentPin).trim(), user.sub);
      if (candidateHash !== docs.withdrawalPinHash) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "INVALID_PIN", message: "Incorrect current PIN. Please try again." },
          },
          { status: 403 }
        );
      }
      return NextResponse.json({
        success: true,
        data: { valid: true, hasWithdrawalPin: true },
      });
    }

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

    // If a PIN already exists (and not resetting via verified OTP), require and verify currentPin
    if (docs.withdrawalPinHash && !resetViaOtp) {
      if (!currentPin || typeof currentPin !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CURRENT_PIN_REQUIRED",
              message: "Current withdrawal PIN is required to set a new PIN.",
            },
          },
          { status: 400 }
        );
      }
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
      if (pin.trim() === currentPin.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SAME_PIN",
              message: "New PIN must be different from your current PIN.",
            },
          },
          { status: 400 }
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
      message: "4-digit withdrawal PIN saved successfully.",
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
