"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Loader2,
  ShieldCheck,
  Building2,
  Clock,
} from "lucide-react";

interface DossierData {
  id: string;
  taskId: string;
  riskRating: string | null;
  findings: Record<string, any> | null;
  dossierUrl: string;
  confidentialityNotice: string;
}

interface TaskData {
  id: string;
  title: string;
  locationAddress: string | null;
  status: string;
  createdAt: string;
}

export default function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string>("");
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    async function loadDossier() {
      try {
        setLoading(true);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Fetch dossier
        const [dossierRes, taskRes] = await Promise.all([
          fetch(`/api/v1/diligence/${id}/dossier`, { credentials: "include", headers }),
          fetch(`/api/v1/tasks/${id}`, { credentials: "include", headers }),
        ]);

        if (dossierRes.ok) {
          const dossierJson = await dossierRes.json();
          if (dossierJson.success && dossierJson.data) {
            setDossier(dossierJson.data);
          }
        }

        if (taskRes.ok) {
          const taskJson = await taskRes.json();
          if (taskJson.success && taskJson.data) {
            setTask(taskJson.data);
          }
        }

        if (!dossierRes.ok && !taskRes.ok) {
          setError("Investigation dossier not found or not yet accessible.");
        }
      } catch (err) {
        setError("Unable to load investigation dossier. Please check your connection.");
      } finally {
        setLoading(false);
      }
    }

    loadDossier();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-slate-400">Loading confidential investigation dossier...</p>
      </div>
    );
  }

  const riskRating = dossier?.riskRating || "UNDER_EVALUATION";
  const findings = dossier?.findings || {};
  const checksList: Array<{ label: string; status: string; details: string }> = Array.isArray(findings.checks)
    ? findings.checks
    : Object.entries(findings).map(([key, val]) => ({
        label: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
        status: typeof val === "object" && val?.status ? String(val.status) : "RECORDED",
        details: typeof val === "object" && val?.details ? String(val.details) : typeof val === "string" ? val : JSON.stringify(val),
      }));

  const getRiskBadge = (tier: string) => {
    switch (tier.toUpperCase()) {
      case "LOW":
        return {
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          text: "LOW RISK (Recommended with standard safeguards)",
        };
      case "MEDIUM":
        return {
          color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
          text: "MODERATE RISK (Caution advised, covenants required)",
        };
      case "HIGH":
      case "CRITICAL":
        return {
          color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
          text: "HIGH RISK / VULNERABILITY DETECTED",
        };
      default:
        return {
          color: "text-purple-400 bg-purple-500/10 border-purple-500/20",
          text: "IN PROGRESS (Field evidence compilation ongoing)",
        };
    }
  };

  const riskInfo = getRiskBadge(riskRating);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <Link
        href="/diligence"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Due Diligence</span>
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
            Confidential Investigation Dossier • #{id.slice(0, 8)}
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-0.5">
            {task?.title || "Property / Corporate Due Diligence"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {task?.locationAddress ? `Verified Address: ${task.locationAddress}` : "Registry & Physical Verification Investigation"}
          </p>
        </div>

        {dossier?.dossierUrl && (
          <a
            href={dossier.dossierUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Sealed PDF Dossier</span>
          </a>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Risk Score Summary */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 font-medium">Assessed Vulnerability & Risk Tier</span>
          <div className="text-xl sm:text-2xl font-bold mt-1 text-white">
            <span className={`px-2.5 py-1 rounded-lg text-sm border ${riskInfo.color}`}>
              {riskRating}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{riskInfo.text}</p>
        </div>
        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border ${riskInfo.color}`}>
          {riskRating === "LOW" ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : riskRating === "UNDER_EVALUATION" ? (
            <Clock className="w-8 h-8" />
          ) : (
            <ShieldCheck className="w-8 h-8" />
          )}
        </div>
      </div>

      {/* Investigation Check Matrix */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
          Audited Registry & Verification Points
        </h2>

        {checksList.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/40 border border-slate-800 text-center">
            <Building2 className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-slate-300">Evidence Verification in Progress</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Field operatives and accredited legal counsel are completing CAC registry searches, tax compliance audits, and physical land registry verifications.
            </p>
          </div>
        ) : (
          checksList.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-4"
            >
              <div>
                <h4 className="text-sm font-medium text-white">{item.label}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{item.details}</p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {item.status}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Confidentiality Notice */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-500 leading-relaxed">
        {dossier?.confidentialityNotice ||
          "This document is privileged and strictly confidential to the commissioning client. Unauthorized duplication, dissemination, or distribution is prohibited under Nigerian data protection and commercial privacy laws."}
      </div>
    </div>
  );
}
