import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { payments } from "@/db/schema";

const db = getDb();

// ── Paystack API base URL ──
const PAYSTACK_BASE = "https://api.paystack.co";

export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { taskId, gateway } = body;
    const amountVal: number = body.amount ?? body.amountNgn;

    if (!taskId || !amountVal) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "taskId and amount are required" },
        },
        { status: 400 }
      );
    }

    const reference = `OVS_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // ── Insert a PENDING payment record first ──
    const [paymentRecord] = await db
      .insert(payments)
      .values({
        taskId,
        userId: user.sub,
        // Paystack expects amount in kobo (1 NGN = 100 kobo)
        amountNgn: String(amountVal),
        gateway: gateway === "FLUTTERWAVE" ? "FLUTTERWAVE" : "PAYSTACK",
        gatewayRef: reference,
        status: "PENDING",
      })
      .returning();

    // ── Call Paystack Initialize Transaction API ──
    // Docs: https://paystack.com/docs/api/transaction/#initialize
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      // No key configured — return a pending state so the checkout page
      // can show a meaningful error rather than a broken Stripe URL.
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GATEWAY_NOT_CONFIGURED",
            message:
              "Paystack secret key is not configured. Add PAYSTACK_SECRET_KEY to your environment variables.",
          },
        },
        { status: 503 }
      );
    }

    const callbackUrl =
      process.env.PAYSTACK_CALLBACK_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/tasks?payment=success&ref=${reference}&taskId=${taskId}`;

    const paystackRes = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,          // required by Paystack
        amount: amountVal * 100,    // convert NGN → kobo
        reference,
        currency: "NGN",
        callback_url: callbackUrl,
        metadata: {
          taskId,
          userId: user.sub,
          paymentRecordId: paymentRecord.id,
        },
      }),
    });

    const paystackData = await paystackRes.json();

    if (!paystackRes.ok || !paystackData.status) {
      // Paystack returned an error — surface it clearly
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GATEWAY_ERROR",
            message: paystackData?.message || "Paystack initialization failed",
          },
        },
        { status: 502 }
      );
    }

    const authorizationUrl: string = paystackData.data?.authorization_url;
    const accessCode: string = paystackData.data?.access_code;

    return NextResponse.json<
      ApiResponse<{
        reference: string;
        transactionReference: string;
        authorizationUrl: string;
        paymentUrl: string;
        accessCode: string;
        gateway: string;
      }>
    >({
      success: true,
      data: {
        reference: paymentRecord.gatewayRef!,
        transactionReference: paymentRecord.gatewayRef!,
        authorizationUrl,
        paymentUrl: authorizationUrl,
        accessCode,
        gateway: "PAYSTACK",
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
