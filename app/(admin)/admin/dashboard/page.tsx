"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  Layers,
  CreditCard,
  ShieldAlert,
  Clock,
  Activity,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

interface AdminAnalyticsData {
  totalGmvNgn: number;
  activeGroundTasks: number;
  verifiedAgentsCount: number;
  onlineAgentsCount: number;
  pendingQaAudits: number;
  moduleUtilization: { name: string; count: number; pct: number }[];
  recentActivityStream: { time: string; desc: string; status: string }[];
}

export default function AdminAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/admin/analytics/overview", { credentials: "include", headers });
        const json = await res.json();
        if (json.success && json.data) {
          setAnalytics(json.data);
        }
      } catch (err) {
        console.error("Failed to load admin analytics:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Control & Operations Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">
          High-level overview of active field assignments, secured payment liquidity, agent availability, and KYC pipelines.
        </p>
      </div>

      {isLoading ? (
        <DynamicLoadingState variant="documents" count={4} />
      ) : (
        <>
          {/* KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Platform GMV (Settled & Secured)</span>
                <CreditCard className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(analytics?.totalGmvNgn || 0)}
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Live Transaction Volume
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Active Ground Tasks</span>
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {analytics?.activeGroundTasks || 0}
              </div>
              <p className="text-[11px] text-blue-400 mt-1">In dispatch, route, or on-site</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Verified Field Operatives</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {analytics?.verifiedAgentsCount || 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {analytics?.onlineAgentsCount || 0} currently online & available
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Pending QA Audits</span>
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-2xl font-bold text-white">
                {analytics?.pendingQaAudits || 0}
              </div>
              <p className="text-[11px] text-red-400 mt-1">Requires admin certification</p>
            </div>
          </div>

          {/* System Dispatch Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Live Dispatch & Operation Stream
              </h2>

              {!analytics?.recentActivityStream || analytics.recentActivityStream.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No recent dispatch activity. Live events will appear here as field missions start.
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.recentActivityStream.map((ev, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-mono text-[11px]">{ev.time}</span>
                        <span className="text-slate-200">{ev.desc}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {ev.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h2 className="text-base font-semibold text-white">Module Utilization</h2>

              {!analytics?.moduleUtilization || analytics.moduleUtilization.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No module breakdown available yet.
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  {analytics.moduleUtilization.map((mod, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-slate-300">
                        <span>{mod.name}</span>
                        <span className="font-semibold text-white">{mod.pct}% ({mod.count})</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(3, mod.pct))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
