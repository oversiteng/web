"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Check,
  Lock,
  MapPin,
  Briefcase,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken } from "@/lib/storage/clientStorage";
import { ResponsiveSelect } from "@/components/ui/ResponsiveSelect";
import { getAgentTypeLabel } from "@/lib/constants/agentTypes";

const TITLE_OPTIONS = [
  "Mr/Mrs",
  "Mr.",
  "Mrs.",
  "Ms.",
  "Dr.",
  "Engr.",
  "Barr.",
  "Chief",
];

const PHONE_CODES = ["+234", "+44", "+1", "+233", "+27", "+971"];

const RESIDENCE_STATUS_OPTIONS = [
  "Resident",
  "Diaspora",
  "Citizen",
  "Temporary Resident",
  "Expatriate",
];

function parsePhoneParts(rawPhone?: string | null): { code: string; number: string } {
  if (!rawPhone) return { code: "+234", number: "" };
  const cleaned = rawPhone.trim();
  const matchedCode = PHONE_CODES.find((c) => cleaned.startsWith(c));
  if (matchedCode) {
    return {
      code: matchedCode,
      number: cleaned.slice(matchedCode.length).trim(),
    };
  }
  if (cleaned.startsWith("234") && cleaned.length > 10) {
    return { code: "+234", number: cleaned.slice(3).trim() };
  }
  return { code: "+234", number: cleaned };
}

function getWorkPrefsStorageKey(userId?: string | null) {
  return userId ? `oversite_agent_work_prefs_${userId}` : "oversite_agent_work_prefs";
}

export default function PersonalDetailsPage() {
  const router = useRouter();
  const { user: authUser, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialPhone = parsePhoneParts(authUser?.phone);

  // Identity & Contact
  const [title, setTitle] = useState(authUser?.title || "Mr/Mrs");
  const [name, setName] = useState(authUser?.name || authUser?.fullName || "");
  const [email, setEmail] = useState(authUser?.email || "");
  const [phoneCode, setPhoneCode] = useState(initialPhone.code);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.number);
  // Occupation / Profession is independent of Agent Type
  const [occupation, setOccupation] = useState(authUser?.occupation || "");

  // Location & Residence
  const [address, setAddress] = useState(authUser?.address || "");
  const [location, setLocation] = useState(authUser?.location || "");
  const [state, setState] = useState(authUser?.state || "");
  const [country, setCountry] = useState(authUser?.country || "");
  const [residence, setResidence] = useState(authUser?.residence || "");

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    authUser?.avatarUrl || authUser?.avatar || null
  );
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);

  // Agent "Where you work" summary state — starts empty (no mock prefill)
  const [coverageAreas, setCoverageAreas] = useState<string[]>([]);
  const [acceptWeekendTasks, setAcceptWeekendTasks] = useState(true);

  const workAgentType = getAgentTypeLabel(
    (authUser as any)?.agentProfile?.tier || (authUser as any)?.agentTier || null
  );

  useEffect(() => {
    const syncWorkPrefs = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem(getWorkPrefsStorageKey(authUser?.id));
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.coverageAreas)) {
            setCoverageAreas(parsed.coverageAreas);
          }
          if (typeof parsed.acceptWeekendTasks === "boolean") {
            setAcceptWeekendTasks(parsed.acceptWeekendTasks);
          }
          return;
        }
      } catch {
        // Fallback to location
      }
      if (authUser?.location && authUser.location.trim().length > 0) {
        const split = authUser.location
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        setCoverageAreas(split);
      } else {
        setCoverageAreas([]);
      }
    };
    syncWorkPrefs();
    window.addEventListener("oversite:coverage-updated", syncWorkPrefs);
    return () => window.removeEventListener("oversite:coverage-updated", syncWorkPrefs);
  }, [authUser?.id, authUser?.location]);

  // Sync state if AuthContext finishes hydrating or updates
  useEffect(() => {
    if (authUser) {
      if (authUser.name || authUser.fullName) {
        setName(authUser.name || authUser.fullName || "");
      }
      if (authUser.email) setEmail(authUser.email);
      if (authUser.title) setTitle(authUser.title);
      if (authUser.phone) {
        const parsed = parsePhoneParts(authUser.phone);
        setPhoneCode(parsed.code);
        setPhoneNumber(parsed.number);
      }
      if (authUser.occupation) {
        setOccupation(authUser.occupation);
      }
      if (authUser.address) setAddress(authUser.address);
      if (authUser.location) setLocation(authUser.location);
      if (authUser.state) setState(authUser.state);
      if (authUser.country) setCountry(authUser.country);
      if (authUser.residence) setResidence(authUser.residence);
      if (authUser.avatarUrl || authUser.avatar) {
        setAvatarPreview(authUser.avatarUrl || authUser.avatar || null);
      }
    }
  }, [authUser]);

  // Load latest authoritative profile from API
  useEffect(() => {
    let isCancelled = false;

    async function loadProfile() {
      try {
        const token = await getStoredToken();
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/users/me", { credentials: "include", headers });
        if (res.status === 401) {
          await refreshUser();
          return;
        }

        if (res.ok && !isCancelled) {
          const data = await res.json();
          const p = data?.data || data?.profile || data;
          if (p) {
            if (p.name || p.fullName) setName(p.name || p.fullName);
            if (p.email) setEmail(p.email);
            if (p.title) setTitle(p.title);
            if (p.phone) {
              const parsed = parsePhoneParts(p.phone);
              setPhoneCode(parsed.code);
              setPhoneNumber(parsed.number);
            }
            if (p.occupation) setOccupation(p.occupation);
            if (p.address) setAddress(p.address);
            if (p.location) setLocation(p.location);
            if (p.state) setState(p.state);
            if (p.country) setCountry(p.country);
            if (p.residence) setResidence(p.residence);
            if (p.avatarUrl) setAvatarPreview(p.avatarUrl);
          }
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      }
    }

    loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [refreshUser]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToastMessage("Please select a valid image file.");
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage("Image size must be less than 5MB.");
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    setSelectedAvatarFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatarToS3 = async (file: File, token: string | null): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const directHeaders: Record<string, string> = {};
      if (token) directHeaders["Authorization"] = `Bearer ${token}`;

      const directRes = await fetch("/api/v1/user/avatar", {
        method: "POST",
        credentials: "include",
        headers: directHeaders,
        body: formData,
      });

      if (directRes.ok) {
        const json = await directRes.json();
        if (json?.data?.avatarUrl) {
          return json.data.avatarUrl;
        }
      }
    } catch (directErr) {
      console.warn("Direct upload fallback to presigned S3 URL:", directErr);
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const presignRes = await fetch("/api/v1/user/avatar/presign", {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({
        contentType: file.type || "image/jpeg",
        fileExtension: file.name.split(".").pop() || "jpg",
      }),
    });

    if (!presignRes.ok) {
      const errData = await presignRes.json().catch(() => ({}));
      throw new Error(errData?.error || "Could not acquire AWS S3 upload credentials");
    }

    const { data } = await presignRes.json();
    const { url, publicUrl } = data;

    const uploadRes = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "image/jpeg",
      },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error("Failed to upload avatar to AWS S3 bucket");
    }

    return publicUrl;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setToastMessage(null);

    try {
      const token = await getStoredToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let finalAvatarUrl = avatarPreview;

      if (selectedAvatarFile) {
        try {
          finalAvatarUrl = await uploadAvatarToS3(selectedAvatarFile, token);
        } catch (s3Err: any) {
          console.error("AWS S3 upload failed:", s3Err);
          setIsSaving(false);
          setToastMessage(s3Err?.message || "Failed to upload avatar to AWS S3");
          return;
        }
      }

      const combinedPhone = phoneNumber.trim()
        ? `${phoneCode} ${phoneNumber.trim()}`
        : undefined;

      const res = await fetch("/api/v1/users/me", {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({
          name,
          phone: combinedPhone,
          title,
          address,
          location,
          occupation,
          state,
          country,
          residence,
          avatarUrl: finalAvatarUrl || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedData = await res.json();
      const updatedUser = updatedData?.data || updatedData?.profile;
      if (updatedUser?.avatarUrl) {
        setAvatarPreview(updatedUser.avatarUrl);
      }
      setSelectedAvatarFile(null);

      await refreshUser();

      setSavedSuccess(true);
      setToastMessage("Personal details saved successfully!");
      setTimeout(() => {
        setSavedSuccess(false);
        setIsEditingPersonal(false);
        setToastMessage(null);
      }, 1500);
    } catch {
      setToastMessage("Failed to save changes.");
      setTimeout(() => setToastMessage(null), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const initials =
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AU";

  const isAgent = authUser?.role === "AGENT";
  const formattedPhone = phoneNumber ? `${phoneCode} ${phoneNumber}` : "Not set";
  const formattedLocation = [location, state, country].filter(Boolean).join(", ") || "Not set";

  if (!isEditingPersonal) {
    return (
      <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-24 select-none">
        {/* ── Toast Notification Banner ── */}
        {toastMessage && (
          <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
            <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
              <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
              </div>
              <span className="text-[13px] font-medium tracking-wide">{toastMessage}</span>
            </div>
          </div>
        )}

        {/* ── Top Header (Deterministic navigation to prevent loop with /agent/coverage) ── */}
        <div className="flex items-center gap-3 py-3 mb-4">
          <button
            type="button"
            onClick={() => {
              router.push(isAgent ? "/agent/more" : "/settings");
            }}
            aria-label="Go back"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer -ml-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] sm:text-[18px] font-bold text-[var(--text-heading)]">
            Profile
          </h1>
        </div>

        {/* ── Avatar & Identity Header ── */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Profile avatar"
                className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-[var(--border-color)]"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[var(--info-light)] flex items-center justify-center text-[var(--info)] font-bold text-2xl">
                {initials}
              </div>
            )}
          </div>
          <h2 className="text-[17px] font-bold text-[var(--text-heading)]">
            {name || "User"}
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{email}</p>
        </div>

        <div className="space-y-5">
          {/* ── Section 1: Personal Details ── */}
          <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[var(--text-heading)]">
                Personal details
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingPersonal(true)}
                aria-label="Edit personal details"
                className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--primary-light)] text-[var(--text-heading)] hover:text-[var(--primary)] flex items-center justify-center transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-[13px] divide-y divide-[var(--border-color)]/60">
              <div className="flex items-center justify-between gap-4 pt-1">
                <span className="text-[var(--text-muted)]">Full name</span>
                <span className="font-semibold text-[var(--text-heading)] text-right">
                  {title && title !== "Mr/Mrs" ? `${title} ` : ""}
                  {name || "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-3">
                <span className="text-[var(--text-muted)]">Email</span>
                <span className="font-semibold text-[var(--text-heading)] text-right truncate max-w-[200px]">
                  {email || "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-3">
                <span className="text-[var(--text-muted)]">Phone</span>
                <span className="font-semibold text-[var(--text-heading)] text-right">
                  {formattedPhone}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-3">
                <span className="text-[var(--text-muted)]">Occupation / Profession</span>
                <span className="font-semibold text-[var(--text-heading)] text-right">
                  {occupation || "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-3">
                <span className="text-[var(--text-muted)]">Address</span>
                <span className="font-semibold text-[var(--text-heading)] text-right max-w-[210px] truncate">
                  {address || "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-3">
                <span className="text-[var(--text-muted)]">Location</span>
                <span className="font-semibold text-[var(--text-heading)] text-right max-w-[210px] truncate">
                  {formattedLocation}
                </span>
              </div>
              {residence && (
                <div className="flex items-center justify-between gap-4 pt-3">
                  <span className="text-[var(--text-muted)]">Residence</span>
                  <span className="font-semibold text-[var(--text-heading)] text-right">
                    {residence}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 2: Where You Work (Agents) ── */}
          {isAgent && (
            <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-[var(--text-heading)]">
                  Where you work
                </h3>
                <Link
                  href="/agent/coverage"
                  aria-label="Edit where you work"
                  className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--primary-light)] text-[var(--text-heading)] hover:text-[var(--primary)] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
              </div>

              <div className="space-y-3.5 text-[13px]">
                <div>
                  <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[12px] mb-2">
                    <MapPin className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>Coverage areas</span>
                  </div>
                  {coverageAreas.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {coverageAreas.map((area) => (
                        <span
                          key={area}
                          className="px-2.5 py-1 rounded-md bg-[var(--primary-light)] text-[var(--primary)] text-[11.5px] font-semibold"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">
                      No coverage areas added yet. Tap edit to add your active areas.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border-color)]/60">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    Agent type
                  </span>
                  <span className="font-semibold text-[var(--text-heading)] text-right">
                    {workAgentType}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border-color)]/60">
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    Weekend tasks
                  </span>
                  <span className="font-semibold text-[var(--text-heading)] text-right">
                    {acceptWeekendTasks ? "Available" : "Weekdays only"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-24 select-none">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
            </div>
            <span className="text-[13px] font-medium tracking-wide">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ── Top Header (Edit Personal Details Form) ── */}
      <div className="flex items-center gap-3 py-3 mb-4">
        <button
          type="button"
          onClick={() => setIsEditingPersonal(false)}
          aria-label="Go back to profile"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer -ml-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[17px] sm:text-[18px] font-bold text-[var(--text-heading)]">
          Personal details
        </h1>
      </div>

      {/* ── Avatar Section ── */}
      <div className="flex justify-center mb-7">
        <div className="relative">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Profile avatar"
              className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-[var(--border-color)]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[var(--info-light)] flex items-center justify-center text-[var(--info)] font-bold text-2xl">
              {initials}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile photo"
            className="absolute -bottom-0.5 -right-0.5 w-8 h-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-[var(--text-heading)]" />
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

      {/* ── Form ── */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Identity & Contact */}
        <div className="space-y-4">
          <h2 className="text-[13px] font-semibold text-[var(--primary)]">
            Identity &amp; Contact
          </h2>

          {/* Title + Full Name Row */}
          <div className="flex items-start gap-3">
            <div className="w-[116px] shrink-0">
              <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
                Title
              </label>
              <ResponsiveSelect
                value={title}
                onChange={setTitle}
                options={TITLE_OPTIONS}
                modalTitle="Select Title"
                triggerClassName="py-3 px-3 rounded-lg"
              />
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
                Full Name
              </label>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-lg px-3.5 py-2.5 shadow-2xs">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Chinedu Okafor"
                  className="w-full bg-transparent text-[13.5px] font-medium text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email Address (Read-only with Lock) */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
              Email Address
            </label>
            <div className="flex items-center justify-between gap-3 bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-lg px-3.5 py-2.5 opacity-85 cursor-not-allowed shadow-2xs">
              <input
                type="email"
                value={email}
                readOnly
                disabled
                className="w-full bg-transparent text-[13.5px] font-medium text-[var(--text-heading)] outline-none cursor-not-allowed"
              />
              <Lock className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
              Phone Number
            </label>
            <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-lg shadow-2xs">
              <ResponsiveSelect
                value={phoneCode}
                onChange={setPhoneCode}
                options={PHONE_CODES}
                modalTitle="Select Dialing Code"
                className="shrink-0"
                triggerClassName="border-0 border-r border-[var(--border-color)] rounded-none rounded-l-lg px-3 py-2.5 bg-transparent font-semibold"
              />
              <input
                type="tel"
                inputMode="numeric"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ""))}
                placeholder="801 234 5678"
                className="w-full bg-transparent text-[13.5px] font-medium text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none px-3.5 py-2.5"
              />
            </div>
          </div>

          {/* Occupation / Profession (Editable for BOTH End Users and Agents) */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
              Occupation / Profession
            </label>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-lg px-3.5 py-2.5 shadow-2xs">
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Civil Engineer, Lawyer, Surveyor, Business Owner"
                className="w-full bg-transparent text-[13.5px] font-medium text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Location & Residence */}
        <div className="space-y-4 pt-2">
          <h2 className="text-[13px] font-semibold text-[var(--primary)]">
            Location &amp; Residence
          </h2>

          {/* Street Address */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
              Street Address
            </label>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-lg px-3.5 py-2.5 shadow-2xs">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                className="w-full bg-transparent text-[13.5px] font-medium text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
              />
            </div>
          </div>

          {/* City / Area + State / Province Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
                City / Area
              </label>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-lg px-3.5 py-2.5 shadow-2xs">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Ikoyi, VI"
                  className="w-full bg-transparent text-[13.5px] font-medium text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
                State / Province
              </label>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-lg px-3.5 py-2.5 shadow-2xs">
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Lagos, FCT"
                  className="w-full bg-transparent text-[13.5px] font-medium text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Country + Residence Status Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
                Country
              </label>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-lg px-3.5 py-2.5 shadow-2xs">
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. Nigeria, UK"
                  className="w-full bg-transparent text-[13.5px] font-medium text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
                Residence Status
              </label>
              <ResponsiveSelect
                value={residence}
                onChange={setResidence}
                options={RESIDENCE_STATUS_OPTIONS}
                placeholder="Select status"
                modalTitle="Select Residence Status"
                triggerClassName="py-2.5 px-3.5 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Save Changes Primary Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-[0.99] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
          >
            {isSaving ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : savedSuccess ? (
              <span className="flex items-center gap-1.5">
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
