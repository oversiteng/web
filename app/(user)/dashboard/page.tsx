"use client";
import Link from "next/link";
import {
  BellBoldDuotoneIcon as Bell,
  ChecklistLinearIcon as Checklist,
  HistoryLinearIcon as History,
  CalendarLinearIcon as Calendar,
  FlagLinearIcon as Flag,
  AddCircleBoldDuotoneIcon as AddCircle,
} from "@solar-icons/react";

import { PieChartIcon, BoltIcon, ChandelierIcon, DocumentsMinimalisticIcon, BellIcon, BookIcon, DocumentIcon, ShieldCheckIcon, ObjectScanIcon, MapPointSearchIcon } from '@solar-icons/react/outline'
import Image from "next/image";

const SERVICES = [
  { label: "Quick Errands", icon: BoltIcon, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Legal Advisory", icon: ChandelierIcon, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Project Review", icon: DocumentIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Due Diligence", icon: PieChartIcon, color: "text-yellow-500", bg: "bg-amber-500/10" },
  { label: "Property Oversite", icon: MapPointSearchIcon, color: "text-red-500", bg: "bg-red-500/10" },
  { label: "Document Processing", icon: DocumentsMinimalisticIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { label: "Law Enforcement", icon: ShieldCheckIcon, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Vulnerability Test", icon: ObjectScanIcon, color: "text-red-500", bg: "bg-red-500/10" },
];

export default function UserDashboard() {
  return (
    <div className="space-y-6 relative pb-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-[16px] sm:text-2xl font-bold text-[var(--text-heading)]">Good afternoon! Adaeze</h1>
        <Link href="/notifications" className="relative w-10 h-10 rounded-full bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex items-center justify-center hover:bg-(--bg-secondary) transition-colors">
          <BellIcon className="w-8 h-8 text-[var(--text-heading)]" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[var(--primary)] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--bg-body)]">
            2
          </span>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 scrollbar-hide">
        <div className="min-w-26.25 flex-1 p-3.5 rounded-[20px] bg-[#161616] dark:bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <Checklist className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
            <span className="text-[17px] font-bold text-white">3</span>
          </div>
          <span className="text-[11px] sm:text-[13px] text-gray-400 font-medium">Task</span>
        </div>
        <div className="min-w-26.25 flex-1 p-3.5 rounded-[20px] bg-[#161616] dark:bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <History className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            <span className="text-[17px] font-bold text-white">3</span>
          </div>
          <span className="text-[11px] sm:text-[13px] text-gray-400 font-medium">Pending</span>
        </div>
        <div className="min-w-26.25 flex-1 p-3.5 rounded-[20px] bg-[#161616] dark:bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
            <span className="text-[17px] font-bold text-white">3</span>
          </div>
          <span className="text-[11px] sm:text-[13px] text-gray-400 font-medium">This month</span>
        </div>
        <div className="min-w-26.25 flex-1 p-3.5 rounded-[20px] bg-[#161616] dark:bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <Flag className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
            <span className="text-[17px] font-bold text-white">3</span>
          </div>
          <span className="text-[11px] sm:text-[13px] text-gray-400 font-medium">Flag</span>
        </div>
      </div>

      {/* Live Status Card */}
      <div className="p-4 rounded-[24px] bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex items-start justify-between">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--text-heading)]">Tunde C. is in the field</h2>
          <p className="text-[12px] text-var(--text-muted) mt-1">Ikoyi · submitting geo-tagged photos</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-[10px] font-bold text-amber-500">Live</span>
        </div>
      </div>

      {/* Hero Image Carousel */}
      <div className="relative w-full h-[160px] sm:h-[220px] rounded-[24px] overflow-hidden">
        <div className="absolute inset-0 bg-slate-800" /> {/* Placeholder for image */}
        <Image
          src="/assets/app-icons/app-logo.png"
          alt="Construction site"
          width={600}
          height={300}
          className="object-cover w-full h-full opacity-40 mix-blend-overlay"
        />
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          <div className="w-4 h-1.5 rounded-full bg-[var(--primary)]" />
          <div className="w-4 h-1.5 rounded-full bg-white/60" />
          <div className="w-4 h-1.5 rounded-full bg-white/60" />
        </div>
      </div>

      {/* Oversite Service Grid */}
      <div>
        <h2 className="text-[14px] font-bold text-[var(--text-heading)] mb-4">Oversite service</h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {SERVICES.map((service, idx) => (
            <button key={idx} className="flex flex-col items-center justify-center p-2 sm:p-4 rounded-2xl bg-(--bg-card) border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] gap-2 hover:bg-(--bg-secondary) transition-colors">
              <service.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${service.color}`}/>
              <span className="text-[11px] sm:text-[13px] font-semibold text-var(--text-heading) text-center leading-tight">
                {service.label}
              </span>
            </button>
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

        <div className="bg-(--bg-card) rounded-[24px] p-2 space-y-1 shadow-[0_0_10px_rgba(0,0,0,0.03)]">
          {/* Task 1 */}
          <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-(--bg-secondary) transition-colors">
            <div>
              <h3 className="text-[13px] font-bold text-[var(--text-heading)]">CAC certified copy</h3>
              <p className="text-[11px] text-var(--text-muted) mt-0.5">Property Oversite · Tunde C. · 2h ago</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--primary)]/10 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              <span className="text-[10px] font-bold text-[var(--primary)]">Ready</span>
            </div>
          </div>

          <hr className="border-t border-(--border-color) mx-3" />

          {/* Task 2 */}
          <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-(--bg-secondary) transition-colors">
            <div>
              <h3 className="text-[13px] font-bold text-[var(--text-heading)]">CAC certified copy</h3>
              <p className="text-[11px] text-var(--text-muted) mt-0.5">Document Processing · Folake A. · today</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-amber-500">In progress</span>
            </div>
          </div>

          <hr className="border-t border-(--border-color) mx-3" />

          {/* Task 3 */}
          <div className="flex items-center justify-between p-3 rounded-2xl hover:bg-(--bg-secondary) transition-colors">
            <div>
              <h3 className="text-[13px] font-bold text-[var(--text-heading)]">Vendor background check</h3>
              <p className="text-[11px] text-var(--text-muted) mt-0.5">Due Diligence · Tier 2 · yesterday</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-500/10 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) */}
      <button className="fixed bottom-20 sm:bottom-8 right-4 sm:right-8 w-14 h-14 bg-[var(--primary)] text-white rounded-full flex items-center justify-center shadow-lg shadow-[var(--primary)]/40 hover:scale-105 active:scale-95 transition-all z-40">
        <AddCircle className="w-6 h-6" />
      </button>
    </div>
  );
}
