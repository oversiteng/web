"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ERRAND_OPTIONS } from "./errands-data";
import { PropertySelectDrawer, PropertyOption } from "@/components/PropertySelectDrawer";

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
    <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between relative px-2 sm:px-4 animate-in fade-in duration-200">
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
        <div className="mb-4">
          <PropertySelectDrawer
            label="Property"
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onSelect={(prop) => setSelectedPropertyId(prop?.id || "")}
            allowNone={true}
            noneLabel="None (Standalone errand without property link)"
            returnUrl="/errands"
            loading={loadingProps}
          />
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
      <div className="pt-6 pb-4 sticky bottom-[68px] md:bottom-0 bg-[var(--bg-body)]/95 backdrop-blur-md z-40 mt-6 border-t border-[var(--border-color)] -mx-2 sm:-mx-4 px-2 sm:px-4">
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
