"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Upload,
  X,
  FileText,
  AlertTriangle,
  Check,
  User,
  CheckCircle2,
  ShieldAlert,
  PhoneCall,
  RotateCcw,
} from "lucide-react";

const RELATIONSHIP_OPTIONS = [
  "Victim",
  "Legal Representative / Counsel",
  "Property Owner / Landlord",
  "Family Member / Next of Kin",
  "Eye Witness / Whistleblower",
  "Authorized Agent",
];

const INCIDENT_TYPES = [
  "Fraud/scam",
  "Property Encroachment / Land Grabbing",
  "Breach of Trust / Contract Fraud",
  "Assault / Threat to Life",
  "Theft / Burglary",
  "Extortion / Harassment",
  "Vandalism / Property Destruction",
  "Other Civil / Criminal Incident",
];

const LIAISON_ACTIONS = [
  "Report officially",
  "Investigation",
  "Arrest Facilitation / Station Follow-up",
];

export default function LawEnforcementPage() {
  const router = useRouter();

  // Danger Banner State
  const [immediateDanger, setImmediateDanger] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Section 1: Requester Identity & Verification
  const [fullName, setFullName] = useState("");
  const [relationship, setRelationship] = useState("Victim");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  // Section 2: Report the Incident
  const [incidentType, setIncidentType] = useState("Fraud/scam");
  const [firstNoticedDate, setFirstNoticedDate] = useState("");
  const [firstNoticedDisplay, setFirstNoticedDisplay] = useState("24/10/2026, 7:27 PM");
  const [occurredSameTime, setOccurredSameTime] = useState(true);
  const [incidentOccurredDate, setIncidentOccurredDate] = useState("");
  const [incidentOccurredDisplay, setIncidentOccurredDisplay] = useState("Select date & time occurred");
  const [isOngoing, setIsOngoing] = useState(false);
  const [description, setDescription] = useState("");
  const [isSuspectAccordionOpen, setIsSuspectAccordionOpen] = useState(false);
  const [suspectName, setSuspectName] = useState("");
  const [suspectContact, setSuspectContact] = useState("");

  // Section 3: Existing Reports
  const [hasReported, setHasReported] = useState(false);
  const [existingReportRef, setExistingReportRef] = useState("");

  // Section 4: Liaison Request
  const [selectedActions, setSelectedActions] = useState<string[]>(["Report officially"]);
  const [shieldIdentity, setShieldIdentity] = useState(false);
  const [emergencyEngagement, setEmergencyEngagement] = useState(false);

  // Drawers
  const [isRelationshipDrawerOpen, setIsRelationshipDrawerOpen] = useState(false);
  const [isIncidentDrawerOpen, setIsIncidentDrawerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const datetimeInputRef = useRef<HTMLInputElement>(null);
  const datetimeInputOccurredRef = useRef<HTMLInputElement>(null);

  // Client-safe default datetime initialization
  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const isoLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setFirstNoticedDate(isoLocal);

    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = pad(now.getMinutes());
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    setFirstNoticedDisplay(`${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`);

    // Restore draft if available
    try {
      const stored = sessionStorage.getItem("oversite_enforcement_draft");
      if (stored) {
        const draft = JSON.parse(stored);
        if (draft.fullName) setFullName(draft.fullName);
        if (draft.relationship) setRelationship(draft.relationship);
        if (draft.incidentType) setIncidentType(draft.incidentType);
        if (draft.firstNoticedDate) setFirstNoticedDate(draft.firstNoticedDate);
        if (draft.firstNoticedDisplay) setFirstNoticedDisplay(draft.firstNoticedDisplay);
        if (draft.occurredSameTime !== undefined) setOccurredSameTime(draft.occurredSameTime);
        if (draft.incidentOccurredDate) setIncidentOccurredDate(draft.incidentOccurredDate);
        if (draft.incidentOccurredDisplay) setIncidentOccurredDisplay(draft.incidentOccurredDisplay);
        if (draft.isOngoing !== undefined) setIsOngoing(draft.isOngoing);
        if (draft.description) setDescription(draft.description);
        if (draft.suspectName) setSuspectName(draft.suspectName);
        if (draft.suspectContact) setSuspectContact(draft.suspectContact);
        if (draft.hasReported !== undefined) setHasReported(draft.hasReported);
        if (draft.existingReportRef) setExistingReportRef(draft.existingReportRef);
        if (Array.isArray(draft.selectedActions)) setSelectedActions(draft.selectedActions);
        if (draft.shieldIdentity !== undefined) setShieldIdentity(draft.shieldIdentity);
        if (draft.emergencyEngagement !== undefined) setEmergencyEngagement(draft.emergencyEngagement);
      }
    } catch (e) {
      console.error("Failed to restore enforcement draft:", e);
    }
  }, []);

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFirstNoticedDate(val);
    if (!val) return;
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, "0");
        const day = pad(d.getDate());
        const month = pad(d.getMonth() + 1);
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = pad(d.getMinutes());
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        setFirstNoticedDisplay(`${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`);
      }
    } catch {
      setFirstNoticedDisplay(val);
    }
  };

  const handleOccurredDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIncidentOccurredDate(val);
    if (!val) {
      setIncidentOccurredDisplay("Select date & time occurred");
      return;
    }
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, "0");
        const day = pad(d.getDate());
        const month = pad(d.getMonth() + 1);
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = pad(d.getMinutes());
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        setIncidentOccurredDisplay(`${day}/${month}/${year}, ${hours}:${minutes} ${ampm}`);
      }
    } catch {
      setIncidentOccurredDisplay(val);
    }
  };

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

  const toggleLiaisonAction = (action: string) => {
    setSelectedActions((prev) =>
      prev.includes(action)
        ? prev.length > 1
          ? prev.filter((a) => a !== action)
          : prev
        : [...prev, action]
    );
  };

  const serviceFee = 15000;
  const emergencyFee = emergencyEngagement ? 5000 : 0;
  const totalFee = serviceFee + emergencyFee;

  const canProceed = fullName.trim().length >= 2 && description.trim().length >= 5;

  const handleReview = () => {
    if (immediateDanger) {
      return;
    }

    const draft = {
      fullName: fullName.trim(),
      relationship,
      incidentType,
      firstNoticedDate,
      firstNoticedDisplay,
      occurredSameTime,
      incidentOccurredDate: occurredSameTime ? firstNoticedDate : incidentOccurredDate,
      incidentOccurredDisplay: occurredSameTime ? firstNoticedDisplay : incidentOccurredDisplay,
      isOngoing,
      description: description.trim(),
      suspectName: suspectName.trim(),
      suspectContact: suspectContact.trim(),
      hasReported,
      existingReportRef: existingReportRef.trim(),
      selectedActions,
      shieldIdentity,
      emergencyEngagement,
      fileName: attachedFile?.name || null,
      serviceFee,
      emergencyFee,
      totalFee,
    };

    try {
      sessionStorage.setItem("oversite_enforcement_draft", JSON.stringify(draft));
    } catch (e) {
      console.error("Failed to save draft:", e);
    }

    const query = new URLSearchParams();
    query.set("type", incidentType);
    if (emergencyEngagement) query.set("emergency", "true");
    if (shieldIdentity) query.set("shield", "true");

    router.push(`/enforcement/review?${query.toString()}`);
  };

  return (
    <div className="bg-[var(--bg-body)] min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-[var(--text-heading)] transition-colors duration-150">
      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4">
        <div>
          {/* ── Top Header ── */}
          <div className="relative flex items-center justify-center py-3 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute left-0 p-2 -ml-2 text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] sm:text-[18px] font-bold text-[var(--text-heading)] tracking-tight">
              Law Enforcement Liaison
            </h1>
          </div>

          {/* ── Immediate Danger Banner ── */}
          <div
            className={`rounded-[22px] bg-[var(--bg-card)] border p-4 sm:p-5 shadow-xs mb-4 transition-all ${
              immediateDanger
                ? "border-red-500/80 bg-red-950/20"
                : "border-[var(--border-color)]"
            }`}
          >
            <div className="flex items-start gap-2.5 mb-3.5">
              <AlertTriangle
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  immediateDanger ? "text-red-400" : "text-amber-500"
                }`}
              />
              <span className="text-[14px] sm:text-[14.5px] font-semibold text-[var(--text-heading)] leading-snug">
                Are you or anyone else in immediate danger?*
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setImmediateDanger(true)}
                className={`py-3 px-2 sm:px-3 rounded-full text-[12.5px] sm:text-[13px] font-semibold transition-all cursor-pointer text-center ${
                  immediateDanger
                    ? "bg-[#f87171] text-zinc-950 font-bold shadow-md ring-2 ring-red-400/50"
                    : "bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                }`}
              >
                YES (Immediate Danger)
              </button>

              <button
                type="button"
                onClick={() => setImmediateDanger(false)}
                className={`py-3 px-2 sm:px-3 rounded-full text-[12.5px] sm:text-[13px] font-semibold transition-all cursor-pointer text-center ${
                  !immediateDanger
                    ? "bg-[#85e19e] text-zinc-950 shadow-md font-bold"
                    : "bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                }`}
              >
                NO (Situation is stable)
              </button>
            </div>
          </div>

          {/* ── Immediate Danger View (Screenshot 1) ── */}
          {immediateDanger ? (
            <div className="rounded-[26px] bg-[#120d0d] border border-red-500/80 p-5 sm:p-6 shadow-xl mb-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2.5 text-red-500 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h2 className="text-[14.5px] sm:text-[15px] font-black uppercase tracking-wider text-red-500">
                  Call Emergency Services Now
                </h2>
              </div>

              <p className="text-[13px] text-zinc-300 leading-relaxed mb-4">
                Your personal safety is the priority. Please do not proceed with this intake form right now. Immediately dial the emergency line for your region:
              </p>

              <div className="space-y-2.5">
                {/* 1. Nigeria */}
                <a
                  href="tel:112"
                  className="block rounded-[18px] bg-zinc-900/90 border border-zinc-800/80 p-3.5 hover:border-red-500/50 hover:bg-zinc-850 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    <PhoneCall className="w-5 h-5 text-[#f87171] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[13.5px] font-bold text-white">Nigeria (National Emergency)</div>
                      <div className="text-[13.5px] font-bold text-[#f87171]">112 / 199</div>
                      <div className="text-[11.5px] text-zinc-400 mt-0.5">Police, Rapid Response Squad, Ambulance, Fire Service</div>
                    </div>
                  </div>
                </a>

                {/* 2. United Kingdom */}
                <a
                  href="tel:999"
                  className="block rounded-[18px] bg-zinc-900/90 border border-zinc-800/80 p-3.5 hover:border-red-500/50 hover:bg-zinc-850 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    <PhoneCall className="w-5 h-5 text-[#f87171] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[13.5px] font-bold text-white">United Kingdom (Diaspora)</div>
                      <div className="text-[13.5px] font-bold text-[#f87171]">999 (Emergency) / 101 (Police non-emergency)</div>
                      <div className="text-[11.5px] text-zinc-400 mt-0.5">UK Police &amp; Emergency Services</div>
                    </div>
                  </div>
                </a>

                {/* 3. United States & Canada */}
                <a
                  href="tel:911"
                  className="block rounded-[18px] bg-zinc-900/90 border border-zinc-800/80 p-3.5 hover:border-red-500/50 hover:bg-zinc-850 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    <PhoneCall className="w-5 h-5 text-[#f87171] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[13.5px] font-bold text-white">United States &amp; Canada</div>
                      <div className="text-[13.5px] font-bold text-[#f87171]">911</div>
                      <div className="text-[11.5px] text-zinc-400 mt-0.5">Emergency Services Dispatch</div>
                    </div>
                  </div>
                </a>

                {/* 4. European Union */}
                <a
                  href="tel:112"
                  className="block rounded-[18px] bg-zinc-900/90 border border-zinc-800/80 p-3.5 hover:border-red-500/50 hover:bg-zinc-850 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-start gap-3">
                    <PhoneCall className="w-5 h-5 text-[#f87171] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[13.5px] font-bold text-white">European Union</div>
                      <div className="text-[13.5px] font-bold text-[#f87171]">112</div>
                      <div className="text-[11.5px] text-zinc-400 mt-0.5">Pan-European Emergency Dispatch</div>
                    </div>
                  </div>
                </a>
              </div>

              {/* Danger has passed button */}
              <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setImmediateDanger(false)}
                  className="flex items-center gap-2 text-[13.5px] font-bold text-[#85e19e] hover:text-[#74d38e] transition-colors py-2 px-3 rounded-full hover:bg-[#85e19e]/10 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                  <span>Danger has passed / Continue filing report</span>
                </button>
              </div>
            </div>
          ) : (
            <>

          {/* ── Section 1: Requester Identity & Verification ── */}
          <div className="space-y-4 mb-7">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-[var(--text-heading)]">
              1. Requester Identity &amp; Verification
            </h2>

            {/* Full legal name */}
            <div>
              <label className="block text-[13.5px] font-semibold text-[var(--text-heading)] mb-2">
                Full legal name*
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Chukwuma Emmanuel Adeleke"
                className="w-full bg-[var(--bg-card)] rounded-[18px] px-4 py-3.5 text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] focus:border-[var(--primary)] focus:outline-none transition-all shadow-xs"
              />
            </div>

            {/* Relationship to incident */}
            <div>
              <label className="block text-[13.5px] font-semibold text-[var(--text-heading)] mb-2">
                Relationship to incident*
              </label>
              <button
                type="button"
                onClick={() => setIsRelationshipDrawerOpen(true)}
                className="w-full bg-[var(--bg-card)] rounded-[18px] px-4 py-3.5 flex items-center justify-between text-[14px] text-left cursor-pointer border border-[var(--border-color)] hover:border-[var(--text-muted)] transition-all shadow-xs"
              >
                <span className="text-[var(--text-heading)] font-medium">
                  {relationship}
                </span>
                <ChevronDown className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
              </button>
            </div>

            {/* Identity verification upload */}
            <div>
              <label className="block text-[13.5px] font-semibold text-[var(--text-heading)] mb-0.5">
                Identity verification <span className="text-[12px] font-normal text-[var(--text-muted)]">(Optional at intake)</span>
              </label>
              <p className="text-[12px] text-[var(--text-muted)] mb-2.5">
                Government ID upload (NIN Slip, Passport, or Driver&apos;s License) </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />

              {!attachedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-[22px] bg-[var(--bg-card)] p-6 border border-[var(--border-color)] shadow-xs flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-[var(--primary)]/60 active:scale-[0.99]"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                    <Upload className="w-6 h-6 stroke-[2]" />
                  </div>
                  <span className="text-[14px] font-semibold text-emerald-500">
                    Tap to upload file
                  </span>
                  <span className="text-[12px] text-[var(--text-muted)] mt-1">
                    Supported formats: PDF, JPG, PNG (Max 5MB)
                  </span>
                </div>
              ) : (
                <div className="rounded-[22px] bg-[var(--bg-card)] p-4 border border-[var(--border-color)] shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate pr-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-[13.5px] font-semibold text-[var(--text-heading)] truncate">
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
                    className="p-1.5 rounded-full hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Section 2: Report the Incident ── */}
          <div className="space-y-4 mb-7">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-[var(--text-heading)]">
              2. Report the Incident
            </h2>

            {/* Incident type */}
            <div>
              <label className="block text-[13.5px] font-semibold text-[var(--text-heading)] mb-2">
                Incident type*
              </label>
              <button
                type="button"
                onClick={() => setIsIncidentDrawerOpen(true)}
                className="w-full bg-[var(--bg-card)] rounded-[18px] px-4 py-3.5 flex items-center justify-between text-[14px] text-left cursor-pointer border border-[var(--border-color)] hover:border-[var(--text-muted)] transition-all shadow-xs"
              >
                <span className="text-[var(--text-heading)] font-medium">
                  {incidentType}
                </span>
                <ChevronDown className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
              </button>
            </div>

            {/* Date and time first noticed */}
            <div>
              <label className="block text-[13.5px] font-semibold text-[var(--text-heading)] mb-2">
                Date and time first noticed*
              </label>
              <div
                onClick={() => {
                  try {
                    datetimeInputRef.current?.showPicker?.();
                  } catch {
                    datetimeInputRef.current?.focus();
                  }
                }}
                className="relative w-full bg-[var(--bg-card)] rounded-[18px] px-4 py-3.5 flex items-center justify-between border border-[var(--border-color)] hover:border-[var(--text-muted)] focus-within:border-[var(--primary)] transition-colors shadow-xs cursor-pointer text-left"
              >
                <span suppressHydrationWarning className="text-[14px] text-[var(--text-heading)] font-medium">
                  {firstNoticedDisplay}
                </span>
                <ChevronDown className="w-5 h-5 text-[var(--text-muted)] shrink-0 pointer-events-none" />

                <input
                  ref={datetimeInputRef}
                  type="datetime-local"
                  value={firstNoticedDate}
                  onChange={handleDateTimeChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [color-scheme:dark_light]"
                  aria-label="Select date and time first noticed"
                />
              </div>
            </div>

            {/* Occurred at same time checkbox (Screenshot 2) */}
            <div
              onClick={() => setOccurredSameTime(!occurredSameTime)}
              className="flex items-center gap-2.5 cursor-pointer select-none py-1"
            >
              <div
                className={`w-5 h-5 rounded-[6px] flex items-center justify-center transition-colors shrink-0 ${
                  occurredSameTime
                    ? "bg-[#85e19e] text-zinc-950 font-bold"
                    : "border border-zinc-500 bg-transparent"
                }`}
              >
                {occurredSameTime && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <span className="text-[13px] text-[var(--text-heading)] font-medium">
                Incident occurred at the same time it was noticed
              </span>
            </div>

            {/* Revealed when NOT occurred at the same time (Screenshot 2) */}
            {!occurredSameTime && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <label className="block text-[13.5px] font-semibold text-[var(--text-heading)] mb-2">
                  Date and time incident occurred
                </label>
                <div
                  onClick={() => {
                    try {
                      datetimeInputOccurredRef.current?.showPicker?.();
                    } catch {
                      datetimeInputOccurredRef.current?.focus();
                    }
                  }}
                  className="relative w-full bg-[var(--bg-card)] rounded-[18px] px-4 py-3.5 flex items-center justify-between border border-[var(--border-color)] hover:border-[var(--text-muted)] focus-within:border-[var(--primary)] transition-colors shadow-xs cursor-pointer text-left"
                >
                  <span
                    suppressHydrationWarning
                    className={`text-[14px] font-medium ${
                      incidentOccurredDisplay === "Select date & time occurred"
                        ? "text-[var(--text-muted)]"
                        : "text-[var(--text-heading)]"
                    }`}
                  >
                    {incidentOccurredDisplay}
                  </span>
                  <ChevronDown className="w-5 h-5 text-[var(--text-muted)] shrink-0 pointer-events-none" />

                  <input
                    ref={datetimeInputOccurredRef}
                    type="datetime-local"
                    value={incidentOccurredDate}
                    onChange={handleOccurredDateTimeChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [color-scheme:dark_light]"
                    aria-label="Select date and time incident occurred"
                  />
                </div>
              </div>
            )}

            {/* Is it ongoing? */}
            <div>
              <label className="block text-[13.5px] font-semibold text-[var(--text-heading)] mb-2">
                Is it ongoing?*
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsOngoing(true)}
                  className={`py-3.5 px-4 rounded-[18px] text-[13.5px] font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    isOngoing
                      ? "bg-[#182a20] border border-emerald-500 text-emerald-400 shadow-sm"
                      : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                  }`}
                >
                  {isOngoing && <Check className="w-4 h-4 stroke-[2.5]" />}
                  <span>Ongoing</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsOngoing(false)}
                  className={`py-3.5 px-4 rounded-[18px] text-[13.5px] font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    !isOngoing
                      ? "bg-[#182a20] border border-emerald-500 text-emerald-400 shadow-sm"
                      : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                  }`}
                >
                  {!isOngoing && <Check className="w-4 h-4 stroke-[2.5]" />}
                  <span>Concluded / Stopped</span>
                </button>
              </div>
            </div>

            {/* Description of what happened */}
            <div>
              <label className="block text-[13.5px] font-semibold text-[var(--text-heading)] mb-2">
                Description of what happened* (Chronological details)
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe events in order: who was contacted, amounts involved, accounts impacted, threats made..."
                className="w-full bg-[var(--bg-card)] rounded-[18px] p-4 text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] focus:border-[var(--primary)] focus:outline-none transition-all shadow-xs resize-none min-h-[110px]"
              />
            </div>

            {/* Suspect Information Accordion */}
            <div className="rounded-[18px] bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setIsSuspectAccordionOpen(!isSuspectAccordionOpen)}
                className="w-full p-4 flex items-center justify-between text-left cursor-pointer hover:bg-[var(--bg-secondary)]/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-[14px] font-medium text-[var(--text-heading)]">
                  <User className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>Suspect Information (Optional)</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${
                    isSuspectAccordionOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isSuspectAccordionOpen && (
                <div className="p-4 pt-1 border-t border-[var(--border-color)]/60 space-y-3">
                  <input
                    type="text"
                    value={suspectName}
                    onChange={(e) => setSuspectName(e.target.value)}
                    placeholder="Suspect name, alias, or organization"
                    className="w-full bg-[var(--bg-secondary)] rounded-[14px] px-3.5 py-2.5 text-[13.5px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] focus:outline-none focus:border-[var(--primary)]"
                  />
                  <input
                    type="text"
                    value={suspectContact}
                    onChange={(e) => setSuspectContact(e.target.value)}
                    placeholder="Known phone number, account number, or handle"
                    className="w-full bg-[var(--bg-secondary)] rounded-[14px] px-3.5 py-2.5 text-[13.5px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Section 3: Existing Reports ── */}
          <div className="space-y-3 mb-7">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-[var(--text-heading)]">
              3. Existing Reports
            </h2>
            <label className="block text-[13.5px] font-semibold text-[var(--text-heading)]">
              Have you already reported to any authority?*
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHasReported(true)}
                className={`py-3.5 px-4 rounded-[18px] text-[13.5px] font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  hasReported
                    ? "bg-[#182a20] border border-emerald-500 text-emerald-400 shadow-sm"
                    : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                }`}
              >
                {hasReported && <Check className="w-4 h-4 stroke-[2.5]" />}
                <span>Yes</span>
              </button>

              <button
                type="button"
                onClick={() => setHasReported(false)}
                className={`py-3.5 px-4 rounded-[18px] text-[13.5px] font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  !hasReported
                    ? "bg-[#182a20] border border-emerald-500 text-emerald-400 shadow-sm"
                    : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                }`}
              >
                {!hasReported && <Check className="w-4 h-4 stroke-[2.5]" />}
                <span>No</span>
              </button>
            </div>

            {hasReported && (
              <input
                type="text"
                value={existingReportRef}
                onChange={(e) => setExistingReportRef(e.target.value)}
                placeholder="Agency / Station name and CR / Diary reference"
                className="w-full bg-[var(--bg-card)] rounded-[18px] px-4 py-3 text-[13.5px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] border border-[var(--border-color)] focus:outline-none focus:border-[var(--primary)] mt-2"
              />
            )}
          </div>

          {/* ── Section 4: Liaison Request ── */}
          <div className="space-y-4 mb-6">
            <h2 className="text-[15px] sm:text-[16px] font-bold text-[var(--text-heading)]">
              4. Liaison Request
            </h2>
            <div>
              <label className="block text-[13.5px] font-semibold text-[var(--text-heading)] mb-2.5">
                What do you want us to do?* (Multi-select)
              </label>
              <div className="flex flex-wrap gap-2.5">
                {LIAISON_ACTIONS.map((action) => {
                  const isSelected = selectedActions.includes(action);
                  return (
                    <button
                      key={action}
                      type="button"
                      onClick={() => toggleLiaisonAction(action)}
                      className={`py-2.5 px-4 rounded-full text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#182a20] border border-emerald-500 text-emerald-400 shadow-xs"
                          : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                      <span>{action}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggle: Shield my identity */}
            <div className="rounded-[22px] bg-[var(--bg-card)] p-4 sm:p-5 border border-[var(--border-color)] shadow-xs flex items-center justify-between gap-4">
              <div className="flex-1 pr-1">
                <h3 className="text-[14px] font-bold text-[var(--text-heading)]">
                  Shield my identity
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  File through Oversite as the named party. The agency receives OverSite as the petitioning party. Your name stays confidential with us.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShieldIdentity(!shieldIdentity)}
                className={`w-12 h-7 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
                  shieldIdentity ? "bg-[#85e19e]" : "bg-[var(--border-color)]"
                }`}
                aria-label="Toggle shield my identity"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    shieldIdentity ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle: Emergency engagement SLA */}
            <div className="rounded-[22px] bg-[var(--bg-card)] p-4 sm:p-5 border border-[var(--border-color)] shadow-xs flex items-center justify-between gap-4">
              <div className="flex-1 pr-1">
                <h3 className="text-[14px] font-bold text-[var(--text-heading)]">
                  Emergency engagement SLA
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] mt-1">
                  2-hour response SLA by on-call security liaison · +₦5,000
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEmergencyEngagement(!emergencyEngagement)}
                className={`w-12 h-7 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
                  emergencyEngagement ? "bg-[#85e19e]" : "bg-[var(--border-color)]"
                }`}
                aria-label="Toggle emergency engagement"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    emergencyEngagement ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </>
      )}
    </div>

      {/* ── Bottom Sticky Bar ── */}
      {!immediateDanger && (
        <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-[var(--bg-body)]/95 backdrop-blur-md pt-4 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-6 border-t border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[14px] font-medium text-[var(--text-muted)]">
              Service fee
            </span>
            <span className="text-[18px] sm:text-[20px] font-bold text-[var(--text-heading)]">
              ₦{totalFee.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            disabled={!canProceed}
            onClick={handleReview}
            className="w-full py-4 rounded-full bg-[#85e19e] hover:bg-[#74d38e] active:scale-[0.98] text-zinc-950 font-bold text-[16px] transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Review Report
          </button>
        </div>
      )}
    </div>

      {/* ── Drawer: Relationship to Incident ── */}
      {isRelationshipDrawerOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsRelationshipDrawerOpen(false)}
          />
          <div
            className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col border border-[var(--border-color)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-[var(--border-color)] rounded-full mx-auto mb-5 shrink-0" />
            <h3 className="text-[18px] font-bold text-[var(--text-heading)] text-center mb-6 shrink-0">
              Relationship to Incident
            </h3>

            <div className="divide-y divide-[var(--border-color)]">
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setRelationship(opt);
                    setIsRelationshipDrawerOpen(false);
                  }}
                  className={`w-full py-4 px-2 text-left text-[15px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    relationship === opt
                      ? "text-[var(--primary)] font-semibold"
                      : "text-[var(--text-body)] hover:text-[var(--primary)]"
                  }`}
                >
                  <span>{opt}</span>
                  {relationship === opt && (
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Drawer: Incident Type ── */}
      {isIncidentDrawerOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsIncidentDrawerOpen(false)}
          />
          <div
            className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col border border-[var(--border-color)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-[var(--border-color)] rounded-full mx-auto mb-5 shrink-0" />
            <h3 className="text-[18px] font-bold text-[var(--text-heading)] text-center mb-6 shrink-0">
              Select Incident Type
            </h3>

            <div className="divide-y divide-[var(--border-color)] overflow-y-auto max-h-[60vh]">
              {INCIDENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setIncidentType(type);
                    setIsIncidentDrawerOpen(false);
                  }}
                  className={`w-full py-4 px-2 text-left text-[15px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    incidentType === type
                      ? "text-[var(--primary)] font-semibold"
                      : "text-[var(--text-body)] hover:text-[var(--primary)]"
                  }`}
                >
                  <span>{type}</span>
                  {incidentType === type && (
                    <CheckCircle2 className="w-5 h-5 text-[var(--primary)]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
