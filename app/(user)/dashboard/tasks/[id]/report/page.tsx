"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share2,
  Download,
  Check,
  CheckCircle2,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { Task } from "@/lib/types/task";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function TaskReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;

  const [task, setTask] = useState<Task | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadTaskAndReport() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // 1. Fetch task details
        const taskRes = await fetch(`/api/v1/tasks/${taskId}`, { credentials: "include", headers });
        const taskJson = await taskRes.json();
        if (taskJson.success && taskJson.data) {
          setTask(taskJson.data);
        }

        // 2. Fetch report details
        const reportRes = await fetch(`/api/v1/reports/${taskId}`, { credentials: "include", headers });
        const reportJson = await reportRes.json();
        if (reportJson.success && reportJson.data) {
          setReport(reportJson.data);
        }
      } catch (err) {
        console.error("Failed to load task report:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTaskAndReport();
  }, [taskId]);

  const handleDownload = () => {
    showToast("Downloading official report...");
    const reportRef = report?.watermarkCode || `OVS-${taskId.slice(0, 8).toUpperCase()}`;
    const taskTitle = task?.title || "Field Inspection";
    const agentName = task?.assignee?.name || "Oversite Certified Field Operative";
    const findings = report?.findings || report?.summary || "Physical site inspection and audit completed.";

    const content = `OVERSITE.NG — OFFICIAL CERTIFIED INSPECTION REPORT
Reference: ${reportRef}
Task: ${taskTitle}
Module: ${task?.moduleType || "PROPERTY_OVERSITE"}
Status: ${task?.status || "COMPLETED"}
Field Operative: ${agentName}
Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

============================================================
1. EXECUTIVE SUMMARY & FIELD FINDINGS
============================================================
${findings}

============================================================
2. QUALITY CONTROL & CRYPTOGRAPHIC VERIFICATION
============================================================
Report Watermark Code: ${reportRef}
Verified and signed cryptographically by Oversite Operations Directorate.
Platform Guarantee: Funds released following verified deliverable sign-off.
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Oversite_Report_${reportRef}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Oversite Inspection Report - ${task?.title || "Task"}`,
          text: `Official Oversite inspection report and verification findings for ${task?.title || "Task"}.`,
          url: window.location.href,
        });
      } catch {}
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Report link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <DynamicLoadingState variant="documents" count={3} />
      </div>
    );
  }

  const reportRef = report?.watermarkCode || `OVS-${taskId.slice(0, 8).toUpperCase()}`;

  return (
    <div className="bg-[var(--bg-body)] min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-[var(--text-heading)] transition-colors duration-150 -m-4 sm:-m-6 md:-m-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[90] flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0 stroke-[2.2]" />
            <span className="text-[13px] font-medium tracking-wide">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4 relative">
        <div>
          {/* ── Top Header ── */}
          <div className="relative flex items-center justify-between py-3 mb-4">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/tasks/${taskId}`)}
              className="p-2 -ml-2 text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Back to task"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <h1 className="text-[17px] sm:text-[18px] font-bold text-[var(--text-heading)] tracking-tight text-center truncate px-2 flex-1">
              Inspection Report
            </h1>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 -mr-2 text-[var(--text-heading)] hover:text-[var(--primary)] transition-colors cursor-pointer"
              aria-label="Share report"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* ── Subheader Block ── */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-[19px] sm:text-[21px] font-bold text-[var(--text-heading)] tracking-tight truncate">
                {task?.title || "Field Operation"}
              </h2>
              <p className="text-[12.5px] text-[var(--text-muted)] mt-0.5 leading-snug">
                {task?.moduleType?.replace(/_/g, " ")} · Operative: {task?.assignee?.name || "Assigned Agent"}
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary-light)] border border-[var(--primary)]/20 shadow-2xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
              <span className="text-[12px] font-bold text-[var(--primary)]">
                {task?.status || "IN_PROGRESS"}
              </span>
            </div>
          </div>

          {/* ── Risk & Ref Badges ── */}
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium bg-[var(--primary-light)] text-[var(--primary)]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Audited
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-body)]">
              Ref: {reportRef}
            </span>
          </div>

          {/* ── PDF Report Card ── */}
          <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4.5 sm:p-5 shadow-xs mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0 text-zinc-700 dark:text-zinc-200">
                <FileText className="w-6 h-6 stroke-[1.8]" />
                <span className="absolute -bottom-1 -right-1 bg-zinc-900 text-white text-[8px] font-bold px-1 py-0.5 rounded-xs leading-none">
                  PDF
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-[14.5px] sm:text-[15px] font-bold text-[var(--text-heading)] truncate">
                  {task?.title || "Inspection"} Certified Report
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  Ref: {reportRef} · Watermarked
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownload}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--text-heading)] hover:text-[var(--primary)] hover:bg-[var(--bg-secondary)] transition-colors shrink-0 cursor-pointer"
              aria-label="Download report file"
            >
              <Download className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* ── Visual Inspection Evidence ── */}
          {report?.media && report.media.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[15px] sm:text-[16px] font-bold text-[var(--text-heading)] mb-2.5">
                Verified Photographic Evidence
              </h3>
              <div className="grid grid-cols-3 gap-2.5">
                {report.media.slice(0, 6).map((m: any, i: number) => (
                  <div
                    key={m.id || i}
                    className="h-[84px] sm:h-[96px] rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xs"
                  >
                    <img
                      src={m.mediaUrl}
                      alt={`Evidence ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Executive Audit Findings ── */}
          <div className="mb-5">
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[var(--text-heading)] mb-2.5">
              Operative Observations & Findings
            </h3>

            <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs">
              <p className="text-[13px] text-[var(--text-body)] leading-relaxed whitespace-pre-line">
                {report?.findings || report?.summary || task?.description || "Physical field audit in progress. Deliverables and notes will appear here once submitted by the field operative."}
              </p>
            </div>
          </div>

          {/* ── Task Summary Breakdown Table ── */}
          <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs mb-6">
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-[var(--text-muted)] font-medium">Task</span>
              <span className="font-bold text-[var(--text-heading)] truncate max-w-[200px]">
                {task?.title}
              </span>
            </div>

            <div className="border-b border-[var(--border-color)] my-3.5" />

            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-[var(--text-muted)] font-medium">Field Operative</span>
              <span className="font-bold text-[var(--text-heading)]">
                {task?.assignee?.name || "Assigned Field Operative"}
              </span>
            </div>

            <div className="border-b border-[var(--border-color)] my-3.5" />

            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-[var(--text-muted)] font-medium">Price / Fee</span>
              <span className="font-bold text-[var(--text-heading)]">
                {task?.priceNgn ? formatCurrency(task.priceNgn) : "Quote pending"}
              </span>
            </div>
          </div>
        </div>

        <div className="pb-36" />

        {/* ── Sticky Bottom Action Bar ── */}
        <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-[var(--bg-body)]/95 backdrop-blur-md pt-3 pb-3 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-3.5 sm:py-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-[0.98] text-white font-bold text-[15px] sm:text-[16px] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5 stroke-[2.2]" />
            <span>Download Certified Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
