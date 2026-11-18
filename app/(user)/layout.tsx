"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import {
  Home as AgentHomeIcon,
  ListFilter as AgentQueueIcon,
  ClipboardCheck as AgentTasksIcon,
  Wallet as AgentWalletIcon,
  MoreHorizontal as AgentMoreIcon,
  BarChart3 as AgentStatsIcon,
  Settings as AgentSettingsIcon,
  ShieldCheck as AgentVerificationIcon,
  MapPin as AgentCoverageIcon,
  Power,
  LogOut,
  Star,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: "home" },
  { label: "Tasks", href: "/dashboard/tasks", icon: "tasks" },
  { label: "Property", href: "/properties", icon: "property" },
  { label: "Message", href: "/chat", icon: "message" },
  { label: "More", href: "/more", icon: "more" },
];

const AGENT_NAV_ITEMS = [
  { label: "Home", href: "/agent/dashboard", icon: AgentHomeIcon },
  { label: "Queue", href: "/agent/queue", icon: AgentQueueIcon },
  { label: "Tasks", href: "/agent/tasks", icon: AgentTasksIcon },
  { label: "Earnings", href: "/agent/wallet", icon: AgentWalletIcon },
  { label: "More", href: "/agent/more", icon: AgentMoreIcon },
];

const AGENT_SIDEBAR_ITEMS = [
  { label: "Home", href: "/agent/dashboard", icon: AgentHomeIcon },
  { label: "Queue", href: "/agent/queue", icon: AgentQueueIcon },
  { label: "Tasks", href: "/agent/tasks", icon: AgentTasksIcon },
  { label: "Earnings", href: "/agent/wallet", icon: AgentWalletIcon },
  { label: "Performance", href: "/agent/stats", icon: AgentStatsIcon },
  { label: "Verification", href: "/agent/verification", icon: AgentVerificationIcon },
  { label: "Settings", href: "/settings", icon: AgentSettingsIcon },
  { label: "More", href: "/agent/more", icon: AgentMoreIcon },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isOnline, setIsOnline] = React.useState(true);

  React.useEffect(() => {
    const syncStatus = () => {
      try {
        const stored = localStorage.getItem("oversite_agent_online");
        if (stored !== null) setIsOnline(stored === "true");
      } catch {}
    };
    syncStatus();
    window.addEventListener("oversite:agent-status-updated", syncStatus);
    return () => window.removeEventListener("oversite:agent-status-updated", syncStatus);
  }, []);

  const handleToggleOnline = async () => {
    const next = !isOnline;
    setIsOnline(next);
    try {
      localStorage.setItem("oversite_agent_online", String(next));
      window.dispatchEvent(new Event("oversite:agent-status-updated"));
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      if (token && user?.id) {
        await fetch(`/api/v1/agents/${user.id}/availability`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isAvailable: next }),
        }).catch(() => null);
      }
    } catch {}
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-body)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return null;
  }

  const isAgent = user?.role === "AGENT";
  const displayName = user?.name || user?.fullName || "Oversite User";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "OU";
  const displayRole = isAgent ? "Accredited Agent" : "Client Account";
  const rawId = (user?.id || "12344").replace(/[^a-zA-Z0-9]/g, "");
  const agentIdCode = rawId.slice(-5).toUpperCase() || "12344";
  const agentIdDisplay = `Agent #OS-${agentIdCode}`;
  const rating = user?.agentProfile?.rating ? parseFloat(user.agentProfile.rating).toFixed(1) : "4.9";
  const totalTasks = typeof user?.agentProfile?.totalTasks === "number" ? user.agentProfile.totalTasks : 128;

  const isAgentNavActive = (href: string, isMobile = false) => {
    if (href === "/agent/more" || href === "/more") {
      return (
        pathname === "/agent/more" ||
        pathname === "/more" ||
        (isMobile && pathname.startsWith("/settings")) ||
        pathname.startsWith("/security") ||
        pathname.startsWith("/support") ||
        pathname.startsWith("/about") ||
        pathname.startsWith("/notifications")
      );
    }
    return pathname === href || (href !== "/agent/dashboard" && pathname.startsWith(href));
  };

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-body)] font-sans flex justify-center transition-colors duration-300">
      <div className="flex w-full max-w-[1000px] xl:max-w-[1200px] relative">
        {/* Desktop Sidebar (hidden on mobile, sticky on tablet and desktop) */}
        <aside className="hidden md:flex flex-col w-[220px] lg:w-[250px] xl:w-[275px] bg-[var(--bg-card)] sticky top-0 h-screen shrink-0">
          <div className="h-16 flex items-center px-6 border-b border-[var(--border-color)] gap-2.5">
            <Link href={isAgent ? "/agent/dashboard" : "/dashboard"} className="flex items-center gap-2">
              <img 
                src="/assets/nav-icons/logo-full.svg" 
                alt="Oversite.ng Logo" 
                className="h-7 w-auto" 
              />
              {isAgent && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)]">
                  Agent
                </span>
              )}
            </Link>
          </div>

          {/* Agent Availability Toggle */}
          {isAgent && (
            <div className="p-3 border-b border-[var(--border-color)]">
              <button
                type="button"
                onClick={handleToggleOnline}
                className={`w-full py-2.5 px-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  isOnline
                    ? "bg-[var(--primary-light)] border-[var(--primary-border)] text-[var(--primary)]"
                    : "bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border-[var(--border-color)] text-[var(--text-muted)]"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-[var(--primary)] animate-pulse" : "bg-[var(--text-muted)]"}`} />
                  <span>{isOnline ? "Online (Available)" : "Offline (Unavailable)"}</span>
                </div>
                <Power className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {isAgent ? (
              AGENT_SIDEBAR_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = isAgentNavActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group flex items-center gap-3 px-3 py-2 text-[14px] font-medium rounded-xl transition-all ${
                      isActive
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-heading)]"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })
            ) : (
              <>
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 px-3 py-2 text-[14px] font-medium transition-all ${isActive
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                        }`}
                    >
                      <span 
                        className={`w-5 h-5 transition-colors ${isActive ? "bg-[var(--primary)]" : "bg-[var(--text-muted)] group-hover:bg-[var(--text-heading)]"}`}
                        style={{
                          maskImage: `url(/assets/nav-icons/nav_${item.icon}${isActive ? "_solid" : ""}.svg)`,
                          maskSize: "contain",
                          maskRepeat: "no-repeat",
                          maskPosition: "center",
                          WebkitMaskImage: `url(/assets/nav-icons/nav_${item.icon}${isActive ? "_solid" : ""}.svg)`,
                          WebkitMaskSize: "contain",
                          WebkitMaskRepeat: "no-repeat",
                          WebkitMaskPosition: "center"
                        }}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* Quick Actions Section */}
                <div className="pt-4 pb-2">
                  <p className="px-3 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                    Quick Actions
                  </p>
                  <div className="space-y-0.5">
                    <Link
                      href="/errands"
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors ${
                        pathname === "/errands"
                          ? "bg-amber-500/10 text-amber-500 font-semibold"
                          : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Quick Errands</span>
                    </Link>
                    <Link
                      href="/legal"
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors ${
                        pathname === "/legal"
                          ? "bg-blue-500/10 text-blue-500 font-semibold"
                          : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Legal Advisory</span>
                    </Link>
                    <Link
                      href="/enforcement"
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors ${
                        pathname === "/enforcement"
                          ? "bg-rose-500/10 text-rose-500 font-semibold"
                          : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Law Enforcement</span>
                    </Link>
                    <Link
                      href="/vulnerability"
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors ${
                        pathname === "/vulnerability"
                          ? "bg-red-500/10 text-red-500 font-semibold"
                          : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Vulnerability Test</span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </nav>

          {/* User/Agent Card & Logout */}
          <div className="p-3 border-t border-[var(--border-color)]">
            {isAgent ? (
              <Link
                href="/agent/stats"
                className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--primary-border)] transition-colors mb-2"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden">
                  {user?.avatarUrl || user?.avatar ? (
                    <img
                      src={user.avatarUrl || user.avatar || ""}
                      alt={agentIdDisplay}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials[0]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[var(--text-heading)] truncate">{agentIdDisplay}</p>
                  <p className="text-[10px] text-[var(--primary)] flex items-center gap-1 truncate">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{rating} · {totalTasks} {totalTasks === 1 ? "task" : "tasks"}</span>
                  </p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] dark:bg-[var(--bg-body)] border border-[var(--border-color)] mb-2">
                <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold text-[11px] overflow-hidden shrink-0">
                  {user?.avatarUrl || user?.avatar ? (
                    <img
                      src={user.avatarUrl || user.avatar || ""}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[var(--text-heading)] truncate">{displayName}</p>
                  <p className="text-[10px] text-[var(--primary)] truncate">{displayRole}</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer rounded-xl"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
              <ThemeToggle className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-card)] flex items-center justify-center transition-colors shadow-xs cursor-pointer" />
            </div>
          </div>
        </aside>

        {/* Main Content Area (Centered Feed Column) */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0 md:border-r md:border-[var(--border-color)] max-w-full md:max-w-[600px] xl:max-w-[650px]">
          {/* Page Content Container */}
          <main className="flex-1 w-full max-w-[650px] mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28 md:pb-12">
            <React.Suspense fallback={<DynamicLoadingState variant="generic" />}>
              {children}
            </React.Suspense>
          </main>
        </div>

        {/* Optional Right Column (Visible on Extra Large Screens) */}
        <div className="hidden xl:block w-[275px] shrink-0 sticky top-0 h-screen p-6">
          {/* Secondary widgets placeholder */}
        </div>
      </div>

      {/* Mobile Bottom Navigation (Hidden on Tablet and Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-color)] z-30 px-2 pt-2 pb-6 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        {isAgent
          ? AGENT_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = isAgentNavActive(item.href, true);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${
                    isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`} />
                  <span className={`text-[10px] font-medium ${isActive ? "text-[var(--primary)] font-semibold" : "text-[var(--text-muted)]"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })
          : NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 w-16 ${
                    isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  <span 
                    className={`w-5 h-5 mb-0.5 transition-colors ${isActive ? "bg-[var(--primary)]" : "bg-[#a0aab4]"}`}
                    style={{
                      maskImage: `url(/assets/nav-icons/nav_${item.icon}${isActive ? "_solid" : ""}.svg)`,
                      maskSize: "contain",
                      maskRepeat: "no-repeat",
                      maskPosition: "center",
                      WebkitMaskImage: `url(/assets/nav-icons/nav_${item.icon}${isActive ? "_solid" : ""}.svg)`,
                      WebkitMaskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      WebkitMaskPosition: "center"
                    }}
                  />
                  <span className={`text-[10px] font-medium ${isActive ? "text-[var(--primary)] font-semibold" : "text-[#a0aab4]"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
      </div>
    </div>
  );
}
