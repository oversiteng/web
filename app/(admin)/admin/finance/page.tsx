"use client";

import { CreditCard, AlertCircle, ArrowUpRight, Check, X, ShieldAlert } from "lucide-react";

export default function AdminFinanceDisputesPage() {
  const disputes = [
    {
      id: "disp-101",
      taskId: "task-99",
      client: "Chief Femi Alabi",
      agent: "Tunde B.",
      amount: "₦35,000",
      reason: "Client states agent photographed wrong plot boundary.",
      status: "OPEN",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-red-500" />
            Financial Management & Dispute Arbitration
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Arbitrate contested field reports, override escrow release, and process full or partial client refunds.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Active Escrow Disputes</h2>
        {disputes.map((d) => (
          <div
            key={d.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400">DISPUTE #{d.id}</span>
              <span className="text-sm font-bold text-white">{d.amount} (Held in Escrow)</span>
            </div>

            <div className="text-xs text-slate-300">
              <p>
                Client: <span className="font-semibold text-white">{d.client}</span> vs Agent:{" "}
                <span className="font-semibold text-white">{d.agent}</span>
              </p>
              <p className="text-slate-400 mt-1">Dispute Basis: {d.reason}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => alert(`Refunding ${d.amount} back to client ${d.client}`)}
                className="px-3.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold"
              >
                Refund Client in Full
              </button>
              <button
                onClick={() => alert(`Releasing ${d.amount} to agent ${d.agent}`)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
              >
                Release Escrow to Agent
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
