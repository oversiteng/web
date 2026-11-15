"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Camera,
  Receipt,
  MapPin,
} from "lucide-react";
import { ERRAND_OPTIONS } from "../errands-data";
import { PropertySelectDrawer, PropertyOption } from "@/components/PropertySelectDrawer";

export default function ErrandDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const errandTypeId = searchParams.get("type") || "building-material";
  const initialPropertyId = searchParams.get("propertyId") || "";

  const selectedOption =
    ERRAND_OPTIONS.find((opt) => opt.id === errandTypeId) || ERRAND_OPTIONS[0];

  // Form State
  const [description, setDescription] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [timeWindow, setTimeWindow] = useState("Today • afternoon");
  const [selectedPropertyId, setSelectedPropertyId] = useState(initialPropertyId);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);

  // Additional Options Toggles
  const [isExpress, setIsExpress] = useState(false);
  const [needsPhotos, setNeedsPhotos] = useState(true);
  const [collectReceipt, setCollectReceipt] = useState(false);

  const [isNavigating, setIsNavigating] = useState(false);

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
            if (matched && !pickupAddress) {
              setPickupAddress(matched.address);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPropertyId]);

  // Pricing calculation
  const BASE_FEE = 12000;
  const expressFee = isExpress ? 3000 : 0;
  const totalFee = BASE_FEE + expressFee;

  // For non-document-delivery types, deliveryAddress is not required
  const isDocumentDelivery = selectedOption.id === "document-delivery";
  const locationValue = isDocumentDelivery ? pickupAddress : pickupAddress;

  const canSubmit =
    description.trim().length >= 3 &&
    pickupAddress.trim().length >= 3 &&
    (!isDocumentDelivery || deliveryAddress.trim().length >= 3);

  // Build instructions string from form state (used in checkout)
  function buildInstructions(): string {
    let instructions = description.trim();
    if (needsPhotos) {
      instructions +=
        selectedOption.id === "building-material"
          ? "\n[Requirement: Photo verification of merchant price boards & available stock]"
          : "\n[Requirement: Real-time photo & video verification]";
    }
    if (collectReceipt) {
      instructions +=
        selectedOption.id === "building-material"
          ? "\n[Requirement: Collect written supplier price quotation sheet]"
          : "\n[Requirement: Collect physical merchant receipt / invoice]";
    }
    return instructions;
  }

  const handleReviewOrder = () => {
    if (!canSubmit || isNavigating) return;
    setIsNavigating(true);

    const checkoutData = {
      errandTypeId: selectedOption.id,
      errandTitle: selectedOption.title,
      errandSubtitle: selectedOption.subtitle,
      propertyId: selectedPropertyId || null,
      propertyLabel: selectedPropertyId
        ? properties.find((p) => p.id === selectedPropertyId)?.address || "Linked property"
        : "None (Standalone errand without property link)",
      pickupAddress: pickupAddress.trim(),
      deliveryAddress: isDocumentDelivery ? deliveryAddress.trim() : "",
      timeWindow,
      instructions: buildInstructions(),
      description: description.trim(),
      isExpress,
      needsPhotos,
      collectReceipt,
      baseFee: BASE_FEE,
      expressFee,
      processingFee: 100,
      totalFee: totalFee + 100, // base + express + processing
    };

    try {
      sessionStorage.setItem("errand_checkout", JSON.stringify(checkoutData));
    } catch {
      // sessionStorage unavailable — pass via URL param (safe truncation)
    }

    router.push("/errands/checkout");
  };

  const TIME_WINDOWS = [
    "Today • morning",
    "Today • afternoon",
    "Today • evening",
    "Tomorrow • morning",
    "Tomorrow • afternoon",
    "Tomorrow • evening",
    "This week (flexible)",
  ];

  return (
    <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between relative px-2 sm:px-4 animate-in fade-in duration-200">
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

        {/* ── Selected Errand Card ── */}
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
        <div className="mb-5">
          <PropertySelectDrawer
            label="Property"
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onSelect={(prop) => {
              setSelectedPropertyId(prop?.id || "");
              if (prop) setPickupAddress(prop.address);
            }}
            allowNone={true}
            noneLabel="None (Standalone errand without property link)"
            returnUrl={`/errands/details?type=${selectedOption.id}`}
            loading={loadingProps}
          />
        </div>

        {/* ── Form Fields ── */}
        <div className="space-y-4">

          {/* Pickup Address */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              {isDocumentDelivery ? "Pickup Address" : (
                selectedOption.id === "building-material"
                  ? "Target Market / Supplier Location"
                  : "Errand Location / Address"
              )}
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder={
                  isDocumentDelivery
                    ? "e.g. 14 Admiralty Way, Lekki Phase 1"
                    : selectedOption.locationPlaceholder
                }
                className="w-full bg-[#F4F6F4] dark:bg-[var(--bg-card)] rounded-md pl-9 pr-4 py-3.5 text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)]/60 focus:border-[var(--primary)] focus:outline-none transition-colors shadow-xs"
              />
            </div>
          </div>

          {/* Delivery Address — only for document-delivery */}
          {isDocumentDelivery && (
            <div>
              <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
                Delivery Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] opacity-60" />
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Lands Bureau, Alausa Secretariat, Ikeja"
                  className="w-full bg-[#F4F6F4] dark:bg-[var(--bg-card)] rounded-md pl-9 pr-4 py-3.5 text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)]/60 focus:border-[var(--primary)] focus:outline-none transition-colors shadow-xs"
                />
              </div>
            </div>
          )}

          {/* Time Window */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              Time Window
            </label>
            <div className="relative">
              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                className="w-full appearance-none bg-[#F4F6F4] dark:bg-[var(--bg-card)] rounded-md px-4 py-3.5 text-[14px] text-[var(--text-heading)] border border-[var(--border-color)]/60 focus:border-[var(--primary)] focus:outline-none transition-colors shadow-xs cursor-pointer"
              >
                {TIME_WINDOWS.map((tw) => (
                  <option key={tw} value={tw}>{tw}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Description / Instructions */}
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

          {/* ── Additional Options ── */}
          <div className="p-3 rounded-md bg-[#F4F6F4] dark:bg-[var(--bg-card)] border border-[var(--border-color)]/60 space-y-4 shadow-xs">
            <span className="block text-[11.5px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Additional Options
            </span>

            {/* Toggle 1: Express Priority */}
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[13.5px] font-semibold text-[var(--text-heading)] flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <span>Urgent/Expedite Inquiry (+₦3,000)</span>
                </span>
                <p className="text-[11.5px] text-[var(--text-muted)]">
                  Priority queue allocation with field turnaround under 2 hours.
                </p>
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
                    : "Field manager captures high-definition, GPS-stamped visual proofs."}
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

            {/* Toggle 3: Receipt Collection */}
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
                    : "Physical stamped receipt will be scanned and archived in Document Vault."}
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

      {/* ── Bottom Sticky Bar ── */}
      <div className="pt-6 pb-4 sticky bottom-[68px] md:bottom-0 bg-[var(--bg-body)]/95 backdrop-blur-md z-40 mt-6 border-t border-[var(--border-color)] -mx-2 sm:-mx-4 px-2 sm:px-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[14px] font-medium text-[var(--text-muted)]">
            Service fee
          </span>
          <span className="text-[20px] font-bold text-[var(--text-heading)]">
            ₦{totalFee.toLocaleString()}
          </span>
        </div>

        <button
          id="review-errand-order-btn"
          type="button"
          disabled={!canSubmit || isNavigating}
          onClick={handleReviewOrder}
          className="w-full py-4 rounded-full bg-[var(--primary)] hover:bg-[#23993e] text-white font-bold text-[16px] transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isNavigating ? "Loading review..." : "Send request"}
        </button>
      </div>
    </div>
  );
}
