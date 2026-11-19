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
  ArrowLeft,
  Camera,
  Upload,
  Download,
  Check,
  CheckCircle2,
  Clock,
  X,
  Loader2,
  Plus,
  FileText,
  Shield,
  RotateCcw,
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
    | "INVESTIGATION_CERTIFICATE"
    | "BACKGROUND_CHECK";
  title: string;
  subtitle: string;
  status: VerificationStatus;
}

const INITIAL_VERIFICATION_ITEMS: VerificationItem[] = [
  {
    id: "nin-slip",
    docType: "GOVERNMENT_ID",
    title: "NIN Verification",
    subtitle: "Awaiting submission",
    status: "awaiting",
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
    docType: "INVESTIGATION_CERTIFICATE",
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [items, setItems] = useState<VerificationItem[]>(INITIAL_VERIFICATION_ITEMS);
  const [activeItem, setActiveItem] = useState<VerificationItem | null>(null);

  // Live WebRTC Camera states (never opens file explorer)
  const [cameraMode, setCameraMode] = useState<"closed" | "selfie-inline" | "doc-modal">("closed");
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  // Form field states for the 6 specific screens
  const [ninInput, setNinInput] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [issuingBody, setIssuingBody] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [certIssuedDate, setCertIssuedDate] = useState("");
  const [certExpiryDate, setCertExpiryDate] = useState("");
  const [backgroundConsent, setBackgroundConsent] = useState(true);

  // Upload & capture states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const syncLiveKycStatus = async () => {
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
          let docEntry: any = null;
          if (item.id === "nin-slip") {
            docEntry = docs.government_id;
            if (steps.step2IdentityNIN?.completed) {
              return { ...item, status: "verified", subtitle: "Verified via NIMC" };
            }
          } else if (item.id === "passport-photo") {
            docEntry = docs.passport_photo;
          } else if (item.id === "proof-of-address") {
            docEntry = docs.proof_of_address || docs.utility_bill;
            if (steps.step4ProofOfAddress?.completed) {
              return { ...item, status: "verified", subtitle: "Verified" };
            }
          } else if (item.id === "guarantor-form") {
            docEntry = docs.guarantor_form;
          } else if (item.id === "investigation-cert") {
            docEntry = docs.investigation_certificate || docs.cac_certificate;
          } else if (item.id === "background-check") {
            docEntry = docs.background_check;
            if (steps.step5ComplianceConsent?.completed) {
              return {
                ...item,
                status: "verified",
                subtitle: `Verified ${formatShortDate(steps.step5ComplianceConsent?.signedAt)}`,
              };
            }
          }

          if (docEntry) {
            const rawStatus = String(docEntry.status || "SUBMITTED").toUpperCase();
            const dateLabel = formatShortDate(docEntry.uploadedAt);

            if (rawStatus === "VERIFIED" || rawStatus === "APPROVED") {
              return { ...item, status: "verified", subtitle: `Verified ${dateLabel}` };
            }
            if (rawStatus === "REJECTED") {
              return {
                ...item,
                status: "rejected",
                subtitle: docEntry.rejectionReason
                  ? `Rejected: ${docEntry.rejectionReason}`
                  : "Rejected — please re-submit a clearer copy",
              };
            }
            return { ...item, status: "reviewing", subtitle: `Submitted ${dateLabel}` };
          }

          return item;
        })
      );
    } catch {
      // Non-blocking fallback
    }
  };

  useEffect(() => {
    syncLiveKycStatus();
  }, []);

  const submittedOrVerifiedCount = items.filter(
    (item) => item.status === "verified" || item.status === "reviewing"
  ).length;
  const totalCount = items.length;
  const progressPct = Math.round((submittedOrVerifiedCount / totalCount) * 100);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraMode("closed");
    setIsStartingCamera(false);
  };

  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // Attach active MediaStream to <video> whenever cameraMode or videoRef mounts
  useEffect(() => {
    if (cameraMode !== "closed" && videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch(() => null);
    }
  }, [cameraMode, isStartingCamera]);

  const startLiveCamera = async (
    mode: "selfie-inline" | "doc-modal",
    facing: "user" | "environment"
  ) => {
    setFormError(null);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setFormError(
        "Live camera access is not available in this browser or requires a secure HTTPS connection."
      );
      return;
    }

    setCameraMode(mode);
    setCameraFacingMode(facing);
    setIsStartingCamera(true);

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });
      } catch {
        // Fallback for single-camera laptops/desktops that reject facingMode constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => null);
      }
    } catch (err: any) {
      setCameraMode("closed");
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setFormError("Camera permission was denied. Please allow camera access in your browser settings and try again.");
      } else if (err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError") {
        setFormError("No camera device was detected on this device.");
      } else {
        setFormError("Unable to start the camera. Please ensure no other app is using it and try again.");
      }
    } finally {
      setIsStartingCamera(false);
    }
  };

  const captureFromCamera = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setFormError("Camera is still initializing. Please wait a moment and try capturing again.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror horizontally for front-facing selfie so snapshot matches viewfinder
    if (cameraFacingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const fileLabel =
      activeItem?.id === "passport-photo"
        ? `passport-photo-${Date.now()}.jpg`
        : `${activeItem?.id || "document"}-capture-${Date.now()}.jpg`;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setFormError("Failed to capture photo. Please try again.");
          return;
        }
        const capturedFile = new File([blob], fileLabel, { type: "image/jpeg" });
        setSelectedFile(capturedFile);
        setSelectedFileName(fileLabel);
        setSelectedPreviewUrl(dataUrl);
        setFormError(null);
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const openFlowScreen = (item: VerificationItem) => {
    stopCamera();
    setActiveItem(item);
    setSelectedFile(null);
    setSelectedFileName(null);
    setSelectedPreviewUrl(null);
    setFormError(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateAgentUploadFile(file, { allowPdf: true });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setFormError(null);

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

  const handleDownloadBlankForm = () => {
    const element = document.createElement("a");
    const content = `OVERSITE FIELD OPERATIVE GUARANTOR VERIFICATION FORM\n\nGuarantor Name: ___________________________\nGuarantor Phone: +234 _____________________\nGuarantor Occupation: _____________________\nGuarantor Address: ________________________\nRelationship to Agent: _____________________\n\nDeclaration: I confirm the applicant is known to me and of good character.\nSignature & Date: _________________________`;
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "Oversite_Guarantor_Form.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast("Downloaded blank guarantor form");
  };

  const handleSubmitFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;
    setFormError(null);

    // Validation per flow
    if (activeItem.id === "nin-slip") {
      if (!/^\d{11}$/.test(ninInput.trim())) {
        setFormError("Please enter a valid 11-digit NIN.");
        return;
      }
      if (!selectedFile) {
        setFormError("Please upload or snap your NIN slip.");
        return;
      }
    } else if (activeItem.id === "passport-photo") {
      if (!selectedFile) {
        setFormError("Please take your passport photograph using the camera.");
        return;
      }
    } else if (activeItem.id === "proof-of-address") {
      if (!residentialAddress.trim()) {
        setFormError("Please enter your residential address.");
        return;
      }
      if (!selectedFile) {
        setFormError("Please upload or snap a proof of address document.");
        return;
      }
    } else if (activeItem.id === "guarantor-form") {
      if (!guarantorName.trim()) {
        setFormError("Please enter your guarantor's full name.");
        return;
      }
      if (!guarantorPhone.trim() || guarantorPhone.trim().length < 8) {
        setFormError("Please enter your guarantor's phone number.");
        return;
      }
      if (!selectedFile) {
        setFormError("Please upload or snap the completed guarantor form.");
        return;
      }
    } else if (activeItem.id === "investigation-cert") {
      if (!issuingBody.trim()) {
        setFormError("Please enter the issuing body name.");
        return;
      }
      if (!certNumber.trim()) {
        setFormError("Please enter your certificate number.");
        return;
      }
      if (!selectedFile) {
        setFormError("Please upload or snap your investigation certificate.");
        return;
      }
    } else if (activeItem.id === "background-check") {
      if (!backgroundConsent) {
        setFormError("You must permit OverSite to conduct background checks to continue.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let uploadedMedia = null;
      if (selectedFile) {
        uploadedMedia = await uploadAgentMedia(selectedFile, "kyc");
      }

      const token = await getStoredToken();
      if (!token) throw new Error("Authentication token not found.");

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Specific API dispatches
      if (activeItem.id === "nin-slip" && /^\d{11}$/.test(ninInput.trim())) {
        await fetch("/api/v1/kyc/verify/nin", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ ninNumber: ninInput.trim() }),
        }).catch(() => null);
      }

      if (activeItem.id === "background-check") {
        await fetch("/api/v1/kyc/consent", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            consentBackgroundCheck: true,
            consentTermsAndConditions: true,
            signatureFullName: "Agent Field Consent",
          }),
        }).catch(() => null);
      }

      // Metadata compilation
      const metadata: Record<string, any> = {
        submittedAt: new Date().toISOString(),
        fileName: uploadedMedia?.fileName || selectedFileName || `${activeItem.id}-submitted`,
        objectKey: uploadedMedia?.objectKey,
        contentType: uploadedMedia?.contentType,
      };

      if (activeItem.id === "proof-of-address") {
        metadata.residentialAddress = residentialAddress.trim();
      } else if (activeItem.id === "guarantor-form") {
        metadata.guarantorName = guarantorName.trim();
        metadata.guarantorPhone = `+234${guarantorPhone.trim()}`;
      } else if (activeItem.id === "investigation-cert") {
        metadata.issuingBody = issuingBody.trim();
        metadata.certificateNumber = certNumber.trim();
        metadata.issuedDate = certIssuedDate.trim();
        metadata.expiryDate = certExpiryDate.trim();
      }

      // Ingest document into KYC
      await fetch("/api/v1/kyc/documents", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          documentType: activeItem.docType,
          documentUrl: uploadedMedia?.url || `kyc/${activeItem.id}/completed.pdf`,
          s3ObjectKey: uploadedMedia?.objectKey,
          metadata,
        }),
      });

      showToast(`${activeItem.title} submitted successfully!`);
      setActiveItem(null);
      await syncLiveKycStatus();
    } catch (err: any) {
      setFormError(err?.message || "Failed to submit verification. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // SUB-SCREENS RENDERER
  // ─────────────────────────────────────────────────────────────
  const renderSubScreen = () => {
    if (!activeItem) return null;

    // 1. Proof of Address
    if (activeItem.id === "proof-of-address") {
      return (
        <div className="space-y-6 max-w-md mx-auto pb-12 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="p-1 text-[var(--text-heading)] hover:text-[var(--primary)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold text-[var(--text-heading)]">Proof of address</h1>
          </div>

          <form onSubmit={handleSubmitFlow} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-heading)] block">
                Residential address
              </label>
              <input
                type="text"
                value={residentialAddress}
                onChange={(e) => setResidentialAddress(e.target.value)}
                placeholder="Enter your residential address"
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-full px-5 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs"
                required
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold text-[var(--text-heading)]">We accept any of these document</h3>
              <div className="space-y-2 text-xs text-[var(--text-heading)]">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Electricity bill</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Bank statement showing your name and address</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Water or waste bill</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Tenancy agreement signed with your name on it</span>
                </div>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] pt-1">
                Note: Document must be dated within the last 3 months.
              </p>
            </div>

            {/* Upload Document Box */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-3xl py-7 px-4 flex items-center justify-center gap-2.5 shadow-2xs hover:border-[var(--primary)] cursor-pointer transition-all"
            >
              <span className="text-xs font-semibold text-[var(--text-heading)]">
                {selectedFileName ? selectedFileName : "Upload document"}
              </span>
              <Upload className="w-4 h-4 text-[var(--text-heading)]" />
            </button>

            {selectedPreviewUrl && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <img src={selectedPreviewUrl} alt="Document preview" className="w-12 h-12 object-cover rounded-xl" />
                <div className="text-xs truncate flex-1 font-medium">{selectedFileName}</div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setSelectedFileName(null);
                    setSelectedPreviewUrl(null);
                  }}
                  className="p-1 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <div className="flex items-center gap-3 pt-6">
              <button
                type="button"
                onClick={() => startLiveCamera("doc-modal", "environment")}
                className="px-6 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] flex items-center gap-2 hover:bg-[var(--bg-secondary)] cursor-pointer shadow-2xs"
              >
                <Camera className="w-4 h-4 text-[var(--text-heading)]" />
                <span>Camera</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-full bg-[#48bb78] hover:bg-[#38a169] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
              </button>
            </div>
          </form>
        </div>
      );
    }

    // 2. Background Check
    if (activeItem.id === "background-check") {
      return (
        <div className="space-y-6 max-w-md mx-auto pb-12 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="p-1 text-[var(--text-heading)] hover:text-[var(--primary)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold text-[var(--text-heading)]">Background check</h1>
          </div>

          <form onSubmit={handleSubmitFlow} className="space-y-6">
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold text-[var(--text-heading)]">What we check</h3>
              <div className="space-y-2 text-xs text-[var(--text-heading)]">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Criminal record with the Nigeria Police Force</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>That your NIN and address is genuine</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Socials</span>
                </div>
              </div>
            </div>

            <div
              onClick={() => setBackgroundConsent(!backgroundConsent)}
              className="p-4 rounded-2xl border-2 border-[#48bb78] bg-[var(--bg-card)] flex items-start gap-3 cursor-pointer shadow-2xs"
            >
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                  backgroundConsent ? "bg-[#48bb78] text-white" : "border border-[var(--border-color)] bg-transparent"
                }`}
              >
                {backgroundConsent && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
              <p className="text-xs font-semibold text-[var(--text-heading)] leading-relaxed">
                I permit OverSite to run the checks described above, and confirm the information I&apos;ve given is true.
              </p>
            </div>

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <div className="pt-8">
              <button
                type="submit"
                disabled={isSubmitting || !backgroundConsent}
                className="w-full py-3.5 rounded-full bg-[#48bb78] hover:bg-[#38a169] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
              </button>
            </div>
          </form>
        </div>
      );
    }

    // 3. NIN Verification
    if (activeItem.id === "nin-slip") {
      return (
        <div className="space-y-6 max-w-md mx-auto pb-12 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="p-1 text-[var(--text-heading)] hover:text-[var(--primary)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold text-[var(--text-heading)]">NIN Verification</h1>
          </div>

          <form onSubmit={handleSubmitFlow} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-heading)] block">Your 11-digit NIN</label>
              <input
                type="text"
                maxLength={11}
                value={ninInput}
                onChange={(e) => setNinInput(e.target.value.replace(/\D/g, ""))}
                placeholder="01234567890"
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-full px-5 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs font-mono"
                required
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold text-[var(--text-heading)]">Upload slip</h3>
              <div className="space-y-2 text-xs text-[var(--text-heading)]">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>The printed or digital NIN slip</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Photo, name and NIN all readable</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>No fingers covering any part of it</span>
                </div>
              </div>
            </div>

            {/* Upload Document Box */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-3xl py-7 px-4 flex items-center justify-center gap-2.5 shadow-2xs hover:border-[var(--primary)] cursor-pointer transition-all"
            >
              <span className="text-xs font-semibold text-[var(--text-heading)]">
                {selectedFileName ? selectedFileName : "Upload document"}
              </span>
              <Upload className="w-4 h-4 text-[var(--text-heading)]" />
            </button>

            {selectedPreviewUrl && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <img src={selectedPreviewUrl} alt="NIN Preview" className="w-12 h-12 object-cover rounded-xl" />
                <div className="text-xs truncate flex-1 font-medium">{selectedFileName}</div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setSelectedFileName(null);
                    setSelectedPreviewUrl(null);
                  }}
                  className="p-1 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <div className="flex items-center gap-3 pt-6">
              <button
                type="button"
                onClick={() => startLiveCamera("doc-modal", "environment")}
                className="px-6 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] flex items-center gap-2 hover:bg-[var(--bg-secondary)] cursor-pointer shadow-2xs"
              >
                <Camera className="w-4 h-4 text-[var(--text-heading)]" />
                <span>Camera</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-full bg-[#48bb78] hover:bg-[#38a169] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
              </button>
            </div>
          </form>
        </div>
      );
    }

    // 4. Passport Photograph (Camera Only, No Uploading)
    if (activeItem.id === "passport-photo") {
      return (
        <div className="space-y-6 max-w-md mx-auto pb-12 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveItem(null);
              }}
              className="p-1 text-[var(--text-heading)] hover:text-[var(--primary)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold text-[var(--text-heading)]">Passport photograph</h1>
          </div>

          <form onSubmit={handleSubmitFlow} className="space-y-6">
            {/* Dashed Oval Silhouette Guide (Live Camera Viewfinder or Captured Photo) */}
            <div className="w-[190px] h-[260px] sm:w-[220px] sm:h-[300px] border-2 border-dashed border-gray-400 rounded-[50%] mx-auto my-4 flex items-center justify-center relative overflow-hidden bg-[var(--bg-card)]/50 shadow-inner">
              {cameraMode === "selfie-inline" ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  {isStartingCamera && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white gap-2">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-[11px] font-medium">Starting camera...</span>
                    </div>
                  )}
                </>
              ) : selectedPreviewUrl ? (
                <img
                  src={selectedPreviewUrl}
                  alt="Captured Passport"
                  className="w-full h-full object-cover rounded-[50%]"
                />
              ) : (
                <div className="text-center p-4">
                  <Camera className="w-8 h-8 text-[var(--text-muted)]/50 mx-auto mb-2" />
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">
                    Face outline guide
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              <h3 className="text-xs font-bold text-[var(--text-heading)]">For the passport to be accepted</h3>
              <div className="space-y-2 text-xs text-[var(--text-heading)]">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Line your face up inside the outline</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Face the camera straight on, eyes open</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Plain wall behind you, good daylight</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>No cap, sunglasses or face covering</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Just you in frame, no one else</span>
                </div>
              </div>
            </div>

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            {/* Bottom Action: Live Camera Only (No File Upload / Explorer) */}
            <div className="pt-4">
              {cameraMode === "selfie-inline" ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-5 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] flex items-center gap-1.5 hover:bg-[var(--bg-secondary)] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    disabled={isStartingCamera}
                    onClick={captureFromCamera}
                    className="flex-1 py-3.5 rounded-full bg-[#48bb78] hover:bg-[#38a169] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture photo</span>
                  </button>
                </div>
              ) : selectedPreviewUrl ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startLiveCamera("selfie-inline", "user")}
                    className="px-5 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] flex items-center gap-1.5 hover:bg-[var(--bg-secondary)] cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retake</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 rounded-full bg-[#48bb78] hover:bg-[#38a169] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Photograph"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startLiveCamera("selfie-inline", "user")}
                  className="w-full py-3.5 rounded-full bg-[#48bb78] hover:bg-[#38a169] text-white text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take photo</span>
                </button>
              )}
            </div>
          </form>
        </div>
      );
    }

    // 5. Investigation Certificate
    if (activeItem.id === "investigation-cert") {
      return (
        <div className="space-y-6 max-w-md mx-auto pb-12 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="p-1 text-[var(--text-heading)] hover:text-[var(--primary)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold text-[var(--text-heading)]">Investigation certificate</h1>
          </div>

          <form onSubmit={handleSubmitFlow} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-heading)] block">Issuing body</label>
              <input
                type="text"
                value={issuingBody}
                onChange={(e) => setIssuingBody(e.target.value)}
                placeholder="Nigeria Institute of private investigators"
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-full px-5 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-heading)] block">Certificate number</label>
              <input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder="NIPI/2024/08812"
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-full px-5 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-heading)] block">Issued</label>
                <input
                  type="text"
                  value={certIssuedDate}
                  onChange={(e) => setCertIssuedDate(e.target.value)}
                  placeholder="05/2025"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-full px-5 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs text-center"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-heading)] block">Expires</label>
                <input
                  type="text"
                  value={certExpiryDate}
                  onChange={(e) => setCertExpiryDate(e.target.value)}
                  placeholder="05/2028"
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-full px-5 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs text-center"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold text-[var(--text-heading)]">Upload Certificate</h3>
              <div className="space-y-2 text-xs text-[var(--text-heading)]">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Lay it flat, all four corners in frame</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Daylight rather than flash, to avoid glare</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Certificate number and dates clearly readable</span>
                </div>
              </div>
            </div>

            {/* Upload Document Box */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-3xl py-7 px-4 flex items-center justify-center gap-2.5 shadow-2xs hover:border-[var(--primary)] cursor-pointer transition-all"
            >
              <span className="text-xs font-semibold text-[var(--text-heading)]">
                {selectedFileName ? selectedFileName : "Upload document"}
              </span>
              <Upload className="w-4 h-4 text-[var(--text-heading)]" />
            </button>

            {selectedPreviewUrl && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <img src={selectedPreviewUrl} alt="Certificate preview" className="w-12 h-12 object-cover rounded-xl" />
                <div className="text-xs truncate flex-1 font-medium">{selectedFileName}</div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setSelectedFileName(null);
                    setSelectedPreviewUrl(null);
                  }}
                  className="p-1 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => startLiveCamera("doc-modal", "environment")}
                className="px-6 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] flex items-center gap-2 hover:bg-[var(--bg-secondary)] cursor-pointer shadow-2xs"
              >
                <Camera className="w-4 h-4 text-[var(--text-heading)]" />
                <span>Camera</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-full bg-[#48bb78] hover:bg-[#38a169] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
              </button>
            </div>
          </form>
        </div>
      );
    }

    // 6. Guarantor Form
    if (activeItem.id === "guarantor-form") {
      return (
        <div className="space-y-6 max-w-md mx-auto pb-12 animate-in fade-in duration-200">
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="p-1 text-[var(--text-heading)] hover:text-[var(--primary)] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="text-base font-bold text-[var(--text-heading)]">Guarantor form</h1>
          </div>

          <form onSubmit={handleSubmitFlow} className="space-y-4">
            {/* Download Blank Form Action Card */}
            <div
              onClick={handleDownloadBlankForm}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:border-[var(--primary)] cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--text-heading)]" />
                <span className="text-xs font-bold text-[var(--text-heading)]">Download the blank form</span>
              </div>
              <Download className="w-5 h-5 text-[var(--text-heading)]" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-heading)] block">Guarantor&apos;s full name</label>
              <input
                type="text"
                value={guarantorName}
                onChange={(e) => setGuarantorName(e.target.value)}
                placeholder="Enter guarantor's full name"
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-full px-5 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-heading)] block">Guarantor&apos;s phone</label>
              <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-full overflow-hidden shadow-2xs focus-within:border-[var(--primary)] transition-all">
                <span className="px-4 py-3 text-xs font-bold text-[var(--text-heading)] border-r border-[var(--border-color)]/70 bg-[var(--bg-secondary)]/30">
                  +234
                </span>
                <input
                  type="tel"
                  value={guarantorPhone}
                  onChange={(e) => setGuarantorPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="801 234 5678"
                  className="w-full px-4 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] bg-transparent focus:outline-none font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold text-[var(--text-heading)]">Upload Certificate</h3>
              <div className="space-y-2 text-xs text-[var(--text-heading)]">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Employed, aged 25 or over</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Not a relative living at your address</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--text-heading)] shrink-0 stroke-[2.5]" />
                  <span>Reachable on the phone number they give</span>
                </div>
              </div>
            </div>

            {/* Upload Document Box */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-3xl py-7 px-4 flex items-center justify-center gap-2.5 shadow-2xs hover:border-[var(--primary)] cursor-pointer transition-all"
            >
              <span className="text-xs font-semibold text-[var(--text-heading)]">
                {selectedFileName ? selectedFileName : "Upload document"}
              </span>
              <Upload className="w-4 h-4 text-[var(--text-heading)]" />
            </button>

            {selectedPreviewUrl && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
                <img src={selectedPreviewUrl} alt="Guarantor form preview" className="w-12 h-12 object-cover rounded-xl" />
                <div className="text-xs truncate flex-1 font-medium">{selectedFileName}</div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setSelectedFileName(null);
                    setSelectedPreviewUrl(null);
                  }}
                  className="p-1 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-red-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => startLiveCamera("doc-modal", "environment")}
                className="px-6 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] flex items-center gap-2 hover:bg-[var(--bg-secondary)] cursor-pointer shadow-2xs"
              >
                <Camera className="w-4 h-4 text-[var(--text-heading)]" />
                <span>Camera</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-full bg-[#48bb78] hover:bg-[#38a169] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit"}
              </button>
            </div>
          </form>
        </div>
      );
    }

    return null;
  };

  // ─────────────────────────────────────────────────────────────
  // MAIN OVERVIEW (CHECKLIST OF 6 ITEMS)
  // ─────────────────────────────────────────────────────────────
  const renderOverview = () => {
    return (
      <>
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
                onClick={() => openFlowScreen(item)}
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
      </>
    );
  };

  return (
    <div className="space-y-6 max-w-full pb-12">
      {/* Hidden Document File Picker — ONLY for "Upload document" buttons (never used for Camera / Take photo) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Live Document Camera Viewfinder Modal (WebRTC getUserMedia — never opens File Explorer) */}
      {cameraMode === "doc-modal" && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[28px] overflow-hidden shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-sm font-bold text-[var(--text-heading)]">
                  Capture {activeItem?.title || "Document"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    startLiveCamera(
                      "doc-modal",
                      cameraFacingMode === "environment" ? "user" : "environment"
                    )
                  }
                  className="px-2.5 py-1.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-heading)] text-[11px] font-semibold flex items-center gap-1 hover:bg-[var(--border-color)] cursor-pointer"
                  title="Switch camera"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Flip</span>
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="p-1.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                  aria-label="Close camera"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="relative bg-black aspect-[4/3] w-full overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  cameraFacingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />
              {/* Document corner guide overlay */}
              <div className="pointer-events-none absolute inset-5 border-2 border-dashed border-white/60 rounded-2xl" />
              {isStartingCamera && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-[var(--primary)]" />
                  <span className="text-xs font-medium">Starting camera...</span>
                </div>
              )}
            </div>

            <div className="p-4 flex items-center justify-between gap-3 bg-[var(--bg-card)]">
              <button
                type="button"
                onClick={stopCamera}
                className="px-5 py-3 rounded-full bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-heading)] hover:bg-[var(--border-color)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isStartingCamera}
                onClick={captureFromCamera}
                className="flex-1 py-3 rounded-full bg-[#48bb78] hover:bg-[#38a169] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>Capture Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[100] flex justify-center pointer-events-none">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
            </div>
            <span className="text-[13px] font-medium truncate">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Render active subscreen or overview */}
      {activeItem ? renderSubScreen() : renderOverview()}
    </div>
  );
}
