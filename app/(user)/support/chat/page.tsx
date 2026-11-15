"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Paperclip, Send, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface ChatMessage {
  id: string;
  sender: "agent" | "user";
  senderName?: string;
  text: string;
  time: string;
}

export default function SupportChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "agent",
      senderName: "Oversite CRS Support",
      text: "Hello there! Welcome to Oversite Support. How can our Customer Relations & Support team assist you today?",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const formatTime = (iso?: string) => {
    if (!iso) {
      return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadTicketThread = useCallback(async () => {
    try {
      const res: any = await apiClient.get("/api/v1/support/tickets");
      const rawMessages = res?.data?.ticket?.messages || res?.ticket?.messages;
      if (Array.isArray(rawMessages) && rawMessages.length > 0) {
        setMessages(
          rawMessages.map((m: any) => ({
            id: m.id,
            sender: m.sender === "agent" ? "agent" : "user",
            senderName: m.senderName,
            text: m.text,
            time: formatTime(m.createdAt),
          }))
        );
      }
    } catch {
      // Keep local messages if offline
    }
  }, []);

  useEffect(() => {
    loadTicketThread();
    const interval = setInterval(loadTicketThread, 6000);
    return () => clearInterval(interval);
  }, [loadTicketThread]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || sending) return;

    const text = inputMessage.trim();
    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const optimisticMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text,
      time: currentTime,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInputMessage("");
    setSending(true);

    try {
      await apiClient.post("/api/v1/support/tickets", {
        text,
        category: "Live Support",
      });
      await loadTicketThread();
    } catch {
      // Fallback confirmation if offline
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] h-[calc(100vh-140px)] md:h-[calc(100vh-90px)] flex flex-col justify-between select-none">
      {/* ── Top Header ── */}
      <div className="flex items-center gap-3 py-3 border-b border-zinc-100 dark:border-zinc-800/80 mb-4 shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Support Avatar */}
        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
          <svg
            className="w-5 h-5 text-zinc-700 dark:text-zinc-200"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 14v-3a8 8 0 0 1 16 0v3" />
            <path d="M18 19c0 1.7-1.3 3-3 3h-1" />
            <rect x="2" y="12" width="4" height="6" rx="2" fill="currentColor" />
            <rect x="18" y="12" width="4" height="6" rx="2" fill="currentColor" />
          </svg>
        </div>

        <div>
          <h1 className="text-[15px] font-bold text-[var(--text-heading)] leading-snug">
            Oversite Support (CRS)
          </h1>
          <p className="text-[12px] text-[var(--text-muted)]">
            Live Customer Relations &amp; Support Helpdesk
          </p>
        </div>
      </div>

      {/* ── Message Thread Feed ── */}
      <div className="flex-1 overflow-y-auto space-y-4 px-1 pb-4 no-scrollbar">
        <div className="text-center my-4">
          <span className="text-[12px] font-medium text-zinc-400 dark:text-zinc-500">
            Today
          </span>
        </div>

        {messages.map((msg) => {
          const isAgent = msg.sender === "agent";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isAgent ? "items-start" : "items-end"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] p-4 leading-relaxed text-[14px] shadow-xs ${
                  isAgent
                    ? "rounded-[24px] rounded-tl-xs bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)]"
                    : "rounded-[24px] rounded-tr-xs bg-[var(--primary)] text-white"
                }`}
              >
                {isAgent && msg.senderName && (
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] mb-1">
                    {msg.senderName}
                  </span>
                )}
                <p>{msg.text}</p>
                <span
                  className={`block text-[10.5px] mt-1.5 ${
                    isAgent
                      ? "text-[var(--text-muted)]"
                      : "text-white/80 text-right"
                  }`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Bottom Input Bar ── */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)] shrink-0 bg-[var(--bg-body)]"
      >
        <div className="flex-1 flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full px-5 py-3 transition-colors">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Message Oversite CRS Support..."
            className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
          />
          <button
            type="button"
            aria-label="Attach file"
            className="text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors ml-2 cursor-pointer"
          >
            <Paperclip className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputMessage.trim() || sending}
          aria-label="Send message"
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs ${
            inputMessage.trim() && !sending
              ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-md active:scale-95"
              : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
          }`}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4 ml-0.5" />
          )}
        </button>
      </form>
    </div>
  );
}
