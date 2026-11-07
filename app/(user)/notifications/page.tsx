"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, Building2, MessageSquare, Scale, X, Bell } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTimeAgo } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  taskId?: string | null;
  createdAt: string;
}

function getIconForType(type: string) {
  switch (type) {
    case "TASK_UPDATE":
    case "TASK_COMPLETED":
      return { icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    case "PAYMENT":
      return { icon: Building2, color: "text-emerald-500", bg: "bg-emerald-500/10" };
    case "CHAT":
      return { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" };
    case "LEGAL":
      return { icon: Scale, color: "text-purple-500", bg: "bg-purple-500/10" };
    case "ENCROACHMENT":
    case "ALERT":
      return { icon: Search, color: "text-red-500", bg: "bg-red-500/10" };
    default:
      return { icon: Bell, color: "text-amber-500", bg: "bg-amber-500/10" };
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/notifications", { credentials: "include", headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNotifications(json.data);
        } else {
          setNotifications([]);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadNotifications();
  }, []);

  const handleDismiss = async (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/v1/notifications", {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({ notificationIds: [id] }),
      });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleClearAll = async () => {
    setNotifications([]);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/v1/notifications", {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({ markAllAsRead: true }),
      });
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  return (
    <div className="relative w-full text-[var(--text-heading)] pb-12 transition-colors duration-150">
      {/* ── Unified Page Header ── */}
      <PageHeader
        title="Notifications"
        showBack={true}
        onBack={() => router.back()}
        rightSlot={
          notifications.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[12px] font-semibold text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer px-1 py-1"
            >
              Clear all
            </button>
          ) : null
        }
      />

      {/* ── Notifications Content ── */}
      <div className="pt-1">
        {isLoading ? (
          <DynamicLoadingState variant="notifications" count={5} />
        ) : notifications.length === 0 ? (
          <EmptyState
            preset="notifications"
            action={{
              label: "Back to Dashboard",
              href: "/dashboard",
            }}
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const { icon: IconComp, color, bg } = getIconForType(notif.type);
              return (
                <div
                  key={notif.id}
                  className="group relative flex items-start gap-3.5 p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/70 hover:border-[var(--primary)]/40 shadow-xs transition-all"
                >
                  {/* Icon badge */}
                  <div
                    className={`relative shrink-0 w-10 h-10 rounded-full ${bg} flex items-center justify-center mt-0.5`}
                  >
                    <IconComp className={`w-5 h-5 ${color}`} />
                    {!notif.isRead && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--primary)] border-2 border-[var(--bg-card)] rounded-full" />
                    )}
                  </div>

                  {/* Body Text */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-[13.5px] sm:text-[14px] font-semibold text-[var(--text-heading)] leading-snug">
                      {notif.title}
                    </p>
                    {notif.body && (
                      <p className="text-[12px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
                        {notif.body}
                      </p>
                    )}
                    <p className="text-[11px] text-[var(--text-muted)]/80 mt-1 font-medium">
                      {formatTimeAgo(notif.createdAt)}
                    </p>
                  </div>

                  {/* Dismiss Button */}
                  <button
                    type="button"
                    onClick={() => handleDismiss(notif.id)}
                    aria-label="Dismiss notification"
                    className="absolute top-3.5 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
