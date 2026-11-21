"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken } from "@/lib/storage/clientStorage";
import { AgentTopNav } from "@/components/agent/AgentTopNav";
import { X, Plus, Check, Lock } from "lucide-react";
import { getAgentTypeLabel } from "@/lib/constants/agentTypes";

const ALL_SUGGESTED_AREAS = [
  "Ikoyi",
  "Victoria Island",
  "Lekki",
  "Ajah",
  "Ikeja",
  "Surulere",
  "Yaba",
  "Maryland",
  "Magodo",
  "Gbagada",
  "Festac",
  "Wuse II",
];

function getWorkPrefsStorageKey(userId?: string | null) {
  return userId ? `oversite_agent_work_prefs_${userId}` : "oversite_agent_work_prefs";
}

export default function AgentCoveragePage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [coverageInput, setCoverageInput] = useState("");
  // Do NOT pre-fill mock areas; start empty until loaded from user profile or saved by agent
  const [coverageAreas, setCoverageAreas] = useState<string[]>([]);
  const [acceptWeekendTasks, setAcceptWeekendTasks] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canonical Agent Type comes strictly from signup / agentProfile.tier
  const agentTypeLabel = getAgentTypeLabel(
    (user as any)?.agentProfile?.tier || (user as any)?.agentTier || null
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const key = getWorkPrefsStorageKey(user?.id);
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.coverageAreas)) {
            setCoverageAreas(parsed.coverageAreas);
          }
          if (typeof parsed.acceptWeekendTasks === "boolean") {
            setAcceptWeekendTasks(parsed.acceptWeekendTasks);
          }
          return;
        }
      } catch {
        // Fallback to user.location
      }
    }
    if (user?.location && user.location.trim().length > 0) {
      const areas = user.location
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      setCoverageAreas(areas);
    } else {
      setCoverageAreas([]);
    }
  }, [user?.id, user?.location]);

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
      agentType: agentTypeLabel,
      acceptWeekendTasks,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(getWorkPrefsStorageKey(user?.id), JSON.stringify(payload));
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
          }),
        });
        await refreshUser();
      }
    } catch {
      // Saved locally even if offline
    }

    setIsSaving(false);
    setSavedSuccess(true);
    showToast("Coverage area & work preferences updated!");
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const remainingSuggestions = ALL_SUGGESTED_AREAS.filter(
    (s) => !coverageAreas.some((c) => c.toLowerCase() === s.toLowerCase())
  ).slice(0, 6);

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-24 select-none">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
            </div>
            <span className="text-[13px] font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header — Uses router.replace to prevent back-button loop with /settings/profile */}
      <AgentTopNav
        showBack={true}
        onBack={() => router.replace("/settings/profile")}
        title="Where you work"
        hideRightControls={true}
        className="mb-5"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Coverage Area Section */}
        <div className="space-y-3.5">
          <label className="block text-[14px] font-bold text-[var(--text-heading)]">
            Coverage area
          </label>

          {/* Search / Add Input */}
          <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-lg px-4 py-3 shadow-2xs transition-colors">
            <input
              type="text"
              value={coverageInput}
              onChange={(e) => setCoverageInput(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Enter city, LGA, or neighborhood..."
              className="w-full bg-transparent text-[13px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
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

          {/* Active Selected Areas */}
          {coverageAreas.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {coverageAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => removeArea(area)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary-light)] border border-[var(--primary-border)] text-xs font-semibold text-[var(--primary)] hover:text-[var(--danger)] transition-colors cursor-pointer group"
                  title={`Remove ${area}`}
                >
                  <span>{area}</span>
                  <X className="w-3.5 h-3.5 stroke-[2.2]" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] px-1">
              No coverage areas added yet. Type an area above or tap a suggestion below.
            </p>
          )}

          {/* Suggested Areas */}
          {remainingSuggestions.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="block text-xs font-medium text-[var(--text-muted)]">
                Suggested areas
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {remainingSuggestions.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => addArea(area)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text-heading)] transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-[var(--primary)] stroke-[2.5]" />
                    <span>{area}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Agent Type (Correlated with Signup & Locked) */}
        <div className="space-y-2">
          <label className="block text-[14px] font-bold text-[var(--text-heading)]">
            Agent type
          </label>
          <div className="flex items-center justify-between gap-3 bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-lg px-4 py-3 opacity-90 cursor-not-allowed shadow-2xs">
            <span className="text-[13.5px] font-semibold text-[var(--text-heading)]">
              {agentTypeLabel}
            </span>
            <Lock className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Your agent specialization is linked to your signup and accreditation profile. Only Central Operations can update your agent type after KYC verification.
          </p>
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
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-[0.99] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
