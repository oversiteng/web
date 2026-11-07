"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ClipboardList,
  MapPin,
  Clock,
  Wallet,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Task } from "@/lib/types/task";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function AgentDashboardPage() {
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [activeTasks, setActiveTasks] = useState<Task[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadAgentTerminal() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // 1. Fetch available matched tasks & active tasks
        const [tasksRes, walletRes] = await Promise.all([
          fetch("/api/v1/tasks?limit=50", { credentials: "include", headers }),
          fetch("/api/v1/wallets", { credentials: "include", headers }),
        ]);

        const tasksJson = await tasksRes.json();
        if (tasksJson.success && Array.isArray(tasksJson.data)) {
          const all: Task[] = tasksJson.data;
          setAvailableTasks(all.filter((t) => t.status === "MATCHED" || t.status === "PENDING"));
          setActiveTasks(
            all.filter((t) =>
              ["AGENT_EN_ROUTE", "AGENT_ON_SITE", "IN_PROGRESS", "REPORT_SUBMITTED"].includes(
                t.status
              )
            )
          );
          setCompletedCount(all.filter((t) => t.status === "COMPLETED").length);
        }

        const walletJson = await walletRes.json();
        if (walletJson.success && walletJson.data) {
          setWalletBalance(walletJson.data.availableBalanceNgn || "0");
        }
      } catch (err) {
        console.error("Failed to load agent dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAgentTerminal();
  }, []);

  const handleAcceptMission = async (taskId: string, title: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${taskId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({ status: "AGENT_EN_ROUTE" }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`Mission accepted: ${title}`);
        setAvailableTasks((prev) => prev.filter((t) => t.id !== taskId));
      } else {
        showToast(json.error?.message || "Failed to claim mission");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to accept mission");
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Agent Mission Terminal</h1>
          <p className="text-sm text-slate-400 mt-1">
            Accept assignments, broadcast geo-locations, and submit watermarked field audits.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Available Payout</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(parseFloat(walletBalance || "0"))}
          </div>
          <p className="text-[11px] text-amber-400 mt-1">Ready for bank withdrawal</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Tasks</span>
            <ClipboardList className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{activeTasks.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Assignments in progress</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completed Missions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{completedCount}</div>
          <p className="text-[11px] text-emerald-400 mt-1">Verified deliverables signed off</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Accreditation Status</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">VERIFIED</div>
          <p className="text-[11px] text-purple-400 mt-1">Active Operative Badge</p>
        </div>
      </div>

      {/* Real-Time Dispatch Opportunities */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <h2 className="text-base font-semibold text-white">Available Dispatch Opportunities</h2>
          </div>
          <span className="text-xs text-slate-400">Within operative zone</span>
        </div>

        {isLoading ? (
          <DynamicLoadingState variant="documents" count={2} />
        ) : availableTasks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-800 rounded-xl">
            No unclaimed missions waiting. When new client tasks are matched to your tier, they will ping here instantly.
          </div>
        ) : (
          <div className="space-y-3">
            {availableTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold">
                      {task.moduleType?.replace(/_/g, " ")}
                    </span>
                    <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {task.property?.address || "Lagos Operational Zone"}
                  </p>
                  <div className="text-[11px] text-amber-400/80 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Created {formatTimeAgo(task.createdAt)}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-base font-bold text-emerald-400">
                      {task.priceNgn ? formatCurrency(task.priceNgn) : "Quote pending"}
                    </span>
                    <div className="text-[10px] text-slate-400">Net payout</div>
                  </div>
                  <button
                    onClick={() => handleAcceptMission(task.id, task.title)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Accept Mission
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
