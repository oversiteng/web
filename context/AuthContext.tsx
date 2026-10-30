"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  getStoredUser,
  setStoredUser,
  getStoredToken,
  setStoredToken,
  clearAuthStorage,
} from "@/lib/storage/clientStorage";

export interface AuthUser {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  title?: string;
  address?: string;
  location?: string;
  occupation?: string;
  state?: string;
  country?: string;
  residence?: string;
  avatarUrl?: string | null;
  avatar?: string;
  kycStatus?: string;
  agentProfile?: {
    tier?: string;
    nbaNumber?: string | null;
    ninId?: string | null;
    rating?: string;
    totalTasks?: number;
    isAvailable?: boolean;
  } | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (userData: AuthUser, token?: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export function extractNonSensitiveUser(raw: any): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const name = (raw.name || raw.fullName || "").trim();
  return {
    id: raw.id,
    name: name,
    fullName: (raw.fullName || name).trim(),
    email: raw.email || "",
    phone: raw.phone || raw.phoneNumber || "",
    role: raw.role || "USER",
    title: raw.title || "",
    address: raw.address || "",
    location: raw.location || "",
    occupation: raw.occupation || "",
    state: raw.state || "",
    country: raw.country || "",
    residence: raw.residence || "",
    avatarUrl: raw.avatarUrl || raw.avatar || null,
    avatar: raw.avatar || raw.avatarUrl || undefined,
    kycStatus: raw.kycStatus || "PENDING",
    agentProfile: raw.agentProfile || null,
  };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setSession: async () => {},
  refreshUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async () => {
    try {
      const token = await getStoredToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/auth/me", { credentials: "include", headers });

      if (res.status === 401 || res.status === 404) {
        setUser(null);
        await clearAuthStorage();
        if (typeof window !== "undefined") {
          document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        return;
      }

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const sanitized = extractNonSensitiveUser(json.data);
          setUser(sanitized);
          if (sanitized) {
            await setStoredUser(sanitized);
          }
        }
      }
    } catch (e) {
      console.error("AuthContext: failed to refresh user", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSession = useCallback(async (userData: AuthUser, token?: string) => {
    const sanitized = extractNonSensitiveUser(userData);
    setUser(sanitized);
    setIsLoading(false);

    if (sanitized) {
      await setStoredUser(sanitized);
    }
    if (token) {
      await setStoredToken(token);
      if (typeof window !== "undefined") {
        document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
      }
    }
  }, []);

  // Hydrate immediately from localforage / storage on client mount
  useEffect(() => {
    let isMounted = true;

    async function hydrateInitialSession() {
      try {
        const [cachedToken, cachedUser] = await Promise.all([
          getStoredToken(),
          getStoredUser(),
        ]);

        if (isMounted) {
          if (cachedToken && cachedUser) {
            const sanitized = extractNonSensitiveUser(cachedUser);
            if (sanitized) {
              setUser(sanitized);
              setIsLoading(false);
            }
          } else if (!cachedToken) {
            setUser(null);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("AuthContext: error reading cached user from localforage", e);
      }

      if (isMounted) {
        await refreshUser();
      }
    }

    hydrateInitialSession();

    return () => {
      isMounted = false;
    };
  }, [refreshUser]);

  const logout = useCallback(async () => {
    setUser(null);
    setIsLoading(false);

    await clearAuthStorage();

    try {
      await fetch("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
    } catch (_) {}

    // Force hard redirect to immediately leave any protected dashboard routes
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setSession,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

