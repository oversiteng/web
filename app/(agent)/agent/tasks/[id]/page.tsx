"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Camera,
  CheckCircle2,
  Navigation,
  Upload,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Task } from "@/lib/types/task";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

export default function AgentTaskExecutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const taskId = resolvedParams.id;

  const [task, setTask] = useState<Task | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>("AGENT_EN_ROUTE");
  const [summary, setSummary] = useState("");
  const [findings, setFindings] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadTask() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`/api/v1/tasks/${taskId}`, { credentials: "include", headers });
        const json = await res.json();
        if (json.success && json.data) {
          setTask(json.data);
          setCurrentStatus(json.data.status);
        }
      } catch (err) {
        console.error("Failed to load task:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTask();
  }, [taskId]);

  const handleUpdateStatus = async (newStatus: string) => {
    setCurrentStatus(newStatus);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/tasks/${taskId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`Status updated to ${newStatus.replace(/_/g, " ")}`);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      showToast("Please enter an executive summary of your field audit.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/reports/submit", {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          taskId,
          summary,
          findings: findings || summary,
          completionPct: 100,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast("Report submitted successfully for admin QA audit!");
        setCurrentStatus("REPORT_SUBMITTED");
        setTimeout(() => {
          router.push("/agent/tasks");
        }, 1500);
      } else {
        showToast(json.error?.message || "Failed to submit report");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <DynamicLoadingState variant="documents" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      <Link
        href="/agent/tasks"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Active Tasks</span>
      </Link>

      <div className="border-b border-slate-800 pb-4">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
          Mission Console • #{taskId.slice(0, 8)}
        </span>
        <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
          {task?.title || "Field Operation"}
        </h1>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-500" />
          {task?.property?.address || "On-site Assignment"}
        </p>
      </div>

      {/* Live Status Control Panel */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white">Broadcast Status to Client</h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleUpdateStatus("AGENT_EN_ROUTE")}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              currentStatus === "AGENT_EN_ROUTE"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>En Route</span>
          </button>
          <button
            type="button"
            onClick={() => handleUpdateStatus("AGENT_ON_SITE")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              currentStatus === "AGENT_ON_SITE"
                ? "bg-emerald-500 text-slate-950 shadow-xs"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>On Site</span>
          </button>
          <button
            type="button"
            onClick={() => handleUpdateStatus("IN_PROGRESS")}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              currentStatus === "IN_PROGRESS"
                ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>In Progress</span>
          </button>
        </div>
      </div>

      {/* Evidence & Report Submission Form */}
      <form
        onSubmit={handleSubmitReport}
        className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
      >
        <h3 className="text-sm font-semibold text-white">Submit Field Verification Report</h3>
        <p className="text-xs text-slate-400">
          Upload geotagged evidence. Coordinates and timestamp will be embedded with an official cryptographic watermark.
        </p>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Agent Executive Summary</label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summarize actions taken, parties met, and conditions on the ground..."
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Detailed Findings & Measurements</label>
          <textarea
            rows={3}
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            placeholder="Boundary integrity, beacon numbers, foundation observations..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>{isSubmitting ? "Submitting..." : "Generate Watermarked Report & Request Secured Payment Release"}</span>
        </button>
      </form>
    </div>
  );
}
