"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  Play,
  CheckCircle2,
} from "lucide-react";

export interface MyTaskItem {
  id: string;
  category: string;
  title: string;
  address: string;
  locationArea: string;
  status: "ACTIVE" | "UNDER_REVIEW" | "COMPLETED";
  isHappeningNow?: boolean;
  timeLeft?: string;
  payoutNgn: number;
}

const INITIAL_MY_TASKS: MyTaskItem[] = [
  {
    id: "task-active-01",
    category: "Document Processing",
    title: "CAC certified copy retrieval",
    address: "4 Bourdillon Close, Ikeja, Lagos",
    locationArea: "Lagos Island",
    status: "ACTIVE",
    payoutNgn: 7700,
  },
  {
    id: "task-draft-ikoyi",
    category: "Document Processing",
    title: "CAC certified copy retrieval",
    address: "4 Bourdillon Close, Ikoyi, Lagos.",
    locationArea: "Lagos Island",
    status: "ACTIVE",
    isHappeningNow: true,
    timeLeft: "2h left",
    payoutNgn: 7700,
  },
  {
    id: "task-active-03",
    category: "Property Oversite",
    title: "Boundary & Perimeter Inspection",
    address: "14 Admiralty Way, Lekki, Lagos.",
    locationArea: "Lekki Phase 1",
    status: "ACTIVE",
    timeLeft: "4h left",
    payoutNgn: 9500,
  },
  {
    id: "task-review-01",
    category: "Due Diligence",
    title: "Vendor background field check",
    address: "Broad Street, Lagos Island",
    locationArea: "Lagos Island",
    status: "UNDER_REVIEW",
    payoutNgn: 6000,
  },
  {
    id: "task-completed-01",
    category: "Document Processing",
    title: "Yaba CAC retrieval",
    address: "Herbert Macaulay Way, Yaba",
    locationArea: "Yaba, Lagos",
    status: "COMPLETED",
    payoutNgn: 4500,
  },
];

export default function AgentTasksPage() {
  const [filter, setFilter] = useState<"ACTIVE" | "UNDER_REVIEW" | "COMPLETED">("ACTIVE");
  const [tasks] = useState<MyTaskItem[]>(INITIAL_MY_TASKS);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeCount = tasks.filter((t) => t.status === "ACTIVE").length;
  const reviewCount = tasks.filter((t) => t.status === "UNDER_REVIEW").length;
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  const filteredTasks = tasks.filter((t) => t.status === filter);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="space-y-4">
      {/* 1. App Bar */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link
            href="/agent/dashboard"
            className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors shadow-xs"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold text-[var(--text-heading)] tracking-tight">My Tasks</h1>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors shadow-xs cursor-pointer" />
          <button
            type="button"
            onClick={handleRefresh}
            className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer shadow-xs"
            title="Refresh tasks"
            aria-label="Refresh tasks"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[var(--primary)]" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Filter Pills Row */}
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
          Active ({activeCount})
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
          Under Review ({reviewCount})
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
          Completed ({completedCount})
        </button>
      </div>

      {/* 3. Task Cards List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] p-8 text-center space-y-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
          <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-[var(--text-heading)] font-bold text-sm">No tasks in this view</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {filter === "ACTIVE"
              ? "You have no active assignments right now. Browse new requests in the Available Queue."
              : filter === "UNDER_REVIEW"
              ? "You have no reports currently pending quality review."
              : "Completed assignments and payouts will be archived here."}
          </p>
          {filter === "ACTIVE" && (
            <Link
              href="/agent/queue"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs mt-2 transition-colors"
            >
              <span>View Available Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isHappeningNow = !!task.isHappeningNow;

            return (
              <div
                key={task.id}
                className={`rounded-[24px] p-5 space-y-3 transition-all bg-[var(--bg-card)] shadow-[0_0_10px_rgba(0,0,0,0.03)] ${
                  isHappeningNow
                    ? "border border-[var(--primary)] ring-1 ring-[var(--primary)]/20"
                    : "border border-[var(--border-color)]/70 hover:border-[var(--primary-border)]"
                }`}
              >
                {/* Top Row: Location or HAPPENING NOW Badge + Status/Timer */}
                <div className="flex items-center justify-between">
                  {isHappeningNow ? (
                    <span className="bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)] text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-[var(--primary)]" />
                      <span>HAPPENING NOW</span>
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)] font-medium">{task.locationArea}</span>
                  )}

                  {task.timeLeft ? (
                    <span className="bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]/30 text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-[var(--warning)]" />
                      <span>{task.timeLeft}</span>
                    </span>
                  ) : task.status === "COMPLETED" ? (
                    <span className="bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)] text-[11px] px-2.5 py-0.5 rounded-full font-medium">
                      Completed
                    </span>
                  ) : (
                    <span className="bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] text-[var(--text-body)] border border-[var(--border-color)] text-[11px] px-2.5 py-0.5 rounded-full font-medium">
                      Assigned
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-heading)] leading-snug">{task.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    <span>{task.address}</span>
                  </div>
                </div>

                {/* Bottom Row: Estimated Payout + Action button */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] block">
                      Estimated Payout
                    </span>
                    <span className="text-base font-bold text-[var(--primary)]">
                      ₦{task.payoutNgn.toLocaleString()}
                    </span>
                  </div>

                  {isHappeningNow ? (
                    <Link
                      href={`/agent/tasks/${task.id}`}
                      className="px-5 py-2.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Continue task</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : task.status === "ACTIVE" ? (
                    <Link
                      href={`/agent/tasks/${task.id}`}
                      className="px-5 py-2.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Start arrival</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/agent/tasks/${task.id}`}
                      className="px-4 py-2 rounded-2xl bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] hover:bg-[var(--border-color)]/40 text-[var(--text-heading)] text-xs font-semibold border border-[var(--border-color)] transition-all inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
