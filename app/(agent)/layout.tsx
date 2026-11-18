"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import {
  Home,
  ListFilter,
  ClipboardCheck,
  Wallet,
  MoreHorizontal,
  Power,
  Shield,
  Star,
  LogOut,
  MapPin,
  BarChart3,
  Settings,
  ShieldCheck,
} from "lucide-react";

const AGENT_NAV = [
  { label: "Home", href: "/agent/dashboard", icon: Home },
  { label: "Queue", href: "/agent/queue", icon: ListFilter },
  { label: "Tasks", href: "/agent/tasks", icon: ClipboardCheck },
  { label: "Earnings", href: "/agent/wallet", icon: Wallet },
  { label: "More", href: "/agent/more", icon: MoreHorizontal },
];

const AGENT_SIDEBAR_NAV = [
  { label: "Home", href: "/agent/dashboard", icon: Home },
  { label: "Queue", href: "/agent/queue", icon: ListFilter },
  { label: "Tasks", href: "/agent/tasks", icon: ClipboardCheck },
  { label: "Earnings", href: "/agent/wallet", icon: Wallet },
  { label: "Performance", href: "/agent/stats", icon: BarChart3 },
  { label: "Verification", href: "/agent/verification", icon: ShieldCheck },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "More", href: "/agent/more", icon: MoreHorizontal },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [coverageSummary, setCoverageSummary] = useState("Ikoyi, Victoria Island, Lekki, Ajah");

  useEffect(() => {
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
    const syncCoverage = () => {
      if (typeof window === "undefined") return;
      try {
        const raw = localStorage.getItem("oversite_agent_work_prefs");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.coverageAreas) && parsed.coverageAreas.length > 0) {
            setCoverageSummary(parsed.coverageAreas.join(", "));
          }
        }
      } catch {
        // Keep default
      }
    };
    syncCoverage();
    window.addEventListener("oversite:coverage-updated", syncCoverage);
    return () => window.removeEventListener("oversite:coverage-updated", syncCoverage);
  }, []);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== "AGENT" && user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN"))) {
      if (!isAuthenticated && typeof document !== "undefined") {
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      window.location.href = "/login?role=agent";
    }
  }, [isLoading, isAuthenticated, user]);

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

  const agentName = user?.name || user?.fullName || "Agent";
  const agentInitial = agentName.charAt(0).toUpperCase() || "A";
  const rawId = (user?.id || "12344").replace(/[^a-zA-Z0-9]/g, "");
  const agentIdCode = rawId.slice(-5).toUpperCase() || "12344";
  const agentIdDisplay = `Agent #OS-${agentIdCode}`;

  const rating = user?.agentProfile?.rating ? parseFloat(user.agentProfile.rating).toFixed(1) : "4.9";
  const totalTasks = typeof user?.agentProfile?.totalTasks === "number" ? user.agentProfile.totalTasks : 128;
  const avatarImage = user?.avatarUrl || user?.avatar || null;

  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-body)] font-sans flex justify-center transition-colors duration-300 selection:bg-[var(--primary)]/20 selection:text-[var(--primary)]">
      <div className="flex w-full max-w-[1000px] xl:max-w-[1200px] relative">
        
        {/* Desktop Sidebar (hidden on mobile, sticky on tablet and desktop) */}
        <aside className="hidden md:flex flex-col w-[220px] lg:w-[250px] xl:w-[275px] bg-[var(--bg-card)] sticky top-0 h-screen shrink-0 transition-colors duration-300">
          
          {/* Top Brand Logo */}
          <div className="h-16 flex items-center px-6 border-b border-[var(--border-color)] justify-between">
            <Link href="/agent/dashboard" className="flex items-center gap-2">
              <img 
                src="/assets/nav-icons/logo-full.svg" 
                alt="Oversite.ng Logo" 
                className="h-7 w-auto" 
              />
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)]">
                Agent
              </span>
            </Link>
          </div>

          {/* Availability Toggle */}
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

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {AGENT_SIDEBAR_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/agent/dashboard" && (pathname === item.href || pathname.startsWith(`${item.href}/`)));
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
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-heading)]"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Agent Profile, Sign Out & Theme Toggle Footer */}
          <div className="p-3 border-t border-[var(--border-color)]">
            <Link
              href="/agent/stats"
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--primary-border)] transition-colors mb-2"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-semibold text-xs shrink-0 overflow-hidden border border-[var(--border-color)]">
                {avatarImage ? (
                  <img
                    src={avatarImage}
                    alt={agentIdDisplay}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  agentInitial
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
          <main className="flex-1 w-full max-w-[650px] mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28 md:pb-12">
            <React.Suspense fallback={<DynamicLoadingState variant="generic" />}>
              {children}
            </React.Suspense>
          </main>
        </div>

        {/* Right Column (Visible on Extra Large Screens) */}
        <div className="hidden xl:block w-[275px] shrink-0 sticky top-0 h-screen p-6 space-y-4">
       
        </div>

      </div>

      {/* Mobile Bottom Navigation (Hidden on Tablet & Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-color)] z-30 px-2 pt-2 pb-6 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.02)] transition-colors duration-300">
        {AGENT_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/agent/dashboard" && (pathname === item.href || pathname.startsWith(`${item.href}/`)));
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
        })}
      </div>
    </div>
  );
}
