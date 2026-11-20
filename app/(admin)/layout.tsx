"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  canAccessAdminModule,
  AdminPolicy,
  ADMIN_DEPARTMENTS,
} from "@/lib/auth/adminPermissions";
import {
  LayoutDashboard,
  Building2,
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
  ChevronDown,
  PanelLeft,
} from "lucide-react";

interface NavItem {
  moduleId: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey: string | null;
  section: "MAIN" | "OPERATIONS" | "SYSTEM";
}

const ADMIN_NAV: NavItem[] = [
  {
    moduleId: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    badgeKey: null,
    section: "MAIN",
  },
  {
    moduleId: "tasks",
    label: "Properties Listings",
    href: "/admin/properties",
    icon: Building2,
    badgeKey: null,
    section: "MAIN",
  },
  {
    moduleId: "tasks",
    label: "Tasks & Agent Pay",
    href: "/admin/tasks",
    icon: Layers,
    badgeKey: "pendingQuotesCount",
    section: "MAIN",
  },
  {
    moduleId: "users",
    label: "Users & KYC",
    href: "/admin/users",
    icon: Users,
    badgeKey: "pendingKycCount",
    section: "MAIN",
  },
  {
    moduleId: "chat",
    label: "Inbox & Moderation",
    href: "/admin/chat",
    icon: ShieldCheck,
    badgeKey: "pendingChatsCount",
    section: "MAIN",
  },
  {
    moduleId: "reports",
    label: "QA & Dossiers",
    href: "/admin/reports",
    icon: FileCheck2,
    badgeKey: "pendingQaAudits",
    section: "OPERATIONS",
  },
  {
    moduleId: "finance",
    label: "Revenue & Payouts",
    href: "/admin/finance",
    icon: CreditCard,
    badgeKey: "activeDisputesCount",
    section: "OPERATIONS",
  },
  {
    moduleId: "communications",
    label: "Broadcasts & Mail",
    href: "/admin/communications",
    icon: Megaphone,
    badgeKey: null,
    section: "OPERATIONS",
  },
  {
    moduleId: "team",
    label: "Team & Access",
    href: "/admin/team",
    icon: UserCog,
    badgeKey: null,
    section: "SYSTEM",
  },
  {
    moduleId: "support",
    label: "CRS Support",
    href: "/admin/support",
    icon: Headphones,
    badgeKey: null,
    section: "SYSTEM",
  },
  {
    moduleId: "settings",
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
    badgeKey: null,
    section: "SYSTEM",
  },
];

function resolveModuleFromPath(pathname: string): string {
  if (pathname.startsWith("/admin/team")) return "team";
  if (pathname.startsWith("/admin/properties")) return "tasks";
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

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/admin/team")) return "Team & Access Control";
  if (pathname.startsWith("/admin/tasks")) return "Tasks & Agent Pay";
  if (pathname.startsWith("/admin/chat")) return "Inbox & Moderation";
  if (pathname.startsWith("/admin/support")) return "CRS Support Helpdesk";
  if (pathname.startsWith("/admin/users")) return "Users & KYC";
  if (pathname.startsWith("/admin/reports")) return "QA & Dossiers";
  if (pathname.startsWith("/admin/finance")) return "Revenue & Payouts";
  if (pathname.startsWith("/admin/communications")) return "Broadcasts & Mail";
  if (pathname.startsWith("/admin/settings")) return "Settings";
  return "Dashboard";
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [queueCounts, setQueueCounts] = useState<Record<string, number>>({});
  const [dlpAlert, setDlpAlert] = useState<string | null>(null);
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const triggerDlpNotice = useCallback((reason: string) => {
    setDlpAlert(
      `Security Policy: ${reason} is disabled across Oversite Admin terminals.`
    );
  }, []);

  useEffect(() => {
    if (!dlpAlert) return;
    const t = setTimeout(() => setDlpAlert(null), 3500);
    return () => clearTimeout(t);
  }, [dlpAlert]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

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

  // Intercept external/download link clicks into Protected In-App Viewer
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
      <div className="min-h-screen bg-[var(--bg-body)] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
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

  const mainNav = permittedNav.filter((i) => i.section === "MAIN");
  const opsNav = permittedNav.filter((i) => i.section === "OPERATIONS");
  const systemNav = permittedNav.filter((i) => i.section === "SYSTEM");

  const currentModuleId = resolveModuleFromPath(pathname);
  const isCurrentModulePermitted = canAccessAdminModule(
    effectivePolicy,
    currentModuleId,
    user?.role
  );

  const adminName = user?.name || (user as any)?.fullName || "Platform Admin";
  const adminInitial = adminName.trim().charAt(0).toUpperCase() || "A";
  const adminRoleLabel =
    user?.role === "SUPER_ADMIN"
      ? "Super Admin"
      : effectivePolicy.departmentLabel;
  const totalActionNeeded = Object.values(queueCounts).reduce(
    (a, b) => a + b,
    0
  );

  const renderNavSection = (
    title: string,
    items: NavItem[],
    onSelect?: () => void
  ) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {title}
        </p>
        {items.map((item) => {
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
              onClick={onSelect}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                isActive
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-white" : "text-[var(--text-muted)]"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {badgeCount > 0 && (
                <span
                  className={`ml-2 min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full flex items-center justify-center ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[var(--primary)] text-white"
                  }`}
                >
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="admin-console-root min-h-screen bg-[var(--bg-body)] text-[var(--text-body)] font-sans flex transition-colors duration-200 select-none"
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
        triggerDlpNotice("Right-click context menu");
      }}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={handleContainerClickCapture}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-[var(--border-color)] bg-[var(--bg-card)] fixed inset-y-0 z-30">
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-color)]">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <img
              src="/assets/nav-icons/logo-full.svg"
              alt="Oversite"
              className="h-6 w-auto"
            />
          </Link>
          <span
            className="text-[var(--text-muted)]"
            title={adminRoleLabel}
          >
            <PanelLeft className="w-4 h-4" />
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {renderNavSection("Main Menu", mainNav)}
          {renderNavSection("Operations", opsNav)}
          {renderNavSection("Governance & Support", systemNav)}
        </nav>

        {/* Bottom Log out */}
        <div className="p-3 border-t border-[var(--border-color)]">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[82vw] bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col h-full z-10 shadow-2xl">
            <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border-color)]">
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2"
              >
                <img
                  src="/assets/nav-icons/logo-full.svg"
                  alt="Oversite"
                  className="h-6 w-auto"
                />
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md border border-[var(--border-color)] text-[var(--text-heading)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
              {renderNavSection("Main Menu", mainNav, () =>
                setMobileMenuOpen(false)
              )}
              {renderNavSection("Operations", opsNav, () =>
                setMobileMenuOpen(false)
              )}
              {renderNavSection("Governance & Support", systemNav, () =>
                setMobileMenuOpen(false)
              )}
            </nav>

            <div className="p-3 border-t border-[var(--border-color)]">
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-[var(--text-muted)] hover:text-red-500 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col lg:pl-60 min-h-screen min-w-0">
        {/* Clean Top Header */}
        <header className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-card)] sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-md border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <h2 className="text-sm sm:text-base font-semibold text-[var(--text-heading)]">
              {getPageTitle(pathname)}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle className="w-8 h-8 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] hover:border-[var(--primary)] flex items-center justify-center transition-colors cursor-pointer" />

            <Link
              href="/admin/chat"
              className="relative w-8 h-8 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] hover:border-[var(--primary)] flex items-center justify-center transition-colors"
              title="Pending Action Items"
            >
              <Bell className="w-4 h-4" />
              {totalActionNeeded > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--primary)] text-white text-[9.5px] font-bold flex items-center justify-center">
                  {totalActionNeeded}
                </span>
              )}
            </Link>

            {/* Profile Dropdown Pill */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center">
                  {adminInitial}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl p-2 z-40">
                  <div className="px-3 py-2.5 border-b border-[var(--border-color)] space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {adminInitial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-heading)] truncate">
                          {adminName}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] truncate">
                          {adminRoleLabel}
                        </p>
                      </div>
                    </div>

                    {/* Department & CRUD Privilege Pills */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          effectivePolicy.canRead
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-zinc-500/10 text-zinc-400 line-through"
                        }`}
                      >
                        READ
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          effectivePolicy.canWrite
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-zinc-500/10 text-zinc-400 line-through"
                        }`}
                      >
                        WRITE
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          effectivePolicy.canDelete
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-zinc-500/10 text-zinc-400 line-through"
                        }`}
                      >
                        DELETE
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[9px] font-semibold">
                        NO EXPORT
                      </span>
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    {canAccessAdminModule(
                      effectivePolicy,
                      "tasks",
                      user?.role
                    ) && (
                      <Link
                        href="/admin/tasks"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                      >
                        <Layers className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Tasks &amp; Agent Pay</span>
                      </Link>
                    )}
                    {canAccessAdminModule(
                      effectivePolicy,
                      "chat",
                      user?.role
                    ) && (
                      <Link
                        href="/admin/chat"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-md text-xs text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                      >
                        <span className="flex items-center gap-2.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          <span>Inbox &amp; Moderation</span>
                        </span>
                        {(queueCounts.pendingChatsCount || 0) > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white text-[9.5px] font-bold">
                            {queueCounts.pendingChatsCount}
                          </span>
                        )}
                      </Link>
                    )}
                    {user?.role === "SUPER_ADMIN" && (
                      <Link
                        href="/admin/team"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                      >
                        <UserCog className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Team &amp; Access Control</span>
                      </Link>
                    )}
                    {canAccessAdminModule(
                      effectivePolicy,
                      "settings",
                      user?.role
                    ) && (
                      <Link
                        href="/admin/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                      >
                        <Settings className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        <span>Settings</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-[var(--border-color)]">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-red-500 hover:bg-red-500/10 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Zero-Exfiltration DLP Toast Alert */}
        {dlpAlert && (
          <div className="mx-4 sm:mx-6 mt-3 px-3.5 py-2.5 rounded-md bg-red-500/10 border border-red-500/25 text-red-500 text-xs font-semibold flex items-center justify-between">
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

        <main
          className={
            pathname?.startsWith("/admin/chat")
              ? "flex-1 w-full p-0"
              : "flex-1 p-4 sm:p-6 pb-24 sm:pb-28 max-w-7xl w-full mx-auto"
          }
        >
          {isCurrentModulePermitted ? (
            children
          ) : (
            <div className="p-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-4 max-w-lg mx-auto mt-10">
              <div className="w-11 h-11 rounded-md bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[var(--text-heading)]">
                Departmental Access Restricted
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Your profile is scoped to{" "}
                <strong className="text-[var(--text-heading)]">
                  {effectivePolicy.departmentLabel}
                </strong>
                . Contact the Super Admin to request access to this module.
              </p>
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-white text-xs font-semibold"
              >
                Return to Dashboard
              </Link>
            </div>
          )}
        </main>
      </div>

      {/* In-App Non-Downloadable DLP Media & Document Viewer Modal */}
      {previewMediaUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-xs font-semibold text-[var(--text-heading)]">
                  Protected In-App Viewer (Download Disabled)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMediaUrl(null)}
                className="px-3 py-1 rounded-md bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-5 bg-black/40 flex flex-col items-center justify-center min-h-[320px] max-h-[75vh] overflow-auto">
              {/\.pdf($|\?)/i.test(previewMediaUrl) ? (
                <iframe
                  src={`${previewMediaUrl}#toolbar=0&navpanes=0`}
                  title="Protected PDF Preview"
                  className="w-full h-[65vh] rounded-md border border-[var(--border-color)] bg-white"
                />
              ) : /\.(mp4|webm|mov|ogg)($|\?)/i.test(previewMediaUrl) ? (
                <video
                  src={previewMediaUrl}
                  controls
                  controlsList="nodownload"
                  className="max-h-[60vh] w-auto rounded-md"
                />
              ) : (
                <img
                  src={previewMediaUrl}
                  alt="Protected Evidence Preview"
                  className="max-h-[60vh] w-auto object-contain rounded-md pointer-events-none select-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
