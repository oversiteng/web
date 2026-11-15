"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  Check,
  X,
  Edit3,
  FileCheck2,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";
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
  fileUrl?: string | null;
  messageType?: string;
  createdAt: string;
}

function tryParseMilestoneCard(raw: string | null): Record<string, any> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.cardType) {
      return parsed;
    }
  } catch {
    // Plain text or [MILESTONE_SUBMISSION] summary
  }
  return null;
}

export default function AdminChatModerationPage() {
  const [pendingChats, setPendingChats] = useState<PendingChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [refinedText, setRefinedText] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionWarning, setRejectionWarning] = useState("");
  const [generatePdfMap, setGeneratePdfMap] = useState<Record<string, boolean>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadPendingChats() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/admin/chats/pending", {
          credentials: "include",
          headers,
        });
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

  const handleModerate = async (
    messageId: string,
    action: "APPROVE" | "REFINE" | "REJECT",
    payload?: { refinedMessage?: string; rejectionReason?: string; generatePdf?: boolean }
  ) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/chats/${messageId}/moderate`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          action,
          refinedMessage: payload?.refinedMessage,
          rejectionReason: payload?.rejectionReason,
          generatePdf: Boolean(payload?.generatePdf),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setPendingChats((prev) => prev.filter((c) => c.id !== messageId));
        setEditingId(null);
        setRejectingId(null);
        showToast(json.message || "Moderation completed");
      } else {
        showToast(json.error?.message || "Failed to moderate message");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to moderate message");
    }
  };

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
            <ShieldCheck className="w-6 h-6 text-[var(--primary)]" />
            Hub-and-Spoke Communications & Milestone Firewall
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Clients chat with Oversite Operations; Operatives report to Oversite Command. Curate, refine, or approve all messages and milestone submissions before delivery.
          </p>
        </div>
      </div>

      {isLoading ? (
        <DynamicLoadingState variant="documents" count={3} />
      ) : pendingChats.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--text-muted)] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          No messages or milestone updates waiting in the moderation queue. All mission threads are clear.
        </div>
      ) : (
        <div className="space-y-4">
          {pendingChats.map((chat) => {
            const isEditing = editingId === chat.id;
            const isRejecting = rejectingId === chat.id;
            const isMilestoneCard =
              chat.messageType === "MILESTONE_UPDATE" ||
              (chat.rawMessage && chat.rawMessage.startsWith("["));
            const parsedCard = tryParseMilestoneCard(chat.rawMessage);

            return (
              <div
                key={chat.id}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3.5 shadow-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                      {isMilestoneCard
                        ? "INTERCEPTED MILESTONE / FIELD UPDATE"
                        : "INTERCEPTED MESSAGE · PENDING OVERSITE REVIEW"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <Link
                      href={`/admin/tasks/${chat.taskId}`}
                      className="text-[var(--primary)] font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Inspect Mission</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <span>{formatTimeAgo(chat.createdAt)}</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-[var(--text-muted)] font-medium">
                    <span className="text-[var(--text-heading)] font-bold">
                      {chat.senderName}
                    </span>{" "}
                    ({chat.senderRole}) ➔{" "}
                    <span className="text-[var(--text-heading)] font-bold">
                      {chat.receiverName}
                    </span>{" "}
                    ({chat.receiverRole}) · Mission:{" "}
                    <span className="text-[var(--primary)] font-semibold">
                      {chat.taskTitle}
                    </span>
                  </p>

                  <div className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] mt-2 space-y-2">
                    {parsedCard ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary)] font-mono text-[10px] font-bold">
                            {parsedCard.cardType}
                          </span>
                          <span className="font-bold">{parsedCard.milestoneTitle}</span>
                        </div>
                        <p>{parsedCard.stageDetails}</p>
                      </div>
                    ) : (
                      <p>&ldquo;{chat.rawMessage}&rdquo;</p>
                    )}

                    {chat.fileUrl && (
                      <div className="pt-1">
                        <a
                          href={chat.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] font-semibold text-[var(--primary)]"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View Attached Field Media</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional PDF Report Generation Checkbox for Milestone / Field Report Submissions */}
                {isMilestoneCard && (
                  <label className="flex items-center gap-2 text-xs text-[var(--text-heading)] font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(generatePdfMap[chat.id])}
                      onChange={(e) =>
                        setGeneratePdfMap((prev) => ({
                          ...prev,
                          [chat.id]: e.target.checked,
                        }))
                      }
                      className="rounded border-[var(--border-color)]"
                    />
                    <FileCheck2 className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>
                      Also compile & publish official PDF verification report to End User upon approval
                    </span>
                  </label>
                )}

                {/* Inline Modify / Refine Editor */}
                {isEditing && (
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--primary-border)] space-y-2.5">
                    <label className="block text-[11px] font-bold text-[var(--primary)] uppercase tracking-wider">
                      Refine Message in Official Oversite Voice Before Delivering to {chat.receiverName}
                    </label>
                    <textarea
                      rows={2}
                      value={refinedText}
                      onChange={(e) => setRefinedText(e.target.value)}
                      className="w-full rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-2.5 text-xs text-[var(--text-heading)] focus:border-[var(--primary)] focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!refinedText.trim()}
                        onClick={() =>
                          handleModerate(chat.id, "REFINE", {
                            refinedMessage: refinedText.trim(),
                            generatePdf: generatePdfMap[chat.id],
                          })
                        }
                        className="px-3.5 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        Save & Deliver as Oversite
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Flag & Reject with Warning Input */}
                {isRejecting && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/30 space-y-2.5">
                    <label className="block text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      Warning Message to Send to {chat.senderName} ({chat.senderRole})
                    </label>
                    <input
                      type="text"
                      value={rejectionWarning}
                      onChange={(e) => setRejectionWarning(e.target.value)}
                      placeholder="e.g. Sharing personal phone numbers or off-platform details is prohibited."
                      className="w-full rounded-xl bg-[var(--bg-card)] border border-red-500/30 p-2.5 text-xs text-[var(--text-heading)] focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleModerate(chat.id, "REJECT", {
                            rejectionReason:
                              rejectionWarning.trim() ||
                              "Flagged by Oversite Admin: Sharing personal contact or off-platform details violates policy.",
                          })
                        }
                        className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Confirm Reject & Send Warning
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)] flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setRejectingId(chat.id);
                      setRejectionWarning(
                        "Sharing personal contact details or off-platform negotiation violates Oversite policy."
                      );
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject with Warning</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(null);
                      setEditingId(chat.id);
                      setRefinedText(chat.rawMessage || "");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--primary-light)] text-[var(--text-heading)] border border-[var(--border-color)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>Modify & Approve</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleModerate(chat.id, "APPROVE", {
                        generatePdf: generatePdfMap[chat.id],
                      })
                    }
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Deliver</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
