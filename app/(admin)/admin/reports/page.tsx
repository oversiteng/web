"use client";

import { FileCheck2, Check, X, Eye, Download, ShieldCheck } from "lucide-react";

export default function AdminQaReportsPage() {
  const reports = [
    {
      id: "rpt-991",
      taskId: "task-01",
      taskTitle: "Decking Concrete Pour Inspection",
      agent: "Engr. Musa S.",
      watermark: "OVS-RPT-889X1",
      submittedAt: "10 mins ago",
      gpsCoords: "9.0579° N, 7.4951° E",
      status: "UNDER_REVIEW",
    },
    {
      id: "rpt-990",
      taskId: "task-03",
      taskTitle: "Perimeter Encroachment Drone Survey",
      agent: "Babajide S.",
      watermark: "OVS-RPT-7718A",
      submittedAt: "2 hours ago",
      gpsCoords: "6.4474° N, 3.4723° E",
      status: "APPROVED",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-red-500" />
            QA Report Audit & Watermark Validation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit agent submissions, inspect EXIF metadata and GPS coordinates, and approve reports to trigger escrow payout.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {reports.map((rpt) => (
          <div
            key={rpt.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">{rpt.taskTitle}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                  {rpt.watermark}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    rpt.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {rpt.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Agent: <span className="text-slate-200">{rpt.agent}</span> • GPS:{" "}
                <span className="text-slate-200 font-mono">{rpt.gpsCoords}</span>
              </p>
              <div className="text-[11px] text-slate-500">Submitted {rpt.submittedAt}</div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => alert(`Reviewing report media ${rpt.id}`)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Audit Media</span>
              </button>

              {rpt.status === "UNDER_REVIEW" && (
                <button
                  onClick={() => alert(`Approved QA report ${rpt.id}. Escrow released to agent!`)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Release Escrow</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
