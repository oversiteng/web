import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { ApiResponse } from "@/lib/types/api";
import { getRedisClient } from "@/lib/cache/redis";

export interface UserSettings {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  language: string;
  theme: "light" | "dark" | "system";
  twoFactorEnabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    push: true,
    email: true,
    sms: false,
  },
  language: "en",
  theme: "system",
  twoFactorEnabled: false,
};

const memorySettingsStore = new Map<string, UserSettings>();

async function getStoredSettings(userId: string): Promise<UserSettings> {
  const redis = getRedisClient();
  const key = `user_settings:${userId}`;

  if (redis) {
    try {
      const raw = await redis.get(key);
      if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      // Fallback to memory on Redis error
    }
  }

  return memorySettingsStore.get(userId) || { ...DEFAULT_SETTINGS };
}

async function saveStoredSettings(userId: string, settings: UserSettings): Promise<void> {
  const redis = getRedisClient();
  const key = `user_settings:${userId}`;

  memorySettingsStore.set(userId, settings);

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(settings));
    } catch {
      // Silently continue with memory store
    }
  }
}

export const GET = withAuth(async (req: NextRequest, { user }) => {
  try {
    const settings = await getStoredSettings(user.sub);
    return NextResponse.json<ApiResponse<UserSettings>>({
      success: true,
      data: settings,
      message: "User settings retrieved successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: (error as Error).message },
      },
      { status: 500 }
    );
  }
});

export const PATCH = withAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json();
    const current = await getStoredSettings(user.sub);

    const updated: UserSettings = {
      ...current,
      notifications: {
        ...current.notifications,
        ...(body.notifications || {}),
      },
      language: body.language !== undefined ? String(body.language) : current.language,
      theme: body.theme !== undefined ? body.theme : current.theme,
      twoFactorEnabled:
        body.twoFactorEnabled !== undefined ? Boolean(body.twoFactorEnabled) : current.twoFactorEnabled,
    };

    await saveStoredSettings(user.sub, updated);

    return NextResponse.json<ApiResponse<UserSettings>>({
      success: true,
      data: updated,
      message: "User settings updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: (error as Error).message },
      },
      { status: 500 }
    );
  }
});
