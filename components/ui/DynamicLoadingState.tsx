"use client";

import React from "react";
import { Loader2, Radio } from "lucide-react";

export type LoadingVariant =
  | "tasks"
  | "properties"
  | "vault"
  | "chat"
  | "notifications"
  | "dashboard"
  | "details"
  | "generic";

interface DynamicLoadingStateProps {
  variant?: LoadingVariant;
  count?: number;
  message?: string;
  className?: string;
  showHeader?: boolean;
}

export function DynamicLoadingState({
  variant = "generic",
  count = 4,
  message,
  className = "",
  showHeader = false,
}: DynamicLoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content..."
      className={`w-full animate-in fade-in duration-300 ${className}`}
    >
      <span className="sr-only">Loading content...</span>

      {/* ─── OPTIONAL GENERIC HEADER SKELETON ─── */}
      {showHeader && (
        <div className="flex items-center justify-between h-14 mb-5 pb-1">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] shimmer-wave shrink-0" />
          <div className="h-5 w-36 bg-[var(--bg-secondary)] rounded-full shimmer-wave mx-auto" />
          <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] shimmer-wave shrink-0" />
        </div>
      )}

      {/* ─── TASKS VARIANT ─── */}
      {variant === "tasks" && (
        <div className="space-y-4">
          {/* Category Chips Shimmer */}
          <div className="flex items-center gap-2.5 overflow-hidden pb-1">
            {[80, 96, 110, 120].map((width, idx) => (
              <div
                key={idx}
                style={{ width: `${width}px` }}
                className="h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 shimmer-wave shrink-0"
              />
            ))}
          </div>

          {/* Task Card Skeletons */}
          <div className="space-y-3 pt-1">
            {Array.from({ length: count || 4 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full p-4 sm:p-4.5 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border-color)]/80 shadow-xs space-y-3"
              >
                {/* Title & Status Pill */}
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="h-4 bg-[var(--bg-secondary)] rounded-md shimmer-wave"
                    style={{ width: `${45 + (idx % 3) * 15}%` }}
                  />
                  <div className="h-6 w-20 rounded-full bg-[var(--bg-secondary)] shimmer-wave shrink-0" />
                </div>
                {/* Subtitle / Details */}
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 bg-[var(--bg-secondary)]/70 rounded-md shimmer-wave"
                    style={{ width: `${60 + (idx % 2) * 20}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Sync Status Notice */}
          <div className="flex items-center justify-center gap-2 pt-4 pb-2 text-[12px] text-[var(--text-muted)]">
            <Radio className="w-3.5 h-3.5 text-[var(--primary)] animate-pulse" />
            <span>{message || "Syncing task activities across active field agents..."}</span>
          </div>
        </div>
      )}

      {/* ─── PROPERTIES VARIANT ─── */}
      {variant === "properties" && (
        <div className="space-y-4">
          {/* Search Bar Shimmer */}
          <div className="h-12 w-full rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shimmer-wave" />

          {/* Interactive Map Card Skeleton with Radar Pulse */}
          <div className="relative w-full h-[220px] sm:h-[240px] rounded-3xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col items-center justify-center p-6 shadow-xs">
            {/* Ambient Background Grid Pattern */}
            <div className="absolute inset-0 opacity-15 dark:opacity-10 bg-[radial-gradient(circle_at_center,var(--primary)_1px,transparent_1px)] bg-[size:18px_18px]" />

            {/* Pulsing Concentric Radar Rings */}
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border border-[var(--primary)]/30 animate-radar-ping absolute" />
              <div className="w-16 h-16 rounded-full border border-[var(--primary)]/40 animate-ping absolute opacity-40" />
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/15 flex items-center justify-center relative z-10 shadow-sm border border-[var(--primary)]/30">
                <div className="w-3.5 h-3.5 rounded-full bg-[var(--primary)] animate-pulse" />
              </div>
            </div>

            <div className="relative z-10 mt-4 text-center space-y-1">
              <p className="text-[13px] font-semibold text-[var(--text-heading)]">
                {message || "Connecting to GPS Satellite Grid..."}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] font-mono">
                Acquiring property telemetry & coordinate boundaries
              </p>
            </div>
          </div>

          {/* Property List Skeletons */}
          <div className="space-y-2 pt-2">
            <div className="h-4 w-32 bg-[var(--bg-secondary)] rounded-md shimmer-wave mb-3" />
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] divide-y divide-[var(--border-color)] shadow-xs overflow-hidden">
              {Array.from({ length: count || 3 }).map((_, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-secondary)] shimmer-wave shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <div
                        className="h-3.5 bg-[var(--bg-secondary)] rounded-md shimmer-wave"
                        style={{ width: `${50 + (idx % 3) * 15}%` }}
                      />
                      <div className="h-2.5 w-3/4 bg-[var(--bg-secondary)]/60 rounded-md shimmer-wave" />
                    </div>
                  </div>
                  <div className="h-5 w-20 rounded-full bg-[var(--bg-secondary)] shimmer-wave shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── VAULT VARIANT ─── */}
      {variant === "vault" && (
        <div className="space-y-4">
          {/* Category Tabs Skeleton */}
          <div className="flex items-center gap-2 overflow-hidden pb-3">
            {[64, 80, 92, 110].map((w, idx) => (
              <div
                key={idx}
                style={{ width: `${w}px` }}
                className="h-8 rounded-full bg-[var(--bg-secondary)] shimmer-wave shrink-0"
              />
            ))}
          </div>

          {/* Document Rows */}
          <div className="space-y-3">
            {Array.from({ length: count || 5 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/70 shadow-2xs"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* File silhouette */}
                  <div className="w-8 h-10 rounded-md bg-[var(--bg-secondary)] shimmer-wave shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <div
                      className="h-3.5 bg-[var(--bg-secondary)] rounded-md shimmer-wave"
                      style={{ width: `${55 + (idx % 3) * 12}%` }}
                    />
                    <div className="h-2.5 w-1/2 bg-[var(--bg-secondary)]/60 rounded-md shimmer-wave" />
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] shimmer-wave shrink-0" />
              </div>
            ))}
          </div>

          <div className="text-center pt-3 pb-1 text-[12px] text-[var(--text-muted)]">
            <span>{message || "Loading encrypted document records..."}</span>
          </div>
        </div>
      )}

      {/* ─── CHAT VARIANT ─── */}
      {variant === "chat" && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="h-11 w-full rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shimmer-wave" />

          {/* Chat threads */}
          <div className="space-y-2">
            {Array.from({ length: count || 4 }).map((_, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/60 shadow-2xs"
              >
                <div className="w-13 h-13 rounded-full bg-[var(--bg-secondary)] shimmer-wave shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 bg-[var(--bg-secondary)] rounded-md shimmer-wave" />
                    <div className="h-3 w-10 bg-[var(--bg-secondary)]/60 rounded-md shimmer-wave" />
                  </div>
                  <div
                    className="h-3 bg-[var(--bg-secondary)]/70 rounded-md shimmer-wave"
                    style={{ width: `${60 + (idx % 3) * 15}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── NOTIFICATIONS VARIANT ─── */}
      {variant === "notifications" && (
        <div className="space-y-4 pt-1">
          {Array.from({ length: count || 5 }).map((_, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/60 shadow-2xs"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] shimmer-wave shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2 min-w-0">
                <div
                  className="h-3.5 bg-[var(--bg-secondary)] rounded-md shimmer-wave"
                  style={{ width: `${75 + (idx % 2) * 15}%` }}
                />
                <div className="h-2.5 w-32 bg-[var(--bg-secondary)]/60 rounded-md shimmer-wave" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── DASHBOARD VARIANT ─── */}
      {variant === "dashboard" && (
        <div className="space-y-5">
          {/* Stat counters grid */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 sm:p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/60 shadow-2xs space-y-3"
              >
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-secondary)] shimmer-wave" />
                <div className="h-4 w-12 bg-[var(--bg-secondary)] rounded-md shimmer-wave" />
                <div className="h-2.5 w-16 bg-[var(--bg-secondary)]/60 rounded-md shimmer-wave" />
              </div>
            ))}
          </div>

          {/* Live status banner */}
          <div className="h-18 rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)]/60 shimmer-wave" />

          {/* Hero Banner */}
          <div className="h-40 sm:h-52 rounded-[24px] bg-[var(--bg-secondary)] shimmer-wave" />

          {/* Quick actions grid */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="h-22 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/60 shimmer-wave"
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── DETAILS VARIANT ─── */}
      {variant === "details" && (
        <div className="space-y-5">
          {/* Hero media / status */}
          <div className="h-44 sm:h-56 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shimmer-wave" />

          {/* Data rows */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-4 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center py-1">
                <div className="h-3.5 w-24 bg-[var(--bg-secondary)] rounded shimmer-wave" />
                <div className="h-3.5 w-36 bg-[var(--bg-secondary)]/80 rounded shimmer-wave" />
              </div>
            ))}
          </div>

          {/* Action button skeleton */}
          <div className="h-12 w-full rounded-2xl bg-[var(--bg-secondary)] shimmer-wave" />
        </div>
      )}

      {/* ─── GENERIC VARIANT ─── */}
      {variant === "generic" && (
        <div className="space-y-3.5">
          {Array.from({ length: count || 4 }).map((_, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/80 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className="h-4 bg-[var(--bg-secondary)] rounded-md shimmer-wave"
                  style={{ width: `${45 + (idx % 3) * 15}%` }}
                />
                <div className="h-5 w-16 rounded-full bg-[var(--bg-secondary)] shimmer-wave" />
              </div>
              <div className="h-3 w-3/4 bg-[var(--bg-secondary)]/70 rounded-md shimmer-wave" />
            </div>
          ))}

          {message && (
            <div className="flex items-center justify-center gap-2 pt-3 text-[12px] text-[var(--text-muted)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
              <span>{message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
