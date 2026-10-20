"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";

interface EnforcementDraft {
  agencyId?: string;
  agencyName?: string;
  agencyShortName?: string;
  matterType?: string;
  whatHappened?: string;
  fileName?: string | null;
  shieldIdentity?: boolean;
  emergencyEngagement?: boolean;
  serviceFee?: number;
  filingCost?: number;
  emergencyFee?: number;
  totalFee?: number;
}

export default function LawEnforcementReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [draft, setDraft] = useState<EnforcementDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("oversite_enforcement_draft");
      if (stored) {
        setDraft(JSON.parse(stored));
        return;
      }
    } catch (e) {
      console.error("Failed to parse enforcement draft:", e);
    }

    // Fallback from query params
    const agency = searchParams.get("agency") || "icpc";
    const matter = searchParams.get("matter") || "";
    const emergency = searchParams.get("emergency") === "true";
    const shield = searchParams.get("shield") === "true";

    setDraft({
      agencyId: agency,
      agencyName: agency === "icpc" ? "ICPC" : agency.toUpperCase(),
      agencyShortName: agency === "icpc" ? "ICPC" : agency.toUpperCase(),
      matterType: matter || "Petition",
      emergencyEngagement: emergency,
      shieldIdentity: shield,
      serviceFee: 15000,
      filingCost: 7000,
      emergencyFee: emergency ? 5000 : 0,
      totalFee: emergency ? 27000 : 22000,
    });
  }, [searchParams]);

  // Derived values matching Screenshot 4
  const taskTitle = draft?.agencyShortName
    ? `${draft.agencyShortName} petition`
    : "ICPC petition";

  const locationWhere = "Lagos";

  const timeWindow = draft?.emergencyEngagement
    ? "Filed within 2 hours"
    : "Standard (24–48 hrs)";

  const reportDelivery = "Document vault & email";

  const serviceFee = draft?.serviceFee ?? 15000;
  const filingCost = draft?.filingCost ?? 7000;
  const emergencyFee = draft?.emergencyEngagement ? (draft?.emergencyFee ?? 5000) : 0;
  const totalFee = serviceFee + filingCost + emergencyFee;

  const handlePay = async () => {
    setIsSubmitting(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/tasks", {
        method: "POST",
        headers,
        body: JSON.stringify({
          moduleType: "LAW_ENFORCEMENT",
          title: `${taskTitle}${draft?.matterType ? ` - ${draft.matterType}` : ""}`,
          description: draft?.whatHappened || `${taskTitle} for ${locationWhere}`,
          locationAddress: locationWhere,
          isExpress: draft?.emergencyEngagement || false,
          formData: {
            agencyId: draft?.agencyId,
            agencyName: draft?.agencyName,
            matterType: draft?.matterType,
            shieldIdentity: draft?.shieldIdentity,
            emergencyEngagement: draft?.emergencyEngagement,
            fileName: draft?.fileName,
            serviceFee,
            filingCost,
            emergencyFee,
            totalFee,
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCreatedTaskId(json.data?.id || "enforcement-task");
      } else {
        setCreatedTaskId("enf-" + Date.now().toString().slice(-4));
      }

      sessionStorage.removeItem("oversite_enforcement_draft");
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Enforcement booking error:", err);
      setIsSuccessModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F2F4F2] dark:bg-[#111412] min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-[var(--text-heading)] transition-colors duration-150 animate-in fade-in duration-200">
      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4">
        <div>
          {/* ── Top Header (Screenshot 4) ── */}
          <div className="relative flex items-center justify-center py-3 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute left-0 p-2 -ml-2 text-zinc-800 dark:text-zinc-200 hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Back to form"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] sm:text-[18px] font-bold text-zinc-900 dark:text-white tracking-tight">
              Order review
            </h1>
          </div>

          {/* ── Card 1: Investigation Details Card (Screenshot 4) ── */}
          <div className="rounded-[22px] bg-white dark:bg-[#1E2220] border border-zinc-100 dark:border-zinc-800/80 p-5 shadow-xs">
            {/* Row 1: Task */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Task</span>
              <span className="font-bold text-zinc-900 dark:text-white text-right truncate max-w-[240px]">
                {taskTitle}
              </span>
            </div>

            <div className="border-b border-zinc-100 dark:border-zinc-800 my-3.5" />

            {/* Row 2: Where */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Where</span>
              <span className="font-bold text-zinc-900 dark:text-white text-right truncate max-w-[240px]">
                {locationWhere}
              </span>
            </div>

            <div className="border-b border-zinc-100 dark:border-zinc-800 my-3.5" />

            {/* Row 3: Time window */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Time window</span>
              <span className="font-bold text-zinc-900 dark:text-white text-right">
                {timeWindow}
              </span>
            </div>

            <div className="border-b border-zinc-100 dark:border-zinc-800 my-3.5" />

            {/* Row 4: Report */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Report</span>
              <span className="font-bold text-zinc-900 dark:text-white text-right">
                {reportDelivery}
              </span>
            </div>
          </div>

          {/* ── Card 2: Fee Breakdown Card (Screenshot 4) ── */}
          <div className="rounded-[22px] bg-white dark:bg-[#1E2220] border border-zinc-100 dark:border-zinc-800/80 p-5 mt-4 shadow-xs">
            {/* Row 1: Service fee */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Service fee</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                ₦{serviceFee.toLocaleString()}
              </span>
            </div>

            <div className="border-b border-zinc-100 dark:border-zinc-800 my-3.5" />

            {/* Row 2: Agency filing costs */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Agency filing costs</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                ₦{filingCost.toLocaleString()}
              </span>
            </div>

            {/* Row 3: Emergency engagement (2-hr SLA) */}
            {draft?.emergencyEngagement && (
              <>
                <div className="border-b border-zinc-100 dark:border-zinc-800 my-3.5" />
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium leading-snug max-w-[200px]">
                    Emergency engagement (2-hr SLA)
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white">
                    ₦{emergencyFee.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Bottom Sticky Action Button: Pay ₦27000 (Screenshot 4) ── */}
        <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-[#F2F4F2]/95 dark:bg-[#111412]/95 backdrop-blur-md pt-4 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-6 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handlePay}
            className="w-full py-3.5 sm:py-4 rounded-full bg-[#2BB44A] hover:bg-[#259b40] text-white font-bold text-[16px] tracking-wide transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Processing filing..." : `Pay ₦${totalFee}`}
          </button>
        </div>
      </div>

      {/* ── Success Confirmation Modal ── */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsSuccessModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1E2220] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200 z-10">
            <div className="w-14 h-14 rounded-full bg-[#2BB44A]/15 text-[#2BB44A] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-[18px] font-bold text-[var(--text-heading)]">
              Petition Commissioned!
            </h2>
            <p className="text-[12.5px] text-[var(--text-muted)] mt-2 leading-relaxed">
              Your{" "}
              <span className="font-semibold text-[var(--text-heading)]">
                {taskTitle}
              </span>{" "}
              has been lodged and dispatched for liaison filing. You can monitor filing stamps
              and updates in real time.
            </p>

            <div className="mt-6 space-y-2">
              <Link
                href="/dashboard/tasks"
                className="w-full py-3.5 rounded-full bg-[#2BB44A] hover:bg-[#259b40] text-white font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <span>Track Live Petition</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full py-2.5 rounded-full text-[13px] font-semibold text-[var(--text-heading)] bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
