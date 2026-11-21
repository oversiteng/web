"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const requestResetOtp = async (isResend = false) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;

    if (isResend) {
      setResending(true);
    } else {
      setLoading(true);
    }
    setError(null);
    setInfoMessage(null);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message || "Could not send password reset code.");
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem("oversite_reset_email", trimmedEmail);
      }
      setStep(2);
      if (isResend) {
        setInfoMessage("A new 6-digit verification code has been sent to your email.");
      }
    } catch {
      setError("Network error while sending reset code. Please try again.");
    } finally {
      setLoading(false);
      setResending(false);
    }
  };

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestResetOtp(false);
  };

  const proceedToResetPassword = (codeStr: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (typeof window !== "undefined") {
      sessionStorage.setItem("oversite_reset_email", trimmedEmail);
      sessionStorage.setItem("oversite_reset_code", codeStr);
    }
    router.push(
      `/reset-password?email=${encodeURIComponent(trimmedEmail)}&code=${encodeURIComponent(
        codeStr
      )}`
    );
  };

  const handleOtpChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly && value !== "") return;

    // Support pasting full 6-digit code
    if (digitsOnly.length > 1) {
      const pasted = digitsOnly.slice(0, 6).split("");
      const next = ["", "", "", "", "", ""];
      pasted.forEach((char, idx) => {
        next[idx] = char;
      });
      setOtp(next);
      if (error) setError(null);
      if (pasted.length === 6) {
        proceedToResetPassword(pasted.join(""));
      } else {
        inputRefs.current[Math.min(5, pasted.length)]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = digitsOnly.slice(-1);
    setOtp(newOtp);
    if (error) setError(null);

    if (digitsOnly && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (digitsOnly && index === 5) {
      const fullCode = newOtp.join("");
      if (fullCode.length === 6) {
        proceedToResetPassword(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullCode = otp.join("");

  return (
    <div className="flex flex-col items-start w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        type="button"
        onClick={() => (step === 2 ? setStep(1) : router.back())}
        className="mb-8 mt-2 cursor-pointer"
      >
        <ArrowLeft className="w-6 h-6 text-[var(--text-heading)]" />
      </button>

      {step === 1 ? (
        <div className="w-full flex flex-col">
          <h1 className="text-[26px] font-bold text-[var(--text-heading)] mb-1.5">
            Forgot Password?
          </h1>
          <p className="text-[13px] font-medium text-[var(--text-muted)] leading-relaxed mb-6">
            Enter your registered email address to receive a 6-digit password reset code.
          </p>

          {error && (
            <div className="w-full mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSendLink} className="w-full flex flex-col space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--text-heading)] block">
                Email Address
              </label>
              <div className="flex items-center bg-[var(--bg-card)] rounded-lg overflow-hidden border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full py-2.5 px-3.5 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-xs font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col space-y-5">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[var(--primary)] text-white font-semibold text-[13px] active:scale-[0.99] transition-all hover:bg-[var(--primary-hover)] flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? "Sending Code..." : "Send Reset Code"}</span>
              </button>

              <div className="text-center space-y-2">
                <p className="text-xs font-medium text-[var(--text-muted)]">
                  Already have a reset code?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      if (email.trim()) {
                        sessionStorage.setItem("oversite_reset_email", email.trim().toLowerCase());
                      }
                      router.push(
                        email.trim()
                          ? `/reset-password?email=${encodeURIComponent(
                              email.trim().toLowerCase()
                            )}`
                          : "/reset-password"
                      );
                    }}
                    className="font-bold text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    Enter code directly
                  </button>
                </p>
                <p className="text-[13px] font-medium text-[var(--text-body)]">
                  Remember your password?{" "}
                  <Link href="/login" className="font-bold text-[var(--primary)] hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="w-full flex flex-col">
          <h1 className="text-[26px] font-bold text-[var(--text-heading)] mb-1.5">
            Verify Reset Code
          </h1>
          <p className="text-[13px] font-medium text-[var(--text-muted)] leading-relaxed mb-6">
            Enter the 6-digit verification code sent to{" "}
            <strong className="text-[var(--text-heading)]">{email}</strong>.
          </p>

          {infoMessage && (
            <div className="w-full mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-6 gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  placeholder="0"
                  className={`placeholder:text-gray-400 h-12 text-center text-lg font-bold rounded-lg outline-none transition-all ${
                    error
                      ? "border-2 border-red-400 text-red-500 bg-transparent"
                      : digit
                      ? "border-2 border-[var(--primary)] text-[var(--text-heading)] bg-[var(--bg-card)]"
                      : "border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-heading)] focus:border-[var(--primary)]"
                  }`}
                />
              ))}
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <button
              type="button"
              disabled={fullCode.length !== 6}
              onClick={() => proceedToResetPassword(fullCode)}
              className="w-full py-2.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              Continue to Set New Password
            </button>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Didn&apos;t get a code?</span>
              <button
                type="button"
                disabled={resending}
                onClick={() => requestResetOtp(true)}
                className="font-bold text-[var(--primary)] hover:underline cursor-pointer disabled:opacity-50"
              >
                {resending ? "Resending..." : "Resend Code"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
