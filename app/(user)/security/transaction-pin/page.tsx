"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken } from "@/lib/storage/clientStorage";
import {
  ArrowLeft,
  Check,
  AlertCircle,
  Delete,
  Loader2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

function getUserPinStorageKey(userId?: string | null) {
  return userId ? `oversite_withdrawal_pin_${userId}` : null;
}

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
  | "loading"
  | "verify_current"
  | "forgot_otp"
  | "enter_new"
  | "confirm_new"
  | "success";

export default function ChangeTransactionPinPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [hasExistingPin, setHasExistingPin] = useState(false);
  const [verifiedCurrentPin, setVerifiedCurrentPin] = useState<string>("");
  const [isResetViaOtp, setIsResetViaOtp] = useState(false);

  const [step, setStep] = useState<PinFlowStep>("loading");
  const [pin, setPin] = useState<string>("");
  const [tempNewPin, setTempNewPin] = useState<string>("");

  // OTP State for "Forgot PIN" flow
  const [otpCode, setOtpCode] = useState<string>("");
  const [resendTimer, setResendTimer] = useState<number>(45);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean up legacy unscoped key and query authoritative backend PIN status for THIS user
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("oversite_withdrawal_pin");
    }

    let cancelled = false;
    async function checkPinStatus() {
      try {
        const token = await getStoredToken();
        if (!token) {
          if (!cancelled) {
            setHasExistingPin(false);
            setStep("enter_new");
          }
          return;
        }
        const res = await fetch("/api/v1/agent/wallet/pin", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!cancelled) {
          const exists = Boolean(json?.data?.hasWithdrawalPin);
          setHasExistingPin(exists);
          setStep(exists ? "verify_current" : "enter_new");
        }
      } catch {
        if (!cancelled) {
          setHasExistingPin(false);
          setStep("enter_new");
        }
      }
    }

    checkPinStatus();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
      if (isSubmitting) return;
      setErrorMessage(null);
      if (step === "forgot_otp") {
        setOtpCode((prev) => (prev.length < 6 ? prev + digit : prev));
      } else {
        setPin((prev) => (prev.length < 4 ? prev + digit : prev));
      }
    },
    [step, isSubmitting]
  );

  const handleBackspace = useCallback(() => {
    if (isSubmitting) return;
    setErrorMessage(null);
    if (step === "forgot_otp") {
      setOtpCode((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  }, [step, isSubmitting]);

  // Auto-advance logic when PIN reaches 4 digits
  useEffect(() => {
    if (pin.length !== 4 || isSubmitting) return;

    if (step === "verify_current") {
      const candidate = pin;
      setIsSubmitting(true);
      (async () => {
        try {
          const token = await getStoredToken();
          const res = await fetch("/api/v1/agent/wallet/pin", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ currentPin: candidate, verifyOnly: true }),
          });
          const json = await res.json();
          if (res.ok && json.success) {
            setVerifiedCurrentPin(candidate);
            setErrorMessage(null);
            setPin("");
            setStep("enter_new");
          } else {
            setErrorMessage(json.error?.message || "Incorrect current PIN. Please try again.");
            setPin("");
          }
        } catch {
          setErrorMessage("Network error verifying PIN. Please try again.");
          setPin("");
        } finally {
          setIsSubmitting(false);
        }
      })();
    } else if (step === "enter_new") {
      if (hasExistingPin && !isResetViaOtp && pin === verifiedCurrentPin) {
        setErrorMessage("New PIN must be different from current PIN.");
        setPin("");
        return;
      }
      setErrorMessage(null);
      setTempNewPin(pin);
      setPin("");
      setStep("confirm_new");
    } else if (step === "confirm_new") {
      if (pin !== tempNewPin) {
        setErrorMessage("PINs do not match. Please re-enter.");
        setPin("");
        return;
      }

      const finalPin = pin;
      setIsSubmitting(true);
      (async () => {
        try {
          const token = await getStoredToken();
          const res = await fetch("/api/v1/agent/wallet/pin", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              pin: finalPin,
              currentPin: hasExistingPin && !isResetViaOtp ? verifiedCurrentPin : undefined,
              resetViaOtp: isResetViaOtp || undefined,
            }),
          });
          const json = await res.json();
          if (!res.ok || !json.success) {
            setErrorMessage(json.error?.message || "Could not save PIN.");
            setPin("");
            setIsSubmitting(false);
            return;
          }
          const userKey = getUserPinStorageKey(user?.id);
          if (typeof window !== "undefined" && userKey) {
            localStorage.setItem(userKey, finalPin);
          }
          setIsSubmitting(false);
          setStep("success");
        } catch {
          setErrorMessage("Network error saving PIN. Please try again.");
          setPin("");
          setIsSubmitting(false);
        }
      })();
    }
  }, [pin, step, verifiedCurrentPin, tempNewPin, hasExistingPin, isResetViaOtp, isSubmitting, user?.id]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step === "success" || step === "loading") return;
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
      setIsResetViaOtp(true);
      setErrorMessage(null);
      setOtpCode("");
      setPin("");
      setStep("enter_new");
    }, 500);
  };

  // Back Button Navigation
  const handleBack = () => {
    setErrorMessage(null);
    setPin("");
    if (step === "verify_current" || step === "loading") {
      router.back();
    } else if (step === "forgot_otp") {
      setStep("verify_current");
    } else if (step === "enter_new") {
      if (hasExistingPin && !isResetViaOtp) {
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

  const getStepInfo = () => {
    switch (step) {
      case "loading":
        return {
          title: "Transaction PIN",
          screenTitle: "Checking security status...",
          subtitle: "Verifying your account PIN configuration",
        };
      case "verify_current":
        return {
          title: "Change transaction pin",
          screenTitle: "Enter current PIN",
          subtitle: "Enter your current 4-digit withdrawal PIN to continue",
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
          screenTitle: hasExistingPin ? "Transaction PIN updated" : "Transaction PIN set",
          subtitle: "Your withdrawal PIN has been configured successfully",
        };
    }
  };

  const { title, screenTitle, subtitle } = getStepInfo();

  if (step === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-2">
        <Loader2 className="w-7 h-7 animate-spin text-[var(--primary)]" />
        <p className="text-xs text-[var(--text-muted)]">{screenTitle}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-20 select-none min-h-[calc(100dvh-120px)] flex flex-col justify-between">
      {/* ── Top Header Bar ── */}
      {step !== "success" && (
        <div className="flex items-center gap-3 py-3 mb-2">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer -ml-1"
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

            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 text-xs text-[var(--primary)] font-semibold pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{step === "verify_current" ? "Verifying PIN..." : "Saving PIN..."}</span>
              </div>
            )}

            {errorMessage && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--danger-light)] text-[var(--danger)] text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

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

          {/* ── Keypad ── */}
          <div className="mt-8 bg-[var(--bg-secondary)] dark:bg-[var(--bg-card)]/60 border border-[var(--border-color)]/70 rounded-xl p-3 shadow-xs">
            <div className="grid grid-cols-3 gap-2">
              {KEYPAD_KEYS.map(({ digit, letters }) => (
                <button
                  key={digit}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDigit(digit)}
                  className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] active:scale-95 border border-[var(--border-color)]/60 rounded-lg py-3 flex flex-col items-center justify-center shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
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
                className="rounded-lg py-3 flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]/60 select-none"
              >
                + * #
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDigit("0")}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] active:scale-95 border border-[var(--border-color)]/60 rounded-lg py-3 flex items-center justify-center shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
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
                className="rounded-lg py-3 flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] active:scale-95 transition-all cursor-pointer disabled:opacity-35"
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

            <div className="flex items-center justify-center gap-2.5 pt-4">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const char = otpCode[idx] || "";
                return (
                  <div
                    key={idx}
                    className={`w-11 h-12 rounded-lg border flex items-center justify-center text-lg font-bold transition-all ${
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

            {errorMessage && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--danger-light)] text-[var(--danger)] text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

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

            <div className="pt-2 px-2">
              <button
                type="button"
                disabled={otpCode.length < 4 || isVerifyingOtp}
                onClick={handleVerifyOtp}
                className="w-full py-3 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
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

          <div className="mt-6 bg-[var(--bg-secondary)] dark:bg-[var(--bg-card)]/60 border border-[var(--border-color)]/70 rounded-xl p-3 shadow-xs">
            <div className="grid grid-cols-3 gap-2">
              {KEYPAD_KEYS.map(({ digit, letters }) => (
                <button
                  key={digit}
                  type="button"
                  disabled={isVerifyingOtp}
                  onClick={() => handleDigit(digit)}
                  className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] active:scale-95 border border-[var(--border-color)]/60 rounded-lg py-3 flex flex-col items-center justify-center shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
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
                className="rounded-lg py-3 flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]/60 select-none"
              >
                + * #
              </div>

              <button
                type="button"
                disabled={isVerifyingOtp}
                onClick={() => handleDigit("0")}
                className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] active:scale-95 border border-[var(--border-color)]/60 rounded-lg py-3 flex items-center justify-center shadow-2xs transition-all cursor-pointer select-none disabled:opacity-50"
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
                className="rounded-lg py-3 flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] active:scale-95 transition-all cursor-pointer disabled:opacity-35"
              >
                <Delete className="w-5 h-5 stroke-[1.8]" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW 3: Success Screen ── */}
      {step === "success" && (
        <div className="flex-1 flex flex-col justify-between pt-16 pb-4">
          <div className="space-y-6 text-center">
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

            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-3.5 text-xs text-left shadow-xs">
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

          <div className="pt-6">
            <button
              type="button"
              onClick={() => router.push("/security")}
              className="w-full py-3.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm transition-all shadow-xs cursor-pointer text-center"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
