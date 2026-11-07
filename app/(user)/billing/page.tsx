"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X, CreditCard } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

function PaystackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="6" fill="#0BA4DB" />
      <path
        d="M6 8.5H18M6 12H18M6 15.5H13"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SavedPaymentMethod {
  id: string;
  brand: string;
  cardType?: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  bank?: string | null;
  isDefault: boolean;
  createdAt?: string;
}

interface PaymentHistoryItem {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  taskTitle: string;
  createdAt: string;
}

export default function BillingPage() {
  const router = useRouter();

  const [methods, setMethods] = useState<SavedPaymentMethod[]>([]);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceled, setIsCanceled] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadBillingData() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const [methodsRes, historyRes] = await Promise.all([
          fetch("/api/v1/payments/methods", { credentials: "include", headers }),
          fetch("/api/v1/payments/history?limit=3", { credentials: "include", headers }),
        ]);

        const methodsJson = await methodsRes.json();
        if (methodsJson.success && Array.isArray(methodsJson.data)) {
          setMethods(methodsJson.data);
        }

        const historyJson = await historyRes.json();
        if (historyJson.success && Array.isArray(historyJson.data)) {
          setHistory(historyJson.data);
        }
      } catch (err) {
        console.error("Failed to load billing data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBillingData();
  }, []);

  return (
    <div className="relative w-full text-[var(--text-heading)] pb-16 select-none">
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

      {/* ── Unified Page Header ── */}
      <PageHeader
        title="Billing & Payment"
        showBack={true}
        onBack={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/more");
          }
        }}
      />

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
            ₦0
          </span>
          <span className="text-[13px] text-[var(--text-muted)] ml-1 font-normal">
            /month
          </span>
        </div>

        <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mb-6 max-w-sm">
          Pay per task with Secured Payment guarantee. No subscription lock-in.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/billing/plans"
            className="flex-1 py-3.5 px-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-[14px] text-center transition-all cursor-pointer shadow-xs active:scale-[0.99]"
          >
            Compare plans
          </Link>

          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="flex-1 py-3.5 px-4 rounded-full border border-red-500/70 hover:bg-red-500/10 active:scale-[0.99] text-red-500 dark:text-red-400 font-semibold text-[14px] text-center transition-all cursor-pointer"
          >
            {isCanceled ? "Resume Membership" : "Manage Membership"}
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

        {isLoading ? (
          <DynamicLoadingState variant="documents" count={2} />
        ) : methods.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)]">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[13.5px] font-medium text-[var(--text-heading)]">No payment card added</p>
                <p className="text-[12px] text-[var(--text-muted)]">Save a card to enable one-tap task bookings</p>
              </div>
            </div>
            <Link
              href="/billing/add-card"
              className="text-[12px] font-bold px-3 py-1.5 rounded-full bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
            >
              Add Card
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/70 shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <PaystackIcon className="w-7 h-7 shrink-0" />
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--text-heading)]">
                      {method.brand.toUpperCase()} •••• {method.last4}
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                      Expires {method.expiryMonth}/{method.expiryYear} {method.bank ? `· ${method.bank}` : ""}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] text-[11px] font-medium">
                  {method.isDefault ? "Default" : "Backup"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Payment History Section ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-[var(--text-heading)]">
            Recent Transactions
          </h2>
          <Link
            href="/billing/history"
            className="text-[13px] font-medium text-[var(--primary)] hover:opacity-80 transition-opacity cursor-pointer"
          >
            See all
          </Link>
        </div>

        {isLoading ? (
          <DynamicLoadingState variant="documents" count={2} />
        ) : history.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
            No transaction records found. Bookings and escrow disbursements will appear here.
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((tx) => {
              const formattedDate = new Date(tx.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              const formattedAmount = `₦${tx.amount.toLocaleString()}`;

              return (
                <Link
                  key={tx.id}
                  href={`/billing/receipt?service=${encodeURIComponent(
                    tx.taskTitle
                  )}&amount=${encodeURIComponent(formattedAmount)}&txn=${encodeURIComponent(
                    tx.reference
                  )}&date=${encodeURIComponent(formattedDate)}`}
                  className="flex items-center justify-between py-2.5 px-3 hover:bg-[var(--bg-secondary)]/50 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="min-w-0 pr-4">
                    <p className="text-[13.5px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors truncate">
                      {tx.taskTitle}
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)] mt-0.5 truncate">
                      {formattedDate} • {tx.gateway} • {tx.reference.slice(0, 14)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-bold text-[var(--text-heading)]">
                      {formattedAmount}
                    </p>
                    <p className="text-[11px] font-medium text-[var(--primary)] flex items-center justify-end gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                      {tx.status}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Cancel Membership Modal ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text-heading)] mb-2">
              Membership Preferences
            </h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
              You are currently on the pay-per-task Starter Tier. No monthly recurring fees are charged.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-full border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCanceled(!isCanceled);
                  setShowCancelModal(false);
                  showToast("Preferences saved.");
                }}
                className="flex-1 py-2.5 rounded-full bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
