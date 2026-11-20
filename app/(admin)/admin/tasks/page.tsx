"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Trash2,
  X,
  Check,
  MapPin,
  UserCheck,
  Coins,
  Calendar,
  LayoutGrid,
  List,
} from "lucide-react";
import { Task } from "@/lib/types/task";
import { formatCurrency } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";

const PAGE_SIZE = 12;

const MODULE_OPTIONS = [
  { key: "ALL", label: "All Modules" },
  { key: "PROPERTY_OVERSITE", label: "Property Oversite" },
  { key: "PROJECT_WATCH", label: "Project Watch" },
  { key: "DUE_DILIGENCE", label: "Due Diligence" },
  { key: "QUICK_ERRANDS", label: "Quick Errands" },
  { key: "LEGAL_ADVISORY", label: "Legal Advisory" },
  { key: "LAW_ENFORCEMENT", label: "Law Enforcement" },
  { key: "VULNERABILITY_TEST", label: "Vulnerability Test" },
];

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function isSubscriptionTask(task: Task): boolean {
  return (
    task.pricingMode === "SUBSCRIPTION_INCLUDED" ||
    task.quoteStatus === "INCLUDED_IN_SUBSCRIPTION" ||
    Boolean((task.formData as any)?.isSubscriptionIncluded)
  );
}

function getCreditsUsed(task: Task): number {
  if (isSubscriptionTask(task)) return 0;
  const fd = (task.formData as Record<string, any>) || {};
  if (typeof fd.creditsSpent === "number") return fd.creditsSpent;
  return Math.round(Number(task.clientPriceNgn ?? task.priceNgn ?? 0) / 1000);
}

interface SwipeableTaskCardProps {
  task: Task;
  canDelete: boolean;
  onOpen: (id: string) => void;
  onEditPay: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
}

function SwipeableTaskCard({
  task,
  canDelete,
  onOpen,
  onEditPay,
  onRequestDelete,
}: SwipeableTaskCardProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);

  const subTask = isSubscriptionTask(task);
  const creditsUsed = getCreditsUsed(task);
  const agentPay = Number(task.agentPayoutNgn ?? 0);

  const statusBadge =
    task.status === "COMPLETED"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
      : task.status === "DISPUTED" || task.status === "CANCELLED"
      ? "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30"
      : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";

  const handleStart = (clientX: number) => {
    if (!canDelete) return;
    startXRef.current = clientX;
    setIsDragging(true);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || startXRef.current === null) return;
    const delta = clientX - startXRef.current;
    if (delta < 0) {
      setDragX(Math.max(-130, delta));
    } else {
      setDragX(0);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    startXRef.current = null;
    if (dragX <= -80 && canDelete) {
      onRequestDelete(task);
    }
    setDragX(0);
  };

  const handleTouchEnd = () => {
    const moved = Math.abs(dragX) > 10;
    handleEnd();
    if (!moved) {
      const now = Date.now();
      if (now - lastTapRef.current < 320) {
        onOpen(task.id);
      }
      lastTapRef.current = now;
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden select-none group">
      {/* Crimson Delete Reveal Backdrop (visible on swipe left) */}
      {canDelete && (
        <div
          className={`absolute inset-0 rounded-lg bg-red-600 text-white flex items-center justify-end px-5 gap-2 transition-opacity ${
            dragX < -12 ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span className="text-xs font-bold">
            {dragX <= -80 ? "Release to Delete" : "Swipe to Delete"}
          </span>
        </div>
      )}

      {/* Animated Green-Accented Card */}
      <div
        onDoubleClick={() => onOpen(task.id)}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? "none" : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
        className="relative rounded-lg bg-gradient-to-br from-emerald-500/[0.08] via-[var(--bg-card)] to-[var(--bg-card)] border border-emerald-600/25 hover:border-emerald-500/60 hover:-translate-y-0.5 hover:shadow-md p-4 flex flex-col justify-between gap-3.5 cursor-pointer transition-all duration-200"
      >
        {/* Top Row: Module + Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
            {String(task.moduleType || "").replace(/_/g, " ")}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusBadge}`}>
            {String(task.status || "").replace(/_/g, " ")}
          </span>
        </div>

        {/* Title & Address */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[var(--text-heading)] line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {task.title}
          </h3>
          <p className="text-[11.5px] text-[var(--text-muted)] flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              {task.property?.address || task.locationAddress || "No address specified"}
            </span>
          </p>
        </div>

        {/* Client & Operative Info */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-500/15 text-[11px]">
          <div className="min-w-0">
            <p className="text-[var(--text-muted)]">Client</p>
            <p className="font-semibold text-[var(--text-heading)] truncate">
              {task.clientName || "Oversite Client"}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-[var(--text-muted)]">Operative</p>
            <p
              className={`font-semibold truncate flex items-center gap-1 ${
                task.agentId
                  ? "text-[var(--text-heading)]"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              <UserCheck className="w-3 h-3 shrink-0 text-emerald-600" />
              <span className="truncate">
                {task.agentId ? task.agentName || task.agentCode : "Unassigned"}
              </span>
            </p>
          </div>
        </div>

        {/* Credits & Agent Pay Strip */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-emerald-500/[0.08] border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-[var(--text-heading)]">
              {subTask ? "Subscription" : `${creditsUsed} Credits`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">
              Agent: {formatCurrency(agentPay)}
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEditPay(task);
              }}
              title="Set Agent Pay"
              className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500 text-[var(--text-heading)] cursor-pointer"
            >
              <Wallet className="w-3 h-3 text-emerald-600" />
            </button>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="flex items-center justify-between text-[10.5px] text-[var(--text-muted)] pt-0.5">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatShortDate(task.createdAt)}
          </span>
          <span>Double-tap to open{canDelete ? " · Swipe ← delete" : ""}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminTasksCommandPage() {
  const router = useRouter();
  const { user } = useAuth();
  const canDelete =
    user?.role === "SUPER_ADMIN" || Boolean(user?.adminPolicy?.canDelete);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "ALL" | "ACTIVE" | "AWAITING_QUOTE" | "COMPLETED" | "DISPUTED"
  >("ALL");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"CARDS" | "TABLE">("CARDS");
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete modal
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Set Agent Pay modal
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [agentPayInput, setAgentPayInput] = useState<string>("");
  const [isSavingPay, setIsSavingPay] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadAllTasks() {
      setIsLoading(true);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/tasks?limit=150", {
          credentials: "include",
          headers,
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTasks(json.data);
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error("Failed to load tasks:", err);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadAllTasks();
  }, []);

  const handleSaveTaskPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setIsSavingPay(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/tasks/${editingTask.id}/quote`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({ agentPayoutNgn: Number(agentPayInput) }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingTask.id
              ? {
                  ...t,
                  agentPayoutNgn: json.data.agentPayoutNgn,
                  isAgentPayExplicitlySet: true,
                }
              : t
          )
        );
        setEditingTask(null);
        showToast(`Agent Task Pay updated to ${formatCurrency(json.data.agentPayoutNgn)}`);
      } else {
        showToast(json.error?.message || "Failed to update task pay");
      }
    } catch {
      showToast("Network error while saving task pay");
    } finally {
      setIsSavingPay(false);
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskToDelete) return;
    setIsDeletingTask(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${taskToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
        showToast(json.message || `Deleted "${taskToDelete.title}" & notified client`);
      } else {
        showToast(json.error?.message || "Failed to delete task");
      }
    } catch {
      showToast("Network error while deleting task");
    } finally {
      setIsDeletingTask(false);
      setTaskToDelete(null);
    }
  };

  const counts = useMemo(() => {
    let active = 0;
    let awaitingQuote = 0;
    let completed = 0;
    let disputed = 0;
    for (const t of tasks) {
      if (t.status === "COMPLETED") completed++;
      else if (t.status === "DISPUTED") disputed++;
      else if (t.status !== "CANCELLED") active++;
      if (t.quoteStatus === "PENDING_ADMIN_PRICE") awaitingQuote++;
    }
    return { all: tasks.length, active, awaitingQuote, completed, disputed };
  }, [tasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (
        activeTab === "ACTIVE" &&
        (t.status === "COMPLETED" || t.status === "CANCELLED" || t.status === "DISPUTED")
      ) {
        return false;
      }
      if (activeTab === "AWAITING_QUOTE" && t.quoteStatus !== "PENDING_ADMIN_PRICE") {
        return false;
      }
      if (activeTab === "COMPLETED" && t.status !== "COMPLETED") {
        return false;
      }
      if (activeTab === "DISPUTED" && t.status !== "DISPUTED") {
        return false;
      }
      if (moduleFilter !== "ALL" && t.moduleType !== moduleFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          t.title.toLowerCase().includes(q) ||
          (t.locationAddress && t.locationAddress.toLowerCase().includes(q)) ||
          (t.clientName && t.clientName.toLowerCase().includes(q)) ||
          (t.agentName && t.agentName.toLowerCase().includes(q)) ||
          (t.agentCode && t.agentCode.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [tasks, activeTab, moduleFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const deleteRefundCredits = taskToDelete ? getCreditsUsed(taskToDelete) : 0;

  return (
    <div className="space-y-5">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[var(--bg-card)] border border-[var(--primary)] text-[var(--text-heading)] px-4 py-2 rounded-md shadow-lg text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Top Filter & Tabs Bar */}
      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-5 overflow-x-auto">
            {[
              { id: "ALL", label: "All Tasks", count: counts.all },
              { id: "ACTIVE", label: "Active", count: counts.active },
              { id: "AWAITING_QUOTE", label: "Awaiting Quote", count: counts.awaitingQuote },
              { id: "COMPLETED", label: "Completed", count: counts.completed },
              { id: "DISPUTED", label: "Disputed", count: counts.disputed },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`pb-2 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === tab.id
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[11px]">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search tasks, clients, agents..."
                className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-[var(--border-color)] text-xs font-medium text-[var(--text-heading)] hover:border-[var(--primary)] cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
            <div className="inline-flex items-center rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("CARDS")}
                title="Card Grid View"
                className={`h-8 px-2.5 rounded text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode === "CARDS"
                    ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("TABLE")}
                title="Table View"
                className={`h-8 px-2.5 rounded text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-colors ${
                  viewMode === "TABLE"
                    ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="px-5 py-3 bg-[var(--bg-secondary)]/60 border-t border-[var(--border-color)] flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[var(--text-muted)] mr-1">Module:</span>
            {MODULE_OPTIONS.map((mod) => (
              <button
                key={mod.key}
                type="button"
                onClick={() => {
                  setModuleFilter(mod.key);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                  moduleFilter === mod.key
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)]"
                }`}
              >
                {mod.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Animated Green Card Grid OR Table View */}
      {isLoading ? (
        <DynamicLoadingState variant="documents" count={6} />
      ) : paginated.length === 0 ? (
        <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-10 text-center text-xs text-[var(--text-muted)]">
          No tasks match the current filter.
        </div>
      ) : (
        <>
          {viewMode === "CARDS" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {paginated.map((task) => (
                <SwipeableTaskCard
                  key={task.id}
                  task={task}
                  canDelete={canDelete}
                  onOpen={(id) => router.push(`/admin/tasks/${id}`)}
                  onEditPay={(t) => {
                    setEditingTask(t);
                    setAgentPayInput(String(Number(t.agentPayoutNgn ?? 0)));
                  }}
                  onRequestDelete={(t) => setTaskToDelete(t)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[var(--border-color)] text-[11px] text-[var(--text-muted)]">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Task</th>
                      <th className="px-4 py-3 font-semibold">Client</th>
                      <th className="px-4 py-3 font-semibold">Operative</th>
                      <th className="px-4 py-3 font-semibold">Credits &amp; Agent Pay</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Created</th>
                      <th className="px-5 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)]">
                    {paginated.map((task) => {
                      const subTask = isSubscriptionTask(task);
                      const creditsUsed = getCreditsUsed(task);
                      const agentPay = Number(task.agentPayoutNgn ?? 0);
                      const statusBadge =
                        task.status === "COMPLETED"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : task.status === "DISPUTED" || task.status === "CANCELLED"
                          ? "bg-red-500/15 text-red-500"
                          : "bg-amber-500/15 text-amber-600 dark:text-amber-400";

                      return (
                        <tr
                          key={task.id}
                          onDoubleClick={() => router.push(`/admin/tasks/${task.id}`)}
                          className="hover:bg-[var(--bg-secondary)]/40 transition-colors cursor-pointer"
                        >
                          <td className="px-5 py-3.5 max-w-[260px]">
                            <p className="font-semibold text-[var(--text-heading)] truncate">
                              {task.title}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                              {String(task.moduleType || "").replace(/_/g, " ")} ·{" "}
                              {task.property?.address || task.locationAddress || "No address"}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-[var(--text-heading)]">
                            {task.clientName || "Oversite Client"}
                          </td>
                          <td className="px-4 py-3.5">
                            {task.agentId ? (
                              <span className="font-medium text-[var(--text-heading)]">
                                {task.agentName || task.agentCode}
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-[var(--text-heading)]">
                              {subTask ? "Subscription" : `${creditsUsed} Credits`}
                            </p>
                            <p className="text-[11px] font-semibold text-[var(--primary)]">
                              Agent: {formatCurrency(agentPay)}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${statusBadge}`}>
                              {String(task.status || "").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-[var(--text-muted)] whitespace-nowrap">
                            {formatShortDate(task.createdAt)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTask(task);
                                  setAgentPayInput(String(agentPay));
                                }}
                                className="px-2.5 h-8 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] text-[var(--text-heading)] text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Wallet className="w-3.5 h-3.5 text-[var(--primary)]" />
                                <span>Pay</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => router.push(`/admin/tasks/${task.id}`)}
                                className="px-3 h-8 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-xs font-medium text-[var(--text-heading)] cursor-pointer"
                              >
                                View
                              </button>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => setTaskToDelete(task)}
                                  className="w-8 h-8 rounded-md border border-red-500/25 text-red-500 hover:bg-red-500/10 inline-flex items-center justify-center cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] px-5 py-3 flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 font-medium text-[var(--text-heading)] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <span className="text-[var(--text-muted)]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 font-medium text-[var(--text-heading)] disabled:opacity-40 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Set Agent Pay Modal */}
      {editingTask && (
        <div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingTask(null)}
        >
          <form
            onSubmit={handleSaveTaskPay}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-heading)]">
                  Set Agent Task Pay
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate max-w-[300px]">
                  {editingTask.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-heading)] block">
                Agent Task Pay (NGN)
              </label>
              <input
                type="number"
                required
                value={agentPayInput}
                onChange={(e) => setAgentPayInput(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 h-9 rounded-md border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingPay}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingPay ? "Saving..." : "Save Pay"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete & Credit Refund Confirmation Modal */}
      <ConfirmModal
        open={Boolean(taskToDelete)}
        onCancel={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDeleteTask}
        title="Delete Task & Notify Client"
        description={
          deleteRefundCredits > 0
            ? `Permanently delete "${taskToDelete?.title}"? ${deleteRefundCredits} Oversite credits will be automatically refunded to the client's credit balance and they will be notified.`
            : `Permanently delete "${taskToDelete?.title}"? The client will be notified that this task was removed by Central Operations.`
        }
        confirmLabel={deleteRefundCredits > 0 ? "Delete & Refund Credits" : "Delete Task"}
        loading={isDeletingTask}
        variant="danger"
      />
    </div>
  );
}
