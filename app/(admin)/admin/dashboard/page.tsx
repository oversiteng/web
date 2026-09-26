"use client";

import {
  TrendingUp,
  Users,
  Layers,
  CreditCard,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function AdminAnalyticsDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Control & Operations Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">
          High-level overview of active field assignments, escrow liquidity, agent availability, and KYC pipelines.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Platform GMV (MTD)</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">₦48,500,000</div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +18.4% vs last month
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Ground Tasks</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">142</div>
          <p className="text-[11px] text-blue-400 mt-1">Across 8 Nigerian states</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Verified Field Agents</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">318</div>
          <p className="text-[11px] text-slate-400 mt-1">74 currently online</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending QA Audits</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">11</div>
          <p className="text-[11px] text-red-400 mt-1">Requires admin review</p>
        </div>
      </div>

      {/* System Dispatch Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Live Dispatch Stream
          </h2>
          <div className="space-y-3">
            {[
              { time: "2m ago", desc: "Agent matched for Property Oversite in Sangotedo", status: "DISPATCHED" },
              { time: "8m ago", desc: "Escrow payment of ₦35,000 confirmed via Paystack", status: "FUNDED" },
              { time: "14m ago", desc: "Watermarked Report submitted for Errand #8819", status: "QA_PENDING" },
              { time: "22m ago", desc: "New Lawyer application from Barr. Nwosu (NBA/ABJ/2017)", status: "KYC_SUBMITTED" },
            ].map((ev, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 font-mono text-[11px]">{ev.time}</span>
                  <span className="text-slate-200">{ev.desc}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  {ev.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h2 className="text-base font-semibold text-white">Module Utilization</h2>
          <div className="space-y-3 text-xs">
            {[
              { name: "Property Oversite", pct: 38 },
              { name: "Quick Errands", pct: 26 },
              { name: "Project Watch", pct: 18 },
              { name: "Due Diligence", pct: 10 },
              { name: "Legal Advisory", pct: 5 },
              { name: "Law Enforcement", pct: 3 },
            ].map((m, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>{m.name}</span>
                  <span className="font-semibold text-white">{m.pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
