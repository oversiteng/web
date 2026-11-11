"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  MapPin,
  Clock,
  CheckCircle2,
  Check,
  Info,
} from "lucide-react";

export interface QueueOffer {
  id: string;
  category: string;
  title: string;
  description: string;
  distanceKm: number;
  locationArea: string;
  address: string;
  timeWindow: string;
  payoutNgn: number;
  clientName: string;
  evidenceRequired: string;
  registryFee: string;
  secondsRemaining: number;
  deadlineText: string;
  instructions: string;
}

const INITIAL_QUEUE_OFFERS: QueueOffer[] = [
  {
    id: "task-dd-vendor-01",
    category: "Due Diligence",
    title: "Vendor background field check",
    description:
      "Confirm physical business address and take photographic evidence for a Tier 2 vendor report.",
    distanceKm: 2.1,
    locationArea: "Lagos Island",
    address: "Broad Street, Lagos Island Commercial District",
    timeWindow: "Within 48 hrs",
    payoutNgn: 6000,
    clientName: "Folake A.",
    evidenceRequired: "Physical signage + 4 photos",
    registryFee: "None",
    secondsRemaining: 0,
    deadlineText: "Tomorrow, 2:07 PM",
    instructions:
      "Verify company signage on external directory, inspect reception desk, and record GPS coordinates at entrance.",
  },
  {
    id: "task-prop-lekki-02",
    category: "Property Oversite",
    title: "Vendor background field check",
    description:
      "Document construction activity within 500m of a registered property in Lekki Phase 1.",
    distanceKm: 7.6,
    locationArea: "Lagos Island",
    address: "14 Admiralty Way, Lekki Phase 1, Lagos",
    timeWindow: "Within 72 hrs",
    payoutNgn: 7500,
    clientName: "Tunde B.",
    evidenceRequired: "Perimeter survey + 6 geo-photos",
    registryFee: "None",
    secondsRemaining: 0,
    deadlineText: "Friday, 11:30 AM",
    instructions:
      "Inspect boundary markers, measure setback from public road, and record active construction machinery.",
  },
  {
    id: "task-cac-cert-03",
    category: "Document Processing",
    title: "CAC certified copy retrieval",
    description:
      "Retrieve certified true copy of CAC registration at the Lagos Island registry office.",
    distanceKm: 2.1,
    locationArea: "Lagos Island",
    address: "4 Bourdillon Close, Ikeja, Lagos",
    timeWindow: "Within 24 hrs",
    payoutNgn: 7700,
    clientName: "Adaeze O.",
    evidenceRequired: "Scan + 2 photos",
    registryFee: "Reimbursed",
    secondsRemaining: 240,
    deadlineText: "Tomorrow, 2:07 PM",
    instructions:
      "Photo taken should include the front view, back view, driver's way, west fence, north fence, and side gate.",
  },
];

export default function AgentQueuePage() {
  const [filter, setFilter] = useState<"ALL" | "NEAREST" | "HIGHEST" | "SOONEST">("ALL");
  const [offers, setOffers] = useState<QueueOffer[]>(INITIAL_QUEUE_OFFERS);

  // Modals state
  const [selectedOffer, setSelectedOffer] = useState<QueueOffer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [confirmedOffer, setConfirmedOffer] = useState<QueueOffer | null>(null);

  const handleDecline = (offerId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
    setIsDetailOpen(false);
    setSelectedOffer(null);
  };

  const handleInitiateAccept = (offer: QueueOffer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedOffer(offer);
    setIsDetailOpen(false);
    setIsConfirmOpen(true);
  };

  const handleConfirmAccept = () => {
    if (!selectedOffer) return;
    const accepted = selectedOffer;
    setConfirmedOffer(accepted);
    setOffers((prev) => prev.filter((o) => o.id !== accepted.id));
    setIsConfirmOpen(false);
    setIsSuccessOpen(true);
  };

  const openDetail = (offer: QueueOffer) => {
    setSelectedOffer(offer);
    setIsDetailOpen(true);
  };

  // Filter offers
  const filteredOffers = [...offers].sort((a, b) => {
    if (filter === "NEAREST") return a.distanceKm - b.distanceKm;
    if (filter === "HIGHEST") return b.payoutNgn - a.payoutNgn;
    if (filter === "SOONEST") return a.secondsRemaining - b.secondsRemaining;
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-[var(--text-heading)] tracking-tight">Queue</h1>
        <ThemeToggle className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors shadow-xs cursor-pointer" />
      </div>

      {/* 2. Filter Pills Row (matching User Dashboard filter pills) */}
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
          All {offers.length}
        </button>
        <button
          type="button"
          onClick={() => setFilter("NEAREST")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "NEAREST"
              ? "bg-[var(--primary)] text-white shadow-xs"
              : "bg-[var(--bg-card)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xs"
          }`}
        >
          Nearest
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
          Soonest
        </button>
      </div>

      {/* 3. Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[24px] p-8 text-center space-y-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
          <div className="w-12 h-12 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-[var(--text-heading)] font-bold text-sm">Queue is currently clear</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            New inspection tasks matching your tier and coverage area will appear here in real time.
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
              {/* Category + Urgent Timer Pill */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)] font-medium">{offer.category}</span>
                <span className="bg-[var(--danger-light)] border border-[var(--danger)]/30 text-[var(--danger)] text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono font-medium">
                  <Clock className="w-3 h-3 text-[var(--danger)]" />
                  <span>0:00</span>
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-base font-semibold text-[var(--text-heading)] leading-snug">{offer.title}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1 line-clamp-2">
                  {offer.description}
                </p>
              </div>

              {/* Metadata: Location + Time */}
              <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span>
                    {offer.distanceKm} km · {offer.locationArea}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                  <span>{offer.timeWindow}</span>
                </span>
              </div>

              {/* Bottom Action Bar: Price + Decline + Accept */}
              <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                <div className="text-base font-bold text-[var(--primary)]">
                  ₦{offer.payoutNgn.toLocaleString()}
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

      {/* =========================================================
          MODAL 1: Task Inspection Detail Sheet
          ========================================================= */}
      {isDetailOpen && selectedOffer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4"
          onClick={() => setIsDetailOpen(false)}
        >
          <div
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] w-full max-w-[650px] rounded-t-[32px] sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Category & Timer */}
            <div className="flex items-center justify-between">
              <span className="bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)] text-xs px-3 py-1 rounded-full font-medium">
                {selectedOffer.category}
              </span>
              <span className="bg-[var(--danger-light)] border border-[var(--danger)]/30 text-[var(--danger)] text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-mono font-medium">
                <Clock className="w-3 h-3 text-[var(--danger)]" />
                <span>0:00 to accept</span>
              </span>
            </div>

            {/* Title & Desc */}
            <div>
              <h2 className="text-lg font-bold text-[var(--text-heading)]">{selectedOffer.title}</h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                {selectedOffer.description}
              </p>
            </div>

            {/* Map Preview Widget */}
            <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)]">
              <div
                className="w-full h-full opacity-50 dark:opacity-70"
                style={{
                  backgroundImage:
                    "radial-gradient(var(--border-color) 2px, transparent 2px)",
                  backgroundSize: "24px 24px",
                }}
              />
              {/* Map roads pattern overlay */}
              <svg className="absolute inset-0 w-full h-full stroke-[var(--primary)]/35 fill-none" strokeWidth="2.5">
                <path d="M-20 80 Q 120 30, 250 110 T 600 70" />
                <path d="M100 -20 Q 140 90, 220 180" />
                <path d="M260 -20 Q 300 120, 380 180" strokeWidth="3" className="stroke-[var(--warning)]/45" />
              </svg>
              {/* Red Map Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-[var(--danger)] flex items-center justify-center text-white shadow-lg shadow-[var(--danger)]/40">
                  <MapPin className="w-4 h-4 text-white fill-white" />
                </div>
                <div className="w-2 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5" />
              </div>
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-[var(--bg-card)]/90 border border-[var(--border-color)] backdrop-blur-xs text-[10px] text-[var(--text-heading)] font-medium shadow-xs">
                {selectedOffer.locationArea}
              </div>
            </div>

            {/* Distance & Time */}
            <div className="space-y-1 text-xs text-[var(--text-body)]">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                <span>
                  {selectedOffer.distanceKm} km · {selectedOffer.address}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                <span>{selectedOffer.timeWindow}</span>
              </div>
            </div>

            {/* Table Details */}
            <div className="bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl p-4 divide-y divide-[var(--border-color)] text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-[var(--text-muted)] font-medium">Payout</span>
                <span className="font-bold text-[var(--text-heading)] text-sm">
                  ₦{selectedOffer.payoutNgn.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[var(--text-muted)] font-medium">Time window</span>
                <span className="font-medium text-[var(--text-heading)]">{selectedOffer.timeWindow}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[var(--text-muted)] font-medium">Client</span>
                <span className="font-medium text-[var(--text-heading)]">{selectedOffer.clientName}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[var(--text-muted)] font-medium">Evidence required</span>
                <span className="font-medium text-[var(--text-heading)]">
                  {selectedOffer.evidenceRequired}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[var(--text-muted)] font-medium">Registry fee</span>
                <span className="font-medium text-[var(--text-heading)]">{selectedOffer.registryFee}</span>
              </div>
            </div>

            {/* Disclaimer pill */}
            <div className="bg-[var(--primary-light)] border border-[var(--primary-border)] text-[var(--primary)] text-xs rounded-2xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Declining won&apos;t affect your rating. Letting the timer run out will.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDecline(selectedOffer.id)}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] hover:bg-[var(--border-color)]/40 text-[var(--text-heading)] text-xs font-semibold border border-[var(--border-color)] transition-all cursor-pointer"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleInitiateAccept(selectedOffer)}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: "Accept this task?" Bottom Sheet
          ========================================================= */}
      {isConfirmOpen && selectedOffer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4"
          onClick={() => setIsConfirmOpen(false)}
        >
          <div
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] w-full max-w-[650px] rounded-t-[32px] sm:rounded-3xl p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h2 className="text-lg font-bold text-[var(--text-heading)] tracking-tight">Accept this task?</h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Accepting is a commitment. Missing the window affects your on-time rate.
              </p>
            </div>

            {/* Summary card */}
            <div className="bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl p-4 divide-y divide-[var(--border-color)] text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-muted)] font-medium">Task</span>
                <span className="font-semibold text-[var(--text-heading)]">{selectedOffer.title}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-muted)] font-medium">Where</span>
                <span className="font-medium text-[var(--text-heading)]">
                  {selectedOffer.locationArea} · {selectedOffer.distanceKm} km
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-muted)] font-medium">Must finish by</span>
                <span className="font-medium text-[var(--text-heading)]">{selectedOffer.deadlineText}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-[var(--text-muted)] font-medium">You&apos;ll earn</span>
                <span className="font-bold text-[var(--text-heading)] text-sm">
                  ₦{selectedOffer.payoutNgn.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Info Notice */}
            <div className="bg-[var(--primary-light)] border border-[var(--primary-border)] text-[var(--primary)] text-xs rounded-2xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                This would be your 3rd accepted task today. Gold tier allows 3 at once.
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] hover:bg-[var(--border-color)]/40 text-[var(--text-heading)] text-xs font-semibold border border-[var(--border-color)] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                className="flex-1 py-3.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Yes, accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: Acceptance Success Screen
          ========================================================= */}
      {isSuccessOpen && confirmedOffer && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4">
          <div className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] w-full max-w-[650px] rounded-t-[32px] sm:rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Big Green Circle Checkmark */}
            <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center mx-auto text-white shadow-lg shadow-[var(--primary)]/30">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[var(--text-heading)] tracking-tight">Task Accepted!</h2>
              <p className="text-xs text-[var(--text-body)] max-w-sm mx-auto leading-relaxed">
                {confirmedOffer.title} is now yours. Finish by{" "}
                <span className="font-semibold text-[var(--text-heading)]">
                  {confirmedOffer.deadlineText.toLowerCase()}
                </span>
                .
              </p>
            </div>

            <div className="space-y-2.5 pt-3">
              <Link
                href="/agent/tasks"
                className="w-full py-3.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-sm block text-center cursor-pointer"
              >
                Begin task
              </Link>
              <Link
                href="/agent/dashboard"
                className="w-full py-3.5 rounded-2xl bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] hover:bg-[var(--border-color)]/40 text-[var(--text-heading)] text-xs font-semibold border border-[var(--border-color)] transition-all block text-center cursor-pointer"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
