"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  FileText,
  Download,
  Star,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

interface TaskDetail {
  id: string;
  title: string;
  projectName: string;
  subtitle: string;
  category: string;
  status: "in_progress" | "ready" | "review" | "completed";
  agent: string;
  timeOnTask: string;
  evidence: string;
  totalCharged: string;
  riskRating: string;
  refNumber: string;
  managerNote: string;
  reportName: string;
  reportSize: string;
  milestones: { title: string; desc: string }[];
  images: string[];
  proposedPrice?: number;
  proposalDetails?: {
    scope: string;
    filingCost: number;
    baseFee: number;
    total: number;
  };
}

const DEFAULT_TASK: TaskDetail = {
  id: "task-1",
  title: "Project review",
  projectName: "Lekki duplex - Block B",
  subtitle: "Project review · In progress by Tunde C. · 2h ago",
  category: "Property",
  status: "in_progress",
  agent: "Folake A.",
  timeOnTask: "2 h 14 min",
  evidence: "3 photos · geo-tagged",
  totalCharged: "₦15,000",
  riskRating: "Low",
  refNumber: "OS-2026-08841",
  managerNote:
    "Property confirmed at registered GPS coordinates. No unauthorized construction observed. Perimeter fence intact on north and west boundaries. 12 geo-tagged photographs attached. Title status confirmed clean at the Lagos State Lands Bureau.",
  reportName: "Project review report",
  reportSize: "Today · 1.8 MB",
  milestones: [
    {
      title: "1. Foundation & DPC",
      desc: "The foundation is in excellent condition, but after verification, we found a few notes that still need to be addressed.",
    },
    {
      title: "2. Superstructure to roof level",
      desc: "The foundation is in excellent condition, but after verification, we found a few notes that still need to be addressed.",
    },
  ],
  images: [
    "/assets/images/tasks/site-worker.jpg",
    "/assets/images/tasks/blueprints.jpg",
    "/assets/images/tasks/foundation.jpg",
  ],
};

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;

  const [task, setTask] = useState<TaskDetail>(DEFAULT_TASK);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // View mode:
  // "awaiting" = Screenshot 2 (Empty in-progress state)
  // "completed" = Screenshot 3 & 4 (Full report with media & milestones)
  // "proposal" = Price proposal & settlement review (for review tasks)
  const [viewMode, setViewMode] = useState<"awaiting" | "completed" | "proposal">(
    "completed"
  );

  // Modals
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  const [isAcceptingProposal, setIsAcceptingProposal] = useState(false);
  const [proposalAccepted, setProposalAccepted] = useState(false);

  useEffect(() => {
    async function fetchTaskData() {
      // If it's a mock identifier, load predefined mock flows
      if (taskId === "task-6") {
        setTask({
          ...DEFAULT_TASK,
          id: "task-6",
          title: "Vendor background check",
          projectName: "Vendor Background Check - Plot 12 Lekki",
          subtitle: "Due Diligence · Price Proposal from Oversite Admin · 1h ago",
          status: "review",
          proposedPrice: 50000,
          proposalDetails: {
            scope:
              "Tier 2 Corporate and Vendor Investigation: CAC registry status, principal director litigation verification, asset liens, and police clearance confirmation.",
            baseFee: 35000,
            filingCost: 15000,
            total: 50000,
          },
        });
        setViewMode("proposal");
        return;
      }
      if (taskId === "task-4" || taskId === "task-5") {
        setViewMode("awaiting");
        return;
      }

      // Fetch live task from backend API
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/v1/tasks/${taskId}`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const t = json.data;
            let mappedStatus: "in_progress" | "ready" | "review" | "completed" = "in_progress";
            if (t.status === "COMPLETED") mappedStatus = "completed";
            else if (t.status === "READY" || t.status === "REPORT_SUBMITTED") mappedStatus = "ready";
            else if (t.status === "UNDER_REVIEW" || t.status === "DRAFT") mappedStatus = "review";

            setTask({
              ...DEFAULT_TASK,
              id: t.id,
              title: t.title || "Task Overview",
              projectName: t.locationAddress || "Registered Property Site",
              subtitle: `${t.moduleType?.replace(/_/g, " ") || "Task"} · ${mappedStatus === "completed" ? "Completed" : "In Progress"}`,
              status: mappedStatus,
              totalCharged: t.priceNgn ? `₦${Number(t.priceNgn).toLocaleString()}` : "₦15,000",
              managerNote: t.description || DEFAULT_TASK.managerNote,
            });

            if (mappedStatus === "completed" || mappedStatus === "ready") {
              setViewMode("completed");
            } else if (mappedStatus === "review") {
              setViewMode("proposal");
            } else {
              setViewMode("awaiting");
            }
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load task from API, falling back to default view:", err);
      }

      setViewMode("completed");
    }

    fetchTaskData();
  }, [taskId]);

  const toggleViewMode = () => {
    if (viewMode === "awaiting") setViewMode("completed");
    else if (viewMode === "completed") setViewMode("awaiting");
    else setViewMode("completed");
  };

  const handleAcceptProposal = () => {
    setIsAcceptingProposal(true);
    setTimeout(() => {
      setIsAcceptingProposal(false);
      setProposalAccepted(true);
      setTask((prev) => ({
        ...prev,
        status: "in_progress",
        subtitle: "Due Diligence · In progress by Folake A. · just now",
      }));
      setTimeout(() => {
        setProposalAccepted(false);
        setViewMode("awaiting");
      }, 1500);
    }, 1200);
  };

  return (
    <div className="bg-[#F2F4F2] dark:bg-[#111412] min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-[var(--text-heading)] transition-colors duration-150 animate-in fade-in duration-200 -m-4 sm:-m-6 md:-m-8">
      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4">
        <div>
          {/* ── Top Header (Matches Screenshots 2, 3, 4 Exactly) ── */}
          <div className="relative flex items-center justify-between py-3 mb-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard/tasks")}
              className="p-2 -ml-2 text-zinc-800 dark:text-zinc-200 hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Back to tasks"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h1 className="text-[17px] sm:text-[18px] font-bold text-zinc-900 dark:text-white tracking-tight text-center truncate px-2 flex-1">
              {task.title}
            </h1>

            {/* View Mode Toggle (⇄) icon matching Screenshots */}
            <button
              type="button"
              onClick={toggleViewMode}
              title="Toggle between Awaiting state and Completed Report state"
              className="p-2 -mr-2 text-zinc-800 dark:text-zinc-200 hover:text-[#2BB44A] transition-colors cursor-pointer"
              aria-label="Toggle state view"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          {/* ── Task Subheader Block ── */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="min-w-0 flex-1">
              <h2 className="text-[19px] sm:text-[21px] font-bold text-zinc-900 dark:text-white tracking-tight truncate">
                {task.projectName}
              </h2>
              <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                {task.subtitle}
              </p>
            </div>

            {/* Status Badge */}
            <div>
              {viewMode === "awaiting" ? (
                <span className="inline-block bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-semibold px-2.5 py-1 rounded-md text-[12px] whitespace-nowrap shadow-xs">
                  In progress
                </span>
              ) : viewMode === "proposal" ? (
                <span className="inline-block bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold px-2.5 py-1 rounded-md text-[12px] whitespace-nowrap shadow-xs">
                  Review quote
                </span>
              ) : (
                <span className="inline-block bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold px-2.5 py-1 rounded-md text-[12px] whitespace-nowrap shadow-xs">
                  Completed
                </span>
              )}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              STATE 1: PRICE PROPOSAL & SETTLEMENT AGREEMENT
             ───────────────────────────────────────────────────────────── */}
          {viewMode === "proposal" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="rounded-[22px] bg-white dark:bg-[#1E2220] border border-blue-200 dark:border-blue-900/60 p-5 shadow-xs">
                <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400 mb-2">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="text-[15px] font-bold">Oversite Price Proposal</h3>
                </div>
                <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                  The Oversite verification operations team has audited your scope requirements and prepared the binding tariff schedule below.
                </p>

                <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-xl p-3.5 mb-4 text-[12.5px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  <strong className="text-zinc-900 dark:text-white block mb-1">Investigation Scope:</strong>
                  {task.proposalDetails?.scope}
                </div>

                {/* Price Itemization */}
                <div className="space-y-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[13.5px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Professional Agent Fee</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      ₦{task.proposalDetails?.baseFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Statutory Agency / Registry Costs</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">
                      ₦{task.proposalDetails?.filingCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700 text-[15px] font-bold">
                    <span className="text-zinc-900 dark:text-white">Total Agreed Tariff</span>
                    <span className="text-[#2BB44A]">
                      ₦{task.proposalDetails?.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Accept & Pay Action Bar */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isAcceptingProposal}
                  onClick={handleAcceptProposal}
                  className="w-full py-4 rounded-full bg-[#2BB44A] hover:bg-[#259b40] active:scale-[0.98] text-white font-bold text-[16px] transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isAcceptingProposal
                    ? "Securing Escrow Payment..."
                    : `Accept Proposal & Pay ₦${task.proposalDetails?.total.toLocaleString()}`}
                </button>
              </div>

              {proposalAccepted && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-[13px]">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-[#2BB44A]" />
                  <span>Proposal accepted and funded via Escrow! Agent dispatched.</span>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STATE 2: AWAITING REPORT / EMPTY IN-PROGRESS (Screenshot 2)
             ───────────────────────────────────────────────────────────── */}
          {viewMode === "awaiting" && (
            <div className="py-20 sm:py-28 text-center flex flex-col items-center justify-center animate-in fade-in duration-200">
              <h3 className="text-[17px] sm:text-[18px] font-bold text-zinc-900 dark:text-white mb-2 max-w-sm">
                It looks like this space is currently empty!
              </h3>
              <p className="text-[13.5px] sm:text-[14px] text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed px-4">
                The oversite agent is currently looking into it. We will let you know once the report is completed or ready.
              </p>

              {/* Simulation button to view the completed report */}
              <button
                type="button"
                onClick={() => setViewMode("completed")}
                className="mt-8 px-6 py-2.5 rounded-full bg-white dark:bg-[#1E2220] border border-zinc-200 dark:border-zinc-800 text-[13px] font-bold text-zinc-800 dark:text-zinc-200 hover:border-[#2BB44A] hover:text-[#2BB44A] transition-colors shadow-xs cursor-pointer"
              >
                Simulate Agent Submission →
              </button>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              STATE 3: COMPLETED REPORT & MEDIA SUBMISSION (Screenshots 3 & 4)
             ───────────────────────────────────────────────────────────── */}
          {viewMode === "completed" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* ── Photo Gallery (Matches Screenshot 3) ── */}
              <div>
                {/* Main Image */}
                <div className="w-full h-[220px] sm:h-[260px] rounded-2xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 mb-2.5 shadow-xs relative">
                  <img
                    src={task.images[selectedImageIndex] || task.images[0]}
                    alt="Task evidence"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 3 Thumbnails below main image */}
                <div className="grid grid-cols-3 gap-2.5">
                  {task.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`h-[72px] sm:h-[80px] rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? "ring-2 ring-[#2BB44A] opacity-100 scale-[0.98]"
                          : "opacity-85 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Evidence thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* Risk and Ref Badges */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Risk: {task.riskRating}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    Ref: {task.refNumber}
                  </span>
                </div>
              </div>

              {/* ── Milestones Section (Matches Screenshot 3 & 4) ── */}
              <div>
                <h3 className="text-[16px] font-bold text-zinc-900 dark:text-white mb-3">
                  Milestones
                </h3>

                <div className="space-y-3">
                  {task.milestones.map((m, idx) => (
                    <div
                      key={idx}
                      className="rounded-[22px] bg-white dark:bg-[#1E2220] border border-zinc-100 dark:border-zinc-800/80 p-4.5 sm:p-5 shadow-xs"
                    >
                      <h4 className="text-[14.5px] font-bold text-zinc-900 dark:text-white mb-1.5">
                        {m.title}
                      </h4>
                      <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Oversite Manager Note (Matches Screenshot 4) ── */}
              <div>
                <h3 className="text-[16px] font-bold text-zinc-900 dark:text-white mb-3">
                  Oversite manager note
                </h3>

                <div className="rounded-[22px] bg-white dark:bg-[#1E2220] border border-zinc-100 dark:border-zinc-800/80 p-5 shadow-xs">
                  <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {task.managerNote}
                  </p>
                </div>
              </div>

              {/* ── PDF Report Card (Matches Screenshot 4) ── */}
              <Link
                href={`/dashboard/tasks/${task.id}/report`}
                className="w-full rounded-[22px] bg-white dark:bg-[#1E2220] border border-zinc-100 dark:border-zinc-800/80 p-4.5 shadow-xs flex items-center justify-between hover:border-[var(--primary)]/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-200">
                    <FileText className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <div>
                    <h4 className="text-[14.5px] font-bold text-zinc-900 dark:text-white group-hover:text-[#2BB44A] transition-colors">
                      {task.reportName}
                    </h4>
                    <p className="text-[11.5px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {task.reportSize}
                    </p>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                  <Download className="w-5 h-5 stroke-[2.2]" />
                </div>
              </Link>

              {/* ── Task Summary Breakdown Card (Matches Screenshot 4) ── */}
              <div className="rounded-[22px] bg-white dark:bg-[#1E2220] border border-zinc-100 dark:border-zinc-800/80 p-5 shadow-xs">
                {/* Row 1 */}
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Task</span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {task.title}
                  </span>
                </div>

                <div className="border-b border-zinc-100 dark:border-zinc-800 my-3.5" />

                {/* Row 2 */}
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                    Accredited Manager
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {task.agent}
                  </span>
                </div>

                <div className="border-b border-zinc-100 dark:border-zinc-800 my-3.5" />

                {/* Row 3 */}
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                    Time on task
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {task.timeOnTask}
                  </span>
                </div>

                <div className="border-b border-zinc-100 dark:border-zinc-800 my-3.5" />

                {/* Row 4 */}
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                    Evidence
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {task.evidence}
                  </span>
                </div>

                <div className="border-b border-zinc-100 dark:border-zinc-800 my-3.5" />

                {/* Row 5 */}
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                    Total charged
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    {task.totalCharged}
                  </span>
                </div>
              </div>

              {/* ── Bottom Action Buttons: Rate Agent / Report an Issue (Screenshot 4) ── */}
              <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-[#F2F4F2]/95 dark:bg-[#111412]/95 backdrop-blur-md pt-4 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsRatingModalOpen(true)}
                  className="flex-1 py-3.5 sm:py-4 rounded-full bg-[#2BB44A] hover:bg-[#259b40] text-white font-bold text-[15px] sm:text-[16px] transition-all shadow-md active:scale-[0.98] cursor-pointer text-center"
                >
                  Rate Agent
                </button>

                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(true)}
                  className="flex-1 py-3.5 sm:py-4 rounded-full bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[#2BB44A] dark:text-[#2BB44A] font-bold text-[15px] sm:text-[16px] border border-zinc-200/80 dark:border-zinc-700 transition-all active:scale-[0.98] cursor-pointer text-center"
                >
                  Report an Issue
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Space above bottom nav */}
        <div className="pb-36" />
      </div>

      {/* ── Rate Agent Modal ── */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsRatingModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1A1E1D] rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200 text-center">
            {ratingSubmitted ? (
              <div className="py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#2BB44A] flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-[17px] font-bold text-zinc-900 dark:text-white mb-1">
                  Thank You!
                </h3>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-5">
                  Your feedback has been routed to the Oversite Quality Control team.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsRatingModalOpen(false);
                    setRatingSubmitted(false);
                  }}
                  className="w-full py-3 rounded-full bg-[#2BB44A] text-white font-bold text-[14px]"
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-[18px] font-bold text-zinc-900 dark:text-white mb-1">
                  Rate {task.agent}
                </h3>
                <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mb-4">
                  How satisfied were you with the timeliness and accuracy of this inspection?
                </p>

                {/* Stars */}
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
                            : "text-zinc-300 dark:text-zinc-700"
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
                  className="w-full bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-3.5 text-[13px] text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none border border-transparent focus:border-[var(--primary)] mb-5 resize-none"
                />

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsRatingModalOpen(false)}
                    className="flex-1 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[14px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setRatingSubmitted(true)}
                    className="flex-1 py-3 rounded-full bg-[#2BB44A] text-white font-bold text-[14px]"
                  >
                    Submit
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
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsIssueModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1A1E1D] rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            {issueSubmitted ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-[17px] font-bold text-zinc-900 dark:text-white mb-1">
                  Ticket Filed
                </h3>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mb-5">
                  Oversite Admin has received your escalation and will contact you via email & messages.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsIssueModalOpen(false);
                    setIssueSubmitted(false);
                  }}
                  className="w-full py-3 rounded-full bg-[#2BB44A] text-white font-bold text-[14px]"
                >
                  Close
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2 text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="text-[17px] font-bold text-zinc-900 dark:text-white">
                    Escalate Issue to Admin
                  </h3>
                </div>
                <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                  Notice discrepancies with this report or need agent re-inspection? Describe below for admin intervention.
                </p>

                <textarea
                  rows={4}
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  placeholder="Describe what needs correction or re-audit..."
                  className="w-full bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-3.5 text-[13px] text-zinc-900 dark:text-white placeholder:text-zinc-400 outline-none border border-transparent focus:border-rose-500 mb-5 resize-none"
                />

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsIssueModalOpen(false)}
                    className="flex-1 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[14px]"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    disabled={!issueText.trim()}
                    onClick={() => setIssueSubmitted(true)}
                    className="flex-1 py-3 rounded-full bg-rose-600 text-white font-bold text-[14px] disabled:opacity-50"
                  >
                    File Ticket
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
