"use client";

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

export default function AgentDashboardPage() {
  const incomingTasks = [
    {
      id: "task-incoming-1",
      title: "Physical Boundary Verification & Survey Beacon Check",
      module: "Property Oversite",
      location: "Sangotedo, Ajah, Lagos (4.2 km away)",
      price: "₦22,000",
      urgency: "HIGH",
      expiresIn: "14 mins",
    },
    {
      id: "task-incoming-2",
      title: "Court Filing & Certified Document Pickup",
      module: "Quick Errands",
      location: "Ikeja High Court Complex (8.1 km away)",
      price: "₦16,500",
      urgency: "NORMAL",
      expiresIn: "45 mins",
    },
  ];

  return (
    <div className="space-y-8">
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
            <span className="text-xs font-medium">Pending Payout</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">₦85,000</div>
          <p className="text-[11px] text-amber-400 mt-1">Ready for bank withdrawal</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Tasks</span>
            <ClipboardList className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">2</div>
          <p className="text-[11px] text-slate-400 mt-1">1 en route, 1 on site</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completed Missions</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">34</div>
          <p className="text-[11px] text-emerald-400 mt-1">98.5% acceptance score</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Agent Rating</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">4.92 / 5.0</div>
          <p className="text-[11px] text-purple-400 mt-1">Top 5% in Lagos Region</p>
        </div>
      </div>

      {/* Real-Time Dispatch Opportunities */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <h2 className="text-base font-semibold text-white">New Dispatch Matches Near You</h2>
          </div>
          <span className="text-xs text-slate-400">Within 15km radius</span>
        </div>

        <div className="space-y-3">
          {incomingTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold">
                    {task.module}
                  </span>
                  <h4 className="text-sm font-semibold text-white">{task.title}</h4>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  {task.location}
                </p>
                <div className="text-[11px] text-amber-400/80 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Auto-expires in {task.expiresIn}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-400">{task.price}</span>
                  <div className="text-[10px] text-slate-400">Net payout</div>
                </div>
                <button
                  onClick={() => alert(`Accepted assignment ${task.title}`)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Accept Mission
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
