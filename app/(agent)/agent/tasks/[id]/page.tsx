"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  Navigation,
  Upload,
  ShieldCheck,
  AlertCircle,
  MessageSquare,
  X,
  Send,
  Check,
  ChevronRight,
  FileCheck,
} from "lucide-react";

export default function AgentTaskExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
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
        (pos) => {
          setIsGettingLocation(false);
          setLocationVerified(true);
          showToast("GPS verified! You are 0.02 km from 4 Bourdillon Close.");
          setTimeout(() => {
            setCurrentStep(2);
          }, 900);
        },
        () => {
          // Fallback simulation for dev/desktop without GPS sensor
          setTimeout(() => {
            setIsGettingLocation(false);
            setLocationVerified(true);
            showToast("GPS arrival verified (Mock Geofence match: 6.4541° N, 3.4246° E)");
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
    <div className="space-y-4 max-w-full pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header matching Screenshot 5 */}
      <div className="flex items-center justify-between pt-1">
        <Link
          href="/agent/tasks"
          className="w-9 h-9 rounded-full bg-[#121c16] border border-[#1b2b20] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-sm font-semibold text-slate-200 truncate max-w-[240px] sm:max-w-md">
          CAC certified copy retrieval
        </h1>
        <div className="w-9" /> {/* Spacer */}
      </div>

      {/* STEP INDICATOR matching Screenshot 5 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            {currentStep === 1 && "Confirm you have arrived"}
            {currentStep === 2 && "Capture required evidence"}
            {currentStep === 3 && "Review & finalize report"}
            {currentStep === 4 && "Assignment complete"}
          </h2>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            STEP {currentStep}/4
          </span>
        </div>

        {/* 4 Segmented Progress Bar */}
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((stepNum) => (
            <div
              key={stepNum}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                stepNum <= currentStep ? "bg-[#10b981]" : "bg-[#18291e]"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Assignment Subheader matching Screenshot 5 */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">Ikoyi site visit</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            4 Bourdillon Close, ikeja, Lagos.
          </p>
        </div>
        <div className="bg-[#291d12] border border-amber-800/40 text-amber-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shrink-0">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>2h left</span>
        </div>
      </div>

      {/* STEP 1: CONFIRM ARRIVAL (MATCHING SCREENSHOT 5 EXACTLY) */}
      {currentStep === 1 && (
        <div className="space-y-4">
          {/* Detailed Map Preview matching Screenshot 5 */}
          <div className="relative rounded-3xl overflow-hidden border border-[#1b2b20] bg-[#0f1b13] h-48 sm:h-56">
            {/* Map styling with street grids */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage:
                  "radial-gradient(#1f3827 2px, transparent 2px), radial-gradient(#15261b 2px, transparent 2px)",
                backgroundSize: "24px 24px",
                backgroundPosition: "0 0, 12px 12px",
                backgroundColor: "#0d1a12",
              }}
            >
              {/* SVG Map roads representing Falomo / Ikoyi / Bourdillon */}
              <svg className="w-full h-full opacity-60" viewBox="0 0 500 240">
                {/* Major streets */}
                <path d="M0,60 Q200,90 500,40" stroke="#10b981" strokeWidth="5" fill="none" />
                <text x="240" y="55" fill="#a7f3d0" fontSize="10" fontWeight="bold">Bourdillon Rd</text>

                <path d="M80,240 Q180,140 400,0" stroke="#34d399" strokeWidth="4" fill="none" />
                <text x="180" y="160" fill="#a7f3d0" fontSize="10" fontWeight="bold">Alfred Rewane Rd</text>

                <path d="M0,170 Q250,190 500,160" stroke="#22543d" strokeWidth="4" fill="none" />
                <text x="320" y="180" fill="#6ee7b7" fontSize="9">Thompson Ave</text>

                <path d="M280,0 L320,240" stroke="#22543d" strokeWidth="3" fill="none" />
                <text x="325" y="110" fill="#6ee7b7" fontSize="9">Glover Rd</text>

                {/* Target beacon highlight */}
                <circle cx="250" cy="110" r="32" fill="#10b981" fillOpacity="0.2" className="animate-ping" />
                <circle cx="250" cy="110" r="14" fill="#10b981" fillOpacity="0.4" />
              </svg>
            </div>

            {/* Target Location Pin */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-9 h-9 rounded-full bg-rose-500 shadow-xl shadow-rose-500/50 flex items-center justify-center text-white border-2 border-white animate-bounce">
                <MapPin className="w-5 h-5 fill-white" />
              </div>
              <span className="text-[10px] font-extrabold bg-slate-950/90 text-white px-2.5 py-1 rounded-full mt-1 border border-emerald-500/30">
                4 Bourdillon Close
              </span>
            </div>
          </div>

          {/* High-Contrast White Card matching Screenshot 5 */}
          <div className="bg-white text-slate-900 rounded-3xl p-5 sm:p-6 shadow-md space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">Payout</span>
              <span className="text-base font-extrabold text-slate-950">₦7,700</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">Client</span>
              <span className="text-xs font-bold text-slate-900">Adaeze O.</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">Evidence required</span>
              <span className="text-xs font-bold text-slate-900">Scan + 2 photos</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-semibold block mb-1">Instructions</span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Photo taken should includes the front view, back view, driver&apos;s way, west fence, north fence, and side gate.
              </p>
            </div>
          </div>

          {/* Bottom Action Bar matching Screenshot 5 */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowMessageModal(true)}
              className="bg-[#121c16] hover:bg-[#1a2920] border border-[#233529] text-slate-300 hover:text-white font-semibold text-xs px-5 py-3.5 rounded-2xl flex items-center gap-2 cursor-pointer transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Message</span>
            </button>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isGettingLocation}
              className="flex-1 bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-sm py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md disabled:opacity-50"
            >
              <Navigation className={`w-4 h-4 ${isGettingLocation ? "animate-spin" : ""}`} />
              <span>{isGettingLocation ? "Verifying GPS..." : "Get my location"}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PHOTO CAPTURE & EVIDENCE */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="bg-[#121c16] border border-[#1b2b20] rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400" />
                Required On-Site Evidence (6 Points)
              </h4>
              <span className="text-xs text-emerald-400 font-bold">
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
                    className="relative rounded-2xl border border-[#1b2b20] bg-[#16251c] h-32 flex flex-col items-center justify-center overflow-hidden cursor-pointer group hover:border-emerald-500/50 transition-all"
                  >
                    {photoUrl ? (
                      <>
                        <img
                          src={photoUrl}
                          alt={label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-2">
                          <span className="bg-emerald-500 text-black text-[9px] font-extrabold px-2 py-0.5 rounded-full self-start">
                            Captured
                          </span>
                          <span className="text-white text-[11px] font-bold truncate">
                            {label}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 p-3 text-center">
                        <Camera className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                        <span className="text-xs font-semibold text-slate-300">{label}</span>
                        <span className="text-[10px] text-emerald-400 font-medium">Tap to snap</span>
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
              className="bg-[#141e18] hover:bg-[#1a2820] text-slate-300 border border-[#233529] px-5 py-3 rounded-2xl text-xs font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="flex-1 bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-sm py-3.5 rounded-2xl transition-colors shadow-md text-center"
            >
              Continue to Review
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & FINALIZE REPORT */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="bg-[#121c16] border border-[#1b2b20] rounded-3xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Finalize Inspection Report
            </h4>

            <div className="bg-[#16251c] rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Location Verified</span>
                <span className="text-emerald-400 font-bold">✓ 4 Bourdillon Close, Lagos</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Evidence Attached</span>
                <span className="text-emerald-400 font-bold">✓ {Object.keys(capturedPhotos).length} Geo-tagged photos</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Direct Payout Credit</span>
                <span className="text-white font-extrabold">₦7,700</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Agent Findings & Observation Notes
              </label>
              <textarea
                value={agentNotes}
                onChange={(e) => setAgentNotes(e.target.value)}
                placeholder="e.g. Property boundary intact, side gate accessible, electricity meter confirmed..."
                rows={4}
                className="w-full bg-[#16251c] border border-[#203427] rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="bg-[#141e18] hover:bg-[#1a2820] text-slate-300 border border-[#233529] px-5 py-3 rounded-2xl text-xs font-semibold"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                showToast("Submitting inspection report...");
                setTimeout(() => setCurrentStep(4), 800);
              }}
              className="flex-1 bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-sm py-3.5 rounded-2xl transition-colors shadow-md text-center"
            >
              Submit Final Report
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: SUBMISSION COMPLETE */}
      {currentStep === 4 && (
        <div className="bg-[#121c16] border border-[#1b2b20] rounded-3xl p-6 text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-[#10b981] flex items-center justify-center text-[#062414] mx-auto shadow-xl shadow-emerald-500/20">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white">Report Submitted!</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your field verification for <span className="font-semibold text-white">Ikoyi site visit</span> has been submitted to Adaeze O.
            </p>
          </div>

          <div className="bg-[#16251c] border border-[#203427] rounded-2xl p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Payout Status</span>
              <span className="text-emerald-400 font-bold">Credited to Pending Clearance</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Amount</span>
              <span className="text-white font-extrabold text-sm">₦7,700</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              href="/agent/dashboard"
              className="block w-full bg-[#10b981] hover:bg-[#059669] text-black font-extrabold text-sm py-3.5 rounded-2xl transition-colors shadow-md"
            >
              Return to Dashboard
            </Link>
            <Link
              href="/agent/queue"
              className="block w-full bg-[#16221a] hover:bg-[#1e2e23] text-slate-300 border border-[#233529] font-semibold text-xs py-2.5 rounded-2xl transition-colors"
            >
              Find More Tasks in Queue
            </Link>
          </div>
        </div>
      )}

      {/* Client Chat Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0c1410] border border-[#1b2b20] rounded-3xl p-5 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#1b2b20]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                  AO
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Adaeze O.</h4>
                  <span className="text-[10px] text-emerald-400">Client · Active</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMessageModal(false)}
                className="text-slate-400 hover:text-white"
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
                      ? "ml-auto bg-emerald-500 text-slate-950 font-medium"
                      : "bg-[#16251c] text-slate-200"
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`text-[9px] block text-right mt-1 ${msg.sender === "You" ? "text-slate-900" : "text-slate-500"}`}>
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
                className="flex-1 bg-[#16251c] border border-[#203427] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center hover:bg-emerald-400 cursor-pointer shrink-0"
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
