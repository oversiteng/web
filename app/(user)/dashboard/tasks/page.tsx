"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Search,
  Filter,
  Plus,
  X,
  Bolt,
  Scale,
  Building,
  FileText,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

export type TaskStatus =
  | "in_progress"
  | "ready"
  | "review"
  | "completed"
  | "pending"
  | "draft";
export type TaskCategory = "All" | "Property" | "Documents" | "Due Diligence";

export interface TaskItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Property" | "Documents" | "Due Diligence";
  status: TaskStatus;
  time?: string;
  agent?: string;
  priceNgn?: number;
  propertyAddress?: string;
  isFlagged?: boolean;
  period?: "this-month" | "earlier";
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  in_progress: {
    label: "In progress",
    dot: "bg-[var(--warning)]",
    text: "text-[var(--warning)]",
    bg: "bg-[var(--warning-light)]",
  },
  ready: {
    label: "Ready",
    dot: "bg-[var(--primary)]",
    text: "text-[var(--primary)]",
    bg: "bg-[var(--primary-light)]",
  },
  review: {
    label: "Review",
    dot: "bg-[var(--info)]",
    text: "text-[var(--info)]",
    bg: "bg-[var(--info-light)]",
  },
  completed: {
    label: "Completed",
    dot: "bg-[var(--text-muted)]",
    text: "text-[var(--text-muted)]",
    bg: "bg-[var(--bg-secondary)]",
  },
  pending: {
    label: "Submitted",
    dot: "bg-[var(--primary)]",
    text: "text-[var(--primary)]",
    bg: "bg-[var(--primary-light)]",
  },
  draft: {
    label: "Draft",
    dot: "bg-[var(--warning)]",
    text: "text-[var(--warning)]",
    bg: "bg-[var(--warning-light)]",
  },
};

const FILTER_CHIPS: TaskCategory[] = [
  "All",
  "Property",
  "Documents",
  "Due Diligence",
];

const FILTER_LABELS: Record<string, string> = {
  pending: "Pending",
  "this-month": "This Month",
  this_month: "This Month",
  month: "This Month",
  flagged: "Flagged",
  flag: "Flagged",
};

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: "task-1",
    title: "Project review",
    subtitle: "Lekki duplex - Block B · In progress · by Tunde C...",
    category: "Property",
    status: "in_progress",
    agent: "Tunde C.",
    time: "2h ago",
    propertyAddress: "Lekki duplex - Block B",
    isFlagged: false,
    period: "this-month",
  },
  {
    id: "task-2",
    title: "CAC certified copy",
    subtitle: "Property Oversite · Tunde C. · 2h ago",
    category: "Documents",
    status: "ready",
    agent: "Tunde C.",
    time: "2h ago",
    propertyAddress: "Property Oversite",
    isFlagged: false,
    period: "this-month",
  },
  {
    id: "task-3",
    title: "Vendor background check",
    subtitle: "Due Diligence · Tier 2 · yesterday",
    category: "Due Diligence",
    status: "review",
    agent: "Legal Partner",
    time: "yesterday",
    isFlagged: true,
    period: "earlier",
  },
];

function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterParam = searchParams.get("filter");
  const paymentParam = searchParams.get("payment");
  const paymentRef =
    searchParams.get("ref") ||
    searchParams.get("reference") ||
    searchParams.get("trxref");
  const callbackTaskId = searchParams.get("taskId");

  const [tasksList, setTasksList] = useState<TaskItem[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [activeChip, setActiveChip] = useState<TaskCategory>("All");
  const [activeFilter, setActiveFilter] = useState<string | null>(filterParam || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [createActionOpen, setCreateActionOpen] = useState(false);
  const [paymentSuccessBanner, setPaymentSuccessBanner] = useState(false);

  const loadApiTasks = useCallback(async () => {
    try {
      setIsLoadingTasks(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/tasks", { headers });
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const apiTasks: TaskItem[] = json.data.map((t: any) => {
          let cat: "Property" | "Documents" | "Due Diligence" = "Property";
          if (t.moduleType === "DOCUMENT_PROCESSING") cat = "Documents";
          if (t.moduleType === "DUE_DILIGENCE") cat = "Due Diligence";

          let st: TaskStatus = "in_progress";
          if (t.status === "COMPLETED") st = "completed";
          else if (t.status === "READY" || t.status === "REPORT_SUBMITTED") st = "ready";
          else if (t.status === "UNDER_REVIEW") st = "review";
          else if (t.status === "DRAFT") st = "draft";
          else if (t.status === "PENDING") st = "pending";

          const agentDisplay =
            t.agentName || (t.agentId ? "Assigned Agent" : "Oversite Team");

          return {
            id: t.id,
            title: t.title || "Custom Task",
            subtitle: `${t.locationAddress || cat} · ${agentDisplay} · recent`,
            category: cat,
            status: st,
            agent: agentDisplay,
            time: "recent",
            priceNgn: t.priceNgn,
            propertyAddress: t.locationAddress,
            isFlagged: t.status === "UNDER_REVIEW",
            period: "this-month" as const,
          };
        });

        setTasksList(() => {
          const existingIds = new Set(apiTasks.map((a) => a.id));
          const uniqueDefaults: TaskItem[] = [];
          return [...apiTasks, ...uniqueDefaults];
        });
      }
    } catch (e) {
      console.error("Failed to load tasks from API:", e);
    } finally {
      setIsLoadingTasks(false);
    }
  }, []);

  // ── Handle Paystack callback redirect & verify transaction before loading tasks ──
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function handlePaymentAndLoad() {
      const pendingTaskId =
        callbackTaskId ||
        (typeof window !== "undefined"
          ? sessionStorage.getItem("errand_pending_taskId")
          : null);

      if (paymentParam === "success" || paymentRef || pendingTaskId) {
        try {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("oversite_token")
              : null;
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          await fetch("/api/v1/payments/verify", {
            method: "POST",
            headers,
            body: JSON.stringify({
              reference: paymentRef || undefined,
              taskId: pendingTaskId || undefined,
            }),
          });

          if (typeof window !== "undefined") {
            sessionStorage.removeItem("errand_checkout");
            sessionStorage.removeItem("errand_pending_taskId");
          }
        } catch {
          // Non-blocking verification
        }
      }

      if (paymentParam === "success") {
        setPaymentSuccessBanner(true);
        const url = new URL(window.location.href);
        url.searchParams.delete("payment");
        url.searchParams.delete("ref");
        url.searchParams.delete("reference");
        url.searchParams.delete("trxref");
        url.searchParams.delete("taskId");
        window.history.replaceState({}, "", url.toString());
        timer = setTimeout(() => setPaymentSuccessBanner(false), 6000);
      }

      await loadApiTasks();
    }

    handlePaymentAndLoad();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [paymentParam, paymentRef, callbackTaskId, loadApiTasks]);

  // Sync activeFilter with URL parameter
  useEffect(() => {
    setActiveFilter(filterParam || null);
  }, [filterParam]);

  const handleClearFilter = () => {
    setActiveFilter(null);
    router.replace("/dashboard/tasks", { scroll: false });
  };

  // Filter tasks based on category, search, drawer status, and metric query filter
  const filtered = tasksList.filter((task) => {
    const chipMatch = activeChip === "All" || task.category === activeChip;
    const searchMatch =
      !searchQuery.trim() ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch =
      selectedStatusFilter === "all" || task.status === selectedStatusFilter;

    let activeFilterMatch = true;
    if (activeFilter === "pending") {
      activeFilterMatch =
        task.status === "pending" || task.status === "in_progress";
    } else if (activeFilter === "flagged" || activeFilter === "flag") {
      activeFilterMatch = Boolean(task.isFlagged) || task.status === "review";
    } else if (
      activeFilter === "this-month" ||
      activeFilter === "this_month" ||
      activeFilter === "month"
    ) {
      activeFilterMatch = task.period === "this-month";
    }

    return chipMatch && searchMatch && statusMatch && activeFilterMatch;
  });

  const handleTaskClick = (task: TaskItem) => {
    router.push(`/dashboard/tasks/${task.id}`);
  };

  return (
    <div className="relative w-full text-[var(--text-heading)] transition-colors duration-150">
      {/* ── Payment Success Banner ── */}
      {paymentSuccessBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-top-2 duration-300">
          <div className="bg-[var(--primary)] text-white rounded-2xl px-4 py-3.5 shadow-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px] font-bold leading-tight">Payment confirmed!</p>
              <p className="text-[12px] opacity-85 mt-0.5">
                Your task is now submitted and queued for agent assignment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaymentSuccessBanner(false)}
              className="shrink-0 opacity-70 hover:opacity-100 cursor-pointer p-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <div>
        {/* ── Unified Page Header ── */}
        <PageHeader
          title="Tasks"
          showBack={false}
          searchConfig={{
            active: searchActive,
            onActiveChange: setSearchActive,
            query: searchQuery,
            onQueryChange: setSearchQuery,
            placeholder: "Search tasks...",
          }}
          rightSlot={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchActive(true)}
                className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                aria-label="Search tasks"
              >
                <Search className="w-4 h-4 stroke-[2.2]" />
              </button>
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                aria-label="Filter tasks"
              >
                <Filter className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          }
        />

        {/* ── Category Chips ── */}
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide pb-2 mb-3 -mx-1 px-1">
          {FILTER_CHIPS.map((chip) => {
            const isSelected = activeChip === chip;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setActiveChip(chip)}
                className={`px-5 py-2 rounded-full text-[13.5px] sm:text-[14px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-(--primary) text-white shadow-xs"
                    : "bg-(--bg-card) text-(--text-heading) border border-(--border-color) hover:bg-(--bg-secondary) shadow-xs"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {activeFilter && (
          <div className="flex items-center mb-4">
            <button
              type="button"
              onClick={handleClearFilter}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--primary-light)] hover:bg-[var(--primary-border)] text-[var(--primary)] border border-[var(--primary-border)] text-[13px] font-semibold transition-all cursor-pointer group active:scale-95 shadow-xs"
              title="Clear filter"
            >
              <span>Filter: {FILTER_LABELS[activeFilter] || activeFilter}</span>
              <X className="w-3.5 h-3.5 stroke-[2.5] text-[var(--primary)] group-hover:opacity-80 transition-opacity" />
            </button>
          </div>
        )}

        {/* ── Task List ── */}
        <div className="space-y-3.5 pt-1">
          {isLoadingTasks ? (
            <DynamicLoadingState variant="tasks" />
          ) : filtered.length === 0 ? (
            searchQuery ? (
              <EmptyState
                preset="search"
                query={searchQuery}
                action={{
                  label: "Clear Search",
                  onClick: () => setSearchQuery(""),
                }}
              />
            ) : activeFilter || selectedStatusFilter !== "all" || activeChip !== "All" ? (
              <EmptyState
                preset="filter"
                action={{
                  label: "Reset All Filters",
                  onClick: () => {
                    handleClearFilter();
                    setSelectedStatusFilter("all");
                    setActiveChip("All");
                  },
                }}
              />
            ) : (
              <EmptyState
                preset="tasks"
                action={{
                  label: "Request a Service",
                  onClick: () => setCreateActionOpen(true),
                }}
              />
            )
          ) : (
            filtered.map((task) => {
              const st = STATUS_CONFIG[task.status] || STATUS_CONFIG.in_progress;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleTaskClick(task)}
                  className="w-full p-4 sm:p-4.5 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary)]/40 shadow-xs text-left transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <h3 className="text-[14.5px] sm:text-[15.5px] font-semibold text-[var(--text-heading)] truncate group-hover:text-[var(--primary)] transition-colors">
                      {task.title}
                    </h3>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 ${st.bg} shadow-2xs`}
                    >
                      <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                      <span className={`text-[11.5px] font-semibold ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-[12.5px] sm:text-[13px] text-[var(--text-muted)] truncate leading-snug">
                    {task.subtitle}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="pb-36" />

      {/* ── Floating Action Button (+) ── */}
      <button
        type="button"
        onClick={() => setCreateActionOpen(true)}
        className="fixed bottom-[88px] md:bottom-8 right-6 sm:right-8 z-30 w-14 h-14 rounded-full bg-(--primary) hover:bg-(--primary-hover) active:scale-95 text-white flex items-center justify-center shadow-lg shadow-(--primary)/30 transition-all cursor-pointer"
        aria-label="Create new task"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* ── Status Filter Bottom Sheet ── */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setFilterDrawerOpen(false)}
          />
          <div
            className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-[var(--border-color)] rounded-full mx-auto mb-5 shrink-0" />
            <h3 className="text-[18px] font-bold text-[var(--text-heading)] text-center mb-6 shrink-0">
              Filter by Status
            </h3>
            <div className="space-y-2">
              {[
                { id: "all", label: "All Tasks" },
                { id: "pending", label: "Submitted (Awaiting Dispatch)" },
                { id: "in_progress", label: "In progress" },
                { id: "ready", label: "Ready" },
                { id: "review", label: "Review (Price Proposal)" },
                { id: "draft", label: "Draft (Unpaid)" },
                { id: "completed", label: "Completed" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSelectedStatusFilter(opt.id);
                    setFilterDrawerOpen(false);
                  }}
                  className={`w-full py-3.5 px-4 rounded-2xl text-left font-semibold text-[14.5px] cursor-pointer transition-all ${
                    selectedStatusFilter === opt.id
                      ? "bg-[var(--primary-light)] text-[var(--primary)]"
                      : "text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions Drawer (+) ── */}
      {createActionOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setCreateActionOpen(false)}
          />
          <div
            className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-[var(--border-color)] rounded-full mx-auto mb-5 shrink-0" />
            <h3 className="text-[18px] font-bold text-[var(--text-heading)] text-center mb-5 shrink-0">
              Request New Service / Task
            </h3>
            <div className="space-y-2.5 overflow-y-auto max-h-[60vh] pr-1">
              <Link
                href="/projects"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[14.5px] font-bold text-zinc-900 dark:text-white">Project Review</p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400">Site progress, foundation, milestone audits</p>
                </div>
              </Link>

              <Link
                href="/vulnerability"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[14.5px] font-bold text-zinc-900 dark:text-white">Vulnerability Test</p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400">Buy, sell & lease simulations for property risks</p>
                </div>
              </Link>

              <Link
                href="/enforcement"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[14.5px] font-bold text-zinc-900 dark:text-white">Law Enforcement Liaison</p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400">Petitions & agency filings (NPF, EFCC, ICPC, LASBCA)</p>
                </div>
              </Link>

              <Link
                href="/diligence"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[14.5px] font-bold text-zinc-900 dark:text-white">Due Diligence</p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400">CAC registry, vendor verification, title search</p>
                </div>
              </Link>

              <Link
                href="/errands"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Bolt className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[14.5px] font-bold text-zinc-900 dark:text-white">Quick Errands</p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400">On-demand utility payments, pickups & site deliveries</p>
                </div>
              </Link>

              <Link
                href="/legal"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[14.5px] font-bold text-zinc-900 dark:text-white">Legal Advisory</p>
                  <p className="text-[12px] text-zinc-500 dark:text-zinc-400">Certified lawyers & tenancy dispute consultations</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-(--text-muted)">Loading tasks...</div>}>
      <TasksPageContent />
    </Suspense>
  );
}
