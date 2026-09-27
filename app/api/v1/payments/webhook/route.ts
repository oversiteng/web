import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY || "";

    if (secret && signature) {
      const hash = createHmac("sha512", secret).update(rawBody).digest("hex");
      if (hash !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);

    // TODO: Handle event 'charge.success'
    // - Update payment status to 'CAPTURED' or 'ESCROWED'
    // - Update corresponding task status to 'PENDING' / 'MATCHED'
    // - Notify user and admin

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
