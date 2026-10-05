"use client";

import { useState } from "react";
import { ArrowLeft, EyeOff, Eye, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isFormValid = newPassword.length > 0 && confirmPassword.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    // Simulate API call for password reset
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
    }, 1000);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto h-full flex flex-col justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center mb-6 mt-2">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 bg-(--bg-card) rounded-full flex items-center justify-center shadow-sm border border-(--border-color) mr-4 hover:bg-(--bg-secondary) transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--text-heading)]" />
          </button>
          <h1 className="text-[27px] font-bold text-[var(--text-heading)]">Change password</h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-3">
          {/* New Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-heading)] block">
              New Password
            </label>
            <div className="relative bg-(--bg-card) rounded-[24px] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] focus-within:ring-1 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)] transition-all">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
                className="w-full py-3 pl-6 pr-12 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-[12px] font-medium tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#a0aab4] hover:text-[var(--text-heading)] transition-colors"
              >
                {showNewPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-heading)] block">
              Confirm Password
            </label>
            <div className="relative bg-(--bg-card) rounded-[24px] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] focus-within:ring-1 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)] transition-all">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full py-3 pl-6 pr-12 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-[12px] font-medium tracking-widest"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#a0aab4] hover:text-[var(--text-heading)] transition-colors"
              >
                {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full py-2 rounded-[24px] font-semibold text-[13px] transition-all ${isFormValid
                ? "bg-[var(--primary)] text-white active:scale-[0.98] hover:bg-[var(--primary-hover)]"
                : "bg-(--bg-secondary) text-var(--text-muted) cursor-not-allowed"
                }`}
            >
              {loading ? "Updating..." : "Change password"}
            </button>
          </div>
        </form>
      </div>

      {/* Success Bottom Sheet / Modal Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center sm:items-center sm:p-4">
          {/* Dimmed Background */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { }} />

          {/* Bottom Sheet (Mobile) / Modal (Desktop) */}
          <div className="relative w-full max-w-sm mx-auto bg-(--bg-card) rounded-t-[32px] sm:rounded-[32px] px-6 pt-3 sm:pt-8 pb-8 shadow-2xl flex flex-col items-center animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            {/* Grab Handle (Mobile Only) */}
            <div className="w-12 h-1.5 bg-(--border-color) rounded-full mb-8 sm:hidden" />

            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full border-2 border-[var(--primary)] flex items-center justify-center mb-6 text-[var(--primary)]">
              <CheckCircle2 className="w-8 h-8" strokeWidth={2.5} />
            </div>

            {/* Success Text */}
            <h2 className="text-[17px] font-bold text-[var(--text-heading)] mb-8">
              Password Updated Successfully
            </h2>

            {/* Action Button */}
            <button
              onClick={() => router.push("/login")}
              className="w-full py-4 rounded-xl bg-[var(--primary)] text-white font-medium text-[16px] active:scale-[0.98] transition-transform hover:bg-[var(--primary-hover)]"
            >
              Continue to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
