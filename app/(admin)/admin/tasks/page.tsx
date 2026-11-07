"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Layers, MapPin, User, RefreshCw, AlertTriangle, ArrowRight } from "lucide-react";
import { Task } from "@/lib/types/task";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function AdminTasksCommandPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("ALL");

  useEffect(() => {
    async function loadAllTasks() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const url = moduleFilter !== "ALL" ? `/api/v1/tasks?module=${moduleFilter}&limit=50` : `/api/v1/tasks?limit=50`;
        const res = await fetch(url, { credentials: "include", headers });
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
  }, [moduleFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-red-500" />
            Task Command & Dispatch Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global monitoring of all field operations across all 7 service modules. Manual overrides & assignments.
          </p>
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          aria-label="Filter tasks by service module"
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
        >
          <option value="ALL">All Modules</option>
          <option value="QUICK_ERRANDS">Quick Errands</option>
          <option value="PROPERTY_OVERSITE">Property Oversite</option>
          <option value="PROJECT_WATCH">Project Watch</option>
          <option value="DUE_DILIGENCE">Due Diligence</option>
          <option value="LEGAL_ADVISORY">Legal Advisory</option>
          <option value="LAW_ENFORCEMENT">Law Enforcement</option>
          <option value="VULNERABILITY_TEST">Vulnerability Test</option>
        </select>
      </div>

      {isLoading ? (
        <DynamicLoadingState variant="documents" count={4} />
      ) : tasks.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
          No tasks found for the selected module.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {task.moduleType}
                  </span>
                  <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : task.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {task.property?.address || "Address pending on-site coordinates"}
                </p>
                <div className="text-[11px] text-slate-500">
                  Agent: <span className="text-slate-300 font-medium">{task.assignee?.name || "Unassigned"}</span> · Created {formatTimeAgo(task.createdAt)}
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-sm font-bold text-white">
                    {task.priceNgn ? formatCurrency(task.priceNgn) : "Pending Quote"}
                  </div>
                  <div className="text-[10px] text-slate-400">Total Value</div>
                </div>

                <Link
                  href={`/dashboard/tasks/${task.id}`}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Inspect</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
