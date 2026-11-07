"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="relative w-full text-[var(--text-heading)] min-h-[calc(100vh-140px)] md:min-h-[calc(100vh-90px)] flex flex-col justify-between pb-10 select-none">
      <div>
        {/* ── Unified Page Header ── */}
        <PageHeader
          title="About"
          showBack={true}
          onBack={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/more");
            }
          }}
        />

        {/* ── Brand Logo matching Screenshot 3 ── */}
        <div className="flex justify-center mt-6 mb-10">
          <img
            src="/assets/nav-icons/logo-full.svg"
            alt="Oversite Logo"
            className="h-14 sm:h-16 w-auto"
          />
        </div>

        {/* ── Mission Description matching Screenshot 3 ── */}
        <div className="px-4 text-center max-w-lg mx-auto">
          <p className="text-[14px] sm:text-[15px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
            Oversite is your trusted platform for construction and real estate project monitoring. We provide reliable milestone inspections, professional legal advisory, and secure escrow payments to give you complete peace of mind on every project.
          </p>
        </div>
      </div>

      {/* ── Version & Copyright ── */}
      <div className="text-center space-y-1">
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400 font-medium">
          Oversite v2026.1.0
        </p>
        <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
          &copy; 2026 Oversite Technologies Ltd. All rights reserved.
        </p>
      </div>
    </div>
  );
}
