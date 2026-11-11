"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Home,
  ListFilter,
  ClipboardCheck,
  Wallet,
  MoreHorizontal,
  Bell,
  Power,
  Shield,
  Star,
  LogOut,
  MapPin,
  ExternalLink,
} from "lucide-react";

const AGENT_NAV = [
  { label: "Home", href: "/agent/dashboard", icon: Home },
  { label: "Queue", href: "/agent/tasks?tab=queue", icon: ListFilter },
  { label: "Tasks", href: "/agent/tasks", icon: ClipboardCheck },
  { label: "Earnings", href: "/agent/wallet", icon: Wallet },
  { label: "More", href: "/more", icon: MoreHorizontal },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || (user?.role !== "AGENT" && user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN"))) {
      window.location.href = "/login?role=agent";
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-[#070d0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return null;
  }

  const agentName = user?.name || user?.fullName || "Agent";
  const agentInitial = agentName.charAt(0).toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-[#070d0a] text-slate-100 font-sans flex justify-center selection:bg-emerald-500/30 selection:text-emerald-300">
      <div className="flex w-full max-w-[1000px] xl:max-w-[1200px] relative">
        
        {/* Desktop Sidebar (hidden on mobile, sticky on tablet and desktop) */}
        <aside className="hidden md:flex flex-col w-[220px] lg:w-[250px] xl:w-[275px] bg-[#0c1410] border-r border-[#19271e] sticky top-0 h-screen shrink-0">
          
          {/* Top Brand Logo */}
          <div className="h-16 flex items-center px-6 border-b border-[#19271e] justify-between">
            <Link href="/agent/dashboard" className="flex items-center gap-2">
              <img 
                src="/assets/nav-icons/logo-full.svg" 
                alt="Oversite.ng Logo" 
                className="h-7 w-auto" 
              />
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Agent
              </span>
            </Link>
          </div>

          {/* Availability Toggle */}
          <div className="p-3 border-b border-[#19271e]">
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`w-full py-2.5 px-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                isOnline
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-900 border-slate-800 text-slate-400"
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                <span>{isOnline ? "Online (Receiving Tasks)" : "Offline (Paused)"}</span>
              </div>
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {AGENT_NAV.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/agent/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20 shadow-xs"
                      : "text-slate-400 hover:text-white hover:bg-[#131d17]"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-white"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* Quick Territory Coverage */}
            <div className="pt-6 pb-2 px-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Active Territory
              </p>
              <div className="p-3 rounded-2xl bg-[#131d17] border border-[#1b2b20] space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lagos Zone 1</span>
                </div>
                <p className="text-[11px] text-slate-400">Ikoyi, Lekki Phase 1, Victoria Island</p>
              </div>
            </div>
          </nav>

          {/* Agent Profile & Sign Out Footer */}
          <div className="p-3 border-t border-[#19271e]">
            <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-[#131d17] border border-[#1b2b20] mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0">
                {agentInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white truncate">{agentName}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 truncate">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>4.9 · 128 tasks</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer rounded-xl hover:bg-red-500/5"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area (Centered Feed Column) */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0 md:border-r md:border-[#19271e] max-w-full md:max-w-[600px] xl:max-w-[650px]">
          <main className="flex-1 w-full max-w-[650px] mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28 md:pb-12">
            {children}
          </main>
        </div>

        {/* Right Column (Visible on Extra Large Screens) */}
        <div className="hidden xl:block w-[275px] shrink-0 sticky top-0 h-screen p-6 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0c1410] border border-[#19271e] space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Inspector SLA Guidelines
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Arrive within 2 hours of assignment acceptance. Always capture GPS-verified timestamps at boundary beacons.
            </p>
          </div>
        </div>

      </div>

      {/* Mobile Bottom Navigation (Hidden on Tablet & Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0c1410]/95 backdrop-blur-md border-t border-[#19271e] z-50 px-2 pt-2 pb-5 flex justify-around items-center">
        {AGENT_NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/agent/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${
                isActive ? "text-emerald-400 font-semibold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
              <span className={`text-[10px] ${isActive ? "text-emerald-400 font-bold" : "text-slate-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
