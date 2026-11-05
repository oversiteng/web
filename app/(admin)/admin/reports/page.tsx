"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileCheck2, Check, X, Eye, ShieldCheck } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

interface AdminPendingReport {
  id: string;
  taskId: string;
  agentId: string;
  agentName: string | null;
  agentEmail: string;
  taskTitle: string;
  moduleType: string;
  summary: string | null;
  findings: string | null;
  severity: string | null;
  completionPct: number;
  watermarkCode: string | null;
  status: string;
  createdAt: string;
}

export default function AdminQaReportsPage() {
  const [reports, setReports] = useState<AdminPendingReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadPendingReports() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/admin/reports/pending", { credentials: "include", headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setReports(json.data);
        } else {
          setReports([]);
        }
      } catch (err) {
        console.error("Failed to load reports:", err);
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPendingReports();
  }, []);

  const handleApprove = async (report: AdminPendingReport) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${report.taskId}/reports/${report.id}/approve`, {
        method: "POST",
        credentials: "include",
        headers,
      });

      const json = await res.json();
      if (json.success) {
        setReports((prev) => prev.filter((r) => r.id !== report.id));
        showToast(`Report approved & certified for ${report.taskTitle}`);
      } else {
        showToast(json.error?.message || "Failed to approve report");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to approve report");
    }
  };

  const handleReject = async (report: AdminPendingReport) => {
    const reason = prompt("Enter revision / rejection reason for the operative:") || "Additional evidence required.";
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${report.taskId}/reports/${report.id}/reject`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ reason }),
      });

      const json = await res.json();
      if (json.success) {
        setReports((prev) => prev.filter((r) => r.id !== report.id));
        showToast(`Report returned for revision to ${report.agentName || "operative"}`);
      } else {
        showToast(json.error?.message || "Failed to reject report");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to reject report");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-red-500" />
            QA Report Audit & Watermark Validation
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit operative submissions, inspect cryptographic watermark codes, and approve reports to trigger secured payment release.
          </p>
        </div>
      </div>

      {isLoading ? (
        <DynamicLoadingState variant="documents" count={3} />
      ) : reports.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
          No pending reports in QA queue. All operative field audits have been processed.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rpt) => (
            <div
              key={rpt.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">{rpt.taskTitle}</span>
                  {rpt.watermarkCode && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                      {rpt.watermarkCode}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">
                    {rpt.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Operative: <span className="font-semibold text-white">{rpt.agentName || rpt.agentEmail}</span> · Submitted {formatTimeAgo(rpt.createdAt)}
                </p>

                {rpt.summary && (
                  <p className="text-xs text-slate-400 max-w-xl truncate">
                    Summary: {rpt.summary}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                <Link
                  href={`/dashboard/tasks/${rpt.taskId}/report`}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </Link>

                <button
                  onClick={() => handleReject(rpt)}
                  className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  onClick={() => handleApprove(rpt)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Release</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
