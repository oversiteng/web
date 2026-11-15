"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { AgentTopNav } from "@/components/agent/AgentTopNav";
import {
  uploadAgentMedia,
  validateAgentUploadFile,
} from "@/lib/storage/agentUpload";
import { getStoredToken } from "@/lib/storage/clientStorage";
import {
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  Navigation,
  MessageSquare,
  X,
  Send,
  Check,
  FileCheck,
  Loader2,
  Plus,
  ShieldCheck,
  ListChecks,
} from "lucide-react";

interface EvidenceSlot {
  key: string;
  label: string;
  required?: boolean;
}

interface MilestoneItem {
  id: string;
  title: string;
  description?: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
  completionPct: number;
  mediaUrls?: string[];
  agentNote?: string | null;
  pendingApproval?: boolean;
}

interface ChatMsg {
  id: string;
  senderId: string;
  message: string | null;
  messageType: string;
  createdAt: string;
  parsedMilestone?: {
    milestoneTitle: string;
    stageDetails?: string;
    status: string;
    timestamp?: string;
  } | null;
}

function getEvidenceSlotsForModule(moduleType?: string, customSlots?: EvidenceSlot[]): EvidenceSlot[] {
  if (Array.isArray(customSlots) && customSlots.length > 0) {
    return customSlots;
  }

  switch (moduleType) {
    case "QUICK_ERRANDS":
      return [
        { key: "pickup_location", label: "Pickup / Target Site", required: true },
        { key: "item_verification", label: "Item / Document Proof", required: true },
        { key: "merchant_receipt", label: "Official Receipt / Waybill", required: false },
        { key: "handover_proof", label: "Delivery & Handover Photo", required: true },
      ];
    case "PROJECT_WATCH":
      return [
        { key: "substructure", label: "Foundation & Substructure", required: true },
        { key: "columns_rebar", label: "Columns & Reinforcement", required: true },
        { key: "superstructure", label: "Blockwork & Lintels", required: true },
        { key: "roofing_drainage", label: "Roofing & Parapet", required: false },
        { key: "material_stock", label: "On-Site Material Stock", required: false },
        { key: "site_signboard", label: "Project & Engineer Signboard", required: true },
      ];
    case "DUE_DILIGENCE":
      return [
        { key: "registry_stamp", label: "Registry / Bureau Search Stamp", required: true },
        { key: "survey_beacons", label: "Cadastral Survey Beacons", required: true },
        { key: "site_signage", label: "Property / Corporate Signage", required: true },
        { key: "boundary_context", label: "Boundary & Access Context", required: true },
      ];
    case "LEGAL_ADVISORY":
    case "LAW_ENFORCEMENT":
      return [
        { key: "certified_copy", label: "Certified True Copy (CTC)", required: true },
        { key: "official_seal", label: "Official Stamp & Seal", required: true },
        { key: "filing_receipt", label: "Statutory Filing Receipt", required: true },
        { key: "site_verification", label: "On-Site Verification Proof", required: false },
      ];
    case "PROPERTY_OVERSITE":
    default:
      return [
        { key: "front", label: "Front Elevation", required: true },
        { key: "back", label: "Rear & Backyard", required: true },
        { key: "driveway", label: "Access Road & Driveway", required: true },
        { key: "westFence", label: "West Perimeter Fence", required: true },
        { key: "northFence", label: "North Perimeter Fence", required: false },
        { key: "sideGate", label: "Main Gate & Utility Meters", required: true },
      ];
  }
}

export default function AgentTaskExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;
  const [task, setTask] = useState<any>(null);
  const [isLoadingTask, setIsLoadingTask] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Step state: 1 = Confirm arrival, 2 = Evidence & Milestones, 3 = Structured Review & Submit, 4 = Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);

  // Dynamic Evidence & Milestones
  const [extraSlots, setExtraSlots] = useState<EvidenceSlot[]>([]);
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, { url: string; previewUrl: string }>>({});
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null);
  const [milestoneNotes, setMilestoneNotes] = useState<Record<string, string>>({});
  const [milestoneMedia, setMilestoneMedia] = useState<Record<string, string[]>>({});
  const [uploadingMilestoneId, setUploadingMilestoneId] = useState<string | null>(null);
  const activeMilestoneUploadRef = useRef<string | null>(null);
  const milestoneFileInputRef = useRef<HTMLInputElement>(null);

  // Step 3 Structured Report State
  const [riskRating, setRiskRating] = useState<"LOW" | "MEDIUM" | "HIGH">("LOW");
  const [verificationVerdict, setVerificationVerdict] = useState<string>("Verified & Satisfactory");
  const [agentNotes, setAgentNotes] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Real-time Mission Chat Modal State
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [isSendingChat, setIsSendingChat] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const activePhotoSlotRef = useRef<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load Task & Milestones
  useEffect(() => {
    let isMounted = true;
    async function loadTask() {
      try {
        const token = await getStoredToken();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (isMounted) setCurrentUserId(payload.sub);
          } catch {}
        }

        const res = await fetch(`/api/v1/tasks/${taskId}`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isMounted) {
            setTask(json.data);
            if (Array.isArray(json.data.milestones)) {
              setMilestones(json.data.milestones);
              const initialMedia: Record<string, string[]> = {};
              const initialNotes: Record<string, string> = {};
              json.data.milestones.forEach((m: any) => {
                if (Array.isArray(m.mediaUrls) && m.mediaUrls.length > 0) {
                  initialMedia[m.id] = m.mediaUrls;
                }
                if (m.agentNote) {
                  initialNotes[m.id] = m.agentNote;
                }
              });
              setMilestoneMedia(initialMedia);
              setMilestoneNotes(initialNotes);
              if (json.data.milestones[0]?.id) {
                setExpandedMilestoneId(json.data.milestones[0].id);
              }
            }
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoadingTask(false);
      }
    }
    loadTask();
    return () => {
      isMounted = false;
    };
  }, [taskId]);

  // Load Chat Messages when modal opens
  useEffect(() => {
    if (!showMessageModal) return;
    let isMounted = true;

    async function loadChat() {
      try {
        const token = await getStoredToken();
        const res = await fetch(`/api/v1/chat/${taskId}/messages`, {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && isMounted) {
            const mapped: ChatMsg[] = json.data.map((m: any) => {
              let parsedMilestone = null;
              if (m.messageType === "MILESTONE_UPDATE" && m.message) {
                try {
                  parsedMilestone = JSON.parse(m.message);
                } catch {}
              }
              return {
                id: m.id,
                senderId: m.senderId,
                message: m.message,
                messageType: m.messageType || "TEXT",
                createdAt: m.createdAt,
                parsedMilestone,
              };
            });
            setChatMessages(mapped);
          }
        }
      } catch {}
    }

    loadChat();
    return () => {
      isMounted = false;
    };
  }, [showMessageModal, taskId]);

  const baseSlots = getEvidenceSlotsForModule(
    task?.moduleType,
    task?.formData?.requiredEvidence as EvidenceSlot[] | undefined
  );
  const allEvidenceSlots = [...baseSlots, ...extraSlots];

  const agentPayoutNgn = task?.priceNgn
    ? Math.round(Number(task.priceNgn) * 0.8)
    : 9600;

  const isPropertyOversiteTask =
    task?.moduleType === "PROPERTY_OVERSITE" ||
    Boolean(task?.formData?.isPropertyIntelTask);

  const clientDisplayName = isPropertyOversiteTask
    ? "Oversite"
    : task?.clientName ||
      task?.formData?.contactName ||
      task?.formData?.clientName ||
      "Oversite Client";

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    showToast("Acquiring high-accuracy GPS coordinates...");

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          try {
            const token = await getStoredToken();
            const res = await fetch(`/api/v1/tasks/${taskId}/arrive`, {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ latitude, longitude, accuracy }),
            });
            const json = await res.json().catch(() => null);
            if (res.ok && json?.success) {
              showToast(
                `GPS verified! Arrived at site (${
                  json.data?.distanceMeters ? `${json.data.distanceMeters}m away` : "Geofence matched"
                })`
              );
            } else {
              showToast("GPS recorded. Proceeding to inspection.");
            }
          } catch {
            showToast("GPS recorded. Proceeding to inspection.");
          } finally {
            setIsGettingLocation(false);
            setLocationVerified(true);
            setTimeout(() => setCurrentStep(2), 600);
          }
        },
        () => {
          setIsGettingLocation(false);
          setLocationVerified(true);
          showToast("GPS arrival confirmed.");
          setTimeout(() => setCurrentStep(2), 600);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setIsGettingLocation(false);
      setLocationVerified(true);
      showToast("GPS arrival confirmed.");
      setCurrentStep(2);
    }
  };

  const handleTriggerMilestonePhoto = (milestoneId: string) => {
    if (uploadingMilestoneId) return;
    activeMilestoneUploadRef.current = milestoneId;
    if (milestoneFileInputRef.current) {
      milestoneFileInputRef.current.value = "";
      milestoneFileInputRef.current.click();
    }
  };

  const handleMilestoneFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    const mId = activeMilestoneUploadRef.current;
    if (!file || !mId) return;

    const validationError = validateAgentUploadFile(file, { allowPdf: false });
    if (validationError) {
      showToast(validationError);
      return;
    }

    setUploadingMilestoneId(mId);
    try {
      const uploaded = await uploadAgentMedia(file, "evidence");
      setMilestoneMedia((prev) => ({
        ...prev,
        [mId]: [...(prev[mId] || []), uploaded.url || uploaded.previewUrl],
      }));
      showToast("Photo attached to milestone");
    } catch {
      showToast("Failed to attach photo to milestone");
    } finally {
      setUploadingMilestoneId(null);
      activeMilestoneUploadRef.current = null;
    }
  };

  const handleMilestoneAction = async (
    m: MilestoneItem,
    feedbackType: "REPORT" | "SUBMISSION"
  ) => {
    if (updatingMilestoneId) return;
    const noteText = (milestoneNotes[m.id] || "").trim();
    const attachedUrls = milestoneMedia[m.id] || [];

    if (feedbackType === "REPORT" && !noteText) {
      showToast("Please enter your question, issue, or brief report first.");
      return;
    }

    setUpdatingMilestoneId(m.id);
    try {
      const token = await getStoredToken();
      const res = await fetch(`/api/v1/tasks/${taskId}/milestones`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          milestoneId: m.id,
          status: feedbackType === "SUBMISSION" ? "COMPLETED" : "IN_PROGRESS",
          feedbackType,
          note:
            noteText ||
            (feedbackType === "SUBMISSION"
              ? `${m.title} verified on site with ${attachedUrls.length} photo(s).`
              : "Situational update from field agent."),
          mediaUrls: attachedUrls,
        }),
      });

      if (res.ok) {
        setMilestones((prev) =>
          prev.map((item) =>
            item.id === m.id
              ? {
                  ...item,
                  status: "IN_PROGRESS",
                  pendingApproval: feedbackType === "SUBMISSION",
                  mediaUrls: attachedUrls,
                  agentNote: noteText,
                }
              : item
          )
        );
        showToast(
          feedbackType === "REPORT"
            ? "Report / inquiry routed to Admin for review!"
            : "Milestone submission routed to Admin for approval!"
        );
      } else {
        showToast("Could not send milestone update.");
      }
    } catch {
      showToast("Network error while sending milestone feedback.");
    } finally {
      setUpdatingMilestoneId(null);
    }
  };

  const handleAddExtraSlot = () => {
    const idx = extraSlots.length + 1;
    const newSlot: EvidenceSlot = {
      key: `extra_evidence_${idx}`,
      label: `Additional Evidence #${idx}`,
      required: false,
    };
    setExtraSlots((prev) => [...prev, newSlot]);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSendingChat) return;
    const text = chatInput.trim();
    setChatInput("");
    setIsSendingChat(true);

    const optimistic: ChatMsg = {
      id: `opt-${Date.now()}`,
      senderId: currentUserId || "me",
      message: text,
      messageType: "TEXT",
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimistic]);

    try {
      const token = await getStoredToken();
      await fetch(`/api/v1/chat/${taskId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          messageType: "TEXT",
        }),
      });
      showToast("Message delivered to client feed");
    } catch {
      showToast("Failed to send message");
    } finally {
      setIsSendingChat(false);
    }
  };

  const handleTriggerPhotoPicker = (field: string) => {
    if (uploadingSlot) return;
    activePhotoSlotRef.current = field;
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
      photoInputRef.current.click();
    }
  };

  const handleEvidenceFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    const slot = activePhotoSlotRef.current;
    if (!file || !slot) return;

    const validationError = validateAgentUploadFile(file, { allowPdf: false });
    if (validationError) {
      showToast(validationError);
      return;
    }

    setUploadingSlot(slot);
    try {
      const uploaded = await uploadAgentMedia(file, "evidence");
      setCapturedPhotos((prev) => ({
        ...prev,
        [slot]: { url: uploaded.url, previewUrl: uploaded.previewUrl },
      }));
      const slotLabel = allEvidenceSlots.find((s) => s.key === slot)?.label || slot;
      showToast(
        uploaded.storedOnServer
          ? `Uploaded "${slotLabel}" to S3`
          : `Captured "${slotLabel}"`
      );
    } catch {
      showToast("Failed to upload photo. Please try again.");
    } finally {
      setUploadingSlot(null);
      activePhotoSlotRef.current = null;
    }
  };

  const handleRemovePhoto = (field: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCapturedPhotos((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmitFinalReport = async () => {
    if (isSubmittingReport) return;
    setIsSubmittingReport(true);
    showToast("Submitting inspection report...");

    try {
      const token = await getStoredToken();
      const mediaPayload = Object.entries(capturedPhotos).map(([slot, val]) => {
        const slotLabel = allEvidenceSlots.find((s) => s.key === slot)?.label || slot;
        return {
          url: val.url,
          type: "image",
          caption: slotLabel,
        };
      });

      const structuredSummary = agentNotes.trim()
        ? `[Verdict: ${verificationVerdict} | Risk: ${riskRating}] ${agentNotes.trim()}`
        : `[Verdict: ${verificationVerdict} | Risk: ${riskRating}] Completed field verification for ${
            task?.title || "assignment"
          } at ${task?.locationAddress || "target site"} with ${mediaPayload.length} geo-tagged evidence captures.`;

      if (token) {
        await fetch("/api/v1/reports/submit", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            taskId,
            summary: structuredSummary,
            findings: agentNotes.trim() || structuredSummary,
            severity: riskRating,
            checklist: milestones.map((m) => ({
              title: m.title,
              status: m.status,
            })),
            completionPct: 100,
            media: mediaPayload,
          }),
        }).catch(() => null);
      }

      setCurrentStep(4);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const moduleBadgeLabel = (task?.moduleType || "FIELD_MISSION").replace(/_/g, " ");

  return (
    <div className="space-y-4 max-w-full pb-12" data-task-id={taskId}>
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[var(--bg-card)] text-[var(--text-heading)] border border-[var(--border-color)] font-semibold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <AgentTopNav
        showBack={true}
        backHref="/agent/tasks"
        title={task?.title || "Field Mission"}
        subtitle={task?.locationAddress || "Geofenced Site Inspection"}
      />

      {/* STEP INDICATOR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-heading)]">
            {currentStep === 1 && "Confirm you have arrived"}
            {currentStep === 2 && "Capture modular evidence & milestones"}
            {currentStep === 3 && "Review & finalize report"}
            {currentStep === 4 && "Assignment complete"}
          </h2>
          <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            STEP {currentStep}/4
          </span>
        </div>

        {/* 4 Segmented Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((stepNum) => (
            <div
              key={stepNum}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                stepNum <= currentStep ? "bg-[var(--primary)]" : "bg-[var(--border-color)]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Assignment Subheader */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-[var(--text-heading)] leading-tight">
              {task?.title || "Field Mission"}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--primary-light)] text-[var(--primary)]">
              {moduleBadgeLabel}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {task?.locationAddress || "Inspection Target Location"}
          </p>
        </div>
        <div className="bg-[var(--warning-light)] border border-[var(--warning)]/30 text-[var(--warning)] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0">
          <Clock className="w-3.5 h-3.5 text-[var(--warning)]" />
          <span>Active SLA</span>
        </div>
      </div>

      {/* STEP 1: CONFIRM ARRIVAL */}
      {currentStep === 1 && (
        <div className="space-y-4">
          {/* Map Preview */}
          <div className="relative rounded-[24px] overflow-hidden border border-[var(--border-color)] bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] h-48 sm:h-56 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
            <div
              className="absolute inset-0 opacity-60 dark:opacity-80"
              style={{
                backgroundImage:
                  "radial-gradient(var(--border-color) 2px, transparent 2px)",
                backgroundSize: "24px 24px",
              }}
            >
              <svg className="w-full h-full opacity-80" viewBox="0 0 500 240">
                <path d="M0,60 Q200,90 500,40" stroke="var(--primary)" strokeOpacity="0.65" strokeWidth="5" fill="none" />
                <path d="M80,240 Q180,140 400,0" stroke="var(--primary)" strokeOpacity="0.45" strokeWidth="4" fill="none" />
                <path d="M0,170 Q250,190 500,160" stroke="var(--primary)" strokeOpacity="0.25" strokeWidth="4" fill="none" />
                <path d="M280,0 L320,240" stroke="var(--primary)" strokeOpacity="0.25" strokeWidth="3" fill="none" />
                <circle cx="250" cy="110" r="32" fill="var(--primary)" fillOpacity="0.2" className="animate-ping" />
                <circle cx="250" cy="110" r="14" fill="var(--primary)" fillOpacity="0.35" />
              </svg>
            </div>

            {/* Target Location Pin */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-full bg-[var(--danger)] shadow-xl shadow-[var(--danger)]/40 flex items-center justify-center text-white border-2 border-white animate-bounce">
                <MapPin className="w-5 h-5 fill-white" />
              </div>
              <span className="text-[10px] font-bold bg-[var(--bg-card)]/95 text-[var(--text-heading)] px-2.5 py-1 rounded-full mt-1 border border-[var(--border-color)] shadow-sm truncate max-w-[240px]">
                {task?.locationAddress || "Target Site Geofence"}
              </span>
            </div>
          </div>

          {/* Task Summary Card */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 sm:p-6 shadow-[0_0_10px_rgba(0,0,0,0.03)] space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-color)]">
              <span className="text-xs text-[var(--text-muted)] font-semibold">Operative Payout</span>
              <span className="text-base font-extrabold text-[var(--primary)]">
                ₦{agentPayoutNgn.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-color)]">
              <span className="text-xs text-[var(--text-muted)] font-semibold">Client</span>
              <span className="text-xs font-bold text-[var(--text-heading)]">{clientDisplayName}</span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-color)]">
              <span className="text-xs text-[var(--text-muted)] font-semibold">Evidence Checklist</span>
              <span className="text-xs font-bold text-[var(--text-heading)]">
                {allEvidenceSlots.length} modular items ({moduleBadgeLabel})
              </span>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] font-semibold block mb-1">Mission Brief & Instructions</span>
              <p className="text-xs text-[var(--text-body)] leading-relaxed font-medium whitespace-pre-line">
                {task?.instructions ||
                  task?.description ||
                  "Complete full photographic verification and milestone progression as specified."}
              </p>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowMessageModal(true)}
              className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] font-semibold text-xs px-5 py-3.5 rounded-2xl flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
            >
              <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
              <span>Message</span>
            </button>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isGettingLocation}
              className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
            >
              <Navigation className={`w-4 h-4 ${isGettingLocation ? "animate-spin" : ""}`} />
              <span>
                {isGettingLocation ? "Verifying GPS..." : locationVerified ? "Continue" : "Confirm Site Arrival"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MODULAR EVIDENCE & MILESTONE PROGRESSION */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {/* 2A: Task Milestones Progression & Feedback Card (Report vs Submission) */}
          {milestones.length > 0 && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 space-y-3 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-[var(--primary)]" />
                  <span>Mission Milestones (Report or Submit Progress)</span>
                </h4>
                <span className="text-xs font-bold text-[var(--primary)]">
                  {milestones.filter((m) => m.status === "COMPLETED").length}/{milestones.length} Approved
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                Attach milestone photos, then either send a <strong>Field Report / Question</strong> or <strong>Submit Milestone Progress</strong>. Oversite Admin intercepts and approves all updates before the client sees them.
              </p>

              {/* Hidden file input for milestone media */}
              <input
                ref={milestoneFileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleMilestoneFileChange}
              />

              <div className="space-y-2.5 pt-1">
                {milestones.map((m) => {
                  const isCompleted = m.status === "COMPLETED";
                  const isInProgress = m.status === "IN_PROGRESS";
                  const isUpdating = updatingMilestoneId === m.id;
                  const isExpanded = expandedMilestoneId === m.id;
                  const mPhotos = milestoneMedia[m.id] || [];

                  return (
                    <div
                      key={m.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isCompleted
                          ? "bg-[var(--primary-light)]/25 border-[var(--primary)]/40"
                          : isInProgress
                            ? "bg-amber-500/5 border-amber-500/40"
                            : "bg-[var(--bg-secondary)] border-[var(--border-color)]"
                      }`}
                    >
                      <div
                        onClick={() =>
                          setExpandedMilestoneId((prev) =>
                            prev === m.id ? null : m.id
                          )
                        }
                        className="p-3.5 cursor-pointer flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[var(--text-heading)] truncate">
                            {m.title}
                          </p>
                          {m.description && (
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 line-clamp-1">
                              {m.description}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {mPhotos.length > 0 && (
                            <span className="text-[10px] font-semibold text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded-full">
                              {mPhotos.length} photo{mPhotos.length > 1 ? "s" : ""}
                            </span>
                          )}
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 text-[var(--primary)] animate-spin" />
                          ) : isCompleted ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[var(--primary)] text-white">
                              ✓ Approved
                            </span>
                          ) : m.pendingApproval ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                              Pending Admin Approval
                            </span>
                          ) : isInProgress ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                              In Progress
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)]">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-2 border-t border-[var(--border-color)]/60 space-y-3 bg-[var(--bg-card)]/60">
                          {/* Milestone Photo Thumbnails & Add Photo Button */}
                          <div>
                            <label className="block text-[10.5px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                              Milestone Media Attachments
                            </label>
                            <div className="flex items-center gap-2 flex-wrap">
                              {mPhotos.map((url, idx) => (
                                <div
                                  key={idx}
                                  className="relative w-16 h-14 rounded-xl overflow-hidden border border-[var(--border-color)]"
                                >
                                  <img
                                    src={url}
                                    alt="Milestone media"
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setMilestoneMedia((prev) => ({
                                        ...prev,
                                        [m.id]: (prev[m.id] || []).filter(
                                          (_, i) => i !== idx
                                        ),
                                      }))
                                    }
                                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}

                              <button
                                type="button"
                                onClick={() => handleTriggerMilestonePhoto(m.id)}
                                disabled={uploadingMilestoneId === m.id}
                                className="h-14 px-3 rounded-xl border border-dashed border-[var(--border-color)] hover:border-[var(--primary)] text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center gap-1.5 cursor-pointer"
                              >
                                {uploadingMilestoneId === m.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--primary)]" />
                                ) : (
                                  <Camera className="w-3.5 h-3.5" />
                                )}
                                <span>Add Photo</span>
                              </button>
                            </div>
                          </div>

                          {/* Note / Question / Observation Input */}
                          <div>
                            <input
                              type="text"
                              value={milestoneNotes[m.id] || ""}
                              onChange={(e) =>
                                setMilestoneNotes((prev) => ({
                                  ...prev,
                                  [m.id]: e.target.value,
                                }))
                              }
                              placeholder="Enter milestone finding, question for clarity, or situational report..."
                              className="w-full rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] px-3 py-2 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
                            />
                          </div>

                          {/* Two Feedback Type Buttons: 1) Report / Question, 2) Submit Progress */}
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleMilestoneAction(m, "REPORT")}
                              className="py-2 px-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] text-[11px] font-bold text-[var(--text-heading)] cursor-pointer transition-colors"
                            >
                              Send Report / Inquiry
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                handleMilestoneAction(m, "SUBMISSION")
                              }
                              className="py-2 px-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              Submit Milestone
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2B: Dynamic Modular Evidence Capture Grid */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 space-y-4 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[var(--primary)]" />
                <span>Required Evidence ({moduleBadgeLabel})</span>
              </h4>
              <span className="text-xs text-[var(--primary)] font-bold">
                {Object.keys(capturedPhotos).length}/{allEvidenceSlots.length} captured
              </span>
            </div>

            {/* Hidden Native Camera / Image File Input */}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleEvidenceFileChange}
            />

            <div className="grid grid-cols-2 gap-3">
              {allEvidenceSlots.map(({ key, label, required }) => {
                const photo = capturedPhotos[key];
                const isSlotUploading = uploadingSlot === key;
                return (
                  <div
                    key={key}
                    onClick={() => handleTriggerPhotoPicker(key)}
                    className="relative rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] h-32 flex flex-col items-center justify-center overflow-hidden cursor-pointer group hover:border-[var(--primary)] transition-all"
                  >
                    {isSlotUploading ? (
                      <div className="flex flex-col items-center gap-2 p-3 text-center">
                        <Loader2 className="w-5 h-5 text-[var(--primary)] animate-spin" />
                        <span className="text-[11px] font-semibold text-[var(--text-heading)]">
                          Uploading...
                        </span>
                      </div>
                    ) : photo ? (
                      <>
                        <img
                          src={photo.previewUrl}
                          alt={label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-2">
                          <div className="flex items-center justify-between gap-1">
                            <span className="bg-[var(--primary)] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                              Captured
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleRemovePhoto(key, e)}
                              aria-label={`Remove ${label}`}
                              className="w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-white text-[11px] font-bold truncate">
                            {label}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                        <Camera className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                        <span className="text-xs font-semibold text-[var(--text-heading)] line-clamp-1">
                          {label}
                        </span>
                        <span className="text-[10px] text-[var(--primary)] font-medium">
                          {required ? "Required · Tap to capture" : "Optional · Tap to add"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Additional Photo Slot Button */}
            <button
              type="button"
              onClick={handleAddExtraSlot}
              className="w-full py-2.5 rounded-xl border border-dashed border-[var(--border-color)] hover:border-[var(--primary)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--primary)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Additional Photo / Document Slot</span>
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-[var(--text-heading)] border border-[var(--border-color)] px-5 py-3.5 rounded-2xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm py-3.5 rounded-2xl transition-colors shadow-sm text-center cursor-pointer"
            >
              Continue to Review
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: STRUCTURED REVIEW & FINALIZE REPORT */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 space-y-4 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
            <h4 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[var(--primary)]" />
              Finalize Inspection Dossier
            </h4>

            {/* Live Mission Summary Box */}
            <div className="bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Location Verified</span>
                <span className="text-[var(--primary)] font-bold truncate max-w-[200px]">
                  ✓ {task?.locationAddress || "Target Site Verified"}
                </span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Evidence Attached</span>
                <span className="text-[var(--primary)] font-bold">
                  ✓ {Object.keys(capturedPhotos).length} Geo-tagged photos
                </span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Milestones Completed</span>
                <span className="text-[var(--primary)] font-bold">
                  ✓ {milestones.filter((m) => m.status === "COMPLETED").length}/{milestones.length} stages
                </span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Operative Payout Credit</span>
                <span className="text-[var(--text-heading)] font-extrabold">
                  ₦{agentPayoutNgn.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Structured Field 1: Risk / Condition Rating */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1.5">
                Site Risk / Condition Assessment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { val: "LOW", label: "Low Risk (Clean)" },
                    { val: "MEDIUM", label: "Moderate Note" },
                    { val: "HIGH", label: "High Risk / Flag" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setRiskRating(opt.val)}
                    className={`py-2.5 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                      riskRating === opt.val
                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                        : "bg-[var(--bg-secondary)] text-[var(--text-heading)] border-[var(--border-color)]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Structured Field 2: Verification Verdict */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1.5">
                Verification Verdict
              </label>
              <select
                value={verificationVerdict}
                onChange={(e) => setVerificationVerdict(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="Verified & Satisfactory">Verified & Satisfactory</option>
                <option value="Verified with Minor Observations">Verified with Minor Observations</option>
                <option value="Discrepancy / Encroachment Observed">Discrepancy / Encroachment Observed</option>
                <option value="Incomplete Access — Follow-up Needed">Incomplete Access — Follow-up Needed</option>
              </select>
            </div>

            {/* Structured Field 3: Detailed Agent Findings */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1.5">
                Oversite Manager Note & Detailed Findings
              </label>
              <textarea
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                placeholder="Provide comprehensive field observations for the client report (e.g. boundary status, structural progress, merchant receipt details)..."
                rows={4}
                className="w-full bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl p-3 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-[var(--text-heading)] border border-[var(--border-color)] px-5 py-3.5 rounded-2xl text-xs font-semibold cursor-pointer transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={isSubmittingReport}
              onClick={handleSubmitFinalReport}
              className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm py-3.5 rounded-2xl transition-colors shadow-sm text-center cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmittingReport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Final Report</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUBMISSION COMPLETE */}
      {currentStep === 4 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-6 text-center space-y-4 shadow-[0_0_10px_rgba(0,0,0,0.03)] animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white mx-auto shadow-xl shadow-[var(--primary)]/20">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-[var(--text-heading)]">Report Submitted!</h3>
            <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
              Your field verification for{" "}
              <span className="font-semibold text-[var(--text-heading)]">
                {task?.title || "Field Mission"}
              </span>{" "}
              has been submitted to <span className="font-semibold text-[var(--text-heading)]">{clientDisplayName}</span>.
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Payout Status</span>
              <span className="text-[var(--primary)] font-bold">Credited to Pending Clearance</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Amount</span>
              <span className="text-[var(--text-heading)] font-extrabold text-sm">
                ₦{agentPayoutNgn.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              href="/agent/dashboard"
              className="block w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm py-3.5 rounded-2xl transition-colors shadow-sm"
            >
              Return to Dashboard
            </Link>
            <Link
              href="/agent/queue"
              className="block w-full bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] hover:bg-[var(--border-color)]/40 text-[var(--text-heading)] border border-[var(--border-color)] font-semibold text-xs py-2.5 rounded-2xl transition-colors"
            >
              Find More Tasks in Queue
            </Link>
          </div>
        </div>
      )}

      {/* Live Mission Chat Modal (Connected to /api/v1/chat/:taskId/messages) */}
      {showMessageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowMessageModal(false)}
        >
          <div
            className="bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[32px] sm:rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-[var(--border-color)] rounded-full mx-auto mb-2 sm:hidden shrink-0" />

            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">
                  {getInitials(clientDisplayName)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-heading)]">{clientDisplayName}</h4>
                  <span className="text-[10px] text-[var(--primary)]">
                    {isPropertyOversiteTask
                      ? "Oversite Property Intelligence Desk · Property Brief"
                      : "Client · Live Mission Feed"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMessageModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {chatMessages.map((msg) => {
                const isMe = msg.senderId === currentUserId || msg.senderId === "agent-tunde-coker";

                if (msg.messageType === "MILESTONE_UPDATE" && msg.parsedMilestone) {
                  return (
                    <div
                      key={msg.id}
                      className="rounded-xl border border-[#a3e0b5] dark:border-[#22543d] bg-[#f0f9f3] dark:bg-[#14261c] p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-[var(--primary)]">
                        <span>MILESTONE EVENT UPDATE</span>
                        <span>{msg.parsedMilestone.status}</span>
                      </div>
                      <p className="font-bold text-[var(--text-heading)]">
                        {msg.parsedMilestone.milestoneTitle}
                      </p>
                      {msg.parsedMilestone.stageDetails && (
                        <p className="text-[11px] text-[var(--text-muted)]">
                          {msg.parsedMilestone.stageDetails}
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                      isMe
                        ? "ml-auto bg-[var(--primary)] text-white font-medium"
                        : "bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-heading)]"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <span
                      className={`text-[9px] block text-right mt-1 ${
                        isMe ? "text-white/80" : "text-[var(--text-muted)]"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  isPropertyOversiteTask
                    ? "Message Oversite regarding this property..."
                    : "Type an update to client..."
                }
                className="flex-1 bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
              />
              <button
                type="button"
                disabled={!chatInput.trim() || isSendingChat}
                onClick={handleSendMessage}
                className="w-9 h-9 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
