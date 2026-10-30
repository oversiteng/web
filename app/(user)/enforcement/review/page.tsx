"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";

interface EnforcementDraft {
  fullName?: string;
  relationship?: string;
  incidentType?: string;
  firstNoticedDate?: string;
  firstNoticedDisplay?: string;
  occurredSameTime?: boolean;
  incidentOccurredDate?: string;
  incidentOccurredDisplay?: string;
  isOngoing?: boolean;
  description?: string;
  suspectName?: string;
  suspectContact?: string;
  hasReported?: boolean;
  existingReportRef?: string;
  selectedActions?: string[];
  shieldIdentity?: boolean;
  emergencyEngagement?: boolean;
  fileName?: string | null;
  serviceFee?: number;
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
    const type = searchParams.get("type") || "Fraud/scam";
    const emergency = searchParams.get("emergency") === "true";
    const shield = searchParams.get("shield") === "true";

    setDraft({
      fullName: "Complainant",
      relationship: "Victim",
      incidentType: type,
      firstNoticedDisplay: "Recent",
      isOngoing: false,
      selectedActions: ["Report officially"],
      emergencyEngagement: emergency,
      shieldIdentity: shield,
      serviceFee: 15000,
      emergencyFee: emergency ? 5000 : 0,
      totalFee: emergency ? 20000 : 15000,
    });
  }, [searchParams]);

  const taskTitle = `Law Enforcement Liaison · ${draft?.incidentType || "Incident Report"}`;
  const locationWhere = "Lagos";
  const timeWindow = draft?.emergencyEngagement
    ? "2-Hour Emergency SLA"
    : "Standard (24–48 hrs)";
  const reportDelivery = "Document vault & email";

  const serviceFee = draft?.serviceFee ?? 15000;
  const emergencyFee = draft?.emergencyEngagement ? (draft?.emergencyFee ?? 5000) : 0;
  const totalFee = serviceFee + emergencyFee;

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
          title: taskTitle,
          description: draft?.description || `${taskTitle} for ${locationWhere}`,
          locationAddress: locationWhere,
          isExpress: draft?.emergencyEngagement || false,
          formData: {
            fullName: draft?.fullName,
            relationship: draft?.relationship,
            incidentType: draft?.incidentType,
            firstNoticedDate: draft?.firstNoticedDate,
            firstNoticedDisplay: draft?.firstNoticedDisplay,
            occurredSameTime: draft?.occurredSameTime,
            incidentOccurredDate: draft?.incidentOccurredDate,
            incidentOccurredDisplay: draft?.incidentOccurredDisplay,
            isOngoing: draft?.isOngoing,
            description: draft?.description,
            suspectName: draft?.suspectName,
            suspectContact: draft?.suspectContact,
            hasReported: draft?.hasReported,
            existingReportRef: draft?.existingReportRef,
            selectedActions: draft?.selectedActions,
            shieldIdentity: draft?.shieldIdentity,
            emergencyEngagement: draft?.emergencyEngagement,
            fileName: draft?.fileName,
            serviceFee,
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
    <div className="bg-[var(--bg-body)] min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-[var(--text-heading)] transition-colors duration-150 animate-in fade-in duration-200">
      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4">
        <div>
          {/* ── Top Header ── */}
          <div className="relative flex items-center justify-center py-3 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute left-0 p-2 -ml-2 text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Back to form"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] sm:text-[18px] font-bold text-[var(--text-heading)] tracking-tight">
              Order review
            </h1>
          </div>

          {/* ── Card 1: Investigation Details Card ── */}
          <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs">
            {/* Row 1: Task */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-[var(--text-muted)] font-medium">Task</span>
              <span className="font-bold text-[var(--text-heading)] text-right truncate max-w-[240px]">
                {taskTitle}
              </span>
            </div>

            <div className="border-b border-[var(--border-color)] my-3.5" />

            {/* Row 2: Requester */}
            {draft?.fullName && (
              <>
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-[var(--text-muted)] font-medium">Requester</span>
                  <span className="font-bold text-[var(--text-heading)] text-right truncate max-w-[240px]">
                    {draft.fullName} ({draft.relationship || "Victim"})
                  </span>
                </div>
                <div className="border-b border-[var(--border-color)] my-3.5" />
              </>
            )}

            {/* Row 3: ID Verification Document */}
            {draft?.fileName && (
              <>
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-[var(--text-muted)] font-medium">ID document</span>
                  <span className="font-bold text-[var(--primary)] text-right truncate max-w-[240px]">
                    {draft.fileName}
                  </span>
                </div>
                <div className="border-b border-[var(--border-color)] my-3.5" />
              </>
            )}

            {/* Row 4: Incident Type */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-[var(--text-muted)] font-medium">Incident type</span>
              <span className="font-bold text-[var(--text-heading)] text-right truncate max-w-[240px]">
                {draft?.incidentType || "Fraud/scam"}
              </span>
            </div>

            <div className="border-b border-[var(--border-color)] my-3.5" />

            {/* Row 5: When noticed */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-[var(--text-muted)] font-medium">First noticed</span>
              <span className="font-bold text-[var(--text-heading)] text-right truncate max-w-[240px]">
                {draft?.firstNoticedDisplay || "Recent"}
              </span>
            </div>

            {/* When occurred (if different) */}
            {draft?.occurredSameTime === false && draft?.incidentOccurredDisplay && (
              <>
                <div className="border-b border-[var(--border-color)] my-3.5" />
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-[var(--text-muted)] font-medium">Occurred at</span>
                  <span className="font-bold text-[var(--text-heading)] text-right truncate max-w-[240px]">
                    {draft.incidentOccurredDisplay}
                  </span>
                </div>
              </>
            )}

            <div className="border-b border-[var(--border-color)] my-3.5" />

            {/* Row 6: Status */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-[var(--text-muted)] font-medium">Status</span>
              <span className="font-bold text-[var(--text-heading)] text-right">
                {draft?.isOngoing ? "Ongoing" : "Concluded / Stopped"}
              </span>
            </div>

            {/* Row 7: Suspect Info (if provided) */}
            {draft?.suspectName && (
              <>
                <div className="border-b border-[var(--border-color)] my-3.5" />
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-[var(--text-muted)] font-medium">Suspect</span>
                  <span className="font-bold text-[var(--text-heading)] text-right truncate max-w-[240px]">
                    {draft.suspectName}
                  </span>
                </div>
              </>
            )}

            {/* Row 8: Prior Report */}
            {draft?.hasReported && (
              <>
                <div className="border-b border-[var(--border-color)] my-3.5" />
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-[var(--text-muted)] font-medium">Prior report</span>
                  <span className="font-bold text-[var(--text-heading)] text-right truncate max-w-[240px]">
                    {draft.existingReportRef || "Reported to authorities"}
                  </span>
                </div>
              </>
            )}

            <div className="border-b border-[var(--border-color)] my-3.5" />

            {/* Row 9: Actions requested */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-[var(--text-muted)] font-medium">Action requested</span>
              <span className="font-bold text-[var(--text-heading)] text-right truncate max-w-[230px]">
                {draft?.selectedActions && draft.selectedActions.length > 0
                  ? draft.selectedActions.join(", ")
                  : "Report officially"}
              </span>
            </div>

            {/* Row 10: Shield Identity */}
            {draft?.shieldIdentity && (
              <>
                <div className="border-b border-[var(--border-color)] my-3.5" />
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-[var(--text-muted)] font-medium">Identity protection</span>
                  <span className="font-bold text-emerald-400 text-right">
                    Shielded (Filed via Oversite)
                  </span>
                </div>
              </>
            )}

            <div className="border-b border-[var(--border-color)] my-3.5" />

            {/* Row 11: Time window */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-[var(--text-muted)] font-medium">Time window</span>
              <span className="font-bold text-[var(--text-heading)] text-right">
                {timeWindow}
              </span>
            </div>

            <div className="border-b border-[var(--border-color)] my-3.5" />

            {/* Row 12: Where */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-[var(--text-muted)] font-medium">Where</span>
              <span className="font-bold text-[var(--text-heading)] text-right truncate max-w-[240px]">
                {locationWhere}
              </span>
            </div>

            <div className="border-b border-[var(--border-color)] my-3.5" />

            {/* Row 13: Report */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-[var(--text-muted)] font-medium">Report</span>
              <span className="font-bold text-[var(--text-heading)] text-right">
                {reportDelivery}
              </span>
            </div>
          </div>

          {/* ── Card 2: Fee Breakdown Card ── */}
          <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 mt-4 shadow-xs">
            {/* Row 1: Service fee */}
            <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
              <span className="text-[var(--text-muted)] font-medium">Service fee</span>
              <span className="font-bold text-[var(--text-heading)]">
                ₦{serviceFee.toLocaleString()}
              </span>
            </div>

            {/* Row 2: Emergency engagement (2-hr SLA) */}
            {draft?.emergencyEngagement && (
              <>
                <div className="border-b border-[var(--border-color)] my-3.5" />
                <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                  <span className="text-[var(--text-muted)] font-medium leading-snug max-w-[200px]">
                    Emergency engagement (2-hr SLA)
                  </span>
                  <span className="font-bold text-[var(--text-heading)]">
                    ₦{emergencyFee.toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Bottom Sticky Action Button ── */}
        <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-[var(--bg-body)]/95 backdrop-blur-md pt-4 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-6 border-t border-[var(--border-color)]">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handlePay}
            className="w-full py-3.5 sm:py-4 rounded-full bg-[#85e19e] hover:bg-[#74d38e] text-zinc-950 font-bold text-[16px] tracking-wide transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Processing filing..." : `Pay ₦${totalFee.toLocaleString()}`}
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
          <div className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200 z-10">
            <div className="w-14 h-14 rounded-full bg-[#85e19e]/20 text-[#85e19e] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-[18px] font-bold text-[var(--text-heading)]">
              Liaison Request Commissioned!
            </h2>
            <p className="text-[12.5px] text-[var(--text-muted)] mt-2 leading-relaxed">
              Your{" "}
              <span className="font-semibold text-[var(--text-heading)]">
                {taskTitle}
              </span>{" "}
              has been lodged and dispatched for law enforcement liaison. You can monitor file progress and updates in real time.
            </p>

            <div className="mt-6 space-y-2">
              <Link
                href="/dashboard/tasks"
                className="w-full py-3.5 rounded-full bg-[#85e19e] hover:bg-[#74d38e] text-zinc-950 font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <span>Track Live Status</span>
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
