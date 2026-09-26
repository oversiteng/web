import { randomInt } from "node:crypto";
import { getRedisClient } from "@/lib/cache/redis";

const memoryOtpStore = new Map<
  string,
  { code: string; expiresAt: number; attempts: number }
>();

const OTP_EXPIRY_SECONDS = 10 * 60; // 10 minutes
const MAX_ATTEMPTS = 5;

export function generateOtpCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

export async function storeOtp(
  identifier: string,
  code: string,
  expirySeconds = OTP_EXPIRY_SECONDS
): Promise<void> {
  const redis = getRedisClient();
  const key = `otp:${identifier}`;

  if (redis) {
    await redis.set(key, JSON.stringify({ code, attempts: 0 }), "EX", expirySeconds);
    return;
  }

  memoryOtpStore.set(identifier, {
    code,
    expiresAt: Date.now() + expirySeconds * 1000,
    attempts: 0,
  });
}

export async function verifyOtp(
  identifier: string,
  inputCode: string
): Promise<{ valid: boolean; reason?: string }> {
  const redis = getRedisClient();
  const key = `otp:${identifier}`;

  if (redis) {
    const raw = await redis.get(key);
    if (!raw) {
      return { valid: false, reason: "OTP expired or not found" };
    }

    const data = JSON.parse(raw) as { code: string; attempts: number };
    if (data.attempts >= MAX_ATTEMPTS) {
      await redis.del(key);
      return { valid: false, reason: "Too many failed attempts. Request a new OTP." };
    }

    if (data.code !== inputCode.trim()) {
      data.attempts += 1;
      const ttl = await redis.ttl(key);
      if (ttl > 0) {
        await redis.set(key, JSON.stringify(data), "EX", ttl);
      }
      return { valid: false, reason: "Invalid code" };
    }

    // Success: remove OTP
    await redis.del(key);
    return { valid: true };
  }

  // Memory fallback
  const record = memoryOtpStore.get(identifier);
  if (!record || record.expiresAt < Date.now()) {
    memoryOtpStore.delete(identifier);
    return { valid: false, reason: "OTP expired or not found" };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    memoryOtpStore.delete(identifier);
    return { valid: false, reason: "Too many failed attempts. Request a new OTP." };
  }

  if (record.code !== inputCode.trim()) {
    record.attempts += 1;
    return { valid: false, reason: "Invalid code" };
  }

  memoryOtpStore.delete(identifier);
  return { valid: true };
}
