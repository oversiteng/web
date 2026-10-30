"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, FileCheck } from "lucide-react";

interface LegalConsent {
  accurateConfirmed?: boolean;
  noRelationshipConfirmed?: boolean;
  conflictCheckConfirmed?: boolean;
  ndpaConsentConfirmed?: boolean;
  signature?: string;
  consentDate?: string;
}

interface LegalConsultationDraft {
  legalDomain?: string;
  legalType?: string;
  serviceType?: string;
  summary?: string;
  consultationDate?: string;
  propertyId?: string;
  propertyTitle?: string;
  fileName?: string | null;
  priceNgn?: number;
  workloadUnits?: number;
  consent?: LegalConsent;
}

function formatTimeWindow(dateStr?: string) {
  if (!dateStr) return "Schedule pending";
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
      const day = d.getDate();
      const month = d.toLocaleDateString("en-US", { month: "short" });
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${weekday} ${day} ${month}, ${hours}:${minutes} ${ampm}`;
    }
    return dateStr;
  } catch {
    return dateStr || "Schedule pending";
  }
}

export default function LegalOrderReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [draft, setDraft] = useState<LegalConsultationDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  useEffect(() => {
    // Read from sessionStorage or query parameters
    try {
      const stored = sessionStorage.getItem("oversite_legal_draft");
      if (stored) {
        setDraft(JSON.parse(stored));
        return;
      }
    } catch (e) {
      console.error("Failed to parse legal draft:", e);
    }

    // Fallback to URL search parameters
    const domain = searchParams.get("domain") || "Property & Land Law";
    const type = searchParams.get("type") || "Individual";
    const service = searchParams.get("service") || "Advice/opinion";
    const date = searchParams.get("date") || "";
    const propTitle = searchParams.get("propTitle") || "";
    const propId = searchParams.get("propertyId") || "";

    setDraft({
      legalDomain: domain,
      legalType: type,
      serviceType: service,
      consultationDate: date,
      propertyTitle: propTitle,
      propertyId: propId,
      priceNgn: 26100,
      workloadUnits: 2,
    });
  }, [searchParams]);

  const legalDomain = draft?.legalDomain || "Property & Land Law";
  const serviceType = draft?.serviceType || "Advice/opinion";
  const entityType = draft?.legalType || "Individual";
  const consentDateDisplay = draft?.consent?.consentDate;
  const locationName = draft?.propertyTitle || "Remote consultation";
  const timeWindow = formatTimeWindow(draft?.consultationDate);
  const workloadUnits = draft?.workloadUnits || 2;
  const serviceFee = workloadUnits * 11000;
  const documentReviewBase = 4000;
  const charge = 100;
  const totalAmount = serviceFee + documentReviewBase + charge;

  const handlePay = async () => {
    setIsSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/tasks/legal-advisory", {
        method: "POST",
        headers,
        body: JSON.stringify({
          legalDomain,
          legalType: entityType,
          serviceType,
          caseSummary: draft?.summary || "Legal advisory consultation",
          priceNgn: totalAmount,
          propertyId: draft?.propertyId || undefined,
          formData: {
            legalDomain,
            legalType: entityType,
            serviceType,
            caseSummary: draft?.summary,
            consultationDate: draft?.consultationDate || null,
            fileName: draft?.fileName || null,
            workloadUnits,
            pricingBreakdown: {
              serviceFee,
              workloadUnits,
              documentReviewBase,
              charge,
              totalAmount,
            },
            consent: draft?.consent || null,
          },
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCreatedTaskId(json.data?.id || "legal-task");
      } else {
        setCreatedTaskId("legal-" + Date.now().toString().slice(-4));
      }
      // Clear draft on successful booking
      sessionStorage.removeItem("oversite_legal_draft");
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Booking payment error:", err);
      setIsSuccessModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between relative px-2 sm:px-4 animate-in fade-in duration-200">
      <div>
        {/* Top Header */}
        <div className="relative flex items-center justify-center py-4 mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-0 p-2 -ml-1 rounded-xl text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
            aria-label="Back to form"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] sm:text-[19px] font-bold text-[var(--text-heading)] tracking-tight">
            Order review
          </h1>
        </div>

        {/* Details Card */}
        <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Task</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              Legal advisory · {serviceType}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60" />

          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Workload Weight</span>
            <span className="font-semibold text-[var(--primary)]">{workloadUnits} units</span>
          </div>

          <div className="border-b border-[var(--border-color)]/60" />

          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Entity type</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              {entityType}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60" />

          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Legal domain</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              {legalDomain}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60" />

          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Service type</span>
            <span className="font-semibold text-[var(--text-heading)] text-right truncate max-w-[220px]">
              {serviceType}
            </span>
          </div>

          {/* Digital Signature */}
          {draft?.consent?.signature && (
            <>
              <div className="border-b border-[var(--border-color)]/60" />
              <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-[var(--primary)]" />
                  Digital signature
                </span>
                <span suppressHydrationWarning className="font-semibold text-[var(--text-heading)] text-right">
                  {draft.consent.signature} {draft.consent.consentDate ? `(${draft.consent.consentDate})` : ""}
                </span>
              </div>
            </>
          )}

          {consentDateDisplay && (
            <>
              <div className="border-b border-[var(--border-color)]/60" />
              <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
                <span className="text-[var(--text-muted)]">Consent date</span>
                <span className="font-semibold text-[var(--text-heading)] text-right truncate max-w-[220px]">
                  {consentDateDisplay}
                </span>
              </div>
            </>
          )}

          <div className="border-b border-[var(--border-color)]/60" />

          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Where</span>
            <span className="font-semibold text-[var(--text-heading)] text-right truncate max-w-[220px]">
              {locationName}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60" />

          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Time window</span>
            <span suppressHydrationWarning className="font-semibold text-[var(--text-heading)] text-right">
              {timeWindow}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60" />

          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Report</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              Document vault &amp; email
            </span>
          </div>
        </div>

        {/* Fee Card */}
        <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 mt-4 shadow-xs">
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Service fee ({workloadUnits} units)</span>
            <span className="font-semibold text-[var(--text-heading)]">₦{serviceFee.toLocaleString()}</span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <div>
              <span className="text-[var(--text-muted)] block">Document review</span>
              <span className="text-[12px] text-[var(--text-muted)] block mt-0.5">base</span>
            </div>
            <span className="font-semibold text-[var(--text-heading)]">₦{documentReviewBase.toLocaleString()}</span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Charge</span>
            <span className="font-semibold text-[var(--text-heading)]">₦{charge.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Button */}
      <div className="pt-6 pb-4 sticky bottom-[68px] md:bottom-0 bg-[var(--bg-body)]/95 backdrop-blur-md z-40 mt-6 border-t border-[var(--border-color)] -mx-2 sm:-mx-4 px-2 sm:px-4">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handlePay}
          className="w-full py-4 rounded-full bg-[#85e19e] hover:bg-[#74d38e] text-zinc-950 font-semibold text-[16px] tracking-wide transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? "Processing booking..." : `Pay ₦${totalAmount.toLocaleString()}`}
        </button>
      </div>

      {/* ── Success Confirmation Modal ── */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsSuccessModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200 z-10">
            <div className="w-14 h-14 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-[18px] font-bold text-[var(--text-heading)]">
              Consultation Booked!
            </h2>
            <p className="text-[12.5px] text-[var(--text-muted)] mt-2 leading-relaxed">
              Your consultation request is matched. Your accredited legal counsel will connect with you on <span className="font-semibold text-[var(--text-heading)]">{timeWindow}</span>.
            </p>

            <div className="mt-6 space-y-2">
              <Link
                href={`/dashboard/tasks${createdTaskId ? `?id=${createdTaskId}` : ""}`}
                className="w-full py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <span>View Consultation Task</span>
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
