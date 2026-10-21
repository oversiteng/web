"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Upload,
  X,
  FileText,
} from "lucide-react";

interface AgencyOption {
  id: string;
  name: string;
  shortName: string;
  desc: string;
}

const AGENCIES: AgencyOption[] = [
  {
    id: "npf",
    name: "Nigeria Police Force (NPF)",
    shortName: "NPF",
    desc: "Report filing, complaints, investigation follow-up",
  },
  {
    id: "lagos-task-force",
    name: "Lagos Task Force LSSOES",
    shortName: "Lagos Task Force",
    desc: "Illegal structures, touting, encroachment",
  },
  {
    id: "efcc",
    name: "EFCC",
    shortName: "EFCC",
    desc: "Financial fraud, cybercrime, asset recovery",
  },
  {
    id: "fccpc",
    name: "FCCPC",
    shortName: "FCCPC",
    desc: "Consumer rights, business misrepresentation",
  },
  {
    id: "lasbca",
    name: "LASBCA",
    shortName: "LASBCA",
    desc: "Unapproved structures, permit violations, structural risk",
  },
  {
    id: "icpc",
    name: "ICPC",
    shortName: "ICPC",
    desc: "Public sector corruption, misconduct petitions",
  },
];

export default function LawEnforcementPage() {
  const router = useRouter();

  // Form State
  const [selectedAgency, setSelectedAgency] = useState<AgencyOption | null>(null);
  const [matterType, setMatterType] = useState("");
  const [whatHappened, setWhatHappened] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [shieldIdentity, setShieldIdentity] = useState(false);
  const [emergencyEngagement, setEmergencyEngagement] = useState(true);

  // Drawer State
  const [isAgencyDrawerOpen, setIsAgencyDrawerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Restore draft if available
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("oversite_enforcement_draft");
      if (stored) {
        const draft = JSON.parse(stored);
        if (draft.agencyId) {
          const match = AGENCIES.find((a) => a.id === draft.agencyId);
          if (match) setSelectedAgency(match);
        }
        if (draft.matterType) setMatterType(draft.matterType);
        if (draft.whatHappened) setWhatHappened(draft.whatHappened);
        if (draft.shieldIdentity !== undefined) setShieldIdentity(draft.shieldIdentity);
        if (draft.emergencyEngagement !== undefined) setEmergencyEngagement(draft.emergencyEngagement);
      }
    } catch (e) {
      console.error("Failed to restore enforcement draft:", e);
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

  const handleReview = () => {
    const draft = {
      agencyId: selectedAgency?.id || "icpc",
      agencyName: selectedAgency?.name || "ICPC",
      agencyShortName: selectedAgency?.shortName || "ICPC",
      matterType: matterType.trim() || "Petition",
      whatHappened: whatHappened.trim(),
      fileName: attachedFile?.name || null,
      shieldIdentity,
      emergencyEngagement,
      serviceFee: 15000,
      filingCost: 7000,
      emergencyFee: emergencyEngagement ? 5000 : 0,
      totalFee: emergencyEngagement ? 27000 : 22000,
    };

    try {
      sessionStorage.setItem("oversite_enforcement_draft", JSON.stringify(draft));
    } catch (e) {
      console.error("Failed to save draft:", e);
    }

    const query = new URLSearchParams();
    query.set("agency", draft.agencyId);
    if (matterType) query.set("matter", matterType);
    if (emergencyEngagement) query.set("emergency", "true");
    if (shieldIdentity) query.set("shield", "true");

    router.push(`/enforcement/review?${query.toString()}`);
  };

  const canProceed = Boolean(selectedAgency);

  return (
    <div className="bg-(--bg-body) min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-(--text-heading) transition-colors duration-150">
      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4">
        <div>
          {/* ── Top Header ── */}
          <div className="relative flex items-center justify-center py-3 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute left-0 p-2 -ml-2 text-(--text-heading) hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] sm:text-[18px] font-bold text-(--text-heading) tracking-tight">
              Law Enforcement
            </h1>
          </div>

          <div className="space-y-4">
            {/* Field 1: Agency */}
            <div>
              <label className="block text-[13.5px] font-semibold text-(--text-heading) mb-2">
                Agency
              </label>

              <button
                type="button"
                onClick={() => setIsAgencyDrawerOpen(true)}
                className="w-full bg-(--bg-card) rounded-[20px] px-4 py-3.5 flex items-center justify-between text-[14px] text-left cursor-pointer border border-(--border-color) hover:border-(--border-color)/80 transition-all shadow-xs"
              >
                <span
                  className={
                    selectedAgency
                      ? "text-(--text-heading) font-medium truncate pr-2"
                      : "text-(--text-muted)"
                  }
                >
                  {selectedAgency ? selectedAgency.name : "Choose agency"}
                </span>
                <ChevronDown className="w-5 h-5 text-(--text-muted) shrink-0" />
              </button>
            </div>

            {/* Field 2: Matter type */}
            <div>
              <label className="block text-[13.5px] font-semibold text-(--text-heading) mb-2">
                Matter type
              </label>
              <input
                type="text"
                value={matterType}
                onChange={(e) => setMatterType(e.target.value)}
                placeholder=""
                className="w-full bg-(--bg-card) rounded-[20px] px-4 py-3.5 text-[14px] text-(--text-heading) placeholder:text-(--text-muted) border border-(--border-color) focus:border-(--primary) focus:outline-none transition-all shadow-xs"
              />
            </div>

            {/* Field 3: What happened */}
            <div>
              <label className="block text-[13.5px] font-semibold text-(--text-heading) mb-2">
                What happened
              </label>
              <textarea
                rows={4}
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                placeholder=""
                className="w-full bg-(--bg-card) rounded-[22px] px-4 py-3.5 text-[14px] text-(--text-heading) placeholder:text-(--text-muted) border border-(--border-color) focus:border-(--primary) focus:outline-none transition-all shadow-xs resize-none min-h-[120px]"
              />
            </div>

            {/* Field 4: Add a file */}
            <div>
              <label className="block text-[13.5px] font-semibold text-(--text-heading) mb-2">
                Add a file
              </label>

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
                  className="rounded-[22px] bg-(--bg-card) p-6 border border-(--border-color) shadow-xs flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-(--primary)/40 active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-full bg-(--primary-light) text-(--primary) flex items-center justify-center mb-2.5">
                    <Upload className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <span className="text-[14px] font-semibold text-(--primary)">
                    Tap to upload file
                  </span>
                  <span className="text-[11.5px] text-(--text-muted) mt-1">
                    Supported formats: PDF, JPG, PNG (Max 5MB)
                  </span>
                </div>
              ) : (
                <div className="rounded-[22px] bg-(--bg-card) p-4 border border-(--border-color) shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate pr-2">
                    <div className="w-10 h-10 rounded-xl bg-(--primary-light) text-(--primary) flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-[13.5px] font-semibold text-(--text-heading) truncate">
                        {attachedFile.name}
                      </p>
                      <p className="text-[11px] text-(--text-muted)">
                        {(attachedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Field 5: Shield my identity */}
            <div className="rounded-[22px] bg-(--bg-card) p-4.5 sm:p-5 border border-(--border-color) shadow-xs flex items-center justify-between gap-4">
              <div className="flex-1 pr-1">
                <h3 className="text-[14.5px] font-bold text-(--text-heading)">
                  Shield my identity
                </h3>
                <p className="text-[12px] text-(--text-muted) mt-1 leading-relaxed">
                  File through Oversite as the name party. The agency receives OverSite as the
                  filing party. Your name stays with us.
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setShieldIdentity(!shieldIdentity)}
                className={`w-12 h-7 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
                  shieldIdentity ? "bg-(--primary)" : "bg-(--border-color)"
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

            {/* Field 6: Emergency engagement */}
            <div className="rounded-[22px] bg-(--bg-card) p-4.5 sm:p-5 border border-(--border-color) shadow-xs flex items-center justify-between gap-4">
              <div className="flex-1 pr-1">
                <h3 className="text-[14.5px] font-bold text-(--text-heading)">
                  Emergency engagement
                </h3>
                <p className="text-[12px] text-(--text-muted) mt-1">
                  2-hour response SLA · +₦5,000
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setEmergencyEngagement(!emergencyEngagement)}
                className={`w-12 h-7 rounded-full p-1 transition-colors relative cursor-pointer shrink-0 ${
                  emergencyEngagement ? "bg-(--primary)" : "bg-(--border-color)"
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
        </div>

        {/* ── Bottom Sticky Bar ── */}
        <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-(--bg-body)/95 backdrop-blur-md pt-4 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-6 border-t border-(--border-color)">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[14px] font-medium text-(--text-muted)">
              Service fee
            </span>
            <span className="text-[18px] sm:text-[20px] font-bold text-(--text-heading)">
              ₦20,000
            </span>
          </div>

          <button
            type="button"
            disabled={!canProceed}
            onClick={handleReview}
            className="w-full py-3.5 sm:py-4 rounded-full bg-(--primary) hover:bg-(--primary-hover) active:scale-[0.98] text-white font-bold text-[16px] transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Review
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          BOTTOM DRAWER: Select Agency
         ───────────────────────────────────────────────────────────── */}
      {isAgencyDrawerOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsAgencyDrawerOpen(false)}
          />
          <div
            className="relative w-full max-w-lg bg-(--bg-card) rounded-t-[32px] sm:rounded-[32px] p-6 pb-10 sm:pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200 max-h-[85vh] flex flex-col border border-(--border-color)"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="w-12 h-1 bg-(--border-color) rounded-full mx-auto mb-5 shrink-0" />

            <h3 className="text-[18px] font-bold text-(--text-heading) text-center mb-6 shrink-0">
              Select Agency
            </h3>

            {/* Agency List */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {AGENCIES.map((agency) => {
                const isSelected = selectedAgency?.id === agency.id;
                return (
                  <button
                    key={agency.id}
                    type="button"
                    onClick={() => {
                      setSelectedAgency(agency);
                      setIsAgencyDrawerOpen(false);
                    }}
                    className={`w-full py-2.5 px-3 rounded-2xl text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-(--bg-secondary)"
                        : "hover:bg-(--bg-secondary)/60"
                    }`}
                  >
                    <p className="text-[15px] font-bold text-(--text-heading)">
                      {agency.name}
                    </p>
                    <p className="text-[12.5px] text-(--text-muted) mt-0.5 leading-snug">
                      {agency.desc}
                    </p>
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
