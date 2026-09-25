"use client";

import { Layers, MapPin, User, RefreshCw, AlertTriangle } from "lucide-react";

export default function AdminTasksCommandPage() {
  const tasks = [
    {
      id: "task-01",
      title: "Commercial Building Decking Audit",
      module: "PROJECT_WATCH",
      client: "Chukwuma Obi",
      agent: "Engr. Musa S.",
      status: "IN_PROGRESS",
      price: "₦65,000",
      location: "Guzape District, Abuja",
    },
    {
      id: "task-02",
      title: "Land Title Document Pick-up & Courier",
      module: "QUICK_ERRANDS",
      client: "Dr. Folake Adeleke",
      agent: "Unassigned",
      status: "PENDING",
      price: "₦18,000",
      location: "Alausa Secretariat, Ikeja",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-red-500" />
            Task Command & Dispatch Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Global monitoring of all field operations across all 6 service modules. Manual overrides & emergency reassignments.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {task.module}
                </span>
                <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.status === "PENDING"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}
                >
                  {task.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {task.location}
              </p>
              <div className="text-[11px] text-slate-400">
                Client: <span className="text-slate-200">{task.client}</span> • Assigned:{" "}
                <span className="text-slate-200">{task.agent}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <span className="text-sm font-bold text-white">{task.price}</span>
              <button
                onClick={() => alert(`Reassigning agent for ${task.id}`)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reassign Agent</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
