"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  MapPin,
  Briefcase,
  Home,
  Globe,
  Compass,
  Tag,
  Pencil,
  Check,
  ChevronDown,
} from "lucide-react";
import { Country, State } from "country-state-city";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken } from "@/lib/storage/clientStorage";

export default function EditProfilePage() {
  const router = useRouter();
  const { user: authUser, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states initialized with authUser fallback
  const [name, setName] = useState(authUser?.name || authUser?.fullName || "");
  const [email, setEmail] = useState(authUser?.email || "");
  const [title, setTitle] = useState(authUser?.title || "");
  const [address, setAddress] = useState(authUser?.address || "");
  const [location, setLocation] = useState(authUser?.location || "");
  const [occupation, setOccupation] = useState(authUser?.occupation || "");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("NG");
  const [selectedResidenceCode, setSelectedResidenceCode] = useState<string>("NG");
  const [state, setState] = useState(authUser?.state || "");
  const [country, setCountry] = useState(authUser?.country || "Nigeria");
  const [residence, setResidence] = useState(authUser?.residence || "Nigeria");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(authUser?.avatarUrl || authUser?.avatar || null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Memoized country list
  const allCountries = useMemo(() => {
    return Country.getAllCountries();
  }, []);

  // Memoized states list depending on selected country
  const statesForCountry = useMemo(() => {
    if (!selectedCountryCode) return [];
    return State.getStatesOfCountry(selectedCountryCode);
  }, [selectedCountryCode]);

  // Sync state if AuthContext finishes hydrating or updates
  useEffect(() => {
    if (authUser) {
      if (authUser.name || authUser.fullName) setName(authUser.name || authUser.fullName || "");
      if (authUser.email) setEmail(authUser.email);
      if (authUser.title) setTitle(authUser.title);
      if (authUser.address) setAddress(authUser.address);
      if (authUser.location) setLocation(authUser.location);
      if (authUser.occupation) setOccupation(authUser.occupation);
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
      setIsLoadingProfile(true);
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
            if (p.address) setAddress(p.address);
            if (p.location) setLocation(p.location);
            if (p.occupation) setOccupation(p.occupation);
            if (p.country) {
              setCountry(p.country);
              const matchedCountry = allCountries.find(
                (c) =>
                  c.name.toLowerCase() === p.country.toLowerCase() ||
                  c.isoCode.toLowerCase() === p.country.toLowerCase()
              );
              if (matchedCountry) {
                setSelectedCountryCode(matchedCountry.isoCode);
              }
            }
            if (p.state) setState(p.state);
            if (p.residence) {
              setResidence(p.residence);
              const matchedCountry = allCountries.find(
                (c) =>
                  c.name.toLowerCase() === p.residence.toLowerCase() ||
                  c.isoCode.toLowerCase() === p.residence.toLowerCase()
              );
              if (matchedCountry) {
                setSelectedResidenceCode(matchedCountry.isoCode);
              }
            }
            if (p.avatarUrl) setAvatarPreview(p.avatarUrl);
          }
        }
      } catch (e) {
        console.error("Failed to load profile:", e);
      } finally {
        if (!isCancelled) {
          setIsLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      isCancelled = true;
    };
  }, [allCountries, refreshUser]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedCountryCode(code);
    const found = allCountries.find((c) => c.isoCode === code);
    setCountry(found ? found.name : code);
    setState("");
  };

  const handleResidenceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedResidenceCode(code);
    const found = allCountries.find((c) => c.isoCode === code);
    setResidence(found ? found.name : code);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      setToastMessage("Please select a valid image file.");
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToastMessage("Image size must be less than 5MB.");
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }

    setSelectedAvatarFile(file);

    // Create immediate local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Helper to upload image to S3 using authenticated presigned URL
  const uploadAvatarToS3 = async (file: File, token: string | null): Promise<string> => {
    // 1. First try direct server-side upload (streams file to S3 via backend, zero CORS issues)
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

    // 2. Fallback to presigned S3 upload
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

    // Direct PUT to AWS S3
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

      // If user selected a new image file, upload to AWS S3
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

      const res = await fetch("/api/v1/users/me", {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({
          name,
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

      // Refresh global AuthContext user so More, Sidebar, etc. immediately update
      await refreshUser();

      // Show success feedback
      setSavedSuccess(true);
      setToastMessage("Profile changes saved successfully!");
      setTimeout(() => {
        setSavedSuccess(false);
        setToastMessage(null);
      }, 3000);
    } catch (err) {
      setToastMessage("Failed to save changes.");
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
            <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
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
            <div className="w-32 h-32 rounded-full bg-[#1c6b35] flex items-center justify-center shadow-lg text-white font-bold text-2xl">
              {name ? name.slice(0, 2).toUpperCase() : "OU"}
            </div>
          )}

          {/* Edit Badge */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile photo"
            className="absolute bottom-1 right-1 w-9 h-9 bg-white dark:bg-[#1f2937] border-2 border-[var(--bg-body)] rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            <Pencil className="w-4 h-4 text-[var(--primary)]" />
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      {/* ── Profile Edit Form ── */}
      <form onSubmit={handleSave} className="space-y-5">
        {/* Full Name Field */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            Full Name
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
            <User className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* Email Address Field (Read-only) */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            Email Address
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)]/60 border border-[var(--border-color)] rounded-full px-5 py-3.5 transition-all opacity-80 cursor-not-allowed shadow-xs">
            <Mail className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className="w-full bg-transparent text-[14px] text-[var(--text-muted)] outline-none cursor-not-allowed"
            />
          </div>
        </div>

        {/* Title Field */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            Title
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
            <Tag className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mr. / Mrs. / Engr. / Barrister"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* Address Field */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            Residential Address
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
            <MapPin className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* Location / City Field */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            City / Location
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
            <Compass className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Ikeja, Lagos"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* Occupation Field */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            Occupation
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
            <Briefcase className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Civil Engineer / Entrepreneur"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* Country & State Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nationality / Country */}
          <div>
            <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
              Country
            </label>
            <div className="relative flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
              <Globe className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              <select
                value={selectedCountryCode}
                onChange={handleCountryChange}
                className="w-full bg-transparent text-[14px] text-[var(--text-heading)] outline-none appearance-none pr-6 cursor-pointer"
              >
                <option value="" disabled className="bg-[var(--bg-card)] text-[var(--text-heading)]">
                  Select Country
                </option>
                {allCountries.map((c) => (
                  <option
                    key={c.isoCode}
                    value={c.isoCode}
                    className="bg-[var(--bg-card)] text-[var(--text-heading)]"
                  >
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-4 pointer-events-none" />
            </div>
          </div>

          {/* State / Province */}
          <div>
            <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
              State / Region
            </label>
            <div className="relative flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
              <Compass className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
              {statesForCountry.length > 0 ? (
                <>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-transparent text-[14px] text-[var(--text-heading)] outline-none appearance-none pr-6 cursor-pointer"
                  >
                    <option value="" className="bg-[var(--bg-card)] text-[var(--text-heading)]">
                      Select State
                    </option>
                    {statesForCountry.map((s) => (
                      <option
                        key={s.isoCode}
                        value={s.name}
                        className="bg-[var(--bg-card)] text-[var(--text-heading)]"
                      >
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-4 pointer-events-none" />
                </>
              ) : (
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. State / Province"
                  className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
                />
              )}
            </div>
          </div>
        </div>

        {/* Residence Field */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            Country of Residence
          </label>
          <div className="relative flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
            <Home className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <select
              value={selectedResidenceCode}
              onChange={handleResidenceChange}
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] outline-none appearance-none pr-6 cursor-pointer"
            >
              <option value="" disabled className="bg-[var(--bg-card)] text-[var(--text-heading)]">
                Select Country
              </option>
              {allCountries.map((c) => (
                <option
                  key={c.isoCode}
                  value={c.isoCode}
                  className="bg-[var(--bg-card)] text-[var(--text-heading)]"
                >
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-4 pointer-events-none" />
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] active:scale-[0.99] text-[var(--primary)] font-semibold text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isSaving ? (
              <span className="inline-block w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            ) : savedSuccess ? (
              <span className="flex items-center gap-1.5 text-[var(--primary)]">
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
