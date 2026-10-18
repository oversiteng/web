"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Building2, PlusCircle } from "lucide-react";
import { ERRAND_OPTIONS } from "./errands-data";

interface PropertyOption {
  id: string;
  title: string;
  address: string;
}

export default function QuickErrandsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPropertyId = searchParams.get("propertyId") || "";
  const preselectedType = searchParams.get("type") || "building-material";

  const [selectedId, setSelectedId] = useState<string>(preselectedType);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(preselectedPropertyId);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);

  // Load user properties to allow optional linking
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
          if (preselectedPropertyId && !selectedPropertyId) {
            setSelectedPropertyId(preselectedPropertyId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user properties:", err);
      } finally {
        setLoadingProps(false);
      }
    }
    loadProperties();
  }, [preselectedPropertyId, selectedPropertyId]);

  // Navigate to progressive details screen
  const handleContinue = () => {
    if (!selectedId) return;
    const propQuery = selectedPropertyId
      ? `&propertyId=${encodeURIComponent(selectedPropertyId)}`
      : "";
    router.push(`/errands/details?type=${selectedId}${propQuery}`);
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
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] sm:text-[19px] font-bold text-[var(--text-heading)] tracking-tight">
            Quick Errands
          </h1>
        </div>

        {/* ── Optional Property Link Selector ── */}
        <div className="mb-4 p-4 rounded-[22px] bg-[#F4F6F4] dark:bg-[var(--bg-card)] border border-[var(--border-color)]/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12.5px] font-semibold text-[var(--text-heading)] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[var(--primary)]" />
              <span>Link to Registered Property (Optional)</span>
            </label>
          </div>

          {loadingProps ? (
            <p className="text-[11.5px] text-[var(--text-muted)] py-2">Loading properties...</p>
          ) : properties.length === 0 ? (
            <div className="flex flex-row items-start sm:items-center justify-between gap-2.5 py-2">
              <p className="text-[13px] font-medium text-[var(--text-heading)]">No registered properties found</p>
              <Link
                href={`/properties/new?returnUrl=${encodeURIComponent("/errands")}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[var(--primary)] text-[11px] md:text-[13px] font-bold hover:bg-[var(--primary)]/10 transition-colors shrink-0 self-end"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Property</span>
              </Link>
            </div>
          ) : (
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
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

        <div className="space-y-3.5">
          {ERRAND_OPTIONS.map((option) => {
            const isSelected = selectedId === option.id;
            return (
              <div
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={`rounded-md p-5 cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "bg-[#F4F6F4] dark: bg-[var(--bg-card)] border-2 border-[var(--primary)] shadow-sm"
                    : "bg-[#F4F6F4] dark: bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-color)]"
                }`}
              >
                <h3 className="text-[16px] font-bold text-[var(--text-heading)] leading-snug">
                  {option.title}
                </h3>
                <p className="text-[13px] text-[var(--text-muted)] mt-1 leading-normal">
                  {option.subtitle}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Sticky Bar: Next / Continue ── */}
      <div className="pt-6 pb-4 sticky bottom-0 bg-[var(--bg-body)]/95 backdrop-blur-md z-30 mt-6 border-t border-[var(--border-color)] -mx-2 sm:-mx-4 px-2 sm:px-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[14px] font-medium text-[var(--text-muted)]">
            Service fee
          </span>
          <span className="text-[20px] font-bold text-[var(--text-heading)]">
            ₦12,000
          </span>
        </div>

        <button
          id="continue-errand-btn"
          type="button"
          disabled={!selectedId}
          onClick={handleContinue}
          className="w-full py-4 rounded-full bg-[var(--primary)] hover:bg-[#23993e] text-white font-bold text-[16px] transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
