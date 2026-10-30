"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X } from "lucide-react";

export interface SearchConfig {
  active: boolean;
  onActiveChange: (active: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  placeholder?: string;
}

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  showBack?: boolean;
  backHref?: string;
  onBack?: () => void;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  searchConfig?: SearchConfig;
  className?: string;
  centeredTitle?: boolean;
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  backHref,
  onBack,
  leftSlot,
  rightSlot,
  searchConfig,
  className = "",
  centeredTitle = true,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard");
    }
  };

  // ─── ACTIVE INLINE SEARCH MODE ───
  if (searchConfig && searchConfig.active) {
    return (
      <div className={`relative flex items-center gap-2 py-2 mb-4 w-full ${className}`}>
        <button
          type="button"
          onClick={() => {
            searchConfig.onActiveChange(false);
            searchConfig.onQueryChange("");
          }}
          className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer shrink-0"
          aria-label="Close search"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 relative flex items-center">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            autoFocus
            value={searchConfig.query}
            onChange={(e) => searchConfig.onQueryChange(e.target.value)}
            placeholder={searchConfig.placeholder || "Search..."}
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full pl-10 pr-9 py-2.5 text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none shadow-xs focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all"
          />
          {searchConfig.query && (
            <button
              type="button"
              onClick={() => searchConfig.onQueryChange("")}
              className="absolute right-3 p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── STANDARD UNIFIED HEADER ───
  const hasBack = showBack || Boolean(backHref) || Boolean(onBack);

  return (
    <div className={`relative flex items-center justify-between min-h-[44px] py-1 mb-4 sm:mb-5 w-full ${className}`}>
      {/* Left Slot / Back Button */}
      <div className="flex items-center min-w-[40px] shrink-0">
        {hasBack ? (
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2]" />
          </button>
        ) : (
          leftSlot || <div className="w-10" />
        )}
      </div>

      {/* Center Title & Subtitle */}
      <div className={`flex-1 min-w-0 px-2.5 ${centeredTitle ? "text-center" : "text-left"}`}>
        <h1 className="text-[18px] sm:text-[19px] font-bold text-[var(--text-heading)] tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11.5px] text-[var(--text-muted)] truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Slot / Action Buttons */}
      <div className="flex items-center justify-end gap-2 min-w-[40px] shrink-0">
        {rightSlot || <div className="w-10" />}
      </div>
    </div>
  );
}
