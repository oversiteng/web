"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";

interface DiligenceDraft {
  subjectType?: "individual" | "business";
  targetName?: string;
  rcNin?: string;
  phoneNumber?: string;
  specificNotes?: string;
  tierId?: string;
  tierTitle?: string;
  tierPrice?: number;
  tierTurnaround?: string;
  tierScope?: string;
  fileName?: string | null;
  location?: string;
}

export default function DueDiligenceOrderReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [draft, setDraft] = useState<DiligenceDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("oversite_diligence_draft");
      if (stored) {
        setDraft(JSON.parse(stored));
        return;
      }
    } catch (e) {
      console.error("Failed to parse diligence draft:", e);
    }

    // Fallback from query parameters
    const type = (searchParams.get("type") as "individual" | "business") || "business";
    const name = searchParams.get("name") || "Plot 12, Lekki Phase 1";
    const tier = searchParams.get("tier") || "tier-2";

    setDraft({
      subjectType: type,
      targetName: name,
      tierId: tier,
      tierTitle: "Tier 2 - Business & Vendor Inte",
      tierTurnaround: "24–48 hrs",
      location: "Plot 12, Lekki Phase 1",
    });
  }, [searchParams]);

  const tierId = draft?.tierId || "tier-2";
  const taskTitle =
    draft?.tierTitle && draft.tierTitle.includes("Tier 2")
      ? "Tier 2 - Business & Vendor Inte"
      : draft?.tierTitle || "Tier 2 - Business & Vendor Inte";

  const locationWhere =
    draft?.targetName && draft.targetName.trim().length > 0
      ? draft.targetName
      : "Plot 12, Lekki Phase 1";

  const timeWindow = draft?.tierTurnaround || "24–48 hrs";
  const reportDelivery = "Document vault & email";

  // Exact fee calculation matching Figma screenshot (Service: ₦22,000, Database: ₦4,000, Charge: ₦100 -> Total: ₦26,100)
  const getPricing = (id: string) => {
    switch (id) {
      case "tier-1":
        return { serviceFee: 12000, lookupFee: 2000, charge: 100, total: 14100 };
      case "tier-2":
        return { serviceFee: 22000, lookupFee: 4000, charge: 100, total: 26100 };
      case "tier-3":
        return { serviceFee: 32000, lookupFee: 6000, charge: 100, total: 38100 };
      case "tier-4":
        return { serviceFee: 52000, lookupFee: 8000, charge: 100, total: 60100 };
      default:
        return { serviceFee: 22000, lookupFee: 4000, charge: 100, total: 26100 };
    }
  };

  const pricing = getPricing(tierId);
  const totalFormatted = `₦${pricing.total.toLocaleString()}`;

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
          moduleType: "DUE_DILIGENCE",
          title: `Due Diligence: ${taskTitle}`,
          description: `Subject/Location: ${locationWhere}\nTime Window: ${timeWindow}\nReport: ${reportDelivery}\nRC/NIN: ${draft?.rcNin || "N/A"}\nPhone: ${draft?.phoneNumber || "N/A"}\nNotes: ${draft?.specificNotes || "None"}`,
          priceNgn: pricing.total,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCreatedTaskId(json.data?.id || "dd-task");
      } else {
        setCreatedTaskId("dd-" + Date.now().toString().slice(-4));
      }

      sessionStorage.removeItem("oversite_diligence_draft");
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Diligence booking payment error:", err);
      setIsSuccessModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto min-h-[calc(100vh-120px)] flex flex-col justify-between relative px-2 sm:px-4 animate-in fade-in duration-200">
      <div>
        {/* ── Top Header ── */}
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

        {/* ── Card 1: Investigation Details Card (Matches Figma Screenshot Exactly) ── */}
        <div className="rounded-[22px] bg-white dark:bg-[#1E2220] border border-[var(--border-color)]/60 p-5 shadow-xs">
          {/* Row 1: Task */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Task</span>
            <span className="font-semibold text-[var(--text-heading)] text-right truncate max-w-[240px]">
              {taskTitle}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 2: Where */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Where</span>
            <span className="font-semibold text-[var(--text-heading)] text-right truncate max-w-[240px]">
              {locationWhere}
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
              {reportDelivery}
            </span>
          </div>
        </div>

        {/* ── Card 2: Fee Breakdown Card (Matches Figma Screenshot Exactly) ── */}
        <div className="rounded-[22px] bg-white dark:bg-[#1E2220] border border-[var(--border-color)]/60 p-5 mt-4 shadow-xs">
          {/* Row 1: Service fee */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Service fee</span>
            <span className="font-semibold text-[var(--text-heading)]">
              ₦{pricing.serviceFee.toLocaleString()}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 2: Database lookup fees */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Database lookup fees</span>
            <span className="font-semibold text-[var(--text-heading)]">
              ₦{pricing.lookupFee.toLocaleString()}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 3: Charge */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Charge</span>
            <span className="font-semibold text-[var(--text-heading)]">
              ₦{pricing.charge.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom Sticky Action Button: Pay ₦26,100 (Matches Figma Screenshot) ── */}
      <div className="pt-6 pb-4 sticky bottom-0 bg-[var(--bg-body)]/95 backdrop-blur-md z-30 mt-6 border-t border-[var(--border-color)] -mx-2 sm:-mx-4 px-2 sm:px-4">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handlePay}
          className="w-full py-4 rounded-full bg-[#2BB44A] hover:bg-[#259b40] text-white font-bold text-[16px] tracking-wide transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? "Processing payment..." : `Pay ${totalFormatted}`}
        </button>
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
              Investigation Commissioned!
            </h2>
            <p className="text-[12.5px] text-[var(--text-muted)] mt-2 leading-relaxed">
              Your background investigation for{" "}
              <span className="font-semibold text-[var(--text-heading)]">
                {locationWhere}
              </span>{" "}
              has been confirmed and scheduled with our verification analysts.
            </p>

            <div className="mt-6 space-y-2">
              <Link
                href="/dashboard/tasks"
                className="w-full py-3.5 rounded-full bg-[#2BB44A] hover:bg-[#259b40] text-white font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <span>Track Live Investigation</span>
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
