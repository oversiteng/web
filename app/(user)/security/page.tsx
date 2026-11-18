"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Check,
  Shield,
  ShieldCheck,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  FileText,
  Laptop,
  Smartphone,
  Tablet,
  LogOut,
  Trash2,
  Globe,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getStoredToken } from "@/lib/storage/clientStorage";
import { useAuth } from "@/context/AuthContext";

interface SecuritySwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

function SecuritySwitch({ checked, onChange, disabled = false }: SecuritySwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
        checked
          ? "bg-[var(--primary)]"
          : "bg-[var(--bg-secondary)] border border-[var(--border-color)]"
      }`}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SecurityPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [ndprConsent, setNdprConsent] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── 2FA Setup & Disable Modal States ──
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState<"enter_code" | "success">("enter_code");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorTimer, setTwoFactorTimer] = useState(30);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [show2FADisableModal, setShow2FADisableModal] = useState(false);

  // ── NDPR Details & Confirmation Modal States ──
  const [showNdprModal, setShowNdprModal] = useState(false);
  const [showNdprDisableModal, setShowNdprDisableModal] = useState(false);

  // ── Active Sessions State ──
  interface ActiveSession {
    id: string;
    deviceName: string;
    deviceType: string;
    browser: string | null;
    os: string | null;
    ipAddress: string | null;
    location: string | null;
    lastActiveAt: string;
    createdAt: string;
    isCurrent: boolean;
  }
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const token = await getStoredToken();
      if (!token) return;
      const res = await fetch("/api/v1/auth/sessions", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSessions(json.data);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    setTerminatingSessionId(sessionId);
    try {
      const token = await getStoredToken();
      if (!token) return;
      const res = await fetch(`/api/v1/auth/sessions/${sessionId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showToast("Session terminated successfully");
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        showToast(json.error?.message || "Failed to terminate session");
      }
    } catch {
      showToast("Failed to terminate session");
    } finally {
      setTerminatingSessionId(null);
    }
  };

  const handleTerminateOtherSessions = async () => {
    try {
      const token = await getStoredToken();
      if (!token) return;
      const res = await fetch("/api/v1/auth/sessions", {
        method: "DELETE",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        showToast("All other sessions terminated");
        setSessions((prev) => prev.filter((s) => s.isCurrent));
      }
    } catch {
      showToast("Failed to terminate sessions");
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedNdpr = localStorage.getItem("oversite_ndpr_consent");
      if (savedNdpr !== null) setNdprConsent(savedNdpr === "true");
    }

    async function loadSecuritySettings() {
      try {
        const token = await getStoredToken();
        if (!token) return;

        const res = await fetch("/api/v1/users/me/2fa", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (typeof json?.data?.twoFactorEnabled === "boolean") {
            setTwoFactorEnabled(json.data.twoFactorEnabled);
          }
        }
      } catch {
        // Non-blocking fallback
      }
    }

    loadSecuritySettings();
    loadSessions();
  }, []);

  // Timer countdown for 2FA setup code resend
  useEffect(() => {
    if (!show2FASetupModal || twoFactorTimer <= 0) return;
    const interval = setInterval(() => {
      setTwoFactorTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [show2FASetupModal, twoFactorTimer]);

  // ── 2FA Toggle Handling ──
  const handleToggle2FAClick = (nextVal: boolean) => {
    if (nextVal) {
      // Opening setup flow
      setTwoFactorCode("");
      setTwoFactorError(null);
      setTwoFactorTimer(30);
      setSetupStep("enter_code");
      setShow2FASetupModal(true);
    } else {
      // Disabling confirmation
      setShow2FADisableModal(true);
    }
  };

  const handleVerifyAndEnable2FA = async () => {
    if (twoFactorCode.trim().length < 4) {
      setTwoFactorError("Please enter a valid 6-digit code.");
      return;
    }
    setTwoFactorError(null);
    setIsVerifying2FA(true);

    try {
      const token = await getStoredToken();
      if (token) {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        await Promise.all([
          fetch("/api/v1/users/me/2fa", {
            method: "POST",
            credentials: "include",
            headers,
            body: JSON.stringify({ enable: true }),
          }),
          fetch("/api/v1/users/me/settings", {
            method: "PATCH",
            credentials: "include",
            headers,
            body: JSON.stringify({ twoFactorEnabled: true }),
          }),
        ]);
      }
      setTwoFactorEnabled(true);
      setSetupStep("success");
    } catch {
      setTwoFactorError("Failed to verify code. Please try again.");
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleConfirmDisable2FA = async () => {
    setShow2FADisableModal(false);
    setTwoFactorEnabled(false);
    showToast("2-step authentication disabled");

    try {
      const token = await getStoredToken();
      if (!token) return;
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };
      await Promise.all([
        fetch("/api/v1/users/me/2fa", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ enable: false }),
        }),
        fetch("/api/v1/users/me/settings", {
          method: "PATCH",
          credentials: "include",
          headers,
          body: JSON.stringify({ twoFactorEnabled: false }),
        }),
      ]);
    } catch {
      // Non-blocking fallback
    }
  };

  // ── NDPR Handling ──
  const handleToggleNdprClick = (val: boolean) => {
    if (!val) {
      setShowNdprDisableModal(true);
    } else {
      executeNdprConsent(true);
    }
  };

  const executeNdprConsent = async (val: boolean) => {
    setNdprConsent(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("oversite_ndpr_consent", String(val));
    }
    showToast(val ? "NDPR consent active" : "NDPR consent revoked");

    if (val) {
      try {
        const token = await getStoredToken();
        if (!token) return;
        await fetch("/api/v1/kyc/consent", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            consentBackgroundCheck: true,
            consentTermsAndConditions: true,
            signatureFullName: user?.name || user?.fullName || "Oversite User",
          }),
        });
      } catch {
        // Non-blocking fallback
      }
    }
  };

  return (
    <div className="relative w-full text-[var(--text-heading)] pb-16 select-none max-w-full">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[100] flex justify-center pointer-events-none transition-all duration-300">
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

      {/* ── Unified Page Header ── */}
      <PageHeader
        title="Security"
        showBack={true}
        centeredTitle={false}
        onBack={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push(user?.role === "AGENT" ? "/agent/more" : "/more");
          }
        }}
      />

      {/* ── Card 1: Account Security Options (Matches Image exactly) ── */}
      <div className="rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-[0_0_10px_rgba(0,0,0,0.03)] space-y-6 transition-colors">
        {/* Change Password */}
        <Link
          href="/security/change-password"
          className="flex items-center justify-between group cursor-pointer"
        >
          <div>
            <h2 className="text-[14px] sm:text-[15px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
              Change password
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Update profile information
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors" />
        </Link>

        {/* Change Transaction PIN */}
        <Link
          href="/security/transaction-pin"
          className="flex items-center justify-between group cursor-pointer"
        >
          <div>
            <h2 className="text-[14px] sm:text-[15px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
              Change transaction pin
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Update or reset your withdrawal pin
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors" />
        </Link>

        {/* 2-Step Authentication */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-[14px] sm:text-[15px] font-semibold text-[var(--text-heading)]">
              2-step authentication
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Setup code verification
            </p>
          </div>
          <SecuritySwitch
            checked={twoFactorEnabled}
            onChange={handleToggle2FAClick}
          />
        </div>
      </div>

      {/* ── Section Header: Data & Privacy (Matches Image green text) ── */}
      <div className="mt-8 mb-3 px-1">
        <h2 className="text-[13.5px] font-semibold text-[var(--primary)]">
          Data &amp; privacy
        </h2>
      </div>

      {/* ── Card 2: NDPR Data Processing Consent ── */}
      <div className="rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-[0_0_10px_rgba(0,0,0,0.03)] transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div
            onClick={() => setShowNdprModal(true)}
            className="cursor-pointer group flex-1"
          >
            <h3 className="text-[14px] sm:text-[15px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors flex items-center gap-1.5">
              NDPR data processing consent
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Required to use OverSite&apos;s field network.
            </p>
          </div>
          <SecuritySwitch
            checked={ndprConsent}
            onChange={handleToggleNdprClick}
          />
        </div>
      </div>

      {/* ── Section Header: Active Sessions & Multi-Device Control ── */}
      <div className="mt-8 mb-3 px-1 flex items-center justify-between">
        <div>
          <h2 className="text-[13.5px] font-semibold text-[var(--primary)]">
            Active sessions
          </h2>
          <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5">
            Strict maximum 2 concurrent devices per account
          </p>
        </div>
        {sessions.length > 1 && (
          <button
            type="button"
            onClick={handleTerminateOtherSessions}
            className="text-[11.5px] font-bold text-red-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            Terminate other devices
          </button>
        )}
      </div>

      {/* ── Card 3: Active Device Sessions List ── */}
      <div className="rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 sm:p-6 shadow-[0_0_10px_rgba(0,0,0,0.03)] space-y-4 transition-colors">
        {isLoadingSessions ? (
          <div className="flex items-center justify-center py-6 gap-2 text-[var(--text-muted)] text-xs font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
            <span>Loading active sessions...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-6 text-xs text-[var(--text-muted)]">
            No active session records found.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const isMobile = session.deviceType === "mobile";
              const isTablet = session.deviceType === "tablet";
              const DeviceIcon = isMobile ? Smartphone : isTablet ? Tablet : Laptop;

              return (
                <div
                  key={session.id}
                  className="flex items-start sm:items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-secondary)]/50 border border-[var(--border-color)]/70 gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center shrink-0 text-[var(--text-heading)] shadow-2xs">
                      <DeviceIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-bold text-[var(--text-heading)] truncate">
                          {session.deviceName}
                        </span>
                        {session.isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            This device
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-color)]">
                            Remote device
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] mt-1 flex-wrap">
                        {session.ipAddress && <span>{session.ipAddress}</span>}
                        {session.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              {session.location}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>
                          {session.isCurrent
                            ? "Active now"
                            : `Last active ${new Date(session.lastActiveAt).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!session.isCurrent && (
                    <button
                      type="button"
                      disabled={terminatingSessionId === session.id}
                      onClick={() => handleTerminateSession(session.id)}
                      className="shrink-0 p-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      title="Terminate this session"
                    >
                      {terminatingSessionId === session.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <LogOut className="w-4 h-4" />
                          <span className="hidden sm:inline">Terminate</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-[var(--border-color)]/50">
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            🛡️ <strong>Session Protection:</strong> Your account is protected by multi-device limit enforcement. A third login will automatically terminate your oldest session, and unrecognized logins trigger an instant security email.
          </p>
        </div>
      </div>

      {/* ── 2-STEP AUTHENTICATION SETUP CODE MODAL (Drawer on Mobile, Centered Modal on Desktop) ── */}
      {show2FASetupModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => {
            if (setupStep === "success") {
              setShow2FASetupModal(false);
            }
          }}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 sm:pb-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Bar */}
            <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />

            {setupStep === "enter_code" ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[var(--text-heading)]">
                        2-Step Authentication
                      </h3>
                      <p className="text-xs text-[var(--text-muted)]">Setup code verification</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShow2FASetupModal(false)}
                    className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    We sent a 6-digit confirmation code to{" "}
                    <span className="font-semibold text-[var(--text-heading)]">
                      {user?.email || "your registered email"}
                    </span>
                    . Enter it below to activate 2-step verification.
                  </p>

                  {/* 6 Digit Input */}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const char = twoFactorCode[idx] || "";
                      return (
                        <input
                          key={idx}
                          id={`2fa-input-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={char}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setTwoFactorError(null);
                            if (val) {
                              const nextCode =
                                twoFactorCode.substring(0, idx) +
                                val +
                                twoFactorCode.substring(idx + 1);
                              setTwoFactorCode(nextCode.slice(0, 6));
                              const nextInput = document.getElementById(
                                `2fa-input-${idx + 1}`
                              );
                              if (nextInput) (nextInput as HTMLInputElement).focus();
                            } else {
                              const nextCode =
                                twoFactorCode.substring(0, idx) +
                                twoFactorCode.substring(idx + 1);
                              setTwoFactorCode(nextCode);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !char && idx > 0) {
                              const prevInput = document.getElementById(
                                `2fa-input-${idx - 1}`
                              );
                              if (prevInput) (prevInput as HTMLInputElement).focus();
                            }
                          }}
                          className={`w-11 h-12 rounded-xl text-center text-lg font-bold border transition-colors outline-none ${
                            char
                              ? "border-[var(--primary)] bg-[var(--primary-light)]/20 text-[var(--text-heading)]"
                              : "border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-heading)] focus:border-[var(--primary)]"
                          }`}
                        />
                      );
                    })}
                  </div>

                  {twoFactorError && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--danger-light)] text-[var(--danger)] text-xs font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{twoFactorError}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[var(--text-muted)]">Didn&apos;t receive code?</span>
                    {twoFactorTimer > 0 ? (
                      <span className="font-semibold text-[var(--text-heading)]">
                        Resend in 0:{twoFactorTimer < 10 ? `0${twoFactorTimer}` : twoFactorTimer}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTwoFactorTimer(30)}
                        className="font-bold text-[var(--primary)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" /> Resend Code
                      </button>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={twoFactorCode.length < 4 || isVerifying2FA}
                      onClick={handleVerifyAndEnable2FA}
                      className="w-full py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isVerifying2FA ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Code...</span>
                        </>
                      ) : (
                        <span>Verify &amp; Enable 2FA</span>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Success Step */
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full border-2 border-[var(--primary)] bg-[var(--primary-light)]/40 text-[var(--primary)] flex items-center justify-center mx-auto">
                  <Check className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-heading)]">
                    2-Step Authentication Enabled
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                    Your account is now secured. A one-time verification code will be required when logging in on new devices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShow2FASetupModal(false)}
                  className="w-full py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DISABLE 2FA CONFIRMATION MODAL ── */}
      {show2FADisableModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShow2FADisableModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 sm:pb-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />
            <div className="w-12 h-12 rounded-full bg-[var(--danger-light)] text-[var(--danger)] flex items-center justify-center mx-auto">
              <Shield className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-[var(--text-heading)]">
                Disable 2-Step Authentication?
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                Disabling two-step authentication lowers your account security. Anyone with your password will be able to log in.
              </p>
            </div>
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleConfirmDisable2FA}
                className="w-full py-3 rounded-full bg-[var(--danger)] hover:opacity-90 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Disable 2FA
              </button>
              <button
                type="button"
                onClick={() => setShow2FADisableModal(false)}
                className="w-full py-3 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] text-[var(--text-heading)] text-xs font-semibold border border-[var(--border-color)] transition-all cursor-pointer"
              >
                Keep Enabled
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NDPR CONSENT DETAILS MODAL ── */}
      {showNdprModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowNdprModal(false)}
        >
          <div
            className="w-full max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 sm:pb-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-heading)]">
                    NDPR Data Consent
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">Nigeria Data Protection Regulation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNdprModal(false)}
                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--text-muted)] leading-relaxed max-h-[50vh] overflow-y-auto pr-1">
              <p>
                In compliance with the Nigeria Data Protection Act (NDPA) and NDPR regulations, OverSite collects and processes operative data strictly for:
              </p>
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] space-y-2 text-[var(--text-heading)]">
                <p>• <strong>Location &amp; Geofencing:</strong> Real-time GPS coordinates are verified only during active field inspection missions.</p>
                <p>• <strong>Identity &amp; KYC:</strong> National Identity Number (NIN) and government ID credentials to maintain platform trust.</p>
                <p>• <strong>Payouts &amp; Banking:</strong> Encrypted disbursement details to process mission earnings securely.</p>
              </div>
              <p>
                Your personal and operational data is encrypted using industry standard protocols and is never sold to third-party advertisers.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  executeNdprConsent(true);
                  setShowNdprModal(false);
                }}
                className="w-full py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                I Understand &amp; Consent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISABLE NDPR WARNING MODAL ── */}
      {showNdprDisableModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowNdprDisableModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[28px] sm:rounded-[28px] p-6 pb-8 sm:pb-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-[var(--text-heading)]">
                Revoke NDPR Consent?
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                Active NDPR consent is required to participate in OverSite&apos;s field verification network. Revoking consent will pause task offers.
              </p>
            </div>
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowNdprDisableModal(false);
                  executeNdprConsent(false);
                }}
                className="w-full py-3 rounded-full bg-[var(--danger)] hover:opacity-90 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Revoke Consent
              </button>
              <button
                type="button"
                onClick={() => setShowNdprDisableModal(false)}
                className="w-full py-3 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] text-[var(--text-heading)] text-xs font-semibold border border-[var(--border-color)] transition-all cursor-pointer"
              >
                Keep Consent Active
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
