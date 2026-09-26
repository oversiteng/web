"use client";

import { FolderLock, Upload, FileText, Download, ShieldCheck, Lock } from "lucide-react";

export default function DocumentVaultPage() {
  const documents = [
    {
      name: "Certificate of Occupancy (C of O) - Lekki Plot 8B.pdf",
      size: "4.2 MB",
      uploadedAt: "August 10, 2026",
      classification: "LAND TITLE",
      encrypted: true,
    },
    {
      name: "Survey Plan & Beacon Coordinate Chart.pdf",
      size: "2.8 MB",
      uploadedAt: "August 10, 2026",
      classification: "SURVEY",
      encrypted: true,
    },
    {
      name: "Contractor Agreement & Architectural Blueprints.pdf",
      size: "18.4 MB",
      uploadedAt: "August 25, 2026",
      classification: "BUILDING PERMIT",
      encrypted: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderLock className="w-6 h-6 text-emerald-400" />
            Encrypted Document Vault
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            AES-256 encrypted cloud repository for land titles, C of O documents, registered survey plans, and architectural blueprints.
          </p>
        </div>
        <button
          onClick={() => alert("Upload document modal")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="space-y-3">
        {documents.map((doc, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-700 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                <FileText className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-white text-sm">{doc.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    {doc.classification}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>Uploaded {doc.uploadedAt}</span>
                  <span>•</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Encrypted
                  </span>
                </div>
              </div>
            </div>

            <button className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto">
              <Download className="w-3.5 h-3.5" />
              <span>Download Securely</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
