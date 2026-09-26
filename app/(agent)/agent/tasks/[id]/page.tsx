import Link from "next/link";
import { ArrowLeft, MapPin, Camera, CheckCircle2, Navigation, Upload, Shield } from "lucide-react";

export default async function AgentTaskExecutionPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link
        href="/agent/tasks"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Active Tasks</span>
      </Link>

      <div className="border-b border-slate-800 pb-4">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Mission Console • #{id}
        </span>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
          Document Retrieval & Verification
        </h1>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          Lagos State High Court, TBS, Lagos Island
        </p>
      </div>

      {/* Live Status Control Panel */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white">Broadcast Status to Client</h3>
        <div className="grid grid-cols-3 gap-3">
          <button className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span>En Route</span>
          </button>
          <button className="py-2.5 px-3 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>On Site</span>
          </button>
          <button className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Completed</span>
          </button>
        </div>
      </div>

      {/* Evidence & Report Submission Form */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white">Submit Field Verification Report</h3>
        <p className="text-xs text-slate-400">
          Upload geotagged photos or scan documents. Coordinates and timestamp will be embedded with an SHA-256 watermark code.
        </p>

        <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-2xl p-6 text-center space-y-2 cursor-pointer transition-colors">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-amber-400">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-xs font-medium text-slate-200">
            Click to upload photos or drag and drop
          </div>
          <div className="text-[10px] text-slate-500">PNG, JPG, MP4 up to 50MB (EXIF GPS required)</div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Agent Executive Summary</label>
          <textarea
            rows={3}
            placeholder="Summarize actions taken, parties met, and conditions on the ground..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors">
          <Upload className="w-4 h-4" />
          <span>Generate Watermarked Report & Request Escrow Release</span>
        </button>
      </div>
    </div>
  );
}
