"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Building2,
  Home,
  Star,
  Landmark,
  Flag,
  MessageSquare,
  Megaphone,
  ShieldAlert,
  Pencil,
  Check,
  X,
  CalendarClock,
  ShieldCheck,
  Lock,
  Plus,
} from "lucide-react";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { ResponsiveSelect } from "@/components/ui/ResponsiveSelect";

interface PropertyListItem {
  id: string;
  title: string;
  address: string;
  propertyType: string;
  ownershipType: "OWNED" | "OTHER";
  parcelNumber: string | null;
  estimatedValueNgn: number;
  reviewStatus?: string;
  ownershipVerificationStatus: string;
  vulnerabilityTestStatus: string;
  scheduleConfig: {
    cadence: string;
    autoDispenseEnabled: boolean;
    subscriptionTier: string;
  };
  assignedAgent: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  } | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    avatarUrl?: string | null;
  } | null;
  taskCount: number;
  createdAt: string;
}

const CADENCE_OPTIONS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "BI_MONTHLY", label: "Bi-Monthly (Every 2 Months)" },
  { value: "TRI_MONTHLY", label: "Tri-Monthly (Every 3 Months)" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "SEMI_ANNUALLY", label: "Every 6 Months (Default)" },
  { value: "ANNUALLY", label: "Annually (Basic Plan Default)" },
];

const QUICK_ACTIONS = [
  { key: "BUILDING_MATERIAL_COST", label: "Building Material Cost", icon: Home, ownedOnly: false },
  { key: "EXPERT_REVIEW", label: "Expert Review", icon: Star, ownedOnly: false },
  { key: "STATE_POLICY_UPDATES", label: "State Policy Updates", icon: Landmark, ownedOnly: false },
  { key: "LANDMARKS", label: "Landmarks", icon: Flag, ownedOnly: false },
  { key: "WORD_ON_STREET", label: "Word on the Street", icon: MessageSquare, ownedOnly: false },
  { key: "COMMUNITY_UPDATE", label: "Community Update", icon: Megaphone, ownedOnly: false },
  { key: "VULNERABILITY_TEST", label: "Request Vulnerability Test", icon: ShieldAlert, ownedOnly: true },
];

const PAGE_SIZE = 10;

function formatCurrency(val: number) {
  return `₦${Number(val || 0).toLocaleString()}`;
}

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function resolveMediaUrl(raw?: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  if (s.startsWith("/") || s.startsWith("data:")) {
    return s;
  }
  if (s.startsWith("http://") || s.startsWith("https://")) {
    if (s.includes(".amazonaws.com/")) {
      return `/api/v1/media?url=${encodeURIComponent(s)}`;
    }
    return s;
  }
  return `/api/v1/media?key=${encodeURIComponent(s)}`;
}

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export default function AdminPropertiesListingsPage() {
  const [items, setItems] = useState<PropertyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "ALL" | "PENDING_OWNERSHIP" | "PENDING_VULN" | "UNASSIGNED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState<"ALL" | "OWNED" | "OTHER">("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Detail View state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Inline Actions & Timeline Drawer state
  const [activeDrawerAction, setActiveDrawerAction] = useState<string | null>(null);
  const [dispensingAction, setDispensingAction] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [agentSearchQuery, setAgentSearchQuery] = useState<string>("");
  const [savingPatch, setSavingPatch] = useState(false);

  // Estimated value inline edit
  const [editingValue, setEditingValue] = useState(false);
  const [valueInput, setValueInput] = useState("");

  // Publish Intel form
  const [intelCategory, setIntelCategory] = useState<string>("EXPERT_REVIEW");
  const [intelHeadline, setIntelHeadline] = useState("");
  const [intelSummary, setIntelSummary] = useState("");
  const [publishingIntel, setPublishingIntel] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/admin/properties", {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);
      }
    } catch (err) {
      console.error("Failed to load properties:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPropertyDetail = async (id: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/v1/admin/properties/${id}`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setDetail(json.data);
        setSelectedAgentId(json.data.assignedAgent?.id || "");
        setValueInput(String(json.data.estimatedValueNgn || ""));
      }
    } catch (err) {
      console.error("Failed to load property detail:", err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleOpenDetail = (id: string) => {
    setSelectedPropertyId(id);
    setEditingValue(false);
    setShowAssignModal(false);
    loadPropertyDetail(id);
  };

  const handlePatchProperty = async (payload: Record<string, any>, successMsg: string) => {
    if (!detail) return;
    setSavingPatch(true);
    try {
      const res = await fetch(`/api/v1/admin/properties/${detail.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Update failed");
      await loadPropertyDetail(detail.id);
      await loadProperties();
      showToast(successMsg);
    } catch (err: any) {
      showToast(err.message || "Failed to update property");
    } finally {
      setSavingPatch(false);
    }
  };

  const handleDispenseTask = async (actionKey: string, label: string) => {
    if (!detail) return;
    setDispensingAction(actionKey);
    try {
      const res = await fetch(`/api/v1/admin/properties/${detail.id}/dispense`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify({ actionType: actionKey }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to dispense task");
      await loadPropertyDetail(detail.id);
      await loadProperties();
      showToast(`${label} task dispensed to Operations`);
    } catch (err: any) {
      showToast(err.message || "Failed to dispense task");
    } finally {
      setDispensingAction(null);
    }
  };

  const handlePublishIntel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail || !intelSummary.trim()) return;
    setPublishingIntel(true);
    try {
      const entry =
        intelCategory === "POLICY_UPDATE"
          ? { text: intelSummary.trim() }
          : intelCategory === "LANDMARK"
          ? { name: intelHeadline.trim() || "Vicinity Landmark", feature: intelSummary.trim() }
          : {
              headline: intelHeadline.trim() || "Oversite Intelligence Update",
              summary: intelSummary.trim(),
            };

      const res = await fetch(`/api/v1/admin/properties/${detail.id}/intel`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify({ category: intelCategory, entry }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to publish intel");
      setIntelHeadline("");
      setIntelSummary("");
      await loadPropertyDetail(detail.id);
      showToast("Timeline intelligence published to property & client view");
    } catch (err: any) {
      showToast(err.message || "Failed to publish intelligence");
    } finally {
      setPublishingIntel(false);
    }
  };

  // Counts for the 3 domain tabs
  const pendingOwnershipCount = useMemo(
    () =>
      items.filter(
        (p) => p.ownershipType === "OWNED" && p.ownershipVerificationStatus !== "VERIFIED"
      ).length,
    [items]
  );

  const pendingVulnCount = useMemo(
    () =>
      items.filter(
        (p) => p.ownershipType === "OWNED" && p.vulnerabilityTestStatus === "PENDING"
      ).length,
    [items]
  );

  const unassignedCount = useMemo(
    () => items.filter((p) => !p.assignedAgent).length,
    [items]
  );

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (
        activeTab === "PENDING_OWNERSHIP" &&
        !(
          p.ownershipVerificationStatus !== "VERIFIED" ||
          p.reviewStatus === "PENDING_ADMIN_REVIEW"
        )
      ) {
        return false;
      }
      if (
        activeTab === "PENDING_VULN" &&
        !(p.ownershipType === "OWNED" && p.vulnerabilityTestStatus === "PENDING")
      ) {
        return false;
      }
      if (activeTab === "UNASSIGNED" && p.assignedAgent) {
        return false;
      }
      if (ownershipFilter !== "ALL" && p.ownershipType !== ownershipFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          p.title.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          (p.owner?.name && p.owner.name.toLowerCase().includes(q)) ||
          (p.owner?.email && p.owner.email.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [items, activeTab, ownershipFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ─── FULL PROPERTY DETAIL VIEW ───
  if (selectedPropertyId) {
    const isOwned = detail?.ownershipType === "OWNED";
    const photos: string[] = Array.isArray(detail?.baselinePhotos) ? detail.baselinePhotos : [];
    const heroImg = resolveMediaUrl(photos[0]) || "/assets/images/tasks/site-worker.jpg";
    const ownerName = detail?.owner?.name || "Unnamed Owner";
    const ownerParts = ownerName.trim().split(/\s+/);

    return (
      <div className="max-w-5xl mx-auto space-y-5">
        {toastMessage && (
          <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
            <div className="bg-[var(--bg-card)] border border-[var(--primary)] text-[var(--text-heading)] px-4 py-2 rounded-md shadow-lg text-xs font-semibold">
              {toastMessage}
            </div>
          </div>
        )}

        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setSelectedPropertyId(null);
                setDetail(null);
              }}
              className="inline-flex items-center gap-1 font-medium text-[var(--text-heading)] hover:text-[var(--primary)] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span className="text-[var(--text-muted)]">/ Properties Listings /</span>
            <span className="font-semibold text-[var(--text-heading)] truncate max-w-[200px]">
              {detail?.title || "Loading..."}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {detail &&
              (detail.reviewStatus !== "APPROVED" ||
                detail.ownershipVerificationStatus !== "VERIFIED") && (
                <button
                  type="button"
                  disabled={savingPatch}
                  onClick={() =>
                    handlePatchProperty(
                      {
                        reviewStatus: "APPROVED",
                        ownershipVerificationStatus: "VERIFIED",
                      },
                      "Property verified, owner notified & baseline monitoring activated!"
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Approve &amp; Activate Monitoring</span>
                </button>
              )}
            <button
              type="button"
              onClick={() => setShowAssignModal((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {detail?.assignedAgent
                  ? "Reassign Personal Manager"
                  : "Assign Personal Manager"}
              </span>
            </button>
          </div>
        </div>

        {isLoadingDetail || !detail ? (
          <DynamicLoadingState variant="documents" count={3} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-[var(--text-heading)]">{detail.title}</h1>
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                  isOwned
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }`}
              >
                {isOwned ? "Owned Property" : "Encroachment Watch"}
              </span>
            </div>

            {showAssignModal && (() => {
              const allAgents: any[] = detail.availableAgents || [];
              const selectedAgentObj = allAgents.find((a) => a.id === selectedAgentId) || null;
              const q = agentSearchQuery.trim().toLowerCase();
              const matchingAgents = q
                ? allAgents.filter(
                    (a) =>
                      (a.name && a.name.toLowerCase().includes(q)) ||
                      (a.email && a.email.toLowerCase().includes(q)) ||
                      (a.phone && a.phone.toLowerCase().includes(q))
                  )
                : allAgents;

              return (
                <div
                  className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setShowAssignModal(false)}
                >
                  <div
                    className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl p-6 space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-[var(--text-heading)]">
                          Assign Listing to a Manager
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          Assign a manager to this property.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAssignModal(false)}
                        className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Search Input + Live Autocomplete Dropdown */}
                    <div className="relative">
                      <input
                        type="text"
                        value={agentSearchQuery}
                        onChange={(e) => setAgentSearchQuery(e.target.value)}
                        placeholder="Enter name, username or email address"
                        className="w-full h-10 px-3.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                      />
                      {(!selectedAgentObj || agentSearchQuery.trim().length > 0) && (
                        <div className="mt-2 max-h-52 overflow-y-auto rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg divide-y divide-[var(--border-color)]">
                          {matchingAgents.length === 0 ? (
                            <p className="px-3.5 py-3 text-xs text-[var(--text-muted)]">
                              No matching active agents found.
                            </p>
                          ) : (
                            matchingAgents.map((agent) => {
                              const isPicked = agent.id === selectedAgentId;
                              return (
                                <button
                                  key={agent.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAgentId(agent.id);
                                    setAgentSearchQuery("");
                                  }}
                                  className={`w-full text-left px-3.5 py-2.5 transition-colors cursor-pointer ${
                                    isPicked
                                      ? "bg-[var(--primary)]/10"
                                      : "hover:bg-[var(--bg-secondary)]"
                                  }`}
                                >
                                  <p className="text-xs font-semibold text-[var(--text-heading)]">
                                    {agent.name || "Unnamed Agent"}
                                  </p>
                                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                    {agent.email}
                                    {agent.phone ? ` · ${agent.phone}` : ""}
                                  </p>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selected Agent Sage Chip */}
                    {selectedAgentObj && (
                      <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[var(--text-heading)] truncate">
                            {selectedAgentObj.name || "Unnamed Agent"}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] truncate">
                            {selectedAgentObj.email}
                            {selectedAgentObj.phone ? ` · ${selectedAgentObj.phone}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedAgentId("")}
                          className="text-xs font-semibold text-[var(--text-heading)] hover:text-red-500 cursor-pointer shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Footer Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAssignModal(false)}
                        className="px-4 h-9 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingPatch || (!selectedAgentId && !detail.assignedAgent)}
                        onClick={async () => {
                          await handlePatchProperty(
                            { assignedAgentId: selectedAgentId || null },
                            selectedAgentId
                              ? "Property assigned to manager"
                              : "Property manager removed"
                          );
                          setShowAssignModal(false);
                        }}
                        className="px-4 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {savingPatch ? "Saving..." : "Assign Role"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT COLUMN */}
              <div className="lg:col-span-5 space-y-5">
                {/* Estimated Property Value Card */}
                <div className="rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text-muted)]">
                      Estimated Property Value
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingValue((v) => !v)}
                      className="w-7 h-7 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-heading)] hover:text-[var(--primary)] cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {editingValue ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        value={valueInput}
                        onChange={(e) => setValueInput(e.target.value)}
                        placeholder="e.g. 201000000"
                        className="flex-1 h-9 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)]"
                      />
                      <button
                        type="button"
                        disabled={savingPatch}
                        onClick={async () => {
                          await handlePatchProperty(
                            { estimatedValueNgn: Number(valueInput) || 0 },
                            "Estimated property value updated"
                          );
                          setEditingValue(false);
                        }}
                        className="h-9 px-3 rounded-md bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingValue(false)}
                        className="h-9 px-2.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-xs cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold text-[var(--text-heading)]">
                      {formatCurrency(detail.estimatedValueNgn || 0)}
                    </p>
                  )}
                </div>

                {/* Quick Actions Card */}
                <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                      Quick Actions
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Click any action to view its approved timeline history or dispense a new task.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QUICK_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      const restricted = action.ownedOnly && !isOwned;
                      return (
                        <button
                          key={action.key}
                          type="button"
                          disabled={restricted}
                          title={
                            restricted
                              ? "Only available for client-owned properties with access permission"
                              : `View ${action.label} history & dispatch`
                          }
                          onClick={() => setActiveDrawerAction(action.key)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-xs font-medium text-left transition-colors ${
                            restricted
                              ? "border-[var(--border-color)] bg-[var(--bg-secondary)]/60 text-[var(--text-muted)] opacity-60 cursor-not-allowed"
                              : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-[var(--text-heading)] cursor-pointer"
                          }`}
                        >
                          {restricted ? (
                            <Lock className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
                          ) : (
                            <Icon className="w-3.5 h-3.5 shrink-0 text-[var(--primary)]" />
                          )}
                          <span className="truncate">{action.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recurring Schedule & Subscription Tier Card */}
                <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="w-4 h-4 text-[var(--primary)]" />
                      <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                        Recurring Cadence
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      Subscription · Coming Soon
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Defaults to Every 6 Months (Annually on Basic plan). End users can adjust
                    frequency within their subscription plan&apos;s min/max bounds.
                  </p>
                  <ResponsiveSelect
                    label="Recurring Cadence"
                    value={detail.scheduleConfig?.cadence || "SEMI_ANNUALLY"}
                    disabled={savingPatch}
                    onChange={(val) =>
                      handlePatchProperty(
                        {
                          scheduleConfig: {
                            ...(detail.scheduleConfig || {}),
                            cadence: val,
                          },
                        },
                        "Recurring task cadence updated"
                      )
                    }
                    options={CADENCE_OPTIONS}
                  />
                </div>

                {/* Property Manager Information Card */}
                <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-5">
                  <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                    Property Manager Information
                  </h3>
                  {detail.assignedAgent ? (() => {
                    const mgrName = detail.assignedAgent.name || "Assigned Operative";
                    const mgrParts = mgrName.trim().split(/\s+/);
                    const mgrAvatar = resolveMediaUrl(detail.assignedAgent.avatarUrl);
                    return (
                      <div className="space-y-5">
                        {mgrAvatar ? (
                          <img
                            src={mgrAvatar}
                            alt={mgrName}
                            className="w-20 h-20 rounded-full object-cover border border-[var(--border-color)] pointer-events-none"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-bold text-xl flex items-center justify-center border border-[var(--primary)]/20">
                            {mgrName.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-[var(--text-muted)] mb-1">First Name</p>
                            <p className="font-semibold text-[var(--text-heading)]">
                              {mgrParts[0] || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[var(--text-muted)] mb-1">Last Name</p>
                            <p className="font-semibold text-[var(--text-heading)]">
                              {mgrParts.slice(1).join(" ") || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[var(--text-muted)] mb-1">Username</p>
                            <p className="font-semibold text-[var(--text-heading)] truncate">
                              {detail.assignedAgent.email?.split("@")[0] || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-[var(--text-muted)] mb-1">Email</p>
                            <p className="font-semibold text-[var(--text-heading)] break-all">
                              {detail.assignedAgent.email || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[var(--text-muted)] mb-1">Phone Number</p>
                            <p className="font-semibold text-[var(--text-heading)]">
                              {detail.assignedAgent.phone || "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="py-5 text-center space-y-3">
                      <Building2 className="w-7 h-7 text-[var(--primary)] mx-auto opacity-80" />
                      <p className="text-xs text-[var(--text-muted)]">
                        This property has not been assigned to a manager yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAssignModal(true)}
                        className="px-4 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer"
                      >
                        Assign Property
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-7 space-y-5">
                {/* Main Property Info Card */}
                <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-5">
                  <div className="rounded-md overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)] h-52">
                    <img
                      src={heroImg}
                      alt={detail.title}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-[var(--text-muted)] mb-1">Property Name</p>
                      <p className="font-semibold text-[var(--text-heading)]">{detail.title}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] mb-1">Type</p>
                      <p className="font-semibold text-[var(--text-heading)]">
                        {detail.propertyType || "Property"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-muted)] mb-1">Vulnerability Test</p>
                      <p className="font-semibold text-[var(--text-heading)]">
                        {String(detail.vulnerabilityTestStatus || "PENDING").replace(/_/g, " ")}
                      </p>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <p className="text-[var(--text-muted)] mb-1">Property Address</p>
                      <p className="font-semibold text-[var(--text-heading)]">{detail.address}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      <p className="text-[var(--text-muted)] mb-1">Details</p>
                      <p className="text-[var(--text-heading)] leading-relaxed">
                        {detail.description || "No additional landmark description provided."}
                      </p>
                    </div>
                  </div>

                  {photos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-[var(--text-heading)]">
                        Listing Images ({photos.length})
                      </p>
                      <div className="grid grid-cols-3 gap-2.5">
                        {photos.slice(0, 6).map((url, idx) => (
                          <div
                            key={idx}
                            className="h-24 rounded-md overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)]"
                          >
                            <img
                              src={resolveMediaUrl(url) || ""}
                              alt={`Property ${idx + 1}`}
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Property Owner Details */}
                  <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
                    <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                      Property Owner Details
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {resolveMediaUrl(detail.owner?.avatarUrl) ? (
                        <img
                          src={resolveMediaUrl(detail.owner?.avatarUrl) || ""}
                          alt={ownerName}
                          className="w-12 h-12 rounded-full object-cover border border-[var(--border-color)] shrink-0 pointer-events-none"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-bold text-sm flex items-center justify-center shrink-0">
                          {ownerName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs flex-1">
                        <div>
                          <p className="text-[var(--text-muted)]">First Name</p>
                          <p className="font-semibold text-[var(--text-heading)]">
                            {ownerParts[0] || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--text-muted)]">Last Name</p>
                          <p className="font-semibold text-[var(--text-heading)]">
                            {ownerParts.slice(1).join(" ") || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--text-muted)]">Phone</p>
                          <p className="font-semibold text-[var(--text-heading)]">
                            {detail.owner?.phone || "—"}
                          </p>
                        </div>
                        <div className="col-span-2 sm:col-span-3">
                          <p className="text-[var(--text-muted)]">Email</p>
                          <p className="font-semibold text-[var(--text-heading)] break-all">
                            {detail.owner?.email || "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dispensed Tasks History */}
                <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-[var(--border-color)]">
                    <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                      Dispensed Tasks ({detail.tasks?.length || 0})
                    </h3>
                  </div>
                  {!detail.tasks || detail.tasks.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                      No tasks dispensed for this property yet. Use Quick Actions to dispense one.
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border-color)]">
                      {detail.tasks.map((t: any) => (
                        <div
                          key={t.id}
                          className="px-5 py-3 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text-heading)] truncate">
                              {t.title}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {String(t.moduleType || "").replace(/_/g, " ")} ·{" "}
                              {formatShortDate(t.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10.5px] font-semibold shrink-0 ${
                              t.status === "COMPLETED"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : t.status === "CANCELLED" || t.status === "DISPUTED"
                                ? "bg-red-500/15 text-red-500"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {String(t.status || "").replace(/_/g, " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Responsive Quick Action Timeline & Task Dispatch Drawer (Desktop Slide-Over / Mobile Floating Sheet) */}
            {activeDrawerAction && (() => {
              const activeCfg =
                QUICK_ACTIONS.find((a) => a.key === activeDrawerAction) || QUICK_ACTIONS[0];
              const tl = detail.intelTimeline || {};

              const getTimelineEntries = (actionKey: string) => {
                if (actionKey === "EXPERT_REVIEW") {
                  return (tl.expertReviews || []).map((e: any) => ({
                    id: e.id,
                    date: e.createdAt,
                    title: e.headline || "Expert Review Report",
                    body: e.summary,
                    meta: e.reviewer ? `${e.reviewer}${e.rating ? ` · ${e.rating}` : ""}` : e.rating,
                  }));
                }
                if (actionKey === "STATE_POLICY_UPDATES") {
                  return (tl.policyUpdates || []).map((e: any) => ({
                    id: e.id,
                    date: e.createdAt || e.dateLabel,
                    title: "State Policy Directive",
                    body: e.text,
                    meta: null,
                  }));
                }
                if (actionKey === "WORD_ON_STREET" || actionKey === "COMMUNITY_UPDATE") {
                  return (tl.wordOnStreet || []).map((e: any) => ({
                    id: e.id,
                    date: e.createdAt,
                    title: e.headline || "Community Inquiry",
                    body: e.summary,
                    meta: e.confidenceScore ? `Confidence: ${e.confidenceScore}` : null,
                  }));
                }
                if (actionKey === "LANDMARKS") {
                  return (tl.landmarks || []).map((e: any) => ({
                    id: e.id,
                    date: e.createdAt || e.addedLabel,
                    title: e.name || "Vicinity Landmark",
                    body: `${e.distance || ""}${e.distance && e.feature ? " — " : ""}${e.feature || ""}`,
                    meta: null,
                  }));
                }
                // Fallback for Building Material Cost / Vulnerability Test: show related dispensed tasks
                return (detail.tasks || [])
                  .filter((t: any) => (t.formData as any)?.quickActionType === actionKey)
                  .map((t: any) => ({
                    id: t.id,
                    date: t.createdAt,
                    title: t.title,
                    body: `Task status: ${String(t.status || "").replace(/_/g, " ")}`,
                    meta: t.completedAt ? `Completed ${formatShortDate(t.completedAt)}` : "In Operations Queue",
                  }));
              };

              const entries = getTimelineEntries(activeDrawerAction);
              const isReviewPair =
                activeDrawerAction === "EXPERT_REVIEW" ||
                activeDrawerAction === "STATE_POLICY_UPDATES";
              const isCommunityPair =
                activeDrawerAction === "WORD_ON_STREET" ||
                activeDrawerAction === "COMMUNITY_UPDATE";
              const busy = dispensingAction === activeDrawerAction;

              return (
                <div
                  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-end sm:items-stretch justify-center sm:justify-end p-3 sm:p-0"
                  onClick={() => setActiveDrawerAction(null)}
                >
                  <div
                    className="relative w-full max-w-md flex flex-col sm:flex-row items-end sm:items-start gap-2.5 sm:h-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Floating Close Button (Top-right on Mobile, Outside Top-left on Desktop) */}
                    <button
                      type="button"
                      onClick={() => setActiveDrawerAction(null)}
                      aria-label="Close timeline drawer"
                      className="sm:mt-4 w-9 h-9 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md flex items-center justify-center text-[var(--text-heading)] hover:text-[var(--primary)] cursor-pointer shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Drawer / Sheet Body */}
                    <div className="w-full sm:h-full max-h-[82vh] sm:max-h-none bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl sm:rounded-none sm:rounded-l-2xl shadow-2xl flex flex-col overflow-hidden">
                      {/* Header */}
                      <div className="px-5 pt-5 pb-3 border-b border-[var(--border-color)] space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-[var(--text-heading)]">
                            {isReviewPair
                              ? "Review"
                              : isCommunityPair
                              ? "Community Intel"
                              : activeCfg.label}
                          </h3>
                          <span className="text-[11px] font-medium text-[var(--text-muted)]">
                            {entries.length} {entries.length === 1 ? "entry" : "entries"}
                          </span>
                        </div>

                        {/* Segmented Tabs (matching mockup) */}
                        {isReviewPair && (
                          <div className="grid grid-cols-2 p-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                            <button
                              type="button"
                              onClick={() => setActiveDrawerAction("EXPERT_REVIEW")}
                              className={`py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                activeDrawerAction === "EXPERT_REVIEW"
                                  ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                                  : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                              }`}
                            >
                              Expert Review
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveDrawerAction("STATE_POLICY_UPDATES")}
                              className={`py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeDrawerAction === "STATE_POLICY_UPDATES"
                                  ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                                  : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                              }`}
                            >
                              <span>State Policy Updates</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            </button>
                          </div>
                        )}

                        {isCommunityPair && (
                          <div className="grid grid-cols-2 p-1 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                            <button
                              type="button"
                              onClick={() => setActiveDrawerAction("WORD_ON_STREET")}
                              className={`py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                activeDrawerAction === "WORD_ON_STREET"
                                  ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                                  : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                              }`}
                            >
                              Word on the Street
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveDrawerAction("COMMUNITY_UPDATE")}
                              className={`py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                activeDrawerAction === "COMMUNITY_UPDATE"
                                  ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                                  : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                              }`}
                            >
                              Community Update
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Vertical Dot-and-Line Timeline */}
                      <div className="flex-1 overflow-y-auto px-5 py-4">
                        {entries.length === 0 ? (
                          <div className="py-12 text-center space-y-2">
                            <p className="text-xs font-semibold text-[var(--text-heading)]">
                              No approved {activeCfg.label.toLowerCase()} reports yet
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
                              Dispense a new task below for a field operative to gather findings.
                              Once submitted and approved in QA, it will appear in this timeline.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-0">
                            {entries.map((entry: any, idx: number) => {
                              const isFirst = idx === 0;
                              const isLast = idx === entries.length - 1;
                              return (
                                <div key={entry.id || idx} className="flex gap-3.5">
                                  {/* Dot + Vertical Line */}
                                  <div className="flex flex-col items-center pt-1">
                                    <span
                                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                        isFirst
                                          ? "bg-emerald-600 ring-4 ring-emerald-500/20"
                                          : "bg-[var(--text-muted)]/50"
                                      }`}
                                    />
                                    {!isLast && (
                                      <div className="w-px flex-1 bg-[var(--border-color)] my-1.5" />
                                    )}
                                  </div>
                                  {/* Content */}
                                  <div className="pb-5 flex-1 min-w-0 space-y-1">
                                    <p className="text-[11px] text-[var(--text-muted)]">
                                      {entry.date ? formatShortDate(entry.date) : "Verified Update"}
                                    </p>
                                    {entry.title && (
                                      <p className="text-xs font-semibold text-[var(--text-heading)]">
                                        {entry.title}
                                      </p>
                                    )}
                                    <p className="text-xs text-[var(--text-heading)]/90 leading-relaxed">
                                      {entry.body}
                                    </p>
                                    {entry.meta && (
                                      <p className="text-[10.5px] text-[var(--text-muted)] pt-0.5">
                                        {entry.meta}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Sticky Footer: Intentional Task Dispatch Button */}
                      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50 space-y-2">
                        <p className="text-[11px] text-[var(--text-muted)]">
                          Subscription-included task (₦0 client charge) · Predefined agent inputs
                        </p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={async () => {
                            await handleDispenseTask(activeCfg.key, activeCfg.label);
                          }}
                          className="w-full h-10 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            {busy ? "Dispensing Task..." : `Dispense New ${activeCfg.label} Task`}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    );
  }

  // ─── PROPERTIES LISTINGS TABLE / MOBILE VIEW ───
  return (
    <div className="space-y-5">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[var(--bg-card)] border border-[var(--primary)] text-[var(--text-heading)] px-4 py-2 rounded-md shadow-lg text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
        {/* Top Bar: Tabs + Search + Filters */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-color)] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-5 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTab("ALL");
                setCurrentPage(1);
              }}
              className={`pb-2 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === "ALL"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              <span>All Listings</span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--bg-secondary)] text-[11px]">
                {items.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("PENDING_OWNERSHIP");
                setCurrentPage(1);
              }}
              className={`pb-2 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === "PENDING_OWNERSHIP"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              <span>Pending Ownership Verification</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px]">
                {pendingOwnershipCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("PENDING_VULN");
                setCurrentPage(1);
              }}
              className={`pb-2 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === "PENDING_VULN"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              <span>Pending Vulnerability Test</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px]">
                {pendingVulnCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("UNASSIGNED");
                setCurrentPage(1);
              }}
              className={`pb-2 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === "UNASSIGNED"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              <span>Unassigned Manager</span>
              <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-400 text-[11px]">
                {unassignedCount}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search properties or owners..."
                className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md border border-[var(--border-color)] text-xs font-medium text-[var(--text-heading)] hover:border-[var(--primary)] cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="px-5 py-3 bg-[var(--bg-secondary)]/60 border-b border-[var(--border-color)] flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-[var(--text-muted)]">Ownership Type:</span>
            {(["ALL", "OWNED", "OTHER"] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setOwnershipFilter(opt);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer ${
                  ownershipFilter === opt
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)]"
                }`}
              >
                {opt === "ALL" ? "All" : opt === "OWNED" ? "Owned" : "Encroachment Watch"}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="p-6">
            <DynamicLoadingState variant="documents" count={5} />
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-10 text-center text-xs text-[var(--text-muted)]">
            No properties match the current filter.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--border-color)] text-[11px] text-[var(--text-muted)]">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Ownership</th>
                    <th className="px-5 py-3 font-semibold">Property Manager</th>
                    <th className="px-5 py-3 font-semibold">Owner</th>
                    <th className="px-5 py-3 font-semibold">Created on</th>
                    <th className="px-5 py-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {paginated.map((prop) => (
                    <tr
                      key={prop.id}
                      className="hover:bg-[var(--bg-secondary)]/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[var(--text-heading)]">{prop.title}</p>
                          {prop.reviewStatus === "PENDING_ADMIN_REVIEW" && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
                              Pending Approval
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[240px]">
                          {prop.address}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                            prop.ownershipType === "OWNED"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {prop.ownershipType === "OWNED" ? "Owned" : "Encroachment"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {prop.assignedAgent ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-semibold">
                            <span>Assigned: {prop.assignedAgent.name || prop.assignedAgent.email}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[10.5px] font-semibold">
                            <span>Unassigned</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-[var(--text-muted)]">
                        {prop.owner?.name || prop.owner?.email || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-[var(--text-muted)]">
                        {formatShortDate(prop.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(prop.id)}
                          className="px-3.5 h-8 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-xs font-medium text-[var(--text-heading)] cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-[var(--border-color)]">
              {paginated.map((prop) => (
                <div key={prop.id} className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--text-muted)]">Name</span>
                    <span className="font-semibold text-[var(--text-heading)] text-right">
                      {prop.title}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--text-muted)]">Ownership</span>
                    <span className="font-semibold text-[var(--text-heading)]">
                      {prop.ownershipType === "OWNED" ? "Owned" : "Encroachment"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-[var(--text-muted)]">Manager</span>
                    <span
                      className={`font-semibold ${
                        prop.assignedAgent
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-500"
                      }`}
                    >
                      {prop.assignedAgent
                        ? prop.assignedAgent.name || prop.assignedAgent.email
                        : "Unassigned"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(prop.id)}
                    className="w-full pt-2 text-center font-semibold text-[var(--primary)] cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-5 py-3.5 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 font-medium text-[var(--text-heading)] disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <span className="text-[var(--text-muted)]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 font-medium text-[var(--text-heading)] disabled:opacity-40 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

