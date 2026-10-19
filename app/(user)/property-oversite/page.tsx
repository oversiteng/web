"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface OversiteReportOption {
  id: string;
  title: string;
  subtitle: string;
  priceFormatted: string;
}

const REPORT_OPTIONS: OversiteReportOption[] = [
  {
    id: "site-visit-report",
    title: "Site Visit Report",
    subtitle: "Minimum 10 geo-tagged photos, condition and occupancy",
    priceFormatted: "₦12000",
  },
  {
    id: "word-on-the-street",
    title: "Word-on-the-street",
    subtitle: "Neighbour and caretaker interviews, disputes heard locally",
    priceFormatted: "₦12000",
  },
  {
    id: "ownership-verification",
    title: "Ownership Verification",
    subtitle: "Title confirmed at the Lands Bureau, document scan included",
    priceFormatted: "₦12000",
  },
  {
    id: "expert-review-report",
    title: "Expert Review Report",
    subtitle: "All four reports unified, with a reviewed recommendation",
    priceFormatted: "₦12000",
  },
];

export default function PropertyOversitePage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>("site-visit-report");

  const handleContinue = () => {
    router.push(`/property-oversite/details?report=${encodeURIComponent(selectedId)}`);
  };

  return (
    <div className="bg-[#F2F4F2] dark:bg-[#111412] min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-[var(--text-heading)] transition-colors duration-150">
      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4">
        <div>
          {/* ── Top Header ── */}
          <div className="relative flex items-center justify-center py-3 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute left-0 p-2 -ml-2 text-zinc-800 dark:text-zinc-200 hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] sm:text-[18px] font-bold text-zinc-900 dark:text-white tracking-tight">
              Property Oversite
            </h1>
          </div>

          {/* ── Report Cards List (Matches Figma Screenshot 1) ── */}
          <div className="space-y-3.5">
            {REPORT_OPTIONS.map((option) => {
              const isSelected = selectedId === option.id;
              return (
                <div
                  key={option.id}
                  onClick={() => setSelectedId(option.id)}
                  className={`w-full p-5 rounded-[22px] cursor-pointer transition-all duration-150 shadow-xs ${
                    isSelected
                      ? "bg-white dark:bg-[#1E2220] border-2 border-[#2BB44A]"
                      : "bg-white dark:bg-[#1E2220] border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <h3 className="text-[15.5px] sm:text-[16px] font-bold text-zinc-900 dark:text-white leading-snug">
                    {option.title}
                  </h3>
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-normal">
                    {option.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Bottom Sticky Bar ── */}
        <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-[#F2F4F2]/95 dark:bg-[#111412]/95 backdrop-blur-md pt-4 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-6 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center justify-center mb-3">
            <span className="text-[14px] text-zinc-600 dark:text-zinc-400 font-medium">
              Service fee <strong className="font-bold text-zinc-900 dark:text-white ml-1">₦12000</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-3.5 sm:py-4 rounded-full bg-[#2BB44A] hover:bg-[#259b40] active:scale-[0.98] text-white font-bold text-[16px] transition-all shadow-md cursor-pointer"
          >
            Review
          </button>
        </div>
      </div>
    </div>
  );
}
