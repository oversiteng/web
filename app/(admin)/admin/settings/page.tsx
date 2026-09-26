"use client";

import { Settings, Save, Shield, Percent, DollarSign } from "lucide-react";
import { useState } from "react";

export default function AdminSettingsPage() {
  const [platformCommission, setPlatformCommission] = useState("15");
  const [emergencySurcharge, setEmergencySurcharge] = useState("25");
  const [autoReleaseHours, setAutoReleaseHours] = useState("48");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Platform parameters updated successfully!");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-red-500" />
          Platform Configuration & Commission Rules
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure platform fee margins, escrow auto-release timeouts, and emergency dispatch multipliers.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white">Monetization & Commission</h3>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Platform Take Rate (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="number"
                value={platformCommission}
                onChange={(e) => setPlatformCommission(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Deducted automatically from agent gross payout upon escrow release.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Emergency Surcharge Rate (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="number"
                value={emergencySurcharge}
                onChange={(e) => setEmergencySurcharge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Added to instant emergency law enforcement & trespass dispatches.</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white">Escrow & Automation</h3>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Escrow Auto-Release Window (Hours)
            </label>
            <input
              type="number"
              value={autoReleaseHours}
              onChange={(e) => setAutoReleaseHours(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-red-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">If client does not raise a dispute within this window after report submission, escrow auto-releases.</p>
          </div>
        </div>

        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Configuration</span>
        </button>
      </form>
    </div>
  );
}
