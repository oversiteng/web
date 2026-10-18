"use client";

import { useState } from "react";
import { Send, Paperclip, ArrowLeft, Search } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isSelf: boolean;
}

interface Conversation {
  id: string;
  agentInitials: string;
  agentName: string;
  agentRole: string;
  taskRef: string;
  taskLabel: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  accentColor: string;
  messages: Message[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    agentInitials: "TC",
    agentName: "Tunde C.",
    agentRole: "Field Agent",
    taskRef: "prop-oversite-01",
    taskLabel: "Lekki Site Visit",
    lastMessage: "I have arrived at the site. Uploading geo-tagged photos now.",
    time: "2h ago",
    unread: 2,
    online: true,
    accentColor: "bg-[var(--primary)]/20 text-[var(--primary)]",
    messages: [
      {
        id: "m1",
        sender: "Tunde C.",
        text: "Good morning! I have arrived at the Lagos State High Court registry. Queuing up for the certified true copy now.",
        time: "09:45 AM",
        isSelf: false,
      },
      {
        id: "m2",
        sender: "You",
        text: "Thank you Tunde! Please ensure the registrar stamps page 3 clearly.",
        time: "09:47 AM",
        isSelf: true,
      },
      {
        id: "m3",
        sender: "Tunde C.",
        text: "Noted! Will upload a high-resolution snapshot here as soon as they hand it over.",
        time: "09:50 AM",
        isSelf: false,
      },
      {
        id: "m4",
        sender: "Tunde C.",
        text: "I have arrived at the site. Uploading geo-tagged photos now.",
        time: "10:10 AM",
        isSelf: false,
      },
    ],
  },
  {
    id: "conv-2",
    agentInitials: "FA",
    agentName: "Folake A.",
    agentRole: "Document Specialist",
    taskRef: "doc-proc-04",
    taskLabel: "CAC Certified Copy",
    lastMessage: "The document has been processed and is ready for download.",
    time: "5h ago",
    unread: 0,
    online: false,
    accentColor: "bg-blue-500/20 text-blue-400",
    messages: [
      {
        id: "m1",
        sender: "Folake A.",
        text: "Hello! I picked up your CAC retrieval request. Heading to the CAC office on Lagos Island now.",
        time: "08:00 AM",
        isSelf: false,
      },
      {
        id: "m2",
        sender: "You",
        text: "Great, please get a certified true copy. The company name is Alara Holdings Ltd.",
        time: "08:05 AM",
        isSelf: true,
      },
      {
        id: "m3",
        sender: "Folake A.",
        text: "The document has been processed and is ready for download.",
        time: "01:30 PM",
        isSelf: false,
      },
    ],
  },
  {
    id: "conv-3",
    agentInitials: "BK",
    agentName: "Bisi K.",
    agentRole: "Quick Errand Runner",
    taskRef: "errand-07",
    taskLabel: "Utility Bill Payment",
    lastMessage: "Payment confirmed. Receipt attached.",
    time: "Yesterday",
    unread: 0,
    online: false,
    accentColor: "bg-amber-500/20 text-amber-400",
    messages: [
      {
        id: "m1",
        sender: "Bisi K.",
        text: "Hi! I'm on my way to pay the EKEDC bill for the Ikoyi address.",
        time: "Yesterday",
        isSelf: false,
      },
      {
        id: "m2",
        sender: "Bisi K.",
        text: "Payment confirmed. Receipt attached.",
        time: "Yesterday",
        isSelf: false,
      },
    ],
  },
  {
    id: "conv-4",
    agentInitials: "OA",
    agentName: "Oversite Support",
    agentRole: "Customer Support",
    taskRef: "support",
    taskLabel: "Help & Support",
    lastMessage: "How can we help you today?",
    time: "3d ago",
    unread: 0,
    online: true,
    accentColor: "bg-purple-500/20 text-purple-400",
    messages: [
      {
        id: "m1",
        sender: "Oversite Support",
        text: "Hi Adaeze! Welcome to Oversite. How can we help you today?",
        time: "3d ago",
        isSelf: false,
      },
    ],
  },
];

// ─── Thread View ──────────────────────────────────────────────────────────────
function ThreadView({
  conv,
  onBack,
}: {
  conv: Conversation;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>(conv.messages);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        sender: "You",
        text: input,
        time: "Just now",
        isSelf: true,
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Thread Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-color)] mb-2">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-heading)]"
          aria-label="Back to inbox"
        >
          <ArrowLeft size={18} />
        </button>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${conv.accentColor}`}
        >
          {conv.agentInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-bold text-[var(--text-heading)] truncate">
              {conv.agentName}
            </p>
            {conv.online && (
              <span className="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0 animate-pulse" />
            )}
          </div>
          <p className="text-[11px] text-[var(--text-muted)] truncate">
            {conv.agentRole} · {conv.taskLabel}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4 px-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.isSelf ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                m.isSelf
                  ? "bg-[var(--primary)] text-white rounded-tr-none"
                  : "bg-[var(--bg-card)] text-[var(--text-heading)] rounded-tl-none border border-[var(--border-color)]"
              }`}
            >
              {m.text}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1">
              {m.time}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 pt-3 border-t border-[var(--border-color)]"
      >
        <button
          type="button"
          className="p-2 text-[var(--text-muted)] hover:text-[var(--text-heading)] rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <Paperclip size={18} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-[var(--bg-secondary)] rounded-2xl px-4 py-2.5 text-[13px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition"
        />
        <button
          type="submit"
          className="w-10 h-10 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// ─── Inbox Row ────────────────────────────────────────────────────────────────
function InboxRow({
  conv,
  onOpen,
}: {
  conv: Conversation;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--bg-secondary)] transition-colors text-left"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold ${conv.accentColor}`}
        >
          {conv.agentInitials}
        </div>
        {conv.online && (
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-[var(--primary)] border-2 border-[var(--bg-body)]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-[14px] font-bold truncate ${conv.unread > 0 ? "text-[var(--text-heading)]" : "text-[var(--text-heading)]"}`}>
            {conv.agentName}
          </p>
          <span className="text-[11px] text-[var(--text-muted)] shrink-0">
            {conv.time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={`text-[12px] truncate ${conv.unread > 0 ? "text-[var(--text-heading)] font-medium" : "text-[var(--text-muted)]"}`}>
            {conv.lastMessage}
          </p>
          {conv.unread > 0 && (
            <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {conv.unread}
            </span>
          )}
        </div>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5 truncate">
          {conv.taskLabel}
        </p>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const filtered = CONVERSATIONS.filter(
    (c) =>
      c.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.taskLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeConv) {
    return (
      <ThreadView conv={activeConv} onBack={() => setActiveConv(null)} />
    );
  }

  return (
    <div className="space-y-4 relative pb-8">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        {showSearch ? (
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => { setShowSearch(false); setSearchQuery(""); }}
              className="w-9 h-9 flex items-center justify-center text-[var(--text-heading)]"
            >
              <ArrowLeft size={18} />
            </button>
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="flex-1 h-10 px-4 rounded-full bg-[var(--bg-card)] text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none shadow-[0_0_10px_rgba(0,0,0,0.03)]"
            />
          </div>
        ) : (
          <>
            <h1 className="text-[20px] font-bold text-[var(--text-heading)]">Messages</h1>
            <button
              onClick={() => setShowSearch(true)}
              className="w-10 h-10 rounded-full bg-[var(--bg-card)] shadow-[0_0_10px_rgba(0,0,0,0.03)] flex items-center justify-center hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <Search size={18} className="text-[var(--text-heading)]" />
            </button>
          </>
        )}
      </div>

      {/* Online now strip */}
      <div>
        <p className="text-[12px] font-semibold text-[var(--text-muted)] mb-3">
          Online now
        </p>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {CONVERSATIONS.filter((c) => c.online).map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveConv(c)}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-[13px] font-bold ${c.accentColor}`}
                >
                  {c.agentInitials}
                </div>
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-[var(--primary)] border-2 border-[var(--bg-body)]" />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-medium max-w-[48px] truncate text-center">
                {c.agentName.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div>
        <p className="text-[12px] font-semibold text-[var(--text-muted)] mb-2">
          All messages
        </p>
        <div className="bg-[var(--bg-card)] rounded-[24px] p-2 shadow-[0_0_10px_rgba(0,0,0,0.03)] space-y-0.5">
          {filtered.length === 0 ? (
            <p className="text-center text-[13px] text-[var(--text-muted)] py-8">
              No conversations found
            </p>
          ) : (
            filtered.map((conv) => (
              <InboxRow
                key={conv.id}
                conv={conv}
                onOpen={() => setActiveConv(conv)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
