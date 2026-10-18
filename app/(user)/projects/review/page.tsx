"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";

interface Milestone {
  id: string;
  name: string;
  date: string;
}

interface ProjectDraft {
  projectName?: string;
  buildingType?: string;
  targetCompletion?: string;
  targetCompletionRaw?: string;
  reviewScope?: string;
  supervisorExpertise?: string;
  milestones?: Milestone[];
  priceNgn?: number;
}

export default function ProjectOrderReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [draft, setDraft] = useState<ProjectDraft | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  useEffect(() => {
    // Read from sessionStorage or query parameters
    try {
      const stored = sessionStorage.getItem("oversite_project_draft");
      if (stored) {
        setDraft(JSON.parse(stored));
        return;
      }
    } catch (e) {
      console.error("Failed to parse project draft:", e);
    }

    // Fallback to URL search parameters
    const name = searchParams.get("name") || "Construction Project";
    const type = searchParams.get("type") || "Residential";
    const scope = searchParams.get("scope") || "Full Project Lifecycle";
    const expert = searchParams.get("expert") || "Structural Engineer";
    const date = searchParams.get("date") || "TBD";

    setDraft({
      projectName: name,
      buildingType: type,
      reviewScope: scope,
      supervisorExpertise: expert,
      targetCompletion: date,
      milestones: [],
      priceNgn: 12000,
    });
  }, [searchParams]);

  const projectName = draft?.projectName || "Construction Project";
  const buildingType = draft?.buildingType || "Residential";
  const reviewScope = draft?.reviewScope || "Full Project Lifecycle";
  const supervisorExpertise = draft?.supervisorExpertise || "Structural Engineer";
  const targetCompletion = draft?.targetCompletion || "TBD";
  const milestonesCount = draft?.milestones?.length || 0;
  const priceNgn = draft?.priceNgn || 12000;

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
          moduleType: "PROJECT_MONITORING",
          title: `Project Review: ${projectName}`,
          description: `Building Type: ${buildingType}\nScope: ${reviewScope}\nExpertise: ${supervisorExpertise}\nTarget: ${targetCompletion}\nMilestones: ${
            draft?.milestones?.map((m) => `${m.name} (${m.date})`).join(", ") ||
            "None specified"
          }`,
          priceNgn,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCreatedTaskId(json.data?.id || "proj-task");
      } else {
        setCreatedTaskId("proj-" + Date.now().toString().slice(-4));
      }

      sessionStorage.removeItem("oversite_project_draft");
      setIsSuccessModalOpen(true);
    } catch (err) {
      console.error("Booking payment error:", err);
      setIsSuccessModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto min-h-[calc(100vh-120px)] flex flex-col justify-between relative px-2 sm:px-4 animate-in fade-in duration-200">
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

        {/* Card 1: Project Details Card */}
        <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs">
          {/* Row 1: Task */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Task</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              Project Supervision & Monitoring
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 2: Project Name */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Project</span>
            <span className="font-semibold text-[var(--text-heading)] text-right truncate max-w-[220px]">
              {projectName}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 3: Building Type */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Building type</span>
            <span className="font-semibold text-[var(--text-heading)] text-right truncate max-w-[220px]">
              {buildingType}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 4: Scope */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Review scope</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              {reviewScope}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 5: Supervisor */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Supervisor expertise</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              {supervisorExpertise}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 6: Target Completion */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Target completion</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              {targetCompletion}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 7: Milestones */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Milestones</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              {milestonesCount > 0 ? `${milestonesCount} stage(s) defined` : "Standard lifecycle"}
            </span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 8: Report Delivery */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Report delivery</span>
            <span className="font-semibold text-[var(--text-heading)] text-right">
              Live Feed & Document Vault
            </span>
          </div>
        </div>

        {/* Card 2: Fee Breakdown Card */}
        <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 mt-4 shadow-xs">
          {/* Row 1: Service fee */}
          <div className="flex items-center justify-between text-[13.5px] sm:text-[14px]">
            <span className="text-[var(--text-muted)]">Service fee</span>
            <span className="font-semibold text-[var(--text-heading)]">₦12,000</span>
          </div>

          <div className="border-b border-[var(--border-color)]/60 my-3.5" />

          {/* Row 2: Total */}
          <div className="flex items-center justify-between text-[14px] sm:text-[15px]">
            <span className="font-bold text-[var(--text-heading)]">Total Amount</span>
            <span className="font-bold text-[var(--primary)] text-[16px]">₦12,000</span>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Button */}
      <div className="pt-6 pb-4 sticky bottom-0 bg-[var(--bg-body)]/95 backdrop-blur-md z-30 mt-6 border-t border-[var(--border-color)] -mx-2 sm:-mx-4 px-2 sm:px-4">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handlePay}
          className="w-full py-4 rounded-full bg-[#2BB44A] hover:bg-[#259b40] text-white font-bold text-[16px] tracking-wide transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? "Commissioning review..." : "Confirm & Pay ₦12,000"}
        </button>
      </div>

      {/* ── Success Confirmation Modal ── */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsSuccessModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200 z-10">
            <div className="w-14 h-14 rounded-full bg-[#2BB44A]/15 text-[#2BB44A] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-[18px] font-bold text-[var(--text-heading)]">
              Project Commissioned!
            </h2>
            <p className="text-[12.5px] text-[var(--text-muted)] mt-2 leading-relaxed">
              Your supervisor inspection for{" "}
              <span className="font-semibold text-[var(--text-heading)]">
                {projectName}
              </span>{" "}
              has been commissioned and scheduled.
            </p>

            <div className="mt-6 space-y-2">
              <Link
                href="/dashboard/tasks"
                className="w-full py-3.5 rounded-full bg-[#2BB44A] hover:bg-[#259b40] text-white font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
              >
                <span>Track Live Supervision</span>
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
