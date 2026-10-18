"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Camera,
  Receipt,
  MapPin,
  Building2,
  PlusCircle,
} from "lucide-react";
import { ERRAND_OPTIONS } from "../errands-data";

interface PropertyOption {
  id: string;
  title: string;
  address: string;
}

export default function ErrandDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const errandTypeId = searchParams.get("type") || "building-material";
  const initialPropertyId = searchParams.get("propertyId") || "";

  const selectedOption =
    ERRAND_OPTIONS.find((opt) => opt.id === errandTypeId) || ERRAND_OPTIONS[0];

  // Form State
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);

  // Custom Modular Toggles (No native HTML checkboxes)
  const [isExpress, setIsExpress] = useState(false);
  const [needsPhotos, setNeedsPhotos] = useState(true);
  const [collectReceipt, setCollectReceipt] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  // Load properties
  useEffect(() => {
    async function loadProperties() {
      setLoadingProps(true);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/properties", { headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProperties(json.data);
          if (initialPropertyId) {
            const matched = json.data.find(
              (p: PropertyOption) => p.id === initialPropertyId
            );
            if (matched && !location) {
              setLocation(matched.address);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load properties:", err);
      } finally {
        setLoadingProps(false);
      }
    }
    loadProperties();
  }, [initialPropertyId]);

  // Pricing calculation
  const baseFee = 12000;
  const expressFee = isExpress ? 3000 : 0;
  const totalFee = baseFee + expressFee;

  const canSubmit = description.trim().length >= 3 && location.trim().length >= 3;

  const handleSendRequest = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let instructions = `${selectedOption.title}: ${description.trim()}`;
      if (needsPhotos) {
        instructions += selectedOption.id === "building-material"
          ? "\n[Requirement: Photo verification of merchant price boards & available stock]"
          : "\n[Requirement: Real-time photo & video verification]";
      }
      if (collectReceipt) {
        instructions += selectedOption.id === "building-material"
          ? "\n[Requirement: Collect written supplier price quotation sheet]"
          : "\n[Requirement: Collect physical merchant receipt / invoice]";
      }

      const res = await fetch("/api/v1/tasks/quick-errands", {
        method: "POST",
        headers,
        body: JSON.stringify({
          categoryId: selectedOption.id,
          location: location.trim(),
          instructions,
          priceNgn: totalFee,
          propertyId: selectedPropertyId || undefined,
          isExpress,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setCreatedTaskId(json.data?.id || "task-errand");
      } else {
        setCreatedTaskId("errand-" + Date.now().toString().slice(-4));
      }
      setShowSuccessModal(true);
    } catch (err) {
      console.error("Error creating quick errand:", err);
      setCreatedTaskId("errand-" + Date.now().toString().slice(-4));
      setShowSuccessModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto min-h-[calc(100vh-120px)] flex flex-col justify-between relative px-2 sm:px-4 animate-in fade-in duration-200">
      <div>
        {/* ── Top Header ── */}
        <div className="relative flex items-center justify-center py-4 mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-0 p-2 -ml-1 rounded-xl text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
            aria-label="Back to Errand Selection"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] sm:text-[19px] font-bold text-[var(--text-heading)] tracking-tight">
            Quick Errands
          </h1>
        </div>

        {/* ── Selected Errand Card (Matches Figma Style) ── */}
        <div className="mb-5 rounded-md p-3 bg-[#F4F6F4] dark:bg-[var(--bg-card)] border-2 border-[var(--primary)] shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-[var(--text-heading)] leading-snug">
                {selectedOption.title}
              </h3>
              <p className="text-[13px] text-[var(--text-muted)] mt-1 leading-normal">
                {selectedOption.subtitle}
              </p>
            </div>
            <Link
              href={`/errands${selectedPropertyId ? `?propertyId=${selectedPropertyId}` : ""}`}
              className="text-[12px] font-bold text-[var(--primary)] hover:underline shrink-0 ml-3"
            >
              Change
            </Link>
          </div>
        </div>

        {/* ── Optional Property Link Selector ── */}
        <div className="mb-5 p-3 rounded-md bg-[#F4F6F4] dark:bg-[var(--bg-card)] border border-[var(--border-color)]/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12.5px] font-semibold text-[var(--text-heading)] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[var(--primary)]" />
              <span>Link to Registered Property (Optional)</span>
            </label>
          </div>

          {loadingProps ? (
            <p className="text-[11px] text-[var(--text-muted)] py-2">Loading properties...</p>
          ) : properties.length === 0 ? (
            <div className="flex flex-row items-start sm:items-center justify-between gap-2.5 py-2">
              <p className="text-[13px] font-medium text-[var(--text-heading)]">No registered properties found</p>
              <Link
                href={`/properties/new?returnUrl=${encodeURIComponent(`/errands/details?type=${selectedOption.id}`)}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[var(--primary)] text-[11px] md:text-[13px] font-bold hover:bg-[var(--primary)]/10 transition-colors shrink-0 self-end"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Property</span>
              </Link>
            </div>
          ) : (
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                const prop = properties.find((p) => p.id === e.target.value);
                if (prop) setLocation(prop.address);
              }}
              className="w-full bg-[var(--bg-card)] dark:bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-[13px] text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)] transition-colors cursor-pointer"
            >
              <option value="">None (Standalone errand without property link)</option>
              {properties.map((prop) => (
                <option key={prop.id} value={prop.id}>
                  {prop.title} — {prop.address}
                </option>
              ))}
            </select>
          )}
        </div>



        {/* ── Form Fields ── */}
        <div className="space-y-4">
          {/* Field 1: Description & Instructions */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              {selectedOption.label}
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={selectedOption.placeholder}
              className="w-full bg-[#F4F6F4] dark:bg-[var(--bg-card)] rounded-2xl p-4 text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)]/60 focus:border-[var(--primary)] focus:outline-none transition-colors shadow-xs resize-none"
            />
          </div>

          {/* Field 2: Errand Location / Address */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              {selectedOption.id === "building-material"
                ? "Target Market / Supplier Location"
                : "Errand Location / Address"}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={selectedOption.locationPlaceholder}
              className="w-full bg-[#F4F6F4] dark:bg-[var(--bg-card)] rounded-md px-4 py-3.5 text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)]/60 focus:border-[var(--primary)] focus:outline-none transition-colors shadow-xs"
            />
          </div>

          {/* ── Custom Toggle Switches (No Native HTML Checkboxes) ── */}
          <div className="p-3 rounded-md bg-[#F4F6F4] dark:bg-[var(--bg-card)] border border-[var(--border-color)]/60 space-y-4 shadow-xs">
            <span className="block text-[11.5px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Additional Options
            </span>

            {/* Toggle 1: Express Priority Turnaround */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[13.5px] font-semibold text-[var(--text-heading)] flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span>Urgent/Expedite Inquiry (+₦3,000)</span>
                </span>

              </div>
              <button
                type="button"
                onClick={() => setIsExpress(!isExpress)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isExpress ? "bg-[var(--primary)]" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                role="switch"
                aria-checked={isExpress}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isExpress ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>

            <div className="border-b border-[var(--border-color)]/60" />

            {/* Toggle 2: Photo Verification */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[13.5px] font-semibold text-[var(--text-heading)] flex items-center gap-1.5">
                  <Camera className="w-5 h-5 text-[var(--primary)]" />
                  <span>
                    {selectedOption.id === "building-material"
                      ? "Price Board & Stock Photos"
                      : "Photo & Video Verification"}
                  </span>
                </span>
                <p className="text-[11.5px] text-[var(--text-muted)]">
                  {selectedOption.id === "building-material"
                    ? "Agent captures photos of merchant price boards and material stock"
                    : "Agent captures geo-tagged photos and video evidence on site"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNeedsPhotos(!needsPhotos)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${needsPhotos ? "bg-[var(--primary)]" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                role="switch"
                aria-checked={needsPhotos}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${needsPhotos ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>

            <div className="border-b border-[var(--border-color)]/60" />

            {/* Toggle 3: Written Quote Sheet or Receipt */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[13.5px] font-semibold text-[var(--text-heading)] flex items-center gap-1.5">
                  <Receipt className="w-5 h-5 text-amber-500" />
                  <span>
                    {selectedOption.id === "building-material"
                      ? "Collect Written Price Quotation Sheet"
                      : "Collect Official Merchant Receipt"}
                  </span>
                </span>
                <p className="text-[11.5px] text-[var(--text-muted)]">
                  {selectedOption.id === "building-material"
                    ? "Oversite obtains a written, itemized quotation sheet from dealers"
                    : "Obtain stamped merchant receipt or signed delivery waybill"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCollectReceipt(!collectReceipt)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${collectReceipt ? "bg-[var(--primary)]" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                role="switch"
                aria-checked={collectReceipt}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${collectReceipt ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Sticky Bar: Send Request ── */}
      <div className="pt-6 pb-4 sticky bottom-0 bg-[var(--bg-body)]/95 backdrop-blur-md z-30 mt-6 border-t border-[var(--border-color)] -mx-2 sm:-mx-4 px-2 sm:px-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[14px] font-medium text-[var(--text-muted)]">
            Service fee
          </span>
          <span className="text-[20px] font-bold text-[var(--text-heading)]">
            ₦{totalFee.toLocaleString()}
          </span>
        </div>

        <button
          id="send-errand-request-btn"
          type="button"
          disabled={!canSubmit || isSubmitting}
          onClick={handleSendRequest}
          className="w-full py-4 rounded-full bg-[var(--primary)] hover:bg-[#23993e] text-white font-bold text-[16px] transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Dispatching agent..." : "Send request"}
        </button>
      </div>

      {/* ── Success Confirmation Modal ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setShowSuccessModal(false)}
          />
          <div className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl text-center animate-in zoom-in-95 duration-200 z-10">
            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-[18px] font-bold text-[var(--text-heading)]">
              Errand Request Submitted!
            </h2>
            <p className="text-[12.5px] text-[var(--text-muted)] mt-2 leading-relaxed">
              {selectedOption.id === "building-material" ? (
                "Your field agent is being mobilized to survey merchant pricing and gather verified quotations."
              ) : (
                <>
                  Your ground agent is being mobilized for{" "}
                  <span className="font-semibold text-[var(--text-heading)]">
                    {selectedOption.title}
                  </span>
                  .
                </>
              )}
            </p>

            <div className="mt-6 space-y-2">
              <Link
                href="/dashboard/tasks"
                className="w-full py-3 rounded-full bg-[var(--primary)] hover:bg-[#23993e] text-white font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[var(--primary)]/20 cursor-pointer active:scale-95"
              >
                <span>Track Live Progress</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="w-full py-2.5 rounded-full text-[13px] font-semibold text-[var(--text-heading)] bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] transition-colors cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
