"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  StructuredChatCard,
  parseStructuredChatMessage,
  formatChatPreview,
} from "@/components/chat/StructuredChatCard";
import {
  Search,
  Send,
  Check,
  X,
  Pencil,
  ExternalLink,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { formatTimeAgo } from "@/lib/utils";

interface ThreadItem {
  taskId: string;
  taskTitle: string;
  moduleType: string;
  taskStatus: string;
  clientId: string;
  clientName: string;
  agentId: string | null;
  agentName: string | null;
  agentCode: string | null;
  pendingCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

interface ChatMessageItem {
  id: string;
  taskId: string;
  senderId: string;
  receiverId: string;
  message: string | null;
  rawMessage?: string | null;
  moderatedMessage?: string | null;
  fileUrl?: string | null;
  messageType: string;
  moderationStatus: "PENDING_REVIEW" | "APPROVED_AS_IS" | "REFINED_BY_ADMIN" | "REJECTED";
  rejectionReason?: string | null;
  createdAt: string;
}

function getAuthHeaders(json = false): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
  const headers: Record<string, string> = {};
  if (json) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export default function AdminInboxModerationPage() {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [filterTab, setFilterTab] = useState<"ALL" | "PENDING" | "ACTIVE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Moderation inline state
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [refiningId, setRefiningId] = useState<string | null>(null);
  const [refineText, setRefineText] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Composer state
  const [targetParty, setTargetParty] = useState<"CLIENT" | "AGENT">("CLIENT");
  const [composerText, setComposerText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadThreads = async () => {
    setIsLoadingThreads(true);
    try {
      const [tasksRes, pendingRes] = await Promise.all([
        fetch("/api/v1/tasks?limit=100", {
          credentials: "include",
          headers: getAuthHeaders(),
        }),
        fetch("/api/v1/admin/chats/pending", {
          credentials: "include",
          headers: getAuthHeaders(),
        }).catch(() => null),
      ]);

      const tasksJson = await tasksRes.json();
      const pendingJson = pendingRes ? await pendingRes.json().catch(() => null) : null;

      const pendingMap = new Map<string, { count: number; lastMsg?: string; lastAt?: string }>();
      if (pendingJson?.success && Array.isArray(pendingJson.data)) {
        for (const msg of pendingJson.data) {
          const cur = pendingMap.get(msg.taskId) || { count: 0 };
          cur.count += 1;
          if (!cur.lastAt || new Date(msg.createdAt) > new Date(cur.lastAt)) {
            cur.lastMsg = msg.rawMessage || msg.message || "Pending message";
            cur.lastAt = msg.createdAt;
          }
          pendingMap.set(msg.taskId, cur);
        }
      }

      if (tasksJson.success && Array.isArray(tasksJson.data)) {
        const mapped: ThreadItem[] = tasksJson.data.map((t: any) => {
          const p = pendingMap.get(t.id);
          return {
            taskId: t.id,
            taskTitle: t.title,
            moduleType: t.moduleType,
            taskStatus: t.status,
            clientId: t.userId,
            clientName: t.clientName || "Oversite Client",
            agentId: t.agentId || null,
            agentName: t.agentName || null,
            agentCode: t.agentCode || null,
            pendingCount: p?.count || 0,
            lastMessage: p?.lastMsg || null,
            lastMessageAt: p?.lastAt || t.updatedAt || t.createdAt,
          };
        });

        // Sort: threads with pending moderation first, then most recent
        mapped.sort((a, b) => {
          if (b.pendingCount !== a.pendingCount) return b.pendingCount - a.pendingCount;
          return (
            new Date(b.lastMessageAt || 0).getTime() -
            new Date(a.lastMessageAt || 0).getTime()
          );
        });

        setThreads(mapped);
        if (!selectedTaskId && mapped.length > 0) {
          setSelectedTaskId(mapped[0].taskId);
        }
      }
    } catch (err) {
      console.error("Failed to load inbox threads:", err);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const loadMessages = async (taskId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/v1/chat/${taskId}/messages`, {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMessages(json.data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (selectedTaskId) {
      loadMessages(selectedTaskId);
    }
  }, [selectedTaskId]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.taskId === selectedTaskId) || null,
    [threads, selectedTaskId]
  );

  const totalPending = useMemo(
    () => threads.reduce((sum, t) => sum + t.pendingCount, 0),
    [threads]
  );

  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      if (filterTab === "PENDING" && t.pendingCount === 0) return false;
      if (
        filterTab === "ACTIVE" &&
        (t.taskStatus === "COMPLETED" || t.taskStatus === "CANCELLED")
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          t.taskTitle.toLowerCase().includes(q) ||
          t.clientName.toLowerCase().includes(q) ||
          (t.agentName && t.agentName.toLowerCase().includes(q)) ||
          (t.agentCode && t.agentCode.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [threads, filterTab, searchQuery]);

  const handleModerate = async (
    messageId: string,
    action: "APPROVE" | "REFINE" | "REJECT",
    extra?: { refinedMessage?: string; rejectionReason?: string }
  ) => {
    setModeratingId(messageId);
    try {
      const res = await fetch(`/api/v1/admin/chats/${messageId}/moderate`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Moderation failed");

      setRefiningId(null);
      setRefineText("");
      setRejectingId(null);
      setRejectReason("");
      showToast(json.message || "Message moderated");
      if (selectedTaskId) {
        await loadMessages(selectedTaskId);
      }
      await loadThreads();
    } catch (err: any) {
      showToast(err.message || "Failed to moderate message");
    } finally {
      setModeratingId(null);
    }
  };

  const handleSendDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !composerText.trim()) return;
    const receiverId =
      targetParty === "AGENT" && selectedThread.agentId
        ? selectedThread.agentId
        : selectedThread.clientId;

    setIsSending(true);
    try {
      const res = await fetch(`/api/v1/chat/${selectedThread.taskId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          content: composerText.trim(),
          receiverId,
          messageType: "TEXT",
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Failed to send");
      setComposerText("");
      await loadMessages(selectedThread.taskId);
      showToast(`Sent to ${targetParty === "AGENT" ? "Operative" : "Client"}`);
    } catch (err: any) {
      showToast(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-[calc(100vh-64px)]">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[var(--bg-card)] border border-[var(--primary)] text-[var(--text-heading)] px-4 py-2 rounded-md shadow-lg text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Full-Bleed 2-Pane Inbox Workspace */}
      <div className="bg-[var(--bg-card)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 h-full w-full">
        {/* LEFT PANE: Thread List */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[var(--border-color)] flex flex-col h-full min-h-0 overflow-hidden">
          <div className="p-3.5 border-b border-[var(--border-color)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                <h2 className="text-sm font-bold text-[var(--text-heading)]">
                  Inbox &amp; Moderation
                </h2>
              </div>
              <button
                type="button"
                onClick={loadThreads}
                title="Refresh Inbox"
                className="w-7 h-7 rounded-md border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--primary)] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search task, client, operative..."
                className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="grid grid-cols-3 p-0.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[11px] font-semibold">
              {[
                { id: "ALL", label: "All" },
                { id: "PENDING", label: `Pending (${totalPending})` },
                { id: "ACTIVE", label: "Active" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterTab(t.id as any)}
                  className={`py-1.5 rounded cursor-pointer transition-colors ${
                    filterTab === t.id
                      ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-2xs"
                      : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]">
            {isLoadingThreads ? (
              <div className="p-4">
                <DynamicLoadingState variant="documents" count={4} />
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                No conversations match this filter.
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = thread.taskId === selectedTaskId;
                return (
                  <button
                    key={thread.taskId}
                    type="button"
                    onClick={() => setSelectedTaskId(thread.taskId)}
                    className={`w-full text-left p-3.5 transition-colors cursor-pointer space-y-1 ${
                      isSelected
                        ? "bg-[var(--primary)]/10 border-l-2 border-l-[var(--primary)]"
                        : "hover:bg-[var(--bg-secondary)]/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[var(--text-heading)] truncate">
                        {thread.taskTitle}
                      </p>
                      {thread.pendingCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold shrink-0">
                          {thread.pendingCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {thread.clientName} ↔ {thread.agentName || thread.agentCode || "Unassigned"}
                    </p>
                    <div className="flex items-center justify-between text-[10.5px] text-[var(--text-muted)] pt-0.5">
                      <span className="uppercase font-medium">
                        {thread.taskStatus.replace(/_/g, " ")}
                      </span>
                      {thread.lastMessageAt && (
                        <span>{formatTimeAgo(thread.lastMessageAt)}</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: Active Thread & Moderation Stream */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0 overflow-hidden">
          {!selectedThread ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-xs text-[var(--text-muted)] space-y-2">
              <MessageSquare className="w-7 h-7 opacity-40" />
              <p>Select a task thread on the left to review and moderate messages.</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="px-5 py-3.5 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[var(--text-heading)] truncate">
                      {selectedThread.taskTitle}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--bg-secondary)] text-[var(--text-muted)] shrink-0">
                      {selectedThread.moduleType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Client: <strong className="text-[var(--text-heading)]">{selectedThread.clientName}</strong> · Operative:{" "}
                    <strong className="text-[var(--text-heading)]">
                      {selectedThread.agentName || selectedThread.agentCode || "Unassigned"}
                    </strong>
                  </p>
                </div>

                <Link
                  href={`/admin/tasks/${selectedThread.taskId}`}
                  className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border border-[var(--border-color)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text-heading)] shrink-0"
                >
                  <span>Open Task</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[var(--bg-body)]/40">
                {isLoadingMessages ? (
                  <DynamicLoadingState variant="documents" count={3} />
                ) : messages.length === 0 ? (
                  <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                    No messages in this thread yet. Use the composer below to message the Client or Operative.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isClient = msg.senderId === selectedThread.clientId;
                    const isAgent =
                      Boolean(selectedThread.agentId) &&
                      msg.senderId === selectedThread.agentId;
                    const senderLabel = isClient
                      ? `Client (${selectedThread.clientName})`
                      : isAgent
                      ? `Operative (${selectedThread.agentName || selectedThread.agentCode})`
                      : "Oversite Admin";

                    const isPending = msg.moderationStatus === "PENDING_REVIEW";
                    const isRejected = msg.moderationStatus === "REJECTED";
                    const isRefined = msg.moderationStatus === "REFINED_BY_ADMIN";

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isClient
                            ? "items-start"
                            : isAgent
                            ? "items-end"
                            : "items-center"
                        }`}
                      >
                        {/* Compact Sender Label Outside Bubble */}
                        <div className="flex items-center gap-2 mb-1 px-1 text-[10.5px] text-[var(--text-muted)]">
                          <span className="font-semibold text-[var(--text-heading)]/80">
                            {senderLabel}
                          </span>
                          <span>·</span>
                          <span>{formatTimeAgo(msg.createdAt)}</span>
                          {isRefined && (
                            <span className="text-blue-500 font-semibold">Refined</span>
                          )}
                          {isRejected && (
                            <span className="text-red-500 font-semibold">Rejected</span>
                          )}
                          {isPending && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold text-[10px]">
                              Pending Review
                            </span>
                          )}
                        </div>

                        {/* Natural Fit-Content Chat Bubble */}
                        <div
                          className={`w-fit max-w-[70%] min-w-[140px] rounded-lg border px-3.5 py-2.5 space-y-2 text-xs ${
                            isPending
                              ? "bg-amber-500/[0.08] border-amber-500/40"
                              : isRejected
                              ? "bg-red-500/[0.06] border-red-500/30"
                              : isAgent
                              ? "bg-emerald-600/15 border-emerald-500/35"
                              : !isClient
                              ? "bg-[var(--primary)]/12 border-[var(--primary)]/35"
                              : "bg-[var(--bg-card)] border-[var(--border-color)]"
                          }`}
                        >
                          {(() => {
                            const rawBody = msg.message || msg.rawMessage;
                            const structured = parseStructuredChatMessage(rawBody);
                            if (structured) {
                              return (
                                <StructuredChatCard
                                  payload={structured}
                                  role="ADMIN"
                                  taskId={selectedThread?.taskId}
                                  fallbackTime={formatTimeAgo(msg.createdAt)}
                                />
                              );
                            }
                            return (
                              <p className="text-[var(--text-heading)] leading-relaxed whitespace-pre-wrap">
                                {rawBody}
                              </p>
                            );
                          })()}

                          {msg.rejectionReason && (
                            <p className="text-[11px] text-red-500">
                              Reason: {msg.rejectionReason}
                            </p>
                          )}

                        {/* Inline Moderation Controls for Pending Messages */}
                        {isPending && (
                          <div className="pt-2 border-t border-amber-500/25 space-y-2.5">
                            {refiningId === msg.id ? (
                              <div className="space-y-2">
                                <textarea
                                  rows={2}
                                  value={refineText}
                                  onChange={(e) => setRefineText(e.target.value)}
                                  className="w-full p-2.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={moderatingId === msg.id}
                                    onClick={() =>
                                      handleModerate(msg.id, "REFINE", {
                                        refinedMessage: refineText,
                                      })
                                    }
                                    className="px-3 h-7 rounded-md bg-[var(--primary)] text-white text-[11px] font-semibold cursor-pointer"
                                  >
                                    Save &amp; Deliver
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRefiningId(null)}
                                    className="px-2.5 h-7 rounded-md border border-[var(--border-color)] text-[11px] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : rejectingId === msg.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder="Reason for rejection (sent to sender)..."
                                  className="w-full h-8 px-2.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={moderatingId === msg.id}
                                    onClick={() =>
                                      handleModerate(msg.id, "REJECT", {
                                        rejectionReason: rejectReason,
                                      })
                                    }
                                    className="px-3 h-7 rounded-md bg-red-600 text-white text-[11px] font-semibold cursor-pointer"
                                  >
                                    Confirm Reject
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRejectingId(null)}
                                    className="px-2.5 h-7 rounded-md border border-[var(--border-color)] text-[11px] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  disabled={moderatingId === msg.id}
                                  onClick={() => handleModerate(msg.id, "APPROVE")}
                                  className="inline-flex items-center gap-1 px-3 h-7 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve &amp; Deliver</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRefiningId(msg.id);
                                    setRefineText(msg.rawMessage || msg.message || "");
                                  }}
                                  className="inline-flex items-center gap-1 px-3 h-7 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-heading)] text-[11px] font-semibold cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Refine</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectingId(msg.id)}
                                  className="inline-flex items-center gap-1 px-3 h-7 rounded-md border border-red-500/30 text-red-500 hover:bg-red-500/10 text-[11px] font-semibold cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Clean Direct Message Composer */}
              <form
                onSubmit={handleSendDirect}
                className="p-3.5 border-t border-[var(--border-color)] bg-[var(--bg-card)] space-y-2.5"
              >
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-[var(--text-muted)] font-medium">Direct Message To:</span>
                  <button
                    type="button"
                    onClick={() => setTargetParty("CLIENT")}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                      targetParty === "CLIENT"
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--bg-secondary)] text-[var(--text-heading)]"
                    }`}
                  >
                    Client ({selectedThread.clientName})
                  </button>
                  <button
                    type="button"
                    disabled={!selectedThread.agentId}
                    onClick={() => setTargetParty("AGENT")}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      targetParty === "AGENT"
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--bg-secondary)] text-[var(--text-heading)]"
                    }`}
                  >
                    Operative ({selectedThread.agentName || selectedThread.agentCode || "Unassigned"})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder={`Write to ${
                      targetParty === "AGENT" ? "Operative" : selectedThread.clientName
                    } as Oversite Admin...`}
                    className="flex-1 h-9 px-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !composerText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
