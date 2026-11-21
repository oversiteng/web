"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ChevronLeft,
  MapPin,
  Wallet,
  UserCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { ResponsiveSelect } from "@/components/ui/ResponsiveSelect";
import { calculateClientBufferedHours } from "@/lib/services/pricing";
import { getAgentTypeLabel } from "@/lib/constants/agentTypes";

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

function getAuthHeaders(json = false): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export default function AdminTaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const canDelete =
    user?.role === "SUPER_ADMIN" || Boolean(user?.adminPolicy?.canDelete);
  const taskId = params?.id;

  const [task, setTask] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "PAY_SLA" | "OPERATIVE" | "MILESTONES" | "DELIVERABLES"
  >("PAY_SLA");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Pay & SLA state
  const [clientPriceInput, setClientPriceInput] = useState("");
  const [agentPayInput, setAgentPayInput] = useState("");
  const [agentHoursInput, setAgentHoursInput] = useState("24");
  const [adminNotesInput, setAdminNotesInput] = useState("");
  const [isSavingQuote, setIsSavingQuote] = useState(false);

  // Operative search & acceptance window
  const [agentSearch, setAgentSearch] = useState("");
  const [assigningAgentId, setAssigningAgentId] = useState<string | null>(null);
  const [acceptanceWindowInput, setAcceptanceWindowInput] = useState("2");

  // Milestones & Directives
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  // Admin Task Structuring Blueprint state
  const [bpUsesMilestones, setBpUsesMilestones] = useState(false);
  const [bpBrief, setBpBrief] = useState("");
  const [bpChecklist, setBpChecklist] = useState<string[]>([]);
  const [bpInputs, setBpInputs] = useState<
    Array<{ field: string; label: string; type: string; required: boolean }>
  >([]);
  const [bpEvidenceSlots, setBpEvidenceSlots] = useState<
    Array<{ key: string; label: string; required: boolean }>
  >([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newInputLabel, setNewInputLabel] = useState("");
  const [newInputType, setNewInputType] = useState<"text" | "number" | "textarea" | "select" | "media">("text");
  const [newSlotLabel, setNewSlotLabel] = useState("");
  const [isSavingStructure, setIsSavingStructure] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  async function loadMissionData() {
    if (!taskId) return;
    setIsLoading(true);
    try {
      const [taskRes, agentsRes] = await Promise.all([
        fetch(`/api/v1/tasks/${taskId}`, { credentials: "include", headers: getAuthHeaders() }),
        fetch(`/api/v1/admin/users?role=AGENT&limit=100`, {
          credentials: "include",
          headers: getAuthHeaders(),
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
        if (t.executionBlueprint) {
          setBpUsesMilestones(Boolean(t.executionBlueprint.usesMilestones));
          setBpBrief(t.executionBlueprint.operationalBrief || t.description || "");
          setBpChecklist(Array.isArray(t.executionBlueprint.deliverablesChecklist) ? t.executionBlueprint.deliverablesChecklist : []);
          setBpInputs(Array.isArray(t.executionBlueprint.expectedAgentInputs) ? t.executionBlueprint.expectedAgentInputs : []);
          setBpEvidenceSlots(Array.isArray(t.executionBlueprint.evidenceSlots) ? t.executionBlueprint.evidenceSlots : []);
        }
      }

      if (agentsJson.success && Array.isArray(agentsJson.data)) {
        setAgents(agentsJson.data);
      }
    } catch (err) {
      console.error("Failed to load task detail:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMissionData();
  }, [taskId]);

  const isSubTask = Boolean(
    task &&
      (task.pricingMode === "SUBSCRIPTION_INCLUDED" ||
        task.quoteStatus === "INCLUDED_IN_SUBSCRIPTION" ||
        task.formData?.isSubscriptionIncluded ||
        task.formData?.isPropertyIntelTask ||
        (task.moduleType === "PROPERTY_OVERSITE" &&
          (task.propertyId || task.property?.id)))
  );

  const handleSavePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQuote(true);
    try {
      const payload: Record<string, any> = {
        agentPayoutNgn: Number(agentPayInput),
        agentTargetHours: Number(agentHoursInput),
        adminNotes: adminNotesInput,
      };
      if (!isSubTask) {
        payload.priceNgn = Number(clientPriceInput);
      }

      const res = await fetch(`/api/v1/admin/tasks/${taskId}/quote`, {
        method: "PATCH",
        credentials: "include",
        headers: getAuthHeaders(true),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast(isSubTask ? "Agent Task Pay & SLA saved" : "Client Fee, Agent Pay & SLA saved");
        loadMissionData();
      } else {
        showToast(json.error?.message || "Failed to save changes");
      }
    } catch {
      showToast("Network error while saving");
    } finally {
      setIsSavingQuote(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setTask((prev: any) => ({ ...prev, status: newStatus }));
        showToast(`Status updated to ${newStatus.replace(/_/g, " ")}`);
      } else {
        showToast(json.error?.message || "Failed to update status");
      }
    } catch {
      showToast("Failed to update status");
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    setAssigningAgentId(agentId);
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/assign`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          agentId,
          acceptanceWindowHours: Number(acceptanceWindowInput) || 2,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          `Operative invited (${Number(acceptanceWindowInput) || 2}h acceptance window)`
        );
        loadMissionData();
      } else {
        showToast(json.error?.message || "Failed to assign operative");
      }
    } catch {
      showToast("Failed to assign operative");
    } finally {
      setAssigningAgentId(null);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    setIsSavingMilestone(true);
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}/milestones`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          title: newMilestoneTitle.trim(),
          description: newMilestoneDesc.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setNewMilestoneTitle("");
        setNewMilestoneDesc("");
        showToast("Milestone added");
        loadMissionData();
      } else {
        showToast(json.error?.message || "Failed to add milestone");
      }
    } catch {
      showToast("Failed to add milestone");
    } finally {
      setIsSavingMilestone(false);
    }
  };

  const handleSaveStructure = async () => {
    setIsSavingStructure(true);
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "PATCH",
        credentials: "include",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          executionBlueprint: {
            usesMilestones: bpUsesMilestones,
            operationalBrief: bpBrief.trim(),
            deliverablesChecklist: bpChecklist,
            expectedAgentInputs: bpInputs,
            evidenceSlots: bpEvidenceSlots,
          },
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("Task structure & agent instructions saved");
        loadMissionData();
      } else {
        showToast(json.error?.message || "Failed to save structure");
      }
    } catch {
      showToast("Network error while saving structure");
    } finally {
      setIsSavingStructure(false);
    }
  };

  const handleDeleteTask = async () => {
    setIsDeletingTask(true);
    try {
      const res = await fetch(`/api/v1/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        router.push("/admin/tasks");
      } else {
        showToast(json.error?.message || "Failed to delete task");
      }
    } catch {
      showToast("Failed to delete task");
    } finally {
      setIsDeletingTask(false);
      setShowDeleteConfirm(false);
    }
  };

  const filteredAgents = useMemo(() => {
    const active = agents.filter((a) => a.isActive);
    if (!agentSearch.trim()) return active;
    const q = agentSearch.toLowerCase();
    return active.filter(
      (a) =>
        (a.name && a.name.toLowerCase().includes(q)) ||
        (a.email && a.email.toLowerCase().includes(q)) ||
        (a.operativeCode && a.operativeCode.toLowerCase().includes(q))
    );
  }, [agents, agentSearch]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <DynamicLoadingState variant="documents" count={3} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto p-10 text-center space-y-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
        <p className="text-sm font-semibold text-[var(--text-heading)]">Task not found</p>
        <Link
          href="/admin/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)]"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Tasks
        </Link>
      </div>
    );
  }

  const clientPaidNum = Number(clientPriceInput || 0);
  const agentPayNum = Number(agentPayInput || 0);
  const marginNum = Math.max(0, clientPaidNum - agentPayNum);
  const clientHours = calculateClientBufferedHours(Number(agentHoursInput || 24));

  const expectedInputs: any[] = Array.isArray(task.formData?.expectedAgentInputs)
    ? task.formData.expectedAgentInputs
    : [];
  const checklist: string[] = Array.isArray(task.formData?.deliverablesChecklist)
    ? task.formData.deliverablesChecklist
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[var(--bg-card)] border border-[var(--primary)] text-[var(--text-heading)] px-4 py-2 rounded-md shadow-lg text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Top Navigation & Lifecycle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/admin/tasks"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-heading)] hover:text-[var(--primary)] w-fit"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Tasks</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-48">
            <ResponsiveSelect
              label="Task Lifecycle Status"
              value={task.status}
              onChange={(val) => handleStatusChange(val)}
              options={TASK_STATUSES.map((s) => ({
                value: s,
                label: s.replace(/_/g, " "),
              }))}
            />
          </div>

          {canDelete && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-red-500/30 bg-red-500/5 text-red-500 hover:bg-red-500/10 text-xs font-semibold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Header Card */}
      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[var(--bg-secondary)] text-[var(--text-heading)]">
            {String(task.moduleType || "").replace(/_/g, " ")}
          </span>
          {isSubTask && (
            <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Subscription Included
            </span>
          )}
        </div>
        <h1 className="text-lg font-bold text-[var(--text-heading)]">{task.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
            {task.property?.address || task.locationAddress || "No address"}
          </span>
          <span>
            Client:{" "}
            <strong className="text-[var(--text-heading)]">
              {task.clientName || "Oversite Client"}
            </strong>
          </span>
          <span>
            Operative:{" "}
            <strong className="text-[var(--text-heading)]">
              {task.agentName || task.agentCode || "Unassigned"}
            </strong>
          </span>
        </div>
      </div>

      {/* Clean Underline Tabs */}
      <div className="flex items-center gap-6 border-b border-[var(--border-color)] overflow-x-auto">
        {[
          { id: "PAY_SLA", label: isSubTask ? "Agent Pay & SLA" : "Economics & SLA" },
          { id: "DELIVERABLES", label: "Scope & Structuring" },
          { id: "OPERATIVE", label: "Operative Assignment" },
          ...(bpUsesMilestones || (task.milestones && task.milestones.length > 0)
            ? [{ id: "MILESTONES", label: `Milestones (${task.milestones?.length || 0})` }]
            : []),
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: PAY & SLA */}
      {activeTab === "PAY_SLA" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form
            onSubmit={handleSavePay}
            className="lg:col-span-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-5"
          >
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-heading)]">
                {isSubTask ? "Subscription Task — Agent Pay & SLA" : "Task Economics & SLA"}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isSubTask
                  ? "Covered by the client's subscription (₦0 client charge). Configure the field operative's task payout and turnaround target."
                  : "Set the client service fee and the exact payout shown to the field operative upon completion."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isSubTask && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-heading)] block">
                    Client Service Fee (NGN)
                  </label>
                  <input
                    type="number"
                    value={clientPriceInput}
                    onChange={(e) => setClientPriceInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-heading)] block">
                  Agent Task Pay (NGN)
                </label>
                <input
                  type="number"
                  required
                  value={agentPayInput}
                  onChange={(e) => setAgentPayInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-heading)] block">
                  Agent Target Turnaround (Hours)
                </label>
                <input
                  type="number"
                  value={agentHoursInput}
                  onChange={(e) => setAgentHoursInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-heading)] block">
                  Client Promised SLA (Auto-Buffered)
                </label>
                <div className="h-10 px-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text-heading)]">
                    {clientHours} Hours
                  </span>
                  <span className="text-[11px] text-[var(--primary)] font-medium">
                    +QA Buffer
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-heading)] block">
                Scope &amp; Operational Notes
              </label>
              <textarea
                rows={3}
                value={adminNotesInput}
                onChange={(e) => setAdminNotesInput(e.target.value)}
                placeholder="Optional instructions or scope notes..."
                className="w-full p-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingQuote}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{isSavingQuote ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>

          {isSubTask ? (
            <div className="lg:col-span-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 h-fit space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                  Subscription Coverage
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  1 Credit / Plan Included
                </span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)]">Client Pays</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ₦0 (Included in Plan)
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)]">Agent Earns</span>
                  <span className="font-semibold text-[var(--primary)]">
                    {formatCurrency(agentPayNum)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-[var(--text-heading)]">
                    Recurring Cadence
                  </span>
                  <span className="font-bold text-[var(--text-heading)]">
                    {String(task.formData?.scheduleCadence || "SEMI_ANNUALLY").replace(
                      /_/g,
                      " "
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 h-fit space-y-4">
              <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                Margin Summary
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)]">Client Pays</span>
                  <span className="font-semibold text-[var(--text-heading)]">
                    {formatCurrency(clientPaidNum)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border-color)]">
                  <span className="text-[var(--text-muted)]">Agent Earns</span>
                  <span className="font-semibold text-[var(--primary)]">
                    {formatCurrency(agentPayNum)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="font-semibold text-[var(--text-heading)]">Net Margin</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(marginNum)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OPERATIVE ASSIGNMENT */}
      {activeTab === "OPERATIVE" && (() => {
        const applications: any[] = Array.isArray(task.formData?.applications)
          ? task.formData.applications
          : [];
        const rejections: any[] = Array.isArray(task.formData?.rejections)
          ? task.formData.rejections
          : [];

        const computeReliabilityPct = (agent: any) => {
          const rating = parseFloat(agent.rating || "4.8");
          const base = Math.round((Math.min(5, Math.max(3.5, rating)) / 5) * 100);
          return Math.min(100, Math.max(78, base));
        };

        const MODULE_SPECIALTY_MAP: Record<string, string[]> = {
          PROPERTY_OVERSITE: ["GENERAL", "INVESTIGATOR", "TECHNICAL_SUPERVISOR"],
          DUE_DILIGENCE: ["INVESTIGATOR", "LEGAL_COUNSEL"],
          PROJECT_WATCH: ["TECHNICAL_SUPERVISOR", "GENERAL"],
          LEGAL_ADVISORY: ["LEGAL_COUNSEL"],
          LAW_ENFORCEMENT: ["LEGAL_COUNSEL", "INVESTIGATOR"],
          DOCUMENT_PROCESSING: ["LEGAL_COUNSEL", "ENFORCEMENT_LIAISON", "INVESTIGATOR"],
          QUICK_ERRANDS: ["ENFORCEMENT_LIAISON", "GENERAL"],
          VULNERABILITY_TEST: ["INVESTIGATOR", "TECHNICAL_SUPERVISOR"],
        };

        const targetLocRaw = String(
          task.property?.address || task.locationAddress || ""
        ).toLowerCase();
        const preferredTiers =
          MODULE_SPECIALTY_MAP[String(task.moduleType || "PROPERTY_OVERSITE")] || [
            "GENERAL",
          ];

        const scoreOperativeRecommendation = (agent: any) => {
          const tier = String(agent.agentTier || "GENERAL");
          const isPrimarySpecialty = preferredTiers[0] === tier;
          const isSecondarySpecialty = preferredTiers.includes(tier);
          const specialtyPoints = isPrimarySpecialty
            ? 35
            : isSecondarySpecialty
            ? 25
            : 10;

          // Location proximity check against coverageAreas, location, and state
          const covList: string[] = Array.isArray(agent.coverageAreas)
            ? agent.coverageAreas
            : [];
          const agentLocTokens = [
            ...covList,
            agent.location || "",
            agent.state || "",
          ]
            .map((s) => String(s).trim().toLowerCase())
            .filter((s) => s.length >= 3);

          const matchedCorridor = agentLocTokens.find(
            (tok) => targetLocRaw && targetLocRaw.includes(tok)
          );
          const locationPoints = matchedCorridor
            ? 30
            : targetLocRaw &&
              agent.state &&
              targetLocRaw.includes(String(agent.state).toLowerCase())
            ? 18
            : 8;

          // Credibility / Rating score (0-20 pts)
          const ratingNum = Math.min(5, Math.max(1, parseFloat(agent.rating || "4.8")));
          const credibilityPoints = Math.round((ratingNum / 5) * 20);

          // Tasks completed experience (0-15 pts)
          const completedCount = Number(agent.totalTasks || 0);
          const experiencePoints = Math.min(15, completedCount * 3);

          const totalMatchScore = Math.min(
            99,
            specialtyPoints + locationPoints + credibilityPoints + experiencePoints
          );

          return {
            totalMatchScore,
            isPrimarySpecialty,
            isSecondarySpecialty,
            matchedCorridor: matchedCorridor
              ? matchedCorridor.replace(/\b\w/g, (c) => c.toUpperCase())
              : null,
            completedCount,
            ratingNum,
          };
        };

        const rankedAgents = [...filteredAgents]
          .map((agent) => ({
            ...agent,
            _rec: scoreOperativeRecommendation(agent),
          }))
          .sort((a, b) => b._rec.totalMatchScore - a._rec.totalMatchScore);

        return (
          <div className="space-y-4">
            {/* Acceptance Window Setting & Pool Notice */}
            <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-[var(--text-heading)]">
                  Direct Invitation Acceptance Window
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Operatives directly assigned (`MATCHED`) must accept within this window before the task can be reassigned. Unassigned (`PENDING`) tasks are visible in the Available Tasks pool for agents to apply.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={0.5}
                  max={48}
                  step={0.5}
                  value={acceptanceWindowInput}
                  onChange={(e) => setAcceptanceWindowInput(e.target.value)}
                  className="w-20 h-9 px-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)]"
                />
                <span className="text-[var(--text-muted)] font-medium">Hours</span>
              </div>
            </div>

            {/* Open-Pool Agent Applications */}
            {applications.length > 0 && (
              <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--primary)]/30 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                    Operative Applications ({applications.length})
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)] text-[10.5px] font-semibold">
                    From Available Queue Pool
                  </span>
                </div>
                <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-md">
                  {applications.map((app, idx) => (
                    <div
                      key={app.agentId || idx}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[var(--text-heading)]">
                            {app.agentName}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] text-[10px] font-semibold text-[var(--text-heading)]">
                            {app.agentTypeLabel || getAgentTypeLabel(app.agentTier)}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                            ★ {Number(app.rating || 5).toFixed(1)}
                          </span>
                        </div>
                        <p className="text-[var(--text-body)] italic">
                          &ldquo;{app.reason}&rdquo;
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={assigningAgentId === app.agentId}
                        onClick={() => handleAssignAgent(app.agentId)}
                        className="px-3.5 h-8 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {assigningAgentId === app.agentId ? "Awarding..." : "Award Task"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previous Decline Reasons (if any) */}
            {rejections.length > 0 && (
              <div className="rounded-lg bg-amber-500/5 border border-amber-500/25 p-4 space-y-2 text-xs">
                <p className="font-semibold text-amber-700 dark:text-amber-300">
                  Recent Operative Declines ({rejections.length})
                </p>
                <div className="space-y-1.5">
                  {rejections.slice(0, 3).map((rej, idx) => (
                    <p key={idx} className="text-[11px] text-[var(--text-muted)]">
                      <strong className="text-[var(--text-heading)]">
                        {rej.agentName || "Operative"}:
                      </strong>{" "}
                      {rej.reason}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Full Directory of Active Operatives with Reliability Score */}
            <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-heading)]">
                    Recommended &amp; Available Field Operatives
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Ranked automatically by Specialty Match, Proximity to Task Location, Tasks Completed, and 7-Day Credibility Score.
                  </p>
                </div>
                <div className="relative sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={agentSearch}
                    onChange={(e) => setAgentSearch(e.target.value)}
                    placeholder="Search operatives..."
                    className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-md">
                {rankedAgents.length === 0 ? (
                  <p className="p-6 text-center text-xs text-[var(--text-muted)]">
                    No active operatives found.
                  </p>
                ) : (
                  rankedAgents.map((agent, idx) => {
                    const isAssigned = task.agentId === agent.id;
                    const reliabilityPct = computeReliabilityPct(agent);
                    const rec = agent._rec;
                    const isTopRecommended = idx < 3 && rec.totalMatchScore >= 60;
                    return (
                      <div
                        key={agent.id}
                        className={`px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isTopRecommended ? "bg-[var(--primary)]/[0.03]" : ""
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[var(--text-heading)]">
                              {agent.name || "Unnamed Agent"}
                            </p>
                            {isTopRecommended && (
                              <span className="px-2 py-0.5 rounded bg-[var(--primary)] text-white text-[10px] font-bold">
                                Recommended · {rec.totalMatchScore}% Match
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                              {reliabilityPct}% Credibility · ★ {rec.ratingNum.toFixed(1)}
                            </span>
                            {rec.isPrimarySpecialty && (
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                                Exact Specialty Match
                              </span>
                            )}
                            {rec.matchedCorridor && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">
                                Near {rec.matchedCorridor}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[var(--text-muted)]">
                            {agent.email} ·{" "}
                            <strong className="text-[var(--text-heading)]">
                              {getAgentTypeLabel(agent.agentTier)}
                            </strong>{" "}
                            ·{" "}
                            <strong className="text-[var(--text-heading)]">
                              {rec.completedCount} tasks completed
                            </strong>{" "}
                            ·{" "}
                            {Array.isArray(agent.coverageAreas) &&
                            agent.coverageAreas.length > 0
                              ? `Corridors: ${agent.coverageAreas.slice(0, 3).join(", ")}`
                              : agent.location || agent.state || "General Corridor"}{" "}
                            · KYC {agent.kycStatus}
                          </p>
                        </div>
                        {isAssigned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold shrink-0">
                            <UserCheck className="w-3.5 h-3.5" />
                            {task.status === "MATCHED" ? "Invited (Awaiting Accept)" : "Assigned"}
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={assigningAgentId === agent.id}
                            onClick={() => handleAssignAgent(agent.id)}
                            className="px-3.5 h-8 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer shrink-0 disabled:opacity-50"
                          >
                            {assigningAgentId === agent.id
                              ? "Assigning..."
                              : isTopRecommended
                              ? "Assign Recommended"
                              : "Assign"}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* TAB 3: MILESTONES */}
      {activeTab === "MILESTONES" && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
            {!task.milestones || task.milestones.length === 0 ? (
              <p className="p-6 text-center text-xs text-[var(--text-muted)]">
                No milestones added yet.
              </p>
            ) : (
              task.milestones.map((m: any) => (
                <div key={m.id} className="p-4 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-semibold text-[var(--text-heading)]">{m.title}</p>
                    {m.description && (
                      <p className="text-[var(--text-muted)]">{m.description}</p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[var(--bg-secondary)] text-[var(--text-heading)] shrink-0">
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>

          <form
            onSubmit={handleAddMilestone}
            className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3"
          >
            <h3 className="text-sm font-semibold text-[var(--text-heading)]">Add Milestone</h3>
            <input
              type="text"
              required
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="Milestone title"
              className="w-full h-9 px-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
            />
            <textarea
              rows={2}
              value={newMilestoneDesc}
              onChange={(e) => setNewMilestoneDesc(e.target.value)}
              placeholder="Deliverable instructions (optional)"
              className="w-full p-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingMilestone}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isSavingMilestone ? "Adding..." : "Add Milestone"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: ADMIN SCOPE & STRUCTURING */}
      {activeTab === "DELIVERABLES" && (
        <div className="space-y-4">
          {/* Operational Brief + Milestones Toggle */}
          <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                  Operational Brief &amp; Execution Mode
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Clarify vague client requests into explicit instructions and required fields for the field operative.
                </p>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-heading)] cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={bpUsesMilestones}
                  onChange={(e) => setBpUsesMilestones(e.target.checked)}
                  className="w-4 h-4 accent-[var(--primary)] rounded cursor-pointer"
                />
                <span>Uses Multi-Phase Milestones</span>
              </label>
            </div>

            <textarea
              rows={3}
              value={bpBrief}
              onChange={(e) => setBpBrief(e.target.value)}
              placeholder="Write explicit step-by-step instructions for the agent..."
              className="w-full p-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Deliverables Checklist Builder */}
          <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-heading)]">
              Deliverables Checklist ({bpChecklist.length})
            </h3>
            {bpChecklist.length > 0 && (
              <ul className="space-y-2 text-xs">
                {bpChecklist.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                  >
                    <div className="flex items-center gap-2 text-[var(--text-heading)]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                      <span>{item}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBpChecklist((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-xs text-red-500 hover:underline cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Add a required checklist step..."
                className="flex-1 h-9 px-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newChecklistItem.trim()) return;
                  setBpChecklist((prev) => [...prev, newChecklistItem.trim()]);
                  setNewChecklistItem("");
                }}
                className="px-3 h-9 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
              >
                Add Step
              </button>
            </div>
          </div>

          {/* Required Agent Field Inputs Builder */}
          <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-heading)]">
              Required Agent Input Fields ({bpInputs.length})
            </h3>
            {bpInputs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bpInputs.map((inp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text-heading)] truncate">{inp.label}</p>
                      <p className="text-[10.5px] uppercase text-[var(--text-muted)]">{inp.type}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBpInputs((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-xs text-red-500 hover:underline cursor-pointer shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={newInputLabel}
                onChange={(e) => setNewInputLabel(e.target.value)}
                placeholder="e.g. Court Suit Number, Caretaker Name..."
                className="flex-1 h-9 px-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
              />
              <div className="w-44">
                <ResponsiveSelect
                  label="Input Field Type"
                  value={newInputType}
                  onChange={(val) => setNewInputType(val as any)}
                  options={[
                    { value: "text", label: "Short Text" },
                    { value: "textarea", label: "Detailed Notes" },
                    { value: "number", label: "Number" },
                    { value: "select", label: "Select" },
                    { value: "media", label: "Media Upload" },
                  ]}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newInputLabel.trim()) return;
                  const fieldKey = newInputLabel
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "_");
                  setBpInputs((prev) => [
                    ...prev,
                    { field: fieldKey, label: newInputLabel.trim(), type: newInputType, required: true },
                  ]);
                  setNewInputLabel("");
                }}
                className="px-3 h-9 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
              >
                Add Field
              </button>
            </div>
          </div>

          {/* Required Evidence Photo/Doc Slots Builder */}
          <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-heading)]">
              Required Evidence Photo / Document Slots ({bpEvidenceSlots.length})
            </h3>
            {bpEvidenceSlots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bpEvidenceSlots.map((slot, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
                  >
                    <span>{slot.label}</span>
                    <button
                      type="button"
                      onClick={() => setBpEvidenceSlots((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-red-500 font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSlotLabel}
                onChange={(e) => setNewSlotLabel(e.target.value)}
                placeholder="e.g. Official Registry Stamp Photo..."
                className="flex-1 h-9 px-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newSlotLabel.trim()) return;
                  const key = newSlotLabel.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
                  setBpEvidenceSlots((prev) => [
                    ...prev,
                    { key, label: newSlotLabel.trim(), required: true },
                  ]);
                  setNewSlotLabel("");
                }}
                className="px-3 h-9 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
              >
                Add Slot
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={isSavingStructure}
              onClick={handleSaveStructure}
              className="inline-flex items-center gap-1.5 px-5 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <span>{isSavingStructure ? "Saving..." : "Save Task Structure"}</span>
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        description={`Permanently delete "${task.title}"? This action cannot be undone.`}
        confirmLabel="Delete Task"
        loading={isDeletingTask}
        variant="danger"
      />
    </div>
  );
}
