"use client";

import { useState, useRef } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Move to OTP step
      setStep(2);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (error) setError(null);

    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    } else if (value && index === 4) {
      // Auto-submit when last digit is entered
      if (newOtp.join("").length === 5) {
        router.push("/reset-password");
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="flex flex-col items-start w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={() => step === 2 ? setStep(1) : router.back()}
        className="mb-8 mt-2"
      >
        <ArrowLeft className="w-6 h-6 text-[var(--text-heading)]" />
      </button>

      {step === 1 ? (
        <div className="w-full flex flex-col">
          <h1 className="text-[27px] font-bold text-[var(--text-heading)] mb-2">Forgot Password?</h1>
          <p className="text-[13px] font-medium text-var(--text-muted) leading-relaxed mb-6">
            Enter your email address to receive a password reset link.
          </p>

          <form onSubmit={handleSendLink} className="w-full flex flex-col space-y-8">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[var(--text-heading)] block">
                Email Address
              </label>
              <div className="flex items-center bg-(--bg-card) rounded-[24px] overflow-hidden border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] focus-within:ring-1 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)] transition-all">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full py-3 px-6 bg-transparent text-(--text-heading) placeholder:text-[#a0aab4] focus:outline-none text-[12px] font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col space-y-6">
              <button
                type="submit"
                className="w-full py-2 rounded-3xl bg-(--primary) text-white font-semibold text-[13px] active:scale-[0.98] transition-transform hover:bg-[var(--primary-hover)] flex justify-center items-center"
              >
                Send Reset Link
              </button>

              <div className="text-center">
                <p className="text-[13px] font-medium text-[var(--text-body)]">
                  Remember your password?{" "}
                  <Link href="/login" className="font-bold text-(--primary) hover:underline">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="w-full flex flex-col">
          <h1 className="text-[27px] font-bold text-(--text-heading) mb-2">Forgot password</h1>
          <p className="text-[13px] font-medium text-var(--text-muted) leading-relaxed mb-8">
            Please enter the 5 digit code sent to your email address.
          </p>

          <div className="flex flex-col space-y-8">
            <div className="flex justify-between gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  placeholder="0"
                  className={`placeholder:text-gray-600 w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl font-medium rounded-full outline-none transition-all ${error
                    ? "border-2 border-red-400 text-red-300 focus:border-red-500 bg-transparent"
                    : digit || document.activeElement === inputRefs.current[index]
                      ? "border-[1.5px] border-[var(--primary)] text-(--text-heading) bg-transparent"
                      : "border border-transparent bg-gray-200 dark:bg-gray-800 text-[var(--text-heading)] focus:border-[var(--primary)] focus:bg-transparent"
                    }`}
                />
              ))}
            </div>

            {error && (
              <p className="text-[12px] text-red-500 font-medium">
                {error}
              </p>
            )}

            <div>
              <p className="text-[13px] font-medium text-[var(--text-body)]">
                Didn't get a code?{" "}
                <button className="font-bold text-[var(--text-heading)] hover:underline">
                  Resend
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
