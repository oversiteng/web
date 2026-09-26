"use client";

import Link from "next/link";
import { HardHat, Plus, Calendar, CheckCircle2, ArrowRight } from "lucide-react";

export default function ProjectsWatchPage() {
  const projects = [
    {
      id: "prowatch-1",
      title: "4-Bedroom Terrace Duplex Construction",
      contractor: "Apex Build Engineering Ltd",
      location: "Guzape District, Abuja",
      completionPct: 65,
      currentMilestone: "Roofing & Internal Plastering",
      nextAuditDate: "Sept 28, 2026",
      status: "ON_TRACK",
    },
    {
      id: "prowatch-2",
      title: "Warehouse Facility Renovation",
      contractor: "SolidCraft Contractors",
      location: "Trans-Amadi Industrial Layout, Port Harcourt",
      completionPct: 30,
      currentMilestone: "Structural Steel Frame Installation",
      nextAuditDate: "Oct 02, 2026",
      status: "DELAYED",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <HardHat className="w-6 h-6 text-blue-400" />
            Project Watch (ProWatch)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Independent onsite supervision for construction & renovation projects. Milestone verification before fund disbursement.
          </p>
        </div>
        <button
          onClick={() => alert("Initiate ProWatch onboarding")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-semibold text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Project Audit</span>
        </button>
      </div>

      <div className="space-y-4">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row justify-between lg:items-center gap-6"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    proj.status === "ON_TRACK"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {proj.status === "ON_TRACK" ? "ON SCHEDULE" : "BEHIND SCHEDULE"}
                </span>
                <h3 className="font-semibold text-white text-base">{proj.title}</h3>
              </div>
              <p className="text-xs text-slate-400">
                Contractor: <span className="text-slate-200">{proj.contractor}</span> • Location: {proj.location}
              </p>
              <p className="text-xs text-blue-400">
                Active Phase: <span className="text-slate-300">{proj.currentMilestone}</span>
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-md pt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Overall Verified Completion</span>
                  <span className="font-semibold text-white">{proj.completionPct}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${proj.completionPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between lg:flex-col lg:items-end gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Next Site Audit: {proj.nextAuditDate}</span>
              </div>
              <Link
                href={`/projects/${proj.id}`}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <span>Milestone Gantt</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
