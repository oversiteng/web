"use client";

import Link from "next/link";
import { SearchCheck, Plus, Shield, Download, FileText, ArrowRight } from "lucide-react";

export default function DueDiligencePage() {
  const dossiers = [
    {
      id: "dd-1",
      targetName: "Prime Horizons Real Estate Dev Ltd",
      type: "Corporate Vendor Audit",
      cacNumber: "RC-1849204",
      riskRating: "LOW",
      completedDate: "Sept 19, 2026",
      summary: "Active CAC registration verified. Annual returns filed to 2025. Directors clear of EFCC watchlist.",
    },
    {
      id: "dd-2",
      targetName: "Alhaji Ibrahim Danjuma (Land Vendor)",
      type: "Individual Pre-Transaction Audit",
      cacNumber: "N/A (Individual)",
      riskRating: "HIGH",
      completedDate: "Sept 12, 2026",
      summary: "Conflicting family power of attorney detected on title deeds. High litigation vulnerability.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <SearchCheck className="w-6 h-6 text-purple-400" />
            Due Diligence (DueDil)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pre-transaction background checks, CAC corporate registry verification, physical address verification, and court litigation checks.
          </p>
        </div>
        <button
          onClick={() => alert("Open Due Diligence investigation request modal")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Background Investigation</span>
        </button>
      </div>

      <div className="space-y-4">
        {dossiers.map((dossier) => (
          <div
            key={dossier.id}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    dossier.riskRating === "LOW"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  RISK: {dossier.riskRating}
                </span>
                <span className="text-xs text-slate-400">{dossier.type}</span>
              </div>
              <h3 className="font-semibold text-white text-base">{dossier.targetName}</h3>
              <p className="text-xs text-slate-400">{dossier.summary}</p>
              <div className="text-[11px] text-slate-500 pt-1">
                Completed on {dossier.completedDate} • Reference: {dossier.cacNumber}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
              <Link
                href={`/diligence/${dossier.id}`}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Dossier</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
