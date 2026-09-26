import Link from "next/link";
import { ArrowLeft, HardHat, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";

export default async function ProjectMilestonesPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const milestones = [
    {
      title: "Milestone 1: Substructure & Foundation",
      target: "Completed Aug 15, 2026",
      status: "COMPLETED",
      pct: 100,
      notes: "Soil test verified, raft foundation concrete cube test passed 28-day strength.",
    },
    {
      title: "Milestone 2: Ground Floor Columns & Decking",
      target: "Completed Sept 05, 2026",
      status: "COMPLETED",
      pct: 100,
      notes: "Reinforcement bar spacing and grade 25 concrete pour audited onsite.",
    },
    {
      title: "Milestone 3: First Floor Blockwork & Lintel Casting",
      target: "Due Sept 28, 2026",
      status: "IN_PROGRESS",
      pct: 65,
      notes: "Onsite technical supervisor verifying sandcrete block batch quality.",
    },
    {
      title: "Milestone 4: Timber Roof Trusses & Aluminum Cladding",
      target: "Due Oct 20, 2026",
      status: "PENDING",
      pct: 0,
      notes: "Contractor material supply quotation under escrow review.",
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Projects</span>
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
            ProWatch Milestone Tracker • #{id}
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
            4-Bedroom Terrace Duplex Construction
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervised by Engr. Musa S. (Technical Supervisor COREN #4192)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-3.5 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-semibold text-xs transition-colors">
            Request Ad-Hoc Site Audit
          </button>
        </div>
      </div>

      {/* Milestone Progress Gantt / Stepper */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Milestone Breakdown & Escrow Stages</h2>

        <div className="space-y-4">
          {milestones.map((m, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {m.status === "COMPLETED" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : m.status === "IN_PROGRESS" ? (
                    <Clock className="w-4 h-4 text-blue-400 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-slate-600" />
                  )}
                  <h3 className="font-semibold text-sm text-white">{m.title}</h3>
                </div>
                <p className="text-xs text-slate-400">{m.notes}</p>
                <div className="text-[11px] text-slate-500">{m.target}</div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                <span className="text-xs font-bold text-white">{m.pct}% verified</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    m.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : m.status === "IN_PROGRESS"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
