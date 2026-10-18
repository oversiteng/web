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
  ExternalLink,
  Edit2,
} from "lucide-react";

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

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

      setProperty(json.data);
      setEditTitle(json.data.title || "");
      setEditAddress(json.data.address || "");
      setEditDescription(json.data.description || "");
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
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Property Portfolio</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] text-xs font-medium text-[var(--text-heading)] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditing ? "Cancel Edit" : "Edit Asset"}</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-500 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{deleting ? "Deleting..." : "Delete Asset"}</span>
          </button>
        </div>
      </div>

      {/* Edit Form Modal/Inline */}
      {isEditing && (
        <form onSubmit={handleUpdate} className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">Edit Property Details</h3>
          <div>
            <label className="block text-xs font-medium text-[var(--text-heading)] mb-1">Title / Nickname</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-heading)] mb-1">Address</label>
            <input
              type="text"
              required
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] outline-none focus:border-[var(--primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-heading)] mb-1">Description / Notes</label>
            <textarea
              rows={2}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] outline-none focus:border-[var(--primary)]"
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
              className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold disabled:opacity-50"
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
            Parcel ID: {property.parcelNumber || `OVS-${property.id.slice(0, 8).toUpperCase()}`} • {property.propertyType || "Real Estate Asset"}
          </span>
          <h1 className="text-2xl font-bold text-[var(--text-heading)] tracking-tight mt-0.5">
            {property.title}
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
            <span>{property.address}</span>
          </p>
        </div>

        {/* Dispatch Field Inspector */}
        <Link
          href={`/errands?propertyId=${property.id}`}
          className="px-4 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs active:scale-95 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>Dispatch Field Inspector</span>
        </Link>
      </div>

      {/* Geofence & Boundary Visualizer Map Placeholder */}
      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden shadow-xs">
        <div className="h-64 bg-[var(--bg-secondary)] relative flex items-center justify-center p-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-heading)]">Interactive Geo-Fence & Boundary Polygon</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-md">
              {property.latitude && property.longitude
                ? `Registered GPS Coordinates: Lat ${property.latitude.toFixed(4)}° N, Lng ${property.longitude.toFixed(4)}° E. 24/7 telemetry and boundary monitoring active.`
                : "No GPS coordinates registered for this plot. Geofence alerts will activate once coordinates are supplied."}
            </p>
          </div>
        </div>
      </div>

      {/* Connected Tasks & Inspection Reports */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--text-heading)]">
            Verified Inspection Reports & Tasks ({property.tasks?.length || 0})
          </h2>
          <Link
            href={`/errands?propertyId=${property.id}`}
            className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
          >
            <span>+ Request New Service</span>
          </Link>
        </div>

        {property.tasks && property.tasks.length > 0 ? (
          <div className="space-y-3">
            {property.tasks.map((task) => {
              const isCompleted = task.status === "COMPLETED";
              const isInProgress = task.status === "IN_PROGRESS";

              return (
                <div
                  key={task.id}
                  className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-[var(--text-heading)] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                        {new Date(task.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-mono">
                        {task.moduleType.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          isCompleted
                            ? "bg-emerald-500/10 text-emerald-500"
                            : isInProgress
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {task.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-[var(--text-heading)] pt-0.5">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">{task.description}</p>
                    )}
                    {task.priceNgn && (
                      <p className="text-[11px] text-[var(--text-muted)] opacity-80">
                        Fee: ₦{Number(task.priceNgn).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/tasks`}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-heading)] inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>View Report</span>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-heading)]">No tasks or inspection reports yet</p>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-0.5">
                Dispatch an agent to conduct a boundary drone flyover, title search, or perimeter verification for this property.
              </p>
            </div>
            <Link
              href={`/errands?propertyId=${property.id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-semibold hover:bg-[var(--primary-hover)] transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Dispatch First Inspection</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
