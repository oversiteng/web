"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ADMIN_DEPARTMENTS,
  canAccessAdminModule,
} from "@/lib/auth/adminPermissions";
import {
  TrendingUp,
  Users,
  Layers,
  CreditCard,
  ShieldAlert,
  Activity,
  ArrowRight,
  MessageSquare,
  FileCheck2,
  Megaphone,
  Wallet,
  Sparkles,
  Headphones,
  UserCog,
  Building2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

interface AdminAnalyticsData {
  totalGmvNgn: number;
  totalClientRevenueNgn: number;
  totalAgentPayoutsNgn: number;
  netPlatformMarginNgn: number;
  activeGroundTasks: number;
  verifiedAgentsCount: number;
  onlineAgentsCount: number;
  pendingQaAudits: number;
  pendingQuotesCount: number;
  pendingChatsCount: number;
  pendingKycCount: number;
  activeDisputesCount: number;
  moduleUtilization: { name: string; count: number; pct: number }[];
  recentActivityStream: {
    id: string;
    time: string;
    desc: string;
    status: string;
    moduleType: string;
    clientPriceNgn: number;
    agentPayoutNgn: number;
  }[];
}

export default function AdminAnalyticsDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const policy = user?.adminPolicy;
  const deptKey = isSuperAdmin
    ? "EXECUTIVE"
    : policy?.department || "ADMINISTRATIVE";
  const deptDef = ADMIN_DEPARTMENTS[deptKey] || ADMIN_DEPARTMENTS.ADMINISTRATIVE;

  const hasAccess = (mod: string) =>
    canAccessAdminModule(policy, mod, user?.role);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/admin/analytics/overview", {
          credentials: "include",
          headers,
        });
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
      {/* Header Banner: Overall Executive vs Department-Scoped */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            {isSuperAdmin
              ? "Executive Super Admin · Overall Platform Dashboard"
              : `${deptDef.label} · Department Workspace`}
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-heading)] tracking-tight">
            {isSuperAdmin
              ? "Central Operations & Platform Backbone"
              : deptDef.label}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {deptDef.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && (
            <Link
              href="/admin/team"
              className="px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:opacity-95 transition-opacity"
            >
              <UserCog className="w-3.5 h-3.5" />
              <span>Team &amp; Access Governance</span>
            </Link>
          )}
          {hasAccess("tasks") && (
            <Link
              href="/admin/tasks"
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Logistics &amp; Agent Pay</span>
            </Link>
          )}
          {hasAccess("support") && (
            <Link
              href="/admin/support"
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <Headphones className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>CRS Live Support</span>
            </Link>
          )}
          {hasAccess("communications") && (
            <Link
              href="/admin/communications"
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <Megaphone className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Email &amp; Content Hub</span>
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <DynamicLoadingState variant="documents" count={4} />
      ) : (
        <>
          {/* Top KPI Cards — Scoped to Super Admin or Relevant Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(isSuperAdmin || hasAccess("finance")) && (
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
                <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
                  <span className="text-xs font-medium">
                    Gross Client Revenue
                  </span>
                  <CreditCard className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div className="text-2xl font-bold text-[var(--text-heading)]">
                  {formatCurrency(analytics?.totalClientRevenueNgn || 0)}
                </div>
                <p className="text-[11px] text-[var(--primary)] mt-1 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3 h-3" /> Paid by End Users to
                  Oversite
                </p>
              </div>
            )}

            {(isSuperAdmin || hasAccess("finance") || hasAccess("tasks")) && (
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
                <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
                  <span className="text-xs font-medium">
                    Agent Task Pay &amp; Margin
                  </span>
                  <Wallet className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-bold text-[var(--text-heading)]">
                  {formatCurrency(analytics?.netPlatformMarginNgn || 0)}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  Agent Credits:{" "}
                  <span className="font-semibold text-[var(--text-heading)]">
                    {formatCurrency(analytics?.totalAgentPayoutsNgn || 0)}
                  </span>
                </p>
              </div>
            )}

            {(isSuperAdmin || hasAccess("tasks") || hasAccess("reports")) && (
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
                <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
                  <span className="text-xs font-medium">
                    Active Ground Missions
                  </span>
                  <Layers className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-[var(--text-heading)]">
                  {analytics?.activeGroundTasks || 0}
                </div>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
                  In queue, route, or on-site execution
                </p>
              </div>
            )}

            {(isSuperAdmin ||
              hasAccess("users") ||
              hasAccess("support") ||
              hasAccess("chat")) && (
              <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs">
                <div className="flex items-center justify-between text-[var(--text-muted)] mb-2">
                  <span className="text-xs font-medium">
                    Verified Field Operatives
                  </span>
                  <Users className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-[var(--text-heading)]">
                  {analytics?.verifiedAgentsCount || 0}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {analytics?.onlineAgentsCount || 0} online
                  </span>{" "}
                  &amp; ready for dispatch
                </p>
              </div>
            )}
          </div>

          {/* Actionable Departmental Backbone Queues */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {hasAccess("tasks") && (
              <Link
                href="/admin/tasks"
                className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary-border)] transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Logistics &amp; Agent Pay Desk
                  </p>
                  <p className="text-lg font-bold text-[var(--text-heading)] mt-0.5">
                    {analytics?.pendingQuotesCount || 0} Pending Quotes
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
              </Link>
            )}

            {hasAccess("chat") && (
              <Link
                href="/admin/chat"
                className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary-border)] transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Administrative Chat &amp; Milestones
                  </p>
                  <p className="text-lg font-bold text-[var(--text-heading)] mt-0.5">
                    {analytics?.pendingChatsCount || 0} In Firewall
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </Link>
            )}

            {hasAccess("support") && (
              <Link
                href="/admin/support"
                className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary-border)] transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    CRS / CCR Support Helpdesk
                  </p>
                  <p className="text-lg font-bold text-[var(--text-heading)] mt-0.5">
                    Live Support &amp; FAQs
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <Headphones className="w-4 h-4" />
                </div>
              </Link>
            )}

            {hasAccess("reports") && (
              <Link
                href="/admin/reports"
                className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary-border)] transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    QA Dossier Compilation
                  </p>
                  <p className="text-lg font-bold text-[var(--text-heading)] mt-0.5">
                    {analytics?.pendingQaAudits || 0} Awaiting Audit
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <FileCheck2 className="w-4 h-4" />
                </div>
              </Link>
            )}

            {hasAccess("users") && (
              <Link
                href="/admin/users"
                className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary-border)] transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Fraud, Regulator &amp; KYC
                  </p>
                  <p className="text-lg font-bold text-[var(--text-heading)] mt-0.5">
                    {analytics?.pendingKycCount || 0} Unverified Profiles
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </Link>
            )}

            {hasAccess("communications") && (
              <Link
                href="/admin/communications"
                className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary-border)] transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Email &amp; Content Manager
                  </p>
                  <p className="text-lg font-bold text-[var(--text-heading)] mt-0.5">
                    Broadcasts &amp; Mailer
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <Megaphone className="w-4 h-4" />
                </div>
              </Link>
            )}
          </div>

          {/* System Dispatch Status & Module Utilization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--text-heading)] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--primary)]" />
                  Live Mission &amp; Dual-Price Stream
                </h2>
                {hasAccess("tasks") && (
                  <Link
                    href="/admin/tasks"
                    className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
                  >
                    <span>All Tasks</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>

              {!analytics?.recentActivityStream ||
              analytics.recentActivityStream.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                  No recent mission activity. Live events will appear here as
                  tasks are booked.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {analytics.recentActivityStream.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] gap-2 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[var(--text-muted)] font-mono text-[11px] shrink-0">
                          {ev.time}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[var(--bg-card)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                          {ev.moduleType}
                        </span>
                        <span className="font-semibold text-[var(--text-heading)] truncate">
                          {ev.desc}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        {(isSuperAdmin ||
                          hasAccess("tasks") ||
                          hasAccess("finance")) && (
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Client:{" "}
                            <strong className="text-[var(--text-heading)]">
                              {formatCurrency(ev.clientPriceNgn)}
                            </strong>{" "}
                            · Agent Pay:{" "}
                            <strong className="text-[var(--primary)]">
                              {formatCurrency(ev.agentPayoutNgn)}
                            </strong>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] font-mono text-[10px] font-semibold">
                          {ev.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-4 shadow-xs">
              <h2 className="text-base font-semibold text-[var(--text-heading)]">
                Service Module Utilization
              </h2>

              {!analytics?.moduleUtilization ||
              analytics.moduleUtilization.length === 0 ? (
                <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                  No module breakdown available yet.
                </div>
              ) : (
                <div className="space-y-3.5 text-xs">
                  {analytics.moduleUtilization.map((mod, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-[var(--text-muted)]">
                        <span className="font-medium text-[var(--text-heading)]">
                          {mod.name}
                        </span>
                        <span className="font-semibold text-[var(--primary)]">
                          {mod.pct}% ({mod.count})
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border-color)]">
                        <div
                          className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(4, mod.pct))}%`,
                          }}
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
