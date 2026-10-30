"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  MapPin,
  Check,
  Plus,
} from "lucide-react";
import { PropertySelectDrawer, PropertyOption } from "@/components/PropertySelectDrawer";

const DEFAULT_PROPERTIES: PropertyOption[] = [
  { id: "prop-1", title: "Plot 12, Lekki Phase 1", address: "Plot 12, Lekki Phase 1" },
  { id: "prop-2", title: "4 Bourdillon Close, Ikoyi", address: "4 Bourdillon Close, Ikoyi" },
];

const REPORT_TITLES: Record<string, string> = {
  "site-visit-report": "Site visit report",
  "word-on-the-street": "Word-on-the-street",
  "ownership-verification": "Ownership verification",
  "expert-review-report": "Expert review report",
};

export default function PropertyOversiteDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const reportId = searchParams.get("report") || "site-visit-report";
  const headerTitle = REPORT_TITLES[reportId] || "Site visit report";

  // Form State
  const [selectedProperty, setSelectedProperty] = useState<PropertyOption | null>(DEFAULT_PROPERTIES[0]);
  const [properties, setProperties] = useState<PropertyOption[]>(DEFAULT_PROPERTIES);
  const [whenOption, setWhenOption] = useState<"asap" | "scheduled">("asap");
  const [timeWindow, setTimeWindow] = useState("Fri 25 Sep, 10:00 - 13:00");
  const [instructions, setInstructions] = useState("");

  // Drawer state (z-[80] above bottom nav)
  const [isTimeDrawerOpen, setIsTimeDrawerOpen] = useState(false);

  // Load user properties if available
  useEffect(() => {
    async function loadProperties() {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/properties", { headers });
        const json = await res.json();
        const propIdParam = searchParams.get("propertyId");
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setProperties(json.data);
          const found = json.data.find((p: PropertyOption) => p.id === propIdParam);
          setSelectedProperty(found || json.data[0]);
        } else if (propIdParam) {
          const defaultFound = DEFAULT_PROPERTIES.find((p) => p.id === propIdParam);
          if (defaultFound) setSelectedProperty(defaultFound);
        }
      } catch (err) {
        console.error("Failed to load properties:", err);
      }
    }
    loadProperties();
  }, []);

  const handleReview = () => {
    const draft = {
      reportId,
      taskTitle: headerTitle,
      propertyAddress: selectedProperty?.address || "4 Bourdillon Close, Ikoyi",
      propertyTitle: selectedProperty?.title || "4 Bourdillon Close, Ikoyi",
      whenOption,
      timeWindow: whenOption === "asap" ? "As soon as possible" : timeWindow,
      instructions: instructions.trim() || "None",
      serviceFee: 22000,
      travelFee: 4000,
      charge: 100,
      totalFee: 26100,
    };

    sessionStorage.setItem("oversite_property_oversite_draft", JSON.stringify(draft));

    const query = new URLSearchParams({
      task: headerTitle,
      where: selectedProperty?.address || "4 Bourdillon Close, Ikoyi",
      window: whenOption === "asap" ? "Scheduled" : timeWindow,
      instructions: instructions.trim() || "None",
    });

    router.push(`/property-oversite/details/review?${query.toString()}`);
  };

  return (
    <div className="bg-(--bg-body) min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-(--text-heading) transition-colors duration-150">
      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4">
        <div>
          {/* ── Top Header ── */}
          <div className="relative flex items-center justify-center py-3 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute left-0 p-2 -ml-2 text-(--text-heading) hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] sm:text-[18px] font-bold text-(--text-heading) tracking-tight">
              {headerTitle}
            </h1>
          </div>

          <div className="space-y-4">
            {/* Field 1: Property (Matches Figma Screenshot 2) */}
            <PropertySelectDrawer
              label="Property"
              properties={properties}
              selectedPropertyId={selectedProperty?.id}
              onSelect={(prop) => {
                if (prop) setSelectedProperty(prop);
              }}
              allowNone={false}
              returnUrl={`/property-oversite/details?report=${reportId}`}
            />

            {/* Field 2: When (Segmented Toggle) */}
            <div>
              <label className="block text-[13.5px] font-semibold text-(--text-heading) mb-2">
                When
              </label>

              <div className="w-full bg-(--bg-card) rounded-full p-1 flex items-center border border-(--border-color) shadow-xs">
                <button
                  type="button"
                  onClick={() => setWhenOption("asap")}
                  className={`w-1/2 py-2.5 rounded-full text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    whenOption === "asap"
                      ? "bg-(--primary) text-white shadow-xs"
                      : "text-(--text-muted) hover:text-(--text-heading)"
                  }`}
                >
                  {whenOption === "asap" && <Check className="w-4 h-4 stroke-[2.5]" />}
                  <span>As soon as possible</span>
                </button>

                <button
                  type="button"
                  onClick={() => setWhenOption("scheduled")}
                  className={`w-1/2 py-2.5 rounded-full text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    whenOption === "scheduled"
                      ? "bg-(--primary) text-white shadow-xs"
                      : "text-(--text-muted) hover:text-(--text-heading)"
                  }`}
                >
                  {whenOption === "scheduled" && <Check className="w-4 h-4 stroke-[2.5]" />}
                  <span>Schedule a date</span>
                </button>
              </div>
            </div>

            {/* Field 3: Time window */}
            <div>
              <label className="block text-[13.5px] font-semibold text-(--text-heading) mb-2">
                Time window
              </label>

              <button
                type="button"
                onClick={() => setIsTimeDrawerOpen(true)}
                className="w-full bg-(--bg-card) rounded-[20px] px-4 py-3.5 flex items-center justify-between text-[14px] text-left cursor-pointer border border-(--border-color) hover:border-(--border-color)/80 transition-all shadow-xs"
              >
                <span className="text-(--text-heading) font-medium">
                  {timeWindow}
                </span>
                <ChevronDown className="w-5 h-5 text-(--text-muted) shrink-0" />
              </button>
            </div>

            {/* Field 4: Add Instructions */}
            <div>
              <label className="block text-[13.5px] font-semibold text-(--text-heading) mb-2">
                Add Instructions
              </label>

              <textarea
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Confirm vacant possession at my Lekki property and photograph the perimeter fence"
                className="w-full bg-(--bg-card) rounded-[22px] p-4 text-[14px] text-(--text-heading) placeholder:text-(--text-muted) border border-(--border-color) focus:border-(--primary) focus:outline-none transition-all shadow-xs resize-none"
              />
            </div>
          </div>
        </div>

        {/* ── Bottom Sticky Bar ── */}
        <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-(--bg-body)/95 backdrop-blur-md pt-4 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-6 border-t border-(--border-color)">
          <div className="flex items-center justify-center mb-3">
            <span className="text-[14px] text-(--text-muted) font-medium">
              Estimated total <strong className="font-bold text-(--text-heading) ml-1">₦12,000</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleReview}
            className="w-full py-3.5 sm:py-4 rounded-full bg-(--primary) hover:bg-(--primary-hover) active:scale-[0.98] text-white font-bold text-[16px] transition-all shadow-md cursor-pointer"
          >
            Review
          </button>
        </div>
      </div>


      {/* ── Time Window Selector Drawer ── */}
      {isTimeDrawerOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsTimeDrawerOpen(false)}
          />
          <div
            className="relative w-full max-w-lg bg-(--bg-card) rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 border border-(--border-color)"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-(--border-color) rounded-full mx-auto mb-4" />
            <h3 className="text-[17px] font-bold text-center text-(--text-heading) mb-4">
              Select time window
            </h3>

            <div className="divide-y divide-(--border-color)">
              {[
                "Fri 25 Sep, 10:00 - 13:00",
                "Fri 25 Sep, 14:00 - 17:00",
                "Sat 26 Sep, 09:00 - 12:00",
                "Sat 26 Sep, 13:00 - 16:00",
                "Mon 28 Sep, 10:00 - 13:00",
              ].map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    setTimeWindow(slot);
                    setIsTimeDrawerOpen(false);
                  }}
                  className={`w-full py-3.5 px-2 flex items-center justify-between text-[14.5px] cursor-pointer ${
                    timeWindow === slot
                      ? "text-(--primary) font-semibold"
                      : "text-(--text-heading)"
                  }`}
                >
                  <span>{slot}</span>
                  {timeWindow === slot && <Check className="w-4 h-4 text-(--primary)" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
