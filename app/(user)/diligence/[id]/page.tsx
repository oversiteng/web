import Link from "next/link";
import { ArrowLeft, SearchCheck, Download, ShieldAlert, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

export default async function DossierDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        href="/diligence"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Due Diligence</span>
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
            Confidential Investigation Dossier • #{id}
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
            Prime Horizons Real Estate Dev Ltd
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            CAC Registration: RC-1849204 • Physical Address Verified: Victoria Island, Lagos
          </p>
        </div>

        <button className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors">
          <Download className="w-4 h-4" />
          <span>Export Sealed PDF Dossier</span>
        </button>
      </div>

      {/* Risk Score Summary */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 font-medium">Assessed Vulnerability & Risk Tier</span>
          <div className="text-2xl font-bold text-emerald-400 mt-0.5">LOW RISK (Score: 12 / 100)</div>
          <p className="text-xs text-slate-400 mt-1">Recommended for transaction progression with standard contract safeguards.</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="w-8 h-8" />
        </div>
      </div>

      {/* Investigation Check Matrix */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">Audited Registry Points</h2>
        {[
          { label: "Corporate Affairs Commission (CAC)", status: "VERIFIED", details: "Active entity, annual filings current to 2025." },
          { label: "Physical Office Verification", status: "VERIFIED", details: "Agent visited Plot 14, Idejo St, Victoria Island. Active operations confirmed." },
          { label: "Federal Inland Revenue (FIRS) Tax Compliance", status: "VERIFIED", details: "Valid TIN and clearance certificate presented." },
          { label: "Court Records & Litigation Search", status: "CLEAR", details: "No active civil judgments or criminal proceedings in Lagos or Federal High Courts." },
          { label: "Director Identity Verification", status: "VERIFIED", details: "All 3 directors verified via National Identity Number (NIN) database." },
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4"
          >
            <div>
              <h4 className="text-sm font-medium text-white">{item.label}</h4>
              <p className="text-xs text-slate-400 mt-0.5">{item.details}</p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
