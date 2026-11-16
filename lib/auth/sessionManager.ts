import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { eq, and, desc, asc, not, inArray } from "drizzle-orm";
import { getDbReady } from "@/lib/db/client";
import { userSessions, users } from "@/db/schema";
import { getRedisClient } from "@/lib/cache/redis";
import { sendEmailAsync } from "@/lib/services/mailService";

export interface DeviceInfo {
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  userAgent: string;
}

export interface ActiveSessionDto {
  id: string;
  deviceName: string;
  deviceType: string;
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  location: string | null;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function parseClientDevice(req: NextRequest | Request): DeviceInfo {
  const headers = req.headers;
  
  // Extract real IP
  const forwardedFor = headers.get("x-forwarded-for");
  const ipAddress =
    headers.get("cf-connecting-ip") ||
    (forwardedFor ? forwardedFor.split(",")[0].trim() : null) ||
    headers.get("x-real-ip") ||
    "127.0.0.1";

  const userAgent = headers.get("user-agent") || "Unknown Device";
  const countryHeader = headers.get("cf-ipcountry");
  const location = countryHeader ? `Location (${countryHeader})` : "Nigeria";

  // Parse OS
  let os = "Unknown OS";
  if (/windows/i.test(userAgent)) os = "Windows";
  else if (/macintosh|mac os x/i.test(userAgent)) os = "macOS";
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = "iOS";
  else if (/android/i.test(userAgent)) os = "Android";
  else if (/linux/i.test(userAgent)) os = "Linux";

  // Parse Browser
  let browser = "Unknown Browser";
  if (/edg/i.test(userAgent)) browser = "Microsoft Edge";
  else if (/opr|opera/i.test(userAgent)) browser = "Opera";
  else if (/chrome|crios/i.test(userAgent)) browser = "Chrome";
  else if (/firefox|fxios/i.test(userAgent)) browser = "Firefox";
  else if (/safari/i.test(userAgent)) browser = "Safari";

  // Parse Device Type
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (/ipad|tablet/i.test(userAgent)) {
    deviceType = "tablet";
  } else if (/mobile|iphone|android/i.test(userAgent)) {
    deviceType = "mobile";
  }

  const deviceName = `${browser} on ${os}`;

  return {
    deviceName,
    deviceType,
    browser,
    os,
    ipAddress,
    location,
    userAgent,
  };
}

/**
 * Creates a new session record for the user, enforcing the ceiling of 
 * MAXIMUM 2 concurrent active sessions on different devices.
 * If 2 sessions already exist, automatically revokes the oldest session.
 * Dispatches an asynchronous non-blocking security alert email if an unrecognized device/IP is used.
 */
export async function createSession(params: {
  userId: string;
  req: NextRequest | Request;
  token: string;
  userEmail?: string;
  userName?: string;
}): Promise<void> {
  const { userId, req, token, userEmail, userName } = params;
  const db = await getDbReady();
  const redis = getRedisClient();
  const tokenHash = hashSessionToken(token);
  const deviceInfo = parseClientDevice(req);

  try {
    // 1. Fetch current active sessions
    const activeSessions = await db
      .select({
        id: userSessions.id,
        sessionTokenHash: userSessions.sessionTokenHash,
        deviceName: userSessions.deviceName,
        ipAddress: userSessions.ipAddress,
        createdAt: userSessions.createdAt,
      })
      .from(userSessions)
      .where(and(eq(userSessions.userId, userId), eq(userSessions.isRevoked, false)))
      .orderBy(asc(userSessions.createdAt));

    // 2. Enforce strict max 2 sessions:
    // If user already has 2 or more active sessions, revoke the oldest ones so only 1 remains before inserting the new one.
    if (activeSessions.length >= 2) {
      const numToRevoke = activeSessions.length - 1; // leave 1 space for the incoming session
      const sessionsToRevoke = activeSessions.slice(0, numToRevoke);
      const idsToRevoke = sessionsToRevoke.map((s) => s.id);

      await db
        .update(userSessions)
        .set({ isRevoked: true })
        .where(inArray(userSessions.id, idsToRevoke));

      // Invalidate revoked session caches in Redis
      if (redis) {
        for (const s of sessionsToRevoke) {
          await redis.del(`session:${s.sessionTokenHash}`);
        }
      }
    }

    // 3. Detect unrecognized device/IP for security alert
    // If user has prior session history and this IP/Device is completely new, send session alert
    const isKnownDevice = activeSessions.some(
      (s) => s.ipAddress === deviceInfo.ipAddress || s.deviceName === deviceInfo.deviceName
    );

    if (!isKnownDevice && activeSessions.length > 0 && userEmail) {
      // Non-blocking security alert email
      sendEmailAsync({
        to: userEmail,
        subject: "Security Alert: New Sign-In to Oversite",
        template: "NEW_LOGIN_ALERT",
        payload: {
          name: userName || "User",
          deviceName: deviceInfo.deviceName,
          ipAddress: deviceInfo.ipAddress,
          location: deviceInfo.location,
          time: new Date().toUTCString(),
        },
      }).catch((err) => console.error("[SessionManager] Security alert email dispatch error:", err));
    }

    // 4. Save new active session
    await db.insert(userSessions).values({
      userId,
      sessionTokenHash: tokenHash,
      deviceName: deviceInfo.deviceName,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ipAddress: deviceInfo.ipAddress,
      location: deviceInfo.location,
      userAgent: deviceInfo.userAgent,
      isRevoked: false,
    });

    // 5. Cache active session token in Redis (7 days TTL)
    if (redis) {
      await redis.set(`session:${tokenHash}`, userId, "EX", 60 * 60 * 24 * 7);
    }
  } catch (err) {
    console.error("[SessionManager] Error creating session:", err);
  }
}

/**
 * Validates whether a given token's session is still active and not revoked.
 */
export async function validateSession(token: string): Promise<boolean> {
  if (!token) return false;
  const tokenHash = hashSessionToken(token);
  const redis = getRedisClient();

  if (redis) {
    const cachedUserId = await redis.get(`session:${tokenHash}`);
    if (cachedUserId) return true;
  }

  // Fallback to database check
  const db = await getDbReady();
  const session = await db
    .select({ id: userSessions.id, isRevoked: userSessions.isRevoked })
    .from(userSessions)
    .where(eq(userSessions.sessionTokenHash, tokenHash))
    .limit(1);

  if (session.length === 0 || session[0].isRevoked) {
    return false;
  }

  // Re-populate Redis cache
  if (redis) {
    await redis.set(`session:${tokenHash}`, "valid", "EX", 60 * 60 * 24 * 7);
  }

  return true;
}

/**
 * Revokes a single session remotely by session ID.
 */
export async function revokeSession(sessionId: string, userId: string): Promise<boolean> {
  const db = await getDbReady();
  const redis = getRedisClient();

  const sessions = await db
    .select({ id: userSessions.id, sessionTokenHash: userSessions.sessionTokenHash })
    .from(userSessions)
    .where(and(eq(userSessions.id, sessionId), eq(userSessions.userId, userId)))
    .limit(1);

  if (sessions.length === 0) return false;

  await db
    .update(userSessions)
    .set({ isRevoked: true })
    .where(eq(userSessions.id, sessionId));

  if (redis) {
    await redis.del(`session:${sessions[0].sessionTokenHash}`);
  }

  return true;
}

/**
 * Revokes all sessions belonging to the user except the current active session.
 */
export async function revokeAllOtherSessions(userId: string, currentToken: string): Promise<number> {
  const db = await getDbReady();
  const redis = getRedisClient();
  const currentHash = hashSessionToken(currentToken);

  const otherSessions = await db
    .select({ id: userSessions.id, sessionTokenHash: userSessions.sessionTokenHash })
    .from(userSessions)
    .where(
      and(
        eq(userSessions.userId, userId),
        eq(userSessions.isRevoked, false),
        not(eq(userSessions.sessionTokenHash, currentHash))
      )
    );

  if (otherSessions.length === 0) return 0;

  const idsToRevoke = otherSessions.map((s) => s.id);
  await db
    .update(userSessions)
    .set({ isRevoked: true })
    .where(inArray(userSessions.id, idsToRevoke));

  if (redis) {
    for (const s of otherSessions) {
      await redis.del(`session:${s.sessionTokenHash}`);
    }
  }

  return otherSessions.length;
}

/**
 * Lists all active (non-revoked) sessions for the user, with max 2 returned.
 */
export async function listUserSessions(
  userId: string,
  currentToken?: string
): Promise<ActiveSessionDto[]> {
  const db = await getDbReady();
  const currentHash = currentToken ? hashSessionToken(currentToken) : null;

  const sessions = await db
    .select({
      id: userSessions.id,
      sessionTokenHash: userSessions.sessionTokenHash,
      deviceName: userSessions.deviceName,
      deviceType: userSessions.deviceType,
      browser: userSessions.browser,
      os: userSessions.os,
      ipAddress: userSessions.ipAddress,
      location: userSessions.location,
      lastActiveAt: userSessions.lastActiveAt,
      createdAt: userSessions.createdAt,
    })
    .from(userSessions)
    .where(and(eq(userSessions.userId, userId), eq(userSessions.isRevoked, false)))
    .orderBy(desc(userSessions.lastActiveAt))
    .limit(2); // strictly max 2 devices

  return sessions.map((s) => ({
    id: s.id,
    deviceName: s.deviceName,
    deviceType: s.deviceType,
    browser: s.browser,
    os: s.os,
    ipAddress: s.ipAddress,
    location: s.location,
    lastActiveAt: s.lastActiveAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    isCurrent: Boolean(currentHash && s.sessionTokenHash === currentHash),
  }));
}

