"use client";

import { useState } from "react";

export default function TasksPage() {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All tasks");

  return (
    <div className="space-y-6 relative pb-8 min-h-[calc(100vh-80px)]">

      {/* Dynamic Top Bar */}
      {isSearchActive ? (
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={() => setIsSearchActive(false)}
            className="w-10 h-10 flex items-center justify-center text-[var(--text-heading)] shrink-0"
          >
            <i className="ai-arrow-left text-[20px]" />
          </button>

          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              placeholder="Search task.."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full h-10 pl-4 pr-10 rounded-full bg-white dark:bg-(--bg-secondary) border-transparent outline-none text-[14px] text-[var(--text-heading)] placeholder:text-var(--text-muted) shadow-[0_0_10px_rgba(0,0,0,0.03)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 text-var(--text-muted) hover:text-[var(--text-heading)]"
              >
                <i className="ai-cross text-[14px]" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsFilterOpen(true)}
            className="w-10 h-10 rounded-full bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0"
          >
            <i className="ai-filter text-[18px] text-[var(--text-heading)]" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-2">
          <h1 className="text-[20px] font-bold text-[var(--text-heading)]">Tasks</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchActive(true)}
              className="w-10 h-10 rounded-full bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex items-center justify-center hover:bg-(--bg-secondary) transition-colors"
            >
              <i className="ai-search text-[20px] text-[var(--text-heading)]" />
            </button>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="w-10 h-10 rounded-full bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex items-center justify-center hover:bg-(--bg-secondary) transition-colors"
            >
              <i className="ai-filter text-[20px] text-[var(--text-heading)]" />
            </button>
          </div>
        </div>
      )}

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button className="px-5 py-2 rounded-[24px] bg-[var(--primary)] text-white text-[13px] font-semibold whitespace-nowrap">
          All
        </button>
        <button className="px-5 py-2 rounded-[24px] bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] text-[var(--text-heading)] text-[13px] font-medium whitespace-nowrap hover:bg-(--bg-secondary) transition-colors">
          Property
        </button>
        <button className="px-5 py-2 rounded-[24px] bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] text-[var(--text-heading)] text-[13px] font-medium whitespace-nowrap hover:bg-(--bg-secondary) transition-colors">
          Documents
        </button>
        <button className="px-5 py-2 rounded-[24px] bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] text-[var(--text-heading)] text-[13px] font-medium whitespace-nowrap hover:bg-(--bg-secondary) transition-colors">
          Due Diligence
        </button>
      </div>

      {/* Task List */}
      <div className="bg-(--bg-card) rounded-[24px] p-2 space-y-1 shadow-[0_0_10px_rgba(0,0,0,0.03)]">

        {/* Task 1 */}
        <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-(--bg-secondary) transition-colors">
          <div>
            <h3 className="text-[14px] font-bold text-[var(--text-heading)]">CAC certified copy</h3>
            <p className="text-[12px] text-var(--text-muted) mt-0.5">Property Oversite · Tunde C. · 2h ago</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--primary)]/10 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            <span className="text-[10px] font-bold text-[var(--primary)]">Ready</span>
          </div>
        </div>
        <hr className="border-t border-(--border-color) mx-3" />

        {/* Task 2 */}
        <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-(--bg-secondary) transition-colors">
          <div>
            <h3 className="text-[14px] font-bold text-[var(--text-heading)]">Ikoyi site visit</h3>
            <p className="text-[12px] text-var(--text-muted) mt-0.5">Property Oversite · Tunde C. · 2h ago</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--primary)]/10 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            <span className="text-[10px] font-bold text-[var(--primary)]">Ready</span>
          </div>
        </div>
        <hr className="border-t border-(--border-color) mx-3" />

        {/* Task 3 */}
        <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-(--bg-secondary) transition-colors">
          <div>
            <h3 className="text-[14px] font-bold text-[var(--text-heading)]">CAC certified copy</h3>
            <p className="text-[12px] text-var(--text-muted) mt-0.5">Document Processing · Folake A. · today</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-amber-500">In progress</span>
          </div>
        </div>
        <hr className="border-t border-(--border-color) mx-3" />

        {/* Task 4 */}
        <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-(--bg-secondary) transition-colors">
          <div>
            <h3 className="text-[14px] font-bold text-[var(--text-heading)]">CAC certified copy</h3>
            <p className="text-[12px] text-var(--text-muted) mt-0.5">Quick Errands · Bisi K. · 3d ago</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-amber-500">In progress</span>
          </div>
        </div>
        <hr className="border-t border-(--border-color) mx-3" />

        {/* Task 5 */}
        <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-(--bg-secondary) transition-colors">
          <div>
            <h3 className="text-[14px] font-bold text-[var(--text-heading)]">Utility bill payment</h3>
            <p className="text-[12px] text-var(--text-muted) mt-0.5">Document Processing · Folake A. · today</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[10px] font-bold text-amber-500">In progress</span>
          </div>
        </div>
        <hr className="border-t border-(--border-color) mx-3" />

        {/* Task 6 */}
        <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-(--bg-secondary) transition-colors">
          <div>
            <h3 className="text-[14px] font-bold text-[var(--text-heading)]">Vendor background check</h3>
            <p className="text-[12px] text-var(--text-muted) mt-0.5">Due Diligence · Tier 2 · yesterday</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[10px] font-bold text-blue-500">Review</span>
          </div>
        </div>
        <hr className="border-t border-(--border-color) mx-3" />

        {/* Task 7 */}
        <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-(--bg-secondary) transition-colors">
          <div>
            <h3 className="text-[14px] font-bold text-[var(--text-heading)]">Vendor background check</h3>
            <p className="text-[12px] text-var(--text-muted) mt-0.5">Due Diligence · Tier 2 · yesterday</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-500/10 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            <span className="text-[10px] font-bold text-[var(--text-heading)]">Completed</span>
          </div>
        </div>

      </div>

      {/* Floating Action Button (FAB) */}
      <button className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-[var(--primary)] text-white rounded-full flex items-center justify-center shadow-lg shadow-[var(--primary)]/40 hover:scale-105 active:scale-95 transition-all z-40">
        <i className="ai-plus text-[24px]" />
      </button>

      {/* --- FILTER OVERLAY (Bottom Sheet on Mobile, Centered Modal on Desktop) --- */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterOpen(false)}
          />

          {/* Modal / Bottom Sheet Content */}
          <div className="relative bg-(--bg-card) w-full md:w-[400px] rounded-t-[24px] md:rounded-[24px] px-6 pt-3 md:pt-6 pb-8 shadow-2xl animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300">
            {/* Mobile drag handle */}
            <div className="w-10 h-1.5 bg-(--border-color) rounded-full mx-auto mb-6 md:hidden" />

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-[var(--text-heading)]">Filter</h2>
              {/* Desktop close button */}
              <button onClick={() => setIsFilterOpen(false)} className="hidden md:flex w-8 h-8 items-center justify-center bg-(--bg-secondary) rounded-full text-[var(--text-heading)] hover:bg-(--border-color) transition-colors">
                <i className="ai-cross text-[14px]" />
              </button>
            </div>

            <div className="space-y-1">
              {["All tasks", "In progress", "Report ready", "Completed"].map((filterOpt) => {
                const isSelected = selectedFilter === filterOpt;
                return (
                  <button
                    key={filterOpt}
                    onClick={() => {
                      setSelectedFilter(filterOpt);
                      setTimeout(() => setIsFilterOpen(false), 200); // Auto close after selection
                    }}
                    className="w-full flex items-center justify-between py-3 hover:bg-(--bg-secondary) rounded-xl px-2 -mx-2 transition-colors"
                  >
                    <span className="text-[14px] font-medium text-[var(--text-heading)]">{filterOpt}</span>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[#C0C4CC] dark:border-slate-600 bg-transparent"
                        }`}
                    >
                      {isSelected && <i className="ai-check text-white text-[12px] font-bold" />}
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
