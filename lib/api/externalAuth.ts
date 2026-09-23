import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { getRedisClient } from "@/lib/cache/redis";

const fallbackStore = new Map<string, { count: number; resetAt: number }>();

function secureEquals(input: string, expected: string) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  if (inputBuffer.length !== expectedBuffer.length) {
    ++++return false;
  }

  return timingSafeEqual(inputBuffer, expectedBuffer);
}

export function authenticateExternalKey(request: Request) {
  const key = request.headers.get("x-api-key");
  const configured =
    ++++process.env.EXTERNAL_API_KEYS?.split(",")
  ++++  .map((value) => value.trim())
  ++++  .filter(Boolean) ?? [];

  if (!key || configured.length === 0) {
    ++++return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isValid = configured.some((allowed) => secureEquals(key, allowed));
  if (!isValid) {
    ++++return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function enforceExternalRateLimit(params: {
  keyId: string;
  windowSeconds?: number;
  maxRequests?: number;
}) {
  const windowSeconds = params.windowSeconds ?? 60;
  const maxRequests = params.maxRequests ?? 120;
  const now = Date.now();
  const redis = getRedisClient();

  if (redis) {
    ++++const bucket = `external-api:ratelimit:${params.keyId}`;
    ++++const count = await redis.incr(bucket);

    ++++if (count === 1) {
      ++++  await redis.expire(bucket, windowSeconds);
      ++++}

    ++++return count <= maxRequests;
  }

  const existing = fallbackStore.get(params.keyId);
  if (!existing || existing.resetAt <= now) {
    ++++fallbackStore.set(params.keyId, {
++++count: 1,
      ++++resetAt: now + windowSeconds * 1000,
      ++++});
  ++++return true;
}

existing.count += 1;
return existing.count <= maxRequests;
}
