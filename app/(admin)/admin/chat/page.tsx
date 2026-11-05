"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, MessageSquare, AlertTriangle, Check, X, Edit3 } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

interface PendingChat {
  id: string;
  taskId: string;
  taskTitle: string;
  moduleType: string;
  senderName: string;
  senderRole: string;
  receiverName: string;
  receiverRole: string;
  rawMessage: string | null;
  createdAt: string;
}

export default function AdminChatModerationPage() {
  const [pendingChats, setPendingChats] = useState<PendingChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadPendingChats() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/admin/chats/pending", { credentials: "include", headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPendingChats(json.data);
        } else {
          setPendingChats([]);
        }
      } catch (err) {
        console.error("Failed to load pending chats:", err);
        setPendingChats([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadPendingChats();
  }, []);

  const handleModerate = async (messageId: string, action: "APPROVE" | "REJECT") => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/chats/${messageId}/moderate`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ action }),
      });

      const json = await res.json();
      if (json.success) {
        setPendingChats((prev) => prev.filter((c) => c.id !== messageId));
        showToast(action === "APPROVE" ? "Message approved & delivered" : "Message rejected & blocked");
      } else {
        showToast(json.error?.message || "Failed to moderate message");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to moderate message");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-red-500" />
            Chat Moderation & Disintermediation Defense
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Hub-and-spoke moderation queue. Approve, sanitize, or reject messages to protect platform safety and payment integrity.
          </p>
        </div>
      </div>

      {isLoading ? (
        <DynamicLoadingState variant="documents" count={3} />
      ) : pendingChats.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
          No messages waiting in the moderation queue. All mission chats are clear.
        </div>
      ) : (
        <div className="space-y-4">
          {pendingChats.map((chat) => (
            <div
              key={chat.id}
              className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    PENDING QA REVIEW
                  </span>
                </div>
                <span className="text-xs text-slate-500">{formatTimeAgo(chat.createdAt)}</span>
              </div>

              <div>
                <p className="text-xs text-slate-300 font-medium">
                  {chat.senderName} ({chat.senderRole}) ➔ {chat.receiverName} ({chat.receiverRole}) · Task: {chat.taskTitle}
                </p>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 mt-2">
                  &ldquo;{chat.rawMessage}&rdquo;
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleModerate(chat.id, "REJECT")}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject & Block</span>
                </button>
                <button
                  onClick={() => handleModerate(chat.id, "APPROVE")}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve & Deliver</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
