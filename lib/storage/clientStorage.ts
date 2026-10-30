import localforage from "localforage";
import { AuthUser } from "@/context/AuthContext";

const DB_NAME = "oversite_app_db";
const AUTH_STORE_NAME = "auth_session";
const REPORTS_STORE_NAME = "offline_reports";

// Initialize dedicated localforage instance for authentication & session caching
export const authStorage =
  typeof window !== "undefined"
    ? localforage.createInstance({
        name: DB_NAME,
        storeName: AUTH_STORE_NAME,
        driver: [
          localforage.INDEXEDDB,
          localforage.WEBSQL,
          localforage.LOCALSTORAGE,
        ],
        description: "Oversite asynchronous client auth & profile storage",
      })
    : null;

// Initialize dedicated localforage instance for offline task reports & sync queue
export const offlineReportsStorage =
  typeof window !== "undefined"
    ? localforage.createInstance({
        name: DB_NAME,
        storeName: REPORTS_STORE_NAME,
        driver: [
          localforage.INDEXEDDB,
          localforage.WEBSQL,
          localforage.LOCALSTORAGE,
        ],
        description: "Oversite offline report sync drafts and deliverables",
      })
    : null;

export const STORAGE_KEYS = {
  USER: "oversite_user",
  TOKEN: "oversite_token",
} as const;

/**
 * Retrieve the cached non-sensitive user profile from localforage (with localStorage fallback)
 */
export async function getStoredUser(): Promise<AuthUser | null> {
  if (typeof window === "undefined") return null;

  try {
    if (authStorage) {
      const user = await authStorage.getItem<AuthUser>(STORAGE_KEYS.USER);
      if (user) return user;
    }

    // Fallback to localStorage if localforage has not populated yet
    const rawLocal = localStorage.getItem(STORAGE_KEYS.USER);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      return parsed;
    }
  } catch (err) {
    console.warn("clientStorage: failed to read stored user", err);
  }

  return null;
}

/**
 * Persist the non-sensitive user profile using localforage
 */
export async function setStoredUser(user: AuthUser): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (authStorage) {
      await authStorage.setItem(STORAGE_KEYS.USER, user);
    }
    // Also mirror to localStorage for instantaneous synchronous bootstrap on mount
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (err) {
    console.warn("clientStorage: failed to save user", err);
  }
}

/**
 * Retrieve the active auth token from localforage (with localStorage fallback)
 */
export async function getStoredToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    if (authStorage) {
      const token = await authStorage.getItem<string>(STORAGE_KEYS.TOKEN);
      if (token) return token;
    }
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (err) {
    console.warn("clientStorage: failed to read stored token", err);
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }
}

/**
 * Persist the auth token using localforage
 */
export async function setStoredToken(token: string): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (authStorage) {
      await authStorage.setItem(STORAGE_KEYS.TOKEN, token);
    }
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } catch (err) {
    console.warn("clientStorage: failed to save token", err);
  }
}

/**
 * Clear all authentication and session data across localforage and localStorage
 */
export async function clearAuthStorage(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (authStorage) {
      await Promise.all([
        authStorage.removeItem(STORAGE_KEYS.USER),
        authStorage.removeItem(STORAGE_KEYS.TOKEN),
      ]);
    }
  } catch (err) {
    console.warn("clientStorage: failed to clear localforage auth storage", err);
  } finally {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0";
  }
}
