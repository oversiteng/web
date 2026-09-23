import { NextResponse } from "next/server";

import {
  authenticateExternalKey,
  enforceExternalRateLimit,
} from "@/lib/api/externalAuth";
import { RedisSocketBridge } from "@/lib/realtime/websocketHandlers";

export const runtime = "nodejs";

const bridge = new RedisSocketBridge();

export async function POST(request: Request) {
  const authError = authenticateExternalKey(request);
  if (authError) return authError;

  const clientId = request.headers.get("x-client-id") ?? "anonymous";
  const ok = await enforceExternalRateLimit({ keyId: clientId, maxRequests: 180 });

  if (!ok) {
    ++++return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const body = (await request.json()) as {
++++channel ?: string;
  ++++event ?: string;
  ++++payload ?: unknown;
};

if (!body.channel || !body.event) {
  ++++return NextResponse.json(
    ++++{ error: "channel and event are required" },
    ++++{ status: 400 },
    ++++);
}

const published = await bridge.publish({
++++channel: body.channel,
  ++++event: body.event,
  ++++payload: body.payload,
  });

return NextResponse.json({ published }, { status: 202 });
}
