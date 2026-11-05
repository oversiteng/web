"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Send, CheckCheck, Paperclip, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTimeAgo } from "@/lib/utils";

interface ChatThread {
  taskId: string;
  taskTitle: string;
  moduleType: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  taskId: string;
  senderId: string;
  senderRole?: string;
  message: string;
  mediaUrl?: string | null;
  moderationStatus?: string;
  isModerated?: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load threads
  useEffect(() => {
    async function loadThreads() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setCurrentUserId(payload.sub);
          } catch (e) {}
        }

        const res = await fetch("/api/v1/chat", { credentials: "include", headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setThreads(json.data);
        } else {
          setThreads([]);
        }
      } catch (err) {
        console.error("Failed to load chat threads:", err);
        setThreads([]);
      } finally {
        setIsLoadingThreads(false);
      }
    }

    loadThreads();
  }, []);

  // Load messages when activeThread changes
  useEffect(() => {
    if (!activeThread) return;
    const currentTaskId = activeThread.taskId;

    async function loadMessages() {
      setIsLoadingMessages(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/v1/chat/${currentTaskId}/messages`, {
          credentials: "include",
          headers,
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMessages(json.data);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    }

    loadMessages();
  }, [activeThread]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredThreads = threads.filter(
    (t) =>
      t.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeThread) return;

    const outgoing = inputText.trim();
    setInputText("");

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      taskId: activeThread.taskId,
      senderId: currentUserId || "me",
      message: outgoing,
      moderationStatus: "PENDING_REVIEW",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/chat/${activeThread.taskId}/messages`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ message: outgoing }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? json.data : m)));
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // ─── Active Chat Thread View ───
  if (activeThread) {
    return (
      <div className="relative w-full text-[var(--text-heading)] transition-colors duration-150 flex flex-col justify-between min-h-[calc(100dvh-180px)]">
        <div className="w-full flex-1 flex flex-col justify-between">
          <div>
            <PageHeader
              title={activeThread.taskTitle}
              subtitle="Hub-and-Spoke Moderated Operations Channel"
              showBack={true}
              onBack={() => setActiveThread(null)}
            />

            {/* Moderation banner */}
            <div className="mx-2 mb-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11.5px] text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>For security, direct exchanges of phone numbers and bank accounts are held for admin QA review.</span>
            </div>

            {/* Messages Stream */}
            <div className="space-y-3.5 overflow-y-auto pb-4 pt-1 max-h-[calc(100dvh-310px)] px-1">
              {isLoadingMessages ? (
                <DynamicLoadingState variant="documents" count={3} />
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-[13px] text-[var(--text-muted)]">
                  No messages in this mission thread yet. Send a message to coordinate with the field operative.
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelf = currentUserId ? msg.senderId === currentUserId : false;
                  const timeFormatted = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed shadow-2xs ${
                          isSelf
                            ? "bg-[var(--primary)] text-white rounded-br-xs"
                            : "bg-[var(--bg-card)] border border-[var(--border-color)]/70 text-[var(--text-heading)] rounded-bl-xs"
                        }`}
                      >
                        {msg.message}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1 px-1 text-[10.5px] text-[var(--text-muted)]">
                        <span>{timeFormatted}</span>
                        {isSelf && (
                          <CheckCheck className="w-3.5 h-3.5 text-[var(--primary)] stroke-[2.5]" />
                        )}
                        {msg.moderationStatus === "PENDING_REVIEW" && (
                          <span className="text-[10px] text-amber-500 font-medium">· Reviewing</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Sticky Input Dock */}
          <form
            onSubmit={handleSendMessage}
            className="sticky bottom-0 bg-[var(--bg-body)] pt-2 pb-1 border-t border-[var(--border-color)]/60 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 py-3 px-4 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 text-[13.5px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              aria-label="Send message"
              className="w-11 h-11 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4 ml-0.5 stroke-[2.2]" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Conversations List View ───
  return (
    <div className="relative w-full text-[var(--text-heading)] pb-12 transition-colors duration-150">
      <PageHeader title="Messages" subtitle="Live Field Dispatch Threads" />

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] stroke-[2]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search mission threads..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/70 text-[13.5px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs"
        />
      </div>

      {/* Threads List */}
      <div className="space-y-2">
        {isLoadingThreads ? (
          <DynamicLoadingState variant="documents" count={4} />
        ) : filteredThreads.length === 0 ? (
          searchQuery ? (
            <EmptyState
              preset="search"
              query={searchQuery}
              action={{
                label: "Clear Search",
                onClick: () => setSearchQuery(""),
              }}
            />
          ) : (
            <EmptyState
              preset="chat"
              action={{
                label: "Request a New Task",
                href: "/dashboard",
              }}
            />
          )
        ) : (
          filteredThreads.map((thread) => (
            <div
              key={thread.taskId}
              onClick={() => setActiveThread(thread)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/70 hover:border-[var(--primary)]/40 hover:bg-[var(--bg-secondary)]/50 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0 pr-3">
                <div className="w-11 h-11 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-bold text-[13px] flex items-center justify-center shrink-0">
                  {thread.taskTitle.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors truncate">
                      {thread.taskTitle}
                    </p>
                  </div>
                  <p className="text-[12.5px] text-[var(--text-muted)] truncate mt-0.5">
                    {thread.lastMessage || "Mission thread opened"}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-[var(--text-muted)]/80 font-medium">
                  {formatTimeAgo(thread.lastMessageAt)}
                </span>
                {thread.unreadCount > 0 && (
                  <span className="mt-1 w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center ml-auto">
                    {thread.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
