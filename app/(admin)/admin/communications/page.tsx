"use client";

import { useState, useEffect } from "react";
import {
  Megaphone,
  Send,
  Users,
  Mail,
  Bell,
  Filter,
  Sparkles,
  Check,
  Search,
  Clock,
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

const QUICK_TEMPLATES = [
  {
    label: "KYC Completion Reminder (Agents)",
    targetGroup: "AGENT",
    kycStatus: "PENDING",
    notificationType: "ALERT",
    title: "Action Required: Complete Your Oversite KYC Accreditation",
    message:
      "Please upload your remaining accreditation documents and NIN verification in the Field Operative portal to unlock live mission dispatches in your coverage area.",
  },
  {
    label: "Urgent Missions Available in Queue",
    targetGroup: "AGENT",
    kycStatus: "VERIFIED",
    notificationType: "TASK_UPDATE",
    title: "New High-Priority Field Missions Available",
    message:
      "New Property Oversite and Due Diligence missions have been posted to the live dispatch queue. Toggle your status Online to review and accept tasks.",
  },
  {
    label: "Platform Security & Policy Update (All Users)",
    targetGroup: "ALL",
    kycStatus: "ALL",
    notificationType: "SYSTEM",
    title: "Oversite Service & Security Update",
    message:
      "All field communications and deliverables are processed directly through Oversite Central Operations for your security and quality assurance.",
  },
  {
    label: "Waitlist Onboarding Invitation",
    targetGroup: "WAITLIST",
    kycStatus: "ALL",
    notificationType: "SYSTEM",
    title: "You're Invited: Early Access to Oversite.ng V2026",
    message:
      "Your Oversite waitlist spot is now active! Complete your registration today to request verified ground inspections, errands, and due diligence across Nigeria.",
  },
];

export default function AdminCommunicationsPage() {
  const [activeTab, setActiveTab] = useState<"compose" | "history">("compose");

  // Audience Filter State
  const [targetGroup, setTargetGroup] = useState<
    "ALL" | "USER" | "AGENT" | "ADMIN" | "WAITLIST" | "CUSTOM"
  >("ALL");
  const [kycStatus, setKycStatus] = useState("ALL");
  const [agentTier, setAgentTier] = useState("ALL");
  const [availability, setAvailability] = useState("ALL");
  const [accountStatus, setAccountStatus] = useState("ALL");
  const [stateFilter, setStateFilter] = useState("");
  const [customUserIds, setCustomUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Composer State
  const [channel, setChannel] = useState<"BOTH" | "IN_APP" | "EMAIL">("BOTH");
  const [notificationType, setNotificationType] = useState<
    "SYSTEM" | "ALERT" | "TASK_UPDATE" | "PAYMENT"
  >("SYSTEM");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [actionLink, setActionLink] = useState("");

  // Preview & History Data
  const [matchedCount, setMatchedCount] = useState(0);
  const [sampleRecipients, setSampleRecipients] = useState<any[]>([]);
  const [directory, setDirectory] = useState<any[]>([]);
  const [recentEmails, setRecentEmails] = useState<any[]>([]);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  async function fetchAudiencePreview() {
    setIsLoadingPreview(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams({
        targetGroup,
        kycStatus,
        agentTier,
        availability,
        accountStatus,
        stateFilter,
        customUserIds: customUserIds.join(","),
      });

      const res = await fetch(`/api/v1/admin/communications?${params.toString()}`, {
        credentials: "include",
        headers,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMatchedCount(json.data.matchedCount || 0);
        setSampleRecipients(json.data.sampleRecipients || []);
        setDirectory(json.data.directory || []);
        setRecentEmails(json.data.recentEmails || []);
        setRecentNotifications(json.data.recentNotifications || []);
      }
    } catch (err) {
      console.error("Failed to load audience preview:", err);
    } finally {
      setIsLoadingPreview(false);
    }
  }

  useEffect(() => {
    fetchAudiencePreview();
  }, [
    targetGroup,
    kycStatus,
    agentTier,
    availability,
    accountStatus,
    stateFilter,
    customUserIds,
  ]);

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      showToast("Please enter both a subject/title and message body.");
      return;
    }

    setIsSending(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/admin/communications", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          targetGroup,
          kycStatus,
          agentTier,
          availability,
          accountStatus,
          stateFilter,
          customUserIds,
          channel,
          notificationType,
          title,
          message,
          actionLink: actionLink.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "Broadcast disbursed successfully!");
        setTitle("");
        setMessage("");
        setActionLink("");
        fetchAudiencePreview();
      } else {
        showToast(json.error?.message || "Failed to disburse broadcast");
      }
    } catch (err: any) {
      showToast(err.message || "Error disbursing broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const toggleCustomUser = (id: string) => {
    setCustomUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredDirectory = directory.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.operativeCode && u.operativeCode.toLowerCase().includes(q))
    );
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
            <Megaphone className="w-6 h-6 text-[var(--primary)]" />
            Broadcast & Targeted Communications Center
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Disburse targeted emails and in-app notifications to all users, filtered segments, or hand-picked accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("compose")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              activeTab === "compose"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]"
            }`}
          >
            Compose & Target
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              activeTab === "history"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]"
            }`}
          >
            Disbursement Audit Log
          </button>
        </div>
      </div>

      {activeTab === "compose" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Audience Filter Builder + Message Composer */}
          <form onSubmit={handleDisburse} className="lg:col-span-2 space-y-6">
            {/* Step 1: Audience Segmentation & Condition Filters */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[var(--primary)]" />
                  1. Target Audience & Filter Conditions
                </h2>
                <span className="px-2.5 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-bold">
                  {matchedCount} Matched Recipient{matchedCount === 1 ? "" : "s"}
                </span>
              </div>

              {/* Primary Target Group Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "ALL", label: "All Users & Agents" },
                  { id: "USER", label: "End Users (Clients)" },
                  { id: "AGENT", label: "Field Operatives" },
                  { id: "ADMIN", label: "Platform Admins" },
                  { id: "WAITLIST", label: "Waitlist Leads" },
                  { id: "CUSTOM", label: "Specific Individuals" },
                ].map((grp) => (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => setTargetGroup(grp.id as any)}
                    className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                      targetGroup === grp.id
                        ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] font-bold"
                        : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-heading)]"
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>

              {/* Conditional Filters (when not WAITLIST or CUSTOM) */}
              {targetGroup !== "WAITLIST" && targetGroup !== "CUSTOM" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                      KYC Verification Status
                    </label>
                    <select
                      value={kycStatus}
                      onChange={(e) => setKycStatus(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-heading)]"
                    >
                      <option value="ALL">Any KYC Status</option>
                      <option value="VERIFIED">Verified Only</option>
                      <option value="SUBMITTED">Submitted (Pending Review)</option>
                      <option value="PENDING">Pending / Incomplete</option>
                      <option value="REJECTED">Rejected</option>
                    </select>
                  </div>

                  {(targetGroup === "ALL" || targetGroup === "AGENT") && (
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                        Operative Tier
                      </label>
                      <select
                        value={agentTier}
                        onChange={(e) => setAgentTier(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-heading)]"
                      >
                        <option value="ALL">All Operative Tiers</option>
                        <option value="GENERAL">General Operative</option>
                        <option value="TECHNICAL_SUPERVISOR">Technical Supervisor</option>
                        <option value="INVESTIGATOR">Investigator</option>
                        <option value="LEGAL_COUNSEL">Legal Counsel</option>
                        <option value="ENFORCEMENT_LIAISON">Enforcement Liaison</option>
                      </select>
                    </div>
                  )}

                  {(targetGroup === "ALL" || targetGroup === "AGENT") && (
                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                        Online Availability
                      </label>
                      <select
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-heading)]"
                      >
                        <option value="ALL">Online & Offline</option>
                        <option value="ONLINE">Online Only</option>
                        <option value="OFFLINE">Offline Only</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                      Account Status
                    </label>
                    <select
                      value={accountStatus}
                      onChange={(e) => setAccountStatus(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-heading)]"
                    >
                      <option value="ALL">Active & Suspended</option>
                      <option value="ACTIVE">Active Accounts Only</option>
                      <option value="SUSPENDED">Suspended Accounts Only</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                      State / City Filter (Optional)
                    </label>
                    <input
                      type="text"
                      value={stateFilter}
                      onChange={(e) => setStateFilter(e.target.value)}
                      placeholder="e.g. Lagos, Abuja, Port Harcourt..."
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-heading)]"
                    />
                  </div>
                </div>
              )}

              {/* Specific Individual Multi-Select Picker */}
              {targetGroup === "CUSTOM" && (
                <div className="space-y-3 pt-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search users by name, email, or OS-ID..."
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl pl-8 pr-3 py-2 text-xs text-[var(--text-heading)]"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] divide-y divide-[var(--border-color)]">
                    {filteredDirectory.map((u) => {
                      const checked = customUserIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center justify-between px-3 py-2 text-xs cursor-pointer hover:bg-[var(--bg-card)]"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCustomUser(u.id)}
                            />
                            {u.operativeCode && (
                              <span className="font-mono text-[10px] font-bold text-[var(--primary)]">
                                {u.operativeCode}
                              </span>
                            )}
                            <span className="font-semibold text-[var(--text-heading)]">
                              {u.name || u.email}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)]">
                              ({u.email})
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--text-muted)]">
                            {u.role}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Delivery Channels & Message Composer */}
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-xs">
              <h2 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                <Send className="w-4 h-4 text-[var(--primary)]" />
                2. Delivery Channel & Message Content
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Disbursement Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-heading)]"
                  >
                    <option value="BOTH">Both Email & In-App Notification</option>
                    <option value="IN_APP">In-App Notification Only</option>
                    <option value="EMAIL">Email Dispatch Only (AWS SES)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Notification Category / Badge
                  </label>
                  <select
                    value={notificationType}
                    onChange={(e) => setNotificationType(e.target.value as any)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-heading)]"
                  >
                    <option value="SYSTEM">SYSTEM (Platform Update)</option>
                    <option value="ALERT">ALERT (Urgent / Compliance)</option>
                    <option value="TASK_UPDATE">TASK_UPDATE (Operations)</option>
                    <option value="PAYMENT">PAYMENT (Wallet / Billing)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                  Email Subject / Notification Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter broadcast subject line or notification header..."
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                  Message Body
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write your official Oversite message to the selected recipients..."
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3.5 text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">
                  Optional Action Link / Deep Link
                </label>
                <input
                  type="text"
                  value={actionLink}
                  onChange={(e) => setActionLink(e.target.value)}
                  placeholder="e.g. /agent/verification or /dashboard/tasks"
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs text-[var(--text-heading)]"
                />
              </div>

              <button
                type="submit"
                disabled={isSending || matchedCount === 0}
                className="w-full py-3 rounded-xl bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSending
                    ? "Disbursing..."
                    : `Disburse to ${matchedCount} Matched Recipient${matchedCount === 1 ? "" : "s"}`}
                </span>
              </button>
            </div>
          </form>

          {/* Right Column: Quick Templates & Live Audience Preview */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
                Quick Broadcast Templates
              </h3>
              <div className="space-y-2">
                {QUICK_TEMPLATES.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTargetGroup(tpl.targetGroup as any);
                      setKycStatus(tpl.kycStatus);
                      setNotificationType(tpl.notificationType as any);
                      setTitle(tpl.title);
                      setMessage(tpl.message);
                    }}
                    className="w-full p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--primary-light)] border border-[var(--border-color)] text-left transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-bold text-[var(--text-heading)]">
                      {tpl.label}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                      {tpl.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Live Audience Sample ({matchedCount})
                </h3>
              </div>

              {isLoadingPreview ? (
                <p className="text-xs text-[var(--text-muted)]">Calculating audience...</p>
              ) : sampleRecipients.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)]">
                  No accounts match the current filter combination.
                </p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {sampleRecipients.map((r: any) => (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--text-heading)] truncate">
                          {r.operativeCode ? `${r.operativeCode} · ` : ""}
                          {r.name}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] truncate">
                          {r.email}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)]">
                        {r.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: DISBURSEMENT AUDIT LOG */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[var(--primary)]" />
              Recent Outbound Emails ({recentEmails.length})
            </h3>
            {recentEmails.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">No outbound emails logged yet.</p>
            ) : (
              <div className="space-y-2.5">
                {recentEmails.map((em: any) => (
                  <div
                    key={em.id}
                    className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-heading)]">
                        {em.subject}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {em.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      To: {em.toAddress} · {formatTimeAgo(em.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[var(--primary)]" />
              Recent In-App Notifications ({recentNotifications.length})
            </h3>
            {recentNotifications.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                No in-app notifications logged yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentNotifications.map((nf: any) => (
                  <div
                    key={nf.id}
                    className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-heading)]">
                        {nf.title}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--primary)]">
                        {nf.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-body)] line-clamp-2">
                      {nf.body}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Recipient: {nf.recipientName || nf.recipientEmail || "User"} ·{" "}
                      {formatTimeAgo(nf.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

