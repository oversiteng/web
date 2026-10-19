"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Upload,
  FileText,
  X,
  Building2,
  User,
} from "lucide-react";

interface DueDiligenceTier {
  id: string;
  tierNumber: number;
  title: string;
  price: number;
  priceFormatted: string;
  turnaround: string;
  scope: string;
}

const DUE_DILIGENCE_TIERS: DueDiligenceTier[] = [
  {
    id: "tier-1",
    tierNumber: 1,
    title: "Tier 1 • Basic Identity",
    price: 8000,
    priceFormatted: "₦8,000",
    turnaround: "12 – 24 hrs",
    scope: "NIN/BVN, address, social audit",
  },
  {
    id: "tier-2",
    tierNumber: 2,
    title: "Tier 2 • Business & Vendor",
    price: 15000,
    priceFormatted: "₦15,000",
    turnaround: "24 – 48 hrs",
    scope: "CAC, address, directors, references",
  },
  {
    id: "tier-3",
    tierNumber: 3,
    title: "Tier 3 • Premium Identity",
    price: 30000,
    priceFormatted: "₦30,000",
    turnaround: "48 – 72 hrs",
    scope: "court records, EFCC/ICPC, clearance",
  },
  {
    id: "tier-4",
    tierNumber: 4,
    title: "Tier 4 • Dispute Dossier",
    price: 50000,
    priceFormatted: "₦50,000",
    turnaround: "72 hrs+",
    scope: "field evidence, witness statements",
  },
];

export default function DueDiligenceFormPage() {
  const router = useRouter();

  // Form State
  const [subjectType, setSubjectType] = useState<"individual" | "business">("individual");
  const [targetName, setTargetName] = useState("");
  const [rcNin, setRcNin] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [specificNotes, setSpecificNotes] = useState("");
  const [selectedTierId, setSelectedTierId] = useState<string>("tier-2");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTier =
    DUE_DILIGENCE_TIERS.find((t) => t.id === selectedTierId) ||
    DUE_DILIGENCE_TIERS[1];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canProceed = targetName.trim().length >= 2;

  const handleReview = () => {
    if (!canProceed) return;

    const draft = {
      subjectType,
      targetName: targetName.trim(),
      rcNin: rcNin.trim(),
      phoneNumber: phoneNumber.trim(),
      specificNotes: specificNotes.trim(),
      tierId: selectedTier.id,
      tierTitle: selectedTier.title,
      tierPrice: selectedTier.price,
      tierTurnaround: selectedTier.turnaround,
      tierScope: selectedTier.scope,
      fileName: attachedFile ? attachedFile.name : null,
    };

    sessionStorage.setItem("oversite_diligence_draft", JSON.stringify(draft));

    const query = new URLSearchParams({
      type: subjectType,
      name: targetName.trim(),
      tier: selectedTier.id,
      price: selectedTier.price.toString(),
    });

    router.push(`/diligence/review?${query.toString()}`);
  };

  return (
    <div className="bg-[#F2F4F2] dark:bg-[#111412] min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-[var(--text-heading)] transition-colors duration-150">
      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4">
        <div>
          {/* ── Top Header ── */}
          <div className="relative flex items-center justify-center py-3 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute left-0 p-2 -ml-2 text-zinc-800 dark:text-zinc-200 hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] sm:text-[18px] font-bold text-zinc-900 dark:text-white tracking-tight">
              Due Diligence
            </h1>
          </div>

          <div className="space-y-4">
            {/* Field 1: Who are you checking? */}
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Who are you checking?
              </label>

              {/* Segmented Toggle Pill (Matches Figma Screenshot 1) */}
              <div className="w-full bg-white dark:bg-[#1E2220] rounded-full p-1 flex items-center border border-zinc-200/60 dark:border-zinc-800 shadow-xs">
                <button
                  type="button"
                  onClick={() => setSubjectType("individual")}
                  className={`w-1/2 py-2.5 rounded-full text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    subjectType === "individual"
                      ? "bg-[#2BB44A] text-white shadow-xs"
                      : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-900"
                  }`}
                >
                  {subjectType === "individual" && <Check className="w-4 h-4 stroke-[2.5]" />}
                  <span>Individual</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSubjectType("business")}
                  className={`w-1/2 py-2.5 rounded-full text-[13.5px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    subjectType === "business"
                      ? "bg-[#2BB44A] text-white shadow-xs"
                      : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-900"
                  }`}
                >
                  {subjectType === "business" && <Check className="w-4 h-4 stroke-[2.5]" />}
                  <span>Business</span>
                </button>
              </div>
            </div>

            {/* Field 2: Business name / Individual Name */}
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                {subjectType === "business" ? "Business name" : "Business name"}
              </label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder=""
                className="w-full bg-white dark:bg-[#1E2220] rounded-[20px] px-4 py-3.5 text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border border-transparent focus:border-[var(--primary)] focus:outline-none transition-all shadow-xs"
              />
            </div>

            {/* Field 3: RC/NIN */}
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                RC/NIN
              </label>
              <input
                type="text"
                value={rcNin}
                onChange={(e) => setRcNin(e.target.value)}
                placeholder=""
                className="w-full bg-white dark:bg-[#1E2220] rounded-[20px] px-4 py-3.5 text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border border-transparent focus:border-[var(--primary)] focus:outline-none transition-all shadow-xs"
              />
            </div>

            {/* Field 4: Phone Number */}
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Phone Number
              </label>
              <div className="w-full bg-white dark:bg-[#1E2220] rounded-[20px] px-4 py-2.5 flex items-center shadow-xs border border-transparent focus-within:border-[var(--primary)] transition-all">
                <span className="text-[14px] font-semibold text-zinc-900 dark:text-white pr-3 select-none">
                  +234
                </span>
                <span className="text-zinc-300 dark:text-zinc-700 pr-3 select-none">
                  |
                </span>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="801 234 5678"
                  className="w-full bg-transparent text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Field 5: Anything specific we should look into? */}
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Anything specific we should look into?
              </label>
              <textarea
                rows={4}
                value={specificNotes}
                onChange={(e) => setSpecificNotes(e.target.value)}
                placeholder=""
                className="w-full bg-white dark:bg-[#1E2220] rounded-[22px] p-4 text-[14px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 border border-transparent focus:border-[var(--primary)] focus:outline-none transition-all shadow-xs resize-none"
              />
            </div>

            {/* Section 6: Depth of check (Matches Figma Screenshot 2) */}
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Depth of check
              </label>

              <div className="space-y-3">
                {DUE_DILIGENCE_TIERS.map((tier) => {
                  const isSelected = selectedTierId === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTierId(tier.id)}
                      className={`w-full p-4 sm:p-5 rounded-[20px] cursor-pointer transition-all duration-150 flex items-start gap-3.5 shadow-xs ${
                        isSelected
                          ? "bg-white dark:bg-[#1E2220] border-2 border-[#2BB44A]"
                          : "bg-white dark:bg-[#1E2220] border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {/* Radio Circle */}
                      <div className="mt-0.5 shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-[#2BB44A] bg-transparent"
                              : "border-zinc-400 dark:border-zinc-600 bg-transparent"
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2.5 h-2.5 rounded-full bg-[#2BB44A]" />
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-[14.5px] sm:text-[15px] font-bold text-zinc-900 dark:text-white leading-snug">
                            {tier.title}
                          </h3>
                          <span className="text-[14.5px] sm:text-[15px] font-bold text-zinc-900 dark:text-white shrink-0">
                            {tier.priceFormatted}
                          </span>
                        </div>
                        <p className="text-[12px] sm:text-[12.5px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                          {tier.turnaround} • {tier.scope}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 7: Upload file (Matches Figma Screenshot 2) */}
            <div>
              <label className="block text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
                Upload file
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />

              {!attachedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-white dark:bg-[#1E2220] rounded-[22px] p-6 text-center cursor-pointer border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-xs group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#EAF7ED] dark:bg-[#1E2E23] flex items-center justify-center mx-auto mb-2 text-[#2BB44A] group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6 stroke-[2]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#2BB44A]">
                    Tap to upload file
                  </p>
                  <p className="text-[12px] text-zinc-400 dark:text-zinc-500 mt-1">
                    Supported formats: PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>
              ) : (
                <div className="w-full bg-white dark:bg-[#1E2220] rounded-[22px] p-4 flex items-center justify-between shadow-xs border border-transparent">
                  <div className="flex items-center gap-3 truncate pr-2">
                    <div className="w-10 h-10 rounded-xl bg-[#EAF7ED] dark:bg-[#1E2E23] text-[#2BB44A] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-[13.5px] font-semibold text-zinc-900 dark:text-white truncate">
                        {attachedFile.name}
                      </p>
                      <p className="text-[11.5px] text-zinc-400">
                        {(attachedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom Sticky Bar ── */}
        <div className="sticky bottom-[68px] md:bottom-0 z-40 bg-[#F2F4F2]/95 dark:bg-[#111412]/95 backdrop-blur-md pt-4 pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-6 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[14px] font-medium text-zinc-500 dark:text-zinc-400">
              Service fee
            </span>
            <span className="text-[18px] sm:text-[20px] font-bold text-zinc-900 dark:text-white">
              {selectedTier.id === "tier-2" ? "₦26,100" : selectedTier.priceFormatted}
            </span>
          </div>

          <button
            type="button"
            disabled={!canProceed}
            onClick={handleReview}
            className="w-full py-3.5 sm:py-4 rounded-full bg-[#2BB44A] hover:bg-[#259b40] active:scale-[0.98] text-white font-bold text-[16px] transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Review
          </button>
        </div>
      </div>
    </div>
  );
}
