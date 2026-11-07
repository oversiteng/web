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
  MaximizeIcon,
  MinimizeIcon
} from "@solar-icons/react/outline";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageHeader } from "@/components/ui/PageHeader";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import dynamic from "next/dynamic";
import { PropertyWithCurrentTask, PropertyCurrentTask } from "@/lib/types/task";

const OpenFreeMapView = dynamic(() => import("@/components/OpenFreeMapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[220px] rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-xs text-[var(--text-muted)] animate-pulse">
      Loading Map...
    </div>
  ),
});

type AlertStatus = "warning" | "resolved";

interface PropertyAlert {
  id: string;
  property: string;
  status: AlertStatus;
  title: string;
  description: string;
}


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
  properties: PropertyWithCurrentTask[];
}) {
  // Map markers for registered properties
  const markers = properties
    .filter((p) => p.latitude && p.longitude)
    .map((p, idx) => ({
      id: p.id,
      latitude: p.latitude!,
      longitude: p.longitude!,
      title: p.title || p.address,
      description: p.propertyType || p.address,
      color: idx === 0 ? "#10b981" : idx === 1 ? "#3b82f6" : "#f59e0b",
    }));

  const centerLat = markers.length > 0 ? markers[0].latitude : 6.4281;
  const centerLng = markers.length > 0 ? markers[0].longitude : 3.4219;

  return (
    <div
      className={`relative w-full rounded-3xl overflow-hidden transition-all duration-300 border border-[var(--border-color)] bg-[var(--bg-card)] shadow-md ${
        expanded ? "h-[380px] sm:h-[420px]" : "h-[240px]"
      }`}
    >
      {/* Real OpenFreeMap Vector Map with Liberty/Dark style */}
      <OpenFreeMapView
        latitude={centerLat}
        longitude={centerLng}
        zoom={markers.length > 0 ? 13 : 11}
        height="100%"
        interactive={true}
        showControls={false}
        markers={markers}
      />

      {/* Property Legend Pills on Top of Map */}
      <div className="absolute top-3 left-3 right-3 flex items-center gap-2 overflow-x-auto no-scrollbar z-10 pointer-events-auto">
        {properties.length > 0 ? (
          properties.slice(0, 4).map((p, idx) => (
            <Link
              key={p.id}
              href={`/properties/${p.id}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] text-[var(--text-heading)] text-[11px] font-medium whitespace-nowrap shadow-sm hover:border-[var(--primary)] transition-colors"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-blue-500" : "bg-amber-500"
                }`}
              />
              <span className="truncate max-w-[140px]">{p.title || p.address}</span>
            </Link>
          ))
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)]/90 backdrop-blur-md border border-[var(--border-color)] text-[var(--text-heading)] text-[11px] font-medium whitespace-nowrap shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Register a property to see pins</span>
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
          aria-label={expanded ? "Minimize map" : "Maximize map"}
          title={expanded ? "Minimize map" : "Maximize map"}
        >
          {expanded ? <MinimizeIcon size={18} /> : <MaximizeIcon size={18} />}
        </button>
      </div>
    </div>
  );
}

function getPropertyStatusBadge(task?: PropertyCurrentTask | null) {
  if (!task) {
    return {
      label: "Standby",
      dotClass: "bg-gray-500",
      textClass: "text-gray-600 dark:text-gray-400",
    };
  }

  switch (task.status) {
    case "IN_PROGRESS":
      return {
        label: "In progress",
        dotClass: "bg-amber-500 animate-pulse",
        textClass: "text-amber-600 dark:text-amber-400",
      };
    case "AGENT_ON_SITE":
      return {
        label: "On site",
        dotClass: "bg-indigo-500 animate-pulse",
        textClass: "text-indigo-600 dark:text-indigo-400",
      };
    case "AGENT_EN_ROUTE":
      return {
        label: "En route",
        dotClass: "bg-blue-500",
        textClass: "text-blue-600 dark:text-blue-400",
      };
    case "REPORT_SUBMITTED":
    case "UNDER_REVIEW":
      return {
        label: "In review",
        dotClass: "bg-purple-500",
        textClass: "text-purple-600 dark:text-purple-400",
      };
    case "MATCHED":
      return {
        label: "Assigned",
        dotClass: "bg-sky-500",
        textClass: "text-sky-600 dark:text-sky-400",
      };
    case "PENDING":
    case "DRAFT":
      return {
        label: "Pending",
        dotClass: "bg-amber-400",
        textClass: "text-amber-600 dark:text-amber-400",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-600 dark:text-emerald-400",
      };
    default:
      return {
        label: "Monitoring Active",
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-600 dark:text-emerald-400",
      };
  }
}

function PropertyCard({ property }: { property: PropertyWithCurrentTask }) {
  const statusBadge = getPropertyStatusBadge(property.currentTask);

  return (
    <Link
      href={`/properties/${property.id}`}
      className="block p-4 hover:bg-[var(--bg-secondary)] transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="mt-0.5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors shrink-0">
            <MapPin size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="max-sm:text-[15px] font-semibold text-[var(--text-heading)] truncate">
              {property.title}
            </p>
            {property.currentTask ? (
              <p
                className="text-[13px] text-[var(--text-secondary)] mt-0.5 truncate font-normal tracking-tight"
                title={property.currentTask.formattedDisplay}
              >
                {property.currentTask.formattedDisplay}
              </p>
            ) : (
              <p className="text-[13px] text-[var(--text-secondary)] opacity-75 mt-0.5 truncate font-normal">
                No active tasks • Ready for dispatch
              </p>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
          <span className={`w-2 h-2 rounded-full ${statusBadge.dotClass}`} />
          <span className={`text-[12px] font-medium ${statusBadge.textClass}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function PropertiesPage() {
  const [mapExpanded, setMapExpanded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("Fetching GPS coordinates...");
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Live Properties State
  const [properties, setProperties] = useState<PropertyWithCurrentTask[]>([]);
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
      p.propertyType?.toLowerCase().includes(q) ||
      p.currentTask?.title?.toLowerCase().includes(q) ||
      p.currentTask?.agentDisplayName?.toLowerCase().includes(q) ||
      p.currentTask?.formattedDisplay?.toLowerCase().includes(q)
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

      {/* ── Unified Page Header ── */}
      <PageHeader
        title="Property Portfolio"
        leftSlot={
          <ThemeToggle className="w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors shadow-xs" />
        }
        rightSlot={
          <Link
            href="/properties/new"
            className="w-10 h-10 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white flex items-center justify-center transition-all active:scale-95 shadow-sm shadow-[var(--primary)]/20"
            aria-label="Register new property"
          >
            <AddIcon size={20} />
          </Link>
        }
      />

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
          <DynamicLoadingState variant="properties" />
        ) : filteredProperties.length > 0 ? (
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] divide-y divide-[var(--border-color)] shadow-xs overflow-hidden">
            {filteredProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        ) : searchQuery ? (
          <EmptyState
            preset="search"
            query={searchQuery}
            action={{
              label: "Clear Search",
              onClick: () => setSearchQuery(""),
            }}
          />
        ) : (
          <EmptyState
            preset="properties"
            action={{
              label: "Register Property Plot",
              href: "/properties/new",
            }}
          />
        )}
      </section>
    </div>
  );
}
