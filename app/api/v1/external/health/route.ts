import { NextResponse } from "next/server";

import {
  authenticateExternalKey,
  enforceExternalRateLimit,
} from "@/lib/api/externalAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authError = authenticateExternalKey(request);
  if (authError) return authError;

  const clientId = request.headers.get("x-client-id") ?? "anonymous";
  const ok = await enforceExternalRateLimit({ keyId: clientId });

  if (!ok) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  return NextResponse.json({
    status: "ok",
    service: "oversite-external-api",
    version: "v1",
    timestamp: new Date().toISOString(),
  });
}
