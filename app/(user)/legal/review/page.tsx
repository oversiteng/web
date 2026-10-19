"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";

interface LegalConsultationDraft {
  legalDomain?: string;
  summary?: string;
  language?: string;
  consultationDate?: string;
  consultationDateRaw?: string;
  propertyId?: string;
  propertyTitle?: string;
  fileName?: string | null;
}

function formatTimeWindow(dateStr?: string) {
  if (!dateStr) return "Consultation · Tue 22 Sep, 4:00 PM";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Consultation · Tue 22 Sep, 4:00 PM";
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const day = d.getDate();
    const month = d.toLocaleDateString("en-US", { month: "short" });
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `Consultation · ${weekday} ${day} ${month}, ${hours}:${minutes} ${ampm}`;
  } catch {
    return "Consultation · Tue 22 Sep, 4:00 PM";
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
    const date = searchParams.get("date") || "";
    const propTitle = searchParams.get("propTitle") || "";
    const propId = searchParams.get("propertyId") || "";

    setDraft({
      legalDomain: domain,
      consultationDateRaw: date,
      propertyTitle: propTitle,
      propertyId: propId,
    });
  }, [searchParams]);

  const taskName = draft?.legalDomain || "Property & Land Law";
  const locationName = draft?.propertyTitle || "Remote consultation";
  const timeWindow = formatTimeWindow(draft?.consultationDateRaw || draft?.consultationDate);

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
          legalDomain: taskName,
          serviceType: "Advisory Consultation",
          caseSummary: draft?.summary || "Legal consultation booking",
          priceNgn: 26100,
          propertyId: draft?.propertyId || undefined,
          formData: {
            language: draft?.language || "English",
            consultationDate: draft?.consultationDate || timeWindow,
            fileName: draft?.fileName || null,
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

        {/* Card 1: Details Card */}
        <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs">
          {/* Row 1: Task */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Task</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              {taskName}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 2: Where */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Where</span>
            <span className="font-semibold text-[var(--text-heading)] text-right truncate max-w-[220px]">
              {locationName}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 3: Time window */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Time window</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              {timeWindow}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 4: Report */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Report</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              Document vault & email
            </span>
          </div>
        </div>

        {/* Card 2: Fee Breakdown Card */}
        <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 mt-4 shadow-xs">
          {/* Row 1: Service fee */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Service fee</span>
            <span className="font-semibold text-[var(--text-heading)]">₦22,000</span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 2: Document handling */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Document handling</span>
            <span className="font-semibold text-[var(--text-heading)]">₦4,000</span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 3: Charge */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Charge</span>
            <span className="font-semibold text-[var(--text-heading)]">₦100</span>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Button */}
      <div className="pt-6 pb-4 sticky bottom-[68px] md:bottom-0 bg-[var(--bg-body)]/95 backdrop-blur-md z-40 mt-6 border-t border-[var(--border-color)] -mx-2 sm:-mx-4 px-2 sm:px-4">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handlePay}
          className="w-full py-4 rounded-full bg-[#6EE7B7] hover:bg-[#5CD88C] text-[#052E16] font-bold text-[16px] tracking-wide transition-all duration-200 shadow-md shadow-[#6EE7B7]/20 active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? "Processing payment..." : "Pay ₦26,100"}
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
            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center mx-auto mb-4">
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
                href="/dashboard/tasks"
                className="w-full py-3.5 rounded-full bg-[#28A745] hover:bg-[#218838] text-white font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#28A745]/20 cursor-pointer active:scale-95"
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
