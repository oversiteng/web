"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BoltIcon,
  ChandelierIcon,
  DocumentIcon,
  PieChartIcon,
  MapPointSearchIcon,
  DocumentsMinimalisticIcon,
  ShieldCheckIcon,
  ObjectScanIcon,
} from "@solar-icons/react/outline";

type TaskStatus = "ready" | "in_progress" | "review" | "completed" | "pending";
type TaskCategory = "Property" | "Documents" | "Due Diligence" | "Errands" | "Legal" | "Other";

interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  agent: string;
  time: string;
  status: TaskStatus;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  priceNgn?: number;
  propertyId?: string;
}

const STATUS: Record<TaskStatus, { label: string; dot: string; text: string; bg: string }> = {
  pending:     { label: "Pending",     dot: "bg-blue-500",         text: "text-blue-500",          bg: "bg-blue-500/10" },
  ready:       { label: "Ready",       dot: "bg-[var(--primary)]", text: "text-[var(--primary)]",  bg: "bg-[var(--primary)]/10" },
  in_progress: { label: "In progress", dot: "bg-amber-500",        text: "text-amber-500",         bg: "bg-amber-500/10" },
  review:      { label: "Review",      dot: "bg-purple-500",       text: "text-purple-500",        bg: "bg-purple-500/10" },
  completed:   { label: "Completed",   dot: "bg-slate-400",        text: "text-[var(--text-muted)]", bg: "bg-[var(--bg-secondary)]" },
};

function mapModuleToCategory(moduleType: string): TaskCategory {
  switch (moduleType) {
    case "PROPERTY_OVERSITE":
      return "Property";
    case "DOCUMENT_PROCESSING":
      return "Documents";
    case "DUE_DILIGENCE":
      return "Due Diligence";
    case "QUICK_ERRANDS":
      return "Errands";
    case "LEGAL_ADVISORY":
      return "Legal";
    default:
      return "Other";
  }
}

function mapModuleToIcon(moduleType: string) {
  switch (moduleType) {
    case "PROPERTY_OVERSITE":
      return { icon: MapPointSearchIcon, color: "text-red-500" };
    case "DOCUMENT_PROCESSING":
      return { icon: DocumentsMinimalisticIcon, color: "text-emerald-500" };
    case "DUE_DILIGENCE":
      return { icon: PieChartIcon, color: "text-yellow-500" };
    case "QUICK_ERRANDS":
      return { icon: BoltIcon, color: "text-amber-500" };
    case "LEGAL_ADVISORY":
      return { icon: ChandelierIcon, color: "text-blue-500" };
    default:
      return { icon: DocumentIcon, color: "text-[var(--primary)]" };
  }
}

function mapApiStatus(status: string): TaskStatus {
  switch (status) {
    case "COMPLETED":
      return "completed";
    case "IN_PROGRESS":
    case "MATCHED":
      return "in_progress";
    case "READY":
      return "ready";
    case "PENDING":
    default:
      return "pending";
  }
}

const FILTER_CHIPS = ["All", "Property", "Documents", "Due Diligence", "Errands", "Legal"];

function TaskDetailSheet({ task, onClose }: { task: Task; onClose: () => void }) {
  const st = STATUS[task.status] || STATUS.pending;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[var(--bg-card)] rounded-t-3xl sm:rounded-3xl p-6 pb-10 sm:pb-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-5 sm:hidden" />

        {/* Icon + Status */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--bg-secondary)]`}>
            <task.icon size={24} className={task.iconColor} />
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${st.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
            <span className={`text-[11px] font-bold ${st.text}`}>{st.label}</span>
          </div>
        </div>

        {/* Title & Meta */}
        <h2 className="text-[18px] font-bold text-[var(--text-heading)] mb-1">{task.title}</h2>
        <p className="text-[12px] text-[var(--text-muted)] mb-4">
          {task.category} · {task.agent} · {task.time}
        </p>

        {/* Description */}
        <p className="text-[13px] text-[var(--text-body)] leading-relaxed mb-6">
          {task.description || "No additional instructions provided."}
        </p>

        {task.priceNgn && (
          <p className="text-[13px] font-semibold text-[var(--text-heading)] mb-6">
            Service Tariff: <span className="text-[var(--primary)]">₦{Number(task.priceNgn).toLocaleString()}</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {task.propertyId ? (
            <Link
              href={`/properties/${task.propertyId}`}
              className="flex-1 py-3 text-center rounded-2xl bg-[var(--primary)] text-white font-semibold text-[14px] hover:bg-[var(--primary-hover)] transition-colors"
            >
              View Linked Property
            </Link>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-[var(--primary)] text-white font-semibold text-[14px] hover:bg-[var(--primary-hover)] transition-colors"
            >
              Close
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-[var(--bg-secondary)] text-[var(--text-heading)] font-semibold text-[14px] hover:bg-[var(--border-color)] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const st = STATUS[task.status] || STATUS.pending;
  return (
    <>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--bg-secondary)] transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center shrink-0">
            <task.icon size={18} className={task.iconColor} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-[var(--text-heading)] truncate">{task.title}</h3>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">
              {task.category} · {task.agent} · {task.time}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0 ${st.bg} ml-2`}>
          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
          <span className={`text-[10px] font-bold ${st.text}`}>{st.label}</span>
        </div>
      </button>
      <hr className="border-t border-[var(--border-color)] mx-3 last:hidden" />
    </>
  );
}

export default function TasksPage() {
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeChip, setActiveChip] = useState("All");
  const [selectedFilter, setSelectedFilter] = useState("All tasks");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createActionOpen, setCreateActionOpen] = useState(false);

  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/tasks", { headers });
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        const mapped: Task[] = json.data.map((t: any) => {
          const { icon, color } = mapModuleToIcon(t.moduleType);
          return {
            id: t.id,
            title: t.title,
            category: mapModuleToCategory(t.moduleType),
            agent: t.agentId ? "Assigned Agent" : "Awaiting Dispatch",
            time: new Date(t.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            status: mapApiStatus(t.status),
            description: t.description || "",
            icon,
            iconColor: color,
            priceNgn: t.priceNgn,
            propertyId: t.propertyId,
          };
        });
        setTasksList(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Apply chip + status filter
  const filtered = tasksList.filter((t) => {
    const chipMatch = activeChip === "All" || t.category === activeChip;
    const statusMatch =
      selectedFilter === "All tasks" ||
      (selectedFilter === "Pending" && t.status === "pending") ||
      (selectedFilter === "In progress" && t.status === "in_progress") ||
      (selectedFilter === "Report ready" && t.status === "ready") ||
      (selectedFilter === "Completed" && t.status === "completed");
    const searchMatch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return chipMatch && statusMatch && searchMatch;
  });

  return (
    <div className="space-y-5 relative pb-8 min-h-[calc(100vh-80px)]">
      {/* Top Bar */}
      {searchActive ? (
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => { setSearchActive(false); setSearchQuery(""); }}
            className="w-10 h-10 flex items-center justify-center text-[var(--text-heading)] shrink-0"
          >
            <i className="ai-arrow-left text-[20px]" />
          </button>
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full h-10 pl-4 pr-10 rounded-full bg-[var(--bg-card)] border-transparent outline-none text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] shadow-[0_0_10px_rgba(0,0,0,0.03)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 text-[var(--text-muted)]">
                <i className="ai-cross text-[14px]" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="w-10 h-10 rounded-full bg-[var(--bg-card)] shadow-[0_0_10px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0"
          >
            <i className="ai-filter text-[18px] text-[var(--text-heading)]" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-[20px] font-bold text-[var(--text-heading)]">Tasks & Services</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchActive(true)}
              className="w-10 h-10 rounded-full bg-[var(--bg-card)] shadow-[0_0_10px_rgba(0,0,0,0.03)] flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <i className="ai-search text-[20px] text-[var(--text-heading)]" />
            </button>
            <button
              onClick={() => setFilterOpen(true)}
              className="w-10 h-10 rounded-full bg-[var(--bg-card)] shadow-[0_0_10px_rgba(0,0,0,0.03)] flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <i className="ai-filter text-[20px] text-[var(--text-heading)]" />
            </button>
          </div>
        </div>
      )}

      {/* Category Chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => setActiveChip(chip)}
            className={`px-5 py-2 rounded-[24px] text-[13px] font-semibold whitespace-nowrap transition-colors ${
              activeChip === chip
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-card)] text-[var(--text-heading)] shadow-[0_0_10px_rgba(0,0,0,0.03)] hover:bg-[var(--bg-secondary)]"
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="bg-[var(--bg-card)] rounded-[24px] p-2 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
        {loading ? (
          <p className="text-center text-[13px] text-[var(--text-muted)] py-10">
            Loading tasks and field missions...
          </p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <p className="text-[13px] text-[var(--text-muted)]">No tasks found</p>
            <button
              type="button"
              onClick={() => setCreateActionOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              Request a New Task / Service
            </button>
          </div>
        ) : (
          filtered.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onClick={() => setSelectedTask(task)}
            />
          ))
        )}
      </div>

      {/* Floating Action Button (FAB) -> Quick Actions Menu */}
      <button
        type="button"
        onClick={() => setCreateActionOpen(true)}
        className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-[var(--primary)] text-white rounded-full flex items-center justify-center shadow-lg shadow-[var(--primary)]/40 hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer"
        title="Quick Actions"
      >
        <i className="ai-plus text-[24px]" />
      </button>

      {/* Quick Actions Bottom Sheet */}
      {createActionOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setCreateActionOpen(false)}
          />
          <div
            className="relative w-full sm:max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[28px] sm:rounded-3xl p-5 pb-8 sm:p-6 shadow-2xl z-10 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[17px] font-bold text-[var(--text-heading)]">Quick Actions</h2>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Select a service to get started immediately</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateActionOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[12px] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              <Link
                href="/errands"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <BoltIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Quick Errands
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Material cost, document delivery, utility bills, parcel pickup
                  </p>
                </div>
              </Link>

              <Link
                href="/legal"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <ChandelierIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Legal Advisory
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Verified NBA counsel for title review, contracts, and disputes
                  </p>
                </div>
              </Link>

              <Link
                href="/enforcement"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Law Enforcement Liaison
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Emergency on-site escalation & police/taskforce liaison
                  </p>
                </div>
              </Link>

              <Link
                href="/property-oversite"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <MapPointSearchIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Property Oversite
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Perimeter drone inspection, boundary verification & geo-photos
                  </p>
                </div>
              </Link>

              <Link
                href="/diligence"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
                  <PieChartIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Due Diligence
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    CAC registry, vendor verification, litigation search
                  </p>
                </div>
              </Link>

              <Link
                href="/vault"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <DocumentsMinimalisticIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Document Vault
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Certified copies, surveys, C of O, and deed documentation
                  </p>
                </div>
              </Link>

              <Link
                href="/projects"
                onClick={() => setCreateActionOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <DocumentIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Project Monitoring
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Site construction progress, milestone tracking & billing
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bottom Sheet */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setFilterOpen(false)}
          />
          <div className="relative bg-[var(--bg-card)] w-full md:w-[400px] rounded-t-[24px] md:rounded-[24px] px-6 pt-3 pb-8 shadow-2xl">
            <div className="w-10 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-6 md:hidden" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-[var(--text-heading)]">Filter by status</h2>
              <button
                onClick={() => setFilterOpen(false)}
                className="hidden md:flex w-8 h-8 items-center justify-center bg-[var(--bg-secondary)] rounded-full text-[var(--text-heading)]"
              >
                <i className="ai-cross text-[14px]" />
              </button>
            </div>
            <div className="space-y-1">
              {["All tasks", "Pending", "In progress", "Report ready", "Completed"].map((opt) => {
                const isSelected = selectedFilter === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => { setSelectedFilter(opt); setTimeout(() => setFilterOpen(false), 200); }}
                    className="w-full flex items-center justify-between py-3 hover:bg-[var(--bg-secondary)] rounded-xl px-2 -mx-2 transition-colors"
                  >
                    <span className="text-[14px] font-medium text-[var(--text-heading)]">{opt}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--border-color)]"}`}>
                      {isSelected && <i className="ai-check text-white text-[12px]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Sheet */}
      {selectedTask && (
        <TaskDetailSheet task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
