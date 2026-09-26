"use client";

import Link from "next/link";
import { Building2, Plus, MapPin, Eye, ShieldCheck, ArrowRight } from "lucide-react";

export default function PropertiesPortfolioPage() {
  const properties = [
    {
      id: "prop-1",
      title: "Lekki Phase 1 Waterfront Plot",
      type: "Residential Land",
      address: "Plot 8B, Admiralty Way, Lekki Phase 1, Lagos",
      parcelNumber: "LK-2023-8819",
      lastInspection: "3 days ago",
      status: "SECURE",
      totalInspections: 12,
    },
    {
      id: "prop-2",
      title: "Guzape Hilltop Development",
      type: "Commercial Plot",
      address: "Plot 104, Cadastral Zone A06, Guzape, Abuja",
      parcelNumber: "FCT-GZP-9901",
      lastInspection: "1 week ago",
      status: "SECURE",
      totalInspections: 8,
    },
    {
      id: "prop-3",
      title: "Epe Agro-Allied Acreage",
      type: "Agricultural Farmland",
      address: "Kilometer 14, Epe-Ijebu Ode Expressway, Lagos",
      parcelNumber: "EPE-AG-0041",
      lastInspection: "2 weeks ago",
      status: "ADJOINING_ACTIVITY",
      totalInspections: 6,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-400" />
            Property Oversite (Proversite)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time visual surveillance, boundary monitoring, and encroachment defense for diaspora property owners.
          </p>
        </div>
        <button
          onClick={() => alert("Add property registration modal")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Property</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {properties.map((prop) => (
          <div
            key={prop.id}
            className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all"
          >
            <div className="h-36 bg-slate-800/80 relative flex items-center justify-center border-b border-slate-800">
              {/* Simulated Map / Satellite preview */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
              <MapPin className="w-8 h-8 text-emerald-400 relative z-10 animate-bounce" />
              <span
                className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  prop.status === "SECURE"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {prop.status === "SECURE" ? "STATUS: SECURE" : "ADJOINING ACTIVITY"}
              </span>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {prop.type} • {prop.parcelNumber}
                </span>
                <h3 className="font-semibold text-white text-base mt-0.5">{prop.title}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span className="truncate">{prop.address}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Inspections: {prop.totalInspections}</span>
                <span>Last: {prop.lastInspection}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => alert(`Triggering drone/field dispatch for ${prop.title}`)}
                className="flex-1 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Order Inspection</span>
              </button>
              <Link
                href={`/properties/${prop.id}`}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
