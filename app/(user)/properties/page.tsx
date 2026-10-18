"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  MapPointWaveIcon as MapPin,
  AddIcon,
  TargetIcon as Crosshair,
  AltArrowUpIcon as ExpandIcon,
  AltArrowDownIcon as CollapseIcon,
  DangerTriangleIcon as TriangleWarning,
  CheckCircleIcon as CheckCircle,
  MagnifierIcon as SearchIcon,
  InfoCircleIcon as InfoIcon,
} from "@solar-icons/react/outline";
import { ThemeToggle } from "@/components/ThemeToggle";

// ─── Types ────────────────────────────────────────────────────────────────────
type AlertStatus = "warning" | "resolved";

interface PropertyAlert {
  id: string;
  property: string;
  status: AlertStatus;
  title: string;
  description: string;
}

interface ApiProperty {
  id: string;
  title: string;
  address: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Default Alerts ───────────────────────────────────────────────────────────
const ALERTS: PropertyAlert[] = [
  {
    id: "a1",
    property: "Satellite Telemetry Active",
    status: "resolved",
    title: "Continuous 24/7 Boundary Scan",
    description: "All registered plots are monitored for adjoining developments and perimeter changes.",
  },
];

// ─── Map Component ────────────────────────────────────────────────────────────
function MapPreview({
  expanded,
  onToggleExpand,
  onLocate,
  isDark,
  properties,
}: {
  expanded: boolean;
  onToggleExpand: () => void;
  onLocate: () => void;
  isDark: boolean;
  properties: ApiProperty[];
}) {
  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden transition-all duration-300 border border-[var(--border-color)] bg-[var(--bg-card)] shadow-md ${
        expanded ? "h-[380px] sm:h-[420px]" : "h-[220px]"
      }`}
    >
      {/* Vector Map Simulation with Theme Colors */}
      <svg
        className="absolute inset-0 w-full h-full object-cover select-none"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="400" height="300" fill={isDark ? "#121515" : "#e8eee8"} />

        {/* City Blocks */}
        <path
          d="M 20 40 L 130 30 L 120 110 L 20 100 Z"
          fill={isDark ? "#18191c" : "#f6faf5"}
          stroke={isDark ? "#202226" : "#d3ded2"}
          strokeWidth="1.5"
        />
        <path
          d="M 145 25 L 260 15 L 250 85 L 140 90 Z"
          fill={isDark ? "#18191c" : "#f6faf5"}
          stroke={isDark ? "#202226" : "#d3ded2"}
          strokeWidth="1.5"
        />
        <path
          d="M 280 15 L 380 20 L 375 120 L 270 110 Z"
          fill={isDark ? "#18191c" : "#f6faf5"}
          stroke={isDark ? "#202226" : "#d3ded2"}
          strokeWidth="1.5"
        />
        <path
          d="M 25 120 L 120 125 L 110 220 L 30 210 Z"
          fill={isDark ? "#18191c" : "#f6faf5"}
          stroke={isDark ? "#202226" : "#d3ded2"}
          strokeWidth="1.5"
        />
        <path
          d="M 140 115 L 250 110 L 240 230 L 130 225 Z"
          fill={isDark ? "#191a1d" : "#f6faf5"}
          stroke={isDark ? "#202226" : "#d3ded2"}
          strokeWidth="1.5"
        />
        <path
          d="M 270 135 L 370 140 L 360 250 L 260 240 Z"
          fill={isDark ? "#18191c" : "#f6faf5"}
          stroke={isDark ? "#202226" : "#d3ded2"}
          strokeWidth="1.5"
        />

        {/* Street Lines */}
        <line x1="0" y1="110" x2="400" y2="125" stroke={isDark ? "#25272c" : "#ffffff"} strokeWidth="6" />
        <line x1="130" y1="0" x2="120" y2="300" stroke={isDark ? "#25272c" : "#ffffff"} strokeWidth="5" />
        <line x1="260" y1="0" x2="250" y2="300" stroke={isDark ? "#25272c" : "#ffffff"} strokeWidth="5" />
        <line x1="0" y1="220" x2="400" y2="235" stroke={isDark ? "#222428" : "#ffffff"} strokeWidth="4" />

        {/* Plot outline polygon (boundary) */}
        <polygon
          points="195,50 205,48 203,58 193,57"
          fill="rgba(239, 68, 68, 0.15)"
          stroke="#ef4444"
          strokeWidth="1.5"
        />

        {/* User live coordinate pulse dot */}
        <g transform="translate(200, 150)">
          <circle cx="0" cy="0" r="14" fill="#38bdf8" fillOpacity="0.25" className="animate-ping" />
          <circle cx="0" cy="0" r="10" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />
        </g>
      </svg>

      {/* Property Legend Pills on Top of Map */}
      <div className="absolute top-3 left-3 right-3 flex items-center gap-2 overflow-x-auto no-scrollbar z-10 pointer-events-auto">
        {properties.length > 0 ? (
          properties.slice(0, 3).map((p, idx) => (
            <Link
              key={p.id}
              href={`/properties/${p.id}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] text-[var(--text-heading)] text-[11px] font-medium whitespace-nowrap shadow-sm hover:border-[var(--primary)] transition-colors"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  idx === 0 ? "bg-red-500" : idx === 1 ? "bg-emerald-500" : "bg-blue-500"
                }`}
              />
              <span className="truncate max-w-[140px]">{p.title || p.address}</span>
            </Link>
          ))
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] text-[var(--text-heading)] text-[11px] font-medium whitespace-nowrap shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <span>No properties registered yet</span>
          </div>
        )}
      </div>

      {/* Map Control Floating Action Buttons */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onLocate();
          }}
          className="w-10 h-10 rounded-full bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] active:scale-95 transition-all shadow-md cursor-pointer"
          aria-label="Locate coordinate"
          title="Find GPS Coordinate"
        >
          <Crosshair size={18} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="w-10 h-10 rounded-full bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] flex items-center justify-center text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] active:scale-95 transition-all shadow-md cursor-pointer"
          aria-label={expanded ? "Collapse map" : "Expand map"}
          title={expanded ? "Collapse map" : "Expand map"}
        >
          {expanded ? <CollapseIcon size={18} /> : <ExpandIcon size={18} />}
        </button>
      </div>
    </div>
  );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────
function AlertCard({ alert }: { alert: PropertyAlert }) {
  const isWarning = alert.status === "warning";

  return (
    <div
      className={`rounded-2xl p-4 transition-all duration-200 border ${
        isWarning
          ? "bg-amber-50 dark:bg-[#714b03]/40 border-amber-200 dark:border-[#8a5b00]/60"
          : "bg-emerald-50 dark:bg-[#0b421a]/50 border-emerald-200 dark:border-[#0e5622]/60"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {isWarning ? (
          <TriangleWarning size={17} className="text-amber-500 dark:text-amber-400 shrink-0" />
        ) : (
          <CheckCircle size={17} className="text-emerald-500 dark:text-emerald-400 shrink-0" />
        )}
        <span
          className={`text-[13px] font-semibold ${
            isWarning ? "text-amber-800 dark:text-amber-200" : "text-emerald-800 dark:text-emerald-200"
          }`}
        >
          {alert.property}
        </span>
      </div>
      <p
        className={`text-[14px] font-bold mb-1 ${
          isWarning ? "text-amber-900 dark:text-amber-300" : "text-emerald-900 dark:text-emerald-300"
        }`}
      >
        {alert.title}
      </p>
      <p className="text-[12px] text-zinc-700 dark:text-white/80 leading-relaxed">
        {alert.description}
      </p>
    </div>
  );
}

// ─── Registered Property Card ─────────────────────────────────────────────────
function PropertyCard({ property }: { property: ApiProperty }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="block p-4 hover:bg-[var(--bg-secondary)] transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors shrink-0">
            <MapPin size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[var(--text-heading)] truncate">
              {property.title}
            </p>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5 truncate">
              {property.address}
            </p>
            <p className="text-[11px] text-[var(--text-muted)] opacity-75 mt-0.5">
              Type: {property.propertyType || "Real Estate"} • Registered {new Date(property.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
            Active
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PropertiesPage() {
  const [mapExpanded, setMapExpanded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Fetching GPS coordinates...");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Live Properties State
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
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
  };

  useEffect(() => {
    setMounted(true);
    fetchProperties();
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  const handleLocate = () => {
    setToastMessage("Fetching GPS coordinates...");
    setShowToast(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setToastMessage(
            `Location found: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
          );
          setTimeout(() => setShowToast(false), 4000);
        },
        () => {
          setTimeout(() => setShowToast(false), 3000);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Filter properties
  const filteredProperties = properties.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.address?.toLowerCase().includes(q) ||
      p.propertyType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="relative min-h-screen text-[var(--text-body)] pb-20">
      {/* ── GPS Toast Notification ── */}
      {showToast && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-md bg-[#003882] text-white px-4 py-3 rounded-2xl shadow-2xl border border-blue-400/30 flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <InfoIcon size={20} className="text-white shrink-0" />
            <span className="text-[13px] font-medium tracking-wide">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* ── Top Bar Header ── */}
      <div className="flex items-center justify-between pb-4">
        <ThemeToggle className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-card)] flex items-center justify-center transition-colors shadow-xs" />

        <h1 className="text-[17px] font-semibold text-[var(--text-heading)] tracking-wide">
          Property Portfolio
        </h1>

        <Link
          href="/properties/new"
          className="w-8 h-8 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--border-color)]/60 border border-[var(--border-color)] text-[var(--text-heading)] flex items-center justify-center transition-all active:scale-95 shadow-xs"
          aria-label="Register new property"
        >
          <AddIcon size={18} />
        </Link>
      </div>

      {/* ── Search Input ── */}
      <div className="relative mb-4">
        <SearchIcon
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search properties by name or address..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] transition-all shadow-xs"
        />
      </div>

      {/* ── Interactive Map Card ── */}
      <div className="mb-6">
        <MapPreview
          expanded={mapExpanded}
          onToggleExpand={() => setMapExpanded((prev) => !prev)}
          onLocate={handleLocate}
          isDark={isDark}
          properties={properties}
        />
      </div>

      {/* ── Alerts Section ── */}
      <section className="mb-6">
        <h2 className="text-[15px] font-semibold text-[var(--text-heading)] mb-3 tracking-wide">
          Alerts
        </h2>
        <div className="space-y-3">
          {ALERTS.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      </section>

      {/* ── Registered Properties Section ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-semibold text-[var(--text-heading)] tracking-wide">
            Registered properties ({properties.length})
          </h2>
          <Link
            href="/properties/new"
            className="text-xs font-semibold text-[var(--primary)] hover:underline"
          >
            + Register New
          </Link>
        </div>

        {loading ? (
          <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center text-xs text-[var(--text-muted)]">
            Loading properties...
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="bg-[var(--bg-card)] rounded-2xl divide-y divide-[var(--border-color)] border border-[var(--border-color)] shadow-xs overflow-hidden">
            {filteredProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-3">
            <p className="text-sm font-semibold text-[var(--text-heading)]">No properties found</p>
            <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
              {searchQuery ? "No properties matched your search." : "You have not registered any properties to monitor yet."}
            </p>
            {!searchQuery && (
              <Link
                href="/properties/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)] transition-colors"
              >
                <AddIcon size={16} />
                <span>Register your first plot</span>
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
