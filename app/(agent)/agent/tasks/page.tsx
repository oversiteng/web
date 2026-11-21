"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatTimeAgo, getModuleName } from "@/lib/utils";
import { AgentTopNav } from "@/components/agent/AgentTopNav";
import {
  MapPin,
  Clock,
  ArrowRight,
  RotateCw,
  PlayCircle,
  Loader2,
  ClipboardList,
  MessageSquare,
} from "lucide-react";

export interface MyTaskItem {
  id: string;
  moduleType: string;
  title: string;
  locationAddress: string | null;
  status: string;
  priceNgn: number | string | null;
  agentPayoutNgn?: number | string | null;
  createdAt: string;
  agentId?: string | null;
  slaDeadline?: string | null;
}

function getTimeLeftLabel(task: MyTaskItem): string {
  if (task.slaDeadline) {
    const diffMs = new Date(task.slaDeadline).getTime() - Date.now();
    if (diffMs <= 0) return "Due now";
    const hrs = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
    return hrs >= 24 ? `${Math.round(hrs / 24)}d left` : `${hrs}h left`;
  }
  const isHappeningNow = ["AGENT_EN_ROUTE", "AGENT_ON_SITE", "IN_PROGRESS"].includes(task.status);
  return isHappeningNow ? "2h left" : "4h left";
}

function getAreaLabel(task: MyTaskItem): string {
  if (task.locationAddress) {
    const parts = task.locationAddress
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) return parts[parts.length - 2];
    if (parts.length === 1) return parts[0];
  }
  return getModuleName(task.moduleType);
}

export default function AgentTasksPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"ACTIVE" | "UNDER_REVIEW" | "COMPLETED">("ACTIVE");
  const [tasks, setTasks] = useState<MyTaskItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setIsRefreshing(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/tasks", { credentials: "include", headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Only show tasks explicitly assigned to this agent
          const myTasks = json.data.filter(
            (t: any) => t.agentId === user?.id && t.status !== "DRAFT"
          );
          setTasks(myTasks);
        } else {
          setTasks([]);
        }
      }
    } catch (err) {
      console.error("Tasks fetch error:", err);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  // Only accepted active tasks appear in Active; MATCHED/PENDING tasks stay in /agent/queue until accepted
  const activeTasks = tasks.filter((t) =>
    ["AGENT_EN_ROUTE", "AGENT_ON_SITE", "IN_PROGRESS"].includes(t.status)
  );
  const reviewTasks = tasks.filter((t) =>
    ["REPORT_SUBMITTED", "UNDER_REVIEW"].includes(t.status)
  );
  const completedTasks = tasks.filter((t) =>
    ["COMPLETED"].includes(t.status)
  );

  const displayTasks =
    filter === "ACTIVE"
      ? activeTasks
      : filter === "UNDER_REVIEW"
      ? reviewTasks
      : completedTasks;

  return (
    <div className="space-y-4 max-w-full pb-12">
      {/* ── 1. Unified Agent Top Navigation Bar ── */}
      <AgentTopNav
        showBack={true}
        backHref="/agent/dashboard"
        title="My Tasks"
        hideRightControls={true}
        rightSlot={
          <Link
            href="/agent/messages"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] transition-all"
            title="Messages"
            aria-label="Messages"
          >
            <MessageSquare className="w-5 h-5" />
          </Link>
        }
      />

      {/* ── 2. Filter Pills Row ── */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("ACTIVE")}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === "ACTIVE"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-color)]/60"
          }`}
        >
          Active ({activeTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("UNDER_REVIEW")}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === "UNDER_REVIEW"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-color)]/60"
          }`}
        >
          Under Review ({reviewTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("COMPLETED")}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            filter === "COMPLETED"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-color)]/60"
          }`}
        >
          Completed ({completedTasks.length})
        </button>
      </div>

      {/* ── 3. Task List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-xs text-[var(--text-muted)]">Loading your field tasks...</p>
        </div>
      ) : displayTasks.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md p-10 text-center space-y-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
          <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-[var(--text-heading)] font-bold text-sm">No tasks in this category</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {filter === "ACTIVE"
              ? "You have no active field tasks. Browse the Queue to claim incoming inspection jobs."
              : filter === "UNDER_REVIEW"
              ? "No inspection reports currently undergoing QA review."
              : "Your completed task logs will be archived here."}
          </p>
          {filter === "ACTIVE" && (
            <div className="pt-2">
              <Link
                href="/agent/queue"
                className="px-5 py-2.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold transition-all shadow-xs inline-block"
              >
                Browse Dispatch Queue
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayTasks.map((task) => {
            const isHappeningNow = ["AGENT_EN_ROUTE", "AGENT_ON_SITE", "IN_PROGRESS"].includes(
              task.status
            );
            const isCompleted = task.status === "COMPLETED";
            const isUnderReview = ["REPORT_SUBMITTED", "UNDER_REVIEW"].includes(task.status);
            const payoutNgn =
              task.agentPayoutNgn !== undefined && task.agentPayoutNgn !== null
                ? Number(task.agentPayoutNgn)
                : task.priceNgn
                  ? Number(task.priceNgn)
                  : 0;
            const timeLeft = getTimeLeftLabel(task);
            const ctaText = isHappeningNow
              ? "Continue task"
              : isUnderReview
                ? "View submission"
                : isCompleted
                  ? "View summary"
                  : "Start arrival";

            return (
              <Link
                key={task.id}
                href={`/agent/tasks/${task.id}`}
                className={`block rounded-[22px] p-5 space-y-4 transition-all cursor-pointer group ${
                  isHappeningNow
                    ? "bg-[var(--bg-card)] border border-[var(--primary)]/70 shadow-[0_0_16px_rgba(34,197,94,0.08)]"
                    : "bg-[var(--bg-card)]/80 border border-[var(--border-color)]/50 hover:border-[var(--primary)]/40"
                }`}
              >
                {/* Top Row: Status / Area + Time Left Pill */}
                <div className="flex items-center justify-between gap-3">
                  {isHappeningNow ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#dcfce7] text-[#15803d] text-[11px] font-extrabold tracking-wide uppercase">
                      <PlayCircle className="w-3.5 h-3.5 fill-[#22c55e] text-white" />
                      HAPPENING NOW
                    </span>
                  ) : isUnderReview ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-500/15 text-purple-500 text-[11px] font-bold uppercase tracking-wide">
                      UNDER REVIEW
                    </span>
                  ) : isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-500 text-[11px] font-bold uppercase tracking-wide">
                      COMPLETED
                    </span>
                  ) : (
                    <span className="text-[12.5px] font-medium text-[var(--text-muted)] truncate">
                      {getAreaLabel(task)}
                    </span>
                  )}

                  {!isCompleted && !isUnderReview && (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold shrink-0 ${
                        isHappeningNow
                          ? "bg-[#fef3c7] text-[#b45309]"
                          : "bg-zinc-100 dark:bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeLeft}</span>
                    </span>
                  )}
                </div>

                {/* Middle Row: Title + Address */}
                <div className="space-y-1.5">
                  <h3 className="text-[16px] font-bold text-[var(--text-heading)] leading-snug group-hover:text-[var(--primary)] transition-colors">
                    {task.title}
                  </h3>
                  <p className="text-[12.5px] text-[var(--text-muted)] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    <span className="truncate">
                      {task.locationAddress || "Coverage LGA coordinates recorded"}
                    </span>
                  </p>
                </div>

                {/* Bottom Row: Estimated Payout + Green Pill CTA */}
                <div className="flex items-end justify-between gap-3 pt-2">
                  <div>
                    <span className="block text-[11px] text-[var(--text-muted)] font-medium">
                      Estimated Payout
                    </span>
                    <span className="block text-[17px] font-extrabold text-[var(--primary)] tracking-tight mt-0.5">
                      {formatCurrency(payoutNgn)}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[var(--primary)] group-hover:bg-[var(--primary-hover)] text-white text-xs font-bold shadow-xs transition-all group-hover:translate-x-0.5 shrink-0">
                    <span>{ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
