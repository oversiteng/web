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

  // Check explicit mobile / platform headers from native apps (iOS / Android / React Native / Flutter)
  const explicitDeviceName =
    headers.get("x-device-name") ||
    headers.get("x-device-model") ||
    headers.get("device-name");

  const explicitPlatform =
    headers.get("x-platform") ||
    headers.get("x-os") ||
    headers.get("sec-ch-ua-platform");

  const explicitDeviceType = headers.get("x-device-type");

  const isMobileClient =
    /mobile|iphone|ipod|android|okhttp|cfnetwork|darwin|expo|dart|react-native|alamofire|dalvik/i.test(userAgent) ||
    /ios|android/i.test(explicitPlatform || "") ||
    explicitDeviceType === "mobile";

  const isTabletClient =
    /ipad|tablet/i.test(userAgent) ||
    explicitDeviceType === "tablet";

  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (isTabletClient) {
    deviceType = "tablet";
  } else if (isMobileClient) {
    deviceType = "mobile";
  }

  // Parse OS
  let os = "Unknown OS";
  if (/windows/i.test(userAgent) || /windows/i.test(explicitPlatform || "")) {
    os = "Windows";
  } else if (/iphone|ipad|ipod|ios/i.test(userAgent) || /ios/i.test(explicitPlatform || "")) {
    os = "iOS";
  } else if (/android|okhttp|dalvik/i.test(userAgent) || /android/i.test(explicitPlatform || "")) {
    os = "Android";
  } else if (/macintosh|mac os x|darwin|cfnetwork/i.test(userAgent)) {
    os = deviceType === "mobile" ? "iOS" : "macOS";
  } else if (/linux/i.test(userAgent)) {
    os = deviceType === "mobile" ? "Android" : "Linux";
  }

  // Parse Browser / App Client
  let browser = "Web Browser";
  if (
    deviceType === "mobile" &&
    /okhttp|cfnetwork|darwin|expo|dart|dalvik|react-native|alamofire/i.test(userAgent)
  ) {
    browser = "Oversite Mobile App";
  } else if (/edg/i.test(userAgent)) {
    browser = "Microsoft Edge";
  } else if (/opr|opera/i.test(userAgent)) {
    browser = "Opera";
  } else if (/chrome|crios/i.test(userAgent)) {
    browser = "Chrome";
  } else if (/firefox|fxios/i.test(userAgent)) {
    browser = "Firefox";
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = "Safari";
  }

  // Build clean, recognizable device name
  let deviceName = `${browser} on ${os}`;
  if (explicitDeviceName) {
    deviceName = explicitDeviceName;
  } else if (deviceType === "mobile") {
    if (os === "iOS") {
      deviceName = /ipad/i.test(userAgent) ? "Apple iPad" : "Apple iPhone";
    } else if (os === "Android") {
      const brandMatch = userAgent.match(
        /(samsung|pixel|redmi|xiaomi|infinix|tecno|oppo|vivo|huawei|oneplus|realme)[\s_-]?([a-zA-Z0-9_\-]+)?/i
      );
      deviceName = brandMatch
        ? `${brandMatch[1].charAt(0).toUpperCase() + brandMatch[1].slice(1)} ${brandMatch[2] || ""}`.trim()
        : "Android Mobile";
    }
  }

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
 * Creates or updates an active session record for the user, enforcing the ceiling of 
 * MAXIMUM 2 concurrent active sessions on DIFFERENT devices.
 * If the session is from the SAME device (e.g. another window on the same laptop),
 * updates the existing session record instead of creating a duplicate session.
 * If 2 distinct device sessions already exist and a new distinct device signs in,
 * automatically revokes the oldest session.
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
        deviceType: userSessions.deviceType,
        browser: userSessions.browser,
        os: userSessions.os,
        ipAddress: userSessions.ipAddress,
        userAgent: userSessions.userAgent,
        createdAt: userSessions.createdAt,
      })
      .from(userSessions)
      .where(and(eq(userSessions.userId, userId), eq(userSessions.isRevoked, false)))
      .orderBy(asc(userSessions.createdAt));

    // 2. Check if a session already exists for this SAME physical device
    // Matches by exact token hash OR same device signature (deviceType + OS + browser/deviceName)
    const existingDeviceSession = activeSessions.find((s) => {
      if (s.sessionTokenHash === tokenHash) return true;
      const sameDeviceSignature =
        s.deviceType === deviceInfo.deviceType &&
        s.os === deviceInfo.os &&
        (s.browser === deviceInfo.browser ||
          s.deviceName === deviceInfo.deviceName ||
          (s.deviceType === "mobile" && deviceInfo.deviceType === "mobile"));
      return sameDeviceSignature;
    });

    if (existingDeviceSession) {
      // Update the existing device session in place (keeps laptop as ONE session regardless of windows)
      await db
        .update(userSessions)
        .set({
          sessionTokenHash: tokenHash,
          ipAddress: deviceInfo.ipAddress,
          location: deviceInfo.location,
          userAgent: deviceInfo.userAgent,
          deviceName: deviceInfo.deviceName,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userSessions.id, existingDeviceSession.id));

      if (redis) {
        if (existingDeviceSession.sessionTokenHash !== tokenHash) {
          await redis.del(`session:${existingDeviceSession.sessionTokenHash}`);
        }
        await redis.set(`session:${tokenHash}`, userId, "EX", 60 * 60 * 24 * 7);
      }
      return;
    }

    // 3. Enforce strict max 2 DIFFERENT device sessions:
    // If user already has 2 or more distinct device sessions, revoke the oldest ones before adding the new device.
    if (activeSessions.length >= 2) {
      const numToRevoke = activeSessions.length - 1; // leave 1 space for the incoming new device
      const sessionsToRevoke = activeSessions.slice(0, numToRevoke);
      const idsToRevoke = sessionsToRevoke.map((s) => s.id);

      await db
        .update(userSessions)
        .set({ isRevoked: true })
        .where(inArray(userSessions.id, idsToRevoke));

      if (redis) {
        for (const s of sessionsToRevoke) {
          await redis.del(`session:${s.sessionTokenHash}`);
        }
      }
    }

    // 4. Detect unrecognized device/IP for security alert
    const isKnownDevice = activeSessions.some(
      (s) => s.ipAddress === deviceInfo.ipAddress || s.deviceName === deviceInfo.deviceName
    );

    if (!isKnownDevice && activeSessions.length > 0 && userEmail) {
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

    // 5. Save new active session for the distinct device
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

  const rawSessions = await db
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
    .orderBy(desc(userSessions.lastActiveAt));

  // Deduplicate by device fingerprint so multiple windows of the same device never show as multiple sessions
  const seenDevices = new Set<string>();
  const uniqueSessions: typeof rawSessions = [];

  for (const s of rawSessions) {
    const isCurrent = Boolean(currentHash && s.sessionTokenHash === currentHash);
    const deviceKey = `${s.deviceType}:${s.os}:${s.browser || s.deviceName}`;
    if (!seenDevices.has(deviceKey) || isCurrent) {
      seenDevices.add(deviceKey);
      uniqueSessions.push(s);
    } else {
      // Auto-revoke redundant duplicate session records in background
      db.update(userSessions)
        .set({ isRevoked: true })
        .where(eq(userSessions.id, s.id))
        .catch(() => null);
    }
    if (uniqueSessions.length >= 2) break;
  }

  return uniqueSessions.map((s) => ({
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

