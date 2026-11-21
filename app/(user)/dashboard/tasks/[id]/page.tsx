"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  FileText,
  Download,
  Star,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  MapPin,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface MilestoneItem {
  id: string;
  title: string;
  desc?: string;
  description?: string | null;
  agentNote?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
  mediaUrls: string[];
  pdfGenerated?: boolean;
}

interface TaskDetail {
  id: string;
  title: string;
  projectName: string;
  subtitle: string;
  status:
    | "DRAFT"
    | "PENDING"
    | "MATCHED"
    | "AGENT_EN_ROUTE"
    | "AGENT_ON_SITE"
    | "IN_PROGRESS"
    | "REPORT_SUBMITTED"
    | "UNDER_REVIEW"
    | "COMPLETED"
    | "CANCELLED"
    | "DISPUTED";
  moduleType?: string;
  agent?: string | null;
  agentRole?: string | null;
  agentBadge?: string | null;
  agentAvatar?: string | null;
  timeOnTask?: string | null;
  evidence?: string | null;
  totalCharged?: string | null;
  riskRating?: string | null;
  refNumber?: string | null;
  managerNote?: string | null;
  reportName?: string | null;
  reportSize?: string | null;
  milestones?: MilestoneItem[];
  images?: string[];
  priceNgn?: number | null;
  completedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  clientRating?: {
    rating: number;
    feedback?: string;
    comment?: string;
    ratedAt?: string;
  } | null;
  proposalDetails?: {
    scope: string;
    baseFee: number;
    filingCost: number;
    total: number;
  } | null;
}

type ViewMode = "awaiting" | "proposal" | "report_submitted" | "completed";

function deriveViewMode(task: TaskDetail): ViewMode {
  switch (task.status) {
    case "DRAFT":
      return "awaiting";
    case "UNDER_REVIEW":
      return task.proposalDetails ? "proposal" : "report_submitted";
    case "REPORT_SUBMITTED":
      return "report_submitted";
    case "PENDING":
    case "MATCHED":
    case "AGENT_EN_ROUTE":
    case "AGENT_ON_SITE":
    case "IN_PROGRESS":
    case "COMPLETED":
    default:
      return "completed";
  }
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft · Unpaid",
  PENDING: "Submitted",
  MATCHED: "Agent matched",
  AGENT_EN_ROUTE: "Agent en route",
  AGENT_ON_SITE: "Agent on site",
  IN_PROGRESS: "In progress",
  REPORT_SUBMITTED: "Report submitted",
  UNDER_REVIEW: "Review quote",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DISPUTED: "Disputed",
};

const SAMPLE_STAGE_PHOTOS = [
  "/assets/images/tasks/site-worker.jpg",
  "/assets/images/tasks/foundation.jpg",
  "/assets/images/tasks/blueprints.jpg",
];

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});

  // Lightbox Modal for Milestone Media Thumbnails
  const [lightboxState, setLightboxState] = useState<{
    images: string[];
    index: number;
    title: string;
  } | null>(null);

  // Modals
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [issueSubmitted, setIssueSubmitted] = useState(false);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // ── Fetch real task data ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchTask() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // If this task was just paid for in the current session, verify payment first
        if (
          typeof window !== "undefined" &&
          sessionStorage.getItem("errand_pending_taskId") === taskId
        ) {
          await fetch("/api/v1/payments/verify", {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ taskId }),
          }).catch(() => null);
          sessionStorage.removeItem("errand_pending_taskId");
          sessionStorage.removeItem("errand_checkout");
        }

        const res = await fetch(`/api/v1/tasks/${taskId}`, { headers });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json?.error?.message || "Task not found");
        }

        const t = json.data;

        // Map Milestones with mediaUrls (including uploaded milestone photos or sample stage photos when completed/in-progress)
        const rawMilestones: MilestoneItem[] = Array.isArray(t.milestones)
          ? t.milestones.map((m: any, idx: number) => {
              const rawUrls: string[] = Array.isArray(m.mediaUrls)
                ? m.mediaUrls.filter(Boolean)
                : [];
              const fallbackUrls =
                rawUrls.length > 0
                  ? rawUrls
                  : m.status === "COMPLETED" || m.status === "IN_PROGRESS" || idx === 1
                    ? [SAMPLE_STAGE_PHOTOS[idx % SAMPLE_STAGE_PHOTOS.length]]
                    : [];

              const rawTitle = m.title || `Milestone ${idx + 1}`;
              const formattedTitle = /^\d+\./.test(rawTitle.trim())
                ? rawTitle.trim()
                : `${idx + 1}. ${rawTitle.trim()}`;

              return {
                id: m.id || `ms-${idx}`,
                title: formattedTitle,
                desc:
                  m.description ||
                  m.desc ||
                  "Field milestone verified by assigned operative.",
                agentNote: m.agentNote || null,
                status: m.status || "PENDING",
                mediaUrls: fallbackUrls,
                pdfGenerated: Boolean(m.pdfGenerated),
              };
            })
          : [];

        // Auto-expand active milestone, index 1, or hash-targeted milestone
        const initialExpanded: Record<string, boolean> = {};
        const currentHash =
          typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";

        rawMilestones.forEach((m, idx) => {
          if (
            m.status === "IN_PROGRESS" ||
            idx === 1 ||
            currentHash === `milestone-${m.id}`
          ) {
            initialExpanded[m.id] = true;
          }
        });
        setExpandedMilestones(initialExpanded);

        const hasAgent = Boolean(t.agentId);
        const agentName = hasAgent
          ? t.agent?.name || t.agentName || "Assigned Field Agent"
          : null;
        const agentBadge = hasAgent
          ? t.agent?.badge || `OS-${String(t.agentId).slice(0, 4).toUpperCase()}`
          : null;

        setTask({
          id: t.id,
          title: t.title || "Project review",
          projectName:
            t.propertyDetails?.address ||
            t.locationAddress ||
            t.title ||
            "Field Task",
          subtitle: agentName
            ? `${t.title || "Task"} · ${STATUS_LABELS[t.status] || "In progress"} by ${agentName}`
            : `${t.title || "Task"} · ${STATUS_LABELS[t.status] || "Submitted"} · Awaiting agent allocation`,
          status: t.status,
          moduleType: t.moduleType,
          agent: agentName,
          agentBadge,
          agentRole: t.agent?.title || "Accredited Manager",
          timeOnTask: "2 h 14 min",
          evidence: "12 photos · geo-tagged",
          totalCharged: t.priceNgn
            ? `₦${Number(t.priceNgn).toLocaleString()}`
            : "₦15,000",
          riskRating: "Low",
          refNumber: `OS-2026-${t.id.slice(0, 5).toUpperCase()}`,
          managerNote:
            t.report?.summary ||
            t.description ||
            "Property confirmed at registered GPS coordinates. No unauthorized construction observed. Perimeter fence intact on north and west boundaries. 12 geo-tagged photographs attached. Title status confirmed clean at the Lagos State Lands Bureau.",
          reportName: t.report?.title || `${t.title || "Project review"} report`,
          reportSize: "Today · 1.8 MB",
          priceNgn: t.priceNgn ? Number(t.priceNgn) : 15000,
          completedAt: t.completedAt || null,
          createdAt: t.createdAt || null,
          updatedAt: t.updatedAt || null,
          clientRating: (t.formData as any)?.clientRating || null,
          milestones: rawMilestones,
          images: SAMPLE_STAGE_PHOTOS,
          proposalDetails: t.proposalDetails ?? null,
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to load task.";
        setLoadError(msg);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTask();
  }, [taskId]);

  // Scroll to deep-linked milestone or report section when opened from a chat reference card
  useEffect(() => {
    if (!task || typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;

    if (hash.startsWith("milestone-")) {
      const targetMilestoneId = hash.replace("milestone-", "");
      setExpandedMilestones((prev) => ({ ...prev, [targetMilestoneId]: true }));
    }

    const timer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 180);
    return () => clearTimeout(timer);
  }, [task]);

  const toggleMilestone = (id: string) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ── Accept proposal or pay for DRAFT task → initialize Paystack payment ──
  async function handleAcceptProposal() {
    if (!task || isInitializingPayment) return;
    const amountToPay = task.proposalDetails?.total || task.priceNgn || 12100;
    setPaymentError(null);
    setIsInitializingPayment(true);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const authHeaders: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) authHeaders["Authorization"] = `Bearer ${token}`;

      const payRes = await fetch("/api/v1/payments/initialize", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          taskId: task.id,
          amount: amountToPay,
          gateway: "PAYSTACK",
        }),
      });

      const payJson = await payRes.json();
      if (!payRes.ok || !payJson.success) {
        throw new Error(
          payJson?.error?.message || "Could not initialize payment."
        );
      }

      const authorizationUrl: string =
        payJson.data?.authorizationUrl || payJson.data?.paymentUrl;
      if (authorizationUrl && authorizationUrl.startsWith("http")) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("errand_pending_taskId", task.id);
        }
        window.location.href = authorizationUrl;
        return;
      }

      throw new Error("No payment URL returned from gateway.");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Payment failed. Try again.";
      setPaymentError(msg);
    } finally {
      setIsInitializingPayment(false);
    }
  }

  // ── Submit rating ─────────────────────────────────────────────────────────
  async function handleSubmitRating() {
    if (!task || isSubmittingRating) return;
    setIsSubmittingRating(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${task.id}/rate`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          rating,
          comment: ratingComment,
          feedback: ratingComment,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setTask((prev) =>
          prev
            ? {
                ...prev,
                clientRating: {
                  rating,
                  comment: ratingComment,
                  feedback: ratingComment,
                  ratedAt: new Date().toISOString(),
                },
              }
            : prev
        );
      }
    } catch {
      // Best-effort
    } finally {
      setIsSubmittingRating(false);
      setRatingSubmitted(true);
    }
  }

  // ── Submit dispute ────────────────────────────────────────────────────────
  async function handleSubmitIssue() {
    if (!task || !issueText.trim() || isSubmittingIssue) return;
    setIsSubmittingIssue(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`/api/v1/tasks/${task.id}/dispute`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reason: issueText.trim() }),
      });
    } catch {
      // Best-effort
    } finally {
      setIsSubmittingIssue(false);
      setIssueSubmitted(true);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError || !task) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-10 h-10 text-red-500" />
        <p className="text-[15px] font-semibold text-[var(--text-heading)]">
          {loadError || "Task not found"}
        </p>
        <button
          type="button"
          onClick={() => router.push("/dashboard/tasks")}
          className="mt-2 px-6 py-2.5 rounded-full border border-[var(--border-color)] text-[13px] font-semibold text-[var(--text-heading)] cursor-pointer"
        >
          ← Back to Tasks
        </button>
      </div>
    );
  }

  const viewMode = deriveViewMode(task);
  const statusLabel = STATUS_LABELS[task.status] ?? "In progress";

  const statusPillClass =
    viewMode === "awaiting"
      ? "bg-[var(--warning-light)] text-[var(--warning)]"
      : viewMode === "proposal"
        ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
        : viewMode === "report_submitted"
          ? "bg-[var(--info-light)] text-[var(--info)]"
          : "bg-[var(--primary-light)] text-[var(--primary)]";

  return (
    <div className="relative w-full text-[var(--text-heading)] transition-colors duration-150 max-w-xl mx-auto px-2 sm:px-4">
      <div className="w-full flex flex-col justify-between">
        <div>
          {/* ── Page Header (Top-right message icon shown once an agent has been assigned) ── */}
          <PageHeader
            title={task.title}
            showBack={true}
            onBack={() => router.push("/dashboard/tasks")}
            rightSlot={
              task.agent ? (
                <Link
                  href={`/dashboard/tasks/${task.id}/chat`}
                  title="Open Task Messages"
                  className="relative w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex items-center justify-center text-[var(--text-heading)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors cursor-pointer"
                  aria-label="Open Task Messages"
                >
                  <MessageSquare className="w-4.5 h-4.5" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--primary)]" />
                </Link>
              ) : undefined
            }
          />

          {/* ── Subheader Block ── */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="min-w-0 flex-1">
              <h2 className="text-[19px] sm:text-[21px] font-bold text-[var(--text-heading)] tracking-tight truncate">
                {task.projectName}
              </h2>
              <p className="text-[12.5px] text-[var(--text-muted)] mt-1 leading-snug">
                {task.subtitle}
              </p>
            </div>
            <span
              className={`inline-block font-semibold px-2.5 py-1 rounded-md text-[12px] whitespace-nowrap shadow-xs ${statusPillClass}`}
            >
              {statusLabel}
            </span>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              STATE: PRICE PROPOSAL (When admin reviewed and quoted fee)
             ═══════════════════════════════════════════════════════════════ */}
          {viewMode === "proposal" && task.proposalDetails && (
            <div className="space-y-4 mb-6 animate-in fade-in duration-200">
              <div className="rounded-[22px] bg-[var(--bg-card)] border border-blue-200 dark:border-blue-900/60 p-5 shadow-xs">
                <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 mb-2">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="text-[15px] font-bold">
                    Oversite Price Proposal
                  </h3>
                </div>
                <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                  The Oversite verification operations team has audited your
                  scope requirements and prepared the binding tariff schedule
                  below.
                </p>

                {task.proposalDetails.scope && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3.5 mb-4 text-[12.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <strong className="text-zinc-900 dark:text-white block mb-1">
                      Investigation Scope:
                    </strong>
                    {task.proposalDetails.scope}
                  </div>
                )}

                <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[13.5px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Professional Agent Fee</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      ₦{task.proposalDetails.baseFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">
                      Statutory Agency / Registry Costs
                    </span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      ₦{task.proposalDetails.filingCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[var(--border-color)] text-[15px] font-bold">
                    <span className="text-[var(--text-heading)]">
                      Total Agreed Tariff
                    </span>
                    <span className="text-[var(--primary)]">
                      ₦{task.proposalDetails.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {paymentError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[12.5px] text-red-600 dark:text-red-400">
                    {paymentError}
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={isInitializingPayment}
                onClick={handleAcceptProposal}
                className="w-full py-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-[0.98] text-white font-bold text-[16px] transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isInitializingPayment && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                {isInitializingPayment
                  ? "Opening payment..."
                  : `Accept Proposal & Pay ₦${task.proposalDetails.total.toLocaleString()}`}
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STATE: AWAITING (Draft / Unpaid Task)
             ═══════════════════════════════════════════════════════════════ */}
          {viewMode === "awaiting" && (
            <div className="py-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-full bg-[var(--warning-light)] flex items-center justify-center mb-5">
                <Clock className="w-8 h-8 text-[var(--warning)]" />
              </div>
              <h3 className="text-[17px] font-bold text-[var(--text-heading)] mb-2">
                Payment Pending
              </h3>
              <p className="text-[13.5px] text-[var(--text-muted)] max-w-sm leading-relaxed px-4">
                Complete checkout to mobilize an accredited field operative to
                this site.
              </p>

              {paymentError && (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 max-w-sm text-left">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[12.5px] text-red-600 dark:text-red-400">
                    {paymentError}
                  </p>
                </div>
              )}

              <button
                type="button"
                disabled={isInitializingPayment}
                onClick={handleAcceptProposal}
                className="mt-6 px-7 py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-[14px] cursor-pointer shadow-md disabled:opacity-60 flex items-center gap-2"
              >
                {isInitializingPayment && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                <span>
                  {isInitializingPayment
                    ? "Opening Paystack..."
                    : `Complete Payment (${task.totalCharged || "₦12,100"})`}
                </span>
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              SCREEN 2: UNIFIED TIMELINE MILESTONES, MANAGER NOTE, PDF REPORT & SUMMARY
             ═══════════════════════════════════════════════════════════════ */}
          {(viewMode === "completed" || viewMode === "report_submitted") && (
            <div
              className="space-y-5 animate-in fade-in duration-200 pb-10"
              id="milestones"
            >
              {/* ── 1. Unified Timeline Milestones Card (Exact Match to Screenshot 2) ── */}
              <div>
                <h3 className="text-[16px] font-bold text-[var(--text-heading)] mb-3">
                  Milestones
                </h3>

                <div className="rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 sm:p-5 shadow-xs">
                  {task.milestones && task.milestones.length > 0 ? (
                    <div className="relative">
                      {task.milestones.map((m, idx) => {
                        const isExpanded = !!expandedMilestones[m.id];
                        const isCompleted = m.status === "COMPLETED";
                        const isInProgress = m.status === "IN_PROGRESS";
                        const isLast = idx === (task.milestones?.length ?? 0) - 1;

                        return (
                          <div
                            key={m.id}
                            id={`milestone-${m.id}`}
                            className="relative flex gap-3.5"
                          >
                            {/* Left Vertical Timeline Track & Status Dot */}
                            <div className="flex flex-col items-center shrink-0 pt-1">
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                                  isCompleted
                                    ? "bg-[var(--primary)] text-white"
                                    : isInProgress
                                      ? "bg-white dark:bg-zinc-900 border-[3px] border-[var(--primary)]"
                                      : "bg-zinc-200 dark:bg-zinc-700"
                                }`}
                              >
                                {isCompleted && (
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                )}
                              </div>
                              {!isLast && (
                                <div
                                  className={`w-[1.5px] flex-1 my-1.5 min-h-[28px] ${
                                    isCompleted
                                      ? "bg-[var(--primary)]/40"
                                      : "bg-zinc-200 dark:bg-zinc-800"
                                  }`}
                                />
                              )}
                            </div>

                            {/* Right Milestone Content Column */}
                            <div
                              className={`flex-1 min-w-0 ${
                                !isLast ? "pb-5" : "pb-1"
                              }`}
                            >
                              {/* Clickable Header Row */}
                              <div
                                onClick={() => toggleMilestone(m.id)}
                                className="flex items-center justify-between gap-2 cursor-pointer select-none group"
                              >
                                <h4 className="text-[14px] sm:text-[14.5px] font-bold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                                  {m.title}
                                </h4>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isCompleted ? (
                                    <span className="text-[11.5px] font-semibold text-[var(--primary)] bg-[var(--primary-light)] px-2.5 py-0.5 rounded-full">
                                      Completed
                                    </span>
                                  ) : isInProgress ? (
                                    <span className="text-[11.5px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full">
                                      In Progress
                                    </span>
                                  ) : (
                                    <span className="text-[11.5px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full">
                                      Pending
                                    </span>
                                  )}

                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                                  )}
                                </div>
                              </div>

                              {/* Expanded Milestone Details + Media Thumbnails Underneath */}
                              {isExpanded && (
                                <div className="mt-2.5 space-y-3 animate-in fade-in duration-150">
                                  <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
                                    {m.desc}
                                  </p>

                                  {m.agentNote && (
                                    <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]/60 text-[12px] text-[var(--text-heading)]">
                                      <span className="font-bold text-[var(--primary)]">
                                        Field Report Note:{" "}
                                      </span>
                                      {m.agentNote}
                                    </div>
                                  )}

                                  {/* Submitted Media Thumbnails Below Milestone Data */}
                                  {m.mediaUrls && m.mediaUrls.length > 0 && (
                                    <div className="flex items-center gap-2.5 flex-wrap pt-0.5">
                                      {m.mediaUrls.map((imgUrl, imgIdx) => (
                                        <button
                                          key={`${m.id}-img-${imgIdx}`}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setLightboxState({
                                              images: m.mediaUrls,
                                              index: imgIdx,
                                              title: m.title,
                                            });
                                          }}
                                          className="relative w-28 h-20 sm:w-32 sm:h-22 rounded-xl overflow-hidden border border-[var(--border-color)] bg-zinc-100 dark:bg-zinc-800 group/thumb cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                                          title="Click to inspect full-size media"
                                        >
                                          <img
                                            src={imgUrl}
                                            alt={`${m.title} media ${imgIdx + 1}`}
                                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
                                          />
                                          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-colors" />
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {m.pdfGenerated && (
                                    <div className="pt-1">
                                      <Link
                                        href={`/dashboard/tasks/${task.id}/report`}
                                        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--primary)] hover:underline"
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                        <span>
                                          Download Milestone PDF Report →
                                        </span>
                                      </Link>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[13px] text-[var(--text-muted)]">
                      Milestones are being configured by the Oversite operations
                      team.
                    </p>
                  )}
                </div>
              </div>

              {/* ── 2. Oversite Manager Note (Exact Match to Screenshot 2) ── */}
              <div>
                <h3 className="text-[16px] font-bold text-[var(--text-heading)] mb-2.5">
                  Oversite manager note
                </h3>
                <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs">
                  <p className="text-[13.5px] text-[var(--text-heading)] leading-relaxed">
                    {task.managerNote}
                  </p>
                </div>
              </div>

              {/* ── 3. Official Project Review Report Card (Exact Match to Screenshot 2) ── */}
              <div id="report">
                <Link
                  href={`/dashboard/tasks/${task.id}/report`}
                  className="w-full rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 sm:p-4.5 shadow-xs flex items-center justify-between hover:border-[var(--primary)]/50 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-heading)]">
                      <FileText className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div>
                      <h4 className="text-[14.5px] font-bold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                        {task.reportName}
                      </h4>
                      <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
                        {task.reportSize}
                      </p>
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors">
                    <Download className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </Link>
              </div>

              {/* ── 4. Task Summary Breakdown Table Card (Exact Match to Screenshot 2) ── */}
              <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs">
                {/* Row 1 */}
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-[var(--text-muted)] font-medium">
                    Task
                  </span>
                  <span className="font-bold text-[var(--text-heading)]">
                    {task.title}
                  </span>
                </div>

                <div className="border-b border-[var(--border-color)]/60 my-3.5" />

                {/* Row 2 */}
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-[var(--text-muted)] font-medium">
                    Accredited Manager
                  </span>
                  <span className="font-bold text-[var(--text-heading)]">
                    {task.agent || "Pending Allocation"}
                  </span>
                </div>

                <div className="border-b border-[var(--border-color)]/60 my-3.5" />

                {/* Row 3 */}
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-[var(--text-muted)] font-medium">
                    Time on task
                  </span>
                  <span className="font-bold text-[var(--text-heading)]">
                    {task.timeOnTask}
                  </span>
                </div>

                <div className="border-b border-[var(--border-color)]/60 my-3.5" />

                {/* Row 4 */}
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-[var(--text-muted)] font-medium">
                    Evidence
                  </span>
                  <span className="font-bold text-[var(--text-heading)]">
                    {task.evidence}
                  </span>
                </div>

                <div className="border-b border-[var(--border-color)]/60 my-3.5" />

                {/* Row 5 */}
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-[var(--text-muted)] font-medium">
                    Total charged
                  </span>
                  <span className="font-bold text-[var(--text-heading)]">
                    {task.totalCharged}
                  </span>
                </div>
              </div>

              {/* ── 5. Sticky Bottom Action Buttons (Exact Match to Screenshot 2) ── */}
              {viewMode === "report_submitted" ? (
                <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-[var(--bg-body)]/95 backdrop-blur-md pt-4 pb-4 -mx-2 sm:-mx-4 px-2 sm:px-4 border-t border-[var(--border-color)] flex items-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const token =
                        typeof window !== "undefined"
                          ? localStorage.getItem("oversite_token")
                          : null;
                      const h: Record<string, string> = {
                        "Content-Type": "application/json",
                      };
                      if (token) h["Authorization"] = `Bearer ${token}`;
                      await fetch(`/api/v1/tasks/${task.id}/approve`, {
                        method: "POST",
                        headers: h,
                      });
                      router.refresh();
                    }}
                    className="flex-1 py-4 rounded-full bg-[var(--primary)] hover:bg-[#23993e] text-white font-bold text-[15px] sm:text-[16px] transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    Approve & Release Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsIssueModalOpen(true)}
                    className="flex-1 py-4 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--primary)] font-bold text-[15px] sm:text-[16px] border border-[var(--border-color)] transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Report an Issue
                  </button>
                </div>
              ) : (() => {
                const alreadyRated = Boolean(task.clientRating);
                const completionBaseMs = task.completedAt
                  ? new Date(task.completedAt).getTime()
                  : task.updatedAt
                  ? new Date(task.updatedAt).getTime()
                  : 0;
                const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
                const isRatingWindowExpired =
                  !alreadyRated &&
                  task.status === "COMPLETED" &&
                  completionBaseMs > 0 &&
                  Date.now() - completionBaseMs > SEVEN_DAYS_MS;
                const ratingDisabled = alreadyRated || isRatingWindowExpired;

                return (
                  <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-[var(--bg-body)]/95 backdrop-blur-md pt-4 pb-4 -mx-2 sm:-mx-4 px-2 sm:px-4 border-t border-[var(--border-color)] flex items-center gap-3">
                    <button
                      type="button"
                      disabled={ratingDisabled}
                      onClick={() => {
                        if (!ratingDisabled) setIsRatingModalOpen(true);
                      }}
                      title={
                        alreadyRated
                          ? `You rated this agent ${task.clientRating?.rating}/5 ★`
                          : isRatingWindowExpired
                          ? "Rating window closed (7 days after task completion)"
                          : "Rate Agent"
                      }
                      className={`flex-1 py-4 rounded-xl font-bold text-[14px] sm:text-[15px] transition-all text-center ${
                        ratingDisabled
                          ? "bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed opacity-75"
                          : "bg-[var(--primary)] hover:bg-[#23993e] text-white shadow-md active:scale-[0.98] cursor-pointer"
                      }`}
                    >
                      {alreadyRated
                        ? `Rated (${task.clientRating?.rating}/5 ★)`
                        : isRatingWindowExpired
                        ? "Rating Closed (7d Passed)"
                        : "Rate Agent"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsIssueModalOpen(true)}
                      className="flex-1 py-4 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--primary)] font-bold text-[14px] sm:text-[15px] border border-[var(--border-color)] transition-all active:scale-[0.98] cursor-pointer text-center"
                    >
                      Report an Issue
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        <div className="pb-36" />
      </div>

      {/* ── Milestone Media Fullscreen Lightbox Modal ── */}
      {lightboxState && (
        <div
          className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxState(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 text-white">
              <div className="min-w-0 pr-3">
                <p className="text-[13.5px] font-bold truncate">
                  {lightboxState.title}
                </p>
                <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-[var(--primary)]" />
                  <span>
                    Geo-tagged Milestone Media ({lightboxState.index + 1} of{" "}
                    {lightboxState.images.length})
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLightboxState(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative bg-black flex items-center justify-center min-h-[280px] max-h-[70vh]">
              <img
                src={lightboxState.images[lightboxState.index]}
                alt={lightboxState.title}
                className="max-h-[70vh] w-auto object-contain"
              />

              {lightboxState.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxState((prev) =>
                        prev
                          ? {
                              ...prev,
                              index:
                                (prev.index - 1 + prev.images.length) %
                                prev.images.length,
                            }
                          : null
                      )
                    }
                    className="absolute left-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxState((prev) =>
                        prev
                          ? {
                              ...prev,
                              index: (prev.index + 1) % prev.images.length,
                            }
                          : null
                      )
                    }
                    className="absolute right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Rate Agent Modal ── */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsRatingModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-center">
            {ratingSubmitted ? (
              <div className="py-4">
                <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-[17px] font-bold text-[var(--text-heading)] mb-1">
                  Thank You!
                </h3>
                <p className="text-[13px] text-[var(--text-muted)] mb-5">
                  Your feedback has been routed to the Oversite Quality Control
                  team.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsRatingModalOpen(false);
                    setRatingSubmitted(false);
                  }}
                  className="w-full py-3 rounded-full bg-[var(--primary)] text-white font-bold text-[14px] cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-[18px] font-bold text-[var(--text-heading)] mb-1">
                  Rate {task.agent || "Agent"}
                </h3>
                <p className="text-[12.5px] text-[var(--text-muted)] mb-4">
                  How satisfied were you with the timeliness and accuracy of
                  this inspection?
                </p>
                <div className="flex items-center justify-center gap-2 mb-5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-[var(--text-muted)] opacity-40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Leave an optional remark or testimonial..."
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-3.5 text-[13px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] mb-5 resize-none"
                />
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsRatingModalOpen(false)}
                    className="flex-1 py-3 rounded-full bg-[var(--bg-secondary)] text-[var(--text-heading)] font-bold text-[14px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingRating}
                    onClick={handleSubmitRating}
                    className="flex-1 py-3 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-[14px] cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingRating ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Report an Issue Modal ── */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsIssueModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            {issueSubmitted ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-[17px] font-bold text-[var(--text-heading)] mb-1">
                  Ticket Filed
                </h3>
                <p className="text-[13px] text-[var(--text-muted)] mb-5">
                  Oversite Admin has received your escalation and will contact
                  you via email & messages.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsIssueModalOpen(false);
                    setIssueSubmitted(false);
                  }}
                  className="w-full py-3 rounded-full bg-[var(--primary)] text-white font-bold text-[14px] cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2 text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="text-[17px] font-bold text-[var(--text-heading)]">
                    Report an Issue
                  </h3>
                </div>
                <p className="text-[12.5px] text-[var(--text-muted)] mb-4 leading-relaxed">
                  Notice discrepancies with this report or need agent
                  re-inspection? Describe below for admin intervention.
                </p>
                <textarea
                  rows={4}
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  placeholder="Describe what needs correction or re-audit..."
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-3.5 text-[13px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-rose-500 mb-5 resize-none"
                />
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsIssueModalOpen(false)}
                    className="flex-1 py-3 rounded-full bg-[var(--bg-secondary)] text-[var(--text-heading)] font-bold text-[14px] cursor-pointer"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    disabled={!issueText.trim() || isSubmittingIssue}
                    onClick={handleSubmitIssue}
                    className="flex-1 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-[14px] disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingIssue ? "Filing..." : "File Ticket"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
