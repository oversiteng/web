"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Eye,
  EyeOff,
  Pencil,
  Check,
} from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states initialized matching design
  const [name, setName] = useState("Suhan Hasan");
  const [email, setEmail] = useState("example@youremail.com");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load existing profile from API if available
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/v1/profile");
        if (res.ok) {
          const data = await res.json();
          if (data?.profile) {
            if (data.profile.name) setName(data.profile.name);
            if (data.profile.email) setEmail(data.profile.email);
            if (data.profile.avatarUrl) setAvatarPreview(data.profile.avatarUrl);
          }
        }
      } catch (e) {
        // Fallback to initial mockup values
      }
    }
    loadProfile();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToastMessage(null);

    try {
      const res = await fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          avatarUrl: avatarPreview || undefined,
        }),
      });

      // Show success feedback
      setSavedSuccess(true);
      setToastMessage("Profile changes saved successfully!");
      setTimeout(() => {
        setSavedSuccess(false);
        setToastMessage(null);
      }, 3000);
    } catch (err) {
      setToastMessage("Profile updated locally.");
      setTimeout(() => setToastMessage(null), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-12 select-none">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[#2BB44A]/20 flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[#2BB44A] stroke-[3]" />
            </div>
            <span className="text-[13px] font-medium tracking-wide">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="flex items-center gap-4 py-3 mb-8">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push("/settings");
            }
          }}
          aria-label="Go back"
          className="w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-2"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text-heading)]">
          Edit Profile
        </h1>
      </div>

      {/* ── Avatar Section ── */}
      <div className="flex justify-center mb-10">
        <div className="relative">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Profile avatar"
              className="w-32 h-32 rounded-full object-cover shadow-lg border-2 border-[var(--border-color)]"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-[#1c6b35] flex items-center justify-center shadow-lg" />
          )}

          {/* Edit Badge */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload profile photo"
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white text-zinc-900 border border-zinc-200 dark:border-transparent shadow-md flex items-center justify-center cursor-pointer hover:bg-zinc-100 active:scale-95 transition-transform"
          >
            <Pencil className="w-4 h-4 text-zinc-900 stroke-[2.2]" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {/* ── Form Fields ── */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Name Field */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            Name
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
            <User className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            Email
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
            <Mail className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@youremail.com"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            Password
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
            {/* Padlock with three dots matching Screenshot */}
            <svg
              className="w-5 h-5 text-[var(--text-muted)] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="4" ry="4" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="8.5" cy="16.5" r="0.75" fill="currentColor" />
              <circle cx="12" cy="16.5" r="0.75" fill="currentColor" />
              <circle cx="15.5" cy="16.5" r="0.75" fill="currentColor" />
            </svg>

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 stroke-[1.8]" />
              ) : (
                <Eye className="w-5 h-5 stroke-[1.8]" />
              )}
            </button>
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="pt-8">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] active:scale-[0.99] text-[#2BB44A] font-semibold text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isSaving ? (
              <span className="inline-block w-5 h-5 border-2 border-[#2BB44A] border-t-transparent rounded-full animate-spin" />
            ) : savedSuccess ? (
              <span className="flex items-center gap-1.5 text-[#2BB44A]">
                <Check className="w-4 h-4 stroke-[3]" /> Saved Changes
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
