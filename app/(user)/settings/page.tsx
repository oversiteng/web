"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ArrowLeft,
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
} from "lucide-react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  hasMoon?: boolean;
  disabled?: boolean;
}

function ToggleSwitch({
  checked,
  onChange,
  hasMoon = false,
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
          ? hasMoon
            ? "bg-[#25272c]"
            : "bg-[#2BB44A]"
          : "bg-zinc-200 dark:bg-[#25272c] border border-zinc-300 dark:border-transparent"
      }`}
    >
      <span
        className={`pointer-events-none flex items-center justify-center h-5 w-5 rounded-full transition-transform duration-200 ease-in-out ${
          checked
            ? "translate-x-6 " + (hasMoon ? "bg-[#383d46]" : "bg-white dark:bg-[#121315] shadow-xs")
            : "translate-x-1 bg-white dark:bg-[#40434a] shadow-xs"
        }`}
      >
        {hasMoon && (
          checked ? (
            <Moon className="w-2.5 h-2.5 text-zinc-300 fill-zinc-300" />
          ) : (
            <Sun className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
          )
        )}
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

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted ? resolvedTheme === "dark" : false;

  const handleToggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-12 select-none">
      {/* ── Top Header ── */}
      <div className="relative flex items-center justify-center py-3 mb-6">
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
          className="absolute left-0 w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text-heading)]">
          Settings
        </h1>
      </div>

      {/* ── Main List Container ── */}
      <div className="space-y-1">
        {/* My Profile */}
        <Link
          href="/settings/profile"
          className="flex items-center justify-between py-3.5 px-1 rounded-xl transition-colors hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-secondary)] cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-7 h-7 flex items-center justify-center text-[var(--text-heading)]">
              <User className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-[15px] font-medium text-[var(--text-heading)]">My Profile</h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Personal info and preferences
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors" />
        </Link>

        {/* Preferences Header */}
        <div className="pt-6 pb-2 px-1">
          <span className="text-[14px] font-semibold text-[#2BB44A]">
            Preferences
          </span>
        </div>

        {/* Appearance */}
        <div className="flex items-center justify-between py-3 px-1">
          <div className="flex items-center gap-4">
            <div className="w-7 h-7 flex items-center justify-center text-[var(--text-heading)]">
              <Moon className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-[15px] font-medium text-[var(--text-heading)]">Appearance</h3>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">Dark mode</p>
            </div>
          </div>
          <ToggleSwitch
            checked={isDarkMode}
            onChange={handleToggleTheme}
            hasMoon={true}
          />
        </div>

        {/* Notifications (Accordion) */}
        <div className="py-0.5">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-full flex items-center justify-between py-3 px-1 rounded-xl hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-secondary)] transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 flex items-center justify-center text-[var(--text-heading)]">
                <Bell className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <h3 className="text-[15px] font-medium text-[var(--text-heading)]">
                  Notifications
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                  Push, email and SMS
                </p>
              </div>
            </div>
            {notificationsOpen ? (
              <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
            )}
          </button>

          {/* Expanded Notification Sub-items */}
          {notificationsOpen && (
            <div className="pl-11 pr-1 space-y-4 pt-3 pb-2 transition-all">
              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <Smartphone className="w-5 h-5 text-[var(--text-muted)] stroke-[1.8]" />
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-heading)]">
                      Push Notifications
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)]">
                      Receive push alerts
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={pushEnabled}
                  onChange={setPushEnabled}
                />
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <Mail className="w-5 h-5 text-[var(--text-muted)] stroke-[1.8]" />
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-heading)]">
                      Email Notifications
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)]">
                      Receive email alerts
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={emailEnabled}
                  onChange={setEmailEnabled}
                />
              </div>

              {/* SMS Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <MessageSquare className="w-5 h-5 text-[var(--text-muted)] stroke-[1.8]" />
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-heading)]">
                      SMS Notifications
                    </p>
                    <p className="text-[12px] text-[var(--text-muted)]">
                      Receive text message alerts
                    </p>
                  </div>
                </div>
                <ToggleSwitch
                  checked={smsEnabled}
                  onChange={setSmsEnabled}
                />
              </div>
            </div>
          )}
        </div>

        {/* Language */}
        <button
          type="button"
          onClick={() => setLanguageDrawerOpen(true)}
          className="w-full flex items-center justify-between py-3.5 px-1 rounded-xl transition-colors hover:bg-[var(--bg-secondary)] active:bg-[var(--bg-secondary)] cursor-pointer text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-7 h-7 flex items-center justify-center text-[var(--text-heading)]">
              {/* Half-filled circle icon matching design */}
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
              <h3 className="text-[15px] font-medium text-[var(--text-heading)]">Language</h3>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                {selectedLanguage}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors" />
        </button>
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
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mx-auto my-2" />

        {/* Drawer Header */}
        <h2 className="text-center text-[var(--text-heading)] text-[16px] sm:text-[17px] font-bold mt-2 mb-4">
          Select Language
        </h2>

        {/* Languages List */}
        <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
          {LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.label;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelectedLanguage(lang.label);
                  setLanguageDrawerOpen(false);
                }}
                className={`w-full flex items-center justify-between py-3 px-3 text-left rounded-xl transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--primary)]/10 dark:bg-[#2BB44A]/10 text-[#2BB44A] font-semibold"
                    : "text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                <span className="text-[15px]">
                  {lang.label}
                </span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full border-2 border-[#2BB44A] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-[#2BB44A] stroke-[3]" />
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
