"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    location: "Lekki Phase 1",
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
    <div className="space-y-5 max-w-full pb-10">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-card)] text-[var(--text-heading)] border border-[var(--border-color)] font-semibold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0">
            {agentInitial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-heading)] font-bold text-base leading-tight truncate">
                {agentName}
              </span>
              <span className="text-[11px] font-semibold text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-color)] px-2 py-0.5 rounded-md tracking-wide shrink-0">
                #OS-2041
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>4.9 · 128 tasks</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Online / Offline Status Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !isOnline;
              setIsOnline(next);
              showToast(next ? "You are now Online" : "Status set to Offline");
            }}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isOnline
                ? "bg-[var(--primary-light)] border-[var(--primary-border)] text-[var(--primary)]"
                : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-[var(--primary)] animate-pulse" : "bg-[var(--text-muted)]"
              }`}
            />
            <span>{isOnline ? "Online" : "Offline"}</span>
          </button>

          {/* Theme Toggle (accessible on both mobile and desktop) */}
          <ThemeToggle className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors shadow-xs cursor-pointer" />

          {/* Bell Notification with Badge */}
          <button
            type="button"
            onClick={() => showToast("2 unread operational notifications")}
            className="relative w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors shadow-xs cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--danger)] text-white font-bold text-[10px] flex items-center justify-center border-2 border-[var(--bg-body)]">
              2
            </span>
          </button>
        </div>
      </div>

      {/* 2. Tax Clearance Alert Banner */}
      {showTaxBanner && (
        <div className="bg-[var(--bg-card)] border border-[var(--primary-border)] rounded-[24px] p-3.5 sm:p-4 flex items-center justify-between gap-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-xs text-[var(--text-body)] leading-snug">
              <span>Submit Q3 Tax clearance documents by Friday to avoid payout pause. </span>
              <button
                type="button"
                onClick={() => showToast("Tax clearance upload modal opening...")}
                className="text-[var(--primary)] underline font-semibold cursor-pointer hover:text-[var(--primary-hover)] ml-1 inline"
              >
                Upload
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowTaxBanner(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text-heading)] p-1 cursor-pointer shrink-0 transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. SLA Deadlines Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[var(--text-heading)] font-bold text-base">SLA Deadlines</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--danger-light)] border border-[var(--danger)]/20 text-[var(--danger)] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)] animate-pulse" />
              2 urgent
            </span>
          </div>
          <Link
            href="/agent/tasks"
            className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] flex items-center gap-1 transition-colors"
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
                    ? "bg-[var(--primary)] text-white font-bold shadow-md shadow-[var(--primary)]/20"
                    : "bg-[var(--bg-card)] border border-[var(--border-color)]/80 text-[var(--text-body)] hover:border-[var(--primary-border)] shadow-[0_0_10px_rgba(0,0,0,0.03)]"
                }`}
              >
                <span className={`text-[11px] ${isSelected ? "text-white/90 font-semibold" : "text-[var(--text-muted)]"}`}>
                  {item.day}
                </span>
                <span className={`text-base font-extrabold ${isSelected ? "text-white" : "text-[var(--text-heading)]"}`}>
                  {item.date}
                </span>
                {item.dot && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected
                        ? "bg-white"
                        : item.dot === "urgent"
                        ? "bg-[var(--danger)]"
                        : item.dot === "warning"
                        ? "bg-[var(--warning)]"
                        : "bg-[var(--primary)]"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Urgent Reminder Bar */}
        <div className="bg-[var(--danger-light)] border border-[var(--danger)]/25 rounded-2xl px-3.5 py-2.5 flex items-center gap-2 text-[var(--danger)] text-xs">
          <AlertCircle className="w-4 h-4 text-[var(--danger)] shrink-0" />
          <span className="font-medium">
            2 tasks due in &lt; 24h · Next: 1h 45m remaining
          </span>
        </div>
      </div>

      {/* 4. Available to Withdraw (Wallet Card) */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-[24px] p-5 space-y-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="text-[var(--text-muted)] text-xs font-semibold">Available to Withdraw</span>
          </div>
          <Link
            href="/agent/wallet"
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs px-4 py-2 rounded-full inline-flex items-center gap-1 transition-colors shadow-xs cursor-pointer"
          >
            <span>Withdraw</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="text-3xl font-extrabold text-[var(--text-heading)] tracking-tight">
          ₦45,000
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-body)] text-xs font-medium px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <span>₦18,000 Pending Clearance (3 jobs in review)</span>
          </div>
        </div>
      </div>

      {/* 5. Sub-Cards (Due Today & Available Queue) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Due Today Card */}
        <Link
          href="/agent/tasks"
          className="bg-[var(--bg-card)] border border-[var(--warning)]/40 hover:border-[var(--warning)] rounded-[24px] p-4 flex flex-col justify-between space-y-2 transition-colors shadow-[0_0_10px_rgba(0,0,0,0.03)] cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-medium">
            <Calendar className="w-4 h-4 text-[var(--warning)]" />
            <span>Due Today</span>
          </div>
          <div className="text-xl font-bold text-[var(--text-heading)]">2 Tasks</div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--warning)] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
            <span>Next: 1h 45m left</span>
          </div>
        </Link>

        {/* Available Queue Card */}
        <Link
          href="/agent/queue"
          className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 hover:border-[var(--primary)]/50 rounded-[24px] p-4 flex flex-col justify-between space-y-2 transition-colors shadow-[0_0_10px_rgba(0,0,0,0.03)] cursor-pointer"
        >
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs font-medium">
            <Inbox className="w-4 h-4 text-[var(--primary)]" />
            <span>Available Queue</span>
          </div>
          <div className="text-xl font-bold text-[var(--text-heading)]">5 in Queue</div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--primary)] font-medium">
            <MapPin className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
            <span>2 Near You (&lt;3km)</span>
          </div>
        </Link>
      </div>

      {/* 6. In-Progress Task Draft Resume Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--primary-border)] rounded-[24px] p-4 space-y-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
        <div className="bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl p-3 flex items-center gap-3.5">
          {/* Circular 85% Progress Ring */}
          <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[var(--border-color)]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-[var(--primary)]"
                strokeDasharray="85, 100"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-[var(--primary)]">85%</span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text-heading)]">
              9 of 10 photos captured (Draft saved)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowRemarkModal(true)}
            className="border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-[var(--primary)] text-xs font-semibold px-4 py-2.5 rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Remark</span>
          </button>
          <Link
            href="/agent/tasks/task-draft-ikoyi"
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs py-2.5 px-6 rounded-full flex-1 text-center transition-colors shadow-xs cursor-pointer"
          >
            Continue task
          </Link>
        </div>
      </div>

      {/* 7. Happening Now Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[var(--text-heading)] font-bold text-base">Happening now</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--primary-light)] border border-[var(--primary-border)] text-[var(--primary)] text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
              Active
            </span>
          </div>
          <Link
            href="/agent/tasks"
            className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
          >
            My tasks
          </Link>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-[24px] p-4 space-y-2 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <span className="bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)] text-xs px-2.5 py-0.5 rounded-full font-medium">
              Document Processing
            </span>
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3 text-[var(--text-muted)]" />
              <span>2h left</span>
            </span>
          </div>
          <h4 className="text-[var(--text-heading)] font-bold text-base leading-snug">Ikoyi site visit</h4>
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <span>4 Bourdillon Close · Adaeze O...</span>
          </p>
        </div>
      </div>

      {/* 8. New Offers Section (Task Radar) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[var(--text-heading)] font-bold text-base">New offers</h3>
          <Link
            href="/agent/queue"
            className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
          >
            See all {offers.length}
          </Link>
        </div>

        {offers.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-[24px] p-6 text-center text-xs text-[var(--text-muted)] shadow-[0_0_10px_rgba(0,0,0,0.03)]">
            No pending offers right now. Stay online to receive live matches.
          </div>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 rounded-[24px] p-4 space-y-2.5 shadow-[0_0_10px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-center justify-between">
                <span className="bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-body)] text-xs px-2.5 py-0.5 rounded-full font-medium">
                  {offer.category}
                </span>
                <span className="bg-[var(--warning-light)] border border-[var(--warning)]/30 text-[var(--warning)] text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[var(--warning)]" />
                  <span>{formatTimer(offer.secondsRemaining)}</span>
                </span>
              </div>

              <div>
                <h4 className="text-[var(--text-heading)] font-bold text-sm leading-snug">{offer.title}</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1 flex-wrap">
                  <MapPin className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                  <span>{offer.distance} · {offer.location}</span>
                  <span className="mx-1">·</span>
                  <Clock className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                  <span>{offer.duration}</span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-lg font-extrabold text-[var(--primary)]">
                  ₦{offer.amount.toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeclineOffer(offer.id)}
                    className="bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] hover:bg-[var(--border-color)]/40 text-[var(--text-heading)] text-xs font-semibold px-4 py-2 rounded-xl border border-[var(--border-color)] cursor-pointer transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAcceptOffer(offer)}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold px-5 py-2 rounded-xl cursor-pointer transition-colors shadow-xs"
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
        className="bg-[var(--bg-card)] border border-[var(--border-color)]/60 hover:border-[var(--primary-border)] rounded-[24px] p-4 flex items-center gap-3.5 transition-all cursor-pointer group shadow-[0_0_10px_rgba(0,0,0,0.03)]"
      >
        <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
          <Tag className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="bg-[var(--primary-light)] border border-[var(--primary-border)] text-[var(--primary)] text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1">
            Sponsored Perk
          </span>
          <h4 className="text-[var(--text-heading)] font-bold text-xs leading-snug">
            Equipment & Tool Rental Discount
          </h4>
          <p className="text-[11px] text-[var(--text-muted)] leading-snug mt-0.5">
            Save 15% on laser distance meters & safety kits with your Agent ID.
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
      </div>

      {/* Remark Modal */}
      {showRemarkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
                Add Inspection Remark
              </h3>
              <button
                type="button"
                onClick={() => setShowRemarkModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="e.g. Completed boundary fence check, waiting for gate access..."
              rows={3}
              className="w-full bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl p-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRemarkModal(false)}
                className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
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
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors"
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
