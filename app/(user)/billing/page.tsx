"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, X } from "lucide-react";

function PaystackIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 8C6 6.5 10 6.5 13 8C16 9.5 20 9.5 22 8"
        stroke="#00C3F7"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M3 16C6 14.5 10 14.5 13 16C16 17.5 20 17.5 22 16"
        stroke="#00C3F7"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function BillingPage() {
  const router = useRouter();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);

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
              router.push("/more");
            }
          }}
          aria-label="Go back"
          className="absolute left-0 w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text-heading)]">
          Billing & Payment
        </h1>
      </div>

      {/* ── Current Plan Section ── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[13px] font-medium text-[var(--text-muted)]">
            Current plan
          </span>
          <span className="px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/30 text-[12px] font-medium">
            Starter plan
          </span>
        </div>

        <div className="flex items-baseline mb-2">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-heading)]">
            ₦5,000
          </span>
          <span className="text-[13px] text-[var(--text-muted)] ml-1 font-normal">
            /month
          </span>
        </div>

        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-6 max-w-sm">
          No monthly fee. You&apos;re only charged when you request a task.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/billing/plans"
            className="flex-1 py-3.5 px-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-[14px] text-center transition-all cursor-pointer shadow-xs active:scale-[0.99]"
          >
            Compare plan
          </Link>

          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="flex-1 py-3.5 px-4 rounded-full border border-red-500/70 hover:bg-red-500/10 active:scale-[0.99] text-red-500 dark:text-red-400 font-semibold text-[14px] text-center transition-all cursor-pointer"
          >
            {isCanceled ? "Resume Pro" : "Cancel Pro"}
          </button>
        </div>
      </div>

      {/* ── Payment Methods Section ── */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-[var(--text-heading)]">
            Payment methods
          </h2>
          <Link
            href="/billing/add-card"
            className="text-[13px] font-medium text-[var(--primary)] hover:opacity-80 transition-opacity cursor-pointer"
          >
            Add new
          </Link>
        </div>

        <div className="space-y-4">
          {/* Card 1 */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3.5">
              <PaystackIcon className="w-6 h-6 shrink-0" />
              <div>
                <p className="text-[14px] font-medium text-[var(--text-heading)]">
                  Paystack •••• 4471
                </p>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  Default card
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] text-[11px] font-medium">
              Card
            </span>
          </div>

          {/* Card 2 */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3.5">
              <PaystackIcon className="w-6 h-6 shrink-0" />
              <div>
                <p className="text-[14px] font-medium text-[var(--text-heading)]">
                  Paystack •••• 4471
                </p>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  Default card
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] text-[11px] font-medium">
              Backup
            </span>
          </div>
        </div>
      </div>

      {/* ── Payment History Section ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-[var(--text-heading)]">
            Payment History
          </h2>
          <Link
            href="/billing/history"
            className="text-[13px] font-medium text-[var(--primary)] hover:opacity-80 transition-opacity cursor-pointer"
          >
            See all
          </Link>
        </div>

        <div className="space-y-2">
          {/* Item 1 */}
          <Link
            href="/billing/receipt?service=Pro+subscription&amount=%E2%82%A65%2C000&txn=T83746192048591&date=Jul+19th%2C+2026+16%3A45"
            className="flex items-center justify-between py-2 px-2 hover:bg-[var(--bg-secondary)]/50 rounded-xl transition-colors cursor-pointer group"
          >
            <div>
              <p className="text-[14px] font-medium text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                Pro subscription
              </p>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Jul 19 • Paystack •••• 4471
              </p>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-semibold text-[var(--text-heading)]">
                ₦5,000
              </p>
              <p className="text-[11px] font-medium text-[var(--primary)] flex items-center justify-end gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                Paid
              </p>
            </div>
          </Link>

          {/* Item 2 */}
          <Link
            href="/billing/receipt?service=CAC+certified+copy&amount=%E2%82%A65%2C000&txn=T83746192048591&date=Jun+18th%2C+2026+14%3A20"
            className="flex items-center justify-between py-2 px-2 hover:bg-[var(--bg-secondary)]/50 rounded-xl transition-colors cursor-pointer group"
          >
            <div>
              <p className="text-[14px] font-medium text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                CAC certified copy
              </p>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Jun 18 • Paystack •••• 4471
              </p>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-semibold text-[var(--text-heading)]">
                ₦5,000
              </p>
              <p className="text-[11px] font-medium text-[var(--primary)] flex items-center justify-end gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                Paid
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Add Payment Method Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-t-[28px] sm:rounded-3xl border border-[var(--border-color)] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[var(--text-heading)]">
                Add payment method
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[13px] text-[var(--text-muted)] mb-5">
              Securely connect your debit card or Nigerian bank account via Paystack escrow protection.
            </p>
            <div className="space-y-3 mb-6">
              <input
                type="text"
                placeholder="Card Number"
                className="w-full px-4 py-3.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="MM / YY"
                  className="w-full px-4 py-3.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
                />
                <input
                  type="text"
                  placeholder="CVV"
                  className="w-full px-4 py-3.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowAddModal(false);
                showToast("Card linked securely via Paystack");
              }}
              className="w-full py-4 rounded-full bg-[#85e19e] hover:bg-[#74d38e] text-zinc-950 font-semibold text-[14px] transition-all cursor-pointer"
            >
              Authorize with Paystack
            </button>
          </div>
        </div>
      )}

      {/* ── Cancel Subscription Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-t-[28px] sm:rounded-3xl border border-[var(--border-color)] p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--text-heading)] mb-2">
              {isCanceled ? "Resume Pro Subscription?" : "Cancel Pro Subscription?"}
            </h3>
            <p className="text-[13px] text-[var(--text-muted)] mb-6 leading-relaxed">
              {isCanceled
                ? "You will regain access to priority dispatch, concurrent task execution, and 10% automatic discounts."
                : "You will retain Pro benefits until the end of your billing cycle on July 31, 2026. After that, your account will revert to the Starter plan."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] font-semibold text-[14px] cursor-pointer"
              >
                Keep Plan
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCanceled(!isCanceled);
                  setShowCancelModal(false);
                  showToast(isCanceled ? "Pro subscription resumed" : "Pro subscription canceled");
                }}
                className={`flex-1 py-3.5 rounded-full font-semibold text-[14px] cursor-pointer text-white ${
                  isCanceled ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)]" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {isCanceled ? "Resume" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
