"use client";

import { getStoredToken } from "@/lib/storage/clientStorage";

async function buildHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extra || {}),
  };

  try {
    const stored = await getStoredToken();
    const local =
      typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
    const token = stored || local;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // Ignore storage errors
  }

  return headers;
}

async function handleResponse(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    const msg =
      json?.error?.message ||
      json?.message ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export const apiClient = {
  async get<T = any>(url: string): Promise<T> {
    const headers = await buildHeaders();
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers,
    });
    return handleResponse(res);
  },

  async post<T = any>(url: string, body?: unknown): Promise<T> {
    const headers = await buildHeaders();
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  async patch<T = any>(url: string, body?: unknown): Promise<T> {
    const headers = await buildHeaders();
    const res = await fetch(url, {
      method: "PATCH",
      credentials: "include",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  async delete<T = any>(url: string): Promise<T> {
    const headers = await buildHeaders();
    const res = await fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers,
    });
    return handleResponse(res);
  },
};
