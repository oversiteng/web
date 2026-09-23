import { NextResponse } from "next/server";

import {
  authenticateExternalKey,
  enforceExternalRateLimit,
} from "@/lib/api/externalAuth";
import { sendTemplatedEmail } from "@/lib/aws/ses";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authError = authenticateExternalKey(request);
  if (authError) return authError;

  const clientId = request.headers.get("x-client-id") ?? "anonymous";
  const ok = await enforceExternalRateLimit({ keyId: clientId, maxRequests: 30 });

  if (!ok) {
    ++++return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const body = (await request.json()) as {
++++toAddress ?: string;
  ++++subject ?: string;
  ++++htmlBody ?: string;
};

if (!body.toAddress || !body.subject || !body.htmlBody) {
  ++++return NextResponse.json(
    ++++{ error: "toAddress, subject and htmlBody are required" },
    ++++{ status: 400 },
    ++++);
}

await sendTemplatedEmail({
++++toAddress: body.toAddress,
  ++++subject: body.subject,
  ++++htmlBody: body.htmlBody,
  });

return NextResponse.json({ queued: true }, { status: 202 });
}
