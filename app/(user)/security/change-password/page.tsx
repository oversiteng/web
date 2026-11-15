"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Loader2,
  ShieldCheck,
  Mail,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken } from "@/lib/storage/clientStorage";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success view step
  const [isSuccess, setIsSuccess] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("All password fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage("New password must be different from current password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getStoredToken();
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
        setIsSuccess(true);
      } else {
        setErrorMessage(json.error?.message || "Failed to update password.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetLink = async () => {
    setIsSendingForgot(true);
    try {
      const email = user?.email;
      if (email) {
        await fetch("/api/v1/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setIsSendingForgot(false);
      setForgotSent(true);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-12 select-none min-h-[calc(100dvh-120px)] flex flex-col justify-between">
      {/* ── STEP 1: CHANGE PASSWORD FORM ── */}
      {!isSuccess ? (
        <>
          <div>
            {/* Top Header */}
            <div className="flex items-center gap-3 py-3 mb-6">
              <button
                type="button"
                onClick={() => router.back()}
                aria-label="Go back"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer -ml-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <h1 className="text-[17px] sm:text-[18px] font-bold text-[var(--text-heading)] tracking-tight">
                Change password
              </h1>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-[var(--danger-light)] border border-[var(--danger)]/30 text-[var(--danger)] text-xs font-medium flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1.5">
                  Current password
                </label>
                <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-4 py-3.5 shadow-2xs transition-colors">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="w-full bg-transparent text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right -mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setForgotSent(false);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  Forgot current password?
                </button>
              </div>

              {/* New Password */}
              <div className="pt-1">
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1.5">
                  New password
                </label>
                <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-4 py-3.5 shadow-2xs transition-colors">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full bg-transparent text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1.5">
                  Confirm new password
                </label>
                <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-4 py-3.5 shadow-2xs transition-colors">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    className="w-full bg-transparent text-sm text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      ) : (
        /* ── STEP 2: PASSWORD UPDATED SUCCESS SCREEN ── */
        <div className="flex-1 flex flex-col justify-between pt-16 pb-4">
          <div className="space-y-6 text-center">
            {/* Green Check Circle */}
            <div className="w-16 h-16 rounded-full border-2 border-[var(--primary)] bg-[var(--primary-light)]/40 text-[var(--primary)] flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="text-[22px] sm:text-[24px] font-bold text-[var(--text-heading)] tracking-tight">
                Password updated successfully
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-2 max-w-xs mx-auto leading-relaxed">
                Your account password has been updated. Use your new password the next time you sign in.
              </p>
            </div>

            {/* Info Summary Card */}
            <div className="rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3.5 text-xs text-left shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Security status</span>
                <span className="font-semibold text-[var(--primary)] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Secured
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Active sessions</span>
                <span className="font-bold text-[var(--text-heading)]">Current device kept active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Updated</span>
                <span className="font-bold text-[var(--text-heading)]">
                  {new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Done Button */}
          <div className="pt-6">
            <button
              type="button"
              onClick={() => router.push("/security")}
              className="w-full py-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm transition-all shadow-xs cursor-pointer text-center"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ── Forgot Password Sheet (Responsive: Bottom Drawer on Mobile, Centered Modal on Desktop) ── */}
      {isForgotModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setIsForgotModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Bar */}
            <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-heading)]">Reset password</h3>
                  <p className="text-xs text-[var(--text-muted)]">Recovery via registered email</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!forgotSent ? (
              <div className="space-y-4">
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  We will send password reset instructions to your account email{" "}
                  <span className="font-semibold text-[var(--text-heading)]">
                    {user?.email || "your registered email"}
                  </span>
                  .
                </p>
                <button
                  type="button"
                  disabled={isSendingForgot}
                  onClick={handleSendResetLink}
                  className="w-full py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSendingForgot ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending reset email...</span>
                    </>
                  ) : (
                    <span>Send Reset Instructions</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-heading)]">Reset link dispatched</h4>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Check your inbox and follow the secure link to set a new password.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-3 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] text-[var(--text-heading)] font-semibold text-xs border border-[var(--border-color)] transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
