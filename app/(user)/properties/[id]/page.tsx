import Link from "next/link";
import { ArrowLeft, Building2, MapPin, ShieldCheck, Download, Calendar, Camera } from "lucide-react";

export default async function PropertyDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="space-y-6">
      <Link
        href="/properties"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Property Portfolio</span>
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Parcel ID: LK-2023-8819 • Asset #{id}
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
            Lekki Phase 1 Waterfront Plot
          </h1>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            Plot 8B, Admiralty Way, Lekki Phase 1, Lagos State
          </p>
        </div>

        <button className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors">
          <Camera className="w-4 h-4" />
          <span>Dispatch Field Inspector</span>
        </button>
      </div>

      {/* Geofence & Boundary Visualizer Map Placeholder */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="h-64 bg-slate-950/80 relative flex items-center justify-center p-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">Interactive Geo-Fence & Boundary Polygon</h3>
            <p className="text-xs text-slate-400 max-w-md">
              Registered coordinates: Lat 6.4474° N, Lng 3.4723° E. 24/7 satellite telemetry and adjoining development alert active.
            </p>
          </div>
        </div>
      </div>

      {/* Inspection History & Reports */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-white">Verified Inspection Reports</h2>
        <div className="space-y-3">
          {[
            {
              id: "rpt-1",
              date: "September 22, 2026",
              inspector: "Engr. Babajide S. (Technical Supervisor)",
              watermark: "OVS-RPT-7718A",
              summary: "No unauthorized construction or encroachment found. Perimeter boundary pillars intact.",
            },
            {
              id: "rpt-2",
              date: "September 08, 2026",
              inspector: "Tunde B. (General Field Agent)",
              watermark: "OVS-RPT-6520B",
              summary: "High-resolution drone flyover completed. Neighboring site foundation excavation observed 15m away.",
            },
          ].map((rpt) => (
            <div
              key={rpt.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {rpt.date}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                    {rpt.watermark}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{rpt.summary}</p>
                <p className="text-[11px] text-slate-500">Verified by: {rpt.inspector}</p>
              </div>

              <button className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto">
                <Download className="w-3.5 h-3.5" />
                <span>Watermarked Audit PDF</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
