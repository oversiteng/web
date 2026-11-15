"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Inbox,
  Search,
  MapPin,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { PropertyWithCurrentTask } from "@/lib/types/task";

function PropertyRowCard({
  property,
  isOther,
}: {
  property: PropertyWithCurrentTask;
  isOther: boolean;
}) {
  const thumbUrl =
    Array.isArray(property.baselinePhotos) && property.baselinePhotos.length > 0
      ? property.baselinePhotos[0]
      : null;

  return (
    <Link
      href={`/properties/${property.id}`}
      className="flex items-center justify-between gap-3.5 p-3.5 rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary)]/50 shadow-xs transition-all group"
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Left Thumbnail: Uploaded Baseline Image if available, otherwise MapPin Placeholder */}
        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#e5e7e6] dark:bg-zinc-800 flex items-center justify-center shrink-0">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <MapPin className="w-6 h-6 text-zinc-500 dark:text-zinc-400 stroke-[1.8]" />
          )}
        </div>

        {/* Middle Details */}
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-[var(--text-heading)] truncate leading-snug">
            {property.title}
          </h3>
          <p className="text-[12.5px] text-[var(--text-muted)] truncate mt-0.5">
            {property.address}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isOther ? "bg-[#f58220]" : "bg-[#22b14c]"
              }`}
            />
            <span
              className={`text-[12px] font-semibold ${
                isOther ? "text-[#f58220]" : "text-[#22b14c]"
              }`}
            >
              {isOther ? "Encroachment Watch" : "Verified Owner"}
            </span>
          </div>
        </div>
      </div>

      {/* Right Chevron */}
      <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-[var(--text-heading)] group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertyWithCurrentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/properties", { headers });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProperties(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch properties:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  const filteredProperties = properties.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.propertyType?.toLowerCase().includes(q)
    );
  });

  // Split into Owned Properties vs Other Properties (Encroachment Watch)
  const ownedProperties = filteredProperties.filter(
    (p) => p.ownershipType !== "OTHER" && p.parcelNumber !== "OTHER_WATCH"
  );
  const otherProperties = filteredProperties.filter(
    (p) => p.ownershipType === "OTHER" || p.parcelNumber === "OTHER_WATCH"
  );

  return (
    <div className="relative min-h-[82dvh] flex flex-col text-[var(--text-body)] pb-24 max-w-xl mx-auto px-1">
      {/* ── Top Header: "Property Oversight" + White Circular "+" Button ── */}
      <div className="relative flex items-center justify-between py-3 mb-2">
        <div className="w-10 h-10" />
        <h1 className="text-[16px] sm:text-[17px] font-bold text-[var(--text-heading)] tracking-tight text-center">
          Property Oversight
        </h1>
        <Link
          href="/properties/new"
          className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--primary)] text-[var(--text-heading)] flex items-center justify-center transition-all active:scale-95 shadow-xs"
          aria-label="Register Property"
        >
          <Plus className="w-5 h-5 stroke-[2.2]" />
        </Link>
      </div>

      {loading ? (
        <div className="pt-6">
          <DynamicLoadingState variant="properties" />
        </div>
      ) : properties.length === 0 ? (
        /* ── Empty State when 0 properties are registered ── */
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-5">
            <Inbox className="w-14 h-14 stroke-[1.6]" />
          </div>

          <h2 className="text-[17px] sm:text-[18px] font-bold text-[var(--text-heading)] mb-2">
            No properties registered
          </h2>

          <p className="text-[13.5px] text-[var(--text-muted)] max-w-[300px] leading-relaxed mb-7">
            You have not added any properties yet. Tap the button below to
            register your first property.
          </p>

          <Link
            href="/properties/new"
            className="px-8 py-3.5 rounded-full bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[14px] font-bold text-[var(--text-heading)] shadow-xs transition-all active:scale-95"
          >
            Register Property
          </Link>
        </div>
      ) : (
        /* ── Populated Property Oversight View (Screenshot 1: Owned Properties + Other Properties) ── */
        <div className="space-y-6 pt-1">
          {/* Pill Search Bar */}
          <div className="relative">
            <Search className="w-4.5 h-4.5 absolute left-4.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search registered properties..."
              className="w-full pl-11 pr-4 py-3.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--primary)] transition-all shadow-xs"
            />
          </div>

          {/* ── Category 1: Owned Properties ── */}
          <section className="space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-[16.5px] font-bold text-[var(--text-heading)] tracking-tight">
                  Owned Properties
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#dff5e5] dark:bg-emerald-950/60 text-[#22b14c] text-[12px] font-bold">
                  {ownedProperties.length}
                </span>
              </div>
              <p className="text-[12.5px] text-[var(--text-muted)] mt-0.5">
                Legally owned properties verified or under active title watch
              </p>
            </div>

            {ownedProperties.length > 0 ? (
              <div className="space-y-3">
                {ownedProperties.map((prop) => (
                  <PropertyRowCard
                    key={prop.id}
                    property={prop}
                    isOther={false}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] py-8 px-6 text-center shadow-xs">
                <p className="text-[14px] font-bold text-[var(--text-heading)]">
                  No owned properties found
                </p>
                <p className="text-[12.5px] text-[var(--text-muted)] mt-1">
                  Tap the + button above to register a property you legally own.
                </p>
              </div>
            )}
          </section>

          {/* ── Category 2: Other Properties (Encroachment Watch) ── */}
          <section className="space-y-3 pt-1">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-[16.5px] font-bold text-[var(--text-heading)] tracking-tight">
                  Other Properties
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#faecd8] dark:bg-amber-950/60 text-[#d97706] text-[12px] font-bold">
                  {otherProperties.length}
                </span>
              </div>
              <p className="text-[12.5px] text-[var(--text-muted)] mt-0.5 leading-snug">
                Adjacent plots and lands monitored for encroachment or boundary
                activity
              </p>
            </div>

            {otherProperties.length > 0 ? (
              <div className="space-y-3">
                {otherProperties.map((prop) => (
                  <PropertyRowCard
                    key={prop.id}
                    property={prop}
                    isOther={true}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] py-9 px-6 text-center shadow-xs">
                <ShieldAlert className="w-9 h-9 text-zinc-400 dark:text-zinc-500 mx-auto mb-3 stroke-[1.6]" />
                <h3 className="text-[14.5px] font-bold text-[var(--text-heading)]">
                  No encroachment watch properties
                </h3>
                <p className="text-[12.5px] text-[var(--text-muted)] max-w-[280px] mx-auto mt-1 leading-relaxed">
                  Add neighboring land or unverified plots to track boundary
                  changes.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
