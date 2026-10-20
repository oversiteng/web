"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BellBoldDuotoneIcon as Bell,
  ChecklistLinearIcon as Checklist,
  HistoryLinearIcon as History,
  CalendarLinearIcon as Calendar,
  FlagLinearIcon as Flag,
  // AddCircleBoldDuotoneIcon as AddCircle,
} from "@solar-icons/react";

import { PieChartIcon, BoltIcon, AddIcon, ChandelierIcon, DocumentsMinimalisticIcon, BellIcon, BookIcon, DocumentIcon, ShieldCheckIcon, ObjectScanIcon, MapPointSearchIcon } from '@solar-icons/react/outline'
import Image from "next/image";

const SERVICES = [
  { label: "Quick Errands", icon: BoltIcon, color: "text-amber-500", bg: "bg-amber-500/10", module: "QUICK_ERRANDS", href: "/errands" },
  { label: "Legal Advisory", icon: ChandelierIcon, color: "text-blue-500", bg: "bg-blue-500/10", module: "LEGAL_ADVISORY", href: "/legal" },
  { label: "Project Review", icon: DocumentIcon, color: "text-emerald-500", bg: "bg-emerald-500", module: "PROPERTY_OVERSITE", href: "/projects" },
  { label: "Due Diligence", icon: PieChartIcon, color: "text-yellow-500", bg: "bg-amber-500/10", module: "DUE_DILIGENCE", href: "/diligence" },
  { label: "Property Oversite", icon: MapPointSearchIcon, color: "text-red-500", bg: "bg-red-500/10", module: "PROPERTY_OVERSITE", href: "/property-oversite" },
  { label: "Document Processing", icon: DocumentsMinimalisticIcon, color: "text-emerald-500", bg: "bg-emerald-500/10", module: "DOCUMENT_PROCESSING", href: "/vault" },
  { label: "Law Enforcement", icon: ShieldCheckIcon, color: "text-blue-500", bg: "bg-blue-500/10", module: "LAW_ENFORCEMENT", href: "/enforcement" },
  { label: "Vulnerability Test", icon: ObjectScanIcon, color: "text-red-500", bg: "bg-red-500/10", module: "VULNERABILITY_TEST", href: "/vulnerability" },
];

const CAROUSEL_IMAGES = [
  "/assets/images/onboarding/onboard1.jpg",
  "/assets/images/onboarding/onboard2.jpg",
  "/assets/images/onboarding/onboard3.jpg"
];

export default function UserDashboard() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [userName, setUserName] = useState<string>("Adaeze");
  const [summary, setSummary] = useState<{
    activeRequests: number;
    pendingReports: number;
    monitoredProperties: number;
  }>({
    activeRequests: 3,
    pendingReports: 1,
    monitoredProperties: 3,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Load profile
        const userRes = await fetch("/api/v1/auth/me", { headers });
        const userJson = await userRes.json();
        if (userJson.success && userJson.data?.fullName) {
          const firstName = userJson.data.fullName.split(" ")[0];
          setUserName(firstName);
        }

        // Load dashboard stats
        const summaryRes = await fetch("/api/v1/dashboard/summary", { credentials: "include", headers });
        const summaryJson = await summaryRes.json();
        if (summaryJson.success && summaryJson.data) {
          if (summaryJson.data.role === "CLIENT") {
            setSummary({
              activeRequests: summaryJson.data.activeRequests ?? 0,
              pendingReports: summaryJson.data.pendingReports ?? 0,
              monitoredProperties: summaryJson.data.monitoredProperties ?? 0,
            });
          } else {
            setSummary({
              activeRequests: summaryJson.data.activeTasks ?? 0,
              pendingReports: summaryJson.data.pendingAssignments ?? 0,
              monitoredProperties: summaryJson.data.completedTasks ?? 0,
            });
          }
        }
      } catch (err) {
        console.error("Failed to load dashboard live stats:", err);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6 relative pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[18px] sm:text-2xl font-bold text-[var(--text-heading)]">Good day! {userName}</h1>
        <Link href="/notifications" className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex items-center justify-center hover:bg-(--bg-secondary) transition-colors">
          <BellIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--text-heading)]" />
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[var(--primary)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--bg-body)]">
            2
          </span>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 pb-2">
        <div className="p-3 sm:p-3.5 rounded-[16px] sm:rounded-[20px] bg-[var(--bg-card)] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex flex-col gap-1.5 sm:gap-2.5">
          <div className="flex items-center justify-between w-full gap-1">
            <Checklist className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--primary)] shrink-0" />
            <span className=" sm:text-[17px] font-bold text-[var(--text-heading)]">{summary.activeRequests}</span>
          </div>
          <span className="text-[11px] sm:text-[13px] text-[var(--text-muted)] font-medium truncate">Task</span>
        </div>
        <div className="p-3 sm:p-3.5 rounded-[16px] sm:rounded-[20px] bg-[var(--bg-card)] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex flex-col gap-1.5 sm:gap-2.5">
          <div className="flex items-center justify-between w-full gap-1">
            <History className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 shrink-0" />
            <span className=" sm:text-[17px] font-bold text-[var(--text-heading)]">{summary.pendingReports}</span>
          </div>
          <span className="text-[11px] sm:text-[13px] text-[var(--text-muted)] font-medium truncate">Pending</span>
        </div>
        <div className="p-3 sm:p-3.5 rounded-[16px] sm:rounded-[20px] bg-[var(--bg-card)] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex flex-col gap-1.5 sm:gap-2.5">
          <div className="flex items-center justify-between w-full gap-1">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500 shrink-0" />
            <span className=" sm:text-[17px] font-bold text-[var(--text-heading)]">{summary.monitoredProperties}</span>
          </div>
          <span className="text-[11px] sm:text-[13px] text-[var(--text-muted)] font-medium truncate">Properties</span>
        </div>
        <div className="p-3 sm:p-3.5 rounded-[16px] sm:rounded-[20px] bg-[var(--bg-card)] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex flex-col gap-1.5 sm:gap-2.5">
          <div className="flex items-center justify-between w-full gap-1">
            <Flag className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 shrink-0" />
            <span className=" sm:text-[17px] font-bold text-[var(--text-heading)]">0</span>
          </div>
          <span className="text-[13px] sm:text-[13px] text-[var(--text-muted)] font-medium truncate">Flag</span>
        </div>
      </div>

      {/* Live Status Card */}
      <div className="p-4 rounded-[24px] bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex items-start justify-between">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--text-heading)]">Field Agent Network Active</h2>
          <p className="text-[12px] text-var(--text-muted) mt-1">Lagos, Abuja & nationwide monitoring</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-bold text-amber-500">Live</span>
        </div>
      </div>

      {/* Hero Image Carousel */}
      <div className="relative w-full h-[160px] sm:h-[220px] rounded-[24px] overflow-hidden bg-slate-900 group">
        {CAROUSEL_IMAGES.map((img, idx) => (
          <Image
            key={img}
            src={img}
            alt={`Ad slide ${idx + 1}`}
            fill
            className={`object-cover w-full h-full transition-opacity duration-1000 ${idx === currentSlide ? "opacity-60" : "opacity-0"
              }`}
          />
        ))}

        {/* Ad Content */}
        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center">
          <span className="px-2.5 py-1 bg-[var(--primary)] text-white text-[10px] font-bold uppercase tracking-wider rounded-full w-fit mb-2">Featured</span>
          <h3 className="text-white text-lg sm:text-2xl font-bold max-w-[200px] sm:max-w-[300px] leading-tight">Simplify your real estate projects</h3>
          <p className="text-white/80 text-[11px] sm:text-sm mt-1 max-w-[200px] sm:max-w-[300px]">Get accurate updates in real time.</p>
        </div>

        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
          {CAROUSEL_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${idx === currentSlide ? "w-4 bg-[var(--primary)]" : "w-1.5 bg-white/60 hover:bg-white/80"
                }`}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-[14px] font-bold text-[var(--text-heading)] mb-4">Quick actions</h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {SERVICES.map((service, idx) => (
            <Link
              key={idx}
              href={service.href || "/dashboard/tasks"}
              className="min-h-[80px] flex flex-col items-center justify-center p-2 sm:p-4 rounded-2xl bg-[var(--bg-card)] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] gap-2 hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <service.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${service.color}`} />
              <span className="text-[11px] sm:text-[13px] font-semibold text-[var(--text-heading)] text-center leading-tight">
                {service.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-bold text-[var(--text-heading)]">Recent activity</h2>
          <Link href="/dashboard/tasks" className="text-[13px] font-bold text-[var(--primary)] hover:underline">
            See all
          </Link>
        </div>

        <div className="bg-[var(--bg-card)] rounded-[24px] p-2 space-y-1 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
          {/* Task 1 */}
          <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--bg-secondary)] transition-colors">
            <div>
              <h3 className="text-[13px] font-bold text-[var(--text-heading)]">CAC certified copy</h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Property Oversite · Tunde C. · 2h ago</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--primary)]/10 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              <span className="text-[10px] font-bold text-[var(--primary)]">Ready</span>
            </div>
          </div>

          <hr className="border-t border-[var(--border-color)] mx-3" />

          {/* Task 2 */}
          <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--bg-secondary)] transition-colors">
            <div>
              <h3 className="text-[13px] font-bold text-[var(--text-heading)]">CAC certified copy</h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Document Processing · Folake A. · today</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-amber-500">In progress</span>
            </div>
          </div>

          <hr className="border-t border-[var(--border-color)] mx-3" />

          {/* Task 3 */}
          <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--bg-secondary)] transition-colors">
            <div>
              <h3 className="text-[13px] font-bold text-[var(--text-heading)]">Vendor background check</h3>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Due Diligence · Tier 2 · yesterday</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-500/10 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) -> Quick Actions Menu */}
      <button
        type="button"
        onClick={() => setQuickActionsOpen(true)}
        className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-[var(--primary)] text-white rounded-full flex items-center justify-center shadow-lg shadow-[var(--primary)]/40 hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer"
        title="Quick Actions"
        aria-label="Open Quick Actions Menu"
      >
        <AddIcon className="w-7 h-7" />
      </button>

      {/* Quick Actions Bottom Sheet Drawer */}
      {quickActionsOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setQuickActionsOpen(false)}
          />
          <div
            className="relative w-full sm:max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-[28px] sm:rounded-3xl p-5 pb-8 sm:p-6 shadow-2xl z-10 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[17px] font-bold text-[var(--text-heading)]">Quick Actions</h2>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Select a service to get started immediately</p>
              </div>
              <button
                type="button"
                onClick={() => setQuickActionsOpen(false)}
                className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[12px] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              <Link
                href="/errands"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <BoltIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Quick Errands
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Material cost, document delivery, utility bills, parcel pickup
                  </p>
                </div>
              </Link>

              <Link
                href="/legal"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <ChandelierIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Legal Advisory
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Verified NBA counsel for title review, contracts, and disputes
                  </p>
                </div>
              </Link>

              <Link
                href="/enforcement"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <ShieldCheckIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Law Enforcement Liaison
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Emergency on-site escalation & police/taskforce liaison
                  </p>
                </div>
              </Link>

              <Link
                href="/vulnerability"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <ObjectScanIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Vulnerability Test
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Buy, sell & lease simulation for property risk detection
                  </p>
                </div>
              </Link>

              <Link
                href="/property-oversite"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <MapPointSearchIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Property Oversite
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Perimeter drone inspection, boundary verification & geo-photos
                  </p>
                </div>
              </Link>

              <Link
                href="/diligence"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
                  <PieChartIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Due Diligence
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    CAC registry, vendor verification, litigation search
                  </p>
                </div>
              </Link>

              <Link
                href="/vault"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <DocumentsMinimalisticIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Document Vault
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Certified copies, surveys, C of O, and deed documentation
                  </p>
                </div>
              </Link>

              <Link
                href="/projects"
                onClick={() => setQuickActionsOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-[var(--bg-secondary)] hover:border-[var(--primary)]/40 border border-transparent transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <DocumentIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-heading)] group-hover:text-[var(--primary)] transition-colors">
                    Project Monitoring
                  </p>
                  <p className="text-[11.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    Site construction progress, milestone tracking & billing
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
