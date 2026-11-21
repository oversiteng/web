"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, ShieldCheck, ClipboardList } from "lucide-react";
import {
  StructuredChatCard,
  parseStructuredChatMessage,
} from "@/components/chat/StructuredChatCard";

interface ChatMsg {
  id: string;
  senderId: string;
  senderRole?: string;
  senderName?: string;
  message: string;
  rawMessage?: string;
  moderationStatus?: string;
  createdAt: string;
}

export default function AgentTaskChatPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = String(params?.taskId || "");

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [taskTitle, setTaskTitle] = useState("Task Chat");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/v1/chat/${taskId}/messages`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMessages(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch chat messages:", err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [meRes, taskRes] = await Promise.all([
          fetch("/api/v1/auth/me", { credentials: "include" }),
          fetch(`/api/v1/tasks/${taskId}`, { credentials: "include" }),
        ]);
        const meJson = await meRes.json();
        if (meJson.success && meJson.data?.id) {
          setCurrentUserId(meJson.data.id);
        }
        const taskJson = await taskRes.json();
        if (taskJson.success && taskJson.data?.title) {
          setTaskTitle(taskJson.data.title);
        }
        await fetchMessages();
      } finally {
        setLoading(false);
      }
    }
    if (taskId) init();
  }, [taskId]);

  useEffect(() => {
    if (!taskId) return;
    const es = new EventSource(`/api/v1/chat/${taskId}/stream`);
    const onUpdate = () => {
      fetchMessages();
    };
    es.addEventListener("message", onUpdate);
    es.addEventListener("message_moderated", onUpdate);
    return () => {
      es.close();
    };
  }, [taskId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/v1/chat/${taskId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: text.trim() }),
      });
      if (res.ok) {
        setText("");
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] sm:h-[calc(100dvh-4.5rem)] overflow-hidden max-w-3xl mx-auto bg-[var(--bg-main)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-card)] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--bg-secondary)] text-[var(--text-heading)] cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[var(--text-heading)] truncate">
              {taskTitle}
            </h1>
          </div>
        </div>

        <Link
          href={`/agent/tasks/${taskId}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] shrink-0"
        >
          <ClipboardList className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span>Task</span>
        </Link>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full text-xs text-[var(--text-muted)] gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-xs text-[var(--text-muted)] space-y-1">
            <p className="font-semibold text-[var(--text-heading)]">No messages yet</p>
            <p>Send a message below. All messages are reviewed by Oversite Command before delivery.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            const rawBody = msg.message || msg.rawMessage || "";
            const structured = parseStructuredChatMessage(rawBody);
            const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            });

            if (structured) {
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"} py-1`}
                >
                  <StructuredChatCard
                    payload={structured}
                    role="AGENT"
                    taskId={taskId}
                    fallbackTime={timeStr}
                  />
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`w-fit max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMine
                      ? "bg-[#22C55E] text-black font-medium rounded-br-sm"
                      : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{rawBody}</p>
                  <div
                    className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                      isMine ? "text-black/70" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {msg.moderationStatus === "PENDING_REVIEW" && (
                      <span className="font-semibold">Pending Admin Review ·</span>
                    )}
                    <span>{timeStr}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-card)] flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 h-11 px-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-11 h-11 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white flex items-center justify-center cursor-pointer disabled:opacity-50 shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}

