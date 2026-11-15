"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken } from "@/lib/storage/clientStorage";
import { AgentTopNav } from "@/components/agent/AgentTopNav";
import { X, Plus, ChevronDown, Check } from "lucide-react";

const DEFAULT_COVERAGE_AREAS = ["Ikoyi", "Victoria Island", "Lekki", "Ajah"];
const ALL_SUGGESTED_AREAS = [
  "Ikeja",
  "Surulere",
  "Yaba",
  "Maryland",
  "Magodo",
  "Gbagada",
  "Festac",
  "Wuse II",
];

const AGENT_TYPES = [
  "Field Investigator",
  "Building Inspector / Engineer",
  "Legal / Due Diligence Operative",
  "Document Retrieval Runner",
  "Property Oversite Supervisor",
];

const STORAGE_KEY = "oversite_agent_work_prefs";

export default function AgentCoveragePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [coverageInput, setCoverageInput] = useState("");
  const [coverageAreas, setCoverageAreas] = useState<string[]>(DEFAULT_COVERAGE_AREAS);
  const [agentType, setAgentType] = useState("Field Investigator");
  const [acceptWeekendTasks, setAcceptWeekendTasks] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.coverageAreas) && parsed.coverageAreas.length > 0) {
            setCoverageAreas(parsed.coverageAreas);
          }
          if (parsed.agentType) setAgentType(parsed.agentType);
          if (typeof parsed.acceptWeekendTasks === "boolean") {
            setAcceptWeekendTasks(parsed.acceptWeekendTasks);
          }
        }
      } catch {
        // Use defaults
      }
    }
    if (user?.occupation && AGENT_TYPES.includes(user.occupation)) {
      setAgentType(user.occupation);
    }
  }, [user?.occupation]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const addArea = (areaName: string) => {
    const trimmed = areaName.trim();
    if (!trimmed) return;
    const exists = coverageAreas.some(
      (a) => a.toLowerCase() === trimmed.toLowerCase()
    );
    if (!exists) {
      setCoverageAreas((prev) => [...prev, trimmed]);
    }
    setCoverageInput("");
  };

  const removeArea = (areaName: string) => {
    setCoverageAreas((prev) => prev.filter((a) => a !== areaName));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addArea(coverageInput);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      coverageAreas,
      agentType,
      acceptWeekendTasks,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new Event("oversite:coverage-updated"));
    }

    try {
      const token = await getStoredToken();
      if (token) {
        await fetch("/api/v1/users/me", {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            location: coverageAreas.join(", "),
            occupation: agentType,
          }),
        });
        await refreshUser();
      }
    } catch {
      // Saved locally even if offline
    }

    setIsSaving(false);
    setSavedSuccess(true);
    showToast("Work area & preferences updated!");
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const remainingSuggestions = ALL_SUGGESTED_AREAS.filter(
    (s) => !coverageAreas.some((c) => c.toLowerCase() === s.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-12 select-none">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
            </div>
            <span className="text-[13px] font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <AgentTopNav
        showBack={true}
        backHref="/agent/more"
        title="Where you work"
        hideRightControls={true}
        className="mb-5"
      />

      <form onSubmit={handleSave} className="space-y-7">
        {/* Coverage Area Section */}
        <div className="space-y-4">
          <label className="block text-[14px] font-bold text-[var(--text-heading)]">
            Coverage area
          </label>

          {/* Search / Add Input */}
          <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-full px-5 py-3.5 shadow-2xs transition-colors">
            <input
              type="text"
              value={coverageInput}
              onChange={(e) => setCoverageInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Add coverage area..."
              className="w-full bg-transparent text-[13.5px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
            {coverageInput.trim() && (
              <button
                type="button"
                onClick={() => addArea(coverageInput)}
                className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] shrink-0 cursor-pointer"
              >
                Add
              </button>
            )}
          </div>

          {/* Active Selected Areas (Matches Screenshot 4) */}
          {coverageAreas.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-1">
              {coverageAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => removeArea(area)}
                  className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--text-heading)] hover:text-[var(--danger)] transition-colors cursor-pointer group"
                  title={`Remove ${area}`}
                >
                  <span>{area}</span>
                  <X className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--danger)] stroke-[2.2]" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] px-1">
              No areas selected yet. Add an area above or pick from suggestions below.
            </p>
          )}

          {/* Suggested Areas */}
          {remainingSuggestions.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <span className="block text-[12px] font-medium text-[var(--text-muted)]">
                Suggested areas
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {remainingSuggestions.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => addArea(area)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[12.5px] font-semibold text-[var(--text-heading)] transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-[var(--primary)] stroke-[2.5]" />
                    <span>{area}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Agent Type Dropdown */}
        <div className="space-y-2.5">
          <label className="block text-[14px] font-bold text-[var(--text-heading)]">
            Agent type
          </label>
          <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-4 py-3.5 shadow-2xs">
            <select
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              className="w-full bg-transparent text-[14px] font-semibold text-[var(--text-heading)] outline-none appearance-none pr-6 cursor-pointer"
            >
              {AGENT_TYPES.map((type) => (
                <option
                  key={type}
                  value={type}
                  className="bg-[var(--bg-card)] text-[var(--text-heading)]"
                >
                  {type}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Accept Weekend Tasks Toggle */}
        <div className="flex items-center justify-between gap-4 py-1">
          <div>
            <h3 className="text-[14px] font-bold text-[var(--text-heading)]">
              Accept weekend tasks
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Often pay a premium fee
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={acceptWeekendTasks}
            onClick={() => setAcceptWeekendTasks(!acceptWeekendTasks)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
              acceptWeekendTasks
                ? "bg-[var(--primary)]"
                : "bg-[var(--bg-secondary)] dark:bg-[#25272c] border border-[var(--border-color)]"
            }`}
          >
            <span
              className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                acceptWeekendTasks ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Save Changes Button */}
        <div className="pt-8">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-[0.99] text-white font-bold text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
          >
            {isSaving ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : savedSuccess ? (
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[3]" /> Saved Changes
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

