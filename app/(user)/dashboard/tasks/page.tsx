"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Plus,
  ArrowLeft,
  X,
  Bolt,
  Scale,
  Building,
  FileText,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";

export type TaskStatus = "in_progress" | "ready" | "review" | "completed" | "pending";
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
}

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: "task-1",
    title: "Project review",
    subtitle: "Lekki duplex - Block B · In progress · by Tunde C...",
    category: "Property",
    status: "in_progress",
    agent: "Tunde C.",
    time: "2h ago",
    propertyAddress: "Plot 12, Lekki Phase 1",
  },
  {
    id: "task-2",
    title: "CAC certified copy",
    subtitle: "Property Oversite · Tunde C. · 2h ago",
    category: "Documents",
    status: "ready",
    agent: "Tunde C.",
    time: "2h ago",
  },
  {
    id: "task-3",
    title: "Ikoyi site visit",
    subtitle: "Property Oversite · Tunde C. · 2h ago",
    category: "Property",
    status: "ready",
    agent: "Tunde C.",
    time: "2h ago",
    propertyAddress: "14 Alexander Ave, Ikoyi",
  },
  {
    id: "task-4",
    title: "CAC certified copy",
    subtitle: "Document Processing · Folake A. · today",
    category: "Documents",
    status: "in_progress",
    agent: "Folake A.",
    time: "today",
  },
  {
    id: "task-5",
    title: "Utility bill payment",
    subtitle: "Document Processing · Folake A. · today",
    category: "Documents",
    status: "in_progress",
    agent: "Folake A.",
    time: "today",
  },
  {
    id: "task-6",
    title: "Vendor background check",
    subtitle: "Due Diligence · Tier 2 · yesterday",
    category: "Due Diligence",
    status: "review",
    agent: "Oversite Admin",
    time: "yesterday",
    priceNgn: 50000,
  },
  {
    id: "task-7",
    title: "Vendor background check",
    subtitle: "Due Diligence · Tier 2 · yesterday",
    category: "Due Diligence",
    status: "completed",
    agent: "Folake A.",
    time: "yesterday",
  },
];

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  in_progress: {
    label: "In progress",
    dot: "bg-[#F59E0B]",
    text: "text-[#D97706] dark:text-[#FBBF24]",
    bg: "bg-[#FEF3EB] dark:bg-amber-950/50",
  },
  ready: {
    label: "Ready",
    dot: "bg-[#2BB44A]",
    text: "text-[#2BB44A] dark:text-[#34D399]",
    bg: "bg-[#E8F8EC] dark:bg-emerald-950/50",
  },
  review: {
    label: "Review",
    dot: "bg-[#3B82F6]",
    text: "text-[#2563EB] dark:text-[#60A5FA]",
    bg: "bg-[#EFF6FF] dark:bg-blue-950/50",
  },
  completed: {
    label: "Completed",
    dot: "bg-[#9CA3AF]",
    text: "text-[#6B7280] dark:text-[#9CA3AF]",
    bg: "bg-[#F3F4F6] dark:bg-zinc-800",
  },
  pending: {
    label: "Pending",
    dot: "bg-[#3B82F6]",
    text: "text-[#2563EB] dark:text-[#60A5FA]",
    bg: "bg-[#EFF6FF] dark:bg-blue-950/50",
  },
};

const FILTER_CHIPS: TaskCategory[] = [
  "All",
  "Property",
  "Documents",
  "Due Diligence",
];

export default function TasksPage() {
  const router = useRouter();

  const [tasksList, setTasksList] = useState<TaskItem[]>(INITIAL_TASKS);
  const [activeChip, setActiveChip] = useState<TaskCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [createActionOpen, setCreateActionOpen] = useState(false);

  // Sync API tasks if available
  useEffect(() => {
    async function loadApiTasks() {
      try {
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
            else if (t.status === "UNDER_REVIEW" || t.status === "DRAFT") st = "review";

            return {
              id: t.id,
              title: t.title || "Custom Task",
              subtitle: `${cat} · ${t.agentId ? "Assigned Agent" : "Oversite Team"} · recent`,
              category: cat,
              status: st,
              agent: t.agentId ? "Assigned Agent" : "Oversite Team",
              time: "recent",
              priceNgn: t.priceNgn,
              propertyAddress: t.locationAddress,
            };
          });

          // Merge without losing initial screenshot tasks
          setTasksList([...apiTasks, ...INITIAL_TASKS]);
        }
      } catch (e) {
        console.error("Failed to load tasks from API:", e);
      }
    }

    loadApiTasks();
  }, []);

  // Filter tasks
  const filtered = tasksList.filter((task) => {
    const chipMatch = activeChip === "All" || task.category === activeChip;
    const searchMatch =
      !searchQuery.trim() ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const statusMatch =
      selectedStatusFilter === "all" || task.status === selectedStatusFilter;

    return chipMatch && searchMatch && statusMatch;
  });

  const handleTaskClick = (task: TaskItem) => {
    router.push(`/dashboard/tasks/${task.id}`);
  };

  return (
    <div className="bg-[#F2F4F2] dark:bg-[#111412] min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-[var(--text-heading)] transition-colors duration-150 -m-4 sm:-m-6 md:-m-8">
      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4 relative">
        <div>
          {/* ── Top Header (Matches Screenshot 1 Exactly) ── */}
          <div className="relative flex items-center justify-between py-3 mb-4">
            {searchActive ? (
              <div className="flex items-center gap-2 flex-1">
                <button
                  type="button"
                  onClick={() => {
                    setSearchActive(false);
                    setSearchQuery("");
                  }}
                  className="p-2 -ml-2 text-zinc-800 dark:text-zinc-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full bg-white dark:bg-[#1E2220] rounded-full px-4 py-2.5 text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none shadow-xs border border-transparent focus:border-[var(--primary)]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="w-10" />
                <h1 className="text-[19px] sm:text-[20px] font-bold text-zinc-900 dark:text-white tracking-tight text-center">
                  Tasks
                </h1>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSearchActive(true)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-[#1E2220] shadow-xs flex items-center justify-center text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label="Search tasks"
                  >
                    <Search className="w-5 h-5 stroke-[2.2]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterDrawerOpen(true)}
                    className="w-10 h-10 rounded-full bg-white dark:bg-[#1E2220] shadow-xs flex items-center justify-center text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label="Filter tasks"
                  >
                    <Filter className="w-5 h-5 stroke-[2.2]" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Filter Chips (Matches Screenshot 1 Exactly) ── */}
          <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide pb-2 mb-4 -mx-1 px-1">
            {FILTER_CHIPS.map((chip) => {
              const isSelected = activeChip === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setActiveChip(chip)}
                  className={`px-5 py-2 rounded-full text-[13.5px] sm:text-[14px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#2BB44A] text-white shadow-xs"
                      : "bg-white dark:bg-[#1E2220] text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 shadow-xs"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          {/* ── Task List (Matches Screenshot 1 Exactly) ── */}
          <div className="space-y-4 pt-1">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 text-[14px]">
                No tasks found
              </div>
            ) : (
              filtered.map((task) => {
                const st = STATUS_CONFIG[task.status] || STATUS_CONFIG.in_progress;
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleTaskClick(task)}
                    className="w-full flex items-center justify-between py-2 text-left hover:opacity-85 active:scale-[0.99] transition-all cursor-pointer group"
                  >
                    {/* Left: Title & Subtitle */}
                    <div className="min-w-0 pr-3 flex-1">
                      <h3 className="text-[15.5px] sm:text-[16px] font-bold text-zinc-900 dark:text-white truncate group-hover:text-[#2BB44A] transition-colors">
                        {task.title}
                      </h3>
                      <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate leading-snug">
                        {task.subtitle}
                      </p>
                    </div>

                    {/* Right: Status Pill matching Screenshot 1 */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 ${st.bg} shadow-2xs`}
                    >
                      <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                      <span className={`text-[12px] font-bold ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Space above bottom nav to ensure FAB never covers text */}
        <div className="pb-36" />

        {/* ── Floating Action Button (+) matching Screenshot 1 ── */}
        <button
          type="button"
          onClick={() => setCreateActionOpen(true)}
          className="fixed bottom-[88px] md:bottom-8 right-6 sm:right-8 z-30 w-14 h-14 rounded-full bg-[#2BB44A] hover:bg-[#259b40] active:scale-95 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer"
          aria-label="Create new task"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>

      {/* ── Status Filter Bottom Sheet ── */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setFilterDrawerOpen(false)}
          />
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#1A1E1D] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-5 shrink-0" />
            <h3 className="text-[18px] font-bold text-zinc-900 dark:text-white text-center mb-6 shrink-0">
              Filter by Status
            </h3>
            <div className="space-y-2">
              {[
                { id: "all", label: "All Tasks" },
                { id: "in_progress", label: "In progress" },
                { id: "ready", label: "Ready" },
                { id: "review", label: "Review (Price Proposal)" },
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
                      ? "bg-[#2BB44A]/10 text-[#2BB44A]"
                      : "text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
            className="relative w-full max-w-lg bg-white dark:bg-[#1A1E1D] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-5 shrink-0" />
            <h3 className="text-[18px] font-bold text-zinc-900 dark:text-white text-center mb-5 shrink-0">
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
