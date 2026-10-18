"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

function TargetEyeIcon({ active = false }: { active?: boolean }) {
  return (
    <svg
      className="w-5 h-5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      {active && <line x1="4" y1="4" x2="20" y2="20" strokeWidth="1.8" />}
    </svg>
  );
}

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("•••••••••••••");
  const [newPassword, setNewPassword] = useState("•••••••••••••");
  const [confirmPassword, setConfirmPassword] = useState("•••••••••••••");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToastMessage("Password updated successfully!");

    setTimeout(() => {
      router.push("/security");
    }, 1200);
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-16 select-none">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[#2BB44A]/20 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[#2BB44A] stroke-[3]" />
            </div>
            <span className="text-[13px] font-medium tracking-wide truncate">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* ── Top Header matching Screenshot 1 ── */}
      <div className="flex items-center gap-4 py-3 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text-heading)]">
          Change password
        </h1>
      </div>

      {/* ── Password Form matching Screenshot 1 ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div>
          <label className="block text-[13px] font-semibold text-[var(--text-heading)] mb-2">
            Current Password
          </label>
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#1a1b1e] border border-zinc-200/80 dark:border-zinc-800 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-6 py-4 transition-all shadow-xs">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-transparent text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none font-medium tracking-wider"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              <TargetEyeIcon active={showCurrent} />
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label className="block text-[13px] font-semibold text-[var(--text-heading)] mb-2">
            New Password
          </label>
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#1a1b1e] border border-zinc-200/80 dark:border-zinc-800 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-6 py-4 transition-all shadow-xs">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className="w-full bg-transparent text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none font-medium tracking-wider"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              <TargetEyeIcon active={showNew} />
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-[13px] font-semibold text-[var(--text-heading)] mb-2">
            Confirm Password
          </label>
          <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#1a1b1e] border border-zinc-200/80 dark:border-zinc-800 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-6 py-4 transition-all shadow-xs">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full bg-transparent text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none font-medium tracking-wider"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              <TargetEyeIcon active={showConfirm} />
            </button>
          </div>
        </div>

        {/* Change Password Button */}
        <div className="pt-12">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-full bg-[#2BB44A] hover:bg-[#259f42] text-white font-semibold text-[14px] shadow-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Change password"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
