"use client";

import React, { useState, useEffect, useRef } from "react";
import { getStoredToken } from "@/lib/storage/clientStorage";
import { AgentTopNav } from "@/components/agent/AgentTopNav";
import { ResponsiveSelect } from "@/components/ui/ResponsiveSelect";
import { getAgentTypeOption, AgentTypeOption } from "@/lib/constants/agentTypes";
import {
  compressClientImageFile,
  formatFileSize,
  MAX_DOCUMENT_MB,
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
  Eye,
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
    | "BAR_PRACTICING_LICENSE"
    | "BACKGROUND_CHECK";
  title: string;
  subtitle: string;
  status: VerificationStatus;
  rejectionReason?: string | null;
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
  const [savedDocsMap, setSavedDocsMap] = useState<Record<string, any>>({});
  const [agentTypeOpt, setAgentTypeOpt] = useState<AgentTypeOption>(() =>
    getAgentTypeOption("INVESTIGATOR")
  );
  const [kycReviewNote, setKycReviewNote] = useState<string | null>(null);
  const [overallKycStatus, setOverallKycStatus] = useState<string>("PENDING");

  // Live WebRTC Camera states (never opens file explorer)
  const [cameraMode, setCameraMode] = useState<"closed" | "selfie-inline" | "doc-modal">("closed");
  const [cameraFacingMode, setCameraFacingMode] = useState<"user" | "environment">("user");
  const [isStartingCamera, setIsStartingCamera] = useState(false);

  // Form field states for the 6 specific screens
  const [ninInput, setNinInput] = useState("");
  const [residentialAddress, setResidentialAddress] = useState("");
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [qualificationType, setQualificationType] = useState("PROFESSIONAL_LICENSE");
  const [issuingBody, setIssuingBody] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [certIssuedDate, setCertIssuedDate] = useState("");
  const [certExpiryDate, setCertExpiryDate] = useState("");
  const [backgroundConsent, setBackgroundConsent] = useState(true);

  // Upload & capture states (Front / Primary)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState<string | null>(null);

  // Upload & capture states (Back / Page 2 — Optional)
  const [selectedBackFile, setSelectedBackFile] = useState<File | null>(null);
  const [selectedBackFileName, setSelectedBackFileName] = useState<string | null>(null);
  const [selectedBackPreviewUrl, setSelectedBackPreviewUrl] = useState<string | null>(null);
  const [showBackSlot, setShowBackSlot] = useState(false);
  const [activeCaptureSlot, setActiveCaptureSlot] = useState<"front" | "back">("front");
  const [lightboxPreview, setLightboxPreview] = useState<{ title: string; url: string; isPdf?: boolean } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const resolveStoredMediaUrl = (raw?: string | null): string | null => {
    if (!raw) return null;
    const s = raw.trim();
    if (!s || /^kyc\/[^/]+\/completed\.pdf$/i.test(s)) return null;
    if (s.startsWith("data:") || s.startsWith("/api/v1/media")) return s;
    if (s.startsWith("http://") || s.startsWith("https://")) {
      if (s.includes(".amazonaws.com/")) {
        return `/api/v1/media?url=${encodeURIComponent(s)}`;
      }
      return s;
    }
    return `/api/v1/media?key=${encodeURIComponent(s)}`;
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
      const data = json?.data || {};
      const steps = data.steps || {};
      const docs: Record<string, any> = data.documents || {};
      const resolvedOpt = getAgentTypeOption(data.agentTier);

      setAgentTypeOpt(resolvedOpt);
      setSavedDocsMap(docs);
      if (data.kycStatus) setOverallKycStatus(data.kycStatus);
      setKycReviewNote(data.kycReviewNote || null);

      // Hydrate form fields from signup / saved KYC records so NIN, NBA, address, etc. are never empty
      const existingNin =
        data.ninId ||
        docs.ninNumber ||
        docs.government_id?.metadata?.ninNumber ||
        "";
      if (existingNin) {
        setNinInput((prev) => prev || String(existingNin));
      }

      const existingAddress =
        data.residentialAddress ||
        docs.proof_of_address?.metadata?.residentialAddress ||
        docs.utility_bill?.metadata?.residentialAddress ||
        "";
      if (existingAddress) {
        setResidentialAddress((prev) => prev || String(existingAddress));
      }

      const guarMeta = docs.guarantor_form?.metadata;
      if (guarMeta?.guarantorName) {
        setGuarantorName((prev) => prev || String(guarMeta.guarantorName));
      }
      if (guarMeta?.guarantorPhone) {
        setGuarantorPhone(
          (prev) => prev || String(guarMeta.guarantorPhone).replace(/^\+234/, "")
        );
      }

      const profDoc =
        docs[resolvedOpt.credential.docKey] ||
        docs.bar_practicing_license ||
        docs.investigation_certificate ||
        docs.cac_certificate;
      const profMeta = profDoc?.metadata;
      const defaultQualVal =
        resolvedOpt.credential.qualificationOptions[0]?.value || "PROFESSIONAL_LICENSE";
      if (profMeta?.qualificationType) {
        setQualificationType(String(profMeta.qualificationType));
      } else {
        setQualificationType(defaultQualVal);
      }

      const existingNbaOrCert =
        data.nbaNumber ||
        docs.nbaNumber ||
        profMeta?.certificateNumber ||
        "";
      if (existingNbaOrCert) {
        setCertNumber((prev) => prev || String(existingNbaOrCert));
      }
      if (profMeta?.issuingBody) {
        setIssuingBody((prev) => prev || String(profMeta.issuingBody));
      } else if (resolvedOpt.credential.isNba) {
        setIssuingBody((prev) => prev || "Nigerian Bar Association (NBA)");
      }
      if (profMeta?.issuedDate) {
        setCertIssuedDate((prev) => prev || String(profMeta.issuedDate));
      }
      if (profMeta?.expiryDate) {
        setCertExpiryDate((prev) => prev || String(profMeta.expiryDate));
      }

      setItems((prev) =>
        prev.map((rawItem) => {
          const item: VerificationItem =
            rawItem.id === "investigation-cert"
              ? {
                  ...rawItem,
                  title: resolvedOpt.credential.title,
                  docType: resolvedOpt.credential.docType,
                }
              : rawItem;

          let docEntry: any = null;
          if (item.id === "nin-slip") {
            docEntry = docs.government_id;
            if (steps.step2IdentityNIN?.completed) {
              return { ...item, status: "verified", subtitle: "Verified via NIMC" };
            }
            if (!docEntry && existingNin) {
              return {
                ...item,
                status: "awaiting",
                subtitle: `NIN ${existingNin} saved · Upload slip to complete`,
              };
            }
          } else if (item.id === "passport-photo") {
            docEntry = docs.passport_photo;
          } else if (item.id === "proof-of-address") {
            docEntry = docs.proof_of_address || docs.utility_bill;
            if (steps.step4ProofOfAddress?.completed && data.addressVerificationStatus === "verified") {
              return { ...item, status: "verified", subtitle: "Verified" };
            }
          } else if (item.id === "guarantor-form") {
            docEntry = docs.guarantor_form;
          } else if (item.id === "investigation-cert") {
            docEntry = profDoc;
            if (resolvedOpt.credential.isNba && data.nbaVerificationStatus === "verified") {
              return { ...item, status: "verified", subtitle: "NBA Enrollment Verified" };
            }
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
              return {
                ...item,
                status: "verified",
                subtitle: `Verified ${dateLabel}`,
                rejectionReason: null,
              };
            }
            if (rawStatus === "REJECTED") {
              return {
                ...item,
                status: "rejected",
                rejectionReason: docEntry.rejectionReason || data.kycReviewNote || null,
                subtitle: docEntry.rejectionReason
                  ? `Rejected: ${docEntry.rejectionReason}`
                  : "Rejected — please re-submit a clearer copy",
              };
            }
            return {
              ...item,
              status: "reviewing",
              subtitle: `Submitted ${dateLabel} · Pending Admin review`,
              rejectionReason: null,
            };
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

  const verifiedCount = items.filter((item) => item.status === "verified").length;
  const submittedOrVerifiedCount = items.filter(
    (item) => item.status === "verified" || item.status === "reviewing"
  ).length;
  const totalCount = items.length;
  const progressPct = Math.round((verifiedCount / totalCount) * 100);
  const progressColor =
    progressPct >= 100
      ? {
          bar: "bg-emerald-500",
          track: "bg-emerald-500/15",
          badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
          label: "Fully verified",
        }
      : progressPct >= 50
      ? {
          bar: "bg-amber-500",
          track: "bg-amber-500/15",
          badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          label: "Verification in progress",
        }
      : {
          bar: "bg-red-500",
          track: "bg-red-500/15",
          badge: "bg-red-500/15 text-red-600 dark:text-red-400",
          label: "Verification incomplete",
        };

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

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const slotSuffix = activeCaptureSlot === "back" ? "back" : "front";
    const fileLabel =
      activeItem?.id === "passport-photo"
        ? `passport-photo-${Date.now()}.jpg`
        : `${activeItem?.id || "document"}-${slotSuffix}-${Date.now()}.jpg`;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setFormError("Failed to capture photo. Please try again.");
          return;
        }
        const capturedFile = new File([blob], fileLabel, { type: "image/jpeg" });
        if (activeCaptureSlot === "back" && activeItem?.id !== "passport-photo") {
          setSelectedBackFile(capturedFile);
          setSelectedBackFileName(fileLabel);
          setSelectedBackPreviewUrl(dataUrl);
          setShowBackSlot(true);
        } else {
          setSelectedFile(capturedFile);
          setSelectedFileName(fileLabel);
          setSelectedPreviewUrl(dataUrl);
        }
        setFormError(null);
        stopCamera();
      },
      "image/jpeg",
      0.85
    );
  };

  const getSavedDocForItem = (item: VerificationItem): any => {
    if (item.id === "nin-slip") return savedDocsMap.government_id;
    if (item.id === "passport-photo") return savedDocsMap.passport_photo;
    if (item.id === "proof-of-address")
      return savedDocsMap.proof_of_address || savedDocsMap.utility_bill;
    if (item.id === "guarantor-form") return savedDocsMap.guarantor_form;
    if (item.id === "investigation-cert") {
      return (
        savedDocsMap[agentTypeOpt.credential.docKey] ||
        savedDocsMap.bar_practicing_license ||
        savedDocsMap.investigation_certificate ||
        savedDocsMap.cac_certificate
      );
    }
    if (item.id === "background-check") return savedDocsMap.background_check;
    return null;
  };

  const openFlowScreen = (item: VerificationItem) => {
    stopCamera();
    setActiveItem(item);
    setSelectedFile(null);
    setSelectedBackFile(null);

    const existingDoc = getSavedDocForItem(item);
    const frontUrl = resolveStoredMediaUrl(
      existingDoc?.documentUrl || existingDoc?.fileRef || existingDoc?.s3ObjectKey
    );
    const backUrl = resolveStoredMediaUrl(
      existingDoc?.backDocumentUrl ||
        existingDoc?.backS3ObjectKey ||
        existingDoc?.metadata?.backDocumentUrl ||
        existingDoc?.metadata?.backObjectKey
    );

    setSelectedPreviewUrl(frontUrl);
    setSelectedFileName(
      frontUrl ? existingDoc?.metadata?.fileName || `${item.title} (Submitted)` : null
    );
    setSelectedBackPreviewUrl(backUrl);
    setSelectedBackFileName(
      backUrl ? existingDoc?.metadata?.backFileName || `${item.title} — Back (Submitted)` : null
    );
    setShowBackSlot(item.id === "nin-slip" || Boolean(backUrl));
    setActiveCaptureSlot("front");
    setFormError(null);
  };

  const triggerFilePicker = (slot: "front" | "back") => {
    setActiveCaptureSlot(slot);
    fileInputRef.current?.click();
  };

  const triggerCameraForSlot = (slot: "front" | "back") => {
    setActiveCaptureSlot(slot);
    startLiveCamera("doc-modal", "environment");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    e.target.value = "";
    if (!rawFile) return;

    const validationError = validateAgentUploadFile(rawFile, { allowPdf: true });
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);

    const isImage =
      rawFile.type.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|heic|heif)$/i.test(rawFile.name);

    // Run client-side image compression before preview & state assignment
    const processedFile = isImage
      ? await compressClientImageFile(rawFile, { maxDimension: 1920, quality: 0.82 })
      : rawFile;

    let preview: string | null = null;
    if (isImage) {
      try {
        preview = await readFileAsDataUrl(processedFile);
      } catch {
        preview = null;
      }
    } else if (processedFile.type === "application/pdf") {
      try {
        preview = await readFileAsDataUrl(processedFile);
      } catch {
        preview = null;
      }
    }

    if (activeCaptureSlot === "back") {
      setSelectedBackFile(processedFile);
      setSelectedBackFileName(processedFile.name);
      setSelectedBackPreviewUrl(preview);
      setShowBackSlot(true);
    } else {
      setSelectedFile(processedFile);
      setSelectedFileName(processedFile.name);
      setSelectedPreviewUrl(preview);
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
      if (!selectedFile && !selectedPreviewUrl) {
        setFormError("Please upload or snap your NIN slip.");
        return;
      }
    } else if (activeItem.id === "passport-photo") {
      if (!selectedFile && !selectedPreviewUrl) {
        setFormError("Please take your passport photograph using the camera.");
        return;
      }
    } else if (activeItem.id === "proof-of-address") {
      if (!residentialAddress.trim()) {
        setFormError("Please enter your residential address.");
        return;
      }
      if (!selectedFile && !selectedPreviewUrl) {
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
      if (!selectedFile && !selectedPreviewUrl) {
        setFormError("Please upload or snap the completed guarantor form.");
        return;
      }
    } else if (activeItem.id === "investigation-cert") {
      const activeQual =
        agentTypeOpt.credential.qualificationOptions.find(
          (q) => q.value === qualificationType
        ) || agentTypeOpt.credential.qualificationOptions[0];
      if (!issuingBody.trim()) {
        setFormError(`Please enter the ${activeQual.issuingBodyLabel.toLowerCase()}.`);
        return;
      }
      if (!certNumber.trim()) {
        setFormError(`Please enter your ${activeQual.numberLabel.toLowerCase()}.`);
        return;
      }
      if (!selectedFile && !selectedPreviewUrl) {
        setFormError(activeQual.uploadPrompt);
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
      const existingDoc = getSavedDocForItem(activeItem);

      let uploadedMedia = null;
      if (selectedFile) {
        uploadedMedia = await uploadAgentMedia(selectedFile, "kyc");
      }

      let uploadedBackMedia = null;
      if (selectedBackFile) {
        uploadedBackMedia = await uploadAgentMedia(selectedBackFile, "kyc");
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

      if (
        activeItem.id === "investigation-cert" &&
        agentTypeOpt.credential.isNba &&
        qualificationType !== "BSC_HND_EQUIVALENT" &&
        certNumber.trim()
      ) {
        await fetch("/api/v1/kyc/verify/nba", {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({ nbaNumber: certNumber.trim().toUpperCase() }),
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
        });
        showToast("Background check consent submitted!");
        setActiveItem(null);
        await syncLiveKycStatus();
        return;
      }

      // Metadata compilation
      const metadata: Record<string, any> = {
        ...(existingDoc?.metadata || {}),
        submittedAt: new Date().toISOString(),
        fileName:
          uploadedMedia?.fileName ||
          selectedFileName ||
          existingDoc?.metadata?.fileName ||
          `${activeItem.id}-submitted`,
        objectKey: uploadedMedia?.objectKey || existingDoc?.s3ObjectKey || existingDoc?.metadata?.objectKey,
        contentType: uploadedMedia?.contentType || existingDoc?.metadata?.contentType,
        fileSize: uploadedMedia?.compressedSize || selectedFile?.size || existingDoc?.metadata?.fileSize,
      };

      if (uploadedBackMedia) {
        metadata.backDocumentUrl = uploadedBackMedia.url;
        metadata.backFileName = uploadedBackMedia.fileName || selectedBackFileName;
        metadata.backObjectKey = uploadedBackMedia.objectKey;
        metadata.backContentType = uploadedBackMedia.contentType;
      }

      if (activeItem.id === "nin-slip") {
        metadata.ninNumber = ninInput.trim();
      } else if (activeItem.id === "proof-of-address") {
        metadata.residentialAddress = residentialAddress.trim();
      } else if (activeItem.id === "guarantor-form") {
        metadata.guarantorName = guarantorName.trim();
        metadata.guarantorPhone = `+234${guarantorPhone.trim().replace(/^\+?234/, "")}`;
      } else if (activeItem.id === "investigation-cert") {
        const activeQual =
          agentTypeOpt.credential.qualificationOptions.find(
            (q) => q.value === qualificationType
          ) || agentTypeOpt.credential.qualificationOptions[0];
        metadata.qualificationType = activeQual.value;
        metadata.qualificationLabel = activeQual.label;
        metadata.issuingBody = issuingBody.trim();
        metadata.certificateNumber = certNumber.trim();
        metadata.issuedDate = certIssuedDate.trim();
        metadata.expiryDate = certExpiryDate.trim();
        metadata.agentType = agentTypeOpt.label;
      }

      // Ingest document into KYC
      await fetch("/api/v1/kyc/documents", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          documentType:
            activeItem.id === "investigation-cert"
              ? agentTypeOpt.credential.docType
              : activeItem.docType,
          documentUrl:
            uploadedMedia?.url ||
            existingDoc?.documentUrl ||
            existingDoc?.fileRef,
          s3ObjectKey:
            uploadedMedia?.objectKey ||
            existingDoc?.s3ObjectKey ||
            undefined,
          backDocumentUrl:
            uploadedBackMedia?.url ||
            existingDoc?.backDocumentUrl ||
            undefined,
          backS3ObjectKey:
            uploadedBackMedia?.objectKey ||
            existingDoc?.backS3ObjectKey ||
            undefined,
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
  // REUSABLE DOCUMENT UPLOAD & HIGH-CLARITY PREVIEW SLOTS (FRONT + OPTIONAL BACK)
  // ─────────────────────────────────────────────────────────────
  const renderSingleSlotCard = (
    slot: "front" | "back",
    label: string,
    isOptional: boolean
  ) => {
    const file = slot === "front" ? selectedFile : selectedBackFile;
    const fileName = slot === "front" ? selectedFileName : selectedBackFileName;
    const previewUrl = slot === "front" ? selectedPreviewUrl : selectedBackPreviewUrl;
    const hasSlotMedia = Boolean(file || previewUrl);
    const isPdf =
      file?.type === "application/pdf" ||
      (fileName ? /\.pdf$/i.test(fileName) : false) ||
      (previewUrl ? /\.pdf(\?|$)/i.test(previewUrl) || previewUrl.startsWith("data:application/pdf") : false);

    const clearSlot = () => {
      if (slot === "front") {
        setSelectedFile(null);
        setSelectedFileName(null);
        setSelectedPreviewUrl(null);
      } else {
        setSelectedBackFile(null);
        setSelectedBackFileName(null);
        setSelectedBackPreviewUrl(null);
      }
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-heading)]">
            {label}{" "}
            {isOptional ? (
              <span className="text-[11px] font-normal text-[var(--text-muted)]">
                (Optional)
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-[var(--primary)]">
                *
              </span>
            )}
          </span>
          <span className="text-[10.5px] text-[var(--text-muted)]">
            Max {MAX_DOCUMENT_MB}MB · Auto-compressed
          </span>
        </div>

        {!hasSlotMedia ? (
          <div className="flex items-stretch gap-2.5">
            <button
              type="button"
              onClick={() => triggerFilePicker(slot)}
              className="flex-1 bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-3xl py-6 px-4 flex items-center justify-center gap-2.5 shadow-2xs hover:border-[var(--primary)] cursor-pointer transition-all"
            >
              <span className="text-xs font-semibold text-[var(--text-heading)]">
                {slot === "front" ? "Upload document" : "Upload back side"}
              </span>
              <Upload className="w-4 h-4 text-[var(--text-heading)]" />
            </button>
            <button
              type="button"
              onClick={() => triggerCameraForSlot(slot)}
              className="px-5 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)]/70 hover:border-[var(--primary)] text-xs font-semibold text-[var(--text-heading)] flex flex-col items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
              title={`Capture ${label} with camera`}
            >
              <Camera className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-[11px]">Camera</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--primary)]/50 overflow-hidden shadow-xs animate-in fade-in duration-150">
            {/* Full-Visibility Document Media Preview Viewport */}
            <div className="relative h-48 sm:h-52 w-full bg-zinc-950/5 dark:bg-black/40 flex items-center justify-center p-2.5">
              {isPdf ? (
                <div className="flex flex-col items-center justify-center text-center p-4 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-[var(--text-heading)] max-w-[220px] truncate">
                    {fileName}
                  </p>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    PDF Document{file ? ` · ${formatFileSize(file.size)}` : " · Submitted"}
                  </span>
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt={fileName || label}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-2xs"
                />
              ) : (
                <div className="text-xs text-[var(--text-muted)]">Preview loaded</div>
              )}

              {/* Top-Right Fullscreen Inspect Button */}
              {previewUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setLightboxPreview({
                      title: `${activeItem?.title || "Document"} — ${label}`,
                      url: previewUrl,
                      isPdf,
                    })
                  }
                  className="absolute top-2.5 right-2.5 px-2.5 py-1.5 rounded-full bg-black/70 hover:bg-black/85 text-white text-[11px] font-semibold flex items-center gap-1 backdrop-blur-xs cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect</span>
                </button>
              )}
            </div>

            {/* Preview Footer Bar with Metadata & Replace / Retake / Remove Actions */}
            <div className="px-3.5 py-2.5 border-t border-[var(--border-color)]/60 flex items-center justify-between gap-2 bg-[var(--bg-card)]">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--text-heading)] truncate">
                  {fileName}
                </p>
                <p className="text-[10.5px] text-[var(--primary)] font-medium">
                  {file ? formatFileSize(file.size) : "Saved in your accreditation file"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => triggerFilePicker(slot)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[11px] font-semibold text-[var(--text-heading)] cursor-pointer transition-colors"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => triggerCameraForSlot(slot)}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[11px] font-semibold text-[var(--text-heading)] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Camera className="w-3 h-3" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={clearSlot}
                  aria-label="Remove document"
                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDocumentUploadSlots = (options: {
    frontLabel?: string;
    backLabel?: string;
    alwaysShowBack?: boolean;
  } = {}) => {
    const {
      frontLabel = "Front of document",
      backLabel = "Back of document",
      alwaysShowBack = false,
    } = options;

    const shouldShowBack = alwaysShowBack || showBackSlot || Boolean(selectedBackFile);

    return (
      <div className="space-y-4">
        {renderSingleSlotCard("front", frontLabel, false)}

        {shouldShowBack ? (
          renderSingleSlotCard("back", backLabel, true)
        ) : (
          <button
            type="button"
            onClick={() => setShowBackSlot(true)}
            className="w-full py-2.5 px-4 rounded-2xl border border-dashed border-[var(--border-color)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add back side or second page (Optional)</span>
          </button>
        )}
      </div>
    );
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

            {/* Front & Optional Back Upload + Proper Document Preview */}
            {renderDocumentUploadSlots({
              frontLabel: "Proof of address document (Front / Page 1)",
              backLabel: "Back side / Page 2",
              alwaysShowBack: false,
            })}

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() =>
                  triggerCameraForSlot(selectedFile && showBackSlot && !selectedBackFile ? "back" : "front")
                }
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

            {/* Front (Required) & Back (Optional) NIN Slip Upload + High-Clarity Media Previews */}
            {renderDocumentUploadSlots({
              frontLabel: "Front of NIN slip / ID",
              backLabel: "Back of NIN slip / ID",
              alwaysShowBack: true,
            })}

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() =>
                  triggerCameraForSlot(selectedFile && !selectedBackFile ? "back" : "front")
                }
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

    // 5. Dynamic Professional Credential OR Academic Qualification (B.Sc / HND / Equivalent) for all 5 Agent Types
    if (activeItem.id === "investigation-cert") {
      const cred = agentTypeOpt.credential;
      const qualOptions = cred.qualificationOptions || [];
      const activeQual =
        qualOptions.find((q) => q.value === qualificationType) ||
        qualOptions[0] || {
          value: "PROFESSIONAL_LICENSE",
          label: cred.shortLabel,
          issuingBodyLabel: cred.issuingBodyLabel,
          issuingBodyPlaceholder: cred.issuingBodyPlaceholder,
          numberLabel: cred.numberLabel,
          numberPlaceholder: cred.numberPlaceholder,
          uploadPrompt: cred.uploadPrompt,
        };
      const isAcademicDegree = activeQual.value === "BSC_HND_EQUIVALENT";

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
            <div>
              <h1 className="text-base font-bold text-[var(--text-heading)]">{cred.title}</h1>
              <p className="text-[11px] text-[var(--text-muted)]">
                Required for {agentTypeOpt.label} — Submit professional license OR B.Sc / HND / Equivalent
              </p>
            </div>
          </div>

          {activeItem.rejectionReason && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400">
              <strong className="font-bold">Admin Review Note:</strong> {activeItem.rejectionReason}
            </div>
          )}

          <form onSubmit={handleSubmitFlow} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-heading)] block">
                Qualification / Credential Type
              </label>
              <ResponsiveSelect
                label="Select Qualification / Credential Type"
                value={activeQual.value}
                onChange={(val) => {
                  setQualificationType(val);
                  if (val === "BSC_HND_EQUIVALENT" && issuingBody === "Nigerian Bar Association (NBA)") {
                    setIssuingBody("");
                  }
                }}
                options={qualOptions.map((q) => ({
                  value: q.value,
                  label: q.label,
                  description:
                    q.value === "BSC_HND_EQUIVALENT"
                      ? "For recent graduates or operatives verifying with an academic degree (B.Sc, HND, B.Eng, LL.B, ND)"
                      : `Role-specific professional accreditation for ${agentTypeOpt.label}`,
                }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-heading)] block">
                {activeQual.issuingBodyLabel}
              </label>
              <input
                type="text"
                value={issuingBody}
                onChange={(e) => setIssuingBody(e.target.value)}
                placeholder={activeQual.issuingBodyPlaceholder}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-lg px-4 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-heading)] block">
                {activeQual.numberLabel}
              </label>
              <input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                placeholder={activeQual.numberPlaceholder}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-lg px-4 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-heading)] block">
                  {isAcademicDegree ? "Graduation Year / Date" : "Issued"}
                </label>
                <input
                  type="text"
                  value={certIssuedDate}
                  onChange={(e) => setCertIssuedDate(e.target.value)}
                  placeholder={isAcademicDegree ? "11/2023" : "05/2025"}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-lg px-4 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs text-center"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-heading)] block">
                  {isAcademicDegree ? "Expires (Optional)" : "Expires"}
                </label>
                <input
                  type="text"
                  value={certExpiryDate}
                  onChange={(e) => setCertExpiryDate(e.target.value)}
                  placeholder={isAcademicDegree ? "N/A" : "05/2028"}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-lg px-4 py-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-all shadow-2xs text-center"
                />
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold text-[var(--text-heading)]">
                {activeQual.uploadPrompt}
              </h3>
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
                  <span>
                    {isAcademicDegree
                      ? "Full name, institution, degree class, and date clearly readable"
                      : "Registration number and dates clearly readable"}
                  </span>
                </div>
              </div>
            </div>

            {/* Front & Optional Back Upload + Proper Certificate Preview */}
            {renderDocumentUploadSlots({
              frontLabel: `${
                isAcademicDegree ? "B.Sc / HND / Equivalent Certificate" : cred.title
              } (Front / Page 1)`,
              backLabel: `${
                isAcademicDegree ? "NYSC Certificate / Statement of Result" : cred.title
              } (Back / Page 2)`,
              alwaysShowBack: false,
            })}

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() =>
                  triggerCameraForSlot(selectedFile && showBackSlot && !selectedBackFile ? "back" : "front")
                }
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

            {/* Front & Optional Back Upload + Proper Guarantor Form Preview */}
            {renderDocumentUploadSlots({
              frontLabel: "Signed guarantor form (Front / Page 1)",
              backLabel: "Guarantor ID or Page 2",
              alwaysShowBack: false,
            })}

            {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() =>
                  triggerCameraForSlot(selectedFile && showBackSlot && !selectedBackFile ? "back" : "front")
                }
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
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[14px] font-bold text-[var(--text-heading)]">
              {progressColor.label}
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${progressColor.badge}`}
            >
              {verifiedCount}/{totalCount} Verified ({progressPct}%)
            </span>
          </div>

          <div className={`w-full h-2 rounded-full ${progressColor.track} overflow-hidden`}>
            <div
              className={`h-full rounded-full ${progressColor.bar} transition-all duration-500`}
              style={{ width: `${Math.max(progressPct, verifiedCount === 0 ? 4 : progressPct)}%` }}
            />
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-0.5">
            {verifiedCount === totalCount
              ? "All six verification items are approved. You are cleared for task offers."
              : `${submittedOrVerifiedCount}/${totalCount} submitted · Complete and get all six items approved to receive task offers.`}
          </p>
        </div>

        {/* Admin Review Feedback / Note Banner */}
        {kycReviewNote && (
          <div
            className={`rounded-xl p-4 border text-xs space-y-1 ${
              overallKycStatus === "REJECTED"
                ? "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                : overallKycStatus === "VERIFIED"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
            }`}
          >
            <div className="font-bold flex items-center gap-1.5">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Central Operations KYC Review Note</span>
            </div>
            <p className="leading-relaxed">{kycReviewNote}</p>
          </div>
        )}

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
                className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-xl border transition-all text-left group cursor-pointer ${
                  isVerified
                    ? "bg-[var(--bg-card)]/80 border-emerald-500/30 hover:border-emerald-500/60"
                    : isRejected
                    ? "bg-red-500/5 border-red-500/30 hover:border-red-500/60"
                    : "bg-[var(--bg-card)] border-[var(--border-color)]/70 hover:border-[var(--primary)]/50"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {isVerified ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  ) : isReviewing ? (
                    <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 stroke-[1.8]" />
                    </div>
                  ) : isRejected ? (
                    <div className="w-10 h-10 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                      <X className="w-5 h-5 stroke-[2.2]" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--border-color)]/70 dark:bg-[var(--bg-card)] text-[var(--text-muted)] flex items-center justify-center shrink-0 group-hover:bg-[var(--primary-light)] group-hover:text-[var(--primary)] transition-colors">
                      <Plus className="w-5 h-5 stroke-[2]" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3
                      className={`text-[14.5px] font-semibold text-[var(--text-heading)] truncate ${
                        !isVerified ? "group-hover:text-[var(--primary)] transition-colors" : ""
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[12px] text-[var(--text-muted)] truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                {isVerified && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Verified
                  </span>
                )}

                {isReviewing && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-semibold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Pending Review
                  </span>
                )}

                {isRejected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 text-[11px] font-semibold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Rejected
                  </span>
                )}

                {!isVerified && !isReviewing && !isRejected && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] text-[11px] font-semibold shrink-0 border border-[var(--border-color)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                    Pending
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

      {/* Full-Screen Media Lightbox Inspect Modal */}
      {lightboxPreview && (
        <div
          className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxPreview(null)}
        >
          <div
            className="w-full max-w-2xl bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
              <span className="text-xs font-bold text-[var(--text-heading)] truncate">
                {lightboxPreview.title}
              </span>
              <button
                type="button"
                onClick={() => setLightboxPreview(null)}
                className="p-1.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/40 min-h-[280px]">
              {lightboxPreview.isPdf ? (
                <iframe
                  src={lightboxPreview.url}
                  title={lightboxPreview.title}
                  className="w-full h-[65vh] rounded-lg border border-[var(--border-color)] bg-white"
                />
              ) : (
                <img
                  src={lightboxPreview.url}
                  alt={lightboxPreview.title}
                  className="max-h-[72vh] max-w-full object-contain rounded-xl"
                />
              )}
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
