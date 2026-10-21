"use client";

import React, { useState } from "react";
import { Search, ArrowLeft, Send, Paperclip } from "lucide-react";

interface Message {
  id: string;
  sender: string;
  text: string;
  time: string;
  isSelf: boolean;
}

interface Conversation {
  id: string;
  initials: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: Message[];
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    initials: "AL",
    name: "Aisha L.",
    lastMessage: "Just finished reviewing the blueprints for th...",
    time: "5m ago",
    unread: 3,
    messages: [
      {
        id: "m1",
        sender: "Aisha L.",
        text: "Hello Adaeze! I am reviewing the architectural drawings for the Lekki project.",
        time: "10:15 AM",
        isSelf: false,
      },
      {
        id: "m2",
        sender: "You",
        text: "Great! Please ensure the foundation measurements match the survey document.",
        time: "10:18 AM",
        isSelf: true,
      },
      {
        id: "m3",
        sender: "Aisha L.",
        text: "Just finished reviewing the blueprints for the site. Everything is aligned with the structural specifications.",
        time: "10:25 AM",
        isSelf: false,
      },
    ],
  },
  {
    id: "conv-2",
    initials: "JM",
    name: "James M.",
    lastMessage: "Client meeting rescheduled to next Wedne...",
    time: "10m ago",
    unread: 4,
    messages: [
      {
        id: "m1",
        sender: "James M.",
        text: "Hi Adaeze, quick update on the property vendor meeting.",
        time: "09:30 AM",
        isSelf: false,
      },
      {
        id: "m2",
        sender: "James M.",
        text: "Client meeting rescheduled to next Wednesday at 11:00 AM.",
        time: "09:40 AM",
        isSelf: false,
      },
    ],
  },
  {
    id: "conv-3",
    initials: "SR",
    name: "Sophia R.",
    lastMessage: "Received the latest materials shipment; qua...",
    time: "15m ago",
    unread: 5,
    messages: [
      {
        id: "m1",
        sender: "Sophia R.",
        text: "Good morning! The supply truck arrived at the gate.",
        time: "08:45 AM",
        isSelf: false,
      },
      {
        id: "m2",
        sender: "Sophia R.",
        text: "Received the latest materials shipment; quality check passed.",
        time: "09:12 AM",
        isSelf: false,
      },
    ],
  },
  {
    id: "conv-4",
    initials: "DP",
    name: "David P.",
    lastMessage: "Site safety audit completed, no issues repo...",
    time: "20m ago",
    unread: 6,
    messages: [
      {
        id: "m1",
        sender: "David P.",
        text: "Carried out the routine perimeter and safety audit this morning.",
        time: "08:10 AM",
        isSelf: false,
      },
      {
        id: "m2",
        sender: "David P.",
        text: "Site safety audit completed, no issues reported. Fence and gate lock secure.",
        time: "08:35 AM",
        isSelf: false,
      },
    ],
  },
];

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");

  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenConversation = (conv: Conversation) => {
    // Mark as read when opening
    setConversations((prev) =>
      prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c))
    );
    setActiveConv(conv);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConv) return;

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: "You",
      text: inputText.trim(),
      time: "Just now",
      isSelf: true,
    };

    setActiveConv((prev) =>
      prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
    );

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConv.id
          ? {
              ...c,
              lastMessage: inputText.trim(),
              time: "Just now",
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );

    setInputText("");
  };

  // ─── Active Chat Thread View ───
  if (activeConv) {
    return (
      <div className="bg-(--bg-body) min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-(--text-heading) transition-colors duration-150 flex flex-col justify-between -m-4 sm:-m-6 md:-m-8 p-4 sm:p-6">
        <div className="max-w-xl mx-auto w-full flex-1 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="relative flex items-center justify-between py-3 mb-4 border-b border-(--border-color) pb-3">
              <button
                type="button"
                onClick={() => setActiveConv(null)}
                className="p-2 -ml-2 text-(--text-heading) hover:opacity-75 transition-opacity cursor-pointer flex items-center gap-1.5"
                aria-label="Back to messages"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="text-center flex-1 pr-6">
                <h1 className="text-[17px] font-bold text-(--text-heading)">
                  {activeConv.name}
                </h1>
                <p className="text-[11.5px] text-(--primary) font-medium">Online</p>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="space-y-3.5 overflow-y-auto pb-4 pt-1 max-h-[calc(100dvh-280px)]">
              {activeConv.messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.isSelf ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[82%] px-4 py-2.5 rounded-[20px] text-[13.5px] leading-relaxed shadow-xs ${
                      m.isSelf
                        ? "bg-(--primary) text-white rounded-tr-xs"
                        : "bg-(--bg-card) text-(--text-heading) rounded-tl-xs border border-(--border-color)"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10.5px] text-(--text-muted) mt-1 px-1">
                    {m.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sticky Message Input */}
          <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-(--bg-body)/95 backdrop-blur-md pt-3 pb-3 border-t border-(--border-color)">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <button
                type="button"
                className="p-2.5 text-(--text-muted) hover:text-(--text-heading) rounded-full bg-(--bg-card) border border-(--border-color) shadow-xs cursor-pointer transition-colors"
                aria-label="Attach file"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-(--bg-card) rounded-full px-4 py-3 text-[14px] text-(--text-heading) placeholder:text-(--text-muted) outline-none border border-(--border-color) focus:border-(--primary) shadow-xs transition-all"
              />
              <button
                type="submit"
                className="w-11 h-11 bg-(--primary) hover:bg-(--primary-hover) text-white rounded-full flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all"
                aria-label="Send message"
              >
                <Send className="w-5 h-5 -translate-x-0.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Messages List ───
  return (
    <div className="bg-(--bg-body) min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-(--text-heading) transition-colors duration-150">
      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4">
        <div>
          {/* ── Top Header: Centered "Messages" ── */}
          <div className="relative flex items-center justify-center py-3 mb-4">
            <h1 className="text-[18px] sm:text-[19px] font-bold text-(--text-heading) tracking-tight">
              Messages
            </h1>
          </div>

          {/* ── Search Input: Rounded Pill ── */}
          <div className="mb-6">
            <div className="w-full bg-(--bg-card) rounded-full px-4 py-3 flex items-center gap-3 shadow-xs border border-(--border-color) focus-within:border-(--primary) transition-all">
              <Search className="w-5 h-5 text-(--text-muted) shrink-0 stroke-[2.2]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search.."
                className="w-full bg-transparent text-[14px] text-(--text-heading) placeholder:text-(--text-muted) focus:outline-none"
              />
            </div>
          </div>

          {/* ── Conversation List ── */}
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-(--text-muted) text-[14px]">
                No messages found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => handleOpenConversation(conv)}
                  className="w-full flex items-center gap-3.5 p-2 rounded-2xl hover:bg-(--bg-secondary) text-left cursor-pointer transition-all active:scale-[0.99]"
                >
                  {/* Avatar circle */}
                  <div className="w-14 h-14 rounded-full bg-(--bg-secondary) text-(--text-heading) font-bold text-[16px] flex items-center justify-center shrink-0 border border-(--border-color)">
                    {conv.initials}
                  </div>

                  {/* Middle content: Name & Snippet */}
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-[15.5px] font-bold text-(--text-heading) truncate">
                      {conv.name}
                    </p>
                    <p className="text-[13px] text-(--text-muted) truncate mt-0.5 leading-snug">
                      {conv.lastMessage}
                    </p>
                  </div>

                  {/* Right column: Time & Emerald unread badge */}
                  <div className="flex flex-col items-end shrink-0 gap-1.5 self-center">
                    <span className="text-[12px] text-(--text-muted) font-medium">
                      {conv.time}
                    </span>
                    {conv.unread > 0 ? (
                      <span className="w-5 h-5 rounded-full bg-(--primary) text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
                        {conv.unread}
                      </span>
                    ) : (
                      <div className="w-5 h-5" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Space above bottom nav */}
        <div className="pb-8" />
      </div>
    </div>
  );
}
