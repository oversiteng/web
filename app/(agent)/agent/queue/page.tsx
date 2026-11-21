"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatTimeAgo, getModuleName } from "@/lib/utils";
import { AgentTopNav } from "@/components/agent/AgentTopNav";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Check,
  Loader2,
  Inbox,
  Send,
  X,
  UserCheck,
  Sparkles,
} from "lucide-react";

export interface QueueOffer {
  id: string;
  moduleType: string;
  title: string;
  description?: string | null;
  locationAddress?: string | null;
  priceNgn?: number | string | null;
  agentPayoutNgn?: number | string | null;
  agentTargetHours?: number | null;
  agentId?: string | null;
  formData?: Record<string, any> | null;
  createdAt: string;
  updatedAt?: string;
  status: string;
}

function getAcceptanceTimeRemaining(offer: QueueOffer): string {
  const fd = offer.formData || {};
  const deadlineIso = fd.acceptanceDeadline;
  const fallbackBase = fd.assignedAt || offer.updatedAt || offer.createdAt;
  const windowHrs = typeof fd.acceptanceWindowHours === "number" ? fd.acceptanceWindowHours : 2;
  const deadlineMs = deadlineIso
    ? new Date(deadlineIso).getTime()
    : new Date(fallbackBase).getTime() + windowHrs * 60 * 60 * 1000;
  const diffMs = deadlineMs - Date.now();
  if (diffMs <= 0) return "Window expiring";
  const mins = Math.ceil(diffMs / 60000);
  if (mins < 60) return `${mins}m left to accept`;
  const hrs = (mins / 60).toFixed(1).replace(/\.0$/, "");
  return `${hrs}h left to accept`;
}

export default function AgentQueuePage() {
  const { user } = useAuth();
  const [queueTab, setQueueTab] = useState<"ASSIGNED" | "AVAILABLE">("ASSIGNED");
  const [filter, setFilter] = useState<"ALL" | "HIGHEST" | "SOONEST">("ALL");
  const [offers, setOffers] = useState<QueueOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedOffer, setSelectedOffer] = useState<QueueOffer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeclineOpen, setIsDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyPitch, setApplyPitch] = useState("");
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [confirmedOffer, setConfirmedOffer] = useState<QueueOffer | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/tasks?queue=true&status=PENDING,MATCHED", {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOffers(json.data);
          const hasAssigned = json.data.some(
            (t: QueueOffer) => t.agentId && t.status === "MATCHED"
          );
          if (!hasAssigned && json.data.length > 0) {
            setQueueTab("AVAILABLE");
          }
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

  const assignedOffers = useMemo(
    () =>
      offers.filter(
        (o) => Boolean(o.agentId) && (o.agentId === user?.id || o.status === "MATCHED")
      ),
    [offers, user?.id]
  );

  const availablePoolOffers = useMemo(
    () => offers.filter((o) => !o.agentId && o.status === "PENDING"),
    [offers]
  );

  const activeList = queueTab === "ASSIGNED" ? assignedOffers : availablePoolOffers;

  const filteredOffers = useMemo(() => {
    return [...activeList].sort((a, b) => {
      const payA = Number(a.agentPayoutNgn ?? a.priceNgn ?? 0);
      const payB = Number(b.agentPayoutNgn ?? b.priceNgn ?? 0);
      if (filter === "HIGHEST") return payB - payA;
      if (filter === "SOONEST")
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return 0;
    });
  }, [activeList, filter]);

  const handleOpenDeclineModal = (offer: QueueOffer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOffer(offer);
    setDeclineReason("");
    setIsDetailOpen(false);
    setIsDeclineOpen(true);
  };

  const handleConfirmDecline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !declineReason.trim()) return;
    setActionLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${selectedOffer.id}/respond`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          action: "REJECT",
          reason: declineReason.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setOffers((prev) => prev.filter((o) => o.id !== selectedOffer.id));
        setIsDeclineOpen(false);
        setSelectedOffer(null);
        showToast("Assignment declined. Task returned to open matching pool.");
      } else {
        showToast(json?.error?.message || "Could not decline assignment.");
      }
    } catch {
      showToast("Network error. Could not decline.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenApplyModal = (offer: QueueOffer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOffer(offer);
    setApplyPitch("");
    setIsDetailOpen(false);
    setIsApplyOpen(true);
  };

  const handleConfirmApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOffer || !applyPitch.trim()) return;
    setActionLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${selectedOffer.id}/respond`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          action: "APPLY",
          reason: applyPitch.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsApplyOpen(false);
        await fetchQueue();
        showToast("Application submitted to Central Operations!");
      } else {
        showToast(json?.error?.message || "Could not submit application.");
      }
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setActionLoading(false);
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

      const res = await fetch(`/api/v1/tasks/${selectedOffer.id}/respond`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ action: "ACCEPT" }),
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

  return (
    <div className="space-y-4 max-w-full pb-24 sm:pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-card)] text-[var(--text-heading)] border border-[var(--border-color)] font-semibold text-xs px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── 1. Unified Agent Top Navigation Bar ── */}
      <AgentTopNav
        title="Dispatch Queue"
        subtitle="Direct task invitations & open corridor pool"
      />

      {/* ── 2. Primary 2-Tab Switcher: Assigned to You vs Available Tasks ── */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => setQueueTab("ASSIGNED")}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            queueTab === "ASSIGNED"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Assigned to You</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
              queueTab === "ASSIGNED"
                ? "bg-white/20 text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-heading)]"
            }`}
          >
            {assignedOffers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setQueueTab("AVAILABLE")}
          className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            queueTab === "AVAILABLE"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Available Tasks</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
              queueTab === "AVAILABLE"
                ? "bg-white/20 text-white"
                : "bg-[var(--bg-secondary)] text-[var(--text-heading)]"
            }`}
          >
            {availablePoolOffers.length}
          </span>
        </button>
      </div>

      {/* ── 3. Sort Filter Pills Row ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "ALL"
              ? "bg-[var(--text-heading)] text-[var(--bg-card)] shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)]"
          }`}
        >
          All ({activeList.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("HIGHEST")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "HIGHEST"
              ? "bg-[var(--text-heading)] text-[var(--bg-card)] shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)]"
          }`}
        >
          Highest pay
        </button>
        <button
          type="button"
          onClick={() => setFilter("SOONEST")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "SOONEST"
              ? "bg-[var(--text-heading)] text-[var(--bg-card)] shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)]"
          }`}
        >
          Earliest
        </button>
      </div>

      {/* ── 4. Offers List ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[260px] gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-xs text-[var(--text-muted)]">Scanning active dispatch corridors...</p>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-[var(--text-heading)] font-bold text-sm">
            {queueTab === "ASSIGNED"
              ? "No direct task invitations right now"
              : "No unassigned tasks in the open pool"}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
            {queueTab === "ASSIGNED"
              ? "When Central Operations assigns a task directly to you, it will appear here with a 2-hour acceptance window. Check the Available Tasks tab to apply for open missions."
              : "New unassigned inspection tasks matching your coverage corridor will appear here in real time."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOffers.map((offer) => {
            const isDirectAssignment = Boolean(offer.agentId);
            const payout = Number(offer.agentPayoutNgn ?? offer.priceNgn ?? 10000);
            const hasApplied =
              Array.isArray(offer.formData?.applications) &&
              offer.formData.applications.some((a: any) => a?.agentId === user?.id);

            return (
              <div
                key={offer.id}
                onClick={() => openDetail(offer)}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 sm:p-5 space-y-3 transition-all hover:border-[var(--primary-border)] shadow-xs cursor-pointer"
              >
                {/* Category + Countdown / Timestamp Pill */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs text-[var(--text-muted)] font-semibold">
                    {getModuleName(offer.moduleType)}
                  </span>
                  {isDirectAssignment ? (
                    <span className="bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] px-2.5 py-0.5 rounded-md flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3" />
                      <span>{getAcceptanceTimeRemaining(offer)}</span>
                    </span>
                  ) : (
                    <span className="bg-[var(--primary-light)] border border-[var(--primary-border)] text-[var(--primary)] text-[11px] px-2.5 py-0.5 rounded-md flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      <span>Posted {formatTimeAgo(offer.createdAt)}</span>
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-[var(--text-heading)] leading-snug">
                    {offer.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1 line-clamp-2">
                    {offer.description ||
                      "Field verification, boundary assessment and geo-tagged audit report required."}
                  </p>
                </div>

                {/* Location */}
                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] pt-0.5">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                    <span className="truncate">
                      {offer.locationAddress || "Coverage LGA Verified"}
                    </span>
                  </span>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                  <div>
                    <span className="block text-[10.5px] text-[var(--text-muted)]">
                      Operative Payout
                    </span>
                    <span className="text-base font-bold text-[var(--primary)]">
                      {formatCurrency(payout)}
                    </span>
                  </div>

                  {isDirectAssignment ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleOpenDeclineModal(offer, e)}
                        className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] hover:bg-red-500/10 hover:text-red-500 text-[var(--text-heading)] text-xs font-semibold border border-[var(--border-color)] transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleInitiateAccept(offer, e)}
                        className="px-5 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Accept Task
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {hasApplied ? (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Applied</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleOpenApplyModal(offer, e)}
                          className="px-5 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Apply for Task</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL 1: Task Inspection Detail Sheet ── */}
      {isDetailOpen && selectedOffer && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsDetailOpen(false)}
        >
          <div
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] w-full max-w-[600px] rounded-t-2xl sm:rounded-xl p-5 pb-8 sm:pb-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)] text-xs px-3 py-1 rounded-md font-semibold">
                {getModuleName(selectedOffer.moduleType)}
              </span>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[var(--text-heading)]">
                {selectedOffer.title}
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                {selectedOffer.description ||
                  "Accredited on-site inspection and verified deliverable submission required."}
              </p>
            </div>

            <div className="bg-[var(--primary-light)]/40 border border-[var(--primary-border)] rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--text-muted)] block font-medium">
                  Task Payout
                </span>
                <span className="text-2xl font-black text-[var(--primary)]">
                  {formatCurrency(
                    Number(selectedOffer.agentPayoutNgn ?? selectedOffer.priceNgn ?? 10000)
                  )}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Secured Payment
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  Target Turnaround: {selectedOffer.agentTargetHours || 24}h
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Site Address:</span>
                <span className="font-semibold text-[var(--text-heading)] truncate max-w-[260px]">
                  {selectedOffer.locationAddress || "Geofenced coordinates verified"}
                </span>
              </div>
              {selectedOffer.agentId && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-700 dark:text-amber-300">
                  <span>Acceptance Window:</span>
                  <span className="font-bold">{getAcceptanceTimeRemaining(selectedOffer)}</span>
                </div>
              )}
            </div>

            {selectedOffer.agentId ? (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => handleOpenDeclineModal(selectedOffer, e)}
                  className="flex-1 py-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-heading)] text-xs font-semibold border border-[var(--border-color)] cursor-pointer"
                >
                  Decline with Reason
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDetailOpen(false);
                    setIsConfirmOpen(true);
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold cursor-pointer"
                >
                  Accept Task
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-heading)] text-xs font-semibold border border-[var(--border-color)] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={(e) => handleOpenApplyModal(selectedOffer, e)}
                  className="flex-1 py-2.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold cursor-pointer"
                >
                  Apply for Task
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 2: Accept Confirmation Dialog ── */}
      {isConfirmOpen && selectedOffer && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] w-full max-w-sm rounded-t-2xl sm:rounded-xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text-heading)]">Accept Assignment</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              By accepting this assignment, you commit to arriving on-site within SLA guidelines and submitting accredited deliverables. Timely completion increases your Operative Reliability Score.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Accept"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Decline with Reason Dialog ── */}
      {isDeclineOpen && selectedOffer && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsDeclineOpen(false)}
        >
          <form
            onSubmit={handleConfirmDecline}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] w-full max-w-md rounded-t-2xl sm:rounded-xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-heading)]">
                Decline Direct Assignment
              </h3>
              <button
                type="button"
                onClick={() => setIsDeclineOpen(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Please state why you are declining{" "}
              <strong className="text-[var(--text-heading)]">{selectedOffer.title}</strong> so Central Operations can reassign it immediately.
            </p>
            <textarea
              required
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="e.g. Currently on another site outside this LGA corridor / Scheduling conflict..."
              className="w-full p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDeclineOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !declineReason.trim()}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit & Decline"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL 4: Apply for Available Task Dialog ── */}
      {isApplyOpen && selectedOffer && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setIsApplyOpen(false)}
        >
          <form
            onSubmit={handleConfirmApply}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] w-full max-w-md rounded-t-2xl sm:rounded-xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-heading)]">
                Apply for Open Task
              </h3>
              <button
                type="button"
                onClick={() => setIsApplyOpen(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Provide a brief note on your proximity or readiness for{" "}
              <strong className="text-[var(--text-heading)]">{selectedOffer.title}</strong>. Central Operations reviews applications alongside your Reliability Score.
            </p>
            <textarea
              required
              rows={3}
              value={applyPitch}
              onChange={(e) => setApplyPitch(e.target.value)}
              placeholder="e.g. I am currently 10 mins from Lekki Phase 1 and can be on-site within the hour..."
              className="w-full p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
            />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsApplyOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !applyPitch.trim()}
                className="flex-1 py-2.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL 5: Success Dialog ── */}
      {isSuccessOpen && confirmedOffer && (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] w-full max-w-sm rounded-t-2xl sm:rounded-xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-heading)]">Task Accepted!</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              &quot;{confirmedOffer.title}&quot; is now in your Active Tasks and scheduled on your calendar.
            </p>
            <div className="pt-2">
              <Link
                href={`/agent/tasks/${confirmedOffer.id}`}
                className="w-full py-3 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-xs font-bold text-white transition-colors shadow-xs inline-block"
              >
                Open Active Task
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
