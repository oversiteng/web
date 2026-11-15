"use client";

import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import {
  Headphones,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  HelpCircle,
  Plus,
  Trash2,
  RefreshCw,
  User as UserIcon,
  ShieldAlert,
} from "lucide-react";

interface SupportMessageItem {
  id: string;
  sender: "user" | "agent";
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

interface SupportTicketRecord {
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string | null;
  userRole: string;
  status: "OPEN" | "PENDING_USER" | "RESOLVED";
  priority: "NORMAL" | "HIGH" | "URGENT";
  category: string;
  updatedAt: string;
  messages: SupportMessageItem[];
}

interface SupportFaqItem {
  id: string;
  q: string;
  a: string;
  category?: string;
}

export default function AdminSupportHelpdeskPage() {
  const { user } = useAuth();
  const canWrite =
    user?.role === "SUPER_ADMIN" || user?.adminPolicy?.canWrite !== false;
  const canDelete =
    user?.role === "SUPER_ADMIN" || Boolean(user?.adminPolicy?.canDelete);

  const [activeTab, setActiveTab] = useState<"LIVE_CHAT" | "FAQS">("LIVE_CHAT");
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [faqs, setFaqs] = useState<SupportFaqItem[]>([]);
  const [summary, setSummary] = useState({
    totalTickets: 0,
    openTickets: 0,
    pendingUser: 0,
    resolvedTickets: 0,
  });
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // FAQ form state
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [savingFaqs, setSavingFaqs] = useState(false);

  const loadHelpdesk = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get(
        "/api/v1/support/tickets?mode=admin"
      );
      const data = res?.data || res;
      if (Array.isArray(data?.tickets)) {
        setTickets(data.tickets);
        if (!selectedUserId && data.tickets.length > 0) {
          setSelectedUserId(data.tickets[0].userId);
        }
      }
      if (Array.isArray(data?.faqs)) setFaqs(data.faqs);
      if (data?.summary) setSummary(data.summary);
    } catch {
      // Ignore error
    } finally {
      setLoading(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    loadHelpdesk();
    const interval = setInterval(loadHelpdesk, 10000);
    return () => clearInterval(interval);
  }, [loadHelpdesk]);

  const selectedTicket =
    tickets.find((t) => t.userId === selectedUserId) || null;

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === "ALL") return true;
    return t.status === statusFilter;
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim() || !canWrite || sending) return;

    setSending(true);
    try {
      await apiClient.post("/api/v1/support/tickets", {
        targetUserId: selectedTicket.userId,
        text: replyText.trim(),
        status: "PENDING_USER",
      });
      setReplyText("");
      await loadHelpdesk();
    } catch {
      // Ignore error
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (
    targetUserId: string,
    status: "OPEN" | "PENDING_USER" | "RESOLVED"
  ) => {
    if (!canWrite) return;
    try {
      await apiClient.patch("/api/v1/support/tickets", {
        targetUserId,
        status,
      });
      await loadHelpdesk();
    } catch {
      // Ignore
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQ.trim() || !newFaqA.trim() || !canWrite) return;
    const updated: SupportFaqItem[] = [
      ...faqs,
      {
        id: `faq-${Date.now()}`,
        q: newFaqQ.trim(),
        a: newFaqA.trim(),
      },
    ];
    setSavingFaqs(true);
    try {
      await apiClient.patch("/api/v1/support/tickets", { faqs: updated });
      setFaqs(updated);
      setNewFaqQ("");
      setNewFaqA("");
    } finally {
      setSavingFaqs(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!canDelete) return;
    const updated = faqs.filter((f) => f.id !== id);
    setSavingFaqs(true);
    try {
      await apiClient.patch("/api/v1/support/tickets", { faqs: updated });
      setFaqs(updated);
    } finally {
      setSavingFaqs(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Headphones className="w-3.5 h-3.5" />
            CRS / CCR / Live Support Helpdesk
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">
            Customer &amp; Operative Support Center
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Connected directly to User &amp; Agent{" "}
            <code className="font-mono text-[var(--primary)]">/more → /support → /support/chat</code>{" "}
            threads and FAQs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("LIVE_CHAT")}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "LIVE_CHAT"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)]"
            }`}
          >
            Live Support Threads ({summary.openTickets} Open)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("FAQS")}
            className={`px-4 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "FAQS"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)]"
            }`}
          >
            Manage Support FAQs ({faqs.length})
          </button>
          <button
            type="button"
            onClick={loadHelpdesk}
            className="p-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <p className="text-[11px] text-[var(--text-muted)]">Total Inquiries</p>
          <p className="text-xl font-bold text-[var(--text-heading)] mt-1">
            {summary.totalTickets}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-amber-500/30">
          <p className="text-[11px] text-amber-500 font-semibold">
            Open (Needs Reply)
          </p>
          <p className="text-xl font-bold text-amber-500 mt-1">
            {summary.openTickets}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <p className="text-[11px] text-[var(--text-muted)]">
            Awaiting User Response
          </p>
          <p className="text-xl font-bold text-blue-500 mt-1">
            {summary.pendingUser}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <p className="text-[11px] text-[var(--text-muted)]">Resolved</p>
          <p className="text-xl font-bold text-emerald-500 mt-1">
            {summary.resolvedTickets}
          </p>
        </div>
      </div>

      {activeTab === "LIVE_CHAT" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[540px]">
          {/* Left Column: Ticket Queue */}
          <div className="lg:col-span-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[var(--text-heading)]">
                Support Queue ({filteredTickets.length})
              </span>
              <div className="flex gap-1">
                {["ALL", "OPEN", "PENDING_USER", "RESOLVED"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                      statusFilter === st
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                    }`}
                  >
                    {st === "PENDING_USER" ? "REPLIED" : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                  No support tickets match this filter yet. When users or
                  operatives send a message in{" "}
                  <code className="font-mono">/support/chat</code>, it appears
                  here immediately.
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const lastMsg =
                    ticket.messages[ticket.messages.length - 1] || null;
                  const isSelected = ticket.userId === selectedUserId;
                  return (
                    <button
                      key={ticket.userId}
                      type="button"
                      onClick={() => setSelectedUserId(ticket.userId)}
                      className={`w-full text-left p-4 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[var(--primary)]/10"
                          : "hover:bg-[var(--bg-secondary)]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[var(--text-heading)]">
                            {ticket.userName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[9.5px] font-bold uppercase">
                            {ticket.userRole}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase ${
                            ticket.status === "OPEN"
                              ? "bg-amber-500/15 text-amber-500"
                              : ticket.status === "RESOLVED"
                              ? "bg-emerald-500/15 text-emerald-500"
                              : "bg-blue-500/15 text-blue-500"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">
                        {lastMsg ? lastMsg.text : "No messages"}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation */}
          <div className="lg:col-span-7 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col overflow-hidden">
            {selectedTicket ? (
              <>
                <div className="p-4 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-[var(--text-heading)]">
                        {selectedTicket.userName} ({selectedTicket.userRole})
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {selectedTicket.userEmail}
                      </p>
                    </div>
                  </div>

                  {canWrite && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(selectedTicket.userId, "OPEN")
                        }
                        className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-500 text-[10.5px] font-bold cursor-pointer"
                      >
                        Mark Open
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(selectedTicket.userId, "RESOLVED")
                        }
                        className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10.5px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Resolve Ticket
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px]">
                  {selectedTicket.messages.map((m) => {
                    const isCrs = m.sender === "agent";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          isCrs ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isCrs
                              ? "bg-[var(--primary)] text-white rounded-tr-xs"
                              : "bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] rounded-tl-xs"
                          }`}
                        >
                          <p className="text-[10px] font-bold opacity-80 mb-1">
                            {m.senderName}
                          </p>
                          <p>{m.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {canWrite ? (
                  <form
                    onSubmit={handleSendReply}
                    className="p-3.5 border-t border-[var(--border-color)] flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Reply as Oversite CRS Support..."
                      className="flex-1 px-4 py-2.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || sending}
                      className="px-4 py-2.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Reply
                    </button>
                  </form>
                ) : (
                  <div className="p-3 border-t border-[var(--border-color)] text-center text-[11px] text-amber-500 font-semibold">
                    Read-Only Mode: Write access is required to reply to tickets.
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--text-muted)]">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                Select a support conversation from the queue to view messages and
                respond.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* FAQS MANAGEMENT TAB */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4">
            <h2 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[var(--primary)]" />
              Published Support FAQs (Shown on /support)
            </h2>
            <div className="space-y-3">
              {faqs.map((f) => (
                <div
                  key={f.id}
                  className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[var(--text-heading)]">
                      {f.q}
                    </p>
                    <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed">
                      {f.a}
                    </p>
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteFaq(f.id)}
                      disabled={savingFaqs}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 cursor-pointer shrink-0"
                      title="Delete FAQ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4 h-fit">
            <h2 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
              <Plus className="w-4 h-4 text-[var(--primary)]" />
              Add New Support FAQ
            </h2>
            {canWrite ? (
              <form onSubmit={handleAddFaq} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-heading)] block mb-1">
                    Question
                  </label>
                  <input
                    type="text"
                    value={newFaqQ}
                    onChange={(e) => setNewFaqQ(e.target.value)}
                    placeholder="e.g. How fast are field operatives dispatched?"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-heading)] block mb-1">
                    Official Answer
                  </label>
                  <textarea
                    rows={4}
                    value={newFaqA}
                    onChange={(e) => setNewFaqA(e.target.value)}
                    placeholder="Provide clear guidance for clients and field operatives..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingFaqs}
                  className="w-full py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer"
                >
                  {savingFaqs ? "Publishing..." : "Publish FAQ to /support"}
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                Write access is required to create or modify Support FAQs.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
