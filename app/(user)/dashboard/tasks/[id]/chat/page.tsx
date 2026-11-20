"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  CheckCheck,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from "lucide-react";

interface MilestoneData {
  cardType?: "FIELD_REPORT" | "MILESTONE_SUBMISSION" | "FINAL_SUBMISSION";
  milestoneId?: string;
  milestoneTitle: string;
  stageDetails?: string;
  status: string;
  mediaUrls?: string[];
  pdfGenerated?: boolean;
  targetLink?: string;
  timestamp?: string;
}

interface MessageItem {
  id: string;
  senderId: string;
  receiverId?: string;
  message?: string | null;
  rawMessage?: string | null;
  moderatedMessage?: string | null;
  moderationStatus?:
    | "PENDING_REVIEW"
    | "APPROVED_AS_IS"
    | "REFINED_BY_ADMIN"
    | "REJECTED";
  rejectionReason?: string | null;
  messageType: "TEXT" | "MILESTONE_UPDATE" | "ATTACHMENT" | "SYSTEM";
  createdAt: string;
  parsedMilestone?: MilestoneData | null;
}

export default function TaskMissionChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromChat = searchParams.get("from") === "chat";
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;

  const [task, setTask] = useState<any | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initData() {
      setIsLoading(true);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            setCurrentUserId(payload.sub);
          } catch {}
        }

        const [taskRes, chatRes] = await Promise.all([
          fetch(`/api/v1/tasks/${taskId}`, { credentials: "include", headers }),
          fetch(`/api/v1/chat/${taskId}/messages`, {
            credentials: "include",
            headers,
          }),
        ]);

        const taskJson = await taskRes.json();
        if (taskJson.success && taskJson.data) {
          setTask(taskJson.data);
        }

        const chatJson = await chatRes.json();
        if (chatJson.success && Array.isArray(chatJson.data)) {
          const parsed = chatJson.data.map((m: any) => {
            let milestoneObj: MilestoneData | null = null;
            if (m.messageType === "MILESTONE_UPDATE" && m.message) {
              try {
                milestoneObj = JSON.parse(m.message);
              } catch {
                milestoneObj = {
                  cardType: "MILESTONE_SUBMISSION",
                  milestoneTitle: m.message,
                  stageDetails:
                    "Milestone status verified by assigned field agent",
                  status: "Completed",
                };
              }
            }
            return {
              id: m.id,
              senderId: m.senderId,
              receiverId: m.receiverId,
              message: m.message,
              rawMessage: m.rawMessage,
              moderatedMessage: m.moderatedMessage,
              moderationStatus: m.moderationStatus || "APPROVED_AS_IS",
              rejectionReason: m.rejectionReason,
              messageType: m.messageType || "TEXT",
              createdAt: m.createdAt,
              parsedMilestone: milestoneObj,
            };
          });
          setMessages(parsed);
        }
      } catch (err) {
        console.error("Failed to load task chat data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    initData();
  }, [taskId]);

  // Real-time SSE streaming connection (< 100ms message delivery)
  useEffect(() => {
    if (!taskId) return;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("oversite_token")
        : null;

    const streamUrl = `/api/v1/chat/${taskId}/stream${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener("message", (e) => {
        try {
          const newChat = JSON.parse(e.data);
          setMessages((prev) => {
            // Deduplicate if already present
            if (prev.some((m) => m.id === newChat.id)) {
              return prev.map((m) =>
                m.id === newChat.id
                  ? {
                      ...m,
                      message: newChat.message,
                      moderationStatus: newChat.moderationStatus || m.moderationStatus,
                    }
                  : m
              );
            }

            let milestoneObj: MilestoneData | null = null;
            if (newChat.messageType === "MILESTONE_UPDATE" && newChat.message) {
              try {
                milestoneObj = JSON.parse(newChat.message);
              } catch {
                milestoneObj = {
                  cardType: "MILESTONE_SUBMISSION",
                  milestoneTitle: newChat.message,
                  stageDetails: "Milestone status verified by assigned field agent",
                  status: "Completed",
                };
              }
            }

            return [
              ...prev,
              {
                id: newChat.id,
                senderId: newChat.senderId,
                receiverId: newChat.receiverId,
                message: newChat.message,
                rawMessage: newChat.rawMessage,
                moderatedMessage: newChat.moderatedMessage,
                moderationStatus: newChat.moderationStatus || "APPROVED_AS_IS",
                rejectionReason: newChat.rejectionReason,
                messageType: newChat.messageType || "TEXT",
                createdAt: newChat.createdAt,
                parsedMilestone: milestoneObj,
              },
            ];
          });
        } catch (err) {
          console.error("Failed to parse realtime message:", err);
        }
      });

      eventSource.addEventListener("message_moderated", (e) => {
        try {
          const updatedChat = JSON.parse(e.data);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updatedChat.id
                ? {
                    ...m,
                    message: updatedChat.message,
                    moderatedMessage: updatedChat.moderatedMessage,
                    moderationStatus: updatedChat.moderationStatus,
                    rejectionReason: updatedChat.rejectionReason,
                  }
                : m
            )
          );
        } catch (err) {
          console.error("Failed to parse moderation event:", err);
        }
      });

      eventSource.onerror = () => {
        // EventSource automatically retries connection
      };
    } catch (err) {
      console.warn("SSE Realtime stream could not be established:", err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [taskId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isPropertyOversite =
    task?.moduleType === "PROPERTY_OVERSITE" ||
    Boolean(task?.formData?.isPropertyIntelTask);
  const hasAssignedAgent = Boolean(task?.agentId);
  const canChat = hasAssignedAgent || isPropertyOversite;

  async function handleSendMessage() {
    if (!inputText.trim() || isSending || !canChat) return;
    const textToSend = inputText.trim();
    setInputText("");
    setSendError(null);
    setIsSending(true);

    const optimisticId = `opt-${Date.now()}`;
    const newMsg: MessageItem = {
      id: optimisticId,
      senderId: currentUserId || "me",
      message: textToSend,
      moderationStatus: "PENDING_REVIEW",
      messageType: "TEXT",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/chat/${taskId}/messages`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          message: textToSend,
          messageType: "TEXT",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setSendError(json.error?.message || "Failed to send message.");
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      } else if (json.data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId
              ? {
                  ...m,
                  id: json.data.id,
                  moderationStatus:
                    json.data.moderationStatus || "PENDING_REVIEW",
                }
              : m
          )
        );
      }
    } catch {
      setSendError("Network error while routing message to Admin.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  }

  const agentName = isPropertyOversite
    ? "Oversite"
    : hasAssignedAgent
      ? task?.agent?.name || task?.agentName || "Assigned Field Agent"
      : "Awaiting Agent Assignment";
  const agentBadge = isPropertyOversite
    ? "PROPERTY-DESK"
    : hasAssignedAgent
      ? task?.agent?.badge ||
        `OS-${String(task.agentId).slice(0, 4).toUpperCase()}`
      : null;
  const taskTitle = task?.title || "Task Task";

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="max-w-xl mx-auto min-h-[100dvh] flex flex-col justify-between bg-[var(--bg-body)] animate-in fade-in duration-150">
      {/* ── Top Header (Exact Match to Screenshot 1) ── */}
      <div className="sticky top-0 z-30 bg-[var(--bg-body)]/95 backdrop-blur-md border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() =>
            router.push(
              fromChat
                ? "/chat"
                : isPropertyOversite && task?.propertyId
                  ? `/properties/${task.propertyId}`
                  : `/dashboard/tasks/${taskId}`
            )
          }
          className="p-2 -ml-2 rounded-xl text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Agent / Oversite Avatar */}
        <div
          className={`w-10 h-10 rounded-full font-bold text-[14px] flex items-center justify-center shrink-0 shadow-xs ${
            isPropertyOversite
              ? "bg-[var(--primary)] text-white"
              : "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
          }`}
        >
          {isPropertyOversite
            ? "OS"
            : hasAssignedAgent
              ? getInitials(agentName)
              : "—"}
        </div>

        {/* Agent / Oversite Identity */}
        <div className="min-w-0 flex-1">
          <h2 className="text-[15.5px] font-bold text-[var(--text-heading)] leading-tight truncate">
            {agentName}
          </h2>
          <p className="text-[12px] text-[var(--text-muted)] truncate">
            {isPropertyOversite
              ? `Oversite Property Intelligence · ${taskTitle.replace(/^Property Oversight:\s*/i, "")}`
              : agentBadge
                ? `Field Agent #${agentBadge} · ${taskTitle}`
                : taskTitle}
          </p>
        </div>

        <Link
          href={
            isPropertyOversite && task?.propertyId
              ? `/properties/${task.propertyId}`
              : `/dashboard/tasks/${taskId}`
          }
          title={isPropertyOversite ? "View Property Overview" : "View Task Dossier"}
          className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Hub-and-Spoke Admin Moderation Banner ── */}
      <div className="px-4 pt-3">
        <div className="p-3 rounded-2xl bg-[var(--primary-light)]/60 border border-[var(--primary-border)] flex items-start gap-2.5 text-[11.5px] text-[var(--text-heading)]">
          <ShieldCheck className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
          <span>
            <strong>Admin-Moderated Channel:</strong> Messages, reports, and
            milestone submissions are reviewed and approved by Oversite Admin
            before delivery.
          </span>
        </div>
      </div>

      {/* ── Chat Messages Timeline ── */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
        {isLoading ? (
          <div className="py-16 flex justify-center">
            <div className="w-7 h-7 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !canChat ? (
          <div className="py-16 text-center space-y-3 px-4">
            <div className="w-12 h-12 rounded-full bg-[var(--warning-light)] text-[var(--warning)] flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-[15px] font-bold text-[var(--text-heading)]">
              Conversation Not Yet Created
            </h3>
            <p className="text-[12.5px] text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
              This conversation will open automatically as soon as an accredited
              field agent accepts your task.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-16 text-center space-y-2 px-4">
            <p className="text-[14px] font-semibold text-[var(--text-heading)]">
              {isPropertyOversite
                ? "Chatting with Oversite Property Intelligence"
                : `${agentName} has accepted this task`}
            </p>
            <p className="text-[12.5px] text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
              {isPropertyOversite
                ? "Request an on-demand update on site summary, word on the street, expert review, state policy, or vicinity landmarks."
                : "Send a message below. Your message will be reviewed by Oversite Admin and forwarded to the agent."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-center my-2">
              <span className="px-3.5 py-1 rounded-full text-[11.5px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shadow-xs">
                Today
              </span>
            </div>

            {messages.map((m) => {
              const isUser = m.senderId === currentUserId;

              // ── Case A: Interactive Milestone / Report / Final Submission Reference Card ──
              if (m.messageType === "MILESTONE_UPDATE" && m.parsedMilestone) {
                const ms = m.parsedMilestone;
                const isFieldReport = ms.cardType === "FIELD_REPORT";
                const isFinalSubmission = ms.cardType === "FINAL_SUBMISSION";
                const headerBadgeLabel = isFieldReport
                  ? "AGENT FIELD REPORT"
                  : isFinalSubmission
                    ? "FINAL INSPECTION SUBMISSION"
                    : "MILESTONE EVENT UPDATE";

                const deepLink =
                  ms.targetLink ||
                  (ms.milestoneId
                    ? `/dashboard/tasks/${taskId}#milestone-${ms.milestoneId}`
                    : isFinalSubmission
                      ? `/dashboard/tasks/${taskId}#report`
                      : `/dashboard/tasks/${taskId}#milestones`);

                const ctaLabel = isFinalSubmission
                  ? "View Task & Report"
                  : "View Milestone Details";

                return (
                  <div
                    key={m.id}
                    className="my-3 rounded-[20px] border border-[#22c55e]/45 bg-[#f4faf6] dark:bg-[#111913] p-4.5 shadow-xs space-y-2.5 animate-in zoom-in-95 duration-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-[var(--primary)] font-bold text-[11px] tracking-wider uppercase">
                        <div className="flex flex-col gap-0.5 justify-center">
                          <span className="w-3.5 h-[2px] bg-[var(--primary)] rounded-full" />
                          <span className="w-2.5 h-[2px] bg-[var(--primary)] rounded-full" />
                          <span className="w-3 h-[2px] bg-[var(--primary)] rounded-full" />
                        </div>
                        <span>{headerBadgeLabel}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--primary)]/15 text-[11px] font-semibold text-[var(--primary)]">
                        {ms.status ||
                          (isFieldReport ? "Report Message" : "Completed")}
                      </span>
                    </div>

                    <h3 className="text-[15px] font-bold text-[var(--text-heading)] leading-snug">
                      {ms.milestoneTitle}
                    </h3>

                    {ms.stageDetails && (
                      <p className="text-[12.5px] text-[var(--text-muted)] leading-relaxed">
                        {ms.stageDetails}
                      </p>
                    )}

                    {/* Optional Media Thumbnails Inside the Reference Card */}
                    {Array.isArray(ms.mediaUrls) && ms.mediaUrls.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                        {ms.mediaUrls.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => router.push(deepLink)}
                            className="w-16 h-12 rounded-lg overflow-hidden border border-[#a3e0b5] shrink-0 cursor-pointer"
                          >
                            <img
                              src={url}
                              alt="Milestone attachment"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {ms.pdfGenerated && (
                      <div className="pt-1">
                        <Link
                          href={`/dashboard/tasks/${taskId}/report`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--primary)]/15 text-[var(--primary)] text-[11.5px] font-bold hover:bg-[var(--primary)]/25 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Official PDF Report Generated · Open PDF</span>
                        </Link>
                      </div>
                    )}

                    <div className="pt-1.5 flex items-center justify-between border-t border-[var(--primary)]/15 text-[11.5px]">
                      <span className="text-[var(--text-muted)]">
                        {ms.timestamp || formatMessageTime(m.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => router.push(deepLink)}
                        className="font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{ctaLabel}</span>
                        <span className="text-[13px]">→</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // ── Case B: Outbound Client Message Bubble (Green / Red if Rejected) ──
              if (isUser) {
                const isRejected = m.moderationStatus === "REJECTED";
                const isPending = m.moderationStatus === "PENDING_REVIEW";
                const isRefined = m.moderationStatus === "REFINED_BY_ADMIN";

                return (
                  <div key={m.id} className="flex flex-col items-end space-y-1">
                    <div
                      className={`max-w-[85%] sm:max-w-[78%] rounded-[20px] rounded-br-[4px] px-4.5 py-3 shadow-xs ${
                        isRejected
                          ? "bg-red-600/90 text-white"
                          : "bg-[#29c452] text-[#052e16]"
                      }`}
                    >
                      <p className="text-[13.5px] sm:text-[14px] font-medium leading-relaxed break-words">
                        {m.message}
                      </p>
                      <div
                        className={`flex items-center justify-between gap-2 mt-1.5 text-[10.5px] font-medium ${
                          isRejected ? "text-white/85" : "text-[#052e16]/75"
                        }`}
                      >
                        <span>{formatMessageTime(m.createdAt)}</span>
                        {isPending ? (
                          <span className="font-semibold bg-black/15 px-2 py-0.5 rounded-full">
                            Pending Admin Review
                          </span>
                        ) : isRefined ? (
                          <span className="font-semibold bg-black/15 px-2 py-0.5 rounded-full">
                            Modified &amp; Approved
                          </span>
                        ) : isRejected ? (
                          <span className="font-semibold bg-black/25 px-2 py-0.5 rounded-full">
                            Rejected by Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Approved</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {isRejected && (
                      <div className="max-w-[85%] sm:max-w-[78%] rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-3 py-2 flex items-start gap-2 text-[11.5px] text-red-600 dark:text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>
                          <strong>Admin Warning:</strong>{" "}
                          {m.rejectionReason ||
                            "This message violated communication policies and was not delivered to the agent."}
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              // ── Case C: Inbound Agent / Admin-Approved Message Bubble (Dark / Soft Neutral) ──
              return (
                <div key={m.id} className="flex flex-col items-start">
                  <div className="max-w-[85%] sm:max-w-[78%] bg-[#F4F6F4] dark:bg-[#121612] text-[var(--text-heading)] border border-[var(--border-color)]/40 rounded-[20px] rounded-bl-[4px] px-4.5 py-3 shadow-xs">
                    <p className="text-[13.5px] sm:text-[14px] leading-relaxed break-words">
                      {m.message}
                    </p>
                    <div className="flex items-center justify-between gap-3 mt-1.5 text-[10.5px] text-[var(--text-muted)]">
                      <span>{formatMessageTime(m.createdAt)}</span>
                      {m.moderationStatus === "REFINED_BY_ADMIN" && (
                        <span className="text-[10px] text-[var(--primary)] font-semibold">
                          Verified by Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {sendError && (
        <div className="px-4 pb-2 text-xs text-red-500 font-medium text-center">
          {sendError}
        </div>
      )}

      {/* ── Bottom Sticky Input Bar ── */}
      <div className="sticky bottom-0 z-30 bg-[var(--bg-body)]/95 backdrop-blur-md border-t border-[var(--border-color)] p-3 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2.5"
        >
          <input
            type="text"
            disabled={!canChat}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isPropertyOversite
                ? "Message Oversite regarding this property..."
                : canChat
                  ? "Type a message..."
                  : "Chat unlocks once an agent accepts this task..."
            }
            className="flex-1 bg-[#F4F6F4] dark:bg-[var(--bg-card)] text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] rounded-full px-5 py-3.5 border border-[var(--border-color)]/60 focus:border-[var(--primary)] focus:outline-none transition-colors shadow-xs disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isSending || !canChat}
            aria-label="Send message"
            className="w-12 h-12 rounded-full bg-[var(--primary)] hover:bg-[#23993e] text-white flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-5 h-5 -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
