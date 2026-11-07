"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MapPin, ChevronDown, Plus } from "lucide-react";

export interface PropertyOption {
  id: string;
  title?: string;
  address: string;
  type?: string;
  city?: string;
  state?: string;
}

interface PropertySelectDrawerProps {
  label?: string;
  sublabel?: string;
  properties: PropertyOption[];
  selectedPropertyId?: string;
  onSelect: (property: PropertyOption | null) => void;
  allowNone?: boolean;
  noneLabel?: string;
  placeholder?: string;
  returnUrl: string;
  loading?: boolean;
  className?: string;
}

export function PropertySelectDrawer({
  label = "Property",
  sublabel,
  properties,
  selectedPropertyId,
  onSelect,
  allowNone = true,
  noneLabel = "None (No property link)",
  placeholder = "Select property",
  returnUrl,
  loading = false,
  className = "",
}: PropertySelectDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  // Display text in button trigger
  const displayText = selectedProperty
    ? selectedProperty.address
    : allowNone && !selectedPropertyId
    ? noneLabel
    : placeholder;

  const hasSelection = Boolean(selectedProperty);

  return (
    <div className={className}>
      {label && (
        <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button - Exactly matching property-oversite/details/page.tsx:L122-L140 */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full bg-white dark:bg-[#1E2220] rounded-[20px] px-4 py-3.5 flex items-center justify-between text-[14px] text-left cursor-pointer border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-xs"
      >
        <div className="flex items-center gap-2.5 truncate pr-2">
          <MapPin
            className={`w-4 h-4 shrink-0 ${
              hasSelection ? "text-[#2BB44A]" : "text-zinc-400"
            }`}
          />
          <span
            className={`font-medium truncate ${
              hasSelection
                ? "text-zinc-900 dark:text-white"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {displayText}
          </span>
        </div>
        <ChevronDown className="w-5 h-5 text-zinc-400 shrink-0" />
      </button>

      {/* Bottom Sheet Drawer - Exactly matching Figma Screenshot */}
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#1A1E1D] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-6 shrink-0" />

            <div className="text-center mb-4 shrink-0">
              <h3 className="text-[17px] font-bold text-zinc-900 dark:text-white">
                Select Property
              </h3>
              {sublabel && (
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {sublabel}
                </p>
              )}
            </div>

            {/* Properties List Scrollable */}
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {/* Optional 'None' option */}
              {allowNone && (
                <button
                  type="button"
                  onClick={() => {
                    onSelect(null);
                    setIsOpen(false);
                  }}
                  className="w-full py-3 px-3 flex items-center justify-between rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 truncate pr-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs shrink-0">
                      ∅
                    </span>
                    <span className="text-[14px] font-medium text-zinc-700 dark:text-zinc-300 truncate">
                      {noneLabel}
                    </span>
                  </div>

                  {/* Radio Circle */}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      !selectedPropertyId
                        ? "border-[#2BB44A] bg-[#2BB44A]"
                        : "border-zinc-300 dark:border-zinc-600 bg-transparent"
                    }`}
                  >
                    {!selectedPropertyId && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              )}

              {/* Property Items */}
              {properties.map((prop) => {
                const isSelected = selectedPropertyId === prop.id;
                return (
                  <button
                    key={prop.id}
                    type="button"
                    onClick={() => {
                      onSelect(prop);
                      setIsOpen(false);
                    }}
                    className="w-full py-3.5 px-3 flex items-center justify-between rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3 truncate pr-2">
                      <MapPin className="w-5 h-5 text-zinc-400 shrink-0" />
                      <div className="truncate">
                        <span className="text-[14.5px] font-medium text-zinc-900 dark:text-white block truncate">
                          {prop.address}
                        </span>
                        {prop.title && prop.title !== prop.address && (
                          <span className="text-[12px] text-zinc-400 dark:text-zinc-500 block truncate">
                            {prop.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Radio Circle */}
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "border-[#2BB44A] bg-[#2BB44A]"
                          : "border-zinc-300 dark:border-zinc-600 bg-transparent"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}

              {properties.length === 0 && !loading && (
                <div className="py-6 text-center text-zinc-500 text-[13px]">
                  No registered properties found yet.
                </div>
              )}
            </div>

            {/* Register another property Action */}
            <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center shrink-0">
              <Link
                href={`/properties/new?returnUrl=${encodeURIComponent(returnUrl)}`}
                className="inline-flex items-center gap-1.5 text-[#2BB44A] font-semibold text-[14px] hover:underline"
              >
                <Plus className="w-4 h-4" />
                <span>Register another property</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
