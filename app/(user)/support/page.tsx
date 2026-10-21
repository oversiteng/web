"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MessageSquare,
  Mail,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function SupportPage() {
  const router = useRouter();
  const [faqsOpen, setFaqsOpen] = useState(false);

  const FAQS = [
    {
      q: "How do milestone inspections work?",
      a: "Our certified field agents conduct on-site physical visits with geo-tagged high-resolution photos, drone surveys, and material verification reports before escrow payouts are approved.",
    },
    {
      q: "How does escrow protection guarantee safety?",
      a: "Funds for building contractors or vendors are held in secure escrow and only disbursed when you review and formally approve milestone verification reports.",
    },
    {
      q: "How fast will field agents be dispatched?",
      a: "Standard dispatches occur within 24-48 hours. Pro members receive priority same-day dispatch.",
    },
  ];

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-16 select-none">
      {/* ── Top Header ── */}
      <div className="relative flex items-center justify-center py-3 mb-8">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/more");
            }
          }}
          aria-label="Go back"
          className="absolute left-0 w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text-heading)]">
          Support
        </h1>
      </div>

      {/* ── Support Agent Headset Illustration matching Screenshot 2 ── */}
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 flex items-center justify-center">
          <svg
            className="w-20 h-20 text-[var(--primary)]"
            viewBox="0 0 64 64"
            fill="none"
          >
            {/* Headset Headband */}
            <path
              d="M16 32C16 23.1634 23.1634 16 32 16C40.8366 16 48 23.1634 48 32"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {/* Ear Cups */}
            <rect x="12" y="27" width="6" height="12" rx="3" fill="currentColor" />
            <rect x="46" y="27" width="6" height="12" rx="3" fill="currentColor" />
            {/* Hair/Head arc */}
            <path
              d="M23 29C23 24.0294 27.0294 20 32 20C36.9706 20 41 24.0294 41 29"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Friendly Face Eyes */}
            <circle cx="28" cy="33" r="2.5" fill="currentColor" />
            <circle cx="36" cy="33" r="2.5" fill="currentColor" />
            {/* Microphone Boom */}
            <path
              d="M15 36V41C15 45 19 48 26 48H28"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="30" cy="48" r="3.2" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* ── Title Heading matching Screenshot 2 ── */}
      <div className="text-center mb-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-heading)] leading-snug">
          Hello, How can we
          <br />
          Help you?
        </h2>
      </div>

      {/* ── Support Options Card matching Screenshot 2 ── */}
      <div className="rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-xs space-y-6 transition-colors">
        {/* Contact Live Chat */}
        <Link
          href="/support/chat"
          className="flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <MessageSquare className="w-5 h-5 text-[var(--text-heading)] stroke-[1.8]" />
            <span className="text-[14.5px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
              Contact Live Chat
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors" />
        </Link>

        {/* Send us a mail */}
        <a
          href="mailto:support@oversite.ng"
          className="flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <Mail className="w-5 h-5 text-[var(--text-heading)] stroke-[1.8]" />
            <span className="text-[14.5px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
              Send us a mail
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors" />
        </a>

        {/* FAQs Collapsible */}
        <div>
          <button
            type="button"
            onClick={() => setFaqsOpen(!faqsOpen)}
            className="w-full flex items-center justify-between cursor-pointer text-left group"
          >
            <div className="flex items-center gap-4">
              <HelpCircle className="w-5 h-5 text-[var(--text-heading)] stroke-[1.8]" />
              <span className="text-[14.5px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                FAQs
              </span>
            </div>
            {faqsOpen ? (
              <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
            )}
          </button>

          {/* Expanded FAQs List */}
          {faqsOpen && (
            <div className="pt-4 pl-9 space-y-4 border-t border-zinc-100 dark:border-zinc-800/80 mt-4 transition-all animate-in fade-in">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-[13px] font-semibold text-[var(--text-heading)]">
                    {faq.q}
                  </p>
                  <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
