"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Layers,
  MapPin,
  Wallet,
  UserCheck,
  CheckCircle2,
  Plus,
  Send,
  Clock,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
} from "lucide-react";
import { formatCurrency, formatTimeAgo } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { calculateClientBufferedHours } from "@/lib/services/pricing";

const TASK_STATUSES = [
  "DRAFT",
  "PENDING",
  "MATCHED",
  "AGENT_EN_ROUTE",
  "AGENT_ON_SITE",
  "IN_PROGRESS",
  "REPORT_SUBMITTED",
  "UNDER_REVIEW",
  "COMPLETED",
  "DISPUTED",
  "CANCELLED",
];

export default function AdminTaskMissionControlPage() {
  const params = useParams<{ id: string }>();
  const taskId = params?.id;

  const [task, setTask] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "pricing" | "dispatch" | "milestones" | "intake"
  >("pricing");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dual-Price & SLA state
  const [clientPriceInput, setClientPriceInput] = useState("");
  const [agentPayInput, setAgentPayInput] = useState("");
  const [agentHoursInput, setAgentHoursInput] = useState("24");
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [isSavingQuote, setIsSavingQuote] = useState(false);

  // Directives & New Milestone state
  const [directivesText, setDirectivesText] = useState("");
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  async function loadMissionData() {
    if (!taskId) return;
    setIsLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [taskRes, agentsRes] = await Promise.all([
        fetch(`/api/v1/tasks/${taskId}`, { credentials: "include", headers }),
        fetch(`/api/v1/admin/users?role=AGENT&limit=100`, {
          credentials: "include",
          headers,
        }),
      ]);

      const taskJson = await taskRes.json();
      const agentsJson = await agentsRes.json();

      if (taskJson.success && taskJson.data) {
        const t = taskJson.data;
        setTask(t);
        setClientPriceInput(String(t.clientPriceNgn ?? t.priceNgn ?? 0));
        setAgentPayInput(String(t.agentPayoutNgn ?? 0));
        setAgentHoursInput(String(t.agentTargetHours ?? 24));
        setAdminNotesInput(t.pricingBreakdown?.adminNotes || "");
        setDirectivesText(t.description || "");
      }

      if (agentsJson.success && Array.isArray(agentsJson.data)) {
        setAgents(agentsJson.data);
      }
    } catch (err) {
      console.error("Failed to load mission control data:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMissionData();
  }, [taskId]);

  const handleSaveDualPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQuote(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/tasks/${taskId}/quote`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({
          priceNgn: Number(clientPriceInput),
          agentPayoutNgn: Number(agentPayInput),
          agentTargetHours: Number(agentHoursInput),
          adminNotes: adminNotesInput,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.data?.message || "Pricing and Agent Task Pay saved!");
        loadMissionData();
      } else {
        showToast(json.error?.message || "Failed to save pricing");
      }
    } catch (err: any) {
      showToast(err.message || "Error saving pricing");
    } finally {
      setIsSavingQuote(false);
    }
  };

  const handleAssignAgent = async (agentId: string, operativeCode: string) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/tasks/${taskId}/assign`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ agentId }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Mission assigned to Operative ${operativeCode}`);
        loadMissionData();
      } else {
        showToast(json.error?.message || "Failed to assign operative");
      }
    } catch (err: any) {
      showToast(err.message || "Error assigning operative");
    }
  };

  const handleOverrideStatus = async (nextStatus: string) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${taskId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setTask((prev: any) => ({ ...prev, status: nextStatus }));
        showToast(`Task status updated to ${nextStatus}`);
      } else {
        showToast(json.error?.message || "Status update failed");
      }
    } catch (err: any) {
      showToast(err.message || "Error updating status");
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${taskId}/milestones`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({
          milestoneId,
          status: "COMPLETED",
          completionPct: 100,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Milestone approved & published to client at 100%");
        loadMissionData();
      } else {
        showToast(json.error?.message || "Failed to approve milestone");
      }
    } catch (err: any) {
      showToast(err.message || "Error approving milestone");
    }
  };

  const handleAddMilestoneOrDirectives = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMilestone(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const milestonesPayload = newMilestoneTitle.trim()
        ? [
            {
              title: newMilestoneTitle.trim(),
              description: newMilestoneDesc.trim() || null,
              orderIndex: (task?.milestones?.length || 0) + 1,
            },
          ]
        : [];

      const res = await fetch(`/api/v1/admin/tasks/${taskId}/milestones`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          directives: directivesText,
          milestones: milestonesPayload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewMilestoneTitle("");
        setNewMilestoneDesc("");
        showToast("Directives & milestones updated!");
        loadMissionData();
      } else {
        showToast(json.error?.message || "Failed to update milestones");
      }
    } catch (err: any) {
      showToast(err.message || "Error saving directives");
    } finally {
      setIsSavingMilestone(false);
    }
  };

  if (isLoading) {
    return <DynamicLoadingState variant="documents" count={4} />;
  }

  if (!task) {
    return (
      <div className="p-8 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
        <p className="text-sm font-semibold text-[var(--text-heading)]">Mission Not Found</p>
        <Link
          href="/admin/tasks"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--primary)] font-semibold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Task Command</span>
        </Link>
      </div>
    );
  }

  const clientPaid = Number(clientPriceInput || 0);
  const agentPay = Number(agentPayInput || 0);
  const margin = Math.max(0, clientPaid - agentPay);
  const bufferedClientHours = calculateClientBufferedHours(Number(agentHoursInput || 24));

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[var(--bg-card)] border border-[var(--primary-border)] text-[var(--text-heading)] px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div className="space-y-1">
          <Link
            href="/admin/tasks"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Task Command</span>
          </Link>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)]">
              {task.moduleType}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">
              {task.title}
            </h1>
          </div>

          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>
              {task.propertyDetails?.address ||
                task.locationAddress ||
                "Coordinates attached in intake form"}
            </span>
            <span>·</span>
            <span>Client: {task.clientName || "Client"}</span>
            {task.clientEmail && <span>({task.clientEmail})</span>}
          </p>
        </div>

        {/* Status Override Selector */}
        <div className="flex items-center gap-3 self-start lg:self-center">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Lifecycle Status Override
            </label>
            <select
              value={task.status}
              onChange={(e) => handleOverrideStatus(e.target.value)}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
            >
              {TASK_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "pricing", label: "1. Client Fee & Agent Task Pay", icon: Wallet },
          { id: "dispatch", label: "2. Operative Assignment (OS-ID)", icon: UserCheck },
          { id: "milestones", label: "3. Directives & Milestones", icon: CheckCircle2 },
          { id: "intake", label: "4. Intake Data & Telemetry", icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                active
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)] hover:text-[var(--text-heading)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: DUAL-PRICE & SLA DESK */}
      {activeTab === "pricing" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleSaveDualPricing}
            className="lg:col-span-2 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-5 shadow-xs"
          >
            <div>
              <h2 className="text-base font-bold text-[var(--text-heading)]">
                Dual-Price Task Economics & SLA Configuration
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                The End User pays the <strong>Client Service Fee</strong> to Oversite. The Field Operative only sees and receives the <strong>Agent Task Pay</strong> upon completion.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <label className="block text-xs font-bold text-[var(--text-heading)] mb-1">
                  Client Service Fee (₦) — Paid by End User
                </label>
                <input
                  type="number"
                  value={clientPriceInput}
                  onChange={(e) => setClientPriceInput(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Quote Status: <span className="font-mono font-semibold">{task.quoteStatus || "ESTIMATED"}</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[var(--primary-light)]/50 border border-[var(--primary-border)]">
                <label className="block text-xs font-bold text-[var(--primary)] mb-1">
                  Agent Task Pay on Completion (₦) — Shown to Agents
                </label>
                <input
                  type="number"
                  value={agentPayInput}
                  onChange={(e) => setAgentPayInput(e.target.value)}
                  className="w-full bg-[var(--bg-card)] border border-[var(--primary-border)] rounded-xl px-3 py-2.5 text-sm font-bold text-[var(--primary)] focus:outline-none focus:border-[var(--primary)]"
                />
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Exact amount displayed on Agent Queue & credited to Agent Wallet.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                  Agent Target Turnaround (Hours)
                </label>
                <input
                  type="number"
                  value={agentHoursInput}
                  onChange={(e) => setAgentHoursInput(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-heading)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                  Client Promised SLA (Auto-Buffered Hours)
                </label>
                <div className="px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-bold text-[var(--text-heading)] flex items-center justify-between">
                  <span>{bufferedClientHours} Hours</span>
                  <span className="text-[10px] text-[var(--primary)] font-mono">
                    +{bufferedClientHours - Number(agentHoursInput || 24)}h QA Buffer
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                Pricing & Scope Notes
              </label>
              <textarea
                rows={3}
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                placeholder="Optional breakdown notes or instructions..."
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingQuote}
              className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              <span>
                {isSavingQuote
                  ? "Saving..."
                  : "Save Client Fee, Agent Task Pay & SLA"}
              </span>
            </button>
          </form>

          {/* Economics Summary Card */}
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 h-fit shadow-xs">
            <h3 className="text-sm font-bold text-[var(--text-heading)]">
              Mission Margin Summary
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">End User Pays Oversite</span>
                <span className="font-bold text-[var(--text-heading)]">
                  {formatCurrency(clientPaid)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                <span className="text-[var(--text-muted)]">Operative Sees & Earns</span>
                <span className="font-bold text-[var(--primary)]">
                  {formatCurrency(agentPay)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-semibold text-[var(--text-heading)]">
                  Oversite Retained Margin
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(margin)} (
                  {clientPaid > 0 ? Math.round((margin / clientPaid) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OPERATIVE DISPATCH & ASSIGNMENT */}
      {activeTab === "dispatch" && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Current Assigned Operative
              </p>
              {task.agent ? (
                <div className="mt-1 space-y-0.5">
                  <p className="text-sm font-bold text-[var(--text-heading)]">
                    <span className="font-mono text-[var(--primary)] mr-2">
                      {task.agent.badge}
                    </span>
                    {task.agent.realName || task.agent.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Client only sees: <strong>Operative {task.agent.badge}</strong> · Agent Task Pay:{" "}
                    <strong className="text-[var(--primary)]">{formatCurrency(agentPay)}</strong>
                  </p>
                </div>
              ) : (
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-1">
                  Unassigned — Open in Operative Queue at {formatCurrency(agentPay)}
                </p>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-heading)]">
              Assign or Reassign Field Operative
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agents.map((ag) => {
                const isAssigned = task.agentId === ag.id;
                return (
                  <div
                    key={ag.id}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                      isAssigned
                        ? "bg-[var(--primary-light)]/40 border-[var(--primary-border)]"
                        : "bg-[var(--bg-secondary)] border-[var(--border-color)]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--primary)]">
                          {ag.operativeCode}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-heading)] truncate">
                          {ag.name || ag.email}
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            ag.isAvailable ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                          title={ag.isAvailable ? "Online" : "Offline"}
                        />
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Tier: {ag.agentTier || "GENERAL"} · KYC: {ag.kycStatus} · Rating:{" "}
                        {ag.rating || "5.0"}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isAssigned}
                      onClick={() => handleAssignAgent(ag.id, ag.operativeCode)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer shrink-0 ${
                        isAssigned
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-default"
                          : "bg-[var(--primary)] text-white hover:opacity-95"
                      }`}
                    >
                      {isAssigned ? "Assigned" : "Assign"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DIRECTIVES & MILESTONES */}
      {activeTab === "milestones" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-heading)]">
              Operational Milestones ({task.milestones?.length || 0})
            </h3>
            {(task.milestones || []).map((ms: any) => (
              <div
                key={ms.id}
                className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-heading)]">
                      {ms.title}
                    </span>
                    {ms.pendingApproval && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                        PENDING ADMIN APPROVAL
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-[var(--primary)]">
                    {ms.status} ({ms.completionPct}%)
                  </span>
                </div>

                {ms.description && (
                  <p className="text-xs text-[var(--text-muted)]">{ms.description}</p>
                )}

                {Array.isArray(ms.mediaUrls) && ms.mediaUrls.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                    {ms.mediaUrls.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--primary)] font-medium hover:underline"
                      >
                        Evidence #{idx + 1}
                      </a>
                    ))}
                  </div>
                )}

                {ms.status !== "COMPLETED" && (
                  <div className="flex justify-end pt-2 border-t border-[var(--border-color)]">
                    <button
                      type="button"
                      onClick={() => handleApproveMilestone(ms.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Approve & Complete Milestone (100%)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <form
            onSubmit={handleAddMilestoneOrDirectives}
            className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 h-fit"
          >
            <h3 className="text-sm font-bold text-[var(--text-heading)]">
              Update Directives & Add Milestone
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                Master Field Directives
              </label>
              <textarea
                rows={3}
                value={directivesText}
                onChange={(e) => setDirectivesText(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-2.5 text-xs text-[var(--text-heading)]"
              />
            </div>

            <div className="pt-2 border-t border-[var(--border-color)] space-y-3">
              <label className="block text-xs font-semibold text-[var(--text-heading)]">
                Add Custom Milestone (Optional)
              </label>
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                placeholder="e.g. 4. Verify Roof Drainage Channels"
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-heading)]"
              />
              <input
                type="text"
                value={newMilestoneDesc}
                onChange={(e) => setNewMilestoneDesc(e.target.value)}
                placeholder="Instructions for operative..."
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-heading)]"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingMilestone}
              className="w-full py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isSavingMilestone ? "Saving..." : "Save Directives & Milestone"}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: INTAKE DATA & TELEMETRY */}
      {activeTab === "intake" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-heading)]">
              Client Intake Payload (`formData`)
            </h3>
            <pre className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[11px] font-mono text-[var(--text-heading)] overflow-x-auto">
              {JSON.stringify(task.formData || {}, null, 2)}
            </pre>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
              <h3 className="text-sm font-bold text-[var(--text-heading)]">
                Multi-Stop Waypoints ({Array.isArray(task.waypoints) ? task.waypoints.length : 0})
              </h3>
              {Array.isArray(task.waypoints) && task.waypoints.length > 0 ? (
                <div className="space-y-2">
                  {task.waypoints.map((wp: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs"
                    >
                      <strong>Stop #{idx + 1}:</strong> {wp.address}
                      {wp.instructions && (
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          {wp.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">Single-location mission.</p>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-2">
              <h3 className="text-sm font-bold text-[var(--text-heading)]">
                Procurement Items ({Array.isArray(task.purchaseItems) ? task.purchaseItems.length : 0})
              </h3>
              {Array.isArray(task.purchaseItems) && task.purchaseItems.length > 0 ? (
                <div className="space-y-2">
                  {task.purchaseItems.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs"
                    >
                      <span>
                        {item.name} (x{item.quantity || 1})
                      </span>
                      <span className="font-bold">
                        {formatCurrency(item.estimatedCostNgn || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">No purchase items attached.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

