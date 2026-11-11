"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  Star,
  Clock,
  MapPin,
  Calendar,
  Inbox,
  AlertCircle,
  Tag,
  ArrowRight,
  MessageSquare,
  X,
  Wallet,
  CheckCircle2,
} from "lucide-react";

interface OfferItem {
  id: string;
  category: string;
  title: string;
  distance: string;
  location: string;
  duration: string;
  amount: number;
  secondsRemaining: number;
}

const INITIAL_OFFERS: OfferItem[] = [
  {
    id: "off-cac-1",
    category: "Document Processing",
    title: "CAC certified copy retrieval",
    distance: "2.1 km",
    location: "Lagos Island Registry",
    duration: "24 hrs",
    amount: 6000,
    secondsRemaining: 252, // 04:12
  },
  {
    id: "off-site-2",
    category: "Property Oversite",
    title: "Site perimeter verification",
    distance: "4.5 km",
    location: "Leki Phase 1",
    duration: "48 hrs",
    amount: 12500,
    secondsRemaining: 380, // 06:20
  },
];

const DAYS_SCHEDULE = [
  { day: "Today", date: "11", dot: "urgent", isDefault: true },
  { day: "Tmrw", date: "12", dot: "warning", isDefault: false },
  { day: "Fri", date: "13", dot: "normal", isDefault: false },
  { day: "Sat", date: "14", dot: null, isDefault: false },
  { day: "Sun", date: "15", dot: null, isDefault: false },
  { day: "Mon", date: "16", dot: null, isDefault: false },
];

export default function AgentDashboardPage() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [showTaxBanner, setShowTaxBanner] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Today");
  const [offers, setOffers] = useState<OfferItem[]>(INITIAL_OFFERS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkText, setRemarkText] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Live countdown timer for active incoming radar offers
  useEffect(() => {
    const interval = setInterval(() => {
      setOffers((prev) =>
        prev.map((offer) => ({
          ...offer,
          secondsRemaining: Math.max(0, offer.secondsRemaining - 1),
        }))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAcceptOffer = (offer: OfferItem) => {
    showToast(`Accepted: ${offer.title} (+₦${offer.amount.toLocaleString()})`);
    setOffers((prev) => prev.filter((o) => o.id !== offer.id));
  };

  const handleDeclineOffer = (offerId: string) => {
    showToast("Offer declined");
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
  };

  const agentName = user?.name || user?.fullName || "Agent";
  const agentInitial = agentName.charAt(0).toUpperCase() || "A";

  return (
    <div className="space-y-4 max-w-full pb-10">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Bar matching screenshot */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-[#10b981] flex items-center justify-center text-[#042a17] font-extrabold text-lg shadow-md shrink-0">
            {agentInitial}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base leading-tight">Agent</span>
              <span className="text-[11px] font-semibold text-slate-400 bg-[#16241b] border border-[#223628] px-2 py-0.5 rounded-md tracking-wide">
                #OS-2041
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>4.9 · 128 tasks</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Online / Offline Status Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isOnline;
              setIsOnline(next);
              showToast(next ? "You are now Online" : "Status set to Offline");
            }}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isOnline
                ? "bg-[#102419] border-emerald-500/40 text-emerald-400"
                : "bg-slate-900 border-slate-700 text-slate-400"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              }`}
            />
            <span>{isOnline ? "Online" : "Offline"}</span>
          </button>

          {/* Bell Notification with Badge */}
          <button
            type="button"
            onClick={() => showToast("2 unread operational notifications")}
            className="relative w-9 h-9 rounded-full bg-[#121c16] border border-[#1b2b20] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
              2
            </span>
          </button>
        </div>
      </div>

      {/* 2. Tax Clearance Alert Banner */}
      {showTaxBanner && (
        <div className="bg-[#121c16] border border-emerald-900/30 rounded-3xl p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[#16271e] text-emerald-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-300 leading-snug">
              <span>Submit Q3 Tax clearance documents by Friday to avoid payout pause. </span>
              <button
                type="button"
                onClick={() => showToast("Tax clearance upload modal opening...")}
                className="text-emerald-400 underline font-semibold cursor-pointer hover:text-emerald-300 ml-1 inline"
              >
                Upload
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTaxBanner(false)}
            className="text-slate-500 hover:text-slate-300 p-1 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. SLA Deadlines Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-base">SLA Deadlines</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#361418] border border-rose-900/40 text-rose-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              2 urgent
            </span>
          </div>
          <Link
            href="/agent/tasks"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Day Carousel */}
        <div className="grid grid-cols-6 gap-2">
          {DAYS_SCHEDULE.map((item) => {
            const isSelected = selectedDay === item.day;
            return (
              <button
                key={item.day}
                type="button"
                onClick={() => setSelectedDay(item.day)}
                className={`py-3 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-[#10b981] text-[#062414] font-bold shadow-md shadow-emerald-500/10"
                    : "bg-[#121c16] border border-[#1a2b20] text-slate-300 hover:border-emerald-500/30"
                }`}
              >
                <span className={`text-[11px] ${isSelected ? "text-[#062414] font-semibold" : "text-slate-400"}`}>
                  {item.day}
                </span>
                <span className={`text-base font-extrabold ${isSelected ? "text-[#062414]" : "text-white"}`}>
                  {item.date}
                </span>
                {item.dot && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      item.dot === "urgent"
                        ? "bg-rose-500"
                        : item.dot === "warning"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Maroon Urgent Reminder Bar */}
        <div className="bg-[#311317] border border-rose-950/60 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 text-rose-200 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="font-medium">
            2 tasks due in &lt; 24h · Next: 1h 45m remaining
          </span>
        </div>
      </div>

      {/* 4. Available to Withdraw (Wallet Card) */}
      <div className="bg-[#121c16] border border-[#1b2b20] rounded-3xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-slate-300 text-xs font-semibold">Available to Withdraw</span>
          </div>
          <Link
            href="/agent/wallet"
            className="bg-[#10b981] hover:bg-[#059669] text-black font-bold text-xs px-4 py-2 rounded-full inline-flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
          >
            <span>Withdraw</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="text-3xl font-extrabold text-white tracking-tight">
          ₦45,000
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 bg-[#17251d] border border-[#203427] text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>₦18,000 Pending Clearance (3 jobs in review)</span>
          </div>
        </div>
      </div>

      {/* 5. Sub-Cards (Due Today & Available Queue) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Due Today Card with gold/amber border */}
        <Link
          href="/agent/tasks"
          className="bg-[#121c16] border border-amber-600/50 hover:border-amber-500 rounded-3xl p-4 flex flex-col justify-between space-y-2 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Due Today</span>
          </div>
          <div className="text-xl font-bold text-white">2 Tasks</div>
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Next: 1h 45m left</span>
          </div>
        </Link>

        {/* Available Queue Card */}
        <Link
          href="/agent/queue"
          className="bg-[#121c16] border border-[#1b2b20] hover:border-emerald-500/40 rounded-3xl p-4 flex flex-col justify-between space-y-2 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Inbox className="w-4 h-4 text-emerald-400" />
            <span>Available Queue</span>
          </div>
          <div className="text-xl font-bold text-white">5 in Queue</div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>2 Near You (&lt;3km)</span>
          </div>
        </Link>
      </div>

      {/* 6. In-Progress Task Draft Resume Card (from Screen 2) */}
      <div className="bg-[#121c16] border border-[#1b3323] rounded-3xl p-4 space-y-3">
        <div className="bg-[#16261d] rounded-2xl p-3 flex items-center gap-3.5">
          {/* Circular 85% Progress Ring */}
          <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#1a3324]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400"
                strokeDasharray="85, 100"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-emerald-300">85%</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-200">
              9 of 10 photos captured (Draft saved)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowRemarkModal(true)}
            className="border border-[#263e2e] bg-[#121c16] hover:bg-[#182a1e] text-emerald-400 text-xs font-semibold px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Remark</span>
          </button>
          <Link
            href="/agent/tasks/task-draft-ikoyi"
            className="bg-[#10b981] hover:bg-[#059669] text-black font-bold text-xs py-2.5 px-6 rounded-full flex-1 text-center transition-colors shadow-sm cursor-pointer"
          >
            Continue task
          </Link>
        </div>
      </div>

      {/* 7. Happening Now Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold text-base">Happening now</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#14261b] border border-emerald-800/40 text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
          <Link
            href="/agent/tasks"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            My tasks
          </Link>
        </div>

        <div className="bg-[#121c16] border border-[#1b2b20] rounded-3xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="bg-[#18291f] text-emerald-400 border border-emerald-800/40 text-xs px-2.5 py-0.5 rounded-full font-medium">
              Document Processing
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>2h left</span>
            </span>
          </div>
          <h4 className="text-white font-bold text-base leading-snug">Ikoyi site visit</h4>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>4 Bourdillon Close · Adaeze O...</span>
          </p>
        </div>
      </div>

      {/* 8. New Offers Section (Task Radar) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-base">New offers</h3>
          <Link
            href="/agent/queue"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            See all {offers.length}
          </Link>
        </div>

        {offers.length === 0 ? (
          <div className="bg-[#121c16] border border-[#1b2b20] rounded-3xl p-6 text-center text-xs text-slate-400">
            No pending offers right now. Stay online to receive live matches.
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-[#121c16] border border-[#1b2b20] rounded-3xl p-4 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="bg-[#19271e] text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {offer.category}
                </span>
                <span className="bg-[#291e13] border border-amber-800/40 text-amber-400 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{formatTimer(offer.secondsRemaining)}</span>
                </span>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm leading-snug">{offer.title}</h4>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 flex-wrap">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{offer.distance} · {offer.location}</span>
                  <span className="mx-1">·</span>
                  <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{offer.duration}</span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-lg font-extrabold text-emerald-400">
                  ₦{offer.amount.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeclineOffer(offer.id)}
                    className="bg-[#19271e] hover:bg-[#203126] text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl border border-[#233529] cursor-pointer transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAcceptOffer(offer)}
                    className="bg-[#10b981] hover:bg-[#059669] text-black text-xs font-bold px-5 py-2 rounded-xl cursor-pointer transition-colors shadow-sm"
                  >
                    Accept
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 9. Sponsored Perk Card */}
      <div
        onClick={() => showToast("Opening Equipment Discount partner portal...")}
        className="bg-[#121c16] border border-[#1b2b20] hover:border-emerald-500/30 rounded-3xl p-4 flex items-center gap-3.5 transition-all cursor-pointer group"
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <Tag className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="bg-emerald-950/80 border border-emerald-800/40 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1">
            Sponsored Perk
          </span>
          <h4 className="text-white font-bold text-xs leading-snug">
            Equipment & Tool Rental Discount
          </h4>
          <p className="text-[11px] text-slate-400 leading-snug mt-0.5">
            Save 15% on laser distance meters & safety kits with your Agent ID.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
      </div>

      {/* Remark Modal */}
      {showRemarkModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#101913] border border-[#1b2b20] rounded-3xl p-5 max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                Add Inspection Remark
              </h3>
              <button
                type="button"
                onClick={() => setShowRemarkModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="e.g. Completed boundary fence check, waiting for gate access..."
              rows={3}
              className="w-full bg-[#15231a] border border-[#203628] rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRemarkModal(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast("Remark recorded with GPS timestamp");
                  setShowRemarkModal(false);
                  setRemarkText("");
                }}
                className="bg-[#10b981] hover:bg-[#059669] text-black font-bold text-xs px-4 py-2 rounded-xl"
              >
                Save Remark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
