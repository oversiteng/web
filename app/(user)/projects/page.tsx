"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
} from "lucide-react";

interface Milestone {
  id: string;
  name: string;
  date: string;
}

const BUILDING_TYPES = [
  "Residential (Duplex, Bungalow, Flats)",
  "Commercial (Offices, Mall, Plaza)",
  "Mixed-Use Development",
  "Industrial & Warehouse Facility",
  "Renovation & Remodeling",
];

const REVIEW_SCOPES = [
  "Full Project Lifecycle",
  "Structural & Foundation",
  "Finishing & Interior",
  "Compliance & Safety",
];

const SUPERVISOR_EXPERTISE = [
  "Structural Engineer",
  "MEP",
  "Civil Engineer",
  "Finishing",
];

export default function ProjectReviewFormPage() {
  const router = useRouter();

  // Form State
  const [projectName, setProjectName] = useState("");
  const [buildingType, setBuildingType] = useState("");
  const [targetCompletion, setTargetCompletion] = useState("");
  const [targetCompletionRaw, setTargetCompletionRaw] = useState("");
  const [reviewScope, setReviewScope] = useState("");
  const [supervisorExpertise, setSupervisorExpertise] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Drawer visibility state (z-[80] to sit cleanly above z-50 bottom nav)
  const [activeDrawer, setActiveDrawer] = useState<
    "building" | "milestone" | "scope" | "supervisor" | null
  >(null);

  // New Milestone Form State
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneDate, setNewMilestoneDate] = useState("");
  const [newMilestoneDateRaw, setNewMilestoneDateRaw] = useState("");

  // Refs for native calendar pickers
  const targetDateRef = useRef<HTMLInputElement>(null);
  const milestoneDateRef = useRef<HTMLInputElement>(null);

  // Minimum date for pickers (today)
  const minDate = new Date().toISOString().split("T")[0];

  // Helper to format YYYY-MM-DD -> DD/MM/YYYY
  const formatDateToDDMMYYYY = (val: string) => {
    if (!val) return "";
    const parts = val.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return val;
  };

  const handleTargetDateChange = (val: string) => {
    setTargetCompletionRaw(val);
    setTargetCompletion(formatDateToDDMMYYYY(val));
  };

  const handleMilestoneDateChange = (val: string) => {
    setNewMilestoneDateRaw(val);
    setNewMilestoneDate(formatDateToDDMMYYYY(val));
  };

  // Add Milestone Handler
  const handleAddMilestone = () => {
    if (!newMilestoneName.trim()) return;
    const dateFormatted = newMilestoneDate || formatDateToDDMMYYYY(minDate);

    setMilestones((prev) => [
      ...prev,
      {
        id: "ms-" + Date.now().toString(),
        name: newMilestoneName.trim(),
        date: dateFormatted,
      },
    ]);
    setNewMilestoneName("");
    setNewMilestoneDate("");
    setNewMilestoneDateRaw("");
    setActiveDrawer(null);
  };

  const handleRemoveMilestone = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  // Validation
  const canProceed =
    projectName.trim().length >= 2 &&
    buildingType &&
    reviewScope &&
    supervisorExpertise;

  // Navigate to dedicated /projects/review page
  const handleReview = () => {
    if (!canProceed) return;

    // Save draft to sessionStorage for /projects/review to read
    const draft = {
      projectName: projectName.trim(),
      buildingType,
      targetCompletion: targetCompletion || "DD/MM/YYYY",
      targetCompletionRaw,
      reviewScope,
      supervisorExpertise,
      milestones,
      priceNgn: 12000,
    };
    sessionStorage.setItem("oversite_project_draft", JSON.stringify(draft));

    // Also pass primary query parameters for direct linkability
    const query = new URLSearchParams({
      name: projectName.trim(),
      type: buildingType,
      scope: reviewScope,
      expert: supervisorExpertise,
      date: targetCompletion || "",
    });

    router.push(`/projects/review?${query.toString()}`);
  };

  return (
    <div className="bg-[#F2F4F2] dark:bg-[#111412] min-h-screen text-[var(--text-heading)] transition-colors duration-150">
      <div className="max-w-xl mx-auto min-h-screen flex flex-col justify-between px-4 sm:px-6 py-4">
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
              Project review
            </h1>
          </div>

          {/* ── Form Fields ── */}
          <div className="space-y-4">
            {/* Field 1: Project Name */}
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Project name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder=""
                className="w-full bg-white dark:bg-[#1E2220] rounded-[18px] px-4 py-3.5 text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border border-transparent focus:border-[var(--primary)] focus:outline-none transition-all shadow-xs"
              />
            </div>

            {/* Field 2: Building Type */}
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Building type
              </label>
              <button
                type="button"
                onClick={() => setActiveDrawer("building")}
                className="w-full bg-white dark:bg-[#1E2220] rounded-[18px] px-4 py-3.5 flex items-center justify-between text-[14px] text-left cursor-pointer border border-transparent focus:border-[var(--primary)] transition-all shadow-xs"
              >
                <span
                  className={
                    buildingType
                      ? "text-zinc-900 dark:text-white font-medium truncate pr-2"
                      : "text-zinc-400 dark:text-zinc-500"
                  }
                >
                  {buildingType || ""}
                </span>
                <ChevronDown className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              </button>
            </div>

            {/* Field 3: Target Completion (Calendar Picker matching Legal Page) */}
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Target completion
              </label>
              <div
                onClick={() => {
                  try {
                    targetDateRef.current?.showPicker?.();
                  } catch {
                    targetDateRef.current?.focus();
                  }
                }}
                className="relative w-full bg-white dark:bg-[#1E2220] rounded-[18px] px-4 py-3.5 flex items-center justify-between border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus-within:border-[var(--primary)] transition-colors shadow-xs cursor-pointer text-left"
              >
                <span
                  className={`text-[14px] ${
                    targetCompletion
                      ? "text-zinc-900 dark:text-white font-medium"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {targetCompletion || "DD/MM/YYYY"}
                </span>
                <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 pointer-events-none">
                  <Calendar className="w-4 h-4" />
                  <ChevronDown className="w-4 h-4" />
                </div>

                <input
                  ref={targetDateRef}
                  type="date"
                  min={minDate}
                  value={targetCompletionRaw}
                  onChange={(e) => handleTargetDateChange(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [color-scheme:dark_light]"
                  aria-label="Select target completion date"
                />
              </div>
            </div>

            {/* Section 4: Milestones */}
            <div>
              <div className="mb-2">
                <h2 className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200">
                  Milestones
                </h2>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Add the stages you want to be checked
                </p>
              </div>

              {/* List of Added Milestones */}
              {milestones.length > 0 && (
                <div className="space-y-2.5 mb-2.5">
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      className="w-full bg-white dark:bg-[#1E2220] rounded-[18px] px-4 py-3.5 flex items-center justify-between shadow-xs border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
                    >
                      <span className="text-[14px] font-medium text-zinc-900 dark:text-white truncate pr-2">
                        {m.name}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[13px] text-zinc-400 dark:text-zinc-400">
                          {m.date}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveMilestone(m.id, e)}
                          className="text-zinc-400 hover:text-red-500 transition-colors cursor-pointer p-0.5"
                          title="Remove milestone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Milestone Trigger Button */}
              <button
                type="button"
                onClick={() => setActiveDrawer("milestone")}
                className="w-full bg-white dark:bg-[#1E2220] rounded-[18px] py-4 px-4 flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:opacity-90 active:scale-[0.99] transition-all"
              >
                <Plus className="w-4 h-4 text-[#2BB44A]" />
                <span className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200">
                  Add milestone
                </span>
              </button>
            </div>

            {/* Field 5: Review Scope */}
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Review scope
              </label>
              <button
                type="button"
                onClick={() => setActiveDrawer("scope")}
                className="w-full bg-white dark:bg-[#1E2220] rounded-[18px] px-4 py-3.5 flex items-center justify-between text-[14px] text-left cursor-pointer border border-transparent focus:border-[var(--primary)] transition-all shadow-xs"
              >
                <span
                  className={
                    reviewScope
                      ? "text-zinc-900 dark:text-white font-medium"
                      : "text-zinc-400 dark:text-zinc-500"
                  }
                >
                  {reviewScope || "select"}
                </span>
                <ChevronDown className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              </button>
            </div>

            {/* Field 6: Supervisor Expertise */}
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Supervisor expertise
              </label>
              <button
                type="button"
                onClick={() => setActiveDrawer("supervisor")}
                className="w-full bg-white dark:bg-[#1E2220] rounded-[18px] px-4 py-3.5 flex items-center justify-between text-[14px] text-left cursor-pointer border border-transparent focus:border-[var(--primary)] transition-all shadow-xs"
              >
                <span
                  className={
                    supervisorExpertise
                      ? "text-zinc-900 dark:text-white font-medium"
                      : "text-zinc-400 dark:text-zinc-500"
                  }
                >
                  {supervisorExpertise || "select"}
                </span>
                <ChevronDown className="w-5 h-5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom Sticky Bar: Review ── */}
        <div className="sticky bottom-0 bg-[#F2F4F2]/95 dark:bg-[#111412]/95 backdrop-blur-md pt-4 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-6 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[14px] font-medium text-zinc-500 dark:text-zinc-400">
              Service fee
            </span>
            <span className="text-[18px] sm:text-[20px] font-bold text-zinc-900 dark:text-white">
              ₦12,000
            </span>
          </div>

          <button
            type="button"
            disabled={!canProceed}
            onClick={handleReview}
            className="w-full py-3.5 sm:py-4 rounded-full bg-[#2BB44A] hover:bg-[#259b40] active:scale-[0.98] text-white font-bold text-[16px] transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Review
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM DRAWERS / MODALS (z-[80] to sit cleanly ABOVE bottom nav)
         ───────────────────────────────────────────────────────────── */}

      {/* 1. Drawer: Add a Milestone */}
      {activeDrawer === "milestone" && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setActiveDrawer(null)}
          />
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#1A1E1D] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />

            <div className="text-center mb-6">
              <h3 className="text-[18px] font-bold text-zinc-900 dark:text-white">
                Add a milestone
              </h3>
              <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 mt-1">
                The oversite manager verifies the progress against each one.
              </p>
            </div>

            <div className="space-y-4">
              {/* Field 1: Milestone Name */}
              <div>
                <label className="block text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                  Project name
                </label>
                <input
                  type="text"
                  value={newMilestoneName}
                  onChange={(e) => setNewMilestoneName(e.target.value)}
                  placeholder=""
                  className="w-full bg-[#F2F4F2] dark:bg-[#252A26] rounded-[18px] px-4 py-3.5 text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none transition-all shadow-xs"
                />
              </div>

              {/* Field 2: Target Completion with Calendar Picker */}
              <div>
                <label className="block text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                  Target completion
                </label>
                <div
                  onClick={() => {
                    try {
                      milestoneDateRef.current?.showPicker?.();
                    } catch {
                      milestoneDateRef.current?.focus();
                    }
                  }}
                  className="relative w-full bg-[#F2F4F2] dark:bg-[#252A26] rounded-[18px] px-4 py-3.5 flex items-center justify-between cursor-pointer text-left shadow-xs"
                >
                  <span
                    className={`text-[14px] ${
                      newMilestoneDate
                        ? "text-zinc-900 dark:text-white font-medium"
                        : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {newMilestoneDate || "DD/MM/YYYY"}
                  </span>
                  <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 pointer-events-none">
                    <Calendar className="w-4 h-4" />
                    <ChevronDown className="w-4 h-4" />
                  </div>

                  <input
                    ref={milestoneDateRef}
                    type="date"
                    min={minDate}
                    value={newMilestoneDateRaw}
                    onChange={(e) => handleMilestoneDateChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [color-scheme:dark_light]"
                    aria-label="Select milestone completion date"
                  />
                </div>
              </div>
            </div>

            {/* Buttons: Cancel vs Add milestone */}
            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => setActiveDrawer(null)}
                className="w-1/2 py-3.5 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[#2BB44A] font-bold text-[14px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddMilestone}
                disabled={!newMilestoneName.trim()}
                className="w-1/2 py-3.5 rounded-full bg-[#2BB44A] hover:bg-[#259b40] text-white font-bold text-[14px] transition-colors cursor-pointer disabled:opacity-40"
              >
                Add milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Drawer: Building Type */}
      {activeDrawer === "building" && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setActiveDrawer(null)}
          />
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#1A1E1D] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
            <h3 className="text-[18px] font-bold text-center text-zinc-900 dark:text-white mb-4">
              Building type
            </h3>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {BUILDING_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setBuildingType(type);
                    setActiveDrawer(null);
                  }}
                  className={`w-full py-4 px-2 text-left text-[15px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    buildingType === type
                      ? "text-[#2BB44A] font-semibold"
                      : "text-zinc-800 dark:text-zinc-200 hover:text-[#2BB44A]"
                  }`}
                >
                  <span>{type}</span>
                  {buildingType === type && (
                    <CheckCircle2 className="w-5 h-5 text-[#2BB44A]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Drawer: Review Scope */}
      {activeDrawer === "scope" && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setActiveDrawer(null)}
          />
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#1A1E1D] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
            <h3 className="text-[18px] font-bold text-center text-zinc-900 dark:text-white mb-4">
              Review scope
            </h3>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {REVIEW_SCOPES.map((scope) => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => {
                    setReviewScope(scope);
                    setActiveDrawer(null);
                  }}
                  className={`w-full py-4 px-2 text-left text-[15px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    reviewScope === scope
                      ? "text-[#2BB44A] font-semibold"
                      : "text-zinc-800 dark:text-zinc-200 hover:text-[#2BB44A]"
                  }`}
                >
                  <span>{scope}</span>
                  {reviewScope === scope && (
                    <CheckCircle2 className="w-5 h-5 text-[#2BB44A]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Drawer: Supervisor Expertise */}
      {activeDrawer === "supervisor" && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setActiveDrawer(null)}
          />
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#1A1E1D] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />
            <h3 className="text-[18px] font-bold text-center text-zinc-900 dark:text-white mb-4">
              Supervisor expertise
            </h3>
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {SUPERVISOR_EXPERTISE.map((exp) => (
                <button
                  key={exp}
                  type="button"
                  onClick={() => {
                    setSupervisorExpertise(exp);
                    setActiveDrawer(null);
                  }}
                  className={`w-full py-4 px-2 text-left text-[15px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    supervisorExpertise === exp
                      ? "text-[#2BB44A] font-semibold"
                      : "text-zinc-800 dark:text-zinc-200 hover:text-[#2BB44A]"
                  }`}
                >
                  <span>{exp}</span>
                  {supervisorExpertise === exp && (
                    <CheckCircle2 className="w-5 h-5 text-[#2BB44A]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
