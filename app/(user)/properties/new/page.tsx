"use client";

import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Home,
  Shield,
  Check,
  FileText,
  MapPin,
  Crosshair,
  Tag,
  ChevronDown,
  Camera,
  X,
  Info,
} from "lucide-react";

type OwnershipMode = "OWNED" | "OTHER";

interface PropertyFormState {
  ownershipType: OwnershipMode;
  address: string;
  gps: string;
  title: string;
  landmarkDescription: string;
  type: string;
}

const PROPERTY_TYPES = [
  {
    id: "underdeveloped_land",
    label: "Underdeveloped Land",
    desc: "Vacant plots, uncultivated acreage, greenfield sites",
  },
  {
    id: "residential_building",
    label: "Residential Building",
    desc: "Duplexes, bungalows, apartment blocks, residential homes",
  },
  {
    id: "commercial_building",
    label: "Commercial Building",
    desc: "Offices, plazas, shopping complexes, commercial facilities",
  },
  {
    id: "under_construction",
    label: "Under Construction",
    desc: "Ongoing developments, active foundations, structural works",
  },
];

export default function RegisterPropertyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  const [form, setForm] = useState<PropertyFormState>({
    ownershipType: "OWNED",
    address: "",
    gps: "",
    title: "",
    landmarkDescription: "",
    type: "",
  });

  // Proof of Ownership (for OWNED property)
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [proofDataUrl, setProofDataUrl] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  // Baseline Reference Photos (0/3 photos)
  const [baselinePhotos, setBaselinePhotos] = useState<string[]>([]);
  const baselinePhotoInputRef = useRef<HTMLInputElement>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [typeDrawerOpen, setTypeDrawerOpen] = useState(false);

  const showToast = (msg: string, duration = 3200) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Auto-locate GPS via device geolocation or forward-geocoding address
  const handleFindCoordinate = async () => {
    if (isLocating) return;
    setIsLocating(true);

    // If address is typed, try geocoding the address first
    if (form.address.trim().length >= 4) {
      try {
        showToast("Locating property coordinates...");
        const res = await fetch(
          `/api/v1/geo?address=${encodeURIComponent(form.address.trim())}`
        );
        const json = await res.json();
        if (json.success && json.data?.latitude && json.data?.longitude) {
          const coords = `${Number(json.data.latitude).toFixed(6)}, ${Number(
            json.data.longitude
          ).toFixed(6)}`;
          setForm((prev) => ({ ...prev, gps: coords }));
          showToast(`Coordinates locked: ${coords}`);
          setIsLocating(false);
          return;
        }
      } catch {
        // Fallback to device geolocation
      }
    }

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      showToast("Fetching current GPS coordinates...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `${pos.coords.latitude.toFixed(
            6
          )}, ${pos.coords.longitude.toFixed(6)}`;
          setForm((prev) => ({ ...prev, gps: coords }));
          setIsLocating(false);
          showToast(`GPS coordinates: ${coords}`);
        },
        () => {
          setIsLocating(false);
          showToast("Unable to fetch device GPS. You may enter coordinates manually.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      showToast("Geolocation is not supported by your browser.");
    }
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProofDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    showToast(`Attached "${file.name}"`);
  };

  const handleBaselinePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (baselinePhotos.length >= 3) {
      showToast("Maximum of 3 baseline reference photos allowed.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setBaselinePhotos((prev) =>
          prev.length < 3 ? [...prev, result] : prev
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address.trim()) {
      showToast("Please enter the property address.");
      return;
    }
    if (!form.title.trim()) {
      showToast("Please enter a property title.");
      return;
    }
    if (!form.type) {
      showToast("Please select a property type.");
      return;
    }

    setIsSubmitting(true);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      if (form.gps && form.gps.includes(",")) {
        const parts = form.gps.split(",").map((p) => parseFloat(p.trim()));
        if (!isNaN(parts[0]) && !isNaN(parts[1])) {
          lat = parts[0];
          lng = parts[1];
        }
      }

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/properties", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: form.title.trim() || form.address.trim(),
          address: form.address.trim(),
          latitude: lat,
          longitude: lng,
          propertyType: form.type,
          description: form.landmarkDescription.trim() || undefined,
          ownershipType: form.ownershipType,
          proofOfOwnershipUrl: proofDataUrl || undefined,
          baselinePhotos,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error?.message || "Failed to register property");
        setIsSubmitting(false);
        return;
      }

      showToast("Property registered successfully!");
      setTimeout(() => {
        if (returnUrl) {
          router.push(returnUrl);
        } else {
          router.push("/properties");
        }
      }, 500);
    } catch {
      showToast("Network error. Please try again.");
      setIsSubmitting(false);
    }
  };

  const selectedTypeObj = PROPERTY_TYPES.find((t) => t.id === form.type);
  const isOwned = form.ownershipType === "OWNED";

  return (
    <div className="relative w-full text-[var(--text-body)] transition-colors duration-200 max-w-md mx-auto pb-16 px-1">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-md bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4">
            <Info className="w-4 h-4 text-[var(--primary)] shrink-0" />
            <span className="text-[13px] font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ── Top Bar: Back Arrow + Centered "Register Property" ── */}
      <div className="relative flex items-center justify-between py-3 mb-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[15.5px] sm:text-[16.5px] font-bold text-[var(--text-heading)] tracking-tight">
          Register Property
        </h1>
        <div className="w-9 h-9" />
      </div>

      {/* ── Section Heading ── */}
      <div className="mb-5">
        <h2 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-[var(--text-heading)]">
          Add a property
        </h2>
        <p className="text-[13px] text-[var(--text-muted)] mt-1 leading-relaxed">
          Specify whether you legally own this property or are monitoring it for
          encroachment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── 2-Column Ownership Mode Cards (Owned Property vs Other Property) ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Owned Property */}
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({ ...prev, ownershipType: "OWNED" }))
            }
            className={`p-4 rounded-[22px] text-left transition-all cursor-pointer border-[1.5px] ${
              isOwned
                ? "border-[#22b14c] bg-[#f2fbf5] dark:bg-[#14261c]"
                : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between mb-3.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isOwned
                    ? "text-[#22b14c]"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <Home className="w-6 h-6 fill-current" />
              </div>

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                  isOwned
                    ? "bg-[#22b14c] border-[#22b14c] text-white"
                    : "border-zinc-200 dark:border-zinc-700 bg-transparent"
                }`}
              >
                {isOwned && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            <p className="text-[13.5px] font-bold text-[var(--text-heading)] leading-snug">
              Owned Property
            </p>
            <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
              Legal ownership &amp; title
            </p>
          </button>

          {/* Card 2: Other Property (Encroachment watch) */}
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({ ...prev, ownershipType: "OTHER" }))
            }
            className={`p-4 rounded-[22px] text-left transition-all cursor-pointer border-[1.5px] ${
              !isOwned
                ? "border-[#f58220] bg-[#fffaf5] dark:bg-amber-950/20"
                : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-zinc-300"
            }`}
          >
            <div className="flex items-center justify-between mb-3.5">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  !isOwned
                    ? "text-[#f58220]"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <Shield className="w-6 h-6 fill-current" />
              </div>

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                  !isOwned
                    ? "bg-[#f58220] border-[#f58220] text-white"
                    : "border-zinc-200 dark:border-zinc-700 bg-transparent"
                }`}
              >
                {!isOwned && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
            </div>

            <p className="text-[13.5px] font-bold text-[var(--text-heading)] leading-snug">
              Other Property
            </p>
            <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
              Encroachment watch
            </p>
          </button>
        </div>

        {/* ── Conditional Proof of Ownership (Optional) Card — Shown when Owned Property is selected ── */}
        {isOwned && (
          <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] p-4 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150">
            <input
              ref={proofInputRef}
              type="file"
              accept=".pdf,image/*"
              className="hidden"
              onChange={handleProofFileChange}
            />
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[#22b14c] shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13.5px] font-bold text-[var(--text-heading)] leading-snug">
                  Proof of Ownership (Optional)
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] leading-snug mt-0.5 truncate">
                  {proofFileName
                    ? `Attached: ${proofFileName}`
                    : "Attach survey plan, deed of assignment or C of O"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => proofInputRef.current?.click()}
              className="text-[13px] font-bold text-[#22b14c] hover:underline shrink-0 px-2 py-1 cursor-pointer"
            >
              {proofFileName ? "Change" : "Upload"}
            </button>
          </div>
        )}

        {/* ── Field 1: Address ── */}
        <div className="space-y-1.5">
          <label
            htmlFor="address"
            className="block text-[13.5px] font-bold text-[var(--text-heading)]"
          >
            Address
          </label>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-colors shadow-xs">
            <MapPin className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
            <input
              id="address"
              name="address"
              type="text"
              required
              value={form.address}
              onChange={handleInputChange}
              placeholder="e.g. Plot 12, Admiralty Way, Lekki Phase 1"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* ── Field 2: GPS coordinates (optional) ── */}
        <div className="space-y-1.5">
          <label
            htmlFor="gps"
            className="block text-[13.5px] font-bold text-[var(--text-heading)]"
          >
            GPS coordinates (optional)
          </label>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-colors shadow-xs">
            <Crosshair className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
            <input
              id="gps"
              name="gps"
              type="text"
              value={form.gps}
              onChange={handleInputChange}
              placeholder="e.g. 6.442213, 3.487472"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
            <button
              type="button"
              onClick={handleFindCoordinate}
              disabled={isLocating}
              title="Auto-detect GPS coordinates"
              aria-label="Auto-detect GPS coordinates"
              className="text-[#22b14c] hover:opacity-80 transition-opacity shrink-0 cursor-pointer disabled:opacity-40"
            >
              <Crosshair
                className={`w-5 h-5 ${isLocating ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* ── Field 3: Property Title ── */}
        <div className="space-y-1.5">
          <label
            htmlFor="title"
            className="block text-[13.5px] font-bold text-[var(--text-heading)]"
          >
            Property Title
          </label>
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-colors shadow-xs">
            <Tag className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
            <input
              id="title"
              name="title"
              type="text"
              required
              value={form.title}
              onChange={handleInputChange}
              placeholder="e.g. Lekki Duplex, Epe Farmland Plot 4"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* ── Field 4: Landmark / Access Description ── */}
        <div className="space-y-1.5">
          <label
            htmlFor="landmarkDescription"
            className="block text-[13.5px] font-bold text-[var(--text-heading)]"
          >
            Landmark / Access Description
          </label>
          <textarea
            id="landmarkDescription"
            name="landmarkDescription"
            rows={3}
            value={form.landmarkDescription}
            onChange={handleInputChange}
            placeholder="Describe landmarks, gate color, security protocols or access road conditions..."
            className="w-full p-4 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border-color)] focus:border-[var(--primary)] text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none transition-colors shadow-xs resize-none leading-relaxed"
          />
        </div>

        {/* ── Field 5: Property type ── */}
        <div className="space-y-1.5">
          <label
            htmlFor="type-trigger"
            className="block text-[13.5px] font-bold text-[var(--text-heading)]"
          >
            Property type
          </label>
          <button
            id="type-trigger"
            type="button"
            onClick={() => setTypeDrawerOpen(true)}
            className="w-full px-4 py-3.5 rounded-[20px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary)]/50 text-left flex items-center justify-between text-[14px] outline-none transition-all cursor-pointer shadow-xs"
          >
            <span
              className={
                selectedTypeObj
                  ? "font-medium text-[var(--text-heading)]"
                  : "text-[var(--text-muted)]"
              }
            >
              {selectedTypeObj ? selectedTypeObj.label : "Select property type"}
            </span>
            <ChevronDown
              className={`w-4.5 h-4.5 text-[var(--text-muted)] transition-transform duration-200 ${
                typeDrawerOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* ── Field 6: Baseline Reference Photos (0/3 photos) ── */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-[14px] font-bold text-[var(--text-heading)]">
              Baseline Reference Photos
            </label>
            <span className="text-[12px] font-medium text-[var(--text-muted)]">
              {baselinePhotos.length}/3 photos
            </span>
          </div>
          <p className="text-[12.5px] text-[var(--text-muted)] leading-snug">
            Provide baseline photographs for field agents to compare against
            during oversite.
          </p>

          <input
            ref={baselinePhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBaselinePhotoChange}
          />

          <div className="flex items-center gap-3 flex-wrap pt-1">
            {baselinePhotos.map((photoUrl, idx) => (
              <div
                key={idx}
                className="relative w-24 h-24 rounded-2xl overflow-hidden border border-[var(--border-color)] bg-zinc-100 dark:bg-zinc-800 shadow-xs"
              >
                <img
                  src={photoUrl}
                  alt={`Baseline reference ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setBaselinePhotos((prev) =>
                      prev.filter((_, i) => i !== idx)
                    )
                  }
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                  aria-label="Remove baseline photo"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {baselinePhotos.length < 3 && (
              <button
                type="button"
                onClick={() => baselinePhotoInputRef.current?.click()}
                className="w-24 h-24 rounded-2xl border border-[#8ed9a4] bg-[var(--bg-card)] hover:bg-[#f2fbf5] dark:hover:bg-[#14261c] flex flex-col items-center justify-center gap-1.5 text-[#22b14c] transition-colors cursor-pointer shadow-xs"
              >
                <Camera className="w-6 h-6 stroke-[1.8]" />
                <span className="text-[11.5px] font-semibold">Add Photo</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Submit CTA Button ── */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-full bg-[#22b14c] hover:bg-[#1e9e43] active:scale-[0.99] text-white font-bold text-[15px] transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Registering property..." : "Register property"}
          </button>
        </div>
      </form>

      {/* ── Property Type Selection Bottom Drawer / Modal ── */}
      {typeDrawerOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setTypeDrawerOpen(false)}
          />
          <div
            className="relative w-full sm:max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[28px] sm:rounded-3xl p-5 pb-8 sm:p-6 shadow-2xl z-10 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-8 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4 sm:hidden shrink-0" />

            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border-color)] shrink-0">
              <div>
                <h2 className="text-[16px] font-bold text-[var(--text-heading)]">
                  Select property type
                </h2>
                <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
                  Choose the category that best matches this property
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTypeDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 overflow-y-auto pr-1">
              {PROPERTY_TYPES.map((pt) => {
                const isSelected = form.type === pt.id;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, type: pt.id }));
                      setTypeDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--primary)]/10 text-[var(--text-heading)]"
                        : "hover:bg-[var(--bg-secondary)] text-[var(--text-heading)]"
                    }`}
                  >
                    <div className="pr-3 min-w-0">
                      <p
                        className={`text-[13.5px] font-bold leading-tight ${
                          isSelected
                            ? "text-[var(--primary)]"
                            : "text-[var(--text-heading)]"
                        }`}
                      >
                        {pt.label}
                      </p>
                      <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                        {pt.desc}
                      </p>
                    </div>

                    <div
                      className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "border-[var(--primary)] bg-[var(--primary)]"
                          : "border-[var(--border-color)] bg-transparent"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
