import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDbReady } from "@/lib/db/client";
import { userPaymentMethods } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export interface PaymentMethod {
  id: string;
  brand: string;
  cardType?: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  bank?: string | null;
  isDefault: boolean;
  createdAt?: string;
}

// GET /api/v1/payments/methods — List saved tokenized payment methods for current user
export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const db = await getDbReady();

    const methods = await db
      .select()
      .from(userPaymentMethods)
      .where(eq(userPaymentMethods.userId, user.sub))
      .orderBy(desc(userPaymentMethods.isDefault), desc(userPaymentMethods.createdAt));

    const sanitizedMethods: PaymentMethod[] = methods.map((m) => ({
      id: m.id,
      brand: m.brand,
      cardType: m.cardType,
      last4: m.last4,
      expiryMonth: m.expiryMonth,
      expiryYear: m.expiryYear,
      bank: m.bank,
      isDefault: m.isDefault,
      createdAt: m.createdAt.toISOString(),
    }));

    return NextResponse.json<ApiResponse<PaymentMethod[]>>({
      success: true,
      data: sanitizedMethods,
      message: "Payment methods retrieved successfully",
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

// POST /api/v1/payments/methods — Save a PCI-DSS tokenized payment authorization
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();

    // 🚨 Strict PCI-DSS Enforcement: Reject any transmission of raw cardholder data (PAN/CVV)
    if (body.cardNumber || body.cvv || body.pan || body.securityCode || body.cvc) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PCI_DSS_VIOLATION",
            message:
              "Direct transmission of raw card details (PAN/CVV) is strictly prohibited. Oversite uses PCI-DSS Level 1 compliant tokenization. Please tokenize card details via the Paystack or Flutterwave SDK and submit the resulting authorizationCode.",
          },
        },
        { status: 400 }
      );
    }

    const {
      authorizationCode,
      brand,
      last4,
      expiryMonth,
      expiryYear,
      bank,
      cardType = "card",
    } = body;

    // Validate tokenized credentials
    if (!authorizationCode || typeof authorizationCode !== "string" || !authorizationCode.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "authorizationCode is required (token from Paystack / Flutterwave).",
          },
        },
        { status: 400 }
      );
    }

    if (!last4 || typeof last4 !== "string" || !/^\d{4}$/.test(last4.trim())) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "last4 must be exactly 4 digits of the tokenized card.",
          },
        },
        { status: 400 }
      );
    }

    if (!brand || typeof brand !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "brand is required (e.g. Visa, Mastercard, Verve).",
          },
        },
        { status: 400 }
      );
    }

    if (!expiryMonth || !expiryYear) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "expiryMonth and expiryYear are required.",
          },
        },
        { status: 400 }
      );
    }

    const normExpiryMonth = String(expiryMonth).padStart(2, "0");
    const normExpiryYear = String(expiryYear).length === 2 ? `20${expiryYear}` : String(expiryYear);

    const db = await getDbReady();

    // Check existing methods to determine default status
    const existing = await db
      .select()
      .from(userPaymentMethods)
      .where(eq(userPaymentMethods.userId, user.sub));

    const shouldBeDefault = body.isDefault === true || existing.length === 0;

    if (shouldBeDefault && existing.length > 0) {
      await db
        .update(userPaymentMethods)
        .set({ isDefault: false })
        .where(eq(userPaymentMethods.userId, user.sub));
    }

    const [saved] = await db
      .insert(userPaymentMethods)
      .values({
        userId: user.sub,
        authorizationCode: authorizationCode.trim(),
        cardType,
        brand: brand.trim(),
        last4: last4.trim(),
        expiryMonth: normExpiryMonth,
        expiryYear: normExpiryYear,
        bank: bank ? String(bank).trim() : null,
        isDefault: shouldBeDefault,
      })
      .returning();

    const result: PaymentMethod = {
      id: saved.id,
      brand: saved.brand,
      cardType: saved.cardType,
      last4: saved.last4,
      expiryMonth: saved.expiryMonth,
      expiryYear: saved.expiryYear,
      bank: saved.bank,
      isDefault: saved.isDefault,
      createdAt: saved.createdAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<PaymentMethod>>(
      {
        success: true,
        data: result,
        message: "Tokenized payment method registered successfully.",
      },
      { status: 201 }
    );
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

// DELETE /api/v1/payments/methods — Remove a saved payment method
export const DELETE = withAuth(async (req: NextRequest, { user }) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Payment method id query parameter is required." },
        },
        { status: 400 }
      );
    }

    const db = await getDbReady();

    const existing = await db
      .select()
      .from(userPaymentMethods)
      .where(and(eq(userPaymentMethods.id, id), eq(userPaymentMethods.userId, user.sub)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NOT_FOUND", message: "Payment method not found." },
        },
        { status: 404 }
      );
    }

    await db
      .delete(userPaymentMethods)
      .where(eq(userPaymentMethods.id, id));

    return NextResponse.json<ApiResponse<{ id: string }>>({
      success: true,
      data: { id },
      message: "Payment method removed successfully.",
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
