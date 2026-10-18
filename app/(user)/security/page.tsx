"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Check } from "lucide-react";

interface SecuritySwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
}

function SecuritySwitch({ checked, onChange }: SecuritySwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
        checked
          ? "bg-[#2BB44A]"
          : "bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-transparent"
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

  // Switch states matching Screenshot 2
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [ndprConsent, setNdprConsent] = useState(true);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggle2FA = (val: boolean) => {
    setTwoFactorEnabled(val);
    showToast(val ? "2-step authentication enabled" : "2-step authentication disabled");
  };

  const handleToggleBiometrics = (val: boolean) => {
    setBiometricsEnabled(val);
    showToast(val ? "Biometric login enabled for this device" : "Biometric login disabled");
  };

  const handleToggleNdpr = (val: boolean) => {
    setNdprConsent(val);
    showToast(val ? "NDPR consent confirmed" : "NDPR consent revoked");
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

      {/* ── Top Header matching Screenshot 2 ── */}
      <div className="flex items-center gap-4 py-3 mb-6">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/more");
            }
          }}
          aria-label="Go back"
          className="w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text-heading)]">
          Security
        </h1>
      </div>

      {/* ── Card 1: Account Security Options ── */}
      <div className="rounded-[28px] bg-white dark:bg-[#1a1b1e] border border-zinc-200/80 dark:border-zinc-800 p-6 shadow-xs space-y-6 transition-colors">
        {/* Change Password */}
        <Link
          href="/security/change-password"
          className="flex items-center justify-between group cursor-pointer"
        >
          <div>
            <h2 className="text-[14px] sm:text-[15px] font-semibold text-[var(--text-heading)] group-hover:text-[#2BB44A] transition-colors">
              Change password
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Update your password
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-500 group-hover:text-[var(--text-heading)] transition-colors" />
        </Link>

        {/* 2-Step Authentication */}
        <div className="flex items-center justify-between">
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
            onChange={handleToggle2FA}
          />
        </div>

        {/* Biometric Login */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] sm:text-[15px] font-semibold text-[var(--text-heading)]">
              Biometric login
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Face ID on this device
            </p>
          </div>
          <SecuritySwitch
            checked={biometricsEnabled}
            onChange={handleToggleBiometrics}
          />
        </div>
      </div>

      {/* ── Section Header: Data & Privacy ── */}
      <div className="mt-8 mb-3 px-1">
        <h2 className="text-[13px] font-semibold text-zinc-500 dark:text-zinc-400">
          Data & privacy
        </h2>
      </div>

      {/* ── Card 2: Data & Privacy Consent ── */}
      <div className="rounded-[28px] bg-white dark:bg-[#1a1b1e] border border-zinc-200/80 dark:border-zinc-800 p-6 shadow-xs transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-[14px] sm:text-[15px] font-semibold text-[var(--text-heading)]">
              NDPR data processing consent
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Required to use OverSite&apos;s field network.
            </p>
          </div>
          <SecuritySwitch
            checked={ndprConsent}
            onChange={handleToggleNdpr}
          />
        </div>
      </div>
    </div>
  );
}
