"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Layers,
  FileCheck2,
  ShieldCheck,
  CreditCard,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  Sliders,
} from "lucide-react";

const ADMIN_NAV = [
  { label: "Analytics & KPI", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users & KYC", href: "/admin/users", icon: Users },
  { label: "Tasks & Dispatch", href: "/admin/tasks", icon: Layers },
  { label: "QA & Audit Reports", href: "/admin/reports", icon: FileCheck2 },
  { label: "Chat Moderation", href: "/admin/chat", icon: ShieldCheck },
  { label: "Finance & Escrow", href: "/admin/finance", icon: CreditCard },
  { label: "Platform Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Admin Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-800 bg-slate-900/90 backdrop-blur-xl fixed inset-y-0 z-30">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black text-sm tracking-wider">
            HQ
          </span>
          <div>
            <span className="font-bold text-sm text-white tracking-tight">
              Oversite Admin
            </span>
            <span className="block text-[10px] text-red-400 font-mono">COMMAND CENTER</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-red-500/15 text-red-400 border border-red-500/20 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-red-400" : "text-slate-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Superadmin Card */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-xs">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">Platform Superadmin</p>
              <p className="text-[10px] text-red-400 truncate">Root Level Authority</p>
            </div>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen">
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              OVERSITE_HQ_V2026
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg bg-slate-800/80 text-slate-300 hover:text-white transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl px-4 py-4 space-y-1">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800/60"
                >
                  <Icon className="w-4 h-4 text-red-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
