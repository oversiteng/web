"use client";

import Link from "next/link";
import { ClipboardList, MapPin, Navigation, Camera, ArrowRight } from "lucide-react";

export default function AgentTasksPage() {
  const activeTasks = [
    {
      id: "task-assigned-1",
      title: "Document Retrieval & Verification",
      client: "Chukwuma Obi",
      address: "Lagos State High Court, TBS, Lagos Island",
      status: "AGENT_ON_SITE",
      payout: "₦15,000",
      urgency: "Normal",
    },
    {
      id: "task-assigned-2",
      title: "Perimeter Drone Inspection",
      client: "Dr. Folake Adeleke",
      address: "Plot 14, Epe-Ijebu Ode Road, Lagos",
      status: "AGENT_EN_ROUTE",
      payout: "₦35,000",
      urgency: "High",
    },
  ];

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

      <div className="space-y-4">
        {activeTasks.map((task) => (
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
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}
                >
                  {task.status === "AGENT_ON_SITE" ? "ON SITE" : "EN ROUTE"}
                </span>
                <h3 className="font-semibold text-white text-base">{task.title}</h3>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {task.address}
              </p>
              <div className="text-[11px] text-slate-500">Client: {task.client}</div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="text-right">
                <span className="text-sm font-bold text-white">{task.payout}</span>
                <div className="text-[10px] text-emerald-400">Escrow Held</div>
              </div>
              <Link
                href={`/agent/tasks/${task.id}`}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Mission Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
