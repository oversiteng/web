"use client";

import { useState } from "react";
import { MessageSquare, Send, Paperclip, CheckCheck, User } from "lucide-react";

export default function InAppChatPage() {
  const [messages, setMessages] = useState([
    {
      id: "msg-1",
      sender: "Agent Babajide S.",
      text: "Good morning! I have arrived at the Lagos State High Court registry. Queuing up for the certified true copy now.",
      time: "09:45 AM",
      isSelf: false,
    },
    {
      id: "msg-2",
      sender: "You",
      text: "Thank you Babajide! Please ensure the registrar stamps page 3 clearly.",
      time: "09:47 AM",
      isSelf: true,
    },
    {
      id: "msg-3",
      sender: "Agent Babajide S.",
      text: "Noted! Will upload a high-resolution snapshot here as soon as they hand it over.",
      time: "09:50 AM",
      isSelf: false,
    },
  ]);
  const [inputText, setInputText] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setMessages([
      ...messages,
      {
        id: `msg-${Date.now()}`,
        sender: "You",
        text: inputText,
        time: "Just now",
        isSelf: true,
      },
    ]);
    setInputText("");
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold flex items-center justify-center text-sm">
            BS
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Agent Babajide S.</h3>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              On-Site at High Court Registry • Task #errand-1
            </p>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.isSelf ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                m.isSelf
                  ? "bg-emerald-500 text-slate-950 font-medium rounded-tr-none"
                  : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50"
              }`}
            >
              <p>{m.text}</p>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{m.time}</span>
          </div>
        ))}
      </div>

      {/* Message Input Box */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2"
      >
        <button
          type="button"
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type an encrypted message or field instruction..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-colors font-medium"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
