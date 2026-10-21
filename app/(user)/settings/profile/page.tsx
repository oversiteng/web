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

export default function EditProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("NG");
  const [selectedResidenceCode, setSelectedResidenceCode] = useState<string>("NG");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [residence, setResidence] = useState("Nigeria");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

  // Load existing profile from API
  useEffect(() => {
    async function loadProfile() {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/profile", { credentials: "include", headers });
        if (res.ok) {
          const data = await res.json();
          if (data?.profile) {
            const p = data.profile;
            if (p.name) setName(p.name);
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
      }
    }
    loadProfile();
  }, [allCountries]);

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
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/profile", {
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
          avatarUrl: avatarPreview || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

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
      <form onSubmit={handleSave} className="space-y-5">
        {/* Title Field (e.g., Mr, Mrs, Engr, Chief, Dr) */}
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
              placeholder="e.g. Mr, Mrs, Dr, Engr, Chief"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

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
              placeholder="Your full name"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* Email Field (Read Only) */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            Email
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] opacity-80 rounded-full px-5 py-3.5 shadow-xs">
            <Mail className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <input
              type="email"
              value={email}
              disabled
              readOnly
              className="w-full bg-transparent text-[14px] text-[var(--text-muted)] outline-none cursor-not-allowed"
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
              placeholder="e.g. Civil Engineer, Real Estate Investor"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* Address Field */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            Address
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
            <MapPin className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* Location / Area Field */}
        <div>
          <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
            Location / City
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
            <Compass className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Lekki Phase 1, Victoria Island"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </div>
        </div>

        {/* Country & State Dropdowns (using country-state-city) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Country Dropdown */}
          <div>
            <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
              Country
            </label>
            <div className="relative flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-4 py-3.5 transition-all shadow-xs">
              <Globe className="w-4 h-4 text-[var(--text-muted)] shrink-0 mr-2.5 stroke-[1.8]" />
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

          {/* State Dropdown / Input Fallback */}
          <div>
            <label className="block text-[14px] font-medium text-[var(--text-heading)] mb-2">
              State / Region
            </label>
            <div className="relative flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-4 py-3.5 transition-all shadow-xs">
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
                        key={s.isoCode || s.name}
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
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-3.5 transition-all shadow-xs">
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
