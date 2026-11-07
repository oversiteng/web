"use client";

import { useState, useEffect } from "react";
import { CreditCard, AlertCircle, ArrowUpRight, Check, X, ShieldAlert } from "lucide-react";
import { Task } from "@/lib/types/task";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function AdminFinanceDisputesPage() {
  const [disputedTasks, setDisputedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadDisputes() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/tasks?status=DISPUTED&limit=50", { credentials: "include", headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDisputedTasks(json.data);
        } else {
          setDisputedTasks([]);
        }
      } catch (err) {
        console.error("Failed to load disputed tasks:", err);
        setDisputedTasks([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadDisputes();
  }, []);

  const handleArbitrate = async (taskId: string, action: "REFUND" | "RELEASE") => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      if (action === "RELEASE") {
        const res = await fetch("/api/v1/payments/disburse", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ taskId }),
        });
        const json = await res.json();
        if (json.success) {
          setDisputedTasks((prev) => prev.filter((t) => t.id !== taskId));
          showToast("Secured funds disbursed to field operative.");
        } else {
          showToast(json.error?.message || "Disbursement failed.");
        }
      } else {
        const res = await fetch(`/api/v1/tasks/${taskId}/status`, {
          method: "PATCH",
          credentials: "include",
          headers,
          body: JSON.stringify({ status: "CANCELLED" }),
        });
        const json = await res.json();
        if (json.success) {
          setDisputedTasks((prev) => prev.filter((t) => t.id !== taskId));
          showToast("Task cancelled. Refund initiated to client card.");
        } else {
          showToast(json.error?.message || "Arbitration update failed.");
        }
      }
    } catch (err: any) {
      showToast(err.message || "Arbitration error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-red-500" />
            Financial Management & Dispute Arbitration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Arbitrate contested field reports, override secured payment releases, and process full client refunds.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Active Contested Deliverables</h2>

        {isLoading ? (
          <DynamicLoadingState variant="documents" count={2} />
        ) : disputedTasks.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
            No active disputes. All client deliverables are settled or currently undisputed.
          </div>
        ) : (
          disputedTasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400">TASK #{task.id.slice(0, 8)}</span>
                <span className="text-sm font-bold text-white">
                  {task.priceNgn ? formatCurrency(task.priceNgn) : "Pending Amount"} (Secured Payment Held)
                </span>
              </div>

              <div className="text-xs text-slate-300">
                <p>
                  Task: <span className="font-semibold text-white">{task.title}</span> ({task.moduleType})
                </p>
                <p className="text-slate-400 mt-1">
                  Operative: {task.assignee?.name || "Assigned Agent"} · Created {formatTimeAgo(task.createdAt)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleArbitrate(task.id, "REFUND")}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Refund Client in Full
                </button>
                <button
                  onClick={() => handleArbitrate(task.id, "RELEASE")}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  Release to Operative
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
