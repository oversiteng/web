"use client";

import Link from "next/link";
import { Zap, Plus, MapPin, Clock, ArrowRight } from "lucide-react";

export default function ErrandsListPage() {
  const errands = [
    {
      id: "errand-1",
      title: "Document Retrieval & Verification",
      address: "Lagos State High Court, TBS, Lagos Island",
      status: "IN_PROGRESS",
      agent: "Babajide S.",
      price: "₦15,000",
      createdAt: "Today at 09:30 AM",
    },
    {
      id: "errand-2",
      title: "Utility Meter Physical Reading Check",
      address: "Block 4, Lekki Garden Estate Phase 2",
      status: "COMPLETED",
      agent: "Ngozi K.",
      price: "₦12,500",
      createdAt: "Yesterday",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Quick Errands
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Ad-hoc physical tasks, document retrievals, queuing, and field errands executed by local agents.
          </p>
        </div>
        <Link
          href="/errands/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Request Quick Errand</span>
        </Link>
      </div>

      <div className="space-y-3">
        {errands.map((errand) => (
          <div
            key={errand.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{errand.title}</h3>
                <span
                  className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                    errand.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {errand.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {errand.address}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {errand.createdAt}
                </span>
                <span>•</span>
                <span>Agent: {errand.agent}</span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
              <div className="text-right">
                <div className="text-sm font-bold text-white">{errand.price}</div>
                <div className="text-[10px] text-emerald-400">Escrow Held</div>
              </div>
              <Link
                href={`/chat`}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1 transition-colors"
              >
                <span>Live Feed</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
