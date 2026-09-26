"use client";

import { ShieldAlert, AlertTriangle, PhoneCall, ShieldCheck, MapPin } from "lucide-react";

export default function LawEnforcementPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
          Law Enforcement Liaison & Intervention
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Coordinated physical escalation with authorized security agencies (Nigeria Police Force, Civil Defence, EFCC) for severe property land-grabbing, criminal trespass, and asset protection.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-white">Emergency Onsite Escalation</h3>
            <p className="text-xs text-rose-200/80 mt-1 max-w-xl leading-relaxed">
              If illegal construction or violent trespass (Omo-Onile land-grabbing) is actively happening on your registered property right now, dispatch an accredited Enforcement Liaison Officer.
            </p>
          </div>
        </div>
        <button
          onClick={() => alert("Dispatching emergency liaison protocol...")}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shrink-0 transition-colors shadow-lg shadow-rose-600/20"
        >
          Dispatch Liaison Now
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <h4 className="text-sm font-semibold text-white">1. Verified Field Incident</h4>
          <p className="text-xs text-slate-400">
            A certified drone/ground agent records geo-stamped photographic evidence of illegal boundary encroachment.
          </p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <h4 className="text-sm font-semibold text-white">2. Liaison Petition</h4>
          <p className="text-xs text-slate-400">
            Retained legal counsel prepares an expedited petition to the Area Command or State Special Taskforce.
          </p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <h4 className="text-sm font-semibold text-white">3. Physical Securitization</h4>
          <p className="text-xs text-slate-400">
            Authorized security personnel accompany field supervisors to enforce stop-work orders and secure perimeter.
          </p>
        </div>
      </div>
    </div>
  );
}
