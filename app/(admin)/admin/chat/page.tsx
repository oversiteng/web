"use client";

import { ShieldCheck, MessageSquare, AlertTriangle, UserX, Eye } from "lucide-react";

export default function AdminChatModerationPage() {
  const flaggedChats = [
    {
      id: "chat-mod-1",
      taskId: "task-02",
      participants: "Client Chukwuma Obi & Agent Babajide S.",
      snippet: "...can you just send your personal account number directly instead of paying through the app...",
      flagReason: "OFF-PLATFORM PAYMENT ATTEMPT",
      flaggedAt: "15 mins ago",
      severity: "CRITICAL",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-red-500" />
            Chat Moderation & Disintermediation Defense
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated keyword filters detect off-platform contact exchanges, personal bank account numbers, and policy violations.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {flaggedChats.map((chat) => (
          <div
            key={chat.id}
            className="p-5 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-red-400 font-mono">{chat.flagReason}</span>
              </div>
              <span className="text-xs text-slate-500">{chat.flaggedAt}</span>
            </div>

            <div>
              <p className="text-xs text-slate-300 font-medium">Thread: {chat.participants}</p>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 italic mt-2">
                &ldquo;{chat.snippet}&rdquo;
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => alert(`Issuing warning to participants in ${chat.id}`)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Issue Policy Warning
              </button>
              <button
                onClick={() => alert(`Suspending agent for off-platform payment solicitation`)}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-bold text-white"
              >
                Suspend Agent Account
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
