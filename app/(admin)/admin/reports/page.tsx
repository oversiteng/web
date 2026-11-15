"use client";

import { useState, useEffect } from "react";
import {
  FileCheck2,
  Check,
  X,
  Eye,
  ShieldCheck,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

interface AdminReportItem {
  id: string;
  taskId: string;
  agentId: string;
  operativeCode: string;
  agentName: string | null;
  agentEmail: string;
  taskTitle: string;
  moduleType: string;
  clientPriceNgn: number;
  agentPayoutNgn: number;
  platformMarginNgn: number;
  summary: string | null;
  findings: string | null;
  checklist?: any;
  measurements?: any;
  incidentalExpenses?: any;
  severity: string | null;
  completionPct: number;
  watermarkCode: string | null;
  officialNotes?: string | null;
  userRejectionReason?: string | null;
  status: string;
  media?: any[];
  createdAt: string;
}

export default function AdminQaReportsPage() {
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inspector Drawer State
  const [inspectingReport, setInspectingReport] = useState<AdminReportItem | null>(
    null
  );
  const [officialNotesInput, setOfficialNotesInput] = useState(
    "Compiled and certified by Oversite Central Operations QA."
  );
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  async function loadReports(filter = statusFilter) {
    setIsLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/reports/pending?status=${filter}`, {
        credentials: "include",
        headers,
      });
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

  useEffect(() => {
    loadReports(statusFilter);
  }, [statusFilter]);

  const handleCompileDossier = async (report: AdminReportItem) => {
    setIsProcessing(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `/api/v1/admin/tasks/${report.taskId}/reports/${report.id}/compile`,
        {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ officialNotes: officialNotesInput }),
        }
      );
      const json = await res.json();
      if (json.success) {
        showToast(
          `Dossier compiled (${json.data?.watermarkCode}) and released to End User`
        );
        setInspectingReport(null);
        loadReports(statusFilter);
      } else {
        showToast(json.error?.message || "Failed to compile dossier");
      }
    } catch (err: any) {
      showToast(err.message || "Error compiling dossier");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAndCredit = async (report: AdminReportItem) => {
    setIsProcessing(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `/api/v1/tasks/${report.taskId}/reports/${report.id}/approve`,
        {
          method: "POST",
          credentials: "include",
          headers,
        }
      );

      const json = await res.json();
      if (json.success) {
        setInspectingReport(null);
        loadReports(statusFilter);
        showToast(
          `Approved! Operative ${report.operativeCode} credited ${formatCurrency(report.agentPayoutNgn)}`
        );
      } else {
        showToast(json.error?.message || "Failed to approve report");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to approve report");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (report: AdminReportItem) => {
    setIsProcessing(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `/api/v1/tasks/${report.taskId}/reports/${report.id}/reject`,
        {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            reason:
              rejectionReasonInput.trim() ||
              "Additional field verification or clearer evidence required by Oversite QA.",
          }),
        }
      );

      const json = await res.json();
      if (json.success) {
        setInspectingReport(null);
        loadReports(statusFilter);
        showToast(`Report returned for revision to ${report.operativeCode}`);
      } else {
        showToast(json.error?.message || "Failed to reject report");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to reject report");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[var(--bg-card)] border border-[var(--primary-border)] text-[var(--text-heading)] px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-heading)] tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-[var(--primary)]" />
            QA Report Audit & Official Dossier Compilation
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Audit raw operative submissions, compile watermarked Oversite dossiers for clients, and approve to credit Agent Task Pay.
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: "SUBMITTED", label: "Pending QA" },
            { id: "UNDER_REVIEW", label: "Compiled (Client Review)" },
            { id: "APPROVED", label: "Approved & Credited" },
            { id: "REJECTED", label: "Returned" },
            { id: "ALL", label: "All Reports" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] hover:text-[var(--text-heading)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <DynamicLoadingState variant="documents" count={3} />
      ) : reports.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--text-muted)] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          No field reports found in the {statusFilter} queue.
        </div>
      ) : (
        <div className="space-y-3.5">
          {reports.map((rpt) => (
            <div
              key={rpt.id}
              className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col lg:flex-row justify-between lg:items-center gap-4 shadow-xs"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)]">
                    {rpt.moduleType}
                  </span>
                  <span className="text-sm font-bold text-[var(--text-heading)]">
                    {rpt.taskTitle}
                  </span>
                  {rpt.watermarkCode && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary)] font-bold">
                      {rpt.watermarkCode}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    {rpt.status}
                  </span>
                </div>

                <p className="text-xs text-[var(--text-muted)]">
                  Operative:{" "}
                  <span className="font-mono font-bold text-[var(--primary)]">
                    {rpt.operativeCode}
                  </span>{" "}
                  ({rpt.agentName || rpt.agentEmail}) · Agent Task Pay:{" "}
                  <strong className="text-[var(--text-heading)]">
                    {formatCurrency(rpt.agentPayoutNgn)}
                  </strong>{" "}
                  · Submitted {formatTimeAgo(rpt.createdAt)}
                </p>

                {rpt.summary && (
                  <p className="text-xs text-[var(--text-body)] max-w-2xl line-clamp-2">
                    {rpt.summary}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setInspectingReport(rpt);
                    setOfficialNotesInput(
                      rpt.officialNotes ||
                        "Compiled and certified by Oversite Central Operations QA."
                    );
                    setRejectionReasonInput("");
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--primary-light)] text-xs font-semibold text-[var(--text-heading)] border border-[var(--border-color)] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span>Inspect & Compile</span>
                </button>

                {rpt.status !== "APPROVED" && (
                  <button
                    type="button"
                    onClick={() => handleApproveAndCredit(rpt)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Credit {formatCurrency(rpt.agentPayoutNgn)}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-Over Report Inspector & Dossier Compiler Drawer */}
      {inspectingReport && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-[var(--bg-card)] border-l border-[var(--border-color)] h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-heading)] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--primary)]" />
                  <span>Field Report QA & Dossier Compiler</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {inspectingReport.taskTitle} · Operative{" "}
                  <strong className="font-mono text-[var(--primary)]">
                    {inspectingReport.operativeCode}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingReport(null)}
                className="p-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs">
              <div>
                <span className="text-[var(--text-muted)] block">Client Paid</span>
                <strong className="text-sm text-[var(--text-heading)]">
                  {formatCurrency(inspectingReport.clientPriceNgn)}
                </strong>
              </div>
              <div>
                <span className="text-[var(--primary)] font-semibold block">
                  Agent Task Pay
                </span>
                <strong className="text-sm text-[var(--primary)]">
                  {formatCurrency(inspectingReport.agentPayoutNgn)}
                </strong>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block">Risk / Severity</span>
                <strong className="text-sm text-[var(--text-heading)]">
                  {inspectingReport.severity || "NORMAL"}
                </strong>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-1">
                <span className="font-bold text-[var(--text-heading)] uppercase tracking-wider text-[10px]">
                  Executive Summary
                </span>
                <p className="text-[var(--text-body)]">
                  {inspectingReport.summary || "No summary provided."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-1">
                <span className="font-bold text-[var(--text-heading)] uppercase tracking-wider text-[10px]">
                  Detailed Field Findings
                </span>
                <p className="text-[var(--text-body)] whitespace-pre-wrap">
                  {inspectingReport.findings || "No detailed findings attached."}
                </p>
              </div>

              {Array.isArray(inspectingReport.media) &&
                inspectingReport.media.length > 0 && (
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2">
                    <span className="font-bold text-[var(--text-heading)] uppercase tracking-wider text-[10px] block">
                      GPS-Tagged Field Media ({inspectingReport.media.length})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {inspectingReport.media.map((m: any, idx: number) => (
                        <a
                          key={m.id || idx}
                          href={m.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--primary)] font-semibold flex items-center gap-1.5"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{m.caption || `Evidence #${idx + 1}`}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Official Dossier Compilation Form */}
            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--primary-border)] space-y-3">
              <label className="block text-xs font-bold text-[var(--primary)]">
                Official Oversite QA Certification Notes (Stamped on Client Dossier)
              </label>
              <textarea
                rows={2}
                value={officialNotesInput}
                onChange={(e) => setOfficialNotesInput(e.target.value)}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-heading)]"
              />
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleCompileDossier(inspectingReport)}
                className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  Compile Official Watermarked Dossier (OVS-DOSS) & Release to Client
                </span>
              </button>
            </div>

            {/* Return for Revision or Direct Approve & Credit */}
            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-3">
              <input
                type="text"
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Revision instructions if returning report to operative..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-heading)]"
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleReject(inspectingReport)}
                  className="px-4 py-2 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold cursor-pointer"
                >
                  Return to Operative
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleApproveAndCredit(inspectingReport)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Approve & Credit Operative ({formatCurrency(inspectingReport.agentPayoutNgn)})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
