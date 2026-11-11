"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
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
} from "lucide-react";

export default function AgentTaskExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;

  // Step state: 1 = Confirm arrival, 2 = Photo capture, 3 = Review & submit, 4 = Success
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<Record<string, string>>({
    front: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80",
    back: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&auto=format&fit=crop&q=80",
  });
  const [agentNotes, setAgentNotes] = useState("");
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    {
      sender: "Adaeze O.",
      text: "Hello agent, please ensure to photograph the electrical meter box by the side gate as well.",
      time: "10:14 AM",
    },
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    showToast("Acquiring high-accuracy GPS coordinates...");

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsGettingLocation(false);
          setLocationVerified(true);
          showToast("GPS verified! You are 0.02 km from 4 Bourdillon Close.");
          setTimeout(() => {
            setCurrentStep(2);
          }, 900);
        },
        () => {
          setTimeout(() => {
            setIsGettingLocation(false);
            setLocationVerified(true);
            showToast("GPS arrival verified (Geofence match: 6.4541° N, 3.4246° E)");
            setTimeout(() => {
              setCurrentStep(2);
            }, 800);
          }, 1200);
        },
        { timeout: 5000 }
      );
    } else {
      setTimeout(() => {
        setIsGettingLocation(false);
        setLocationVerified(true);
        showToast("GPS arrival verified at beacon location.");
        setCurrentStep(2);
      }, 1000);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "You",
        text: chatInput.trim(),
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setChatInput("");
    showToast("Message sent to client");
  };

  const handlePhotoUploadMock = (field: string) => {
    const mockImages = [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=600&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&auto=format&fit=crop&q=80",
    ];
    const picked = mockImages[Math.floor(Math.random() * mockImages.length)];
    setCapturedPhotos((prev) => ({ ...prev, [field]: picked }));
    showToast(`Captured photo for ${field}`);
  };

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
      <div className="flex items-center justify-between pt-1">
        <Link
          href="/agent/tasks"
          className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors shadow-xs cursor-pointer"
          aria-label="Back to tasks"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-sm font-semibold text-[var(--text-heading)] truncate max-w-[200px] sm:max-w-md">
          CAC certified copy retrieval
        </h1>
        <ThemeToggle className="w-9 h-9 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors shadow-xs cursor-pointer" />
      </div>

      {/* STEP INDICATOR */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-heading)]">
            {currentStep === 1 && "Confirm you have arrived"}
            {currentStep === 2 && "Capture required evidence"}
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
          <h3 className="text-lg font-bold text-[var(--text-heading)] leading-tight">Ikoyi site visit</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            4 Bourdillon Close, Ikoyi, Lagos.
          </p>
        </div>
        <div className="bg-[var(--warning-light)] border border-[var(--warning)]/30 text-[var(--warning)] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0">
          <Clock className="w-3.5 h-3.5 text-[var(--warning)]" />
          <span>2h left</span>
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
              {/* SVG Map roads representing Falomo / Ikoyi / Bourdillon */}
              <svg className="w-full h-full opacity-80" viewBox="0 0 500 240">
                <path d="M0,60 Q200,90 500,40" stroke="var(--primary)" strokeOpacity="0.65" strokeWidth="5" fill="none" />
                <text x="240" y="52" className="fill-[var(--text-heading)]" fontSize="10" fontWeight="bold">Bourdillon Rd</text>

                <path d="M80,240 Q180,140 400,0" stroke="var(--primary)" strokeOpacity="0.45" strokeWidth="4" fill="none" />
                <text x="180" y="160" className="fill-[var(--text-heading)]" fontSize="10" fontWeight="bold">Alfred Rewane Rd</text>

                <path d="M0,170 Q250,190 500,160" stroke="var(--primary)" strokeOpacity="0.25" strokeWidth="4" fill="none" />
                <text x="320" y="180" className="fill-[var(--text-muted)]" fontSize="9">Thompson Ave</text>

                <path d="M280,0 L320,240" stroke="var(--primary)" strokeOpacity="0.25" strokeWidth="3" fill="none" />
                <text x="325" y="110" className="fill-[var(--text-muted)]" fontSize="9">Glover Rd</text>

                <circle cx="250" cy="110" r="32" fill="var(--primary)" fillOpacity="0.2" className="animate-ping" />
                <circle cx="250" cy="110" r="14" fill="var(--primary)" fillOpacity="0.35" />
              </svg>
            </div>

            {/* Target Location Pin */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-full bg-[var(--danger)] shadow-xl shadow-[var(--danger)]/40 flex items-center justify-center text-white border-2 border-white animate-bounce">
                <MapPin className="w-5 h-5 fill-white" />
              </div>
              <span className="text-[10px] font-bold bg-[var(--bg-card)]/95 text-[var(--text-heading)] px-2.5 py-1 rounded-full mt-1 border border-[var(--border-color)] shadow-sm">
                4 Bourdillon Close
              </span>
            </div>
          </div>

          {/* Task Summary Card matching User Dashboard */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 sm:p-6 shadow-[0_0_10px_rgba(0,0,0,0.03)] space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-color)]">
              <span className="text-xs text-[var(--text-muted)] font-semibold">Payout</span>
              <span className="text-base font-extrabold text-[var(--primary)]">₦7,700</span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-color)]">
              <span className="text-xs text-[var(--text-muted)] font-semibold">Client</span>
              <span className="text-xs font-bold text-[var(--text-heading)]">Adaeze O.</span>
            </div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-color)]">
              <span className="text-xs text-[var(--text-muted)] font-semibold">Evidence required</span>
              <span className="text-xs font-bold text-[var(--text-heading)]">Scan + 2 photos</span>
            </div>
            <div>
              <span className="text-xs text-[var(--text-muted)] font-semibold block mb-1">Instructions</span>
              <p className="text-xs text-[var(--text-body)] leading-relaxed font-medium">
                Photo taken should include the front view, back view, driver&apos;s way, west fence, north fence, and side gate.
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
              <span>{isGettingLocation ? "Verifying GPS..." : locationVerified ? "Continue" : "Get my location"}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PHOTO CAPTURE & EVIDENCE */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 space-y-4 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[var(--primary)]" />
                Required On-Site Evidence (6 Points)
              </h4>
              <span className="text-xs text-[var(--primary)] font-bold">
                {Object.keys(capturedPhotos).length}/6 captured
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "front", label: "Front View" },
                { key: "back", label: "Back View" },
                { key: "driveway", label: "Driver's Way" },
                { key: "westFence", label: "West Fence" },
                { key: "northFence", label: "North Fence" },
                { key: "sideGate", label: "Side Gate" },
              ].map(({ key, label }) => {
                const photoUrl = capturedPhotos[key];
                return (
                  <div
                    key={key}
                    onClick={() => handlePhotoUploadMock(key)}
                    className="relative rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] h-32 flex flex-col items-center justify-center overflow-hidden cursor-pointer group hover:border-[var(--primary)] transition-all"
                  >
                    {photoUrl ? (
                      <>
                        <img
                          src={photoUrl}
                          alt={label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-2">
                          <span className="bg-[var(--primary)] text-white text-[9px] font-bold px-2 py-0.5 rounded-full self-start">
                            Captured
                          </span>
                          <span className="text-white text-[11px] font-bold truncate">
                            {label}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                        <Camera className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                        <span className="text-xs font-semibold text-[var(--text-heading)]">{label}</span>
                        <span className="text-[10px] text-[var(--primary)] font-medium">Tap to snap</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

      {/* STEP 3: REVIEW & FINALIZE REPORT */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)]/70 rounded-[24px] p-5 space-y-4 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
            <h4 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[var(--primary)]" />
              Finalize Inspection Report
            </h4>

            <div className="bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Location Verified</span>
                <span className="text-[var(--primary)] font-bold">✓ 4 Bourdillon Close, Lagos</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Evidence Attached</span>
                <span className="text-[var(--primary)] font-bold">✓ {Object.keys(capturedPhotos).length} Geo-tagged photos</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>Direct Payout Credit</span>
                <span className="text-[var(--text-heading)] font-extrabold">₦7,700</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1.5">
                Agent Findings & Observation Notes
              </label>
              <textarea
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                placeholder="e.g. Property boundary intact, side gate accessible, electricity meter confirmed..."
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
              onClick={() => {
                showToast("Submitting inspection report...");
                setTimeout(() => setCurrentStep(4), 800);
              }}
              className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-sm py-3.5 rounded-2xl transition-colors shadow-sm text-center cursor-pointer"
            >
              Submit Final Report
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
              Your field verification for <span className="font-semibold text-[var(--text-heading)]">Ikoyi site visit</span> has been submitted to Adaeze O.
            </p>
          </div>

          <div className="bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] rounded-2xl p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Payout Status</span>
              <span className="text-[var(--primary)] font-bold">Credited to Pending Clearance</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Amount</span>
              <span className="text-[var(--text-heading)] font-extrabold text-sm">₦7,700</span>
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

      {/* Client Chat Modal */}
      {showMessageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setShowMessageModal(false)}
        >
          <div
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-bold text-xs flex items-center justify-center">
                  AO
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-heading)]">Adaeze O.</h4>
                  <span className="text-[10px] text-[var(--primary)]">Client · Active</span>
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

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                    msg.sender === "You"
                      ? "ml-auto bg-[var(--primary)] text-white font-medium"
                      : "bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] text-[var(--text-heading)]"
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`text-[9px] block text-right mt-1 ${msg.sender === "You" ? "text-white/80" : "text-[var(--text-muted)]"}`}>
                    {msg.time}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type a message to client..."
                className="flex-1 bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                className="w-9 h-9 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors"
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
