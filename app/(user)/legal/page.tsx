"use client";

import { Scale, ShieldCheck, Calendar, Clock, UserCheck } from "lucide-react";

export default function LegalAdvisoryPage() {
  const lawyers = [
    {
      id: "lawyer-1",
      name: "Barrister Adebayo Adeleke",
      nbaNumber: "NBA/LAG/2014/0982",
      experience: "12 Years Standing",
      specialization: "Land Title Advisory & Governor's Consent",
      hourlyRate: "₦45,000 / hr",
      rating: 4.95,
      available: true,
    },
    {
      id: "lawyer-2",
      name: "Chidinma Nwosu, Esq.",
      nbaNumber: "NBA/ABJ/2017/1402",
      experience: "9 Years Standing",
      specialization: "Real Estate Litigation & Construction Contracts",
      hourlyRate: "₦40,000 / hr",
      rating: 4.88,
      available: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-cyan-400" />
            Legal Advisory Network
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Retain verified Nigerian Bar Association (NBA) accredited legal counsel on-demand for property title advisory, contract drafting, and dispute management.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {lawyers.map((lawyer) => (
          <div
            key={lawyer.id}
            className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white text-base">{lawyer.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-cyan-400 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified NBA: {lawyer.nbaNumber}</span>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                  {lawyer.experience}
                </span>
              </div>

              <div className="text-xs text-slate-400">
                <span className="text-slate-300 font-medium">Practice Area: </span>
                {lawyer.specialization}
              </div>

              <div className="text-xs text-slate-500">
                ⭐ {lawyer.rating} / 5.0 rating on Oversite
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Retainer Rate</span>
                <span className="text-sm font-bold text-white">{lawyer.hourlyRate}</span>
              </div>
              <button
                onClick={() => alert(`Booking consultation with ${lawyer.name}`)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book Consultation</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
