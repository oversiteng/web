"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiClient } from "@/lib/api/client";
import {
  MessageSquare,
  Mail,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface SupportFaqItem {
  id?: string;
  q: string;
  a: string;
}

const DEFAULT_FAQS: SupportFaqItem[] = [
  {
    q: "How do milestone inspections and verifications work?",
    a: "Oversite deploys certified field operatives (identified by their OS-XXXXXX code) to conduct physical on-site visits with geo-tagged high-resolution photos, measurements, and verification reports compiled directly into your Oversite Vault.",
  },
  {
    q: "Who executes my requested task?",
    a: "When you request and pay for a service, Oversite manages the entire execution end-to-end. You communicate directly with Oversite Command & Support while our vetted field operatives carry out the physical assignment.",
  },
  {
    q: "How fast will field operatives be dispatched?",
    a: "Standard dispatches occur within 24–48 hours of payment confirmation. Priority and Emergency Enforcement requests receive same-day dispatch.",
  },
];

export default function SupportPage() {
  const router = useRouter();
  const [faqsOpen, setFaqsOpen] = useState(false);
  const [faqs, setFaqs] = useState<SupportFaqItem[]>(DEFAULT_FAQS);

  useEffect(() => {
    apiClient
      .get("/api/v1/support/tickets")
      .then((res: any) => {
        const list = res?.data?.faqs || res?.faqs;
        if (Array.isArray(list) && list.length > 0) {
          setFaqs(list);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative w-full text-[var(--text-heading)] pb-16 select-none">
      {/* ── Unified Page Header ── */}
      <PageHeader
        title="Support"
        showBack={true}
        onBack={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/more");
          }
        }}
      />

      {/* ── Support Agent Headset Illustration ── */}
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

      {/* ── Title Heading ── */}
      <div className="text-center mb-10">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-heading)] leading-snug">
          Hello, How can we
          <br />
          Help you?
        </h2>
      </div>

      {/* ── Support Options Card ── */}
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
              {faqs.map((faq, idx) => (
                <div key={faq.id || idx} className="space-y-1">
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
