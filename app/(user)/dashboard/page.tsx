"use client";
import { useState, useEffect } from "react";
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

const CAROUSEL_IMAGES = [
  "/assets/images/onboarding/onboard1.jpg",
  "/assets/images/onboarding/onboard2.jpg",
  "/assets/images/onboarding/onboard3.jpg"
];

export default function UserDashboard() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

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
      <div className="grid grid-cols-4 gap-2 sm:gap-3 pb-2">
        <div className="p-2 sm:p-3.5 rounded-[16px] sm:rounded-[20px] bg-[var(--bg-card)] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex flex-col items-center sm:items-start gap-1 sm:gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
            <Checklist className="w-5 h-5 sm:w-8 sm:h-8 text-[var(--primary)] mx-auto sm:mx-0" />
            <span className="text-[14px] sm:text-[17px] font-bold text-[var(--text-heading)] mt-1 sm:mt-0">3</span>
          </div>
          <span className="text-[9px] sm:text-[13px] text-[var(--text-muted)] font-medium text-center sm:text-left w-full truncate">Task</span>
        </div>
        <div className="p-2 sm:p-3.5 rounded-[16px] sm:rounded-[20px] bg-[var(--bg-card)] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex flex-col items-center sm:items-start gap-1 sm:gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
            <History className="w-5 h-5 sm:w-8 sm:h-8 text-blue-500 mx-auto sm:mx-0" />
            <span className="text-[14px] sm:text-[17px] font-bold text-[var(--text-heading)] mt-1 sm:mt-0">3</span>
          </div>
          <span className="text-[9px] sm:text-[13px] text-[var(--text-muted)] font-medium text-center sm:text-left w-full truncate">Pending</span>
        </div>
        <div className="p-2 sm:p-3.5 rounded-[16px] sm:rounded-[20px] bg-[var(--bg-card)] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex flex-col items-center sm:items-start gap-1 sm:gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
            <Calendar className="w-5 h-5 sm:w-8 sm:h-8 text-slate-500 mx-auto sm:mx-0" />
            <span className="text-[14px] sm:text-[17px] font-bold text-[var(--text-heading)] mt-1 sm:mt-0">3</span>
          </div>
          <span className="text-[9px] sm:text-[13px] text-[var(--text-muted)] font-medium text-center sm:text-left w-full truncate">This month</span>
        </div>
        <div className="p-2 sm:p-3.5 rounded-[16px] sm:rounded-[20px] bg-[var(--bg-card)] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] flex flex-col items-center sm:items-start gap-1 sm:gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full">
            <Flag className="w-5 h-5 sm:w-8 sm:h-8 text-red-500 mx-auto sm:mx-0" />
            <span className="text-[14px] sm:text-[17px] font-bold text-[var(--text-heading)] mt-1 sm:mt-0">3</span>
          </div>
          <span className="text-[9px] sm:text-[13px] text-[var(--text-muted)] font-medium text-center sm:text-left w-full truncate">Flag</span>
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
      <div className="relative w-full h-[160px] sm:h-[220px] rounded-[24px] overflow-hidden bg-slate-900 group">
        {CAROUSEL_IMAGES.map((img, idx) => (
          <Image
            key={img}
            src={img}
            alt={`Ad slide ${idx + 1}`}
            fill
            className={`object-cover w-full h-full transition-opacity duration-1000 ${
              idx === currentSlide ? "opacity-60" : "opacity-0"
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
              className={`h-1.5 rounded-full transition-all ${
                idx === currentSlide ? "w-4 bg-[var(--primary)]" : "w-1.5 bg-white/60 hover:bg-white/80"
              }`}
            />
          ))}
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
