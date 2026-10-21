"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";

type FilterStatus = "All" | "Paid" | "Pending" | "Failed";

interface PaymentRecord {
  id: string;
  title: string;
  meta: string;
  amount: string;
  status: "Paid" | "Pending" | "Failed";
  dateGroup: "July 17" | "August 1" | "August 10";
}

const HISTORY_DATA: PaymentRecord[] = [
  {
    id: "tx-1",
    title: "Pro subscription",
    meta: "Jul 19 • Paystack •••• 4471",
    amount: "₦5,000",
    status: "Paid",
    dateGroup: "July 17",
  },
  {
    id: "tx-2",
    title: "CAC certified copy",
    meta: "Jun 18 • Paystack •••• 4471",
    amount: "₦5,000",
    status: "Paid",
    dateGroup: "July 17",
  },
  {
    id: "tx-3",
    title: "Ikoyi site visit",
    meta: "Jun 18 • Paystack •••• 4471",
    amount: "₦5,000",
    status: "Paid",
    dateGroup: "July 17",
  },
  {
    id: "tx-4",
    title: "Business registration",
    meta: "Jul 30 • Paystack •••• 5678",
    amount: "₦3,000",
    status: "Pending",
    dateGroup: "August 1",
  },
  {
    id: "tx-5",
    title: "Lagos site visit",
    meta: "Jul 29 • Flutterwave •••• 1234",
    amount: "₦4,000",
    status: "Paid",
    dateGroup: "August 1",
  },
  {
    id: "tx-6",
    title: "Trademark registration",
    meta: "Aug 9 • Flutterwave •••• 3456",
    amount: "₦7,000",
    status: "Paid",
    dateGroup: "August 10",
  },
  {
    id: "tx-7",
    title: "Abuja site visit",
    meta: "Aug 8 • Paystack •••• 8910",
    amount: "₦6,000",
    status: "Pending",
    dateGroup: "August 10",
  },
];

const FILTER_OPTIONS: { id: FilterStatus; label: string }[] = [
  { id: "All", label: "All transactions" },
  { id: "Paid", label: "Paid / Success" },
  { id: "Pending", label: "Pending" },
  { id: "Failed", label: "Failed" },
];

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("All");
  const [pendingFilter, setPendingFilter] = useState<FilterStatus>("All");

  const filteredHistory = useMemo(() => {
    if (activeFilter === "All") return HISTORY_DATA;
    return HISTORY_DATA.filter((item) => item.status === activeFilter);
  }, [activeFilter]);

  const groups: ("July 17" | "August 1" | "August 10")[] = [
    "July 17",
    "August 1",
    "August 10",
  ];

  const handleOpenFilter = () => {
    setPendingFilter(activeFilter);
    setFilterModalOpen(true);
  };

  const handleApplyFilter = () => {
    setActiveFilter(pendingFilter);
    setFilterModalOpen(false);
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-16 select-none">
      {/* ── Top Header ── */}
      <div className="relative flex items-center justify-between py-3 mb-6">
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
          className="w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text-heading)]">
          Payment History
        </h1>

        <button
          type="button"
          onClick={handleOpenFilter}
          aria-label="Filter payment history"
          className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer -mr-1 shadow-xs"
        >
          <SlidersHorizontal className="w-4 h-4 stroke-[2]" />
        </button>
      </div>

      {/* ── Grouped Payment Items matching Screenshot 4 ── */}
      <div className="space-y-8">
        {groups.map((group) => {
          const items = filteredHistory.filter((i) => i.dateGroup === group);
          if (items.length === 0) return null;

          return (
            <div key={group} className="space-y-3">
              {/* Group Title */}
              <h2 className="text-[14px] font-semibold text-[var(--text-heading)] px-1">
                {group}
              </h2>

              {/* Card Container around date group items */}
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] divide-y divide-[var(--border-color)] overflow-hidden shadow-xs">
                {items.map((item) => {
                  const isPaid = item.status === "Paid";
                  const isPending = item.status === "Pending";
                  const receiptUrl = `/billing/receipt?service=${encodeURIComponent(
                    item.title
                  )}&amount=${encodeURIComponent(
                    item.amount
                  )}&txn=T83746192048591&date=${encodeURIComponent(
                    item.meta
                  )}&status=${encodeURIComponent(item.status)}`;

                  return (
                    <Link
                      key={item.id}
                      href={receiptUrl}
                      className="block p-4 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[14px] font-medium text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                            {item.title}
                          </p>
                          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                            {item.meta}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[14px] font-semibold text-[var(--text-heading)]">
                            {item.amount}
                          </p>
                          <p
                            className={`text-[11px] font-medium flex items-center justify-end gap-1.5 mt-0.5 ${
                              isPaid
                                ? "text-emerald-500 dark:text-emerald-400"
                                : isPending
                                ? "text-amber-500 dark:text-amber-400"
                                : "text-red-500"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isPaid
                                  ? "bg-emerald-500"
                                  : isPending
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                            />
                            {item.status}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredHistory.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-[14px] text-[var(--text-muted)]">
              No payment records found for &quot;{activeFilter}&quot;.
            </p>
          </div>
        )}
      </div>

      {/* ── Filter Bottom Sheet Modal matching Screenshot 4 ── */}
      {filterModalOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs transition-opacity flex items-end justify-center"
          onClick={() => setFilterModalOpen(false)}
        >
          <div
            className="w-full max-w-full md:max-w-[600px] xl:max-w-[650px] bg-[var(--bg-card)] rounded-t-[32px] border-t border-[var(--border-color)] p-6 sm:p-8 shadow-2xl animate-in slide-in-from-bottom-6 transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle */}
            <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mx-auto -mt-2 mb-4" />

            {/* Title */}
            <h3 className="text-center text-[17px] sm:text-[18px] font-bold text-[var(--text-heading)] mb-6">
              Filter status
            </h3>

            {/* Radio Options List */}
            <div className="space-y-4 mb-8">
              {FILTER_OPTIONS.map((opt) => {
                const isSelected = pendingFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPendingFilter(opt.id)}
                    className="w-full flex items-center gap-3.5 py-2 cursor-pointer text-left group"
                  >
                    {/* Radio Circle */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "border-2 border-[var(--primary)]"
                          : "border-2 border-[var(--border-color)] group-hover:border-[var(--text-muted)]"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`text-[15px] font-medium transition-colors ${
                        isSelected
                          ? "text-[var(--text-heading)] font-semibold"
                          : "text-[var(--text-body)] group-hover:text-[var(--text-heading)]"
                      }`}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Apply Filter Button */}
            <div>
              <button
                type="button"
                onClick={handleApplyFilter}
                className="py-3 px-7 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-[14px] shadow-sm active:scale-[0.99] transition-all cursor-pointer"
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
