"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";

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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All password fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/users/me/password", {
        method: "PUT",
        credentials: "include",
        headers,
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMessage("Password updated successfully!");
        setTimeout(() => {
          router.push("/security");
        }, 1200);
      } else {
        setErrorMessage(json.error?.message || "Failed to update password");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-16 select-none">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
            </div>
            <span className="text-[13px] font-medium tracking-wide truncate">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="flex items-center gap-4 py-3 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <h1 className="text-[18px] sm:text-[19px] font-semibold text-[var(--text-heading)] tracking-tight">
          Change password
        </h1>
      </div>

      {/* ── Error Banner ── */}
      {errorMessage && (
        <div className="mb-6 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ── Change Password Form ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Field 1: Current Password */}
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
            Current password
          </label>
          <div className="relative flex items-center">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
              className="w-full h-12 px-4 pr-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              aria-label={showCurrent ? "Hide current password" : "Show current password"}
              className="absolute right-4 focus:outline-none"
            >
              <TargetEyeIcon active={showCurrent} />
            </button>
          </div>
        </div>

        {/* Field 2: New Password */}
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
            New password
          </label>
          <div className="relative flex items-center">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 characters)"
              required
              className="w-full h-12 px-4 pr-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              aria-label={showNew ? "Hide new password" : "Show new password"}
              className="absolute right-4 focus:outline-none"
            >
              <TargetEyeIcon active={showNew} />
            </button>
          </div>
        </div>

        {/* Field 3: Confirm New Password */}
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
            Confirm new password
          </label>
          <div className="relative flex items-center">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
              className="w-full h-12 px-4 pr-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              className="absolute right-4 focus:outline-none"
            >
              <TargetEyeIcon active={showConfirm} />
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-13 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-[0.99] text-white font-semibold text-[15px] transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}
