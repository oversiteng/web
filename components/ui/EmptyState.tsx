"use client";

import React from "react";
import Link from "next/link";
import {
  ClipboardList,
  MapPin,
  FolderLock,
  MessageSquare,
  Bell,
  SearchX,
  FilterX,
  CreditCard,
  Plus,
  ArrowRight,
  RotateCcw,
  Sparkles,
  LucideIcon,
} from "lucide-react";

export type EmptyStatePreset =
  | "tasks"
  | "properties"
  | "vault"
  | "messages"
  | "notifications"
  | "search"
  | "filter"
  | "billing"
  | "custom";

export interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
}

export interface EmptyStateSuggestion {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  preset?: EmptyStatePreset;
  title?: string;
  description?: string;
  query?: string;
  icon?: React.ReactNode;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  suggestions?: EmptyStateSuggestion[];
  compact?: boolean;
  className?: string;
}

interface PresetConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: EmptyStateAction;
  suggestions?: EmptyStateSuggestion[];
}

export function EmptyState({
  preset = "custom",
  title,
  description,
  query,
  icon,
  action,
  secondaryAction,
  suggestions,
  compact = false,
  className = "",
}: EmptyStateProps) {
  // Preset defaults
  const presetConfigs: Record<EmptyStatePreset, PresetConfig> = {
    tasks: {
      title: "No active tasks right now",
      description:
        "Your oversight queue is clear. Request a field inspection, due diligence check, or document retrieval to receive real-time verified reports.",
      icon: <ClipboardList className="w-8 h-8 text-[var(--primary)] stroke-[1.8]" />,
      action: {
        label: "Request a Service",
        href: "/dashboard",
        icon: Plus,
      },
      suggestions: [
        { label: "Quick Errands", href: "/errands" },
        { label: "Due Diligence", href: "/diligence" },
        { label: "Legal Advisory", href: "/legal" },
        { label: "Property Oversite", href: "/property-oversite" },
      ],
    },
    properties: {
      title: "Your portfolio is awaiting its first plot",
      description:
        "Register your land, residential build, or commercial property to unlock satellite GPS mapping, boundary protection, and accredited field oversight.",
      icon: <MapPin className="w-8 h-8 text-emerald-500 stroke-[1.8]" />,
      action: {
        label: "Register Property Plot",
        href: "/properties/new",
        icon: Plus,
      },
      suggestions: [
        { label: "Bare Land", href: "/properties/new" },
        { label: "Under Construction", href: "/properties/new" },
        { label: "Completed Building", href: "/properties/new" },
      ],
    },
    vault: {
      title: "Document vault is all clear",
      description:
        "Verified land titles, survey plans, and CAC certifications generated from your completed tasks are automatically encrypted and archived here.",
      icon: <FolderLock className="w-8 h-8 text-sky-500 stroke-[1.8]" />,
      action: {
        label: "Process New Document",
        href: "/dashboard",
        icon: Plus,
      },
      suggestions: [
        { label: "CAC Certified Copy", href: "/vault" },
        { label: "Title Deed Verification", href: "/diligence" },
      ],
    },
    messages: {
      title: "No active conversations",
      description:
        "Direct communication channels with your assigned on-site field agents and legal advisors will open here once an assignment is underway.",
      icon: <MessageSquare className="w-8 h-8 text-amber-500 stroke-[1.8]" />,
      action: {
        label: "View Tasks to Chat",
        href: "/dashboard/tasks",
        icon: ArrowRight,
      },
    },
    notifications: {
      title: "You're all caught up",
      description:
        "Zero unread alerts. Real-time updates on agent arrivals, report sign-offs, and critical boundary alerts will notify you here.",
      icon: <Sparkles className="w-8 h-8 text-[var(--primary)] stroke-[1.8]" />,
      action: {
        label: "Back to Dashboard",
        href: "/dashboard",
      },
    },
    search: {
      title: query ? `No results for "${query}"` : "No matches found",
      description:
        "We couldn't find any records matching your search. Try checking for typos or searching for a broader keyword.",
      icon: <SearchX className="w-8 h-8 text-slate-400 stroke-[1.8]" />,
      action: {
        label: "Clear Search",
        icon: RotateCcw,
      },
    },
    filter: {
      title: "No results for this filter",
      description:
        "There are no items matching your selected criteria. Try adjusting or clearing your filters to see more results.",
      icon: <FilterX className="w-8 h-8 text-slate-400 stroke-[1.8]" />,
      action: {
        label: "Reset All Filters",
        icon: RotateCcw,
      },
    },
    billing: {
      title: "No payment history yet",
      description:
        "Invoices, receipts, and statement summaries for completed field assignments will appear here automatically.",
      icon: <CreditCard className="w-8 h-8 text-slate-400 stroke-[1.8]" />,
      action: {
        label: "Browse Services",
        href: "/dashboard",
        icon: ArrowRight,
      },
    },
    custom: {
      title: title || "No data available",
      description: description || "There are no records to display at this moment.",
      icon: icon || <ClipboardList className="w-8 h-8 text-[var(--text-muted)] stroke-[1.8]" />,
      action,
      suggestions,
    },
  };

  const active = presetConfigs[preset] || presetConfigs.custom;
  const finalTitle = title || active.title;
  const finalDescription = description || active.description;
  const finalIcon = icon || active.icon;
  const finalAction = action || active.action;
  const finalSuggestions = suggestions || active.suggestions;

  // ─── COMPACT MODE (e.g. For dashboard cards or widgets) ───
  if (compact) {
    return (
      <div
        className={`py-6 px-4 text-center rounded-2xl bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] space-y-2.5 ${className}`}
      >
        <div className="w-11 h-11 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto text-[var(--primary)] shadow-2xs">
          {finalIcon}
        </div>
        <div>
          <h3 className="text-[13.5px] font-bold text-[var(--text-heading)] leading-snug">
            {finalTitle}
          </h3>
          <p className="text-[11.5px] text-[var(--text-muted)] mt-1 max-w-xs mx-auto leading-relaxed">
            {finalDescription}
          </p>
        </div>
        {finalAction && (
          <div className="pt-1">
            {finalAction.href ? (
              <Link
                href={finalAction.href}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
              >
                {finalAction.icon && <finalAction.icon className="w-3.5 h-3.5" />}
                <span>{finalAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={finalAction.onClick}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
              >
                {finalAction.icon && <finalAction.icon className="w-3.5 h-3.5" />}
                <span>{finalAction.label}</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── FULL PAGE MODE ───
  return (
    <div
      className={`relative w-full py-12 sm:py-16 px-4 text-center rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)]/80 shadow-xs overflow-hidden ${className}`}
    >
      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-radial from-[var(--primary-light)] to-transparent opacity-60 pointer-events-none rounded-full blur-2xl" />

      <div className="relative z-10 max-w-md mx-auto space-y-4">
        {/* Layered Icon Frame */}
        <div className="relative w-16 h-16 sm:w-18 sm:h-18 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] shadow-xs rotate-3" />
          <div className="relative z-10 w-full h-full rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm flex items-center justify-center">
            {finalIcon}
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-1.5 pt-1">
          <h2 className="text-[17px] sm:text-[18px] font-bold text-[var(--text-heading)] tracking-tight">
            {finalTitle}
          </h2>
          <p className="text-[12.5px] sm:text-[13px] text-[var(--text-muted)] leading-relaxed max-w-sm mx-auto">
            {finalDescription}
          </p>
        </div>

        {/* Primary and Secondary Action Buttons */}
        {(finalAction || secondaryAction) && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {finalAction &&
              (finalAction.href ? (
                <Link
                  href={finalAction.href}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-95 text-white text-[13px] font-semibold transition-all shadow-sm shadow-[var(--primary)]/20 cursor-pointer"
                >
                  {finalAction.icon && <finalAction.icon className="w-4 h-4 stroke-[2.2]" />}
                  <span>{finalAction.label}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={finalAction.onClick}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-95 text-white text-[13px] font-semibold transition-all shadow-sm shadow-[var(--primary)]/20 cursor-pointer"
                >
                  {finalAction.icon && <finalAction.icon className="w-4 h-4 stroke-[2.2]" />}
                  <span>{finalAction.label}</span>
                </button>
              ))}

            {secondaryAction &&
              (secondaryAction.href ? (
                <Link
                  href={secondaryAction.href}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-color)]/50 text-[var(--text-heading)] border border-[var(--border-color)] text-[13px] font-semibold transition-all cursor-pointer"
                >
                  {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />}
                  <span>{secondaryAction.label}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={secondaryAction.onClick}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-color)]/50 text-[var(--text-heading)] border border-[var(--border-color)] text-[13px] font-semibold transition-all cursor-pointer"
                >
                  {secondaryAction.icon && <secondaryAction.icon className="w-4 h-4" />}
                  <span>{secondaryAction.label}</span>
                </button>
              ))}
          </div>
        )}

        {/* Quick Suggestion Chips */}
        {finalSuggestions && finalSuggestions.length > 0 && (
          <div className="pt-3 border-t border-[var(--border-color)]/60">
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Popular services & shortcuts
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {finalSuggestions.map((sug, idx) =>
                sug.href ? (
                  <Link
                    key={idx}
                    href={sug.href}
                    className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-color)]/70 text-[var(--text-heading)] text-[11.5px] font-medium border border-[var(--border-color)]/70 transition-colors"
                  >
                    {sug.label}
                  </Link>
                ) : (
                  <button
                    key={idx}
                    type="button"
                    onClick={sug.onClick}
                    className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-color)]/70 text-[var(--text-heading)] text-[11.5px] font-medium border border-[var(--border-color)]/70 transition-colors cursor-pointer"
                  >
                    {sug.label}
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
