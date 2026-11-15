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
  Play,
  CheckCircle2,
  Loader2,
  ClipboardList,
} from "lucide-react";

export interface MyTaskItem {
  id: string;
  moduleType: string;
  title: string;
  locationAddress: string | null;
  status: string;
  priceNgn: number | string | null;
  createdAt: string;
  agentId?: string | null;
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
          // Filter to tasks assigned to this agent
          const myTasks = json.data.filter(
            (t: any) => t.agentId === user?.id || (user?.role === "AGENT" && t.status !== "DRAFT")
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

  const activeTasks = tasks.filter((t) =>
    ["AGENT_EN_ROUTE", "AGENT_ON_SITE", "IN_PROGRESS", "PENDING", "MATCHED"].includes(t.status)
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
        title="My Tasks"
        subtitle="Active field missions, drafts & verification reports"
        rightSlot={
          <button
            type="button"
            onClick={fetchTasks}
            className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer shadow-xs"
            title="Refresh tasks"
            aria-label="Refresh tasks"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[var(--primary)]" : ""}`} />
          </button>
        }
      />

      {/* ── 2. Filter Pills Row ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("ACTIVE")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "ACTIVE"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xs"
          }`}
        >
          Active ({activeTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("UNDER_REVIEW")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "UNDER_REVIEW"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xs"
          }`}
        >
          Under Review ({reviewTasks.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("COMPLETED")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "COMPLETED"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xs"
          }`}
        >
          Completed ({completedTasks.length})
        </button>
      </div>

      {/* ── 3. Task List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-xs text-[var(--text-muted)]">Loading your field missions...</p>
        </div>
      ) : displayTasks.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md p-10 text-center space-y-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
          <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-[var(--text-heading)] font-bold text-sm">No tasks in this category</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {filter === "ACTIVE"
              ? "You have no active field missions. Browse the Queue to claim incoming inspection jobs."
              : filter === "UNDER_REVIEW"
              ? "No inspection reports currently undergoing QA review."
              : "Your completed mission logs will be archived here."}
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
        <div className="space-y-3">
          {displayTasks.map((task) => (
            <Link
              key={task.id}
              href={`/agent/tasks/${task.id}`}
              className="block bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 space-y-3 transition-all hover:border-[var(--primary-border)] shadow-[0_0_10px_rgba(0,0,0,0.03)] cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {getModuleName(task.moduleType)}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    task.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                      : task.status === "REPORT_SUBMITTED" || task.status === "UNDER_REVIEW"
                      ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                      : "bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)]"
                  }`}
                >
                  {task.status}
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[var(--text-heading)] leading-snug group-hover:text-[var(--primary)] transition-colors">
                  {task.title}
                </h3>
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span className="truncate">{task.locationAddress || "Coverage LGA coordinates recorded"}</span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                <div className="text-sm font-bold text-[var(--primary)]">
                  {task.priceNgn ? formatCurrency(task.priceNgn) : "₦10,000"}
                </div>
                <span className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
