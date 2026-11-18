"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { PageHeader } from "@/components/ui/PageHeader";
import { getStoredToken } from "@/lib/storage/clientStorage";
import {
  User,
  Moon,
  Sun,
  Bell,
  Smartphone,
  Mail,
  MessageSquare,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Check,
  Scan,
} from "lucide-react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  hasThemeIcon?: boolean;
  disabled?: boolean;
}

function ToggleSwitch({
  checked,
  onChange,
  hasThemeIcon = false,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
        checked
          ? "bg-[var(--primary)]"
          : "bg-[var(--bg-secondary)] border border-[var(--border-color)]"
      }`}
    >
      <span
        className={`pointer-events-none flex items-center justify-center h-5 w-5 rounded-full transition-transform duration-200 ease-in-out shadow-xs ${
          checked
            ? "translate-x-6 bg-white text-[var(--primary)]"
            : "translate-x-1 bg-white dark:bg-[var(--bg-card)] text-[var(--text-muted)]"
        }`}
      >
        {hasThemeIcon &&
          (checked ? (
            <Moon className="w-2.5 h-2.5 fill-current text-[var(--primary)]" />
          ) : (
            <Sun className="w-2.5 h-2.5 text-[var(--text-muted)]" />
          ))}
      </span>
    </button>
  );
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ja", label: "日本語" },
  { code: "zh", label: "中文" },
  { code: "ru", label: "Русский" },
];

export default function SettingsPage() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // States
  const [notificationsOpen, setNotificationsOpen] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [languageDrawerOpen, setLanguageDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    setMounted(true);

    async function loadSettings() {
      try {
        const token = await getStoredToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/users/me/settings", {
          credentials: "include",
          headers,
        });
        if (res.ok) {
          const json = await res.json();
          const data = json?.data;
          if (data?.notifications) {
            setPushEnabled(Boolean(data.notifications.push));
            setEmailEnabled(Boolean(data.notifications.email));
            setSmsEnabled(Boolean(data.notifications.sms));
          }
          if (data?.language) {
            const matched = LANGUAGES.find(
              (l) => l.code === data.language || l.label === data.language
            );
            if (matched) setSelectedLanguage(matched.label);
          }
        }
      } catch {
        // Keep local defaults
      }
    }

    loadSettings();
  }, []);

  const persistSettings = async (patch: Record<string, unknown>) => {
    try {
      const token = await getStoredToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/v1/users/me/settings", {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify(patch),
      });
    } catch {
      // Non-blocking fallback
    }
  };

  const isDarkMode = mounted ? resolvedTheme === "dark" : false;

  const handleToggleTheme = () => {
    const nextTheme = isDarkMode ? "light" : "dark";
    setTheme(nextTheme);
    persistSettings({ theme: nextTheme });
  };

  const handleNotificationToggle = (
    key: "push" | "email" | "sms",
    nextVal: boolean
  ) => {
    const updated = {
      push: key === "push" ? nextVal : pushEnabled,
      email: key === "email" ? nextVal : emailEnabled,
      sms: key === "sms" ? nextVal : smsEnabled,
    };
    if (key === "push") setPushEnabled(nextVal);
    if (key === "email") setEmailEnabled(nextVal);
    if (key === "sms") setSmsEnabled(nextVal);
    persistSettings({ notifications: updated });
  };

  const handleSelectLanguage = (lang: { code: string; label: string }) => {
    setSelectedLanguage(lang.label);
    setLanguageDrawerOpen(false);
    persistSettings({ language: lang.code });
    showToast(`Language updated to ${lang.label}`);
  };

  return (
    <div className="relative w-full text-[var(--text-heading)] pb-12 select-none">
      {/* ── Toast Banner ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
            </div>
            <span className="text-[13px] font-medium truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ── Unified Page Header ── */}
      <PageHeader
        title="Settings"
        showBack={true}
        onBack={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/more");
          }
        }}
      />

      {/* ── Top Profile Card ── */}
      <Link
        href="/settings/profile"
        className="flex items-center justify-between p-4 rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-[0_0_10px_rgba(0,0,0,0.03)] hover:border-[var(--primary-border)] transition-all cursor-pointer group mb-6"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 flex items-center justify-center text-[var(--text-heading)]">
            <User className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
              My Profile
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Personal info and preferences
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors" />
      </Link>

      {/* ── Preferences Section Label ── */}
      <div className="pb-3 px-1">
        <span className="text-[13.5px] font-semibold text-[var(--primary)]">
          Preferences
        </span>
      </div>

      {/* ── Grouped Preferences Card (Matches Screenshot 6) ── */}
      <div className="relative overflow-hidden rounded-[28px] bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-[0_0_10px_rgba(0,0,0,0.03)] space-y-5">
        {/* Subtle Oversite Watermark */}
        <div
          aria-hidden="true"
          className="absolute -top-6 -right-8 w-52 h-52 opacity-[0.07] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundColor: "var(--primary)",
            maskImage: "url(/assets/nav-icons/logo.svg)",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskImage: "url(/assets/nav-icons/logo.svg)",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
          }}
        />

        <div className="relative z-10 space-y-5">
          {/* Appearance */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-7 h-7 flex items-center justify-center text-[var(--text-heading)]">
                {isDarkMode ? (
                  <Moon className="w-5 h-5 stroke-[1.8]" />
                ) : (
                  <Sun className="w-5 h-5 stroke-[1.8]" />
                )}
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--text-heading)]">
                  Appearance
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  {isDarkMode ? "Dark mode" : "Light mode"}
                </p>
              </div>
            </div>
            <ToggleSwitch
              checked={isDarkMode}
              onChange={handleToggleTheme}
              hasThemeIcon={true}
            />
          </div>

          {/* Notifications (Accordion) */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="w-full flex items-center justify-between text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-7 h-7 flex items-center justify-center text-[var(--text-heading)]">
                  <Bell className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-[var(--text-heading)]">
                    Notifications
                  </h3>
                  <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                    Push, email and SMS
                  </p>
                </div>
              </div>
              {notificationsOpen ? (
                <ChevronUp className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors" />
              )}
            </button>

            {notificationsOpen && (
              <div className="pl-8 space-y-4 pt-2">
                {/* Push Notifications */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-[var(--text-muted)] stroke-[1.8] shrink-0" />
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--text-heading)]">
                        Push Notifications
                      </p>
                      <p className="text-[12px] text-[var(--text-muted)]">
                        Receive push alerts
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={pushEnabled}
                    onChange={(val) => handleNotificationToggle("push", val)}
                  />
                </div>

                {/* Email Notifications */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[var(--text-muted)] stroke-[1.8] shrink-0" />
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--text-heading)]">
                        Email Notifications
                      </p>
                      <p className="text-[12px] text-[var(--text-muted)]">
                        Receive email alerts
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={emailEnabled}
                    onChange={(val) => handleNotificationToggle("email", val)}
                  />
                </div>

                {/* SMS Notifications */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-[var(--text-muted)] stroke-[1.8] shrink-0" />
                    <div>
                      <p className="text-[14px] font-semibold text-[var(--text-heading)]">
                        SMS Notifications
                      </p>
                      <p className="text-[12px] text-[var(--text-muted)]">
                        Receive text message alerts
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    checked={smsEnabled}
                    onChange={(val) => handleNotificationToggle("sms", val)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Language */}
          <button
            type="button"
            onClick={() => setLanguageDrawerOpen(true)}
            className="w-full flex items-center justify-between pt-1 cursor-pointer text-left group"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-7 h-7 flex items-center justify-center text-[var(--text-heading)]">
                <svg
                  className="w-5 h-5 text-[var(--text-heading)]"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
                </svg>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                  Language
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  {selectedLanguage}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors" />
          </button>
        </div>
      </div>

      {/* ── Select Language Bottom Sheet Drawer ── */}
      {languageDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs z-[65] transition-opacity"
          onClick={() => setLanguageDrawerOpen(false)}
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-[70] max-w-full md:max-w-[600px] xl:max-w-[650px] mx-auto bg-[var(--bg-card)] rounded-t-[28px] border-t border-[var(--border-color)] px-6 pt-3 pb-8 transition-transform duration-300 ease-out shadow-2xl ${
          languageDrawerOpen
            ? "translate-y-0"
            : "translate-y-full pointer-events-none"
        }`}
      >
        <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mx-auto my-2" />
        <h2 className="text-center text-[var(--text-heading)] text-[16px] sm:text-[17px] font-bold mt-2 mb-4">
          Select Language
        </h2>

        <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.label;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelectLanguage(lang)}
                className={`w-full flex items-center justify-between py-3 px-3 text-left rounded-xl transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--primary-light)] text-[var(--primary)] font-semibold"
                    : "text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                <span className="text-[15px]">{lang.label}</span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full border-2 border-[var(--primary)] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
