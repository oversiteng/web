"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Search, ChevronRight, Loader2, ShieldCheck } from "lucide-react";
import { formatChatPreview } from "@/components/chat/StructuredChatCard";

interface AgentTaskThread {
  id: string;
  title: string;
  moduleType: string;
  status: string;
  clientName?: string;
  locationAddress?: string | null;
  updatedAt: string;
  lastMessage?: string | null;
}

export default function AgentMessagesPage() {
  const [threads, setThreads] = useState<AgentTaskThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadThreads() {
      try {
        const res = await fetch("/api/v1/tasks?limit=50", { credentials: "include" });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setThreads(json.data);
        }
      } catch (err) {
        console.error("Failed to load agent message threads:", err);
      } finally {
        setLoading(false);
      }
    }
    loadThreads();
  }, []);

  const filtered = threads.filter((t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.clientName || "").toLowerCase().includes(q) ||
      (t.locationAddress || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-heading)] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[var(--primary)]" />
            <span>Messages</span>
          </h1>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks, clients, or locations..."
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[var(--text-muted)] gap-2 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading task conversations...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-10 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
          <p className="text-sm font-semibold text-[var(--text-heading)]">No task conversations yet</p>
          <p className="text-xs text-[var(--text-muted)]">
            Accept an assignment from the queue to start communicating with Oversite Command and the client.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((t) => (
            <Link
              key={t.id}
              href={`/agent/messages/${t.id}`}
              className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary)]/60 transition-colors"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--text-heading)] truncate">
                    {t.title}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                    {t.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>
                    {t.lastMessage
                      ? formatChatPreview(t.lastMessage)
                      : "Tap to open moderated task thread"}
                  </span>
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

