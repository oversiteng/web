"use client";

import Link from "next/link";
import { useState } from "react";
import { Zap, ArrowLeft, MapPin, Calendar, CreditCard, ShieldCheck } from "lucide-react";

export default function NewErrandPage() {
  const [formData, setFormData] = useState({
    title: "",
    category: "PICKUP_DELIVERY",
    locationAddress: "",
    instructions: "",
    scheduledDate: "",
    budgetNgn: "15000",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // TODO: POST to /api/v1/tasks with moduleType='QUICK_ERRANDS'
    setTimeout(() => {
      window.location.href = "/errands";
    }, 600);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/errands"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Quick Errands</span>
      </Link>

      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          Request an On-Demand Errand
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          A nearby verified ground agent will accept your request, provide live status updates, and execute the task.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Task Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Document pick-up from Ministry of Lands"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Errand Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="PICKUP_DELIVERY">Document Pickup & Dispatch</option>
              <option value="PHYSICAL_VERIFICATION">Physical Address Verification</option>
              <option value="QUEUING">Office Queuing & Filing</option>
              <option value="UTILITY_PAYMENT">Physical Utility Payment</option>
              <option value="CUSTOM">Custom Ground Mission</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Execution Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Physical Location / Address</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={formData.locationAddress}
              onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
              placeholder="e.g. Block 10, Secretariat Complex, Alausa, Ikeja"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Detailed Instructions for Agent</label>
          <textarea
            rows={4}
            required
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            placeholder="Specify who to meet, reference numbers, what to collect or photograph, and any special delivery terms."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-amber-300">Escrow Guarantee: </span>
            Your payment is held in escrow and will only be disbursed to the agent after you review and approve the geo-tagged report.
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
        >
          <CreditCard className="w-4 h-4" />
          <span>{submitting ? "Deploying..." : "Fund Escrow & Dispatch Agent (₦15,000)"}</span>
        </button>
      </form>
    </div>
  );
}
