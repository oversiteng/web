"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Download,
  Calendar,
  Camera,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Edit2,
  ChevronRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import { AddIcon, BoltIcon, ChandelierIcon, DocumentIcon, DocumentsMinimalisticIcon, MapPointSearchIcon, ObjectScanIcon, PieChartIcon, ShieldCheckIcon } from "@solar-icons/react/outline";

const OpenFreeMapView = dynamic(() => import("@/components/OpenFreeMapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-xs text-[var(--text-muted)] animate-pulse">
      Loading OpenFreeMap...
    </div>
  ),
});

interface PropertyTask {
  id: string;
  title: string;
  moduleType: string;
  status: string;
  priceNgn?: number;
  scheduledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  description?: string;
}

interface PropertyDetails {
  id: string;
  title: string;
  address: string;
  latitude?: number;
  longitude?: number;
  parcelNumber?: string;
  propertyType?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tasks: PropertyTask[];
  activeTaskCount: number;
}

const MODULE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  QUICK_ERRANDS: { label: "Quick Errand", icon: BoltIcon },
  PROPERTY_OVERSITE: { label: "Property Oversite", icon: ShieldCheckIcon },
  PROJECT_WATCH: { label: "Project Watch", icon: ObjectScanIcon },
  DUE_DILIGENCE: { label: "Due Diligence", icon: DocumentIcon },
  LEGAL_ADVISORY: { label: "Legal Advisory", icon: DocumentsMinimalisticIcon },
  LAW_ENFORCEMENT: { label: "Law Enforcement", icon: MapPointSearchIcon },
  VULNERABILITY_TEST: { label: "Vulnerability Test", icon: ShieldCheckIcon },
};

function getModuleInfo(moduleType: string) {
  return (
    MODULE_CONFIG[moduleType] || {
      label: moduleType
        ? moduleType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
        : "Task",
      icon: FileText,
    }
  );
}

function getTaskStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return {
        label: "Completed",
        dot: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };
    case "REPORT_SUBMITTED":
    case "READY":
      return {
        label: "Report Ready",
        dot: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      };
    case "IN_PROGRESS":
      return {
        label: "In progress",
        dot: "bg-amber-500 animate-pulse",
        text: "text-amber-700 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      };
    case "AGENT_ON_SITE":
      return {
        label: "Agent on site",
        dot: "bg-indigo-500 animate-pulse",
        text: "text-indigo-700 dark:text-indigo-400",
        bg: "bg-indigo-500/10",
        border: "border-indigo-500/20",
      };
    case "AGENT_EN_ROUTE":
      return {
        label: "En route",
        dot: "bg-blue-500 animate-pulse",
        text: "text-blue-700 dark:text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      };
    case "UNDER_REVIEW":
      return {
        label: "In review",
        dot: "bg-purple-500",
        text: "text-purple-700 dark:text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
      };
    case "MATCHED":
      return {
        label: "Agent assigned",
        dot: "bg-sky-500",
        text: "text-sky-700 dark:text-sky-400",
        bg: "bg-sky-500/10",
        border: "border-sky-500/20",
      };
    case "PENDING":
    case "DRAFT":
    default:
      return {
        label: "Pending",
        dot: "bg-amber-400",
        text: "text-amber-700 dark:text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      };
  }
}

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Deletion State
  const [deleting, setDeleting] = useState(false);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/properties/${id}`, { headers });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to load property details");
      }

      const data = json.data;
      setProperty(data);
      setEditTitle(data.title || "");
      setEditAddress(data.address || "");
      setEditDescription(data.description || "");

      const latNum = Number(data.latitude);
      const lngNum = Number(data.longitude);
      const lacksGps = !Number.isFinite(latNum) || !Number.isFinite(lngNum) || latNum === 0 || lngNum === 0;

      if (lacksGps && data.address) {
        fetch(`/api/v1/geo?address=${encodeURIComponent(data.address)}`)
          .then((r) => r.json())
          .then((geoJson) => {
            if (geoJson.success && geoJson.data) {
              const { latitude, longitude } = geoJson.data;
              setProperty((prev) => (prev ? { ...prev, latitude, longitude } : null));

              // Persist silently to database so it stays locked permanently
              const t = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
              const updateHeaders: Record<string, string> = { "Content-Type": "application/json" };
              if (t) updateHeaders["Authorization"] = `Bearer ${t}`;
              fetch(`/api/v1/properties/${data.id}`, {
                method: "PATCH",
                headers: updateHeaders,
                body: JSON.stringify({ latitude, longitude }),
              }).catch(() => { });
            }
          })
          .catch(() => { });
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProperty();
    }
  }, [id]);

  // Handle Update (PUT/PATCH)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/properties/${id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          title: editTitle,
          address: editAddress,
          description: editDescription,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update property");
      }

      setIsEditing(false);
      await fetchProperty();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete (DELETE)
  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this property from your portfolio? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setDeleting(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/properties/${id}`, {
        method: "DELETE",
        headers,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to delete property");
      }

      router.push("/properties");
    } catch (err) {
      alert((err as Error).message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-[var(--text-muted)]">Loading property and satellite records...</p>
      </div>
    );
  }

  if (errorMsg || !property) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-semibold text-[var(--text-heading)]">Property Not Found</h2>
        <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
          {errorMsg || "We could not find the requested property asset."}
        </p>
        <Link
          href="/properties"
          className="inline-flex px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold"
        >
          Return to Portfolio
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
        ><ArrowLeft className="w-10" /></Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-lg hover:bg-[var(--bg-card)] text-xs font-medium text-[var(--text-heading)] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{isEditing ? "Cancel" : <Edit2 className="w-3.5 h-3.5" />}</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-lg hover:bg-red-500/20 text-xs font-medium text-red-500 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
            <span>{deleting ? "Deleting..." : <Trash2 className="w-3.5 h-3.5" />}</span>
          </button>
        </div>
      </div>

      {/* Edit Form Modal/Inline */}
      {isEditing && (
        <form onSubmit={handleUpdate} className="p-4 rounded-md bg-[var(--bg-card)] borderborder-[var(--border-color)] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Edit Property Details</h3>
          <div>
            <label className="block text-xs font-medium text-[var(--text-heading)] mb-1">Title / Nickname</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-4 rounded-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm text-[var(--text-heading)] outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-heading)] mb-1">Address</label>
            <input
              type="text"
              required
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3 py-4 rounded-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm text-[var(--text-heading)] outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-heading)] mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full min-h-20  px-3 py-4 rounded-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm text-[var(--text-heading)] outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-heading)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-4 py-1.5 rounded-sm bg-[var(--primary)] text-white text-xs disabled:opacity-50"
            >
              {savingEdit ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* Property Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-color)] pb-4">
        <div>
          <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">
            ID: {property.parcelNumber || `OVS-${property.id.slice(0, 8).toUpperCase()}`} • {property.propertyType || "Real Estate Asset"}
          </span>
          <h1 className="text-2xl font-bold text-[var(--text-heading)] tracking-tight mt-0.5">
            {property.title}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-1">
            <MapPin className="w-5 h-5 text-[var(--primary)] shrink-0" />
            <span>{property.address}</span>
          </p>
        </div>
      </div>

      {/* Geofence & Boundary Visualizer Map (Powered by OpenFreeMap) */}
      <div className="space-y-2">
        {(() => {
          const propLat = Number(property.latitude);
          const propLng = Number(property.longitude);
          const hasCoordinates = Number.isFinite(propLat) && Number.isFinite(propLng) && propLat !== 0 && propLng !== 0;
          const validLat = hasCoordinates ? propLat : 6.4281;
          const validLng = hasCoordinates ? propLng : 3.4219;

          return (
            <>
              <OpenFreeMapView
                latitude={validLat}
                longitude={validLng}
                zoom={hasCoordinates ? 15 : 12}
                height="280px"
                interactive={true}
                showControls={true}
                markers={[
                  {
                    latitude: validLat,
                    longitude: validLng,
                    title: property.title,
                    description: property.address,
                    color: "#10b981",
                  },
                ]}
              />
              <p className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                <code>
                  {hasCoordinates
                    ? `Registered GPS: ${validLat.toFixed(6)}, ${validLng.toFixed(6)}`
                    : "Approximate boundary view · Update coordinates in Edit Asset to lock pin"}
                </code>
              </p>
            </>
          );
        })()}
      </div>

      {/* Connected Tasks & Inspection Reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[var(--text-heading)]">
              Tasks & Inspection Reports
            </h2>
            {property.tasks && property.tasks.length > 0 && (
              <span className="px-2.5 py-1 rounded-xs text-xs font-semibold bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-color)]">
                {property.tasks.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setQuickActionsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)] shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <AddIcon className="w-3.5 h-3.5" />
            <span>Request a service</span>
          </button>
        </div>

        {property.tasks && property.tasks.length > 0 ? (
          <div className="space-y-3">
            {property.tasks.map((task) => {
              const isCompleted = task.status === "COMPLETED";
              const isInProgress = task.status === "IN_PROGRESS";
              const moduleInfo = getModuleInfo(task.moduleType);
              const ModuleIcon = moduleInfo.icon;
              const statusBadge = getTaskStatusBadge(task.status);

              // Strip technical requirement annotations and map fallback notes
              const cleanDescription = task.description
                ? task.description
                  .replace(/\[Requirement:[^\]]+\]/gi, "")
                  .replace(/Approximate boundary view[^.]*\.?/gi, "")
                  .replace(/Update coordinates in Edit Asset to lock pin/gi, "")
                  .trim()
                : "";

              const targetLink =
                isCompleted || task.status === "REPORT_SUBMITTED"
                  ? `/dashboard/tasks/${task.id}/report`
                  : `/dashboard/tasks/${task.id}`;

              return (
                <div
                  key={task.id}
                  className="p-4 sm:p-5 rounded-md bg-[var(--bg-card)]  hover:border-[var(--primary)]/40 hover:shadow-xs transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Left: Icon + Title & Metadata */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
                        <ModuleIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[15px] sm:text-[16px] font-bold text-[var(--text-heading)] leading-snug">
                          {task.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-[var(--text-muted)] mt-1">
                          <span className="font-medium text-[var(--text-heading)]/80">
                            {moduleInfo.label}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(task.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {task.priceNgn && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-[var(--text-heading)]">
                                ₦{Number(task.priceNgn).toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status Pill */}
                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        <span>{statusBadge.label}</span>
                      </span>
                    </div>
                  </div>

            
                  <div className="mt-3.5 pt-3 border-t border-[var(--border-color)]/50 flex items-center justify-between gap-3">
                    <span className="text-[13px] sm:text-[15px] text-[var(--text-muted)] truncate">
                      {isCompleted
                        ? "Verified report is ready to download"
                        : isInProgress
                          ? "Task in progress"
                          : "Dispatched & awaiting report"}
                    </span>

                    <Link
                      href={targetLink}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:font-semibold transition-all shadow-2xs shrink-0 cursor-pointer ${isCompleted || task.status === "REPORT_SUBMITTED"
                        ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-95"
                        : "bg-[var(--bg-secondary)] hover:bg-[var(--border-color)]/50 text-[var(--text-heading)] border border-[var(--border-color)]"
                        }`}
                    >
                      {isCompleted || task.status === "REPORT_SUBMITTED" ? (
                        <>
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Report</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[11px] sm:text-[13px]">Track Progress</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/70 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-heading)]">No tasks or inspection reports yet</p>
            </div>
            <button
              type="button"
              onClick={() => setQuickActionsOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
            >
              <AddIcon className="w-3.5 h-3.5" />
              <span>Request a service</span>
            </button>
          </div>
        )}
        {/* Quick Actions Bottom Sheet Drawer */}
        {quickActionsOpen && (
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
              onClick={() => setQuickActionsOpen(false)}
            />
            <div
              className="relative w-full sm:max-w-md bg-[var(--bg-card)] border-t sm:border border-[var(--border-color)] rounded-t-md sm:rounded-3xl p-5 pb-8 sm:p-6 shadow-2xl z-10 animate-in slide-in-from-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4 sm:hidden" />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[18px] font-bold text-[var(--text-heading)]">Quick Actions</h2>
                  <p className="text-[13px] text-[var(--text-muted)] mt-0.5">Select a service to get started immediately</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickActionsOpen(false)}
                  className="w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-[15px] text-red-500  hover:text-[var(--text-heading)] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto pr-1">
                <Link
                  href={`/errands?propertyId=${property.id}`}
                  onClick={() => setQuickActionsOpen(false)}
                  className="flex items-center gap-3.5 p-3 rounded-sm hover:bg-[var(--bg-secondary)] hover:border-[var(--primary)] rounded-sm border-2 border-transparent transition-all group"
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
                  href={`/legal?propertyId=${property.id}`}
                  onClick={() => setQuickActionsOpen(false)}
                  className="flex items-center gap-3.5 p-3 hover:bg-[var(--bg-secondary)] hover:border-[var(--primary)] rounded-sm border-2 border-transparent transition-all group"
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
                  href={`/enforcement?propertyId=${property.id}`}
                  onClick={() => setQuickActionsOpen(false)}
                  className="flex items-center gap-3.5 p-3 hover:bg-[var(--bg-secondary)] hover:border-[var(--primary)] rounded-sm border-2 border-transparent transition-all group"
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
                  href={`/vulnerability?propertyId=${property.id}`}
                  onClick={() => setQuickActionsOpen(false)}
                  className="flex items-center gap-3.5 p-3 hover:bg-[var(--bg-secondary)] hover:border-[var(--primary)] rounded-sm border-2 border-transparent transition-all group"
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
                  href={`/property-oversite?propertyId=${property.id}`}
                  onClick={() => setQuickActionsOpen(false)}
                  className="flex items-center gap-3.5 p-3 hover:bg-[var(--bg-secondary)] hover:border-[var(--primary)] rounded-sm border-2 border-transparent transition-all group"
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
                  href={`/diligence?propertyId=${property.id}`}
                  onClick={() => setQuickActionsOpen(false)}
                  className="flex items-center gap-3.5 p-3 hover:bg-[var(--bg-secondary)] hover:border-[var(--primary)] rounded-sm border-2 border-transparent transition-all group"
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
                  href={`/vault?propertyId=${property.id}`}
                  onClick={() => setQuickActionsOpen(false)}
                  className="flex items-center gap-3.5 p-3 hover:bg-[var(--bg-secondary)] hover:border-[var(--primary)] rounded-sm border-2 border-transparent transition-all group"
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
                  href={`/projects?propertyId=${property.id}`}
                  onClick={() => setQuickActionsOpen(false)}
                  className="flex items-center gap-3.5 p-3 hover:bg-[var(--bg-secondary)] hover:border-[var(--primary)] rounded-sm border-2 border-transparent transition-all group"
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
    </div>
  );
}
