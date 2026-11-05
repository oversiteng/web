"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, Check, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

type FilterStatus = "All" | "Paid" | "Pending" | "Failed";

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

const FILTER_OPTIONS: { id: FilterStatus; label: string }[] = [
  { id: "All", label: "All transactions" },
  { id: "Paid", label: "Paid / Captured" },
  { id: "Pending", label: "Pending" },
  { id: "Failed", label: "Failed" },
];

function getStatusBadge(status: string) {
  const norm = status.toUpperCase();
  if (norm === "CAPTURED" || norm === "RELEASED" || norm === "AUTHORIZED" || norm === "PAID") {
    return {
      label: "Paid",
      dot: "bg-[var(--primary)]",
      text: "text-[var(--primary)]",
    };
  }
  if (norm === "PENDING" || norm === "ESCROWED") {
    return {
      label: "Pending",
      dot: "bg-amber-500",
      text: "text-amber-500",
    };
  }
  return {
    label: "Failed",
    dot: "bg-red-500",
    text: "text-red-500",
  };
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("All");
  const [pendingFilter, setPendingFilter] = useState<FilterStatus>("All");

  useEffect(() => {
    async function loadPaymentHistory() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/payments/history?limit=100", {
          credentials: "include",
          headers,
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPayments(json.data);
        } else {
          setPayments([]);
        }
      } catch (err) {
        console.error("Failed to load payments history:", err);
        setPayments([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPaymentHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    if (activeFilter === "All") return payments;
    return payments.filter((item) => {
      const badge = getStatusBadge(item.status);
      return badge.label.toLowerCase() === activeFilter.toLowerCase();
    });
  }, [payments, activeFilter]);

  // Group by date (e.g. Month Year or Date)
  const groupedPayments = useMemo(() => {
    const groups: Record<string, PaymentHistoryItem[]> = {};
    filteredHistory.forEach((item) => {
      const d = new Date(item.createdAt);
      const groupName = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(item);
    });
    return groups;
  }, [filteredHistory]);

  const handleOpenFilter = () => {
    setPendingFilter(activeFilter);
    setFilterModalOpen(true);
  };

  const handleApplyFilter = () => {
    setActiveFilter(pendingFilter);
    setFilterModalOpen(false);
  };

  return (
    <div className="relative w-full text-[var(--text-heading)] pb-16 select-none">
      {/* ── Unified Page Header ── */}
      <PageHeader
        title="Payment History"
        showBack={true}
        onBack={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/billing");
          }
        }}
        rightSlot={
          <button
            type="button"
            onClick={handleOpenFilter}
            aria-label="Filter transactions"
            className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
          >
            <Filter className="w-4 h-4 stroke-[2]" />
          </button>
        }
      />

      {/* ── Active Filter Pill (if not All) ── */}
      {activeFilter !== "All" && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[12px] text-[var(--text-muted)]">Filtered by:</span>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[12px] font-medium text-[var(--text-heading)]">
            <span>{activeFilter}</span>
            <button
              type="button"
              onClick={() => setActiveFilter("All")}
              className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <DynamicLoadingState variant="documents" count={4} />
      ) : Object.keys(groupedPayments).length === 0 ? (
        <EmptyState
          preset="filter"
          action={{
            label: "Clear Filter",
            onClick: () => setActiveFilter("All"),
          }}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedPayments).map(([dateGroup, items]) => (
            <div key={dateGroup}>
              <h2 className="text-[12.5px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                {dateGroup}
              </h2>
              <div className="space-y-1">
                {items.map((item) => {
                  const badge = getStatusBadge(item.status);
                  const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const formattedAmount = `₦${item.amount.toLocaleString()}`;

                  return (
                    <Link
                      key={item.id}
                      href={`/billing/receipt?service=${encodeURIComponent(
                        item.taskTitle
                      )}&amount=${encodeURIComponent(formattedAmount)}&txn=${encodeURIComponent(
                        item.reference
                      )}&date=${encodeURIComponent(formattedDate)}`}
                      className="flex items-center justify-between py-3 px-2 hover:bg-[var(--bg-secondary)]/50 rounded-xl transition-colors cursor-pointer group"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors truncate">
                          {item.taskTitle}
                        </p>
                        <p className="text-[12px] text-[var(--text-muted)] mt-0.5 truncate">
                          {formattedDate} • {item.gateway} • {item.reference.slice(0, 14)}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[14px] font-bold text-[var(--text-heading)]">
                          {formattedAmount}
                        </p>
                        <p
                          className={`text-[11.5px] font-semibold flex items-center justify-end gap-1.5 mt-0.5 ${badge.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Modal / Bottom Sheet ── */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full sm:max-w-md bg-[var(--bg-card)] rounded-t-[28px] sm:rounded-2xl p-6 border border-[var(--border-color)] shadow-2xl animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-bold text-[var(--text-heading)]">
                Filter by Status
              </h3>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {FILTER_OPTIONS.map((opt) => {
                const isSelected = pendingFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPendingFilter(opt.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)] font-semibold"
                        : "border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[var(--text-heading)] font-normal"
                    }`}
                  >
                    <span className="text-[13.5px]">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[var(--primary)] stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="flex-1 py-3 px-4 rounded-full border border-[var(--border-color)] text-[var(--text-muted)] font-semibold text-[13.5px] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyFilter}
                className="flex-1 py-3 px-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-[13.5px] transition-all cursor-pointer shadow-xs"
              >
                Apply filter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
