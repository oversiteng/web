"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: "home" },
  { label: "Tasks", href: "/dashboard/tasks", icon: "tasks" },
  { label: "Property", href: "/properties", icon: "property" },
  { label: "Message", href: "/chat", icon: "message" },
  { label: "More", href: "/more", icon: "more" },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F4F6F4] dark:bg-[var(--bg-body)] text-[var(--text-body)] font-sans flex justify-center transition-colors duration-300">
      <div className="flex w-full max-w-[1000px] xl:max-w-[1200px] relative">
        {/* Desktop Sidebar (hidden on mobile, sticky on tablet and desktop) */}
        <aside className="hidden md:flex flex-col w-[220px] lg:w-[250px] xl:w-[275px] bg-[var(--bg-card)] sticky top-0 h-screen shrink-0">
          <div className="h-16 flex items-center px-6 border-b border-[var(--border-color)] gap-2.5">
            <img 
              src="/assets/nav-icons/logo-full.svg" 
              alt="Oversite.ng Logo" 
              className="h-7 w-auto" 
            />
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
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
          </nav>

          {/* User Card & Logout */}
          <div className="p-3 border-t border-[var(--border-color)]">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] mb-2">
              <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] font-semibold text-[11px]">
                AD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[var(--text-heading)] truncate">Adaeze C.</p>
                <p className="text-[10px] text-[var(--primary)] truncate">Client Account</p>
              </div>
            </div>
            <div className="flex items-center justify-between px-1">
              <Link
                href="/login"
                className="flex items-center gap-2 px-2 py-1.5 text-[12px] text-[var(--text-muted)] hover:text-red-500 transition-colors"
              >
                <i className="ai-logout text-[16px]" />
                <span>Sign Out</span>
              </Link>
              <ThemeToggle className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-card)] flex items-center justify-center transition-colors shadow-xs" />
            </div>
          </div>
        </aside>

        {/* Main Content Area (Centered Feed Column) */}
        <div className="flex-1 flex flex-col min-h-screen min-w-0 md:border-r md:border-[var(--border-color)] max-w-full md:max-w-[600px] xl:max-w-[650px]">
          {/* Page Content Container */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 w-full mx-auto pb-24 md:pb-8">
            <React.Suspense fallback={<div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading...</div>}>
              {children}
            </React.Suspense>
          </main>
        </div>

        {/* Optional Right Column (Visible on Extra Large Screens, like Twitter Trends) */}
        <div className="hidden xl:block w-[275px] shrink-0 sticky top-0 h-screen p-6">
          {/* We can put secondary widgets here later */}
        </div>
      </div>

      {/* Mobile Bottom Navigation (Hidden on Tablet and Desktop) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] border-t border-[var(--border-color)] z-50 px-2 pt-2 pb-6 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 w-16 ${isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)]"
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
