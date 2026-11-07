import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getDb } from "@/lib/db/client";
import { payments } from "@/db/schema";

const db = getDb();
export const POST = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const { taskId, gateway } = body; // gateway: 'PAYSTACK' | 'FLUTTERWAVE'
    const amountVal = body.amount ?? body.amountNgn;

    if (!taskId || !amountVal) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "taskId and amount are required" },
        },
        { status: 400 }
      );
    }

    const reference = `OVS_TXN_${Date.now()}`;
    
    // Insert pending payment into DB
    const [paymentRecord] = await db.insert(payments).values({
      taskId,
      userId: user.sub,
      amountNgn: String(amountVal),
      gateway: gateway === "FLUTTERWAVE" ? "FLUTTERWAVE" : "PAYSTACK",
      gatewayRef: reference,
      status: "PENDING",
    }).returning();

    // Proxy request to Payment Microservice
    let authorizationUrl = `https://checkout.stripe.com/pay/${reference}`;
    try {
      const msResponse = await fetch("http://localhost:4000/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          amount: amountVal,
          reference: paymentRecord.gatewayRef,
        }),
      });
      const msData = await msResponse.json();
      if (msData.clientSecret) {
        authorizationUrl = msData.clientSecret;
      }
    } catch (e) {
      console.warn("Payment MS unreachable, using fallback URL");
    }

    return NextResponse.json<
      ApiResponse<{
        reference: string;
        transactionReference: string;
        authorizationUrl: string;
        paymentUrl: string;
        gateway: string;
      }>
    >({
      success: true,
      data: {
        reference: paymentRecord.gatewayRef!,
        transactionReference: paymentRecord.gatewayRef!,
        authorizationUrl,
        paymentUrl: authorizationUrl,
        gateway: gateway || "PAYSTACK",
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
