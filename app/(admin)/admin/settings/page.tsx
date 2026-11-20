"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Percent, Users, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function AdminSettingsPage() {
  const [defaultDeductionPct, setDefaultDeductionPct] = useState("30");
  const [emergencySurchargePct, setEmergencySurchargePct] = useState("30");
  const [manualQuoteThresholdNgn, setManualQuoteThresholdNgn] = useState("100000");
  const [extraStopFeeNgn, setExtraStopFeeNgn] = useState("7500");
  const [officialDocsFeeNgn, setOfficialDocsFeeNgn] = useState("15000");
  const [moduleBaseFees, setModuleBaseFees] = useState<Record<string, number>>({});
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/admin/settings", {
          credentials: "include",
          headers,
        });
        const json = await res.json();
        if (json.success && json.data) {
          const cfg = json.data.config || {};
          setDefaultDeductionPct(String(cfg.defaultDeductionPct ?? 30));
          setEmergencySurchargePct(String(cfg.emergencySurchargePct ?? 30));
          setManualQuoteThresholdNgn(String(cfg.manualQuoteThresholdNgn ?? 100000));
          setExtraStopFeeNgn(String(cfg.extraStopFeeNgn ?? 7500));
          setOfficialDocsFeeNgn(String(cfg.officialDocsFeeNgn ?? 15000));
          setModuleBaseFees(cfg.moduleBaseFees || {});
          setWaitlist(json.data.waitlist || []);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers,
        body: JSON.stringify({
          defaultDeductionPct: Number(defaultDeductionPct),
          emergencySurchargePct: Number(emergencySurchargePct),
          manualQuoteThresholdNgn: Number(manualQuoteThresholdNgn),
          extraStopFeeNgn: Number(extraStopFeeNgn),
          officialDocsFeeNgn: Number(officialDocsFeeNgn),
          moduleBaseFees,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Platform configuration saved!");
      } else {
        showToast(json.error?.message || "Failed to save settings");
      }
    } catch (err: any) {
      showToast(err.message || "Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateWaitlist = async (id: string, status: string) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        credentials: "include",
        headers,
        body: JSON.stringify({ waitlistId: id, waitlistStatus: status }),
      });
      const json = await res.json();
      if (json.success) {
        setWaitlist((prev) =>
          prev.map((w) => (w.id === id ? { ...w, status } : w))
        );
        showToast(`Waitlist lead marked as ${status}`);
      }
    } catch {
      showToast("Failed to update waitlist lead");
    }
  };

  if (isLoading) {
    return <DynamicLoadingState variant="documents" count={3} />;
  }

  return (
    <div className="space-y-8">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[var(--bg-card)] border border-[var(--primary-border)] text-[var(--text-heading)] px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-heading)] tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-[var(--primary)]" />
          Platform Backbone Configuration & Waitlist
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Configure default Client-to-Agent pay deduction percentages, service base fees, and manage waitlist leads.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSaveConfig} className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-[var(--text-heading)]">
              Dual-Price Margin & Surcharge Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-heading)] mb-1">
                  Default Auto-Deducted Platform Margin (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="number"
                    value={defaultDeductionPct}
                    onChange={(e) => setDefaultDeductionPct(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Used to suggest default Agent Task Pay (e.g. 30% deduction means ₦1,000 Client Fee suggests ₦700 Agent Pay until Admin overrides).
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-heading)] mb-1">
                  Express / Emergency Surcharge (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="number"
                    value={emergencySurchargePct}
                    onChange={(e) => setEmergencySurchargePct(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Applied to priority express tasks.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-[var(--text-heading)] mb-1">
                  Manual Quote Procurement Floor (₦)
                </label>
                <input
                  type="number"
                  value={manualQuoteThresholdNgn}
                  onChange={(e) => setManualQuoteThresholdNgn(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-heading)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-heading)] mb-1">
                  Extra Waypoint Transit Fee (₦)
                </label>
                <input
                  type="number"
                  value={extraStopFeeNgn}
                  onChange={(e) => setExtraStopFeeNgn(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-heading)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-heading)] mb-1">
                  Official Registry Filing Fee (₦)
                </label>
                <input
                  type="number"
                  value={officialDocsFeeNgn}
                  onChange={(e) => setOfficialDocsFeeNgn(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-heading)]"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-[var(--text-heading)]">
              Service Module Base Client Fees (₦)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(moduleBaseFees).map(([modKey, feeVal]) => (
                <div
                  key={modKey}
                  className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between gap-2"
                >
                  <span className="text-xs font-semibold text-[var(--text-heading)]">
                    {modKey.replace(/_/g, " ")}
                  </span>
                  <input
                    type="number"
                    value={feeVal}
                    onChange={(e) =>
                      setModuleBaseFees((prev) => ({
                        ...prev,
                        [modKey]: Number(e.target.value),
                      }))
                    }
                    className="w-28 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-2.5 py-1 text-xs font-bold text-right text-[var(--primary)]"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Platform Configuration"}</span>
          </button>
        </form>

        {/* Waitlist Management Column */}
        <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 h-fit shadow-xs">
          <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--primary)]" />
            Waitlist Leads ({waitlist.length})
          </h3>

          {waitlist.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">No waitlist entries found.</p>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto">
              {waitlist.map((w: any) => (
                <div
                  key={w.id}
                  className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-heading)]">
                      {w.name || w.email}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary)] font-bold">
                      {w.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {w.email} {w.interest ? `· ${w.interest}` : ""}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    {["PENDING", "CONTACTED", "CONVERTED"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateWaitlist(w.id, st)}
                        className={`px-2 py-1 rounded text-[10px] font-semibold cursor-pointer ${
                          w.status === st
                            ? "bg-[var(--primary)] text-white"
                            : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
