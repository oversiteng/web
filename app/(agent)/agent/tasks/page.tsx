"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  Play,
  CheckCircle2,
  AlertCircle,
  FileText,
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
    address: "4 Bourdillon Close, ikeja Lagos",
    locationArea: "Lagos Island",
    status: "ACTIVE",
    payoutNgn: 7700,
  },
  {
    id: "task-draft-ikoyi",
    category: "Document Processing",
    title: "CAC certified copy retrieval",
    address: "4 Bourdillon Close, ikeja, Lagos.",
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
    address: "14 Admiralty Way, Lekki. Lagos.",
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
  const router = useRouter();
  const [filter, setFilter] = useState<"ACTIVE" | "UNDER_REVIEW" | "COMPLETED">("ACTIVE");
  const [tasks, setTasks] = useState<MyTaskItem[]>(INITIAL_MY_TASKS);
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
      {/* 1. App Bar matching media_1794390056239_73abd41c.jpg */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <Link
            href="/agent/dashboard"
            className="p-1.5 -ml-1.5 rounded-full hover:bg-[#15231a] text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">My Tasks</h1>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="p-2 rounded-full hover:bg-[#15231a] text-slate-400 hover:text-white transition-all cursor-pointer"
          title="Refresh tasks"
        >
          <RotateCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
        </button>
      </div>

      {/* 2. Filter Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("ACTIVE")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "ACTIVE"
              ? "bg-[#22c55e] text-black font-bold shadow-xs"
              : "bg-[#121c16] text-slate-300 hover:text-white border border-[#1b2b20]"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("UNDER_REVIEW")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "UNDER_REVIEW"
              ? "bg-[#22c55e] text-black font-bold shadow-xs"
              : "bg-[#121c16] text-slate-300 hover:text-white border border-[#1b2b20]"
          }`}
        >
          Under Review ({reviewCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("COMPLETED")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "COMPLETED"
              ? "bg-[#22c55e] text-black font-bold shadow-xs"
              : "bg-[#121c16] text-slate-300 hover:text-white border border-[#1b2b20]"
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* 3. Task Cards List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-[#0e1612] border border-[#19271e] rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-sm">No tasks in this view</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filter === "ACTIVE"
              ? "You have no active assignments right now. Browse new requests in the Available Queue."
              : filter === "UNDER_REVIEW"
              ? "You have no reports currently pending quality review."
              : "Completed assignments and payouts will be archived here."}
          </p>
          {filter === "ACTIVE" && (
            <Link
              href="/agent/queue"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#22c55e] text-black font-bold text-xs mt-2"
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
                className={`rounded-3xl p-5 space-y-3 transition-all ${
                  isHappeningNow
                    ? "border border-emerald-500/60 bg-[#0c1611] shadow-lg shadow-emerald-950/20"
                    : "border border-[#19271e] bg-[#0e1612] hover:border-emerald-500/30"
                }`}
              >
                {/* Top Row: Location or HAPPENING NOW Badge + Status/Timer */}
                <div className="flex items-center justify-between">
                  {isHappeningNow ? (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Play className="w-2.5 h-2.5 fill-emerald-400" />
                      <span>HAPPENING NOW</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">{task.locationArea}</span>
                  )}

                  {task.timeLeft ? (
                    <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{task.timeLeft}</span>
                    </span>
                  ) : task.status === "COMPLETED" ? (
                    <span className="bg-[#18291f] text-emerald-400 border border-emerald-800/40 text-[11px] px-2.5 py-0.5 rounded-full font-medium">
                      Completed
                    </span>
                  ) : (
                    <span className="bg-[#18261e] text-slate-300 border border-[#23382b] text-[11px] px-2.5 py-0.5 rounded-full font-medium">
                      Assigned
                    </span>
                  )}
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-base font-semibold text-white leading-snug">{task.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{task.address}</span>
                  </div>
                </div>

                {/* Bottom Row: Estimated Payout + Action button */}
                <div className="flex items-center justify-between pt-3 border-t border-[#19271e]/70">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                      Estimated Payout
                    </span>
                    <span className="text-base font-bold text-[#22c55e]">
                      ₦{task.payoutNgn.toLocaleString()}
                    </span>
                  </div>

                  {isHappeningNow ? (
                    <Link
                      href={`/agent/tasks/${task.id}`}
                      className="px-5 py-2.5 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Continue task</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : task.status === "ACTIVE" ? (
                    <Link
                      href={`/agent/tasks/${task.id}`}
                      className="px-5 py-2.5 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Start arrival</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href={`/agent/tasks/${task.id}`}
                      className="px-4 py-2 rounded-2xl bg-[#16231a] hover:bg-[#1f3125] text-slate-300 text-xs font-semibold border border-[#23382b] transition-all inline-flex items-center gap-1 cursor-pointer"
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
