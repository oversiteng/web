"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronRight, Plus, ShieldCheck } from "lucide-react";

interface PropertyOversiteItem {
  id: string;
  title: string;
  address: string;
  statusText: string;
  statusDot: string;
  imageUrl: string;
}

const DEFAULT_LISTED_PROPERTIES: PropertyOversiteItem[] = [
  {
    id: "prop-1",
    title: "Plot 12, Lekki Phase 1",
    address: "Lekki Peninsula, Lagos",
    statusText: "Site visit report · 2h ago",
    statusDot: "bg-emerald-500",
    imageUrl: "/images/oversite/prop_1.jpg",
  },
  {
    id: "prop-2",
    title: "4 Bourdillon Close, Ikoyi",
    address: "Ikoyi, Lagos",
    statusText: "Ownership verification · yesterday",
    statusDot: "bg-emerald-500",
    imageUrl: "/images/oversite/prop_2.jpg",
  },
  {
    id: "prop-3",
    title: "Block 7, Guzape Hills",
    address: "Guzape District, Abuja FCT",
    statusText: "Boundary audit · 3 days ago",
    statusDot: "bg-amber-500",
    imageUrl: "/images/oversite/prop_3.jpg",
  },
];

export default function PropertyOversitePage() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyOversiteItem[]>(DEFAULT_LISTED_PROPERTIES);

  useEffect(() => {
    async function loadProperties() {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/properties", { headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const fallbackImages = [
            "/images/oversite/prop_1.jpg",
            "/images/oversite/prop_2.jpg",
            "/images/oversite/prop_3.jpg",
          ];
          const mapped: PropertyOversiteItem[] = json.data.map((p: any, idx: number) => ({
            id: p.id,
            title: p.title || p.address || `Property ${idx + 1}`,
            address: p.address || "Lagos, Nigeria",
            statusText:
              p.currentTask?.formattedDisplay ||
              (idx === 2 ? "Boundary audit · 3 days ago" : idx === 1 ? "Ownership verification · yesterday" : "Site visit report · 2h ago"),
            statusDot: idx === 2 ? "bg-amber-500" : "bg-emerald-500",
            imageUrl: fallbackImages[idx % fallbackImages.length],
          }));
          setProperties(mapped);
        }
      } catch (e) {
        console.error("Failed to load properties for oversite:", e);
      }
    }
    loadProperties();
  }, []);

  return (
    <div className="bg-[var(--bg-body)] min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-[var(--text-heading)] transition-colors duration-150">
      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4">
        <div>
          {/* ── Top Header ── */}
          <div className="relative flex items-center justify-center py-3 mb-5">
            <button
              type="button"
              onClick={() => router.back()}
              className="absolute left-0 p-2 -ml-2 text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-[17px] sm:text-[18px] font-bold text-[var(--text-heading)] tracking-tight">
              Property Oversite
            </h1>
          </div>

          {/* ── + List Property Button ── */}
          <Link
            href="/properties/new"
            className="w-full py-4 rounded-full bg-[#85e19e] hover:bg-[#74d38e] text-zinc-950 font-semibold text-[15px] sm:text-[16px] flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>List Property</span>
          </Link>

          {/* ── Section Title: Listed Properties ── */}
          <div className="flex items-center justify-between mt-7 mb-4 px-1">
            <h2 className="text-[15px] sm:text-[16px] font-semibold text-[var(--text-heading)]">
              Listed Properties
            </h2>
            <span className="text-[13px] text-[var(--text-muted)] font-medium">
              {properties.length} properties
            </span>
          </div>

          {/* ── Property Cards List ── */}
          <div className="space-y-3.5">
            {properties.map((item) => (
              <Link
                key={item.id}
                href={`/property-oversite/details?propertyId=${item.id}&report=site-visit-report`}
                className="w-full p-3.5 sm:p-4 rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)]/70 hover:border-[var(--primary)]/60 transition-all shadow-xs flex items-center justify-between gap-3.5 group cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-[16px] overflow-hidden bg-[var(--bg-secondary)] shrink-0">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 56px, 64px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="text-[14.5px] sm:text-[15px] font-bold text-[var(--text-heading)] truncate group-hover:text-[var(--primary)] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[12.5px] sm:text-[13px] text-[var(--text-muted)] truncate mt-0.5">
                    {item.address}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[11.5px] sm:text-[12px] text-[var(--text-muted)]">
                    <span className={`w-2 h-2 rounded-full ${item.statusDot} shrink-0`} />
                    <span className="truncate">{item.statusText}</span>
                  </div>
                </div>

                {/* Right Arrow */}
                <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>

          {/* ── Continuous Geospatial Monitoring Card ── */}
          <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)]/70 p-4 sm:p-5 mt-7 shadow-xs flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-emerald-400 mt-0.5">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="flex-1">
              <h4 className="text-[14px] font-semibold text-[var(--text-heading)]">
                Continuous Geospatial Monitoring
              </h4>
              <p className="text-[12px] sm:text-[12.5px] text-[var(--text-muted)] mt-1 leading-relaxed">
                Every listed property receives scheduled field agent visits, boundary encroachment audits, and document vault records.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
