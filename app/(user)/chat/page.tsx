"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatTimeAgo } from "@/lib/utils";

interface ChatThread {
  taskId: string;
  taskTitle: string;
  taskStatus: string;
  moduleType: string;
  agentId: string | null;
  agentName: string;
  agentBadge: string;
  lastMessage: string;
  lastMessageStatus?: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadThreads() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

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

  const filteredThreads = threads.filter(
    (t) =>
      t.taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="relative w-full text-[var(--text-heading)] pb-12 transition-colors duration-150">
      <PageHeader
        title="Messages"
        subtitle="Admin-Moderated Field Agent Channels"
      />

      {/* Hub-and-Spoke Moderation Info Banner */}
      <div className="mb-4 p-3 rounded-2xl bg-[var(--primary-light)]/60 border border-[var(--primary-border)] flex items-start gap-2.5 text-[12px] text-[var(--text-heading)]">
        <ShieldCheck className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
        <span>
          Mission channels open once an accredited field agent accepts your task. All messages are routed through Oversite Admin for quality and safety review.
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] stroke-[2]" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by agent name or task..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/70 text-[13.5px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs"
        />
      </div>

      {/* Threads List */}
      <div className="space-y-2.5">
        {isLoadingThreads ? (
          <DynamicLoadingState variant="documents" count={3} />
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
              title="No active agent conversations yet"
              description="Conversations are created automatically once an accredited field agent accepts one of your submitted tasks."
              action={{
                label: "View My Tasks",
                href: "/dashboard/tasks",
              }}
            />
          )
        ) : (
          filteredThreads.map((thread) => (
            <div
              key={thread.taskId}
              onClick={() =>
                router.push(`/dashboard/tasks/${thread.taskId}/chat?from=chat`)
              }
              className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/70 hover:border-[var(--primary)]/40 hover:bg-[var(--bg-secondary)]/50 transition-all cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-3.5 min-w-0 pr-3">
                <div className="w-11 h-11 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-bold text-[13px] flex items-center justify-center shrink-0">
                  {getInitials(thread.agentName)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14.5px] font-bold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors truncate">
                      {thread.agentName}
                    </p>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                      #{thread.agentBadge} · {thread.taskTitle}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[var(--text-muted)] truncate mt-1">
                    {thread.lastMessage}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-[11px] text-[var(--text-muted)]/80 font-medium block">
                    {formatTimeAgo(thread.lastMessageAt)}
                  </span>
                  {thread.unreadCount > 0 && (
                    <span className="mt-1 w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center ml-auto">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
