"use client";

import { useState } from "react";
import { Wallet, ArrowDownRight, Building2, CheckCircle2, Clock, ShieldCheck } from "lucide-react";

export default function AgentWalletPage() {
  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("058"); // GTBank
  const [accountNumber, setAccountNumber] = useState("0123456789");
  const [withdrawing, setWithdrawing] = useState(false);

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    // TODO: Call /api/v1/wallets/withdraw
    setTimeout(() => {
      alert("Withdrawal initiated successfully! Bank transfer in progress.");
      setWithdrawing(false);
      setAmount("");
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Wallet className="w-6 h-6 text-amber-400" />
          Agent Earnings & Payout Wallet
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Escrow payouts are credited instantly upon client report approval. Withdraw to any verified Nigerian bank account.
        </p>
      </div>

      {/* Balance Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <span className="text-xs text-slate-400 font-medium">Available for Withdrawal</span>
          <div className="text-3xl font-extrabold text-amber-400">₦85,000.00</div>
          <p className="text-xs text-slate-400">Total Lifetime Earnings: ₦420,000.00</p>
        </div>

        {/* Withdrawal Form */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            Instant Bank Payout
          </h3>
          <form onSubmit={handleWithdraw} className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Amount to Withdraw (NGN)</label>
              <input
                type="number"
                required
                max="85000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Destination Bank</label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="058">Guaranty Trust Bank (GTB) - 0123456789</option>
                <option value="033">United Bank for Africa (UBA)</option>
                <option value="011">First Bank of Nigeria</option>
                <option value="057">Zenith Bank</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={withdrawing || !amount}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50 mt-1"
            >
              {withdrawing ? "Processing Payout..." : "Withdraw to Bank"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
