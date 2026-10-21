"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Upload,
  Info,
  X,
  FileText,
  Calendar,
  Building2,
  Check,
} from "lucide-react";
import { PropertySelectDrawer, PropertyOption } from "@/components/PropertySelectDrawer";

const LEGAL_DOMAINS = [
  "Property & Land Law",
  "Contract & Commercial",
  "Criminal & Civil",
  "Cooperate & Compliance",
  "Family & Succession",
  "Debt Recovery",
];

const LANGUAGES = [
  "English",
  "Yoruba",
  "Igbo",
  "Hausa",
  "French",
];

export default function LegalAdvisoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPropertyId = searchParams.get("propertyId") || "";

  // Form State
  const [legalDomain, setLegalDomain] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [consultationDate, setConsultationDate] = useState<string>("");
  const [consultationDateRaw, setConsultationDateRaw] = useState<string>("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(preselectedPropertyId);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);

  // Drawers & Modals (Only for Domain and Language selectors)
  const [isDomainDrawerOpen, setIsDomainDrawerOpen] = useState(false);
  const [isLanguageDrawerOpen, setIsLanguageDrawerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Dynamic minimum datetime (current date & time)
  const minDateTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  // Dynamic datetime formatter
  const handleDateChange = (val: string) => {
    setConsultationDateRaw(val);
    if (!val) {
      setConsultationDate("");
      return;
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    setConsultationDate(`${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`);
  };

  // Fetch registered properties for linking
  useEffect(() => {
    async function fetchProperties() {
      setLoadingProps(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/properties", { headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProperties(json.data);
          if (preselectedPropertyId && !selectedPropertyId) {
            setSelectedPropertyId(preselectedPropertyId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch properties:", err);
      } finally {
        setLoadingProps(false);
      }
    }
    fetchProperties();
  }, [preselectedPropertyId, selectedPropertyId]);

  // Load existing draft if returning back from review
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("oversite_legal_draft");
      if (stored) {
        const draft = JSON.parse(stored);
        if (draft.legalDomain && !legalDomain) setLegalDomain(draft.legalDomain);
        if (draft.summary && !summary) setSummary(draft.summary);
        if (draft.language && !language) setLanguage(draft.language);
        if (draft.consultationDate && !consultationDate) setConsultationDate(draft.consultationDate);
        if (draft.consultationDateRaw && !consultationDateRaw) setConsultationDateRaw(draft.consultationDateRaw);
        if (draft.propertyId && !selectedPropertyId) setSelectedPropertyId(draft.propertyId);
      }
    } catch (e) {
      console.error("Failed to read legal draft:", e);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.");
        return;
      }
      setAttachedFile(file);
    }
  };

  // Navigate to dedicated Order Review Page
  const handleReviewClick = () => {
    const selectedProp = properties.find((p) => p.id === selectedPropertyId);
    const draftData = {
      legalDomain: legalDomain || "Property & Land Law",
      summary,
      language,
      consultationDate,
      consultationDateRaw,
      propertyId: selectedPropertyId || undefined,
      propertyTitle: selectedProp ? (selectedProp.title || selectedProp.address) : undefined,
      fileName: attachedFile?.name || null,
    };
    try {
      sessionStorage.setItem("oversite_legal_draft", JSON.stringify(draftData));
    } catch (e) {
      console.error("Failed to save draft:", e);
    }

    const query = new URLSearchParams();
    if (legalDomain) query.set("domain", legalDomain);
    if (consultationDateRaw) query.set("date", consultationDateRaw);
    if (selectedPropertyId) query.set("propertyId", selectedPropertyId);
    if (selectedProp) query.set("propTitle", selectedProp.title || selectedProp.address);

    router.push(`/legal/review?${query.toString()}`);
  };

  return (
    <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between relative px-2 sm:px-4">
      {/* ── Top Header ── */}
      <div>
        <div className="relative flex items-center justify-center py-4 mb-3 border-b border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-0 p-2 -ml-1 rounded-xl text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-[17px] sm:text-[19px] font-bold text-[var(--text-heading)] tracking-tight">
              Legal Advisory
            </h1>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Verified NBA Counsel for title & contract advisory
            </p>
          </div>
        </div>

        {/* ── Optional Property Link Selector ── */}
        <div className="mb-5">
          <PropertySelectDrawer
            label="Property"
            properties={properties}
            selectedPropertyId={selectedPropertyId}
            onSelect={(prop) => setSelectedPropertyId(prop?.id || "")}
            allowNone={true}
            noneLabel="None (General legal inquiry without property link)"
            returnUrl="/legal"
            loading={loadingProps}
          />
        </div>

        {/* ── Form Fields ── */}
        <div className="space-y-4 pt-1">
          {/* Field 1: Legal domain */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              Legal domain
            </label>
            <button
              id="legal-domain-trigger"
              type="button"
              onClick={() => setIsDomainDrawerOpen(true)}
              className="w-full bg-[var(--bg-card)] rounded-2xl px-4 py-3.5 flex items-center justify-between cursor-pointer border border-[var(--border-color)] hover:border-[var(--primary)]/40 transition-colors shadow-xs"
            >
              <span
                className={`text-[14px] truncate ${legalDomain
                  ? "text-[var(--text-heading)] font-semibold"
                  : "text-[var(--text-muted)]"
                  }`}
              >
                {legalDomain || "Choose legal domain"}
              </span>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0 ml-2" />
            </button>
          </div>

          {/* Field 2: Summary of the matter */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              Summary of the matter
            </label>
            <textarea
              id="summary-matter-input"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe your case, property title inquiry, agreement review, or boundary dispute in detail..."
              className="w-full bg-[var(--bg-card)] rounded-2xl p-4 text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none transition-colors shadow-xs resize-none"
            />
          </div>

          {/* Field 3: Language */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              Language
            </label>
            <button
              id="language-trigger"
              type="button"
              onClick={() => setIsLanguageDrawerOpen(true)}
              className="w-full bg-[var(--bg-card)] rounded-2xl px-4 py-3.5 flex items-center justify-between cursor-pointer border border-[var(--border-color)] hover:border-[var(--primary)]/40 transition-colors shadow-xs"
            >
              <span
                className={`text-[14px] ${language
                  ? "text-[var(--text-heading)] font-semibold"
                  : "text-[var(--text-muted)]"
                  }`}
              >
                {language || "Choose language"}
              </span>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0 ml-2" />
            </button>
          </div>

          {/* Field 4: Consultation date - Dynamic Calendar & Time Picker */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              Consultation date
            </label>
            <div
              onClick={() => {
                try {
                  dateInputRef.current?.showPicker?.();
                } catch {
                  dateInputRef.current?.focus();
                }
              }}
              className="relative w-full bg-[var(--bg-card)] rounded-2xl px-4 py-3.5 flex items-center justify-between border border-[var(--border-color)] hover:border-[var(--primary)]/60 focus-within:border-[var(--primary)] transition-colors shadow-xs cursor-pointer text-left"
            >
              <span
                className={`text-[14px] ${consultationDate
                  ? "text-[var(--text-heading)] font-semibold"
                  : "text-[var(--text-muted)]"
                  }`}
              >
                {consultationDate || "DD/MM/YYYY, 00:00 PM"}
              </span>
              <div className="flex items-center gap-1.5 text-[var(--text-muted)] pointer-events-none">
                <Calendar className="w-4 h-4" />
                <ChevronDown className="w-3.5 h-3.5" />
              </div>

              {/* Native HTML5 dynamic datetime-local picker */}
              <input
                ref={dateInputRef}
                type="datetime-local"
                min={minDateTime}
                value={consultationDateRaw}
                onChange={(e) => handleDateChange(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [color-scheme:dark_light]"
                aria-label="Select consultation date and time"
              />
            </div>
          </div>

          {/* Field 5: Add a file */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              Add a file
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
            />

            {!attachedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="bg-[var(--bg-card)] rounded-2xl p-6 text-center cursor-pointer border-2 border-dashed border-[var(--border-color)] hover:border-[var(--primary)]/60 transition-colors shadow-xs flex flex-col items-center justify-center group"
              >
                <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-[14px] font-semibold text-[var(--primary)]">
                  Tap to upload file
                </p>
                <p className="text-[11.5px] text-[var(--text-muted)] mt-1">
                  Supported formats: PDF, JPG, PNG (Max 5MB)
                </p>
              </div>
            ) : (
              <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--primary)]/40 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[var(--text-heading)] truncate">
                      {attachedFile.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {(attachedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── Verified Lawyer Information Card ── */}
          <div className="rounded-2xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 p-4 flex items-start gap-3 mt-4">
            <Info className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[var(--text-heading)] leading-relaxed font-medium">
              Every lawyer&apos;s NBA number is verified before matching. The advisory is saved to your Document Vault after the session.
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom Sticky Bar ── */}
      <div className="pt-6 pb-4 sticky bottom-[68px] md:bottom-0 bg-[var(--bg-body)]/95 backdrop-blur-md z-40 mt-6 border-t border-[var(--border-color)] -mx-2 sm:-mx-4 px-2 sm:px-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[14px] font-medium text-[var(--text-muted)]">
            Service fee
          </span>
          <span className="text-[18px] sm:text-[20px] font-bold text-[var(--text-heading)]">
            ₦22,000
          </span>
        </div>

        <button
          id="review-trigger"
          type="button"
          onClick={handleReviewClick}
          className="w-full py-3.5 sm:py-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-[15px] sm:text-[16px] transition-all duration-200 shadow-md cursor-pointer active:scale-[0.98]"
        >
          Review
        </button>
      </div>

      {/* ── Select Legal Domain: Responsive Bottom Drawer on Mobile, Centered Modal on Larger Screens ── */}
      {isDomainDrawerOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in pointer-events-auto"
            onClick={() => setIsDomainDrawerOpen(false)}
          />

          {/* Modal / Drawer Content */}
          <div
            className="pointer-events-auto relative w-full sm:max-w-md bg-[var(--bg-card)] rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--border-color)] p-6 shadow-2xl z-10 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull handle for mobile */}
            <div className="w-12 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4 sm:hidden shrink-0" />

            <div className="flex items-center justify-between pb-3">
              <h2 className="text-[17px] font-bold text-[var(--text-heading)]">
                Select Legal Domain
              </h2>
              <button
                type="button"
                onClick={() => setIsDomainDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[12px] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <hr className="border-[var(--border-color)] mb-3" />

            {/* List of Domains */}
            <div className="space-y-1">
              {LEGAL_DOMAINS.map((domain) => {
                const isSelected = legalDomain === domain;
                return (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => {
                      setLegalDomain(domain);
                      setIsDomainDrawerOpen(false);
                    }}
                    className={`w-full py-3.5 px-3 flex items-center justify-between rounded-xl transition-colors cursor-pointer text-left ${isSelected
                      ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                      : "hover:bg-[var(--bg-secondary)] text-[var(--text-heading)]"
                      }`}
                  >
                    <span className="text-[14px]">{domain}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-[var(--border-color)] bg-transparent"
                        }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Select Language: Responsive Bottom Drawer on Mobile, Centered Modal on Larger Screens ── */}
      {isLanguageDrawerOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in pointer-events-auto"
            onClick={() => setIsLanguageDrawerOpen(false)}
          />

          {/* Modal / Drawer Content */}
          <div
            className="pointer-events-auto relative w-full sm:max-w-md bg-[var(--bg-card)] rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--border-color)] p-6 shadow-2xl z-10 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull handle for mobile */}
            <div className="w-12 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4 sm:hidden shrink-0" />

            <div className="flex items-center justify-between pb-3">
              <h2 className="text-[17px] font-bold text-[var(--text-heading)]">
                Select Preferred Language
              </h2>
              <button
                type="button"
                onClick={() => setIsLanguageDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[12px] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <hr className="border-[var(--border-color)] mb-3" />

            {/* List of Languages */}
            <div className="space-y-1">
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang;
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                      setIsLanguageDrawerOpen(false);
                    }}
                    className={`w-full py-3.5 px-3 flex items-center justify-between rounded-xl transition-colors cursor-pointer text-left ${isSelected
                      ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                      : "hover:bg-[var(--bg-secondary)] text-[var(--text-heading)]"
                      }`}
                  >
                    <span className="text-[14px]">{lang}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-[var(--border-color)] bg-transparent"
                        }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
