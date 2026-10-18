"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] min-h-[calc(100vh-140px)] md:min-h-[calc(100vh-90px)] flex flex-col justify-between pb-10 select-none">
      {/* ── Top Header matching Screenshot 3 ── */}
      <div>
        <div className="flex items-center gap-4 py-3 mb-12">
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
            className="w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text-heading)]">
            About
          </h1>
        </div>

        {/* ── Brand Logo matching Screenshot 3 ── */}
        <div className="flex justify-center mb-10">
          <img
            src="/assets/nav-icons/logo-full.svg"
            alt="Oversite Logo"
            className="h-14 sm:h-16 w-auto"
          />
        </div>

        {/* ── Mission Description matching Screenshot 3 ── */}
        <div className="px-4 text-center">
          <p className="text-[14px] sm:text-[15px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
            Oversite is your trusted platform for construction and real estate project monitoring. We provide reliable milestone inspections, professional legal advisory, and secure escrow payments to give you complete peace of mind on every project.
          </p>
        </div>
      </div>

      {/* ── Copyright Footer matching Screenshot 3 ── */}
      <div className="text-center pt-16">
        <p className="text-[12px] font-medium text-zinc-400 dark:text-zinc-500">
          ©2026 Oversite limited.
        </p>
        <p className="text-[12px] font-medium text-zinc-400 dark:text-zinc-500 mt-0.5">
          All Right Reserved.
        </p>
      </div>
    </div>
  );
}
