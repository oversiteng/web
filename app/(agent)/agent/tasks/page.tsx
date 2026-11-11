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
  ListFilter,
  ClipboardCheck,
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

type FilterType = "all" | "nearest" | "highest" | "soonest";

function AgentTasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "queue" ? "queue" : "queue";

  const [activeTab, setActiveTab] = useState<"queue" | "active">(initialTab);
  const [filter, setFilter] = useState<FilterType>("all");
  const [queueTasks, setQueueTasks] = useState<QueueTask[]>(INITIAL_QUEUE_TASKS);
  const [activeTasks, setActiveTasks] = useState<QueueTask[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states matching Screenshots 2, 3, 4
  const [inspectingTask, setInspectingTask] = useState<QueueTask | null>(null);
  const [confirmingTask, setConfirmingTask] = useState<QueueTask | null>(null);
  const [acceptedTaskSuccess, setAcceptedTaskSuccess] = useState<QueueTask | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Timer countdown simulation
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

  // Filter queue items
  const sortedQueue = [...queueTasks].sort((a, b) => {
    if (filter === "nearest") return a.distanceKm - b.distanceKm;
    if (filter === "highest") return b.payoutNgn - a.payoutNgn;
    if (filter === "soonest") return a.secondsRemaining - b.secondsRemaining;
    return 0;
  });

  const handleDecline = (taskId: string, e?: React.MouseEvent) => {
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
    setActiveTasks((prev) => [task, ...prev]);
    setAcceptedTaskSuccess(task);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4 max-w-full pb-10">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Page Title matching Screenshot 1 */}
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">Queue</h1>
        <div className="flex items-center gap-1 bg-[#121c16] border border-[#1b2b20] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "queue"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Queue ({queueTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "active"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Active ({activeTasks.length})
          </button>
        </div>
      </div>

      {activeTab === "queue" ? (
        <>
          {/* Filter Pills matching Screenshot 1 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filter === "all"
                  ? "bg-[#10b981] text-[#062414] shadow-sm shadow-emerald-500/10"
                  : "bg-[#121c16] border border-[#1b2b20] text-slate-300 hover:border-emerald-500/30"
              }`}
            >
              All {queueTasks.length}
            </button>
            <button
              type="button"
              onClick={() => setFilter("nearest")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                filter === "nearest"
                  ? "bg-[#10b981] text-[#062414] font-bold"
                  : "bg-[#121c16] border border-[#1b2b20] text-slate-300 hover:border-emerald-500/30"
              }`}
            >
              Nearest
            </button>
            <button
              type="button"
              onClick={() => setFilter("highest")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                filter === "highest"
                  ? "bg-[#10b981] text-[#062414] font-bold"
                  : "bg-[#121c16] border border-[#1b2b20] text-slate-300 hover:border-emerald-500/30"
              }`}
            >
              Highest pay
            </button>
            <button
              type="button"
              onClick={() => setFilter("soonest")}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                filter === "soonest"
                  ? "bg-[#10b981] text-[#062414] font-bold"
                  : "bg-[#121c16] border border-[#1b2b20] text-slate-300 hover:border-emerald-500/30"
              }`}
            >
              Soonest
            </button>
          </div>

          {/* Queue Tasks Cards List matching Screenshot 1 */}
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
                        onClick={(e) => handleDecline(task.id, e)}
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
        </>
      ) : (
        /* Active Tasks Tab */
        <div className="space-y-3 pt-1">
          {activeTasks.length === 0 ? (
            <div className="bg-[#121c16] border border-[#1b2b20] rounded-3xl p-8 text-center text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300 text-sm">No active tasks in progress</p>
              <p>Accept a mission from the Queue to begin on-site verification.</p>
              <button
                type="button"
                onClick={() => setActiveTab("queue")}
                className="mt-2 bg-[#10b981] text-black font-bold text-xs px-4 py-2 rounded-xl"
              >
                Go to Queue
              </button>
            </div>
          ) : (
            activeTasks.map((task) => (
              <div
                key={task.id}
                className="bg-[#121c16] border border-emerald-500/30 rounded-3xl p-4 sm:p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="bg-[#102419] border border-emerald-800/40 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    In Progress
                  </span>
                  <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>2h left</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-white font-bold text-base leading-snug">{task.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{task.address}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1a281e]">
                  <div className="text-lg font-bold text-white">
                    Payout: <span className="text-emerald-400 font-extrabold">₦{task.payoutNgn.toLocaleString()}</span>
                  </div>
                  <Link
                    href={`/agent/tasks/${task.id}`}
                    className="bg-[#10b981] hover:bg-[#059669] text-black text-xs font-bold px-5 py-2 rounded-xl transition-colors shadow-sm inline-flex items-center gap-1"
                  >
                    <span>Execute Task</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* =========================================================================
          SCREEN 2: Task Detail / Review View matching Screenshot 2
          ========================================================================= */}
      {inspectingTask && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#0b130e] border border-[#1b2b20] rounded-3xl p-4 sm:p-6 max-w-lg w-full space-y-4 my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Top row with Category and Timer */}
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

            {/* Title & Description */}
            <div>
              <h2 className="text-xl font-bold text-white leading-snug">
                {inspectingTask.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {inspectingTask.description}
              </p>
            </div>

            {/* Map Preview Graphic */}
            <div className="relative rounded-2xl overflow-hidden border border-[#1b2b20] bg-[#1a281e] h-44 flex items-center justify-center">
              {/* Illustrated Lagos street map background */}
              <div
                className="absolute inset-0 bg-cover bg-center opacity-80"
                style={{
                  backgroundImage:
                    "radial-gradient(#203829 15%, transparent 16%), radial-gradient(#162a1e 15%, transparent 16%)",
                  backgroundSize: "20px 20px",
                  backgroundPosition: "0 0, 10px 10px",
                  backgroundColor: "#0d1a12",
                }}
              >
                {/* SVG Street Grid Lines */}
                <svg className="w-full h-full opacity-35" viewBox="0 0 400 200">
                  <path d="M0,40 Q150,60 400,20" stroke="#10b981" strokeWidth="4" fill="none" />
                  <path d="M20,200 Q180,120 380,0" stroke="#34d399" strokeWidth="3" fill="none" />
                  <path d="M120,0 L200,200" stroke="#22543d" strokeWidth="3" fill="none" />
                  <path d="M0,150 L400,100" stroke="#22543d" strokeWidth="2" fill="none" />
                  <circle cx="200" cy="100" r="16" fill="#10b981" fillOpacity="0.2" />
                </svg>
              </div>

              {/* Red Map Pin */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-rose-500 shadow-lg shadow-rose-500/50 flex items-center justify-center text-white border-2 border-white animate-bounce">
                  <MapPin className="w-4 h-4 fill-white" />
                </div>
                <span className="text-[10px] font-bold bg-black/80 text-white px-2 py-0.5 rounded-md mt-1 backdrop-blur-xs">
                  {inspectingTask.locationArea}
                </span>
              </div>
            </div>

            {/* Location & Time tag below map */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{inspectingTask.distanceKm} km · {inspectingTask.address}</span>
              </span>
              <span className="flex items-center gap-1 shrink-0 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{inspectingTask.timeWindow}</span>
              </span>
            </div>

            {/* Structured Info Card matching Screenshot 2 */}
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

            {/* Disclaimer Alert Note matching Screenshot 2 */}
            <div className="bg-[#0e1f15] border border-emerald-900/40 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-300">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Declining won&apos;t affect your rating. Letting the timer run out will.
              </span>
            </div>

            {/* Bottom Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleDecline(inspectingTask.id)}
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

      {/* =========================================================================
          SCREEN 3: Accept Confirmation Bottom Sheet matching Screenshot 3
          ========================================================================= */}
      {confirmingTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#0b130e] border-t sm:border border-[#1b2b20] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Mobile handle drag bar */}
            <div className="w-12 h-1 bg-[#23382b] rounded-full mx-auto sm:hidden" />

            <div>
              <h2 className="text-lg font-bold text-white">Accept this task?</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Accepting is a commitment. Missing the window affects your on-time rate.
              </p>
            </div>

            {/* Summary card */}
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

            {/* Tier Allowance Info Note */}
            <div className="bg-[#0e1f15] border border-emerald-900/40 rounded-2xl p-3 flex items-start gap-2 text-xs text-emerald-300">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                This would be your 3rd accepted task today. Gold tier allows 3 at once.
              </span>
            </div>

            {/* Action buttons */}
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

      {/* =========================================================================
          SCREEN 4: Task Accepted Success Modal matching Screenshot 4
          ========================================================================= */}
      {acceptedTaskSuccess && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b130e] border border-[#1b2b20] rounded-3xl p-6 max-w-sm w-full text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Big Green Circle with Checkmark */}
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
                  router.push("/agent/dashboard");
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
