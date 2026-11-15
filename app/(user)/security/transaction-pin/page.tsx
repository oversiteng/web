"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Delete,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const PIN_STORAGE_KEY = "oversite_withdrawal_pin";

const KEYPAD_KEYS = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
];

type PinFlowStep =
  | "verify_current"
  | "forgot_otp"
  | "enter_new"
  | "confirm_new"
  | "success";

export default function ChangeTransactionPinPage() {
  const router = useRouter();

  const [hasExistingPin, setHasExistingPin] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);

  const [step, setStep] = useState<PinFlowStep>("verify_current");
  const [pin, setPin] = useState<string>("");
  const [tempNewPin, setTempNewPin] = useState<string>("");

  // OTP State for "Forgot PIN" flow
  const [otpCode, setOtpCode] = useState<string>("");
  const [resendTimer, setResendTimer] = useState<number>(45);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing PIN from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(PIN_STORAGE_KEY);
      if (saved && /^\d{4}$/.test(saved)) {
        setHasExistingPin(true);
        setStoredPin(saved);
        setStep("verify_current");
      } else {
        setHasExistingPin(false);
        setStoredPin(null);
        setStep("enter_new");
      }
    }
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    if (step !== "forgot_otp" || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Keypad Handlers
  const handleDigit = useCallback(
    (digit: string) => {
      setErrorMessage(null);
      if (step === "forgot_otp") {
        setOtpCode((prev) => (prev.length < 6 ? prev + digit : prev));
      } else {
        setPin((prev) => (prev.length < 4 ? prev + digit : prev));
      }
    },
    [step]
  );

  const handleBackspace = useCallback(() => {
    setErrorMessage(null);
    if (step === "forgot_otp") {
      setOtpCode((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  }, [step]);

  // Auto-advance logic when PIN reaches 4 digits
  useEffect(() => {
    if (pin.length !== 4) return;

    if (step === "verify_current") {
      if (pin === storedPin) {
        setErrorMessage(null);
        setPin("");
        setStep("enter_new");
      } else {
        setErrorMessage("Incorrect current PIN. Please try again.");
        setPin("");
      }
    } else if (step === "enter_new") {
      if (hasExistingPin && pin === storedPin) {
        setErrorMessage("New PIN must be different from current PIN.");
        setPin("");
        return;
      }
      setErrorMessage(null);
      setTempNewPin(pin);
      setPin("");
      setStep("confirm_new");
    } else if (step === "confirm_new") {
      if (pin === tempNewPin) {
        setIsSubmitting(true);
        setTimeout(() => {
          if (typeof window !== "undefined") {
            localStorage.setItem(PIN_STORAGE_KEY, pin);
          }
          setIsSubmitting(false);
          setStep("success");
        }, 500);
      } else {
        setErrorMessage("PINs do not match. Please re-enter.");
        setPin("");
      }
    }
  }, [pin, step, storedPin, tempNewPin, hasExistingPin]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === "success") return;
      if (/^\d$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, handleDigit, handleBackspace]);

  // Handle Verify OTP
  const handleVerifyOtp = () => {
    if (otpCode.length < 4) {
      setErrorMessage("Please enter a valid verification code.");
      return;
    }
    setIsVerifyingOtp(true);
    setTimeout(() => {
      setIsVerifyingOtp(false);
      setErrorMessage(null);
      setOtpCode("");
      setPin("");
      setStep("enter_new");
    }, 600);
  };

  // Back Button Navigation
  const handleBack = () => {
    setErrorMessage(null);
    setPin("");
    if (step === "verify_current") {
      router.back();
    } else if (step === "forgot_otp") {
      setStep("verify_current");
    } else if (step === "enter_new") {
      if (hasExistingPin) {
        setStep("verify_current");
      } else {
        router.back();
      }
    } else if (step === "confirm_new") {
      setStep("enter_new");
    } else {
      router.push("/security");
    }
  };

  // ── Step Titles and Subtitles ──
  const getStepInfo = () => {
    switch (step) {
      case "verify_current":
        return {
          title: "Change transaction pin",
          screenTitle: "Enter current PIN",
          subtitle: "Enter your 4-digit withdrawal PIN to continue",
        };
      case "forgot_otp":
        return {
          title: "Reset transaction pin",
          screenTitle: "Enter verification code",
          subtitle: "Enter the code sent to your registered email to reset your PIN",
        };
      case "enter_new":
        return {
          title: hasExistingPin ? "Change transaction pin" : "Set transaction pin",
          screenTitle: hasExistingPin ? "Enter new PIN" : "Create transaction PIN",
          subtitle: "Choose a 4-digit PIN for withdrawals and transactions",
        };
      case "confirm_new":
        return {
          title: hasExistingPin ? "Change transaction pin" : "Set transaction pin",
          screenTitle: "Confirm new PIN",
          subtitle: "Re-enter your 4-digit PIN to confirm",
        };
      case "success":
        return {
          title: "Success",
          screenTitle: "Transaction PIN updated",
          subtitle: "Your withdrawal PIN has been updated successfully",
        };
    }
  };

  const { title, screenTitle, subtitle } = getStepInfo();

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-12 select-none min-h-[calc(100dvh-120px)] flex flex-col justify-between">
      {/* ── Top Header Bar ── */}
      {step !== "success" && (
        <div className="flex items-center gap-3 py-3 mb-2">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer -ml-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] sm:text-[18px] font-bold text-[var(--text-heading)] tracking-tight">
            {title}
          </h1>
        </div>
      )}

      {/* ── VIEW 1: PIN Input Views (verify_current, enter_new, confirm_new) ── */}
      {step !== "forgot_otp" && step !== "success" && (
        <div className="flex-1 flex flex-col justify-between py-4">
          <div className="text-center space-y-4 pt-4">
            <div>
              <h2 className="text-[20px] sm:text-[22px] font-bold text-[var(--text-heading)]">
                {screenTitle}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-xs mx-auto">
                {subtitle}
              </p>
            </div>

            {/* 4-Digit PIN Circles */}
            <div className="pt-6 pb-4 flex items-center justify-center gap-4">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < pin.length;
                return (
                  <span
                    key={index}
                    className={`rounded-full transition-all duration-150 ${
                      isFilled
                        ? "w-4 h-4 bg-[var(--primary)] scale-110 shadow-xs"
                        : "w-3.5 h-3.5 border-2 border-[var(--border-color)] bg-transparent"
                    }`}
                  />
                );
              })}
            </div>

            {/* Submitting indicator */}
            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 text-xs text-[var(--primary)] font-semibold pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving PIN...</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--danger-light)] text-[var(--danger)] text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Forgot PIN Option (Only on verify_current) */}
            {step === "verify_current" && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setPin("");
                    setStep("forgot_otp");
                  }}
                  className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  Forgot current PIN?
                </button>
              </div>
            )}
          </div>

          {/* ── Keypad (Matches Images 2 & 3) ── */}
          <div className="mt-8 bg-[var(--bg-secondary)] dark:bg-[var(--bg-card)]/60 border border-[var(--border-color)]/70 rounded-[28px] p-3 shadow-xs">
            <div className="grid grid-cols-3 gap-2">
              {KEYPAD_KEYS.map(({ digit, letters }) => (
                <button
                  key={digit}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDigit(digit)}
                  className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] active:scale-95 border border-[var(--border-color)]/60 rounded-2xl py-3 flex flex-col items-center justify-center shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
                >
                  <span className="text-lg font-bold text-[var(--text-heading)] leading-none">
                    {digit}
                  </span>
                  {letters ? (
                    <span className="text-[9px] font-semibold text-[var(--text-muted)] tracking-widest mt-1 leading-none">
                      {letters}
                    </span>
                  ) : (
                    <span className="text-[9px] mt-1 leading-none opacity-0">.</span>
                  )}
                </button>
              ))}

              {/* Bottom Row */}
              <div
                aria-hidden="true"
                className="rounded-2xl py-3 flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]/60 select-none"
              >
                + * #
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDigit("0")}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] active:scale-95 border border-[var(--border-color)]/60 rounded-2xl py-3 flex items-center justify-center shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
              >
                <span className="text-lg font-bold text-[var(--text-heading)] leading-none">
                  0
                </span>
              </button>

              <button
                type="button"
                disabled={isSubmitting || pin.length === 0}
                onClick={handleBackspace}
                aria-label="Delete digit"
                className="rounded-2xl py-3 flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] active:scale-95 transition-all cursor-pointer disabled:opacity-35"
              >
                <Delete className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 2: Forgot PIN OTP Verification Screen Step ── */}
      {step === "forgot_otp" && (
        <div className="flex-1 flex flex-col justify-between py-4">
          <div className="space-y-6 pt-4 text-center">
            <div>
              <h2 className="text-[20px] sm:text-[22px] font-bold text-[var(--text-heading)]">
                {screenTitle}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-xs mx-auto">
                {subtitle}
              </p>
            </div>

            {/* 6 OTP Code Display Boxes */}
            <div className="flex items-center justify-center gap-2.5 pt-4">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const char = otpCode[idx] || "";
                return (
                  <div
                    key={idx}
                    className={`w-11 h-12 rounded-xl border flex items-center justify-center text-lg font-bold transition-all ${
                      char
                        ? "border-[var(--primary)] bg-[var(--primary-light)]/20 text-[var(--text-heading)]"
                        : "border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)]"
                    }`}
                  >
                    {char ? "•" : ""}
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--danger-light)] text-[var(--danger)] text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Resend Code Action */}
            <div className="pt-1 flex items-center justify-center gap-2 text-xs">
              <span className="text-[var(--text-muted)]">Didn&apos;t receive code?</span>
              {resendTimer > 0 ? (
                <span className="font-semibold text-[var(--text-heading)]">
                  Resend in 0:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setResendTimer(45)}
                  className="font-bold text-[var(--primary)] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Resend
                </button>
              )}
            </div>

            {/* Verify Button */}
            <div className="pt-2 px-2">
              <button
                type="button"
                disabled={otpCode.length < 4 || isVerifyingOtp}
                onClick={handleVerifyOtp}
                className="w-full py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify &amp; Create New PIN</span>
                )}
              </button>
            </div>
          </div>

          {/* Keypad for OTP entry */}
          <div className="mt-6 bg-[var(--bg-secondary)] dark:bg-[var(--bg-card)]/60 border border-[var(--border-color)]/70 rounded-[28px] p-3 shadow-xs">
            <div className="grid grid-cols-3 gap-2">
              {KEYPAD_KEYS.map(({ digit, letters }) => (
                <button
                  key={digit}
                  type="button"
                  disabled={isVerifyingOtp}
                  onClick={() => handleDigit(digit)}
                  className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] active:scale-95 border border-[var(--border-color)]/60 rounded-2xl py-3 flex flex-col items-center justify-center shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
                >
                  <span className="text-lg font-bold text-[var(--text-heading)] leading-none">
                    {digit}
                  </span>
                  {letters ? (
                    <span className="text-[9px] font-semibold text-[var(--text-muted)] tracking-widest mt-1 leading-none">
                      {letters}
                    </span>
                  ) : (
                    <span className="text-[9px] mt-1 leading-none opacity-0">.</span>
                  )}
                </button>
              ))}

              <div
                aria-hidden="true"
                className="rounded-2xl py-3 flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]/60 select-none"
              >
                + * #
              </div>

              <button
                type="button"
                disabled={isVerifyingOtp}
                onClick={() => handleDigit("0")}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] active:scale-95 border border-[var(--border-color)]/60 rounded-2xl py-3 flex items-center justify-center shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
              >
                <span className="text-lg font-bold text-[var(--text-heading)] leading-none">
                  0
                </span>
              </button>

              <button
                type="button"
                disabled={isVerifyingOtp || otpCode.length === 0}
                onClick={handleBackspace}
                aria-label="Delete digit"
                className="rounded-2xl py-3 flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] active:scale-95 transition-all cursor-pointer disabled:opacity-35"
              >
                <Delete className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 3: Success Screen (Matches Image 4 pattern) ── */}
      {step === "success" && (
        <div className="flex-1 flex flex-col justify-between pt-16 pb-4">
          <div className="space-y-6 text-center">
            {/* Green Check Circle */}
            <div className="w-16 h-16 rounded-full border-2 border-[var(--primary)] bg-[var(--primary-light)]/40 text-[var(--primary)] flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <h2 className="text-[22px] sm:text-[24px] font-bold text-[var(--text-heading)] tracking-tight">
                {hasExistingPin ? "Transaction PIN updated" : "Transaction PIN set"}
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-2 max-w-xs mx-auto leading-relaxed">
                Your 4-digit withdrawal PIN is active and protects your payouts and sensitive actions.
              </p>
            </div>

            {/* Details Receipt Card */}
            <div className="rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3.5 text-xs text-left shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Security status</span>
                <span className="font-semibold text-[var(--primary)] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active &amp; Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">PIN length</span>
                <span className="font-bold text-[var(--text-heading)]">4 digits</span>
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

          {/* Bottom Done Button */}
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
    </div>
  );
}
