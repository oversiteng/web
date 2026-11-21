"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowLeft, EyeOff, Eye, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const qEmail = searchParams.get("email") || "";
    const qCode = searchParams.get("code") || "";
    const storedEmail =
      typeof window !== "undefined" ? sessionStorage.getItem("oversite_reset_email") || "" : "";
    const storedCode =
      typeof window !== "undefined" ? sessionStorage.getItem("oversite_reset_code") || "" : "";

    setEmail(qEmail || storedEmail);
    setCode(qCode || storedCode);
  }, [searchParams]);

  const isFormValid =
    email.trim().includes("@") &&
    code.trim().length >= 5 &&
    newPassword.length >= 6 &&
    confirmPassword.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error?.message || "Invalid or expired reset code.");
        setLoading(false);
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("oversite_reset_email");
        sessionStorage.removeItem("oversite_reset_code");
      }
      setLoading(false);
      setShowSuccess(true);
    } catch {
      setErrorMessage("Network error while resetting password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full max-w-sm mx-auto h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center mb-6 mt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 bg-[var(--bg-card)] rounded-lg flex items-center justify-center shadow-2xs border border-[var(--border-color)] mr-3.5 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-heading)]" />
          </button>
          <h1 className="text-[24px] font-bold text-[var(--text-heading)]">Reset Password</h1>
        </div>

        {errorMessage && (
          <div className="w-full mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-heading)] block">
              Email Address
            </label>
            <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full py-2.5 px-3.5 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-xs font-medium"
                required
              />
            </div>
          </div>

          {/* 6-Digit Verification Code */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-heading)] block">
              6-Digit Reset Code (from email)
            </label>
            <div className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code"
                className="w-full py-2.5 px-3.5 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-xs font-bold tracking-widest font-mono"
                required
              />
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-heading)] block">
              New Password
            </label>
            <div className="relative bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
                className="w-full py-2.5 pl-3.5 pr-10 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-xs font-medium tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a0aab4] hover:text-[var(--text-heading)] transition-colors"
              >
                {showNewPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-heading)] block">
              Confirm Password
            </label>
            <div className="relative bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full py-2.5 pl-3.5 pr-10 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-xs font-medium tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a0aab4] hover:text-[var(--text-heading)] transition-colors"
              >
                {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full py-2.5 rounded-lg font-semibold text-[13px] transition-all flex items-center justify-center gap-2 ${
                isFormValid
                  ? "bg-[var(--primary)] text-white active:scale-[0.99] hover:bg-[var(--primary-hover)] cursor-pointer"
                  : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed"
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? "Updating Password..." : "Reset Password"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Success Bottom Sheet / Modal Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" />

          <div className="relative w-full max-w-sm mx-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-t-2xl sm:rounded-xl px-6 pt-3 sm:pt-7 pb-7 shadow-2xl flex flex-col items-center animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mb-6 sm:hidden" />

            <div className="w-14 h-14 rounded-full border-2 border-[var(--primary)] flex items-center justify-center mb-4 text-[var(--primary)]">
              <CheckCircle2 className="w-7 h-7" strokeWidth={2.5} />
            </div>

            <h2 className="text-base font-bold text-[var(--text-heading)] mb-6">
              Password Updated Successfully
            </h2>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full py-3 rounded-lg bg-[var(--primary)] text-white font-semibold text-sm active:scale-[0.99] transition-all hover:bg-[var(--primary-hover)] cursor-pointer"
            >
              Continue to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
