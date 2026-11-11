"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  ShieldCheck,
  Check,
  RotateCw,
  Play,
  Building2,
  Info,
} from "lucide-react";

export interface QueueTask {
  id: string;
  category: string;
  title: string;
  description: string;
  distanceKm: number;
  locationArea: string;
  address: string;
  timeWindow: string;
  payoutNgn: number;
  clientName: string;
  evidenceRequired: string;
  registryFee: string;
  secondsRemaining: number;
  deadlineText: string;
  instructions: string;
}

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
  progressPercent?: number;
}

const INITIAL_QUEUE_TASKS: QueueTask[] = [
  {
    id: "task-cac-cert-01",
    category: "Document Processing",
    title: "CAC certified copy retrieval",
    description:
      "Retrieve certified true copy of CAC registration at the Lagos Island registry office.",
    distanceKm: 2.1,
    locationArea: "Lagos Island",
    address: "4 Bourdillon Close, Ikeja, Lagos",
    timeWindow: "Within 24 hrs",
    payoutNgn: 7700,
    clientName: "Adaeze O.",
    evidenceRequired: "Scan + 2 photos",
    registryFee: "Reimbursed",
    secondsRemaining: 240,
    deadlineText: "Tomorrow, 2:07 PM",
    instructions:
      "Photo taken should include the front view, back view, driver's way, west fence, north fence, and side gate.",
  },
  {
    id: "task-dd-vendor-02",
    category: "Due Diligence",
    title: "Vendor background field check",
    description:
      "Confirm physical business address and take photographic evidence for a Tier 2 vendor report.",
    distanceKm: 2.1,
    locationArea: "Lagos Island",
    address: "Broad Street, Lagos Island Commercial District",
    timeWindow: "Within 48 hrs",
    payoutNgn: 6000,
    clientName: "Folake A.",
    evidenceRequired: "Physical signage + 4 photos",
    registryFee: "None",
    secondsRemaining: 0,
    deadlineText: "Friday, 11:30 AM",
    instructions:
      "Verify company signage on external directory, inspect reception desk, and record GPS coordinates at entrance.",
  },
  {
    id: "task-prop-lekki-03",
    category: "Property Oversite",
    title: "Site perimeter verification",
    description:
      "Document construction activity within 500m of a registered property in Lekki Phase 1.",
    distanceKm: 7.6,
    locationArea: "Lekki Phase 1",
    address: "Plot 14 Admiralty Way, Lekki Phase 1",
    timeWindow: "Within 72 hrs",
    payoutNgn: 7500,
    clientName: "Babajide K.",
    evidenceRequired: "Boundary beacon photos + perimeter survey",
    registryFee: "None",
    secondsRemaining: 360,
    deadlineText: "Saturday, 4:00 PM",
    instructions:
      "Capture boundary wall condition, adjacent road grading status, and any active excavation.",
  },
];

const INITIAL_MY_TASKS: MyTaskItem[] = [
  {
    id: "my-task-1",
    category: "Document Processing",
    title: "CAC certified copy retrieval",
    address: "4 Bourdillon Close, ikeja Lagos",
    locationArea: "Lagos Island",
    status: "ACTIVE",
    isHappeningNow: false,
    payoutNgn: 7700,
  },
  {
    id: "my-task-2",
    category: "Document Processing",
    title: "CAC certified copy retrieval",
    address: "4 Bourdillon Close, ikeja, Lagos.",
    locationArea: "Lagos Island",
    status: "ACTIVE",
    isHappeningNow: true,
    timeLeft: "2h left",
    payoutNgn: 7700,
    progressPercent: 85,
  },
  {
    id: "my-task-3",
    category: "Property Oversite",
    title: "Boundary & Perimeter Inspection",
    address: "14 Admiralty Way, Lekki. Lagos.",
    locationArea: "Lekki Phase 1",
    status: "ACTIVE",
    isHappeningNow: false,
    timeLeft: "4h left",
    payoutNgn: 9500,
  },
  {
    id: "my-task-review-1",
    category: "Due Diligence",
    title: "Victoria Island Corporate Verification",
    address: "Adeola Odeku Street, Victoria Island",
    locationArea: "Victoria Island",
    status: "UNDER_REVIEW",
    timeLeft: "Under Client Review",
    payoutNgn: 12500,
  },
  {
    id: "my-task-comp-1",
    category: "Quick Errand",
    title: "Surulere Document Courier",
    address: "Adeniran Ogunsanya, Surulere",
    locationArea: "Surulere",
    status: "COMPLETED",
    timeLeft: "Payout Approved",
    payoutNgn: 4500,
  },
];

type QueueFilterType = "all" | "nearest" | "highest" | "soonest";
type MyTasksTabType = "ACTIVE" | "UNDER_REVIEW" | "COMPLETED";

function AgentTasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Main screen mode: "my-tasks" (Image 1) or "queue" (Image 1 from earlier flow)
  const [screenMode, setScreenMode] = useState<"my-tasks" | "queue">(
    tabParam === "queue" ? "queue" : "my-tasks"
  );

  // My Tasks filter matching Image 1: Active (3), Under Review (1), Completed (1)
  const [myTasksTab, setMyTasksTab] = useState<MyTasksTabType>("ACTIVE");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Queue state
  const [queueFilter, setQueueFilter] = useState<QueueFilterType>("all");
  const [queueTasks, setQueueTasks] = useState<QueueTask[]>(INITIAL_QUEUE_TASKS);
  const [myTasks, setMyTasks] = useState<MyTaskItem[]>(INITIAL_MY_TASKS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals for Queue flow
  const [inspectingTask, setInspectingTask] = useState<QueueTask | null>(null);
  const [confirmingTask, setConfirmingTask] = useState<QueueTask | null>(null);
  const [acceptedTaskSuccess, setAcceptedTaskSuccess] = useState<QueueTask | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    showToast("Refreshing assigned tasks...");
    setTimeout(() => {
      setIsRefreshing(false);
      showToast("Tasks up to date");
    }, 800);
  };

  // Live timer simulation for queue offers
  useEffect(() => {
    const timer = setInterval(() => {
      setQueueTasks((prev) =>
        prev.map((t) => ({
          ...t,
          secondsRemaining: Math.max(0, t.secondsRemaining - 1),
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedQueue = [...queueTasks].sort((a, b) => {
    if (queueFilter === "nearest") return a.distanceKm - b.distanceKm;
    if (queueFilter === "highest") return b.payoutNgn - a.payoutNgn;
    if (queueFilter === "soonest") return a.secondsRemaining - b.secondsRemaining;
    return 0;
  });

  const activeMyTasks = myTasks.filter((t) => t.status === "ACTIVE");
  const reviewMyTasks = myTasks.filter((t) => t.status === "UNDER_REVIEW");
  const completedMyTasks = myTasks.filter((t) => t.status === "COMPLETED");

  const displayedMyTasks = myTasks.filter((t) => t.status === myTasksTab);

  const handleDeclineQueueTask = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setQueueTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (inspectingTask?.id === taskId) setInspectingTask(null);
    showToast("Task declined and removed from queue");
  };

  const handleStartAcceptFlow = (task: QueueTask, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setInspectingTask(null);
    setConfirmingTask(task);
  };

  const handleConfirmAcceptance = (task: QueueTask) => {
    setConfirmingTask(null);
    setQueueTasks((prev) => prev.filter((t) => t.id !== task.id));
    const newMyTask: MyTaskItem = {
      id: task.id,
      category: task.category,
      title: task.title,
      address: task.address,
      locationArea: task.locationArea,
      status: "ACTIVE",
      payoutNgn: task.payoutNgn,
      isHappeningNow: true,
      timeLeft: "2h left",
    };
    setMyTasks((prev) => [newMyTask, ...prev]);
    setAcceptedTaskSuccess(task);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4 max-w-full pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW 1: "MY TASKS" SCREEN (MATCHING IMAGE 1 EXACTLY)
          ========================================================================= */}
      {screenMode === "my-tasks" ? (
        <div className="space-y-4">
          {/* Top App Bar matching Image 1 */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <Link
                href="/agent/dashboard"
                className="w-9 h-9 rounded-full bg-[#121c16] border border-[#1b2b20] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl font-bold text-white tracking-tight">My Tasks</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="w-9 h-9 rounded-full bg-[#121c16] border border-[#1b2b20] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
              </button>
            </div>
          </div>

          {/* Switcher pill between "My Tasks" and "Queue" */}
          <div className="flex items-center gap-1 bg-[#121c16] border border-[#1b2b20] p-1 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setScreenMode("my-tasks")}
              className="px-3.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
            >
              My Tasks ({myTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setScreenMode("queue")}
              className="px-3.5 py-1 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              Available Queue ({queueTasks.length})
            </button>
          </div>

          {/* Filter Pills matching Image 1: Active (3), Under Review (1), Completed (1) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setMyTasksTab("ACTIVE")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                myTasksTab === "ACTIVE"
                  ? "bg-[#10b981] text-[#062414] shadow-sm shadow-emerald-500/10"
                  : "bg-[#121c16] border border-[#1b2b20] text-slate-300 hover:border-emerald-500/30"
              }`}
            >
              Active ({activeMyTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setMyTasksTab("UNDER_REVIEW")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                myTasksTab === "UNDER_REVIEW"
                  ? "bg-[#10b981] text-[#062414] font-bold"
                  : "bg-[#121c16] border border-[#1b2b20] text-slate-300 hover:border-emerald-500/30"
              }`}
            >
              Under Review ({reviewMyTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setMyTasksTab("COMPLETED")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                myTasksTab === "COMPLETED"
                  ? "bg-[#10b981] text-[#062414] font-bold"
                  : "bg-[#121c16] border border-[#1b2b20] text-slate-300 hover:border-emerald-500/30"
              }`}
            >
              Completed ({completedMyTasks.length})
            </button>
          </div>

          {/* Tasks List matching Image 1 */}
          <div className="space-y-3 pt-1">
            {displayedMyTasks.length === 0 ? (
              <div className="bg-[#121c16] border border-[#1b2b20] rounded-3xl p-8 text-center text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-300 text-sm">No tasks in this category</p>
                <p>Accept new missions from the queue to start assignments.</p>
              </div>
            ) : (
              displayedMyTasks.map((task) => {
                const isHappeningNow = task.isHappeningNow;

                return (
                  <div
                    key={task.id}
                    className={`rounded-3xl p-4 sm:p-5 space-y-3 transition-all ${
                      isHappeningNow
                        ? "border border-emerald-500/60 bg-[#0e1a12] shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                        : "bg-[#121c16] border border-[#1b2b20] hover:border-emerald-500/30"
                    }`}
                  >
                    {/* Top Row: Location or Badges */}
                    <div className="flex items-center justify-between">
                      {isHappeningNow ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-extrabold uppercase tracking-wide">
                            <Play className="w-2.5 h-2.5 fill-emerald-400" />
                            Happening now
                          </span>
                          <span className="bg-[#291e13] border border-amber-800/40 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{task.timeLeft || "2h left"}</span>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-slate-400 font-medium">
                            {task.locationArea}
                          </span>
                          {task.timeLeft ? (
                            <span className="bg-[#16231b] border border-[#213527] text-slate-300 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{task.timeLeft}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-[#16241b] border border-[#213427] px-2.5 py-0.5 rounded-full">
                              Completed
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Task Title & Address matching Image 1 */}
                    <div>
                      <h3 className="text-white font-bold text-base leading-snug">
                        {task.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{task.address}</span>
                      </p>
                    </div>

                    {/* Payout & Action Button matching Image 1 */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#1a281e]">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          Estimated Payout
                        </span>
                        <span className="text-lg font-extrabold text-emerald-400">
                          ₦{task.payoutNgn.toLocaleString()}
                        </span>
                      </div>

                      <div>
                        {isHappeningNow ? (
                          <Link
                            href={`/agent/tasks/${task.id}`}
                            className="bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-xs px-5 py-2.5 rounded-full inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                          >
                            <span>Continue task</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <Link
                            href={`/agent/tasks/${task.id}`}
                            className="bg-[#10b981] hover:bg-[#059669] text-black font-semibold text-xs px-5 py-2.5 rounded-full inline-flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                          >
                            <span>Start arrival</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW 2: "QUEUE" SCREEN (MATCHING EARLIER FLOW SPECIFICATIONS)
            ========================================================================= */
        <div className="space-y-4">
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setScreenMode("my-tasks")}
                className="w-9 h-9 rounded-full bg-[#121c16] border border-[#1b2b20] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold text-white tracking-tight">Queue</h1>
            </div>

            <div className="flex items-center gap-1 bg-[#121c16] border border-[#1b2b20] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setScreenMode("my-tasks")}
                className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                My Tasks ({myTasks.length})
              </button>
              <button
                type="button"
                onClick={() => setScreenMode("queue")}
                className="px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
              >
                Queue ({queueTasks.length})
              </button>
            </div>
          </div>

          {/* Queue Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setQueueFilter("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                queueFilter === "all"
                  ? "bg-[#10b981] text-[#062414] shadow-sm shadow-emerald-500/10"
                  : "bg-[#121c16] border border-[#1b2b20] text-slate-300 hover:border-emerald-500/30"
              }`}
            >
              All {queueTasks.length}
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter("nearest")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                queueFilter === "nearest"
                  ? "bg-[#10b981] text-[#062414] font-bold"
                  : "bg-[#121c16] border border-[#1b2b20] text-slate-300 hover:border-emerald-500/30"
              }`}
            >
              Nearest
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter("highest")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                queueFilter === "highest"
                  ? "bg-[#10b981] text-[#062414] font-bold"
                  : "bg-[#121c16] border border-[#1b2b20] text-slate-300 hover:border-emerald-500/30"
              }`}
            >
              Highest pay
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter("soonest")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                queueFilter === "soonest"
                  ? "bg-[#10b981] text-[#062414] font-bold"
                  : "bg-[#121c16] border border-[#1b2b20] text-slate-300 hover:border-emerald-500/30"
              }`}
            >
              Soonest
            </button>
          </div>

          {/* Queue Items */}
          <div className="space-y-3 pt-1">
            {sortedQueue.length === 0 ? (
              <div className="bg-[#121c16] border border-[#1b2b20] rounded-3xl p-8 text-center text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-300 text-sm">No tasks currently in queue</p>
                <p>New missions will appear here automatically when matched with your territory.</p>
              </div>
            ) : (
              sortedQueue.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setInspectingTask(task)}
                  className="bg-[#121c16] border border-[#1b2b20] hover:border-emerald-500/40 rounded-3xl p-4 sm:p-5 space-y-2.5 transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      {task.category}
                    </span>
                    <span className="bg-[#361519] border border-rose-900/40 text-rose-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-400" />
                      <span>{formatTimer(task.secondsRemaining)}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-base leading-snug group-hover:text-emerald-400 transition-colors">
                      {task.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{task.distanceKm} km · {task.locationArea}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{task.timeWindow}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1a281e]">
                    <div className="text-xl font-extrabold text-emerald-400">
                      ₦{task.payoutNgn.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDeclineQueueTask(task.id, e)}
                        className="bg-[#19271e] hover:bg-[#223629] text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl border border-[#233529] cursor-pointer transition-colors"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleStartAcceptFlow(task, e)}
                        className="bg-[#10b981] hover:bg-[#059669] text-black text-xs font-bold px-5 py-2 rounded-xl cursor-pointer transition-colors shadow-sm"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Inspecting Task Modal (Screenshot 2) */}
      {inspectingTask && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0b130e] border border-[#1b2b20] rounded-3xl p-4 sm:p-6 max-w-lg w-full space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <span className="bg-[#16271e] text-emerald-400 border border-emerald-800/40 text-xs font-semibold px-3 py-1 rounded-full">
                {inspectingTask.category}
              </span>
              <div className="flex items-center gap-2">
                <span className="bg-[#361519] border border-rose-900/40 text-rose-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-rose-400" />
                  <span>{formatTimer(inspectingTask.secondsRemaining)} to accept</span>
                </span>
                <button
                  type="button"
                  onClick={() => setInspectingTask(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white leading-snug">
                {inspectingTask.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {inspectingTask.description}
              </p>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-[#1b2b20] bg-[#1a281e] h-44 flex items-center justify-center">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50 flex items-center justify-center text-white border-2 border-white animate-bounce">
                  <MapPin className="w-4 h-4 fill-white" />
                </div>
                <span className="text-[10px] font-bold bg-black/80 text-white px-2 py-0.5 rounded-md mt-1 backdrop-blur-xs">
                  {inspectingTask.locationArea}
                </span>
              </div>
            </div>

            <div className="bg-[#121c16] border border-[#1b2b20] rounded-2xl p-4 divide-y divide-[#1b2b20] text-xs space-y-2">
              <div className="flex items-center justify-between pb-2">
                <span className="text-slate-400">Payout</span>
                <span className="text-white font-extrabold text-sm">
                  ₦{inspectingTask.payoutNgn.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Time window</span>
                <span className="text-slate-200 font-medium">{inspectingTask.timeWindow}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Client</span>
                <span className="text-slate-200 font-medium">{inspectingTask.clientName}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Evidence required</span>
                <span className="text-slate-200 font-medium">{inspectingTask.evidenceRequired}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Registry fee</span>
                <span className="text-emerald-400 font-bold">{inspectingTask.registryFee}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleDeclineQueueTask(inspectingTask.id)}
                className="w-1/3 bg-[#16221a] hover:bg-[#1e2e23] text-slate-300 border border-[#233529] py-3 rounded-2xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleStartAcceptFlow(inspectingTask)}
                className="flex-1 bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-sm py-3 rounded-2xl cursor-pointer transition-colors shadow-md"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirming Task Modal (Screenshot 3) */}
      {confirmingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0b130e] border-t sm:border border-[#1b2b20] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="w-12 h-1 bg-[#23382b] rounded-full mx-auto sm:hidden" />
            <div>
              <h2 className="text-lg font-bold text-white">Accept this task?</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Accepting is a commitment. Missing the window affects your on-time rate.
              </p>
            </div>

            <div className="bg-[#121c16] border border-[#1b2b20] rounded-2xl p-4 divide-y divide-[#1b2b20] text-xs space-y-2">
              <div className="flex items-center justify-between pb-2">
                <span className="text-slate-400">Task</span>
                <span className="text-white font-semibold truncate max-w-[200px]">
                  {confirmingTask.title}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Where</span>
                <span className="text-slate-200 font-medium">
                  {confirmingTask.locationArea} · {confirmingTask.distanceKm} km
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Must finish by</span>
                <span className="text-slate-200 font-medium">{confirmingTask.deadlineText}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">You&apos;ll earn</span>
                <span className="text-white font-extrabold text-sm">
                  ₦{confirmingTask.payoutNgn.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingTask(null)}
                className="w-1/3 bg-[#16221a] hover:bg-[#1e2e23] text-slate-300 border border-[#233529] py-3 rounded-2xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmAcceptance(confirmingTask)}
                className="flex-1 bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-xs py-3 rounded-2xl cursor-pointer transition-colors shadow-md text-center"
              >
                Yes, accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Accepted Success (Screenshot 4) */}
      {acceptedTaskSuccess && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b130e] border border-[#1b2b20] rounded-3xl p-6 max-w-sm w-full text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#10b981] flex items-center justify-center text-[#062414] mx-auto shadow-xl shadow-emerald-500/20">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Accept this task?</h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                <span className="font-semibold text-slate-200">{acceptedTaskSuccess.title}</span> is now yours. Finish by {acceptedTaskSuccess.deadlineText.toLowerCase()}.
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              <Link
                href={`/agent/tasks/${acceptedTaskSuccess.id}`}
                className="block w-full bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-sm py-3 rounded-2xl transition-colors shadow-md"
              >
                Begin task
              </Link>
              <button
                type="button"
                onClick={() => {
                  setAcceptedTaskSuccess(null);
                  setScreenMode("my-tasks");
                }}
                className="block w-full bg-[#16221a] hover:bg-[#1e2e23] text-slate-300 border border-[#233529] font-semibold text-xs py-2.5 rounded-2xl transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgentTasksPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AgentTasksContent />
    </Suspense>
  );
}
