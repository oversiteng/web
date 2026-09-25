"use client";

import { CreditCard, CheckCircle2, Clock, ShieldCheck, ArrowUpRight, Download } from "lucide-react";

export default function PaymentsPage() {
  const transactions = [
    {
      id: "txn-1",
      title: "Quick Errand Escrow Deposit",
      ref: "OVS-PAY-98218",
      gateway: "Paystack",
      amount: "₦15,000",
      status: "ESCROWED",
      date: "Sept 25, 2026, 09:15 AM",
    },
    {
      id: "txn-2",
      title: "Bi-Weekly Property Surveillance Retainer",
      ref: "OVS-PAY-97104",
      gateway: "Paystack",
      amount: "₦35,000",
      status: "RELEASED",
      date: "Sept 18, 2026, 02:30 PM",
    },
    {
      id: "txn-3",
      title: "ProWatch Construction Audit Milestone 2",
      ref: "OVS-PAY-96022",
      gateway: "Flutterwave",
      amount: "₦65,000",
      status: "RELEASED",
      date: "Sept 05, 2026, 11:20 AM",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            Payments & Escrow Protection
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            All ground operations and legal retainers are backed by our multi-signature escrow guarantee.
          </p>
        </div>
      </div>

      {/* Escrow Balance Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <span className="text-xs text-slate-400 font-medium">Currently Held in Active Escrow</span>
          <div className="text-3xl font-extrabold text-white mt-1">₦175,000.00</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Disbursed to agents only after you verify geo-tagged photographic reports</span>
          </div>
        </div>

        <button
          onClick={() => alert("Add funds modal")}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors self-start sm:self-auto"
        >
          Top Up Escrow Balance
        </button>
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Transaction History</h2>
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-white">{tx.title}</h4>
              <p className="text-xs text-slate-400">
                Ref: {tx.ref} • Gateway: {tx.gateway} • {tx.date}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
              <span className="text-sm font-bold text-white">{tx.amount}</span>
              <span
                className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                  tx.status === "RELEASED"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {tx.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
