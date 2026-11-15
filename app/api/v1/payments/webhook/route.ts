import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { getDb } from "@/lib/db/client";
import { payments, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";

const db = getDb();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY || "";

    // ── Verify Paystack HMAC signature ──
    if (secret && signature) {
      const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
      if (hash !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event?.event || "";
    const eventData = event?.data || {};

    // ── Handle successful charge ──
    if (eventType === "charge.success") {
      const reference: string = eventData?.reference || "";
      const amountKobo: number = eventData?.amount ?? 0; // Paystack sends amount in kobo

      if (!reference) {
        return NextResponse.json({ received: true });
      }

      // 1. Find the payment record by gatewayRef
      const [paymentRecord] = await db
        .select()
        .from(payments)
        .where(eq(payments.gatewayRef, reference))
        .limit(1);

      if (!paymentRecord) {
        console.warn(`Webhook: payment record not found for ref ${reference}`);
        return NextResponse.json({ received: true });
      }

      // 2. Update payment status to CAPTURED
      await db
        .update(payments)
        .set({
          status: "CAPTURED",
          amountNgn: String(amountKobo / 100), // convert kobo → naira
        })
        .where(eq(payments.gatewayRef, reference));

      // 3. Update task status from DRAFT → PENDING (available for agent dispatch)
      if (paymentRecord.taskId) {
        await db
          .update(tasks)
          .set({ status: "PENDING" })
          .where(eq(tasks.id, paymentRecord.taskId));
      }
    }

    // ── Handle failed charge ──
    if (eventType === "charge.failed") {
      const reference: string = eventData?.reference || "";
      if (reference) {
        await db
          .update(payments)
          .set({ status: "FAILED" })
          .where(eq(payments.gatewayRef, reference));
        // Task stays in DRAFT — user can retry payment from their task list
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
