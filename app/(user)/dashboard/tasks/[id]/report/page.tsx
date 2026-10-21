"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Share2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  MapPin,
  Calendar,
  User,
  Clock,
  Check,
} from "lucide-react";

export default function TaskReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDownload = () => {
    showToast("Downloading official report PDF...");
    const content = `OVERSITE.NG — OFFICIAL CERTIFIED INSPECTION REPORT
Ref: OS-2026-08841
Task: Project review
Project: Lekki duplex - Block B
Location: Plot 12, Lekki Phase 1, Lagos
Inspector: Folake A. (Accredited Manager)
Date: October 20, 2026
Status: Completed · Low Risk

1. EXECUTIVE SUMMARY
Property confirmed at registered GPS coordinates. No unauthorized construction observed.
Perimeter fence intact on north and west boundaries. 12 geo-tagged photographs attached.
Title status confirmed clean at the Lagos State Lands Bureau.

2. MILESTONE ASSESSMENTS
- Milestone 1: Foundation & DPC — Nominal strength cured, verified compliant with Nigerian Building Code.
- Milestone 2: Superstructure to roof level — Frame integrity intact.

3. QUALITY CONTROL & ACCREDITATION
Verified and signed cryptographically by Oversite Operations Directorate.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Project_Review_Report_OS2026_08841.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Oversite Inspection Report - Lekki duplex - Block B",
          text: "Official Oversite inspection report and verification findings for Lekki duplex - Block B.",
          url: window.location.href,
        });
      } catch {
        // user cancelled
      }
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Report link copied to clipboard!");
    }
  };

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
              Final Report Submission
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

          {/* ── Subheader Block (Matches Screenshots 3 & 4) ── */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-[19px] sm:text-[21px] font-bold text-[var(--text-heading)] tracking-tight truncate">
                Lekki duplex - Block B
              </h2>
              <p className="text-[12.5px] text-[var(--text-muted)] mt-0.5 leading-snug">
                Project review · Completed by Folake A. · Today
              </p>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary-light)] border border-[var(--primary)]/20 shadow-2xs shrink-0">
              <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
              <span className="text-[12px] font-bold text-[var(--primary)]">
                Completed
              </span>
            </div>
          </div>

          {/* ── Risk & Ref Badges (Matches Screenshot 3) ── */}
          <div className="flex items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium bg-[var(--primary-light)] text-[var(--primary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              Risk: Low
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-body)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
              Ref: OS-2026-08841
            </span>
          </div>

          {/* ── PDF Report Card (Matches Screenshot 4 & Vault Style) ── */}
          <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4.5 sm:p-5 shadow-xs mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Document icon matching Oversite Document Vault */}
              <div className="relative w-11 h-11 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center shrink-0 text-zinc-700 dark:text-zinc-200">
                <FileText className="w-6 h-6 stroke-[1.8]" />
                <span className="absolute -bottom-1 -right-1 bg-zinc-900 text-white text-[8px] font-bold px-1 py-0.5 rounded-xs leading-none">
                  PDF
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-[14.5px] sm:text-[15px] font-bold text-zinc-900 dark:text-white truncate">
                  Project review report
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Today · 1.8 MB · Certified
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

          {/* ── Visual Inspection Evidence (Matches Screenshot 3) ── */}
          <div className="mb-5">
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[var(--text-heading)] mb-2.5">
              Verified Photographic Evidence
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="h-[84px] sm:h-[96px] rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xs">
                <img
                  src="/assets/images/tasks/site-worker.jpg"
                  alt="Site worker audit"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-[84px] sm:h-[96px] rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xs">
                <img
                  src="/assets/images/tasks/blueprints.jpg"
                  alt="Blueprint compliance"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-[84px] sm:h-[96px] rounded-2xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-2xs">
                <img
                  src="/assets/images/tasks/foundation.jpg"
                  alt="Foundation integrity"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-[11.5px] text-[var(--text-muted)] mt-1.5">
              3 of 12 geo-tagged photographs attached to the official record
            </p>
          </div>

          {/* ── Milestones & Executive Audit Findings (Matches Screenshot 3 & 4) ── */}
          <div className="mb-5">
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[var(--text-heading)] mb-2.5">
              Milestones
            </h3>

            <div className="space-y-3">
              <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4.5 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-[14px] sm:text-[14.5px] font-bold text-[var(--text-heading)]">
                    1. Foundation & DPC
                  </h4>
                  <span className="text-[11.5px] font-semibold text-[var(--primary)] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    Verified
                  </span>
                </div>
                <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                  The foundation is in excellent condition, but after verification, we found a few notes that still need to be addressed.
                </p>
              </div>

              <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4.5 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-[14px] sm:text-[14.5px] font-bold text-[var(--text-heading)]">
                    2. Superstructure to roof level
                  </h4>
                  <span className="text-[11.5px] font-semibold text-[var(--primary)] flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    Verified
                  </span>
                </div>
                <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                  The foundation is in excellent condition, but after verification, we found a few notes that still need to be addressed.
                </p>
              </div>
            </div>
          </div>

          {/* ── Oversite Manager Note (Matches Screenshot 4) ── */}
          <div className="mb-5">
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[var(--text-heading)] mb-2.5">
              Oversite manager note
            </h3>

            <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs">
              <p className="text-[13px] text-[var(--text-body)] leading-relaxed">
                Property confirmed at registered GPS coordinates. No unauthorized construction observed. Perimeter fence intact on north and west boundaries. 12 geo-tagged photographs attached. Title status confirmed clean at the Lagos State Lands Bureau.
              </p>
            </div>
          </div>

          {/* ── Accompanied Messages & Operations Log ── */}
          <div className="mb-5">
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[var(--text-heading)] mb-2.5">
              Accompanied remarks & message
            </h3>

            <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4.5 sm:p-5 shadow-xs space-y-3">
              {/* Message from Oversite Admin to Client */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0 font-bold text-[12px]">
                  OS
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-[var(--text-heading)]">
                      Oversite Operations
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Today · 1:15 PM
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[var(--text-muted)] mt-1 leading-relaxed">
                    Hello Adaeze, your project review for Lekki duplex - Block B has been completed by accredited manager Folake A. All 12 geo-tagged photographs and structural milestone assessments have been validated. The certified inspection report is ready for your records.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Task Summary Breakdown Table (Matches Screenshot 4) ── */}
          <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs mb-6">
            {/* Row 1 */}
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-[var(--text-muted)] font-medium">Task</span>
              <span className="font-bold text-[var(--text-heading)]">
                Project review
              </span>
            </div>

            <div className="border-b border-[var(--border-color)] my-3.5" />

            {/* Row 2 */}
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-[var(--text-muted)] font-medium">
                Accredited Manager
              </span>
              <span className="font-bold text-[var(--text-heading)]">
                Folake A.
              </span>
            </div>

            <div className="border-b border-[var(--border-color)] my-3.5" />

            {/* Row 3 */}
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-[var(--text-muted)] font-medium">
                Time on task
              </span>
              <span className="font-bold text-[var(--text-heading)]">
                2 h 14 min
              </span>
            </div>

            <div className="border-b border-[var(--border-color)] my-3.5" />

            {/* Row 4 */}
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-[var(--text-muted)] font-medium">
                Evidence
              </span>
              <span className="font-bold text-[var(--text-heading)]">
                3 photos · geo-tagged
              </span>
            </div>

            <div className="border-b border-[var(--border-color)] my-3.5" />

            {/* Row 5 */}
            <div className="flex items-center justify-between text-[13.5px]">
              <span className="text-[var(--text-muted)] font-medium">
                Total charged
              </span>
              <span className="font-bold text-[var(--text-heading)]">
                ₦15,000
              </span>
            </div>
          </div>
        </div>

        {/* Space above bottom nav to ensure FAB or sticky button never covers text */}
        <div className="pb-36" />

        {/* ── Sticky Bottom Action Bar ── */}
        <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-[var(--bg-body)]/95 backdrop-blur-md pt-3 pb-3 -mx-4 sm:-mx-6 px-4 sm:px-6 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full py-3.5 sm:py-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-[0.98] text-white font-bold text-[15px] sm:text-[16px] transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5 stroke-[2.2]" />
            <span>Download Certified Report (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
