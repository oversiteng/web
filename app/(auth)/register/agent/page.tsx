"use client";

import Link from "next/link";
import { useState } from "react";
import { Shield, Mail, Lock, User, Phone, Briefcase, ArrowRight } from "lucide-react";

export default function AgentRegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    tier: "GENERAL",
    nbaNumber: "",
    ninId: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Connect with /api/v1/auth/register with role='AGENT'
    setTimeout(() => {
      window.location.href = "/agent/dashboard";
    }, 600);
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-2">
          <Shield className="w-3.5 h-3.5" />
          Field Agent & Legal Counsel Onboarding
        </div>
        <h2 className="text-xl font-semibold text-white tracking-tight">Become an Oversite Agent</h2>
        <p className="text-xs text-slate-400 mt-1">Get assigned verified onsite tasks and earn in NGN</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Full legal name"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="agent@domain.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Specialization / Tier</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
            >
              <option value="GENERAL">General Ground Agent (Errands & Visuals)</option>
              <option value="TECHNICAL_SUPERVISOR">Technical Supervisor (Civil/Building)</option>
              <option value="INVESTIGATOR">Investigator (Due Diligence)</option>
              <option value="LEGAL_COUNSEL">Verified NBA Legal Counsel</option>
              <option value="ENFORCEMENT_LIAISON">Enforcement Liaison</option>
            </select>
          </div>
        </div>

        {formData.tier === "LEGAL_COUNSEL" && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Supreme Court Enrolment / NBA Number</label>
            <input
              type="text"
              required
              value={formData.nbaNumber}
              onChange={(e) => setFormData({ ...formData, nbaNumber: e.target.value })}
              placeholder="e.g. SCN012345"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+234..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">NIN Number</label>
            <input
              type="text"
              required
              value={formData.ninId}
              onChange={(e) => setFormData({ ...formData, ninId: e.target.value })}
              placeholder="11 digits"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
        >
          {loading ? "Submitting Application..." : "Submit Agent Application"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-5 pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
        Already an agent?{" "}
        <Link href="/login" className="text-amber-400 font-medium hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}
