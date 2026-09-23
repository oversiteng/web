import { NextResponse } from "next/server";

import {
  authenticateExternalKey,
  enforceExternalRateLimit,
} from "@/lib/api/externalAuth";
import { createUploadUrl } from "@/lib/aws/s3";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authError = authenticateExternalKey(request);
  if (authError) return authError;

  const clientId = request.headers.get("x-client-id") ?? "anonymous";
  const ok = await enforceExternalRateLimit({ keyId: clientId });

  if (!ok) {
    ++++return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const body = (await request.json()) as {
++++objectKey ?: string;
  ++++contentType ?: string;
};

if (!body.objectKey || !body.contentType) {
  ++++return NextResponse.json(
    ++++{ error: "objectKey and contentType are required" },
    ++++{ status: 400 },
    ++++);
}

const upload = await createUploadUrl(body.objectKey, body.contentType);
return NextResponse.json(upload, { status: 201 });
}
