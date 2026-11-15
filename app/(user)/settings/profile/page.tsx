"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Check,
  ChevronDown,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken } from "@/lib/storage/clientStorage";

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
  const [occupation, setOccupation] = useState(
    authUser?.occupation || (authUser?.role === "AGENT" ? "Field Investigator" : "")
  );

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
      } else if (authUser.role === "AGENT" && !occupation) {
        setOccupation("Field Investigator");
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
  }, [authUser, occupation]);

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
        setToastMessage(null);
      }, 3000);
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

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-12 select-none">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
            </div>
            <span className="text-[13px] font-medium tracking-wide">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* ── Top Header (Matches Screenshots 2 & 3) ── */}
      <div className="flex items-center gap-3 py-3 mb-4">
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
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-card)] transition-colors cursor-pointer -ml-1"
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
              <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-3.5 py-3.5 shadow-2xs">
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent text-[13.5px] font-medium text-[var(--text-heading)] outline-none appearance-none pr-5 cursor-pointer"
                >
                  {TITLE_OPTIONS.map((opt) => (
                    <option
                      key={opt}
                      value={opt}
                      className="bg-[var(--bg-card)] text-[var(--text-heading)]"
                    >
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
                Full Name
              </label>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-4 py-3.5 shadow-2xs">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Agent User"
                  className="w-full bg-transparent text-[14px] font-medium text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email Address (Read-only with Lock) */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
              Email Address
            </label>
            <div className="flex items-center justify-between gap-3 bg-[var(--bg-card)]/80 border border-[var(--border-color)] rounded-2xl px-4 py-3.5 opacity-85 cursor-not-allowed shadow-2xs">
              <input
                type="email"
                value={email}
                readOnly
                disabled
                className="w-full bg-transparent text-[14px] font-medium text-[var(--text-heading)] outline-none cursor-not-allowed"
              />
              <Lock className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
              Phone Number
            </label>
            <div className="flex items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-4 py-3.5 shadow-2xs">
              <select
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                aria-label="Country dialing code"
                className="bg-transparent text-[14px] font-semibold text-[var(--text-heading)] outline-none cursor-pointer shrink-0"
              >
                {PHONE_CODES.map((code) => (
                  <option
                    key={code}
                    value={code}
                    className="bg-[var(--bg-card)] text-[var(--text-heading)]"
                  >
                    {code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                inputMode="numeric"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s]/g, ""))}
                placeholder="801 234 5678"
                className="w-full bg-transparent text-[14px] font-medium text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
              />
            </div>
          </div>

          {/* Occupation / Profession */}
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
              Occupation / Profession
            </label>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-4 py-3.5 shadow-2xs">
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="e.g. Field Investigator"
                className="w-full bg-transparent text-[14px] font-medium text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
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
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-4 py-3.5 shadow-2xs">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                className="w-full bg-transparent text-[14px] font-medium text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
              />
            </div>
          </div>

          {/* City / Area + State / Province Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-muted)] mb-1.5">
                City / Area
              </label>
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-4 py-3.5 shadow-2xs">
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
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-4 py-3.5 shadow-2xs">
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
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-4 py-3.5 shadow-2xs">
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
              <div className="relative bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] rounded-2xl px-4 py-3.5 shadow-2xs">
                <select
                  value={residence}
                  onChange={(e) => setResidence(e.target.value)}
                  className={`w-full bg-transparent text-[13.5px] font-medium outline-none appearance-none pr-5 cursor-pointer ${
                    residence ? "text-[var(--text-heading)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  <option value="" className="bg-[var(--bg-card)] text-[var(--text-muted)]">
                    Select status
                  </option>
                  {RESIDENCE_STATUS_OPTIONS.map((opt) => (
                    <option
                      key={opt}
                      value={opt}
                      className="bg-[var(--bg-card)] text-[var(--text-heading)]"
                    >
                      {opt}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Save Changes Primary Pill Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3.5 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-[0.99] text-white font-bold text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
          >
            {isSaving ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
