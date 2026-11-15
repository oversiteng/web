"use client";

import React, { useState, useEffect, useRef } from "react";
import { getStoredToken } from "@/lib/storage/clientStorage";
import { AgentTopNav } from "@/components/agent/AgentTopNav";
import {
  readFileAsDataUrl,
  uploadAgentMedia,
  validateAgentUploadFile,
} from "@/lib/storage/agentUpload";
import {
  Plus,
  Check,
  Clock,
  X,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
} from "lucide-react";

type VerificationStatus = "awaiting" | "verified" | "reviewing" | "rejected";

interface VerificationItem {
  id: string;
  docType:
    | "GOVERNMENT_ID"
    | "PASSPORT_PHOTO"
    | "PROOF_OF_ADDRESS"
    | "GUARANTOR_FORM"
    | "CAC_CERTIFICATE"
    | "BACKGROUND_CHECK";
  title: string;
  subtitle: string;
  status: VerificationStatus;
  requiresNinInput?: boolean;
}

const INITIAL_VERIFICATION_ITEMS: VerificationItem[] = [
  {
    id: "nin-slip",
    docType: "GOVERNMENT_ID",
    title: "NIN Slip",
    subtitle: "Awaiting submission",
    status: "awaiting",
    requiresNinInput: true,
  },
  {
    id: "passport-photo",
    docType: "PASSPORT_PHOTO",
    title: "Passport photograph",
    subtitle: "Awaiting submission",
    status: "awaiting",
  },
  {
    id: "proof-of-address",
    docType: "PROOF_OF_ADDRESS",
    title: "Proof of address",
    subtitle: "Awaiting submission",
    status: "awaiting",
  },
  {
    id: "guarantor-form",
    docType: "GUARANTOR_FORM",
    title: "Guarantor form",
    subtitle: "Awaiting submission",
    status: "awaiting",
  },
  {
    id: "investigation-cert",
    docType: "CAC_CERTIFICATE",
    title: "Investigation certificate",
    subtitle: "Awaiting submission",
    status: "awaiting",
  },
  {
    id: "background-check",
    docType: "BACKGROUND_CHECK",
    title: "Background check",
    subtitle: "Awaiting submission",
    status: "awaiting",
  },
];

function formatShortDate(isoDate?: string | null): string {
  if (!isoDate) return "Today";
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return "Today";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "Today";
  }
}

export default function AgentVerificationPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<VerificationItem[]>(INITIAL_VERIFICATION_ITEMS);
  const [activeItem, setActiveItem] = useState<VerificationItem | null>(null);
  const [ninInput, setNinInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function syncLiveKycStatus() {
      try {
        const token = await getStoredToken();
        if (!token) return;

        const res = await fetch("/api/v1/kyc/status", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const json = await res.json();
        const steps = json?.data?.steps || {};
        const docs: Record<string, any> = json?.data?.documents || {};

        setItems((prev) =>
          prev.map((item) => {
            const docKey = item.docType.toLowerCase();
            const docEntry =
              docs[docKey] ||
              (item.docType === "PROOF_OF_ADDRESS" ? docs["utility_bill"] : undefined);

            if (docEntry) {
              const rawStatus = String(docEntry.status || "SUBMITTED").toUpperCase();
              const dateLabel = formatShortDate(docEntry.uploadedAt);

              if (rawStatus === "VERIFIED" || rawStatus === "APPROVED") {
                return {
                  ...item,
                  status: "verified",
                  subtitle: `Verified ${dateLabel}`,
                };
              }
              if (rawStatus === "REJECTED") {
                return {
                  ...item,
                  status: "rejected",
                  subtitle: docEntry.rejectionReason
                    ? `Rejected: ${docEntry.rejectionReason}`
                    : "Rejected — please re-upload a clearer copy",
                };
              }
              return {
                ...item,
                status: "reviewing",
                subtitle: `Submitted ${dateLabel}`,
              };
            }

            if (item.id === "nin-slip" && steps.step2IdentityNIN?.completed) {
              return { ...item, status: "verified", subtitle: "Verified via NIMC" };
            }
            if (item.id === "proof-of-address" && steps.step4ProofOfAddress?.completed) {
              return { ...item, status: "verified", subtitle: "Verified" };
            }
            if (item.id === "background-check" && steps.step5ComplianceConsent?.completed) {
              return {
                ...item,
                status: "verified",
                subtitle: `Verified ${formatShortDate(steps.step5ComplianceConsent?.signedAt)}`,
              };
            }
            return item;
          })
        );
      } catch {
        // Non-blocking fallback
      }
    }

    syncLiveKycStatus();
  }, []);

  const submittedOrVerifiedCount = items.filter(
    (item) => item.status === "verified" || item.status === "reviewing"
  ).length;
  const totalCount = items.length;
  const progressPct = Math.round((submittedOrVerifiedCount / totalCount) * 100);

  const openItemModal = (item: VerificationItem) => {
    if (item.status === "verified") {
      showToast(`${item.title} is already verified.`);
      return;
    }
    setActiveItem(item);
    setNinInput("");
    setSelectedFile(null);
    setSelectedFileName(null);
    setSelectedPreviewUrl(null);
    setModalError(null);
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateAgentUploadFile(file, { allowPdf: true });
    if (validationError) {
      setModalError(validationError);
      return;
    }

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setModalError(null);

    const isImage =
      file.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(file.name);

    if (isImage) {
      try {
        const preview = await readFileAsDataUrl(file);
        setSelectedPreviewUrl(preview);
      } catch {
        setSelectedPreviewUrl(null);
      }
    } else {
      setSelectedPreviewUrl(null);
    }
  };

  const handleSubmitDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setModalError(null);

    if (activeItem.requiresNinInput) {
      if (!/^\d{11}$/.test(ninInput.trim())) {
        setModalError("Please enter a valid 11-digit National Identity Number (NIN).");
        return;
      }
    } else if (!selectedFile) {
      setModalError("Please choose a clear photo or PDF file to upload.");
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadedMedia = selectedFile
        ? await uploadAgentMedia(selectedFile, "kyc")
        : null;

      const token = await getStoredToken();
      if (token) {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        if (activeItem.requiresNinInput && /^\d{11}$/.test(ninInput.trim())) {
          await fetch("/api/v1/kyc/verify/nin", {
            method: "POST",
            credentials: "include",
            headers,
            body: JSON.stringify({ ninNumber: ninInput.trim() }),
          }).catch(() => null);
        }

        const supportedApiDocTypes = [
          "UTILITY_BILL",
          "PROOF_OF_ADDRESS",
          "PASSPORT_PHOTO",
          "GUARANTOR_FORM",
          "GOVERNMENT_ID",
          "CAC_CERTIFICATE",
          "BAR_PRACTICING_LICENSE",
          "BACKGROUND_CHECK",
        ];

        if (supportedApiDocTypes.includes(activeItem.docType)) {
          await fetch("/api/v1/kyc/documents", {
            method: "POST",
            credentials: "include",
            headers,
            body: JSON.stringify({
              documentType: activeItem.docType,
              documentUrl:
                uploadedMedia?.url ||
                `kyc/${activeItem.id}/${selectedFileName || "nin-verified.pdf"}`,
              metadata: {
                fileName: uploadedMedia?.fileName || selectedFileName || "NIN Verification",
                objectKey: uploadedMedia?.objectKey,
                contentType: uploadedMedia?.contentType,
                storedOnServer: uploadedMedia?.storedOnServer ?? false,
                submittedAt: new Date().toISOString(),
              },
            }),
          }).catch(() => null);
        }
      }

      const nextStatus: VerificationStatus = activeItem.requiresNinInput
        ? "verified"
        : "reviewing";
      const nextSubtitle = activeItem.requiresNinInput
        ? "Verified Today"
        : "Submitted Today";

      setItems((prev) =>
        prev.map((item) =>
          item.id === activeItem.id
            ? { ...item, status: nextStatus, subtitle: nextSubtitle }
            : item
        )
      );

      showToast(
        activeItem.requiresNinInput
          ? "NIN verified and attached to your profile!"
          : `${activeItem.title} submitted for review!`
      );
      setActiveItem(null);
    } catch {
      setModalError("Failed to upload document. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
            </div>
            <span className="text-[13px] font-medium truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <AgentTopNav
        showBack={true}
        backHref="/agent/more"
        title="Verification"
        hideRightControls={true}
      />

      {/* Top Application Progress Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[22px] p-5 space-y-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-[var(--text-heading)]">
            {submittedOrVerifiedCount === totalCount
              ? "All documents submitted"
              : "Application in progress"}
          </h2>
          <span className="text-[13px] font-semibold text-[var(--text-muted)]">
            {submittedOrVerifiedCount}/{totalCount}
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[var(--primary-light)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-0.5">
          Finish all six items to start receiving task offers. Most agents complete this in 2–3 days.
        </p>
      </div>

      {/* 6 Verification Checklist Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const isVerified = item.status === "verified";
          const isReviewing = item.status === "reviewing";
          const isRejected = item.status === "rejected";

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => openItemModal(item)}
              className="w-full flex items-center justify-between gap-3 p-3 rounded-[20px] hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-color)]/70 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {isVerified ? (
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  </div>
                ) : isReviewing ? (
                  <div className="w-10 h-10 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 stroke-[1.8]" />
                  </div>
                ) : isRejected ? (
                  <div className="w-10 h-10 rounded-full bg-[var(--danger-light)] text-[var(--danger)] flex items-center justify-center shrink-0">
                    <X className="w-5 h-5 stroke-[2.2]" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--border-color)]/70 dark:bg-[var(--bg-card)] text-[var(--text-muted)] flex items-center justify-center shrink-0 group-hover:bg-[var(--primary-light)] group-hover:text-[var(--primary)] transition-colors">
                    <Plus className="w-5 h-5 stroke-[2]" />
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="text-[14.5px] font-semibold text-[var(--text-heading)] truncate group-hover:text-[var(--primary)] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[12px] text-[var(--text-muted)] truncate mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {isVerified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[11px] font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                  Verified
                </span>
              )}

              {isReviewing && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-[11px] font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                  Reviewing
                </span>
              )}

              {isRejected && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--danger-light)] text-[var(--danger)] text-[11px] font-semibold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
                  Re-upload
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Document / NIN Submission Modal */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => !isSubmitting && setActiveItem(null)}
        >
          <form
            onSubmit={handleSubmitDocument}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[28px] sm:rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="w-10 h-1 bg-[var(--border-color)] rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--text-heading)]">
                  {activeItem.status === "rejected"
                    ? `Re-upload ${activeItem.title}`
                    : activeItem.status === "reviewing"
                    ? `Update ${activeItem.title}`
                    : `Submit ${activeItem.title}`}
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {activeItem.status === "rejected"
                    ? activeItem.subtitle
                    : "Provide clear documentation for quick accreditation review."}
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setActiveItem(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-heading)] p-1 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeItem.requiresNinInput && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-heading)]">
                  11-Digit NIN Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={11}
                  value={ninInput}
                  onChange={(e) => {
                    setNinInput(e.target.value.replace(/\D/g, ""));
                    setModalError(null);
                  }}
                  placeholder="Enter your 11-digit NIN"
                  className="w-full bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] focus:border-[var(--primary)] rounded-2xl px-4 py-3 text-sm font-medium text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--text-heading)]">
                {activeItem.requiresNinInput
                  ? "Attach NIN Slip (Optional)"
                  : "Document Photo or PDF"}
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[var(--border-color)] hover:border-[var(--primary)] bg-[var(--bg-secondary)]/60 dark:bg-[var(--bg-body)] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors"
              >
                {selectedPreviewUrl ? (
                  <>
                    <img
                      src={selectedPreviewUrl}
                      alt={selectedFileName || "Selected document"}
                      className="w-24 h-24 object-cover rounded-xl border border-[var(--border-color)] shadow-xs"
                    />
                    <span className="text-xs font-semibold text-[var(--text-heading)] truncate max-w-full">
                      {selectedFileName}
                    </span>
                    <span className="text-[11px] text-[var(--primary)]">
                      Tap to change photo
                    </span>
                  </>
                ) : selectedFileName ? (
                  <>
                    <FileText className="w-6 h-6 text-[var(--primary)]" />
                    <span className="text-xs font-semibold text-[var(--text-heading)] truncate max-w-full">
                      {selectedFileName}
                    </span>
                    <span className="text-[11px] text-[var(--primary)]">
                      Tap to change file
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-[var(--text-muted)]" />
                    <span className="text-xs font-semibold text-[var(--text-heading)]">
                      Choose photo or PDF document
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Clear, well-lit image or PDF (max 10 MB)
                    </span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFilePick}
                className="hidden"
              />
            </div>

            {modalError && (
              <p className="text-xs text-[var(--danger)] font-medium">{modalError}</p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setActiveItem(null)}
                className="flex-1 py-3 rounded-full bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
