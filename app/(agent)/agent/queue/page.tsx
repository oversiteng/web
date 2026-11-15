"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency, formatTimeAgo, getModuleName } from "@/lib/utils";
import { AgentTopNav } from "@/components/agent/AgentTopNav";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Check,
  Info,
  Loader2,
  Inbox,
  AlertTriangle,
} from "lucide-react";

export interface QueueOffer {
  id: string;
  moduleType: string;
  title: string;
  description?: string | null;
  locationAddress?: string | null;
  priceNgn?: number | string | null;
  createdAt: string;
  status: string;
}

export default function AgentQueuePage() {
  const [filter, setFilter] = useState<"ALL" | "HIGHEST" | "SOONEST">("ALL");
  const [offers, setOffers] = useState<QueueOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedOffer, setSelectedOffer] = useState<QueueOffer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [confirmedOffer, setConfirmedOffer] = useState<QueueOffer | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/tasks?status=PENDING,MATCHED", {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOffers(json.data);
        } else {
          setOffers([]);
        }
      }
    } catch (err) {
      console.error("Queue fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleDecline = async (offerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`/api/v1/tasks/${offerId}/respond`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ action: "REJECT", reason: "Declined by operative" }),
      });

      setOffers((prev) => prev.filter((o) => o.id !== offerId));
      setIsDetailOpen(false);
      setSelectedOffer(null);
      showToast("Offer removed from your queue.");
    } catch {
      showToast("Network error. Could not decline.");
    }
  };

  const handleInitiateAccept = (offer: QueueOffer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOffer(offer);
    setIsDetailOpen(false);
    setIsConfirmOpen(true);
  };

  const handleConfirmAccept = async () => {
    if (!selectedOffer) return;
    setActionLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${selectedOffer.id}/accept`, {
        method: "POST",
        credentials: "include",
        headers,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setConfirmedOffer(selectedOffer);
        setOffers((prev) => prev.filter((o) => o.id !== selectedOffer.id));
        setIsConfirmOpen(false);
        setIsSuccessOpen(true);
      } else {
        showToast(json?.error?.message || "Could not accept task.");
      }
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = (offer: QueueOffer) => {
    setSelectedOffer(offer);
    setIsDetailOpen(true);
  };

  // Filter offers
  const filteredOffers = [...offers].sort((a, b) => {
    const payA = Number(a.priceNgn || 0);
    const payB = Number(b.priceNgn || 0);
    if (filter === "HIGHEST") return payB - payA;
    if (filter === "SOONEST") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return 0;
  });

  return (
    <div className="space-y-4 max-w-full pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-card)] text-[var(--text-heading)] border border-[var(--border-color)] font-semibold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Unified Agent Top Navigation Bar ── */}
      <AgentTopNav
        title="Queue"
        subtitle="Live dispatch offers awaiting operative acceptance"
      />

      {/* ── 2. Filter Pills Row ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "ALL"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xs"
          }`}
        >
          All ({offers.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("HIGHEST")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "HIGHEST"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xs"
          }`}
        >
          Highest pay
        </button>
        <button
          type="button"
          onClick={() => setFilter("SOONEST")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "SOONEST"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xs"
          }`}
        >
          Earliest
        </button>
      </div>

      {/* ── 3. Offers List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-xs text-[var(--text-muted)]">Scanning active dispatch corridors...</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-md p-10 text-center space-y-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
          <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-[var(--text-heading)] font-bold text-sm">Queue is currently clear</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            New inspection tasks matching your tier and coverage area will appear here in real time. Keep your status Online.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              onClick={() => openDetail(offer)}
              className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 space-y-3 transition-all hover:border-[var(--primary-border)] shadow-[0_0_10px_rgba(0,0,0,0.03)] cursor-pointer"
            >
              {/* Category + Priority Pill */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)] font-medium">
                  {getModuleName(offer.moduleType)}
                </span>
                <span className="bg-[var(--primary-light)] border border-[var(--primary-border)] text-[var(--primary)] text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono font-medium">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeAgo(offer.createdAt)}</span>
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-base font-semibold text-[var(--text-heading)] leading-snug">{offer.title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1 line-clamp-2">
                  {offer.description || "Field verification, boundary assessment and geo-tagged audit report required."}
                </p>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span className="truncate">{offer.locationAddress || "Coverage LGA Verified"}</span>
                </span>
              </div>

              {/* Bottom Action Bar: Price + Decline + Accept */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                <div className="text-base font-bold text-[var(--primary)]">
                  {offer.priceNgn ? formatCurrency(offer.priceNgn) : "₦10,000"}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDecline(offer.id, e)}
                    className="px-5 py-2 rounded-2xl bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] hover:bg-[var(--border-color)]/40 text-[var(--text-heading)] text-xs font-semibold border border-[var(--border-color)] transition-all cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleInitiateAccept(offer, e)}
                    className="px-6 py-2 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL 1: Task Inspection Detail Sheet (Drawer on Mobile, Modal on Desktop) ── */}
      {isDetailOpen && selectedOffer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsDetailOpen(false)}
        >
          <div
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] w-full max-w-[650px] rounded-t-[32px] sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />

            {/* Top Bar with Category */}
            <div className="flex items-center justify-between">
              <span className="bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)] text-xs px-3 py-1 rounded-full font-medium">
                {getModuleName(selectedOffer.moduleType)}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                Created {formatTimeAgo(selectedOffer.createdAt)}
              </span>
            </div>

            {/* Title & Desc */}
            <div>
              <h2 className="text-lg font-bold text-[var(--text-heading)]">{selectedOffer.title}</h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                {selectedOffer.description || "Accredited on-site inspection and verified deliverable submission required."}
              </p>
            </div>

            {/* Payout & Secured Payment Assurance */}
            <div className="bg-[var(--primary-light)]/40 border border-[var(--primary-border)] rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--text-muted)] block font-medium">Mission Payout</span>
                <span className="text-2xl font-black text-[var(--primary)]">
                  {selectedOffer.priceNgn ? formatCurrency(selectedOffer.priceNgn) : "₦10,000"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Secured Payment
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">Instant wallet release upon QA</span>
              </div>
            </div>

            {/* Mission Details Cards */}
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Site Address:</span>
                <span className="font-semibold text-[var(--text-heading)] truncate max-w-[240px]">
                  {selectedOffer.locationAddress || "Geofenced coordinates verified"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Deliverables:</span>
                <span className="font-semibold text-[var(--text-heading)]">Geo-photos + On-site Checklist</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleDecline(selectedOffer.id, e)}
                className="flex-1 py-3 rounded-2xl bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] hover:bg-[var(--border-color)] text-[var(--text-heading)] text-xs font-semibold border border-[var(--border-color)] transition-all cursor-pointer"
              >
                Decline Offer
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  setIsConfirmOpen(true);
                }}
                className="flex-1 py-3 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Accept Mission
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Confirmation Dialog (Drawer on Mobile, Modal on Desktop) ── */}
      {isConfirmOpen && selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] w-full max-w-sm rounded-t-[32px] sm:rounded-3xl p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />

            <h3 className="text-base font-bold text-[var(--text-heading)]">Claim Mission</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              By claiming this mission, you commit to arriving on-site within SLA guidelines and submitting accredited photographic deliverables.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-2xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-xs font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Accept"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Success Dialog (Drawer on Mobile, Modal on Desktop) ── */}
      {isSuccessOpen && confirmedOffer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] w-full max-w-sm rounded-t-[32px] sm:rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            {/* Mobile Drag Handle */}
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />

            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-heading)]">Mission Accepted!</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              &quot;{confirmedOffer.title}&quot; has been assigned to your active tasks. Status advanced to AGENT_EN_ROUTE.
            </p>
            <div className="pt-2">
              <Link
                href={`/agent/tasks/${confirmedOffer.id}`}
                className="w-full py-3 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-xs font-bold text-white transition-colors shadow-xs inline-block"
              >
                Open Mission in Tasks
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
