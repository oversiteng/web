"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Check, Loader2 } from "lucide-react";

export default function PlansPage() {
  const router = useRouter();
  const [currentTier, setCurrentTier] = useState<"STARTER" | "PRO" | "ENTERPRISE">("STARTER");
  const [loading, setLoading] = useState(true);
  const [upgradingTier, setUpgradingTier] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function fetchCurrentSubscription() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/subscriptions/current", {
          credentials: "include",
          headers,
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.data?.tier) {
            setCurrentTier(json.data.tier);
          }
        }
      } catch (err) {
        console.error("Failed to load subscription:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCurrentSubscription();
  }, []);

  const handleUpgrade = async (tier: "PRO" | "ENTERPRISE") => {
    setUpgradingTier(tier);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/subscriptions/upgrade", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ tier }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (tier === "PRO") {
          setCurrentTier("PRO");
        }
        showToast(json.message || `Upgraded to ${tier} successfully!`);
      } else {
        showToast(json?.error?.message || "Could not process plan request.");
      }
    } catch (err) {
      showToast("Network error. Please try again.");
    } finally {
      setUpgradingTier(null);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-16 select-none">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
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
          Plans & Memberships
        </h1>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
        </div>
      )}

      {/* ── Plans List ── */}
      <div className="space-y-12">
        {/* ── Plan 1: Starter Plan ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-medium text-[var(--text-muted)]">
              {currentTier === "STARTER" ? "Current plan" : "Basic tier"}
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
            Pay per task, standard turnaround, no long-term commitment.
          </p>

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

          <button
            type="button"
            disabled={currentTier === "STARTER"}
            className="w-full py-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] text-[14px] font-medium cursor-not-allowed opacity-80"
          >
            {currentTier === "STARTER" ? "You're on this plan" : "Default Starter"}
          </button>
        </div>

        {/* ── Plan 2: Pro (Most popular) ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-semibold text-[var(--text-heading)]">
              Pro
            </span>
            <span className="px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/30 text-[12px] font-medium">
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
            For frequent tasks, multiple properties and priority turnaround.
          </p>

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

          {currentTier === "PRO" ? (
            <button
              type="button"
              disabled
              className="w-full py-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] text-[14px] font-medium cursor-not-allowed opacity-80"
            >
              You&apos;re on this plan
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleUpgrade("PRO")}
              disabled={upgradingTier === "PRO"}
              className="w-full py-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-[0.99] text-white text-[14px] font-semibold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              {upgradingTier === "PRO" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                "Upgrade to Pro"
              )}
            </button>
          )}
        </div>

        {/* ── Plan 3: Enterprise ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-semibold text-[var(--text-heading)]">
              Enterprise
            </span>
            <span className="px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/30 text-[12px] font-medium">
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

          <div className="space-y-3.5 mb-6">
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              <span className="text-[13.5px] text-[var(--text-heading)] font-normal">
                Volume pricing across all 7 tracks
              </span>
            </div>
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              <span className="text-[13.5px] text-[var(--text-heading)] font-normal">
                Dedicated relationship manager & guaranteed SLAs
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleUpgrade("ENTERPRISE")}
            disabled={upgradingTier === "ENTERPRISE"}
            className="w-full py-4 rounded-full border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] active:scale-[0.99] text-[var(--text-heading)] text-[14px] font-medium transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {upgradingTier === "ENTERPRISE" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Submitting request...</span>
              </>
            ) : (
              "Talk to sales"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
