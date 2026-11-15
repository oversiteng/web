"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Star, Power } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

interface AgentTopNavProps {
  title?: string;
  subtitle?: string;
  showProfile?: boolean;
  showBack?: boolean;
  backHref?: string;
  onBack?: () => void;
  rightSlot?: React.ReactNode;
  hideRightControls?: boolean;
  className?: string;
}

export function AgentTopNav({
  title,
  subtitle,
  showProfile = false,
  showBack = false,
  backHref,
  onBack,
  rightSlot,
  hideRightControls = false,
  className = "",
}: AgentTopNavProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync online status with localStorage and API
  useEffect(() => {
    try {
      const stored = localStorage.getItem("oversite_agent_online");
      if (stored !== null) {
        setIsOnline(stored === "true");
      }
    } catch {
      // Ignore
    }
  }, []);

  // Fetch unread notifications count
  useEffect(() => {
    async function fetchUnread() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        if (!token) return;
        const res = await fetch("/api/v1/notifications", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            const unread = json.data.filter((n: any) => !n.isRead).length;
            setUnreadCount(unread);
          }
        }
      } catch {
        // Fallback silently
      }
    }
    fetchUnread();
  }, []);

  const handleToggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    try {
      localStorage.setItem("oversite_agent_online", String(next));
      window.dispatchEvent(new Event("oversite:agent-status-updated"));

      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      if (token && user?.id) {
        await fetch(`/api/v1/agents/${user.id}/availability`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isAvailable: next }),
        }).catch(() => null);
      }
    } catch {
      // Ignore
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/agent/dashboard");
    }
  };

  const agentName = user?.name || user?.fullName || "Agent";
  const agentInitial = agentName.charAt(0).toUpperCase() || "A";
  const rawId = (user?.id || "12344").replace(/[^a-zA-Z0-9]/g, "");
  const agentIdCode = rawId.slice(-5).toUpperCase() || "12344";
  const agentIdDisplay = `Agent #OS-${agentIdCode}`;

  const rating = user?.agentProfile?.rating ? parseFloat(user.agentProfile.rating).toFixed(1) : "4.9";
  const totalTasks = typeof user?.agentProfile?.totalTasks === "number" ? user.agentProfile.totalTasks : 128;
  const avatarImage = user?.avatarUrl || user?.avatar || null;

  return (
    <header
      className={`flex items-center justify-between pt-1 pb-3 mb-3 ${
        hideRightControls ? "" : "border-b border-[var(--border-color)]/60"
      } min-h-[52px] ${className}`}
    >
      {/* ── Left Section ── */}
      <div className="flex items-center gap-3 min-w-0">
        {showBack ? (
          <button
            type="button"
            onClick={handleBack}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-heading)] transition-colors cursor-pointer shrink-0 active:scale-95 ${
              hideRightControls
                ? "-ml-1.5 hover:bg-[var(--bg-card)]"
                : "bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs hover:bg-[var(--bg-secondary)]"
            }`}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>
        ) : null}

        {showProfile ? (
          /* Agent Profile Snippet (Dashboard) */
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/agent/stats"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-extrabold text-base shadow-xs shrink-0 overflow-hidden hover:opacity-90 transition-opacity border border-[var(--border-color)]"
            >
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt={agentIdDisplay}
                  className="w-full h-full object-cover"
                />
              ) : (
                agentInitial
              )}
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-heading)] font-bold text-sm sm:text-base leading-tight truncate">
                  {agentIdDisplay}
                </span>
              </div>
              <Link
                href="/agent/stats"
                className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--primary)] font-medium transition-colors"
              >
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{rating} · {totalTasks} {totalTasks === 1 ? "task" : "tasks"}</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Standard Page Title */
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-[var(--text-heading)] tracking-tight truncate">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-[11px] sm:text-xs text-[var(--text-muted)] truncate">
                {subtitle}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Right Section (Universal Actions) ── */}
      {!hideRightControls ? (
        <div className="flex items-center gap-2 shrink-0">
          {rightSlot}

          {/* Online / Offline Toggle Pill */}
          <button
            type="button"
            onClick={handleToggleOnline}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isOnline
                ? "bg-[var(--primary-light)] border-[var(--primary-border)] text-[var(--primary)]"
                : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
            }`}
            title={isOnline ? "Click to go Offline" : "Click to go Online"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-[var(--primary)] animate-pulse" : "bg-[var(--text-muted)]"
              }`}
            />
            <span className="hidden sm:inline">{isOnline ? "Online" : "Offline"}</span>
            <Power className="w-3 h-3 sm:hidden" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors shadow-xs cursor-pointer" />

          {/* Notifications Bell */}
          <Link
            href="/notifications"
            className="relative w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors shadow-xs cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </Link>
        </div>
      ) : rightSlot ? (
        <div className="flex items-center gap-2 shrink-0">{rightSlot}</div>
      ) : null}
    </header>
  );
}

