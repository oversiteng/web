"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Upload,
  Info,
  X,
  FileText,
  Calendar,
  Check,
  ShieldCheck,
} from "lucide-react";

const LEGAL_TYPE = [
  "Individual",
  "Company",
  "NGO",
  "Government body",
];

const SERVICE_TYPE = [
  "Advice/opinion",
  "Document drafting",
  "Document review",
  "Transaction support",
  "Dispute/litigation",
  "Regulatory filing",
  "Representation",
];

const LEGAL_DOMAINS = [
  "Property & Land Law",
  "Contract & Commercial",
  "Criminal & Civil",
  "Corporate & Compliance",
  "Family & Succession",
  "Debt Recovery",
];

export default function LegalAdvisoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPropertyId = searchParams.get("propertyId") || "";

  // Form State
  const [legalType, setLegalType] = useState<string>("");
  const [legalDomain, setLegalDomain] = useState<string>("");
  const [serviceType, setServiceType] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [consultationDate, setConsultationDate] = useState<string>("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(preselectedPropertyId);
  const [propertyTitle, setPropertyTitle] = useState<string>("");

  // Consent & Consent State
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [confirmNoRelationship, setConfirmNoRelationship] = useState(false);
  const [confirmConflictCheck, setConfirmConflictCheck] = useState(false);
  const [confirmNdpa, setConfirmNdpa] = useState(false);
  const [signature, setSignature] = useState("");
  const [consentDate, setConsentDate] = useState<string>("");
  const [minDateTime, setMinDateTime] = useState<string>("");

  // Drawers & Modals
  const [isTypeDrawerOpen, setIsTypeDrawerOpen] = useState(false);
  const [isDomainDrawerOpen, setIsDomainDrawerOpen] = useState(false);
  const [isServiceTypeDrawerOpen, setIsServiceTypeDrawerOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const consentDateInputRef = useRef<HTMLInputElement>(null);

  // Initialize client-only datetime values to avoid SSR hydration mismatch
  useEffect(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    setConsentDate((prev) => prev || `${day}/${month}/${year}`);

    const clientMin = new Date(Date.now() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setMinDateTime(clientMin);
  }, []);

  // Helper to format ISO datetime (e.g. 2026-10-24T16:00) to human readable string
  const formatConsultationDateTime = (val: string) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`;
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for native date input
  const getIsoDate = (dmy: string) => {
    const parts = dmy.split("/");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return "";
  };

  const handleConsentDateChange = (val: string) => {
    if (!val) return;
    const parts = val.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      setConsentDate(`${day}/${month}/${year}`);
    }
  };

  // Fetch preselected property title if propertyId exists in query
  useEffect(() => {
    if (!selectedPropertyId) return;
    async function fetchPropertyDetails() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/properties", { headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const matched = json.data.find((p: { id: string }) => p.id === selectedPropertyId);
          if (matched) {
            setPropertyTitle(matched.title || matched.address || "Linked Property");
          }
        }
      } catch (err) {
        console.error("Failed to fetch property title:", err);
      }
    }
    fetchPropertyDetails();
  }, [selectedPropertyId]);

  // Load existing draft if returning back from review
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("oversite_legal_draft");
      if (stored) {
        const draft = JSON.parse(stored);
        if (draft.legalDomain && !legalDomain) setLegalDomain(draft.legalDomain);
        if (draft.legalType && !legalType) setLegalType(draft.legalType);
        if (draft.serviceType && !serviceType) setServiceType(draft.serviceType);
        if (draft.summary && !summary) setSummary(draft.summary);
        if (draft.consultationDate && !consultationDate) setConsultationDate(draft.consultationDate);
        if (draft.propertyId && !selectedPropertyId) setSelectedPropertyId(draft.propertyId);
        if (draft.propertyTitle && !propertyTitle) setPropertyTitle(draft.propertyTitle);

        if (draft.consent) {
          if (typeof draft.consent.accurateConfirmed === "boolean") {
            setConfirmAccurate(draft.consent.accurateConfirmed);
          }
          if (typeof draft.consent.noRelationshipConfirmed === "boolean") {
            setConfirmNoRelationship(draft.consent.noRelationshipConfirmed);
          }
          if (typeof draft.consent.conflictCheckConfirmed === "boolean") {
            setConfirmConflictCheck(draft.consent.conflictCheckConfirmed);
          }
          if (typeof draft.consent.ndpaConsentConfirmed === "boolean") {
            setConfirmNdpa(draft.consent.ndpaConsentConfirmed);
          }
          if (draft.consent.signature) {
            setSignature(draft.consent.signature);
          }
          if (draft.consent.consentDate) {
            setConsentDate(draft.consent.consentDate);
          }
        }
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

  // Validation: All required acknowledgments, signature, type, domain, service type, summary, and consultation date
  const isFormValid = Boolean(
    legalType &&
    legalDomain &&
    serviceType &&
    summary.trim() &&
    consultationDate &&
    confirmAccurate &&
    confirmNoRelationship &&
    confirmConflictCheck &&
    confirmNdpa &&
    signature.trim().length >= 2 &&
    consentDate
  );

  // Navigate to dedicated Order Review Page
  const handleReviewClick = () => {
    if (!isFormValid) return;

    const draftData = {
      legalType,
      legalDomain,
      serviceType,
      summary,
      consultationDate,
      propertyId: selectedPropertyId || undefined,
      propertyTitle: propertyTitle || undefined,
      fileName: attachedFile?.name || null,
      priceNgn: 26100,
      workloadUnits: 2,
      consent: {
        accurateConfirmed: confirmAccurate,
        noRelationshipConfirmed: confirmNoRelationship,
        conflictCheckConfirmed: confirmConflictCheck,
        ndpaConsentConfirmed: confirmNdpa,
        signature: signature.trim(),
        consentDate: consentDate,
      },
    };

    try {
      sessionStorage.setItem("oversite_legal_draft", JSON.stringify(draftData));
    } catch (e) {
      console.error("Failed to save draft:", e);
    }

    const query = new URLSearchParams();
    if (legalDomain) query.set("domain", legalDomain);
    if (legalType) query.set("type", legalType);
    if (serviceType) query.set("service", serviceType);
    if (consultationDate) query.set("date", consultationDate);
    if (selectedPropertyId) query.set("propertyId", selectedPropertyId);
    if (propertyTitle) query.set("propTitle", propertyTitle);

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
              Verified NBA Counsel for title &amp; contract advisory
            </p>
          </div>
        </div>

        {/* ── Optional Property Link Indicator ── */}
        {selectedPropertyId && (
          <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-between text-[12.5px]">
            <span className="text-[var(--text-muted)]">Linked property:</span>
            <span className="font-semibold text-[var(--text-heading)] truncate max-w-[240px]">
              {propertyTitle || "Loading property..."}
            </span>
          </div>
        )}

        {/* ── Form Fields ── */}
        <div className="space-y-4 pt-1">
          {/* Field 1: Choose Type */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              Choose type
            </label>
            <button
              id="legal-type-trigger"
              type="button"
              onClick={() => setIsTypeDrawerOpen(true)}
              className="w-full bg-[var(--bg-card)] rounded-2xl px-4 py-3.5 flex items-center justify-between cursor-pointer border border-[var(--border-color)] hover:border-[var(--primary)]/40 transition-colors shadow-xs"
            >
              <span
                className={`text-[14px] truncate ${
                  legalType
                    ? "text-[var(--text-heading)] font-semibold"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {legalType || "Select type"}
              </span>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0 ml-2" />
            </button>
          </div>

          {/* Field 2: Legal Domain */}
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
                className={`text-[14px] truncate ${
                  legalDomain
                    ? "text-[var(--text-heading)] font-semibold"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {legalDomain || "Choose legal domain"}
              </span>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0 ml-2" />
            </button>
          </div>

          {/* Field 3: Service Type */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              Service type
            </label>
            <button
              id="service-type-trigger"
              type="button"
              onClick={() => setIsServiceTypeDrawerOpen(true)}
              className="w-full bg-[var(--bg-card)] rounded-2xl px-4 py-3.5 flex items-center justify-between cursor-pointer border border-[var(--border-color)] hover:border-[var(--primary)]/40 transition-colors shadow-xs"
            >
              <span
                className={`text-[14px] truncate ${
                  serviceType
                    ? "text-[var(--text-heading)] font-semibold"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {serviceType || "Choose service type"}
              </span>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0 ml-2" />
            </button>
          </div>

          {/* Field 4: Summary of the matter */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              Summary of the matter
            </label>
            <textarea
              id="summary-matter-input"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Provide a brief summary of your legal matter"
              className="w-full bg-[var(--bg-card)] rounded-2xl p-4 text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none transition-colors shadow-xs resize-none"
            />
          </div>

          {/* Field 5: Consultation date */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              Consultation date*
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
                suppressHydrationWarning
                className={`text-[14px] ${
                  consultationDate
                    ? "text-[var(--text-heading)] font-semibold"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {formatConsultationDateTime(consultationDate) || "DD/MM/YYYY, 00:00 PM"}
              </span>
              <div className="flex items-center gap-1.5 text-[var(--text-muted)] pointer-events-none">
                <Calendar className="w-4 h-4" />
                <ChevronDown className="w-3.5 h-3.5" />
              </div>

              {/* Native HTML5 dynamic datetime-local picker */}
              <input
                ref={dateInputRef}
                type="datetime-local"
                min={minDateTime || undefined}
                value={consultationDate}
                onChange={(e) => setConsultationDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [color-scheme:dark_light]"
                aria-label="Choose consultation date and time"
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Field 6: Add a file */}
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

          {/* ── Consent & Consent Section ── */}
          <div className="pt-6 border-t border-[var(--border-color)] space-y-4">
            <div>
              <h2 className="text-[17px] sm:text-[18px] font-bold text-[var(--text-heading)] tracking-tight">
                Consent &amp; Consent
              </h2>
              <p className="text-[12.5px] sm:text-[13px] text-[var(--text-muted)] mt-1">
                Please confirm each of the statutory and professional acknowledgments below.
              </p>
            </div>

            <div className="space-y-4 pt-1">
              {/* Checkbox 1: Accurate information */}
              <div
                onClick={() => setConfirmAccurate((prev) => !prev)}
                className="flex items-start gap-3.5 cursor-pointer select-none group"
              >
                <div
                  className={`w-5 h-5 rounded-[7px] border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    confirmAccurate
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-xs"
                      : "border-neutral-500/70 dark:border-neutral-500 bg-[var(--bg-card)] group-hover:border-[var(--primary)]"
                  }`}
                >
                  {confirmAccurate && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </div>
                <p className="text-[13px] sm:text-[13.5px] text-[var(--text-heading)] leading-snug">
                  Confirmation that the information provided is accurate and true to the best of my knowledge.*
                </p>
              </div>

              {/* Checkbox 2: No lawyer-client relationship until signed */}
              <div
                onClick={() => setConfirmNoRelationship((prev) => !prev)}
                className="flex items-start gap-3.5 cursor-pointer select-none group"
              >
                <div
                  className={`w-5 h-5 rounded-[7px] border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    confirmNoRelationship
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-xs"
                      : "border-neutral-500/70 dark:border-neutral-500 bg-[var(--bg-card)] group-hover:border-[var(--primary)]"
                  }`}
                >
                  {confirmNoRelationship && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </div>
                <p className="text-[13px] sm:text-[13.5px] text-[var(--text-heading)] leading-snug">
                  Acknowledgment that submitting this form does not create a lawyer–client relationship until an engagement letter is signed.*
                </p>
              </div>

              {/* Checkbox 3: Conflict check */}
              <div
                onClick={() => setConfirmConflictCheck((prev) => !prev)}
                className="flex items-start gap-3.5 cursor-pointer select-none group"
              >
                <div
                  className={`w-5 h-5 rounded-[7px] border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    confirmConflictCheck
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-xs"
                      : "border-neutral-500/70 dark:border-neutral-500 bg-[var(--bg-card)] group-hover:border-[var(--primary)]"
                  }`}
                >
                  {confirmConflictCheck && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </div>
                <p className="text-[13px] sm:text-[13.5px] text-[var(--text-heading)] leading-snug">
                  Acknowledgment that the conflict check must clear before the matter is accepted.*
                </p>
              </div>

              {/* Checkbox 4: NDPA / GDPR Consent */}
              <div className="flex items-start gap-3.5 select-none">
                <div
                  onClick={() => setConfirmNdpa((prev) => !prev)}
                  className={`w-5 h-5 rounded-[7px] border shrink-0 mt-0.5 flex items-center justify-center cursor-pointer transition-all ${
                    confirmNdpa
                      ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-xs"
                      : "border-neutral-500/70 dark:border-neutral-500 bg-[var(--bg-card)] hover:border-[var(--primary)]"
                  }`}
                >
                  {confirmNdpa && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </div>
                <div className="space-y-1">
                  <p
                    onClick={() => setConfirmNdpa((prev) => !prev)}
                    className="text-[13px] sm:text-[13.5px] text-[var(--text-heading)] leading-snug cursor-pointer"
                  >
                    Data processing consent under the Nigeria Data Protection Act (NDPA) 2023, or GDPR if client is in the EU.*
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsPrivacyModalOpen(true)}
                    className="text-[12px] text-[var(--primary)] underline hover:text-[var(--primary-hover)] font-medium cursor-pointer transition-colors block text-left"
                  >
                    View Privacy Notice
                  </button>
                </div>
              </div>
            </div>

            {/* Signature Input */}
            <div className="pt-2">
              <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
                Signature or typed legal name*
              </label>
              <input
                id="digital-signature-input"
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Type your full legal name as digital signature"
                className="w-full bg-[var(--bg-card)] rounded-2xl px-4 py-3.5 text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] focus:outline-none transition-colors shadow-xs"
              />
            </div>

            {/* Consent Date */}
            <div>
              <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
                Date*
              </label>
              <div
                onClick={() => {
                  try {
                    consentDateInputRef.current?.showPicker?.();
                  } catch {
                    consentDateInputRef.current?.focus();
                  }
                }}
                className="relative w-full bg-[var(--bg-card)] rounded-2xl px-4 py-3.5 flex items-center justify-between border border-[var(--border-color)] hover:border-[var(--primary)]/60 focus-within:border-[var(--primary)] transition-colors shadow-xs cursor-pointer text-left"
              >
                <span
                  suppressHydrationWarning
                  className="text-[14px] font-medium text-[var(--text-heading)]"
                >
                  {consentDate || "DD/MM/YYYY"}
                </span>
                <Calendar className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <input
                  ref={consentDateInputRef}
                  type="date"
                  value={getIsoDate(consentDate)}
                  onChange={(e) => handleConsentDateChange(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [color-scheme:dark_light]"
                  aria-label="Choose consent date"
                  suppressHydrationWarning
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Sticky Bar ── */}
      <div className="pt-5 pb-4 sticky bottom-[68px] md:bottom-0 bg-[var(--bg-body)]/95 backdrop-blur-md z-40 mt-6 border-t border-[var(--border-color)] -mx-2 sm:-mx-4 px-2 sm:px-4">
        <div className="flex items-center justify-between mb-3.5 px-1">
          <div>
            <span className="text-[14px] font-medium text-[var(--text-muted)] block">
              Service fee
            </span>
            <span className="text-[12px] font-semibold text-[var(--primary)] block mt-0.5">
              Workload: 2 units
            </span>
          </div>
          <span className="text-[20px] font-bold text-[var(--text-heading)]">
            ₦15,000
          </span>
        </div>

        <button
          id="review-trigger"
          type="button"
          disabled={!isFormValid}
          onClick={handleReviewClick}
          className="w-full py-3.5 sm:py-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[15px] sm:text-[16px] transition-all duration-200 shadow-md cursor-pointer active:scale-[0.98]"
        >
          Review
        </button>
      </div>

      {/* ── Choose Type Drawer ── */}
      {isTypeDrawerOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in pointer-events-auto"
            onClick={() => setIsTypeDrawerOpen(false)}
          />
          <div
            className="pointer-events-auto relative w-full sm:max-w-md bg-[var(--bg-card)] rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--border-color)] p-6 shadow-2xl z-10 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4 sm:hidden shrink-0" />
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-[17px] font-bold text-[var(--text-heading)]">
                Select Type
              </h2>
              <button
                type="button"
                onClick={() => setIsTypeDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[12px] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <hr className="border-[var(--border-color)] mb-3" />
            <div className="space-y-1">
              {LEGAL_TYPE.map((type) => {
                const isSelected = legalType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setLegalType(type);
                      setIsTypeDrawerOpen(false);
                    }}
                    className={`w-full py-3.5 px-3 flex items-center justify-between rounded-xl transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                        : "hover:bg-[var(--bg-secondary)] text-[var(--text-heading)]"
                    }`}
                  >
                    <span className="text-[14px]">{type}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
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

      {/* ── Choose Legal Domain Drawer ── */}
      {isDomainDrawerOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in pointer-events-auto"
            onClick={() => setIsDomainDrawerOpen(false)}
          />
          <div
            className="pointer-events-auto relative w-full sm:max-w-md bg-[var(--bg-card)] rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--border-color)] p-6 shadow-2xl z-10 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
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
                    className={`w-full py-3.5 px-3 flex items-center justify-between rounded-xl transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                        : "hover:bg-[var(--bg-secondary)] text-[var(--text-heading)]"
                    }`}
                  >
                    <span className="text-[14px]">{domain}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
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

      {/* ── Choose Service Type Drawer ── */}
      {isServiceTypeDrawerOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in pointer-events-auto"
            onClick={() => setIsServiceTypeDrawerOpen(false)}
          />
          <div
            className="pointer-events-auto relative w-full sm:max-w-md bg-[var(--bg-card)] rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--border-color)] p-6 shadow-2xl z-10 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4 sm:hidden shrink-0" />
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-[17px] font-bold text-[var(--text-heading)]">
                Select Service Type
              </h2>
              <button
                type="button"
                onClick={() => setIsServiceTypeDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[12px] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                ✕
              </button>
            </div>
            <hr className="border-[var(--border-color)] mb-3" />
            <div className="space-y-1">
              {SERVICE_TYPE.map((service) => {
                const isSelected = serviceType === service;
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => {
                      setServiceType(service);
                      setIsServiceTypeDrawerOpen(false);
                    }}
                    className={`w-full py-3.5 px-3 flex items-center justify-between rounded-xl transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                        : "hover:bg-[var(--bg-secondary)] text-[var(--text-heading)]"
                    }`}
                  >
                    <span className="text-[14px]">{service}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
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

      {/* ── Privacy Notice Modal ── */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsPrivacyModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2 text-[var(--primary)]">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-[16px] font-bold text-[var(--text-heading)]">
                  Privacy Notice &amp; NDPA 2023
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[12px] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3.5 text-[13px] text-[var(--text-muted)] leading-relaxed">
              <p>
                <strong className="text-[var(--text-heading)]">1. Lawful Processing:</strong> In compliance with the Nigeria Data Protection Act (NDPA) 2023 and General Data Protection Regulation (GDPR) standards, personal and property data collected through this form is processed exclusively for professional legal consultation matching and conflict checks.
              </p>
              <p>
                <strong className="text-[var(--text-heading)]">2. Confidentiality &amp; Privilege:</strong> All case summaries and attached title deeds or contracts remain strictly confidential and encrypted in transit and at rest.
              </p>
              <p>
                <strong className="text-[var(--text-heading)]">3. Conflict Clearance:</strong> Transmitting this inquiry initiates a preliminary conflict clearance with verified NBA counsel. Submitting does not constitute formal attorney-client retainer until mutual engagement is executed.
              </p>
              <p>
                <strong className="text-[var(--text-heading)]">4. Data Subject Rights:</strong> You retain the statutory right to request rectification, access, or deletion of your legal inquiry records from your Document Vault at any time.
              </p>
            </div>

            <div className="pt-2 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="w-full py-3 rounded-full bg-[var(--primary)] text-white font-semibold text-[14px] hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
              >
                Understood &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
