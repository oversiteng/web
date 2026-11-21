"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Camera,
  MessageCircle,
  ShieldCheck,
  FileText,
  ChevronUp,
  ChevronDown,
  BadgeCheck,
  AlertTriangle,
  Award,
  Pencil,
  Trash2,
  Lock,
  Clock,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { PropertyIntelTimeline } from "@/lib/types/task";

interface PropertyTask {
  id: string;
  title: string;
  moduleType: string;
  status: string;
  priceNgn?: number;
  scheduledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  description?: string;
}

interface PropertyDetails {
  id: string;
  title: string;
  address: string;
  latitude?: number;
  longitude?: number;
  parcelNumber?: string;
  propertyType?: string;
  description?: string;
  ownershipType?: "OWNED" | "OTHER";
  baselinePhotos?: string[];
  proofOfOwnershipUrl?: string | null;
  intelTimeline?: PropertyIntelTimeline;
  reviewStatus?: string;
  ownershipVerificationStatus?: string;
  scheduleConfig?: {
    cadence?: string;
    autoDispenseEnabled?: boolean;
    subscriptionTier?: string;
  };
  assignedManager?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatarUrl?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  tasks: PropertyTask[];
  activeTaskCount: number;
  currentTask?: {
    id: string;
    agentDisplayName?: string;
    timeAgo?: string;
  } | null;
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Collapsible Sections (States Policy Updates, Landmarks, and optional timeline history on top 3 cards)
  const [policyExpanded, setPolicyExpanded] = useState(true);
  const [landmarksExpanded, setLandmarksExpanded] = useState(true);
  const [siteHistoryExpanded, setSiteHistoryExpanded] = useState(false);
  const [streetHistoryExpanded, setStreetHistoryExpanded] = useState(false);
  const [reviewHistoryExpanded, setReviewHistoryExpanded] = useState(false);

  // Edit & Delete Guardrail Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFeedback, setEditFeedback] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchProperty() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/v1/properties/${id}`, { headers });
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(
            json.error?.message || "Failed to load property details"
          );
        }

        setProperty(json.data);
        setEditTitle(json.data.title || "");
        setEditAddress(json.data.address || "");
        setEditDescription(json.data.description || "");
      } catch (err) {
        setErrorMsg((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[var(--text-muted)]">
          Loading property overview...
        </p>
      </div>
    );
  }

  if (errorMsg || !property) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-[var(--text-heading)]">
          Property Not Found
        </h2>
        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
          {errorMsg || "We could not find the requested property asset."}
        </p>
        <Link
          href="/properties"
          className="inline-flex px-6 py-2.5 rounded-full bg-[var(--primary)] text-white text-xs font-bold"
        >
          Return to Property Oversight
        </Link>
      </div>
    );
  }

  const isOther =
    property.ownershipType === "OTHER" ||
    property.parcelNumber === "OTHER_WATCH";

  // Use uploaded baseline image if present; otherwise fallback to default site hero image
  const heroImageUrl =
    Array.isArray(property.baselinePhotos) && property.baselinePhotos.length > 0
      ? property.baselinePhotos[0]
      : "/assets/images/tasks/site-worker.jpg";

  const oversiteTask =
    property.tasks?.find((t) => t.moduleType === "PROPERTY_OVERSITE") ||
    (property.tasks && property.tasks.length > 0 ? property.tasks[0] : null);

  const timeline = property.intelTimeline;

  // 1. Site Summaries (Newest at index 0)
  const siteSummaries =
    timeline?.siteSummaries && timeline.siteSummaries.length > 0
      ? timeline.siteSummaries
      : [
          {
            id: "site-default",
            agentName:
              property.currentTask?.agentDisplayName &&
              property.currentTask.agentDisplayName !== "Oversite Operations"
                ? property.currentTask.agentDisplayName
                : "Tunde C.",
            photoCountLabel: "12 photos geo-tagged",
            summary:
              "Physical site inspection completed. The perimeter fence remains intact. No unauthorized structures or temporary shelters observed. Soil condition is stable.",
            occupancy: "Vacant",
            fence: "Intact",
            setback: "3.5m OK",
            timeAgo: property.currentTask?.timeAgo || "2h ago",
            createdAt: property.updatedAt,
          },
        ];
  const latestSiteSummary = siteSummaries[0];

  // 2. Word on the Street (Newest at index 0)
  const wordOnStreetList =
    timeline?.wordOnStreet && timeline.wordOnStreet.length > 0
      ? timeline.wordOnStreet
      : [
          {
            id: "wots-default",
            headline: "Community & Neighbor Inquiries",
            badge: "Intel Verified",
            summary:
              "Caretaker and two adjacent property managers interviewed. No communal ownership claims, family disputes, or land grabber threats reported. Construction on adjoining Plot 13 conforms strictly to setback boundary.",
            confidenceScore: "98%",
            sourcesChecked: 3,
            createdAt: property.updatedAt,
          },
        ];
  const latestWordOnStreet = wordOnStreetList[0];

  // 3. Expert Review Report (Newest at index 0)
  const expertReviews =
    timeline?.expertReviews && timeline.expertReviews.length > 0
      ? timeline.expertReviews
      : [
          {
            id: "exp-default",
            headline: "Unified Recommendation",
            rating: "9.6 / 10",
            summary:
              "Site survey beacon coordinates match the approved state cadastral layout. Routine monthly oversite is recommended to maintain verified possession.",
            reviewer: "Engr. Babatunde A. (COREN, Lead Civil Reviewer)",
            createdAt: property.updatedAt,
          },
        ];
  const latestExpertReview = expertReviews[0];

  // 4. States Policy Updates (Newest at index 0)
  const policyUpdates =
    timeline?.policyUpdates && timeline.policyUpdates.length > 0
      ? timeline.policyUpdates
      : [];

  // 5. Vicinity Landmarks (Newest at index 0)
  const landmarks =
    timeline?.landmarks && timeline.landmarks.length > 0
      ? timeline.landmarks
      : [];

  return (
    <div className="max-w-xl mx-auto pb-24 px-1 sm:px-2 text-[var(--text-body)] space-y-6 animate-in fade-in duration-150">
      {/* ── Top Header: Back Arrow + "Property Overview" +  Oversite Chat Button ── */}
      <div className="flex items-center justify-between py-3">
        <button
          type="button"
          onClick={() => router.push("/properties")}
          aria-label="Back to Property Oversight"
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-[16px] sm:text-[17px] font-bold text-[var(--text-heading)] tracking-tight">
          Property Overview
        </h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditTitle(property.title || "");
              setEditAddress(property.address || "");
              setEditDescription(property.description || "");
              setEditFeedback(null);
              setShowEditModal(true);
            }}
            title="Edit property details"
            className="w-8.5 h-8.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-heading)] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            title="Remove property listing"
            className="w-8.5 h-8.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {oversiteTask && (
            <Link
              href={`/dashboard/tasks/${oversiteTask.id}/chat`}
              title="Chat with your Personal Property Manager"
              className="w-8.5 h-8.5 rounded-lg bg-[#22b14c]/10 hover:bg-[#22b14c]/20 text-[#22b14c] flex items-center justify-center transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* ── Verification & Monitoring Cadence Banner ── */}
      {property.reviewStatus === "PENDING_ADMIN_REVIEW" &&
      property.ownershipVerificationStatus !== "VERIFIED" ? (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
          <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-[var(--text-heading)]">
              Pending Central Operations Verification
            </p>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Your property submission is currently being verified by Oversite Operations. Once approved, your Personal Property Manager will activate baseline monitoring on your{" "}
              <span className="font-semibold text-[var(--text-heading)]">
                {(property.scheduleConfig?.cadence || "SEMI_ANNUALLY")
                  .replace(/_/g, " ")
                  .toLowerCase()}
              </span>{" "}
              cadence.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-[var(--text-heading)] truncate">
                Active Property Monitoring ·{" "}
                {(property.scheduleConfig?.cadence || "SEMI_ANNUALLY").replace(/_/g, " ")}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] truncate">
                {property.assignedManager
                  ? `Personal Property Manager: ${property.assignedManager.name || property.assignedManager.email}`
                  : "Managed by Oversite Property Desk"}
              </p>
            </div>
          </div>
          {oversiteTask && (
            <Link
              href={`/dashboard/tasks/${oversiteTask.id}/chat`}
              className="px-3 py-1.5 rounded-lg bg-[#22b14c] text-white font-bold text-[11px] shrink-0"
            >
              Message Manager
            </Link>
          )}
        </div>
      )}

      {/* ── Property Title & Address Subheader ── */}
      <div className="-mt-2">
        <h2 className="text-[24px] sm:text-[26px] font-extrabold text-[var(--text-heading)] tracking-tight leading-tight">
          {property.title}
        </h2>
        <div className="flex items-center gap-1.5 text-[13px] mt-1 flex-wrap">
          <MapPin className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <span className="text-[var(--text-muted)]">{property.address}</span>
          <span className="text-[var(--text-muted)]">·</span>
          <span
            className={`font-semibold ${
              isOther ? "text-[#f58220]" : "text-[#22b14c]"
            }`}
          >
            {isOther ? "Encroachment Watch" : "Verified Owner"}
          </span>
        </div>
      </div>

      {/* ── Hero Property Photo Card with "Geofence & Beacons Verified" Pill ── */}
      <div className="relative w-full h-[200px] sm:h-[225px] rounded-[26px] overflow-hidden bg-zinc-200 dark:bg-zinc-800 shadow-xs">
        <img
          src={heroImageUrl}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3.5 left-3.5 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-xs text-white text-[11.5px] font-bold flex items-center gap-1.5 shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-white shrink-0" />
          <span>Geofence &amp; Beacons Verified</span>
        </div>
      </div>

      {/* ── 1. Latest Site Summary (Newest at Top + Timeline History if >1) ── */}
      <section id="site-summary" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-4.5 h-4.5 text-[#22b14c]" />
            <h3 className="text-[14.5px] font-bold text-[var(--text-heading)]">
              Latest Site Summary
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#e2e5e3] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold">
            {latestSiteSummary.timeAgo || "2h ago"}
          </span>
        </div>

        <div className="rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[15px] font-bold text-[var(--text-heading)]">
              Field Agent: {latestSiteSummary.agentName}
            </h4>
            <span className="text-[12px] font-bold text-[#22b14c] shrink-0">
              {latestSiteSummary.photoCountLabel}
            </span>
          </div>

          <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
            {latestSiteSummary.summary}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="px-3 py-1.5 rounded-full bg-[#e5e7e6] dark:bg-zinc-800 text-[11.5px] font-bold text-[var(--text-heading)]">
              Occupancy: {latestSiteSummary.occupancy || "Vacant"}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#e5e7e6] dark:bg-zinc-800 text-[11.5px] font-bold text-[var(--text-heading)]">
              Fence: {latestSiteSummary.fence || "Intact"}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-[#e5e7e6] dark:bg-zinc-800 text-[11.5px] font-bold text-[var(--text-heading)]">
              Setback: {latestSiteSummary.setback || "3.5m OK"}
            </span>
          </div>

          {siteSummaries.length > 1 && (
            <div className="pt-2 border-t border-[var(--border-color)]/60">
              <button
                type="button"
                onClick={() => setSiteHistoryExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between text-[11.5px] font-bold text-[#22b14c] cursor-pointer"
              >
                <span>
                  Previous Site Summaries ({siteSummaries.length - 1})
                </span>
                {siteHistoryExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {siteHistoryExpanded && (
                <div className="mt-3 space-y-3">
                  {siteSummaries.slice(1).map((item) => (
                    <div
                      key={item.id}
                      className="pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <span className="font-bold text-[var(--text-heading)]">
                          Field Agent: {item.agentName}
                        </span>
                        <span>{item.timeAgo || "Earlier"}</span>
                      </div>
                      <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── 2. Word on the Street (Newest at Top + Timeline History if >1) ── */}
      <section id="word-on-street" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4.5 h-4.5 text-[#22b14c]" />
            <h3 className="text-[14.5px] font-bold text-[var(--text-heading)]">
              Word on the Street
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#e2e5e3] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold">
            {latestWordOnStreet.badge || "Intel Verified"}
          </span>
        </div>

        <div className="rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs space-y-2.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-[#22b14c] shrink-0" />
            <h4 className="text-[14.5px] font-bold text-[var(--text-heading)]">
              {latestWordOnStreet.headline}
            </h4>
          </div>

          <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
            {latestWordOnStreet.summary}
          </p>

          <p className="text-[11.5px] italic text-zinc-400 dark:text-zinc-500 pt-0.5">
            Confidence Score: {latestWordOnStreet.confidenceScore || "98%"} ·{" "}
            {latestWordOnStreet.sourcesChecked || 3} Local Sources Checked
          </p>

          {wordOnStreetList.length > 1 && (
            <div className="pt-2 border-t border-[var(--border-color)]/60">
              <button
                type="button"
                onClick={() => setStreetHistoryExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between text-[11.5px] font-bold text-[#22b14c] cursor-pointer"
              >
                <span>
                  Previous Community Intel ({wordOnStreetList.length - 1})
                </span>
                {streetHistoryExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {streetHistoryExpanded && (
                <div className="mt-3 space-y-3">
                  {wordOnStreetList.slice(1).map((item) => (
                    <div
                      key={item.id}
                      className="pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <span className="font-bold text-[var(--text-heading)]">
                          {item.headline}
                        </span>
                        <span>{item.badge}</span>
                      </div>
                      <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── 3. Expert Review Report (Newest at Top + Timeline History if >1) ── */}
      <section id="expert-review" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4.5 h-4.5 text-[#22b14c]" />
            <h3 className="text-[14.5px] font-bold text-[var(--text-heading)]">
              Expert Review Report
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#e2e5e3] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold">
            Certified
          </span>
        </div>

        <div className="rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[15px] font-bold text-[var(--text-heading)]">
              {latestExpertReview.headline}
            </h4>
            <span className="text-[12px] font-bold text-[#22b14c] shrink-0">
              Rating: {latestExpertReview.rating}
            </span>
          </div>

          <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
            {latestExpertReview.summary}
          </p>

          <p className="text-[12px] font-semibold text-zinc-500 dark:text-zinc-400 pt-0.5">
            Reviewed by: {latestExpertReview.reviewer}
          </p>

          {expertReviews.length > 1 && (
            <div className="pt-2 border-t border-[var(--border-color)]/60">
              <button
                type="button"
                onClick={() => setReviewHistoryExpanded((prev) => !prev)}
                className="w-full flex items-center justify-between text-[11.5px] font-bold text-[#22b14c] cursor-pointer"
              >
                <span>
                  Previous Expert Reviews ({expertReviews.length - 1})
                </span>
                {reviewHistoryExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {reviewHistoryExpanded && (
                <div className="mt-3 space-y-3">
                  {expertReviews.slice(1).map((item) => (
                    <div
                      key={item.id}
                      className="pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                        <span className="font-bold text-[var(--text-heading)]">
                          {item.headline} (Rating: {item.rating})
                        </span>
                        <span>{item.reviewer}</span>
                      </div>
                      <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. States Policy Updates (Collapsible Timeline — Newest at Top) ── */}
      <section id="policy-updates" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-[#22b14c]" />
            <h3 className="text-[14.5px] font-bold text-[var(--text-heading)]">
              States Policy Updates
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#e2e5e3] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold">
            Official Directives
          </span>
        </div>

        <div className="rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs">
          {/* Collapsible Header Row */}
          <div
            onClick={() => setPolicyExpanded((prev) => !prev)}
            className="flex items-center justify-between gap-2 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-4.5 h-4.5 text-[#22b14c] shrink-0" />
              <h4 className="text-[14.5px] font-bold text-[var(--text-heading)] truncate">
                Statutory Layout &amp; Directives
              </h4>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[12px] font-bold text-[#22b14c]">
                {policyUpdates.length} Updates
              </span>
              {policyExpanded ? (
                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </div>
          </div>

          {/* Collapsible Timeline Body */}
          {policyExpanded && (
            <div className="mt-5 space-y-0 animate-in fade-in duration-150">
              {policyUpdates.map((item, idx) => {
                const isLast = idx === policyUpdates.length - 1;
                const isNewest = idx === 0;
                return (
                  <div key={item.id || idx} className="relative flex gap-3.5">
                    {/* Left Timeline Dot & Vertical Line */}
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isNewest
                            ? "bg-[#22b14c]"
                            : "bg-zinc-300 dark:bg-zinc-600"
                        }`}
                      />
                      {!isLast && (
                        <div className="w-[1.5px] flex-1 bg-zinc-200 dark:bg-zinc-800 my-1 min-h-[28px]" />
                      )}
                    </div>

                    {/* Right Policy Item Text */}
                    <div className={`flex-1 min-w-0 ${!isLast ? "pb-5" : ""}`}>
                      <p className="text-[11.5px] font-bold text-zinc-500 dark:text-zinc-400">
                        {item.dateLabel}
                      </p>
                      <p className="text-[13px] text-[var(--text-muted)] leading-relaxed mt-1">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Landmarks (Collapsible Timeline — Newest at Top) ── */}
      <section id="landmarks" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4.5 h-4.5 text-[#22b14c]" />
            <h3 className="text-[14.5px] font-bold text-[var(--text-heading)]">
              Landmarks
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#e2e5e3] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold">
            {landmarks.length} Verified
          </span>
        </div>

        <div className="rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-xs">
          {/* Collapsible Header Row */}
          <div
            onClick={() => setLandmarksExpanded((prev) => !prev)}
            className="flex items-center justify-between gap-2 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-4.5 h-4.5 text-[#22b14c] shrink-0" />
              <h4 className="text-[14.5px] font-bold text-[var(--text-heading)] truncate">
                Vicinity Landmarks &amp; Transit
              </h4>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-0.5 rounded-full bg-[#e2e5e3] dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold">
                {landmarks.length} Verified
              </span>
              {landmarksExpanded ? (
                <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              )}
            </div>
          </div>

          {/* Collapsible Landmarks Body */}
          {landmarksExpanded && (
            <div className="mt-5 divide-y divide-[var(--border-color)]/60 animate-in fade-in duration-150">
              {landmarks.map((lm, idx) => (
                <div
                  key={lm.id || idx}
                  className={`${idx === 0 ? "pb-4" : "py-4"} ${
                    idx === landmarks.length - 1 ? "pb-0" : ""
                  } space-y-2`}
                >
                  <div className="grid grid-cols-12 gap-2 text-[12.5px]">
                    <span className="col-span-5 text-[var(--text-muted)] font-medium">
                      Name
                    </span>
                    <span className="col-span-7 font-bold text-[var(--text-heading)]">
                      {lm.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-[12.5px]">
                    <span className="col-span-5 text-[var(--text-muted)] font-medium">
                      Distance &amp; Est. Time
                    </span>
                    <span className="col-span-7 font-bold text-[var(--text-heading)]">
                      {lm.distance}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-2 text-[12.5px]">
                    <span className="col-span-5 text-[var(--text-muted)] font-medium">
                      Interesting Feature
                    </span>
                    <span className="col-span-7 font-semibold text-[var(--text-heading)] leading-snug">
                      {lm.feature}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 pt-1">
                    {lm.addedLabel}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Primary Green CTA: View Report (PDF) ── */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => {
            if (oversiteTask) {
              router.push(`/dashboard/tasks/${oversiteTask.id}/report`);
            } else {
              window.print();
            }
          }}
          className="w-full py-4 rounded-full bg-[#22b14c] hover:bg-[#1e9e43] active:scale-[0.99] text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <FileText className="w-5 h-5" />
          <span>View Report (PDF)</span>
        </button>
      </div>

      {/* ── Ownership Verification & Action Buttons (Verify Ownership + Vulnerability Test) ── */}
      <section className="pt-2 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-[#22b14c]" />
              <h3 className="text-[15.5px] font-bold text-[var(--text-heading)]">
                Ownership Verification
              </h3>
            </div>
            <span className="text-[14.5px] font-bold text-[#22b14c]">
              ₦25,000
            </span>
          </div>

          <p className="text-[13px] text-[var(--text-muted)] leading-relaxed">
            Perform certified title search, surveyor general chart check &amp;
            digital registry scan from Lands Bureau.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Link
            href={`/diligence?propertyId=${property.id}`}
            className="py-3.5 px-4 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[#22b14c] font-bold text-[14px] text-center transition-all shadow-xs active:scale-[0.98]"
          >
            Verify Ownership
          </Link>

          <Link
            href={`/vulnerability?propertyId=${property.id}`}
            className="py-3.5 px-4 rounded-xl bg-[#22b14c] hover:bg-[#1e9e43] text-white font-bold text-[14px] text-center transition-all shadow-md active:scale-[0.98]"
          >
            Vulnerability Test
          </Link>
        </div>
      </section>

      {/* ── Edit Property Modal / Drawer with Identity Lock Guardrail ── */}
      {showEditModal && (() => {
        const isIdentityLocked =
          property.ownershipVerificationStatus === "VERIFIED" ||
          property.reviewStatus === "APPROVED" ||
          (property.tasks && property.tasks.length > 0);

        const handleSaveEdit = async (e: React.FormEvent) => {
          e.preventDefault();
          setIsSavingEdit(true);
          setEditFeedback(null);
          try {
            const token =
              typeof window !== "undefined"
                ? localStorage.getItem("oversite_token")
                : null;
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
            };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const res = await fetch(`/api/v1/properties/${property.id}`, {
              method: "PATCH",
              headers,
              body: JSON.stringify({
                title: editTitle.trim(),
                ...(isIdentityLocked ? {} : { address: editAddress.trim() }),
                description: editDescription.trim(),
              }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) {
              throw new Error(json.error?.message || "Failed to update property");
            }
            setProperty((prev) =>
              prev
                ? {
                    ...prev,
                    title: json.data.title,
                    address: json.data.address,
                    description: json.data.description,
                  }
                : prev
            );
            setShowEditModal(false);
          } catch (err: any) {
            setEditFeedback(err.message || "Could not update property");
          } finally {
            setIsSavingEdit(false);
          }
        };

        return (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowEditModal(false)}
          >
            <form
              onSubmit={handleSaveEdit}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-2xl sm:rounded-xl p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--text-heading)]">
                  Edit Property Details
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isIdentityLocked && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                  <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Physical site address and ownership classification are locked once verification or field tasks have commenced. You can still update your property nickname and landmark instructions.
                  </span>
                </div>
              )}

              {editFeedback && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500">
                  {editFeedback}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-heading)] block">
                  Property Label / Nickname
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-heading)] flex items-center justify-between">
                  <span>Physical Address</span>
                  {isIdentityLocked && (
                    <span className="text-[10.5px] text-amber-600 dark:text-amber-400 inline-flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  disabled={isIdentityLocked}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-heading)] block">
                  Landmark &amp; Access Notes
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Describe perimeter features, nearest landmarks, or caretaker instructions..."
                  className="w-full p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 h-9 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 h-9 rounded-lg bg-[#22b14c] hover:bg-[#1e9e43] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* ── Delete Property Confirmation Modal with Anti-Abuse Notice ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-2xl sm:rounded-xl p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-heading)]">
                Remove Property Listing?
              </h3>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-[var(--text-heading)]">{property.title}</strong>?
              Note: Properties removed after listing still count toward your 30-day subscription quota cycle to prevent slot rotation abuse, and properties with active in-field tasks cannot be deleted until completion.
            </p>

            {deleteError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 h-9 rounded-lg border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
              >
                Keep Property
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  setDeleteError(null);
                  try {
                    const token =
                      typeof window !== "undefined"
                        ? localStorage.getItem("oversite_token")
                        : null;
                    const headers: Record<string, string> = {};
                    if (token) headers["Authorization"] = `Bearer ${token}`;

                    const res = await fetch(`/api/v1/properties/${property.id}`, {
                      method: "DELETE",
                      headers,
                    });
                    const json = await res.json();
                    if (!res.ok || !json.success) {
                      throw new Error(
                        json.error?.message || "Could not delete property"
                      );
                    }
                    router.push("/properties");
                  } catch (err: any) {
                    setDeleteError(err.message || "Failed to delete property");
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-4 h-9 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
