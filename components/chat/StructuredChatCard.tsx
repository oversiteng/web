"use client";

import React from "react";
import Link from "next/link";
import { ListChecks, FileCheck2, ArrowRight, ShieldCheck } from "lucide-react";

export interface StructuredChatPayload {
  cardType: string;
  milestoneTitle?: string;
  title?: string;
  stageDetails?: string;
  summary?: string;
  status?: string;
  mediaUrls?: string[];
  targetLink?: string;
  timestamp?: string;
  taskId?: string;
}

export function parseStructuredChatMessage(
  rawText?: string | null
): StructuredChatPayload | null {
  if (!rawText || typeof rawText !== "string") return null;
  const trimmed = rawText.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;

  try {
    const parsed = JSON.parse(trimmed);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.cardType === "string"
    ) {
      return parsed as StructuredChatPayload;
    }
  } catch {
    return null;
  }
  return null;
}

export function formatChatPreview(rawText?: string | null): string {
  if (!rawText) return "No messages yet";
  const structured = parseStructuredChatMessage(rawText);
  if (structured) {
    const label =
      structured.cardType === "FINAL_SUBMISSION"
        ? "Final Report"
        : structured.cardType === "MILESTONE_UPDATE"
          ? "Milestone Update"
          : "Task Update";
    const title = structured.milestoneTitle || structured.title || label;
    return `${label}: ${title}`;
  }
  return rawText;
}

interface StructuredChatCardProps {
  payload: StructuredChatPayload;
  role: "USER" | "AGENT" | "ADMIN";
  taskId?: string;
  fallbackTime?: string;
}

export function StructuredChatCard({
  payload,
  role,
  taskId,
  fallbackTime,
}: StructuredChatCardProps) {
  const isFinal = payload.cardType === "FINAL_SUBMISSION";
  const categoryLabel = isFinal
    ? "FINAL REPORT SUBMISSION"
    : payload.cardType === "PROPERTY_INTEL_UPDATE"
      ? "PROPERTY INTELLIGENCE UPDATE"
      : "MILESTONE EVENT UPDATE";

  const title = payload.milestoneTitle || payload.title || "Task Update";
  const details = payload.stageDetails || payload.summary || "";
  const statusText = payload.status || (isFinal ? "Submitted" : "Completed");
  const isCompleted = /complet|approv|verif/i.test(statusText);

  const actionHref =
    role === "ADMIN"
      ? `/admin/reports${taskId ? `?taskId=${taskId}` : ""}`
      : role === "AGENT"
        ? `/agent/tasks/${taskId || payload.taskId || ""}`
        : payload.targetLink ||
          (taskId ? `/dashboard/tasks/${taskId}` : "/dashboard/tasks");

  const actionLabel =
    role === "ADMIN"
      ? "Inspect Full Report"
      : isFinal
        ? "View Report Details"
        : "View Milestone Details";

  const Icon = isFinal ? FileCheck2 : payload.cardType === "PROPERTY_INTEL_UPDATE" ? ShieldCheck : ListChecks;

  return (
    <div className="w-full min-w-[260px] max-w-[420px] rounded-xl border border-emerald-500/35 bg-[var(--bg-card)] p-4 shadow-xs text-left">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-emerald-500 uppercase">
          <Icon className="w-3.5 h-3.5 shrink-0" />
          <span>{categoryLabel}</span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
            isCompleted
              ? "bg-emerald-500/15 text-emerald-500"
              : "bg-amber-500/15 text-amber-500"
          }`}
        >
          {statusText}
        </span>
      </div>

      <h4 className="text-sm font-bold text-[var(--text-heading)] leading-snug mb-1">
        {title}
      </h4>

      {details && (
        <p className="text-xs text-[var(--text-muted)] leading-relaxed line-clamp-3 mb-3">
          {details}
        </p>
      )}

      {Array.isArray(payload.mediaUrls) && payload.mediaUrls.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto">
          {payload.mediaUrls.slice(0, 4).map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Evidence ${idx + 1}`}
              className="w-11 h-11 rounded-md object-cover border border-[var(--border-color)] shrink-0"
            />
          ))}
          {payload.mediaUrls.length > 4 && (
            <span className="text-[10px] font-semibold text-[var(--text-muted)] px-1.5">
              +{payload.mediaUrls.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border-color)]/60">
        <span className="text-[11px] text-[var(--text-muted)]">
          {payload.timestamp || fallbackTime || ""}
        </span>
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

