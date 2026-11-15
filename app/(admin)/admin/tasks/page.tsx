"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  MapPin,
  Search,
  ArrowRight,
  Wallet,
  Sparkles,
  Check,
  UserCheck,
  Clock,
} from "lucide-react";
import { Task } from "@/lib/types/task";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function AdminTasksCommandPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inline quick Agent Task Pay editor state
  const [editingTaskPayId, setEditingTaskPayId] = useState<string | null>(null);
  const [agentPayInput, setAgentPayInput] = useState<string>("");
  const [clientPriceInput, setClientPriceInput] = useState<string>("");
  const [isSavingPay, setIsSavingPay] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadAllTasks() {
      setIsLoading(true);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const url =
          moduleFilter !== "ALL"
            ? `/api/v1/tasks?module=${moduleFilter}&limit=100`
            : `/api/v1/tasks?limit=100`;
        const res = await fetch(url, { credentials: "include", headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTasks(json.data);
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error("Failed to load tasks:", err);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadAllTasks();
  }, [moduleFilter]);

  const handleSaveTaskPay = async (task: Task) => {
    setIsSavingPay(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload: Record<string, any> = {
        agentPayoutNgn: Number(agentPayInput),
      };
      if (clientPriceInput && Number(clientPriceInput) > 0) {
        payload.priceNgn = Number(clientPriceInput);
      }

      const res = await fetch(`/api/v1/admin/tasks/${task.id}/quote`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  priceNgn: json.data.clientPriceNgn,
                  clientPriceNgn: json.data.clientPriceNgn,
                  agentPayoutNgn: json.data.agentPayoutNgn,
                  platformMarginNgn: json.data.platformMarginNgn,
                  isAgentPayExplicitlySet: true,
                  quoteStatus: json.data.quoteStatus,
                }
              : t
          )
        );
        setEditingTaskPayId(null);
        showToast(
          `Saved: Client Fee ${formatCurrency(json.data.clientPriceNgn)} · Agent Task Pay ${formatCurrency(json.data.agentPayoutNgn)}`
        );
      } else {
        showToast(json.error?.message || "Failed to update task pricing");
      }
    } catch (err: any) {
      showToast(err.message || "Error saving task pay");
    } finally {
      setIsSavingPay(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (stageFilter === "NEEDS_QUOTE") {
      if (
        t.quoteStatus !== "PENDING_ADMIN_PRICE" &&
        t.quoteStatus !== "COUNTER_OFFER" &&
        t.pricingMode !== "MANUAL_QUOTE"
      ) {
        return false;
      }
    } else if (stageFilter === "UNASSIGNED") {
      if (t.agentId) return false;
    } else if (stageFilter === "ACTIVE_FIELD") {
      if (
        !["MATCHED", "AGENT_EN_ROUTE", "AGENT_ON_SITE", "IN_PROGRESS"].includes(t.status)
      ) {
        return false;
      }
    } else if (stageFilter === "QA_REVIEW") {
      if (!["REPORT_SUBMITTED", "UNDER_REVIEW"].includes(t.status)) return false;
    } else if (stageFilter === "COMPLETED") {
      if (t.status !== "COMPLETED") return false;
    } else if (stageFilter === "DISPUTED") {
      if (t.status !== "DISPUTED") return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchId = t.id.toLowerCase().includes(q);
      const matchAgent =
        (t.agentName && t.agentName.toLowerCase().includes(q)) ||
        (t.agentCode && t.agentCode.toLowerCase().includes(q));
      const matchClient = t.clientName && t.clientName.toLowerCase().includes(q);
      const matchAddr = t.property?.address?.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchAgent && !matchClient && !matchAddr) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[var(--bg-card)] border border-[var(--primary-border)] text-[var(--text-heading)] px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-heading)] tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-[var(--primary)]" />
            Task Command, Quoting & Agent Pay Desk
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            End users pay Oversite directly. Set the exact Agent Task Pay shown to operatives in the queue and credited upon completion.
          </p>
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          aria-label="Filter tasks by service module"
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs font-medium text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="ALL">All 7 Service Modules</option>
          <option value="QUICK_ERRANDS">Quick Errands</option>
          <option value="PROPERTY_OVERSITE">Property Oversite</option>
          <option value="PROJECT_WATCH">Project Watch</option>
          <option value="DUE_DILIGENCE">Due Diligence</option>
          <option value="LEGAL_ADVISORY">Legal Advisory</option>
          <option value="LAW_ENFORCEMENT">Law Enforcement</option>
          <option value="VULNERABILITY_TEST">Vulnerability Test</option>
        </select>
      </div>

      {/* Stage Filter Pills & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: "ALL", label: "All Missions" },
            { id: "NEEDS_QUOTE", label: "Needs Quote / Pricing" },
            { id: "UNASSIGNED", label: "Unassigned (Queue)" },
            { id: "ACTIVE_FIELD", label: "Active In Field" },
            { id: "QA_REVIEW", label: "QA / Review" },
            { id: "DISPUTED", label: "Contested" },
            { id: "COMPLETED", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStageFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                stageFilter === tab.id
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] hover:text-[var(--text-heading)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, client, OS-ID, address..."
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
      </div>

      {isLoading ? (
        <DynamicLoadingState variant="documents" count={4} />
      ) : filteredTasks.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--text-muted)] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          No tasks found matching the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const clientPaid = Number(task.clientPriceNgn ?? task.priceNgn ?? 0);
            const agentPay = Number(task.agentPayoutNgn ?? Math.round(clientPaid * 0.7));
            const margin = Math.max(0, clientPaid - agentPay);
            const isEditingPay = editingTaskPayId === task.id;

            return (
              <div
                key={task.id}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-xs"
              >
                <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] font-mono font-semibold">
                        {task.moduleType}
                      </span>
                      <h3 className="font-bold text-[var(--text-heading)] text-sm">
                        {task.title}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          task.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : task.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : task.status === "DISPUTED"
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        }`}
                      >
                        {task.status}
                      </span>
                      {task.quoteStatus === "PENDING_ADMIN_PRICE" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                          AWAITING ADMIN QUOTE
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[var(--primary)]" />
                      <span className="truncate">
                        {task.property?.address ||
                          task.locationAddress ||
                          "Address pending on-site coordinates"}
                      </span>
                    </p>

                    <div className="flex items-center gap-3 flex-wrap text-[11px] text-[var(--text-muted)]">
                      <span>
                        Client:{" "}
                        <strong className="text-[var(--text-heading)]">
                          {task.clientName || "Oversite Client"}
                        </strong>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-[var(--primary)]" />
                        Operative:{" "}
                        {task.agentId ? (
                          <>
                            <span className="font-mono font-bold text-[var(--primary)]">
                              {task.agentCode}
                            </span>
                            {task.agentName && (
                              <span className="text-[var(--text-heading)] font-medium">
                                ({task.agentName})
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            Unassigned (In Agent Queue)
                          </span>
                        )}
                      </span>
                      {task.agentTargetHours && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            SLA: {task.agentTargetHours}h Agent / {task.clientPromisedHours}h Client
                          </span>
                        </>
                      )}
                      <span>·</span>
                      <span>Created {formatTimeAgo(task.createdAt)}</span>
                    </div>
                  </div>

                  {/* Dual-Price Economics Pill & Actions */}
                  <div className="flex flex-wrap items-center gap-3 self-end lg:self-center shrink-0">
                    <div className="grid grid-cols-3 gap-2 px-3.5 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-right">
                      <div>
                        <div className="text-[10px] text-[var(--text-muted)]">Client Paid</div>
                        <div className="text-xs font-bold text-[var(--text-heading)]">
                          {formatCurrency(clientPaid)}
                        </div>
                      </div>
                      <div className="border-l border-[var(--border-color)] pl-2">
                        <div className="text-[10px] text-[var(--primary)] font-semibold">
                          Agent Task Pay
                        </div>
                        <div className="text-xs font-bold text-[var(--primary)]">
                          {formatCurrency(agentPay)}
                        </div>
                      </div>
                      <div className="border-l border-[var(--border-color)] pl-2">
                        <div className="text-[10px] text-[var(--text-muted)]">Margin</div>
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(margin)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (isEditingPay) {
                          setEditingTaskPayId(null);
                        } else {
                          setEditingTaskPayId(task.id);
                          setClientPriceInput(String(clientPaid));
                          setAgentPayInput(String(agentPay));
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--primary-light)] text-[var(--text-heading)] border border-[var(--border-color)] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Wallet className="w-3.5 h-3.5 text-[var(--primary)]" />
                      <span>Set Agent Pay</span>
                    </button>

                    <Link
                      href={`/admin/tasks/${task.id}`}
                      className="px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold flex items-center gap-1.5 hover:opacity-95 transition-opacity"
                    >
                      <span>Mission Control</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Inline Dual-Price & Agent Task Pay Editor */}
                {isEditingPay && (
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--primary-border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--primary)] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Configure Client Fee & Operative Completion Pay
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">
                        Agents only ever see the Agent Task Pay ({formatCurrency(Number(agentPayInput || 0))})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                          Client Service Fee (₦)
                        </label>
                        <input
                          type="number"
                          value={clientPriceInput}
                          onChange={(e) => setClientPriceInput(e.target.value)}
                          className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[var(--primary)] mb-1">
                          Agent Task Pay on Completion (₦)
                        </label>
                        <input
                          type="number"
                          value={agentPayInput}
                          onChange={(e) => setAgentPayInput(e.target.value)}
                          className="w-full bg-[var(--bg-card)] border border-[var(--primary-border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--primary)] focus:outline-none focus:border-[var(--primary)]"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingTaskPayId(null)}
                          className="px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-muted)] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isSavingPay}
                          onClick={() => handleSaveTaskPay(task)}
                          className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isSavingPay ? "Saving..." : "Save Task Pay"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
