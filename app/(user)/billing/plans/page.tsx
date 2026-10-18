"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Check } from "lucide-react";

export default function PlansPage() {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-16 select-none">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[#2BB44A]/20 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[#2BB44A] stroke-[3]" />
            </div>
            <span className="text-[13px] font-medium tracking-wide truncate">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="relative flex items-center justify-center py-3 mb-6">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/billing");
            }
          }}
          aria-label="Go back"
          className="absolute left-0 w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text-heading)]">
          Plans
        </h1>
      </div>

      {/* ── Plans List ── */}
      <div className="space-y-12">
        {/* ── Plan 1: Starter Plan (Current) ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-medium text-[var(--text-muted)]">
              Current plan
            </span>
            <span className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] text-[12px] font-medium">
              Starter plan
            </span>
          </div>

          <div className="flex items-baseline mb-1">
            <span className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
              ₦5,000
            </span>
            <span className="text-[13px] text-[var(--text-muted)] ml-1 font-normal">
              /month
            </span>
          </div>

          <p className="text-[13px] text-[var(--text-muted)] mb-5">
            Pay per task, no commitment.
          </p>

          {/* Features */}
          <div className="space-y-3.5 mb-6">
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              <span className="text-[13.5px] text-[var(--text-heading)] font-normal">
                Access to all 7 service oversite modules
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              <span className="text-[13.5px] text-[var(--text-heading)] font-normal">
                Standard dispatch, 24-48 hours
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              <span className="text-[13.5px] text-[var(--text-heading)] font-normal">
                Message your agent directly
              </span>
            </div>
          </div>

          {/* Disabled Button */}
          <button
            type="button"
            disabled
            className="w-full py-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] text-[14px] font-medium cursor-not-allowed opacity-80"
          >
            You&apos;re on this plan
          </button>
        </div>

        {/* ── Plan 2: Pro (Most popular) ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-semibold text-[var(--text-heading)]">
              Pro
            </span>
            <span className="px-3 py-1 rounded-full bg-[#eaf7ee] text-[#187534] border border-emerald-200/60 dark:border-transparent dark:bg-[#0e3b1c] dark:text-[#2BB44A] text-[12px] font-medium">
              Most popular
            </span>
          </div>

          <div className="flex items-baseline mb-1">
            <span className="text-3xl font-bold tracking-tight text-[var(--text-heading)]">
              ₦15,000
            </span>
            <span className="text-[13px] text-[var(--text-muted)] ml-1 font-normal">
              /month
            </span>
          </div>

          <p className="text-[13px] text-[var(--text-muted)] mb-5">
            For frequent tasks and faster turnaround.
          </p>

          {/* Features */}
          <div className="space-y-3.5 mb-6">
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              <span className="text-[13.5px] text-[var(--text-heading)] font-normal">
                Priority dispatch, often same-day
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              <span className="text-[13.5px] text-[var(--text-heading)] font-normal">
                Run up to 3 tasks at once
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              <span className="text-[13.5px] text-[var(--text-heading)] font-normal">
                10% off every task, automatically
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              <span className="text-[13.5px] text-[var(--text-heading)] font-normal">
                Dedicated relationship manager
              </span>
            </div>
          </div>

          {/* Upgrade Button */}
          <button
            type="button"
            onClick={() => showToast("Upgraded to Pro plan successfully!")}
            className="w-full py-4 rounded-full bg-[#85e19e] hover:bg-[#74d38e] active:scale-[0.99] text-zinc-950 text-[14px] font-semibold transition-all cursor-pointer shadow-xs"
          >
            Upgrade to Pro
          </button>
        </div>

        {/* ── Plan 3: Enterprise ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-semibold text-[var(--text-heading)]">
              Enterprise
            </span>
            <span className="px-3 py-1 rounded-full bg-[#eaf7ee] text-[#187534] border border-emerald-200/60 dark:border-transparent dark:bg-[#0e3b1c] dark:text-[#2BB44A] text-[12px] font-medium">
              For teams
            </span>
          </div>

          <div className="flex items-baseline mb-1">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-heading)]">
              Custom pricing
            </span>
          </div>

          <p className="text-[13px] text-[var(--text-muted)] mb-5">
            For agencies, developers & organizations managing multiple clients or properties.
          </p>

          {/* Features */}
          <div className="space-y-3.5 mb-6">
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              <span className="text-[13.5px] text-[var(--text-heading)] font-normal">
                Volume pricing across tracks
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              <span className="text-[13.5px] text-[var(--text-heading)] font-normal">
                Dedicated relationship manager & SLAs
              </span>
            </div>
          </div>

          {/* Talk to Sales Button */}
          <button
            type="button"
            onClick={() => showToast("Sales team notified. We will reach out shortly.")}
            className="w-full py-4 rounded-full border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] active:scale-[0.99] text-[var(--text-heading)] text-[14px] font-medium transition-all cursor-pointer"
          >
            Talk to sales
          </button>
        </div>
      </div>
    </div>
  );
}
