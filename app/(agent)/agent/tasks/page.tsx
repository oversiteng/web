"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ClipboardList, MapPin, ArrowRight } from "lucide-react";
import { Task } from "@/lib/types/task";
import { formatCurrency } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function AgentTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAgentTasks() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/tasks?limit=50", { credentials: "include", headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTasks(json.data);
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error("Failed to load agent tasks:", err);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadAgentTasks();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-amber-400" />
            Active Missions & Tasks
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tasks currently assigned to you. Update your live coordinates and submit evidence reports.
          </p>
        </div>
      </div>

      {isLoading ? (
        <DynamicLoadingState variant="documents" count={3} />
      ) : tasks.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
          No missions currently assigned to your account. Check the Mission Terminal for new dispatch opportunities.
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.status === "AGENT_ON_SITE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : task.status === "AGENT_EN_ROUTE"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {task.status.replace(/_/g, " ")}
                  </span>
                  <h3 className="font-semibold text-white text-base">{task.title}</h3>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {task.property?.address || "On-site Assignment"}
                </p>
                <div className="text-[11px] text-slate-500">
                  Module: {task.moduleType?.replace(/_/g, " ")}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right">
                  <span className="text-sm font-bold text-white">
                    {task.priceNgn ? formatCurrency(task.priceNgn) : "Pending Quote"}
                  </span>
                  <div className="text-[10px] text-emerald-400">Secured Payment</div>
                </div>
                <Link
                  href={`/agent/tasks/${task.id}`}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Mission Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
