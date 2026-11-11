"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ShieldCheck,
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
  const router = useRouter();
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
      {/* 1. Header matching media_1794380338903_0c4ed3d1.jpg */}
      <div className="pt-2">
        <h1 className="text-xl font-bold text-white tracking-tight">Queue</h1>
      </div>

      {/* 2. Filter Pills Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "ALL"
              ? "bg-[#22c55e] text-black font-bold shadow-xs"
              : "bg-[#121c16] text-slate-300 hover:text-white border border-[#1b2b20]"
          }`}
        >
          All {offers.length}
        </button>
        <button
          type="button"
          onClick={() => setFilter("NEAREST")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "NEAREST"
              ? "bg-[#22c55e] text-black font-bold shadow-xs"
              : "bg-[#121c16] text-slate-300 hover:text-white border border-[#1b2b20]"
          }`}
        >
          Nearest
        </button>
        <button
          type="button"
          onClick={() => setFilter("HIGHEST")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "HIGHEST"
              ? "bg-[#22c55e] text-black font-bold shadow-xs"
              : "bg-[#121c16] text-slate-300 hover:text-white border border-[#1b2b20]"
          }`}
        >
          Highest pay
        </button>
        <button
          type="button"
          onClick={() => setFilter("SOONEST")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            filter === "SOONEST"
              ? "bg-[#22c55e] text-black font-bold shadow-xs"
              : "bg-[#121c16] text-slate-300 hover:text-white border border-[#1b2b20]"
          }`}
        >
          Soonest
        </button>
      </div>

      {/* 3. Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="bg-[#0e1612] border border-[#19271e] rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-white font-bold text-sm">Queue is currently clear</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            New inspection tasks matching your tier and coverage area will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              onClick={() => openDetail(offer)}
              className="bg-[#0e1612] border border-[#19271e] rounded-3xl p-5 space-y-3 transition-all hover:border-emerald-500/30 cursor-pointer"
            >
              {/* Category + Urgent Timer Pill */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{offer.category}</span>
                <span className="bg-[#2f1515] border border-red-500/30 text-red-400 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono font-medium">
                  <Clock className="w-3 h-3 text-red-400" />
                  <span>0:00</span>
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-base font-semibold text-white leading-snug">{offer.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1 line-clamp-2">
                  {offer.description}
                </p>
              </div>

              {/* Metadata: Location + Time */}
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {offer.distanceKm} km · {offer.locationArea}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{offer.timeWindow}</span>
                </span>
              </div>

              {/* Bottom Action Bar: Price + Decline + Accept */}
              <div className="flex items-center justify-between pt-2 border-t border-[#19271e]/70">
                <div className="text-base font-bold text-[#22c55e]">
                  ₦{offer.payoutNgn.toLocaleString()}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleDecline(offer.id, e)}
                    className="px-5 py-2 rounded-2xl bg-[#16231a] hover:bg-[#1f3125] text-slate-300 text-xs font-semibold border border-[#23382b] transition-all cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleInitiateAccept(offer, e)}
                    className="px-6 py-2 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold transition-all shadow-md cursor-pointer"
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
          MODAL 1: Task Inspection Detail Sheet (media_1794380352697_f6011cc0.jpg)
          ========================================================= */}
      {isDetailOpen && selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4">
          <div className="bg-[#0b130f] border-t sm:border border-[#19271e] w-full max-w-[650px] rounded-t-[32px] sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Top Bar with Category & Timer */}
            <div className="flex items-center justify-between">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-medium">
                {selectedOffer.category}
              </span>
              <span className="bg-[#2f1515] border border-red-500/30 text-red-400 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-mono font-medium">
                <Clock className="w-3 h-3 text-red-400" />
                <span>0:00 to accept</span>
              </span>
            </div>

            {/* Title & Desc */}
            <div>
              <h2 className="text-lg font-bold text-white">{selectedOffer.title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                {selectedOffer.description}
              </p>
            </div>

            {/* Map Preview Widget */}
            <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-[#19271e] bg-[#1a2b20]">
              <div
                className="w-full h-full opacity-80 bg-cover bg-center"
                style={{
                  backgroundImage:
                    "radial-gradient(#203828 2px, transparent 2px), radial-gradient(#203828 2px, #0f1c14 2px)",
                  backgroundSize: "32px 32px",
                  backgroundPosition: "0 0, 16px 16px",
                }}
              />
              {/* Map roads pattern overlay */}
              <svg className="absolute inset-0 w-full h-full stroke-emerald-500/20 fill-none" strokeWidth="2">
                <path d="M-20 80 Q 120 30, 250 110 T 600 70" />
                <path d="M100 -20 Q 140 90, 220 180" />
                <path d="M260 -20 Q 300 120, 380 180" strokeWidth="3" className="stroke-amber-500/30" />
              </svg>
              {/* Red Map Pin */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/40">
                  <MapPin className="w-4 h-4 text-white fill-white" />
                </div>
                <div className="w-2 h-1 bg-black/60 rounded-full blur-[1px] mt-0.5" />
              </div>
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-xs text-[10px] text-slate-300 font-medium">
                {selectedOffer.locationArea}
              </div>
            </div>

            {/* Distance & Time */}
            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  {selectedOffer.distanceKm} km · {selectedOffer.address}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{selectedOffer.timeWindow}</span>
              </div>
            </div>

            {/* Table Details */}
            <div className="bg-[#0e1612] border border-[#19271e] rounded-2xl p-4 divide-y divide-[#19271e] text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400 font-medium">Payout</span>
                <span className="font-bold text-white text-sm">
                  ₦{selectedOffer.payoutNgn.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400 font-medium">Time window</span>
                <span className="font-medium text-slate-200">{selectedOffer.timeWindow}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400 font-medium">Client</span>
                <span className="font-medium text-slate-200">{selectedOffer.clientName}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400 font-medium">Evidence required</span>
                <span className="font-medium text-slate-200">
                  {selectedOffer.evidenceRequired}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400 font-medium">Registry fee</span>
                <span className="font-medium text-slate-200">{selectedOffer.registryFee}</span>
              </div>
            </div>

            {/* Disclaimer pill */}
            <div className="bg-[#0f241a] border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl p-3 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Declining won't affect your rating. Letting the timer run out will.</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleDecline(selectedOffer.id)}
                className="flex-1 py-3.5 rounded-2xl bg-[#16231a] hover:bg-[#1f3125] text-slate-300 text-xs font-semibold border border-[#23382b] transition-all cursor-pointer"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => handleInitiateAccept(selectedOffer)}
                className="flex-1 py-3.5 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: "Accept this task?" Bottom Sheet (media_1794380357352_7bc77bd4.jpg)
          ========================================================= */}
      {isConfirmOpen && selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4">
          <div className="bg-[#0b130f] border-t sm:border border-[#19271e] w-full max-w-[650px] rounded-t-[32px] sm:rounded-3xl p-6 space-y-5 animate-in slide-in-from-bottom duration-200">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Accept this task?</h2>
              <p className="text-xs text-slate-400 mt-1">
                Accepting is a commitment. Missing the window affects your on-time rate.
              </p>
            </div>

            {/* Summary card */}
            <div className="bg-[#0e1612] border border-[#19271e] rounded-2xl p-4 divide-y divide-[#19271e] text-xs">
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-400 font-medium">Task</span>
                <span className="font-semibold text-white">{selectedOffer.title}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-400 font-medium">Where</span>
                <span className="font-medium text-slate-200">
                  {selectedOffer.locationArea} · {selectedOffer.distanceKm} km
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-400 font-medium">Must finish by</span>
                <span className="font-medium text-slate-200">{selectedOffer.deadlineText}</span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-400 font-medium">You'll earn</span>
                <span className="font-bold text-white text-sm">
                  ₦{selectedOffer.payoutNgn.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Info Notice */}
            <div className="bg-[#0f241a] border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl p-3 flex items-start gap-2">
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
                className="flex-1 py-3.5 rounded-2xl bg-[#16231a] hover:bg-[#1f3125] text-slate-300 text-xs font-semibold border border-[#23382b] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAccept}
                className="flex-1 py-3.5 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Yes, accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: Acceptance Success Screen (media_1794380363632_f0a2ca94.jpg)
          ========================================================= */}
      {isSuccessOpen && confirmedOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-0 sm:p-4">
          <div className="bg-[#0b130f] border-t sm:border border-[#19271e] w-full max-w-[650px] rounded-t-[32px] sm:rounded-3xl p-6 text-center space-y-4 animate-in slide-in-from-bottom duration-200">
            {/* Big Green Circle Checkmark */}
            <div className="w-16 h-16 rounded-full bg-[#22c55e] flex items-center justify-center mx-auto text-black shadow-lg shadow-emerald-500/30">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white tracking-tight">Accept this task?</h2>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                {confirmedOffer.title} is now yours. Finish by{" "}
                <span className="font-semibold text-white">
                  {confirmedOffer.deadlineText.toLowerCase()}
                </span>
                .
              </p>
            </div>

            <div className="space-y-2.5 pt-3">
              <Link
                href="/agent/tasks"
                className="w-full py-3.5 rounded-2xl bg-[#22c55e] hover:bg-[#16a34a] text-black text-xs font-bold transition-all shadow-md block text-center cursor-pointer"
              >
                Begin task
              </Link>
              <Link
                href="/agent/dashboard"
                className="w-full py-3.5 rounded-2xl bg-[#16231a] hover:bg-[#1f3125] text-slate-300 text-xs font-semibold border border-[#23382b] transition-all block text-center cursor-pointer"
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
