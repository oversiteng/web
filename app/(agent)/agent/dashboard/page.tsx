"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatTimeAgo, getModuleName } from "@/lib/utils";
import { AgentTopNav } from "@/components/agent/AgentTopNav";
import {
  Bell,
  Clock,
  MapPin,
  Calendar,
  Inbox,
  AlertCircle,
  ArrowRight,
  Wallet,
  CheckCircle2,
  Check,
  Shield,
  Loader2,
  X,
  MessageSquare,
  FileText,
  ChevronRight,
} from "lucide-react";
import {
  PieChartIcon,
  MapPointSearchIcon,
  DocumentsMinimalisticIcon,
  DocumentIcon,
  BoltIcon,
  ChandelierIcon,
  ShieldCheckIcon,
  ObjectScanIcon,
} from "@solar-icons/react/outline";

interface TaskItem {
  id: string;
  title: string;
  moduleType: string;
  status: string;
  locationAddress: string | null;
  priceNgn: number | string | null;
  createdAt: string;
  agentId?: string | null;
}

const TASK_MODULE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  DUE_DILIGENCE: { label: "Due Diligence", icon: PieChartIcon },
  PROPERTY_OVERSITE: { label: "Property Oversite", icon: MapPointSearchIcon },
  DOCUMENT_PROCESSING: { label: "Document Processing", icon: DocumentsMinimalisticIcon },
  PROJECT_WATCH: { label: "Project Watch", icon: DocumentIcon },
  QUICK_ERRANDS: { label: "Quick Errands", icon: BoltIcon },
  LEGAL_ADVISORY: { label: "Legal Advisory", icon: ChandelierIcon },
  LAW_ENFORCEMENT: { label: "Law Enforcement", icon: ShieldCheckIcon },
  VULNERABILITY_TEST: { label: "Vulnerability Test", icon: ObjectScanIcon },
};

interface UrgencyTheme {
  name: string;
  border: string;
  borderSelected: string;
  text: string;
  iconColor: string;
  bg: string;
  bgSelected: string;
  badgeBg: string;
  badgeBorder: string;
  ring: string;
}

const URGENCY_SPECTRUM: UrgencyTheme[] = [
  // 0: Today -> RED
  {
    name: "Red (Urgent)",
    border: "border-red-500",
    borderSelected: "border-red-500",
    text: "text-red-500",
    iconColor: "text-red-500",
    bg: "bg-[var(--bg-card)]",
    bgSelected: "bg-[var(--bg-card)]",
    badgeBg: "bg-red-500/10",
    badgeBorder: "border-red-500/30",
    ring: "ring-2 ring-[var(--text-heading)] shadow-md",
  },
  // 1: Tomorrow -> ORANGE
  {
    name: "Orange (Imminent)",
    border: "border-orange-500",
    borderSelected: "border-orange-500",
    text: "text-orange-500",
    iconColor: "text-orange-500",
    bg: "bg-[var(--bg-card)]",
    bgSelected: "bg-[var(--bg-card)]",
    badgeBg: "bg-orange-500/10",
    badgeBorder: "border-orange-500/30",
    ring: "ring-2 ring-[var(--text-heading)] shadow-md",
  },
  // 2: Day +2 -> YELLOW / AMBER
  {
    name: "Yellow (Upcoming)",
    border: "border-amber-500",
    borderSelected: "border-amber-500",
    text: "text-amber-500",
    iconColor: "text-amber-500",
    bg: "bg-[var(--bg-card)]",
    bgSelected: "bg-[var(--bg-card)]",
    badgeBg: "bg-amber-500/10",
    badgeBorder: "border-amber-500/30",
    ring: "ring-2 ring-[var(--text-heading)] shadow-md",
  },
  // 3: Day +3 -> LIME
  {
    name: "Lime (Scheduled)",
    border: "border-lime-500",
    borderSelected: "border-lime-500",
    text: "text-lime-600 dark:text-lime-400",
    iconColor: "text-lime-600 dark:text-lime-400",
    bg: "bg-[var(--bg-card)]",
    bgSelected: "bg-[var(--bg-card)]",
    badgeBg: "bg-lime-500/10",
    badgeBorder: "border-lime-500/30",
    ring: "ring-2 ring-[var(--text-heading)] shadow-md",
  },
  // 4: Day +4 -> TEAL
  {
    name: "Teal (Moderate)",
    border: "border-teal-500",
    borderSelected: "border-teal-500",
    text: "text-teal-600 dark:text-teal-400",
    iconColor: "text-teal-600 dark:text-teal-400",
    bg: "bg-[var(--bg-card)]",
    bgSelected: "bg-[var(--bg-card)]",
    badgeBg: "bg-teal-500/10",
    badgeBorder: "border-teal-500/30",
    ring: "ring-2 ring-[var(--text-heading)] shadow-md",
  },
  // 5: Day +5 -> GREEN
  {
    name: "Green (Standard)",
    border: "border-[var(--primary)]",
    borderSelected: "border-[var(--primary)]",
    text: "text-[var(--primary)]",
    iconColor: "text-[var(--primary)]",
    bg: "bg-[var(--bg-card)]",
    bgSelected: "bg-[var(--bg-card)]",
    badgeBg: "bg-[var(--primary-light)]",
    badgeBorder: "border-[var(--primary-border)]",
    ring: "ring-2 ring-[var(--text-heading)] shadow-md",
  },
];

export default function AgentDashboardPage() {
  const { user } = useAuth();
  const [showTaxBanner, setShowTaxBanner] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Today");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [walletData, setWalletData] = useState<{ balanceNgn: number; pendingClearanceNgn: number }>({
    balanceNgn: 0,
    pendingClearanceNgn: 0,
  });
  const [assignedTasks, setAssignedTasks] = useState<TaskItem[]>([]);
  const [queueTasks, setQueueTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Responsive Drawer (Mobile) & Modal (Desktop) States
  const [selectedOfferForDetail, setSelectedOfferForDetail] = useState<TaskItem | null>(null);
  const [isOffersListDrawerOpen, setIsOffersListDrawerOpen] = useState(false);
  const [isDayScheduleDrawerOpen, setIsDayScheduleDrawerOpen] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkText, setRemarkText] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const [walletRes, tasksRes] = await Promise.all([
          fetch("/api/v1/agent/wallet", { credentials: "include", headers }).catch(() => null),
          fetch("/api/v1/tasks", { credentials: "include", headers }).catch(() => null),
        ]);

        if (walletRes && walletRes.ok) {
          const wJson = await walletRes.json();
          if (wJson.success && wJson.data) {
            setWalletData({
              balanceNgn: Number(wJson.data.balanceNgn || 0),
              pendingClearanceNgn: Number(wJson.data.pendingClearanceNgn || 0),
            });
          }
        }

        if (tasksRes && tasksRes.ok) {
          const tJson = await tasksRes.json();
          if (tJson.success && Array.isArray(tJson.data)) {
            const all = tJson.data as TaskItem[];
            const myActive = all.filter(
              (t) => t.agentId === user?.id && !["COMPLETED", "CANCELLED"].includes(t.status)
            );
            const openInQueue = all.filter(
              (t) => ["PENDING", "MATCHED"].includes(t.status) && (!t.agentId || t.agentId === user?.id)
            );
            setAssignedTasks(myActive);
            setQueueTasks(openInQueue);
          }
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [user]);

  // Compute dynamic day schedule with task representations and urgency colors
  const daysSchedule = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const list = [];
    const now = new Date();

    const sampleModules: Array<{
      type: string;
      title: string;
    }> = [
      {
        type: assignedTasks[0]?.moduleType || "DUE_DILIGENCE",
        title: assignedTasks[0]?.title || "Due Diligence Dossier Inspection",
      },
      {
        type: assignedTasks[1]?.moduleType || "PROPERTY_OVERSITE",
        title: assignedTasks[1]?.title || "Perimeter Site Verification",
      },
      {
        type: "DOCUMENT_PROCESSING",
        title: "CAC Certified Filing Retrieval",
      },
      {
        type: "QUICK_ERRANDS",
        title: "Expedited Title Registry Retrieval",
      },
      {
        type: "LEGAL_ADVISORY",
        title: "Zoning & Legal Compliance Verification",
      },
      {
        type: "PROJECT_WATCH",
        title: "Milestone Construction Audit",
      },
    ];

    for (let i = 0; i < 6; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const sample = sampleModules[i] || sampleModules[5];

      list.push({
        day: i === 0 ? "Today" : i === 1 ? "Tmrw" : dayNames[d.getDay()],
        date: String(d.getDate()),
        taskType: sample.type,
        taskTitle: sample.title,
        urgencyIndex: i, // 0: Red (Today), 1: Orange (Tmrw), 2: Yellow, 3: Lime, 4: Teal, 5: Green
        tasksForDay:
          i === 0
            ? assignedTasks.length > 0
              ? assignedTasks
              : [
                  {
                    id: "urgent-today-due-diligence",
                    title: sample.title,
                    moduleType: sample.type,
                    status: "IN_PROGRESS",
                    locationAddress: "Victoria Island Registry, Lagos",
                    priceNgn: 25000,
                    createdAt: new Date().toISOString(),
                  },
                ]
            : [
                {
                  id: `scheduled-${i}`,
                  title: sample.title,
                  moduleType: sample.type,
                  status: "PENDING",
                  locationAddress: "Lekki Phase 1, Lagos",
                  priceNgn: 12500,
                  createdAt: new Date().toISOString(),
                },
              ],
      });
    }
    return list;
  }, [assignedTasks]);

  const activeScheduleItem =
    daysSchedule.find((d) => d.day === selectedDay) || daysSchedule[0];

  const handleAcceptMission = async (taskId: string, title: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${taskId}/accept`, {
        method: "POST",
        credentials: "include",
        headers,
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast(`Mission accepted: "${title}". Advancing to en route.`);
        setQueueTasks((prev) => prev.filter((t) => t.id !== taskId));
        const accepted = queueTasks.find((t) => t.id === taskId);
        if (accepted) {
          setAssignedTasks((prev) => [{ ...accepted, status: "AGENT_EN_ROUTE" }, ...prev]);
        }
      } else {
        showToast(json?.error?.message || "Could not accept mission.");
      }
    } catch {
      showToast("Network error. Please try again.");
    }
  };

  const activeTask = assignedTasks[0];

  return (
    <div className="space-y-5 max-w-full pb-10">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-[var(--bg-card)] text-[var(--text-heading)] border border-[var(--border-color)] font-semibold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Unified Agent Top Navigation Bar ── */}
      <AgentTopNav showProfile={true} />

      {/* ── 2. Compliance / Accreditation Notice ── */}
      {showTaxBanner && (
        <div className="bg-[var(--bg-card)] border border-[var(--primary-border)] rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div className="text-xs text-[var(--text-body)] leading-snug">
              <span>Ensure your biometric NIN and physical address verifications are current to unlock priority dispatch. </span>
              <button
                type="button"
                onClick={() => setShowComplianceModal(true)}
                className="text-[var(--primary)] underline font-semibold hover:text-[var(--primary-hover)] inline cursor-pointer"
              >
                View Status
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTaxBanner(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text-heading)] p-1 cursor-pointer shrink-0 transition-colors"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── 3. SLA Deadlines / Patrol Schedule Carousel ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[var(--text-heading)] font-bold text-base">Schedule</h3>
            {assignedTasks.length > 0 && (
              <button
                type="button"
                onClick={() => setIsDayScheduleDrawerOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--danger-light)] border border-[var(--danger)]/20 text-[var(--danger)] text-[11px] font-semibold cursor-pointer hover:opacity-85 transition-opacity"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" />
                {assignedTasks.length} active
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsDayScheduleDrawerOpen(true)}
            className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Day Carousel: Red (Today) -> Orange (Tmrw) -> Yellow -> Lime -> Teal -> Green */}
        <div className="flex sm:grid sm:grid-cols-6 gap-2 sm:gap-2.5 overflow-x-auto sm:overflow-visible no-scrollbar snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 py-1">
          {daysSchedule.map((item, idx) => {
            const isSelected = selectedDay === item.day;
            const theme = URGENCY_SPECTRUM[idx] || URGENCY_SPECTRUM[5];
            const TaskIcon = TASK_MODULE_CONFIG[item.taskType]?.icon || PieChartIcon;

            return (
              <button
                key={item.day}
                type="button"
                onClick={() => {
                  setSelectedDay(item.day);
                  setIsDayScheduleDrawerOpen(true);
                }}
                className={`w-[78px] sm:w-auto shrink-0 sm:shrink snap-start py-3 px-2 sm:py-4 sm:px-2.5 rounded-2xl flex flex-col items-center justify-between min-h-[114px] sm:min-h-[124px] transition-all cursor-pointer relative bg-[var(--bg-card)] shadow-xs ${
                  isSelected
                    ? `border-2 shadow-md ${theme.border} ring-2 ring-[var(--text-heading)]/15`
                    : "border border-[var(--border-color)]/70 hover:border-[var(--primary-border)]"
                }`}
              >
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {item.day}
                </span>

                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border-2 ${theme.badgeBorder} ${theme.badgeBg} flex items-center justify-center transition-transform shadow-xs`}
                  title={`${item.taskTitle} (${theme.name})`}
                >
                  <TaskIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${theme.iconColor}`} />
                </div>

                {/* Big Date Number at bottom */}
                <span className="text-base sm:text-lg font-semibold leading-none text-[var(--text-heading)]">
                  {item.date}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Reminder Bar based on selected day */}
        {(() => {
          const selectedIdx = daysSchedule.findIndex((d) => d.day === selectedDay);
          const activeTheme = URGENCY_SPECTRUM[selectedIdx >= 0 ? selectedIdx : 0];

          return (
            <div
              onClick={() => setIsDayScheduleDrawerOpen(true)}
              className={`border-2 ${activeTheme.border} bg-[var(--bg-card)] rounded-2xl px-3.5 py-3 flex items-center justify-between text-xs transition-all cursor-pointer group shadow-xs`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertCircle className={`w-4 h-4 shrink-0 ${activeTheme.iconColor}`} />
                <span className="font-bold truncate text-[var(--text-heading)]">
                  {activeScheduleItem.taskTitle
                    ? `${activeScheduleItem.day}: ${activeScheduleItem.taskTitle} · Tap to inspect`
                    : `No SLA deadlines for ${activeScheduleItem.day} · Tap to see details`}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          );
        })()}
      </div>

      {/* ── 4. Available to Withdraw (Wallet Card) ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-[24px] p-5 space-y-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[var(--text-muted)] text-xs font-semibold">Operative Available Balance</span>
          </div>
          <Link
            href="/agent/wallet"
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs px-4 py-2 rounded-full inline-flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
          >
            <span>Withdraw</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="text-3xl font-extrabold text-[var(--text-heading)] tracking-tight">
          {formatCurrency(walletData.balanceNgn)}
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-body)] text-xs font-medium px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <span>{formatCurrency(walletData.pendingClearanceNgn)} Pending Clearance</span>
          </div>
        </div>
      </div>

      {/* ── 5. Quick Stats Grid (Due Today & Available Queue) ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Assigned Tasks Card (opens Day schedule drawer/modal) */}
        <button
          type="button"
          onClick={() => setIsDayScheduleDrawerOpen(true)}
          className="bg-[var(--bg-card)] border border-[var(--warning)]/40 hover:border-[var(--warning)] rounded-[24px] p-4 flex flex-col justify-between space-y-2 transition-colors shadow-[0_0_10px_rgba(0,0,0,0.03)] cursor-pointer text-left"
        >
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-medium">
            <Calendar className="w-4 h-4 text-[var(--warning)]" />
            <span>Assigned Tasks</span>
          </div>
          <div className="text-xl font-bold text-[var(--text-heading)]">
            {assignedTasks.length} {assignedTasks.length === 1 ? "Mission" : "Missions"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--warning)] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
            <span>{assignedTasks.length > 0 ? "Patrol active" : "Queue clear"}</span>
          </div>
        </button>

        {/* Available Queue Card (opens Offers List drawer/modal) */}
        <button
          type="button"
          onClick={() => setIsOffersListDrawerOpen(true)}
          className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 hover:border-[var(--primary)]/50 rounded-[24px] p-4 flex flex-col justify-between space-y-2 transition-colors shadow-[0_0_10px_rgba(0,0,0,0.03)] cursor-pointer text-left"
        >
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-medium">
            <Inbox className="w-4 h-4 text-[var(--primary)]" />
            <span>Live Queue</span>
          </div>
          <div className="text-xl font-bold text-[var(--text-heading)]">
            {queueTasks.length} {queueTasks.length === 1 ? "Offer" : "Offers"}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--primary)] font-medium">
            <MapPin className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
            <span>Matching your corridor</span>
          </div>
        </button>
      </div>

      {/* ── 6. Active Mission in Progress ── */}
      {activeTask && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-[var(--text-heading)] font-bold text-base">Active Field Mission</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary-light)] border border-[var(--primary-border)] text-[var(--primary)] text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                {activeTask.status}
              </span>
            </div>
            <Link
              href={`/agent/tasks/${activeTask.id}`}
              className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
            >
              Open mission
            </Link>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--primary-border)] rounded-[24px] p-4 space-y-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <span className="bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)] text-xs px-2.5 py-0.5 rounded-full font-medium">
                {getModuleName(activeTask.moduleType)}
              </span>
              <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                <span>{formatTimeAgo(activeTask.createdAt)}</span>
              </span>
            </div>
            <h4 className="text-[var(--text-heading)] font-bold text-base leading-snug">{activeTask.title}</h4>
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              <span className="truncate">{activeTask.locationAddress || "Site location coordinates verified"}</span>
            </p>
            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between gap-2">
              <span className="text-base font-bold text-[var(--primary)]">
                {activeTask.priceNgn ? formatCurrency(activeTask.priceNgn) : "Quote assigned"}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRemarkModal(true)}
                  className="border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-[var(--text-body)] text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Remark</span>
                </button>
                <Link
                  href={`/agent/tasks/${activeTask.id}`}
                  className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
                >
                  Submit Audit Report
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. New Incoming Offers (Queue Radar) ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[var(--text-heading)] font-bold text-base">New offers</h3>
          <button
            type="button"
            onClick={() => setIsOffersListDrawerOpen(true)}
            className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors cursor-pointer"
          >
            See all ({queueTasks.length})
          </button>
        </div>

        {queueTasks.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-[24px] p-6 text-center text-xs text-[var(--text-muted)] shadow-[0_0_10px_rgba(0,0,0,0.03)] space-y-1">
            <CheckCircle2 className="w-6 h-6 text-[var(--primary)] mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-[var(--text-heading)]">No pending offers in your corridor</p>
            <p>Keep your status Online. New missions appear in real time.</p>
          </div>
        ) : (
          queueTasks.slice(0, 3).map((offer) => (
            <div
              key={offer.id}
              onClick={() => setSelectedOfferForDetail(offer)}
              className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 hover:border-[var(--primary-border)] rounded-[24px] p-4 space-y-3 transition-colors shadow-[0_0_10px_rgba(0,0,0,0.03)] cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {getModuleName(offer.moduleType)}
                </span>
                <span className="bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)] text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
                  Dispatch Offer
                </span>
              </div>
              <h4 className="text-[var(--text-heading)] font-bold text-base leading-snug group-hover:text-[var(--primary)] transition-colors">
                {offer.title}
              </h4>
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                <span className="truncate">{offer.locationAddress || "Coverage LGA Verified"}</span>
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                <span className="text-base font-bold text-[var(--primary)]">
                  {offer.priceNgn ? formatCurrency(offer.priceNgn) : "₦10,000"}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptMission(offer.id, offer.title);
                    }}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Accept Mission
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* =========================================================================
          RESPONSIVE DRAWERS & MODALS:
          On Mobile (<640px): Drawer sliding up from the bottom (items-end, rounded-t, drag bar)
          On Desktop (>=640px): Centered modal dialog (sm:items-center, sm:rounded-3xl, sm:max-w-lg)
          ========================================================================= */}

      {/* ── 1. Day's Scheduled Missions Drawer / Modal ── */}
      {isDayScheduleDrawerOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsDayScheduleDrawerOpen(false)}
        >
          <div
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 pb-8 sm:pb-6 max-w-lg w-full space-y-4 max-h-[88vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Bar */}
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />

            {(() => {
              const selectedIdx = daysSchedule.findIndex((d) => d.day === activeScheduleItem.day);
              const activeTheme = URGENCY_SPECTRUM[selectedIdx >= 0 ? selectedIdx : 0];

              return (
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                  <div>
                    <h3 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${activeTheme.text}`}>
                      <Calendar className={`w-5 h-5 ${activeTheme.iconColor}`} />
                      <span>Task · {activeScheduleItem.day} ({activeScheduleItem.date})</span>
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {activeTheme.name} SLA priority level
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDayScheduleDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })()}

            {/* List of Tasks for this day */}
            <div className="space-y-3 pt-1">
              {activeScheduleItem.tasksForDay.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] space-y-2 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                  <CheckCircle2 className="w-7 h-7 text-[var(--primary)] mx-auto opacity-80" />
                  <p className="font-semibold text-sm text-[var(--text-heading)]">No deadlines on this date</p>
                  <p>You have no pending SLA commitments scheduled for {activeScheduleItem.day}.</p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsDayScheduleDrawerOpen(false);
                        setIsOffersListDrawerOpen(true);
                      }}
                      className="bg-[var(--primary)] text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
                    >
                      Browse Available Missions
                    </button>
                  </div>
                </div>
              ) : (
                activeScheduleItem.tasksForDay.map((task: any) => {
                  const TaskIcon = TASK_MODULE_CONFIG[task.moduleType]?.icon || FileText;
                  const selectedIdx = daysSchedule.findIndex((d) => d.day === activeScheduleItem.day);
                  const activeTheme = URGENCY_SPECTRUM[selectedIdx >= 0 ? selectedIdx : 0];

                  return (
                    <div
                      key={task.id}
                      className={`p-4 rounded-2xl bg-[var(--bg-secondary)] border-2 ${activeTheme.border} space-y-2.5 shadow-xs transition-colors`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${activeTheme.badgeBorder} ${activeTheme.badgeBg} ${activeTheme.text} text-[11px] font-bold`}>
                          <TaskIcon className={`w-3.5 h-3.5 ${activeTheme.iconColor}`} />
                          <span>{getModuleName(task.moduleType)}</span>
                        </span>
                        <span className={`text-xs font-bold ${activeTheme.iconColor}`}>
                          {task.priceNgn ? formatCurrency(task.priceNgn) : "₦10,000"}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--text-heading)] leading-snug">
                        {task.title}
                      </h4>
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{task.locationAddress || "Verified Location Coordinates"}</span>
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]/70">
                        <span className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[var(--warning)]" />
                          <span>Due within 24 hours</span>
                        </span>
                        <Link
                          href={`/agent/tasks/${task.id}`}
                          onClick={() => setIsDayScheduleDrawerOpen(false)}
                          className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold px-4 py-1.5 rounded-xl transition-all shadow-xs inline-flex items-center gap-1"
                        >
                          <span>Open Task</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Single Offer Detail Inspection Drawer / Modal ── */}
      {selectedOfferForDetail && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedOfferForDetail(null)}
        >
          <div
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 pb-8 sm:pb-6 max-w-lg w-full space-y-4 max-h-[88vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Bar */}
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />

            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <span className="bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)] text-xs px-3 py-1 rounded-full font-semibold">
                {getModuleName(selectedOfferForDetail.moduleType)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedOfferForDetail(null)}
                className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--text-heading)] leading-snug">
                {selectedOfferForDetail.title}
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Dispatched {formatTimeAgo(selectedOfferForDetail.createdAt)} · Field Operative Invitation
              </p>
            </div>

            {/* Payout Banner */}
            <div className="bg-[var(--primary-light)]/40 border border-[var(--primary-border)] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--text-muted)] block font-medium">Operative Compensation</span>
                <span className="text-2xl font-black text-[var(--primary)]">
                  {selectedOfferForDetail.priceNgn ? formatCurrency(selectedOfferForDetail.priceNgn) : "₦10,000"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-4 h-4" />
                  Escrow Guaranteed
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">Instant wallet release upon QA</span>
              </div>
            </div>

            {/* Verification Specs */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Site Address:</span>
                <span className="font-semibold text-[var(--text-heading)] truncate max-w-[220px]">
                  {selectedOfferForDetail.locationAddress || "Coverage LGA Verified"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Required Evidence:</span>
                <span className="font-semibold text-[var(--text-heading)]">GPS Photos + Perimeter Report</span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-between">
                <span className="text-[var(--text-muted)]">SLA Turnaround:</span>
                <span className="font-semibold text-[var(--text-heading)]">Within 24 Hours</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setSelectedOfferForDetail(null)}
                className="flex-1 py-3 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = selectedOfferForDetail.id;
                  const title = selectedOfferForDetail.title;
                  setSelectedOfferForDetail(null);
                  handleAcceptMission(id, title);
                }}
                className="flex-1 py-3 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Accept Mission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. All Radar Offers List Drawer / Modal ── */}
      {isOffersListDrawerOpen && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsOffersListDrawerOpen(false)}
        >
          <div
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 pb-8 sm:pb-6 max-w-lg w-full space-y-4 max-h-[88vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Bar */}
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />

            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-heading)] flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-[var(--primary)]" />
                  <span>Available Radar Offers ({queueTasks.length})</span>
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Missions in your active coverage zone ready for claim
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOffersListDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Offers */}
            <div className="space-y-3 pt-1">
              {queueTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] space-y-2 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)]">
                  <CheckCircle2 className="w-7 h-7 text-[var(--primary)] mx-auto opacity-80" />
                  <p className="font-semibold text-sm text-[var(--text-heading)]">No pending offers</p>
                  <p>Keep your status Online. New dispatch offers will appear in real time.</p>
                </div>
              ) : (
                queueTasks.map((offer) => (
                  <div
                    key={offer.id}
                    onClick={() => {
                      setIsOffersListDrawerOpen(false);
                      setSelectedOfferForDetail(offer);
                    }}
                    className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2.5 hover:border-[var(--primary-border)] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--primary)]">
                        {getModuleName(offer.moduleType)}
                      </span>
                      <span className="text-sm font-extrabold text-[var(--primary)]">
                        {offer.priceNgn ? formatCurrency(offer.priceNgn) : "₦10,000"}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-[var(--text-heading)] leading-snug group-hover:text-[var(--primary)] transition-colors">
                      {offer.title}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{offer.locationAddress || "Coverage LGA Verified"}</span>
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]/70">
                      <span className="text-[11px] text-[var(--text-muted)]">Tap to inspect specifications</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptMission(offer.id, offer.title);
                        }}
                        className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2">
              <Link
                href="/agent/queue"
                onClick={() => setIsOffersListDrawerOpen(false)}
                className="w-full py-3 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-heading)] flex items-center justify-center gap-2 hover:border-[var(--primary-border)] transition-colors"
              >
                <span>Open Dedicated Queue Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Compliance / Accreditation Drawer / Modal ── */}
      {showComplianceModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowComplianceModal(false)}
        >
          <div
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 pb-8 sm:pb-6 max-w-md w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Bar */}
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />

            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-heading)]">Field Accreditation</h3>
                  <p className="text-xs text-[var(--text-muted)]">Verification checklist & compliance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowComplianceModal(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-between">
                <span>NIN Identity Slip</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-between">
                <span>Proof of Address</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-between">
                <span>Guarantor Form</span>
                <span className="font-semibold text-[var(--warning)] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> In Review
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Link
                href="/agent/verification"
                onClick={() => setShowComplianceModal(false)}
                className="w-full py-3 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold text-center transition-colors shadow-xs"
              >
                Open Verification Center
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Inspection Remark: Drawer on Mobile, Modal on Desktop ── */}
      {showRemarkModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowRemarkModal(false)}
        >
          <div
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 pb-8 sm:pb-6 max-w-sm w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Bar */}
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
                Add Inspection Remark
              </h3>
              <button
                type="button"
                onClick={() => setShowRemarkModal(false)}
                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="e.g. Completed boundary fence check, waiting for gate access..."
              rows={3}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRemarkModal(false)}
                className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast("Remark recorded with GPS timestamp");
                  setShowRemarkModal(false);
                  setRemarkText("");
                }}
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors"
              >
                Save Remark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
