"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronDown, Check, X, Search } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface ResponsiveSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<SelectOption | string>;
  label?: string;
  modalTitle?: string;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
  triggerClassName?: string;
  renderTriggerValue?: (selected: SelectOption | null) => React.ReactNode;
}

export function ResponsiveSelect({
  value,
  onChange,
  options,
  label,
  modalTitle,
  placeholder = "Select an option",
  disabled = false,
  searchable,
  searchPlaceholder = "Search options...",
  className = "",
  triggerClassName = "",
  renderTriggerValue,
}: ResponsiveSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const normalizedOptions: SelectOption[] = useMemo(
    () =>
      options.map((opt) =>
        typeof opt === "string" ? { value: opt, label: opt } : opt
      ),
    [options]
  );

  const selectedOption = useMemo(
    () => normalizedOptions.find((o) => o.value === value) || null,
    [normalizedOptions, value]
  );

  const showSearch = searchable ?? normalizedOptions.length > 7;

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(true);
        }}
        className={`w-full flex items-center justify-between gap-2 text-left bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary)]/60 focus:border-[var(--primary)] rounded-lg px-3.5 py-2.5 text-xs sm:text-[13px] font-medium text-[var(--text-heading)] transition-colors cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed ${triggerClassName}`}
      >
        <span className="truncate flex-1">
          {renderTriggerValue ? (
            renderTriggerValue(selectedOption)
          ) : selectedOption ? (
            selectedOption.label
          ) : (
            <span className="text-[var(--text-muted)]">{placeholder}</span>
          )}
        </span>
        <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col max-h-[80dvh] sm:max-h-[75dvh] overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

            {/* Header */}
            <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0">
              <h3 className="text-sm font-bold text-[var(--text-heading)] truncate">
                {modalTitle || label || placeholder}
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close selector"
                className="w-7 h-7 rounded-md bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Optional Search Bar */}
            {showSearch && (
              <div className="p-3 border-b border-[var(--border-color)] shrink-0">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full h-9 pl-8 pr-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-[var(--border-color)]/40">
              {filteredOptions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  No matching options found.
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full px-3.5 py-3 rounded-lg flex items-center justify-between gap-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[var(--primary-light)] text-[var(--primary)]"
                          : "hover:bg-[var(--bg-secondary)] text-[var(--text-heading)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                          <span className="text-[13px] font-semibold truncate">
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug">
                            {opt.description}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[var(--primary)] shrink-0 stroke-[2.5]" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

