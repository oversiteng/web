"use client";

import Link from "next/link";
import {
  Zap,
  Building2,
  HardHat,
  SearchCheck,
  Scale,
  ShieldAlert,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  MapPin,
  TrendingUp,
} from "lucide-react";

const MODULES = [
  {
    title: "Quick Errands",
    desc: "Remote ad-hoc task execution on demand",
    href: "/errands/new",
    icon: Zap,
    color: "from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/30",
  },
  {
    title: "Property Oversite",
    desc: "Remote surveillance & geo-tagged inspection",
    href: "/properties",
    icon: Building2,
    color: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30",
  },
  {
    title: "Project Watch",
    desc: "Onsite supervision & milestone tracking",
    href: "/projects",
    icon: HardHat,
    color: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30",
  },
  {
    title: "Due Diligence",
    desc: "CAC, title, and pre-transaction audits",
    href: "/diligence",
    icon: SearchCheck,
    color: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30",
  },
  {
    title: "Legal Advisory",
    desc: "Retain verified NBA legal counsel",
    href: "/legal",
    icon: Scale,
    color: "from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/30",
  },
  {
    title: "Law Enforcement",
    desc: "Secure liaison & emergency field escalation",
    href: "/enforcement",
    icon: ShieldAlert,
    color: "from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/30",
  },
];

export default function UserDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time status of your field agents, registered properties, and ongoing audits.
          </p>
        </div>
        <Link
          href="/errands/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/10"
        >
          <Zap className="w-4 h-4" />
          <span>New Field Request</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Ground Tasks</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">4</div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> 2 agents en route now
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monitored Assets</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">7</div>
          <p className="text-[11px] text-slate-400 mt-1">Lagos, Abuja & Port Harcourt</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Escrow Protected</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">₦175,000</div>
          <p className="text-[11px] text-slate-400 mt-1">Auto-release upon QA audit approval</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Completed Audits</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">19</div>
          <p className="text-[11px] text-purple-400 mt-1">100% verified with geo-tags</p>
        </div>
      </div>

      {/* Service Dispatch Modules Grid */}
      <div>
        <h2 className="text-base font-semibold text-slate-200 mb-4">Deploy Service Modules</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.title}
                href={mod.href}
                className="group p-5 rounded-2xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br border flex items-center justify-center mb-4 ${mod.color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                    {mod.title}
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{mod.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Field Assignments */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-semibold text-slate-200">Recent Field Activities</h2>
          <Link href="/errands" className="text-xs text-emerald-400 hover:underline">
            View all
          </Link>
        </div>

        <div className="space-y-3">
          {[
            {
              title: "Land Title Document Pick-up & Courier",
              module: "Quick Errands",
              location: "Alausa Secretariat, Ikeja",
              agent: "Emeka O.",
              status: "IN_PROGRESS",
              statusText: "In Progress",
              price: "₦18,000",
            },
            {
              title: "Bi-Weekly Perimeter & Drone Surveillance",
              module: "Property Oversite",
              location: "Plot 14, Epe Expressway, Lagos",
              agent: "Tunde B.",
              status: "REPORT_SUBMITTED",
              statusText: "Report Ready",
              price: "₦35,000",
            },
            {
              title: "Commercial Building Decking Audit",
              module: "Project Watch",
              location: "Guzape District, Abuja",
              agent: "Engr. Musa S.",
              status: "COMPLETED",
              statusText: "Completed",
              price: "₦65,000",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                    {item.module}
                  </span>
                  <h4 className="text-sm font-medium text-white">{item.title}</h4>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {item.location}
                  </span>
                  <span>•</span>
                  <span>Agent: {item.agent}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <span className="text-sm font-semibold text-white">{item.price}</span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    item.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : item.status === "REPORT_SUBMITTED"
                      ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {item.statusText}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
