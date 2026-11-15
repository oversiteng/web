"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  canAccessAdminModule,
  AdminPolicy,
  ADMIN_DEPARTMENTS,
} from "@/lib/auth/adminPermissions";
import {
  LayoutDashboard,
  Users,
  Layers,
  FileCheck2,
  ShieldCheck,
  CreditCard,
  Settings,
  Megaphone,
  Headphones,
  UserCog,
  Bell,
  Menu,
  X,
  LogOut,
  Lock,
  ShieldAlert,
  Eye,
} from "lucide-react";

interface NavItem {
  moduleId: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey: string | null;
}

const ADMIN_NAV: NavItem[] = [
  {
    moduleId: "dashboard",
    label: "Command Overview",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    badgeKey: null,
  },
  {
    moduleId: "team",
    label: "Team & Access Control",
    href: "/admin/team",
    icon: UserCog,
    badgeKey: null,
  },
  {
    moduleId: "tasks",
    label: "Logistics & Agent Pay",
    href: "/admin/tasks",
    icon: Layers,
    badgeKey: "pendingQuotesCount",
  },
  {
    moduleId: "chat",
    label: "Task Chat & Moderation",
    href: "/admin/chat",
    icon: ShieldCheck,
    badgeKey: "pendingChatsCount",
  },
  {
    moduleId: "support",
    label: "CRS Live Support",
    href: "/admin/support",
    icon: Headphones,
    badgeKey: null,
  },
  {
    moduleId: "users",
    label: "Users & KYC Compliance",
    href: "/admin/users",
    icon: Users,
    badgeKey: "pendingKycCount",
  },
  {
    moduleId: "reports",
    label: "QA & Vault Dossiers",
    href: "/admin/reports",
    icon: FileCheck2,
    badgeKey: "pendingQaAudits",
  },
  {
    moduleId: "finance",
    label: "Revenue & Settlements",
    href: "/admin/finance",
    icon: CreditCard,
    badgeKey: "activeDisputesCount",
  },
  {
    moduleId: "communications",
    label: "Email & Content Hub",
    href: "/admin/communications",
    icon: Megaphone,
    badgeKey: null,
  },
  {
    moduleId: "settings",
    label: "Platform Settings",
    href: "/admin/settings",
    icon: Settings,
    badgeKey: null,
  },
];

function resolveModuleFromPath(pathname: string): string {
  if (pathname.startsWith("/admin/team")) return "team";
  if (pathname.startsWith("/admin/tasks")) return "tasks";
  if (pathname.startsWith("/admin/chat")) return "chat";
  if (pathname.startsWith("/admin/support")) return "support";
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/reports")) return "reports";
  if (pathname.startsWith("/admin/finance")) return "finance";
  if (pathname.startsWith("/admin/communications")) return "communications";
  if (pathname.startsWith("/admin/settings")) return "settings";
  return "dashboard";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout, setSession } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [dlpAlert, setDlpAlert] = useState<string | null>(null);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);

  const triggerDlpNotice = useCallback((reason: string) => {
    setDlpAlert(
      `Zero-Exfiltration Security Policy: ${reason} is strictly disabled for all Oversite Administrators.`
    );
  }, []);

  useEffect(() => {
    if (!dlpAlert) return;
    const t = setTimeout(() => setDlpAlert(null), 4000);
    return () => clearTimeout(t);
  }, [dlpAlert]);

  // Global keyboard DLP guard (Blocks Ctrl/Cmd + C, X, S, P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === "c" || key === "x" || key === "s" || key === "p") {
          e.preventDefault();
          e.stopPropagation();
          triggerDlpNotice(
            key === "p"
              ? "Printing screen data"
              : key === "s"
              ? "Saving or exporting pages"
              : "Copying or cutting platform data"
          );
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [triggerDlpNotice]);

  // Sync latest AdminPolicy from /api/v1/users/me
  useEffect(() => {
    async function syncAdminProfile() {
      if (!isAuthenticated) return;
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        if (!token) return;
        const res = await fetch("/api/v1/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json?.success && json?.data) {
          await setSession(json.data, token);
        }
      } catch {
        // Non-blocking
      }
    }
    syncAdminProfile();
  }, [isAuthenticated]);

  // Enforce Admin Authentication & 3-Step Onboarding Handshake
  useEffect(() => {
    if (!isLoading) {
      if (
        !isAuthenticated ||
        (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN")
      ) {
        router.replace("/admin/login");
        return;
      }

      if (user.role === "ADMIN" && user.adminPolicy) {
        if (
          user.adminPolicy.mustChangePassword ||
          user.adminPolicy.onboardingStatus !== "APPROVED"
        ) {
          router.replace("/admin/login");
        }
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    async function fetchCounts() {
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
          setQueueCounts({
            pendingQuotesCount: json.data.pendingQuotesCount || 0,
            pendingKycCount: json.data.pendingKycCount || 0,
            pendingChatsCount: json.data.pendingChatsCount || 0,
            pendingQaAudits: json.data.pendingQaAudits || 0,
            activeDisputesCount: json.data.activeDisputesCount || 0,
          });
        }
      } catch {
        // Non-blocking
      }
    }
    if (isAuthenticated) {
      fetchCounts();
    }
  }, [isAuthenticated, pathname]);

  // Intercept any attempt to click a download or external target="_blank" link inside the Admin Console
  const handleContainerClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    const anchor = target?.closest("a") as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute("href") || "";
    const isDownload = anchor.hasAttribute("download");
    const isExternalBlank =
      anchor.getAttribute("target") === "_blank" &&
      !href.startsWith("/admin");

    if (isDownload || isExternalBlank) {
      e.preventDefault();
      e.stopPropagation();
      if (href && (href.startsWith("http") || href.startsWith("/"))) {
        setPreviewMediaUrl(href);
      } else {
        triggerDlpNotice("Downloading or exporting files");
      }
    }
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-body)] flex items-center justify-center transition-colors duration-300">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return null;
  }

  const effectivePolicy: AdminPolicy =
    user?.adminPolicy ||
    (user?.role === "SUPER_ADMIN"
      ? {
          department: "EXECUTIVE",
          departmentLabel: ADMIN_DEPARTMENTS.EXECUTIVE.label,
          onboardingStatus: "APPROVED",
          mustChangePassword: false,
          canRead: true,
          canWrite: true,
          canDelete: true,
          noExportOrCopy: true,
          allowedModules: ADMIN_DEPARTMENTS.EXECUTIVE.defaultModules,
        }
      : {
          department: "ADMINISTRATIVE",
          departmentLabel: ADMIN_DEPARTMENTS.ADMINISTRATIVE.label,
          onboardingStatus: "APPROVED",
          mustChangePassword: false,
          canRead: true,
          canWrite: true,
          canDelete: false,
          noExportOrCopy: true,
          allowedModules: ADMIN_DEPARTMENTS.ADMINISTRATIVE.defaultModules,
        });

  const permittedNav = ADMIN_NAV.filter((item) =>
    canAccessAdminModule(effectivePolicy, item.moduleId, user?.role)
  );

  const currentModuleId = resolveModuleFromPath(pathname);
  const isCurrentModulePermitted = canAccessAdminModule(
    effectivePolicy,
    currentModuleId,
    user?.role
  );

  const adminName = user?.name || (user as any)?.fullName || "Platform Admin";
  const adminRoleLabel =
    user?.role === "SUPER_ADMIN"
      ? "Executive Super Admin"
      : effectivePolicy.departmentLabel;
  const totalActionNeeded = Object.values(queueCounts).reduce(
    (a, b) => a + b,
    0
  );

  return (
    <div
      className="min-h-screen bg-[var(--bg-body)] text-[var(--text-body)] font-sans flex transition-colors duration-300 select-none"
      onCopy={(e) => {
        e.preventDefault();
        triggerDlpNotice("Copying platform data");
      }}
      onCut={(e) => {
        e.preventDefault();
        triggerDlpNotice("Cutting platform data");
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        triggerDlpNotice("Right-click context menu / Save As");
      }}
      onDragStart={(e) => {
        e.preventDefault();
      }}
      onClickCapture={handleContainerClickCapture}
    >
      {/* Admin Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[var(--border-color)] bg-[var(--bg-card)] fixed inset-y-0 z-30 transition-colors duration-300">
        <div className="h-16 flex items-center justify-between px-5 border-b border-[var(--border-color)]">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <img
              src="/assets/nav-icons/logo-full.svg"
              alt="Oversite.ng Logo"
              className="h-7 w-auto"
            />
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)]">
              {user?.role === "SUPER_ADMIN" ? "Super HQ" : "Dept Admin"}
            </span>
          </Link>
        </div>

        {/* Department & CRUD Scope Pill */}
        <div className="px-3 pt-3">
          <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] truncate">
              {adminRoleLabel}
            </p>
            <div className="flex flex-wrap gap-1">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  effectivePolicy.canRead
                    ? "bg-emerald-500/15 text-emerald-500"
                    : "bg-zinc-500/10 text-zinc-400 line-through"
                }`}
              >
                READ
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  effectivePolicy.canWrite
                    ? "bg-blue-500/15 text-blue-500"
                    : "bg-zinc-500/10 text-zinc-400 line-through"
                }`}
              >
                WRITE
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  effectivePolicy.canDelete
                    ? "bg-amber-500/15 text-amber-500"
                    : "bg-zinc-500/10 text-zinc-400 line-through"
                }`}
              >
                DELETE
              </span>
              <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 text-[9px] font-bold">
                NO COPY/EXPORT
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {permittedNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" &&
                pathname.startsWith(`${item.href}/`));
            const badgeCount = item.badgeKey
              ? queueCounts[item.badgeKey] || 0
              : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold border border-[var(--primary-border)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? "text-[var(--primary)]"
                        : "text-[var(--text-muted)]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {badgeCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile & Theme Footer */}
        <div className="p-3 border-t border-[var(--border-color)] space-y-2">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] border border-[var(--primary-border)] flex items-center justify-center text-[var(--primary)] font-bold text-xs shrink-0">
              {adminName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-heading)] truncate">
                {adminName}
              </p>
              <p className="text-[10px] text-[var(--primary)] font-medium truncate">
                {adminRoleLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 px-2 py-1.5 text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
            <ThemeToggle className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-card)] flex items-center justify-center transition-colors shadow-xs cursor-pointer" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen min-w-0">
        <header className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-card)]/85 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-heading)] border border-[var(--border-color)]"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)]">
              {user?.role === "SUPER_ADMIN"
                ? "EXECUTIVE SUPER ADMIN · ALL DEPARTMENTS"
                : `DEPT: ${effectivePolicy.departmentLabel.toUpperCase()}`}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {user?.role === "SUPER_ADMIN" && (
              <Link
                href="/admin/team"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--primary)]/10 text-xs font-semibold text-[var(--primary)] border border-[var(--primary)]/20 hover:bg-[var(--primary)]/20 transition-colors"
              >
                <UserCog className="w-3.5 h-3.5" />
                <span>Manage Admins</span>
              </Link>
            )}

            {canAccessAdminModule(
              effectivePolicy,
              "support",
              user?.role
            ) && (
              <Link
                href="/admin/support"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--primary-light)] text-xs font-semibold text-[var(--text-heading)] border border-[var(--border-color)] transition-colors"
              >
                <Headphones className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>CRS Helpdesk</span>
              </Link>
            )}

            <Link
              href="/admin/dashboard"
              className="relative p-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-heading)] border border-[var(--border-color)] hover:border-[var(--primary-border)] transition-colors"
              title="Pending Action Items"
            >
              <Bell className="w-4 h-4" />
              {totalActionNeeded > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {totalActionNeeded}
                </span>
              )}
            </Link>

            <div className="lg:hidden">
              <ThemeToggle className="w-8 h-8 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] flex items-center justify-center" />
            </div>
          </div>
        </header>

        {/* Zero-Exfiltration DLP Toast Alert */}
        {dlpAlert && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{dlpAlert}</span>
            </div>
            <button
              type="button"
              onClick={() => setDlpAlert(null)}
              className="text-[11px] underline ml-4 cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-4 space-y-1">
            {permittedNav.map((item) => {
              const Icon = item.icon;
              const badgeCount = item.badgeKey
                ? queueCounts[item.badgeKey] || 0
                : 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[var(--primary)]" />
                    <span>{item.label}</span>
                  </div>
                  {badgeCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isCurrentModulePermitted ? (
            children
          ) : (
            <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-4 max-w-lg mx-auto mt-10">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[var(--text-heading)]">
                Departmental Access Restricted
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your profile is scoped to{" "}
                <strong className="text-[var(--text-heading)]">
                  {effectivePolicy.departmentLabel}
                </strong>
                . This module is outside your assigned department permissions.
                Contact the Executive Super Admin to request additional module
                access.
              </p>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--primary)] text-white text-xs font-semibold"
              >
                Return to Department Dashboard
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* In-App Non-Downloadable DLP Media & Document Viewer Modal */}
      {previewMediaUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-xs font-bold text-[var(--text-heading)]">
                  Protected In-App Evidence Viewer (Download Disabled)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMediaUrl(null)}
                className="px-3 py-1 rounded-xl bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
            <div className="p-6 bg-black/40 flex flex-col items-center justify-center min-h-[320px] max-h-[75vh] overflow-auto">
              <img
                src={previewMediaUrl}
                alt="Protected Evidence Preview"
                className="max-h-[60vh] w-auto object-contain rounded-xl pointer-events-none select-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-3 text-center">
                Zero-Exfiltration DLP Mode: External downloads and exports are
                disabled for all administrators.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
