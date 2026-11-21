"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  FileText,
  Eye,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { ResponsiveSelect } from "@/components/ui/ResponsiveSelect";
import {
  CANONICAL_AGENT_TYPES,
  getAgentTypeLabel,
  getAgentTypeOption,
} from "@/lib/constants/agentTypes";

interface AdminUserItem {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  state: string | null;
  role: string;
  kycStatus: string;
  ninVerificationStatus: string | null;
  nbaVerificationStatus: string | null;
  isActive: boolean;
  operativeCode: string | null;
  agentTier: string | null;
  isAvailable: boolean | null;
  rating: string | null;
  totalTasks: number | null;
  createdAt: string;
}

const AGENT_TIERS = [
  "GENERAL",
  "TECHNICAL_SUPERVISOR",
  "INVESTIGATOR",
  "LEGAL_COUNSEL",
  "ENFORCEMENT_LIAISON",
];

const PAGE_SIZE = 10;

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

function formatFieldLabel(raw: string): string {
  return raw
    .replace(/[._-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function isMediaRefString(val: string): boolean {
  const s = val.trim();
  if (!s) return false;
  // Ignore legacy synthetic placeholder strings like "kyc/background-check/completed.pdf"
  if (/^kyc\/[^/]+\/completed\.pdf$/i.test(s) || s === "consent-signed") {
    return false;
  }
  return (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("/api/v1/media") ||
    s.startsWith("data:image/") ||
    s.startsWith("data:application/pdf") ||
    /^(agent|user|admin|kyc|uploads|documents|reports|media)\//i.test(s) ||
    /\.(jpg|jpeg|png|webp|gif|pdf)(\?.*)?$/i.test(s)
  );
}

function KycMediaPreview({
  url,
  title,
  isPdf,
}: {
  url: string;
  title: string;
  isPdf?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full min-h-[160px] flex items-center justify-center">
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--bg-secondary)]/80 rounded z-10">
          <Loader2 className="w-5 h-5 text-[var(--primary)] animate-spin" />
          <span className="text-[11px] text-[var(--text-muted)] font-medium">
            Loading document preview...
          </span>
        </div>
      )}
      {error ? (
        <div className="p-6 text-center text-xs text-[var(--text-muted)] space-y-1">
          <FileText className="w-5 h-5 mx-auto opacity-50" />
          <p className="font-semibold text-[var(--text-heading)]">
            Preview unavailable
          </p>
          <p className="text-[11px]">
            The media object could not be loaded from storage.
          </p>
        </div>
      ) : isPdf ? (
        <iframe
          src={`${url}#toolbar=0`}
          title={title}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          className="w-full h-80 rounded bg-white"
        />
      ) : (
        <img
          src={url}
          alt={title}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          className="max-h-80 w-auto object-contain rounded select-none"
        />
      )}
    </div>
  );
}

function resolveMediaPreviewUrl(raw: string): string {
  const s = raw.trim();
  if (
    s.startsWith("/api/v1/media") ||
    s.startsWith("data:image/") ||
    s.startsWith("data:application/pdf")
  ) {
    return s;
  }
  if (s.startsWith("http://") || s.startsWith("https://")) {
    if (s.includes(".amazonaws.com/")) {
      return `/api/v1/media?url=${encodeURIComponent(s)}`;
    }
    return s;
  }
  return `/api/v1/media?key=${encodeURIComponent(s)}`;
}

interface KycDocItem {
  key: string;
  label: string;
  url: string;
  backUrl?: string | null;
  backIsPdf?: boolean;
  status?: string;
  isPdf?: boolean;
  submittedAt?: string;
}

function extractKycArtifacts(
  raw: unknown,
  prefix = ""
): {
  docs: KycDocItem[];
  fields: Array<{ key: string; label: string; value: string }>;
} {
  const docs: KycDocItem[] = [];
  const fields: Array<{ key: string; label: string; value: string }> = [];
  const SKIP_KEYS = new Set([
    "withdrawalPinHash",
    "withdrawalPinUpdatedAt",
    "adminPolicy",
    "supportTicket",
    "supportFaqs",
    "objectKey",
    "fileRef",
    "documentUrl",
    "backDocumentUrl",
    "backS3ObjectKey",
    "backObjectKey",
    "backFileName",
    "backContentType",
    "contentType",
    "fileName",
    "uploadedAt",
    "submittedAt",
    "mimeType",
    "bucket",
    "etag",
    "bankVerification",
    "creditBalance",
    "creditsSpent",
    "subscriptionPlan",
    "userTier",
  ]);
  const DOC_INTERNAL_KEYS = new Set([
    "type",
    "status",
    "fileRef",
    "documentUrl",
    "url",
    "mediaUrl",
    "uploadedAt",
    "submittedAt",
    "metadata",
    "contentType",
    "fileName",
    "objectKey",
    "mimeType",
  ]);

  if (!raw || typeof raw !== "object") return { docs, fields };

  const walk = (node: unknown, path: string) => {
    if (node === null || node === undefined || node === "") return;

    if (typeof node === "string") {
      if (isMediaRefString(node)) {
        const lower = node.toLowerCase();
        docs.push({
          key: path || `doc-${docs.length + 1}`,
          label: formatFieldLabel(path || `Document ${docs.length + 1}`),
          url: resolveMediaPreviewUrl(node),
          isPdf: lower.includes(".pdf") || lower.startsWith("data:application/pdf"),
        });
      } else if (path) {
        fields.push({
          key: path,
          label: formatFieldLabel(path),
          value: node,
        });
      }
      return;
    }

    if (typeof node === "number" || typeof node === "boolean") {
      if (path) {
        fields.push({
          key: path,
          label: formatFieldLabel(path),
          value: typeof node === "boolean" ? (node ? "Yes" : "No") : String(node),
        });
      }
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, idx) => {
        walk(item, path ? `${path} #${idx + 1}` : `Item ${idx + 1}`);
      });
      return;
    }

    if (typeof node === "object") {
      const obj = node as Record<string, unknown>;
      const meta =
        obj.metadata && typeof obj.metadata === "object"
          ? (obj.metadata as Record<string, unknown>)
          : null;

      // Detect a structured KYC document object (e.g. { type, status, fileRef, documentUrl, metadata: { objectKey, contentType } })
      const rawRefCandidate = [
        obj.documentUrl,
        obj.fileRef,
        obj.url,
        obj.mediaUrl,
        meta?.objectKey,
      ].find((v): v is string => typeof v === "string" && isMediaRefString(v));

      if (rawRefCandidate) {
        const contentType = String(meta?.contentType || obj.contentType || "").toLowerCase();
        const isPdf =
          contentType.includes("pdf") ||
          rawRefCandidate.toLowerCase().includes(".pdf") ||
          rawRefCandidate.startsWith("data:application/pdf");
        const docLabel = formatFieldLabel(
          path || (typeof obj.type === "string" ? obj.type : `Document ${docs.length + 1}`)
        );
        const rawBackCandidate = [
          obj.backDocumentUrl,
          obj.backS3ObjectKey,
          meta?.backDocumentUrl,
          meta?.backObjectKey,
        ].find((v): v is string => typeof v === "string" && isMediaRefString(v));
        const backContentType = String(meta?.backContentType || "").toLowerCase();
        const backIsPdf = rawBackCandidate
          ? backContentType.includes("pdf") ||
            rawBackCandidate.toLowerCase().includes(".pdf") ||
            rawBackCandidate.startsWith("data:application/pdf")
          : false;

        docs.push({
          key: path || `doc-${docs.length + 1}`,
          label: docLabel,
          url: resolveMediaPreviewUrl(rawRefCandidate),
          backUrl: rawBackCandidate ? resolveMediaPreviewUrl(rawBackCandidate) : null,
          backIsPdf,
          status: typeof obj.status === "string" ? obj.status : undefined,
          isPdf,
          submittedAt:
            typeof obj.uploadedAt === "string"
              ? obj.uploadedAt
              : typeof meta?.submittedAt === "string"
              ? meta.submittedAt
              : undefined,
        });

        // Only surface any extra human-readable fields on the doc object (e.g. documentNumber, issuingAuthority)
        for (const [k, v] of Object.entries(obj)) {
          if (DOC_INTERNAL_KEYS.has(k) || SKIP_KEYS.has(k)) continue;
          walk(v, path ? `${path} · ${k}` : k);
        }
        return;
      }

      for (const [k, v] of Object.entries(obj)) {
        if (SKIP_KEYS.has(k)) continue;
        const nextPath = path ? `${path} · ${k}` : k;
        walk(v, nextPath);
      }
    }
  };

  walk(raw, prefix);
  return { docs, fields };
}

export default function AdminUsersKycPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleTab, setRoleTab] = useState<"AGENT" | "USER">("AGENT");
  const [activityTab, setActivityTab] = useState<"ACTIVE" | "DORMANT">("ACTIVE");
  const [kycFilter, setKycFilter] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Full-Page Detail View state (modeled after Profile & KYC / Ratings & Conduct / Permissions)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<
    "OVERVIEW" | "PROFILE_KYC" | "RATINGS_CONDUCT" | "PERMISSIONS"
  >("OVERVIEW");
  const [userDetail, setUserDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedDocKey, setSelectedDocKey] = useState<string | null>(null);

  // Disciplinary & Conduct Action state
  const [discActionType, setDiscActionType] = useState<string>("ISSUE_WARNING");
  const [discTargetDept, setDiscTargetDept] = useState<string>("Compliance & Legal Desk");
  const [discNote, setDiscNote] = useState<string>("");
  const [savingDisc, setSavingDisc] = useState<boolean>(false);

  // KYC form state
  const [kycStatusInput, setKycStatusInput] = useState<string>("VERIFIED");
  const [kycNoteInput, setKycNoteInput] = useState<string>("");
  const [savingKyc, setSavingKyc] = useState(false);
  const [savingItemKey, setSavingItemKey] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Bank verification state
  const [bankNoteInput, setBankNoteInput] = useState<string>("");
  const [savingBank, setSavingBank] = useState(false);

  // Permissions form state
  const [permActiveInput, setPermActiveInput] = useState<"ACTIVE" | "DORMANT">(
    "ACTIVE"
  );
  const [permTierInput, setPermTierInput] = useState<string>("GENERAL");
  const [savingPerms, setSavingPerms] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/admin/users?limit=200", {
          credentials: "include",
          headers,
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setUsers(json.data);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.error("Failed to load users:", err);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [roleTab, activityTab, kycFilter, searchQuery]);

  const openUserDetail = async (id: string) => {
    setSelectedUserId(id);
    setDetailTab("PROFILE_KYC");
    setIsLoadingDetail(true);
    setSelectedDocKey(null);
    setKycNoteInput("");
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/users/${id}`, {
        credentials: "include",
        headers,
      });
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setUserDetail(d);
        setKycStatusInput(d.kycStatus || "PENDING");
        setPermActiveInput(d.isActive ? "ACTIVE" : "DORMANT");
        setPermTierInput(d.agentProfile?.tier || "GENERAL");

        const extracted = extractKycArtifacts(d.accreditationDocuments);
        if (extracted.docs.length > 0) {
          setSelectedDocKey(extracted.docs[0].key);
        }
      }
    } catch {
      showToast("Failed to load user details");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetail) return;
    setSavingKyc(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      if (kycStatusInput === "VERIFIED") {
        const res = await fetch(`/api/v1/admin/users/${userDetail.id}/verify`, {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            kycNote: kycNoteInput.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error?.message || "Verification failed");
        }
      } else {
        const res = await fetch(`/api/v1/admin/users/${userDetail.id}`, {
          method: "PATCH",
          credentials: "include",
          headers,
          body: JSON.stringify({
            kycStatus: kycStatusInput,
            rejectionReason: kycNoteInput.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error?.message || "Update failed");
        }
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userDetail.id ? { ...u, kycStatus: kycStatusInput } : u
        )
      );
      setUserDetail((prev: any) => ({ ...prev, kycStatus: kycStatusInput }));
      setKycNoteInput("");
      showToast(`KYC status updated to ${kycStatusInput}`);
    } catch (err: any) {
      showToast(err.message || "Failed to update KYC status");
    } finally {
      setSavingKyc(false);
    }
  };

  const handleItemVerification = async (
    itemKey: string,
    payload: Record<string, any>,
    successLabel: string
  ) => {
    if (!userDetail) return;
    setSavingItemKey(itemKey);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/users/${userDetail.id}`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({
          ...payload,
          rejectionReason: kycNoteInput.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Update failed");
      }

      // Refresh detail so all individual statuses stay in sync
      const detailRes = await fetch(`/api/v1/admin/users/${userDetail.id}`, {
        credentials: "include",
        headers,
      });
      const detailJson = await detailRes.json();
      if (detailJson.success && detailJson.data) {
        setUserDetail(detailJson.data);
      }
      showToast(successLabel);
    } catch (err: any) {
      showToast(err.message || "Failed to update verification item");
    } finally {
      setSavingItemKey(null);
    }
  };

  const handleBankVerification = async (
    status: "VERIFIED" | "WARNING" | "REJECTED"
  ) => {
    if (!userDetail) return;
    setSavingBank(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/users/${userDetail.id}`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify({
          bankVerificationStatus: status,
          bankVerificationNote: bankNoteInput.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || "Failed to update bank verification");
      }

      const detailRes = await fetch(`/api/v1/admin/users/${userDetail.id}`, {
        credentials: "include",
        headers,
      });
      const detailJson = await detailRes.json();
      if (detailJson.success && detailJson.data) {
        setUserDetail(detailJson.data);
      }
      setBankNoteInput("");
      showToast(
        status === "VERIFIED"
          ? "Bank details verified"
          : status === "WARNING"
          ? "Bank name mismatch warning sent to agent"
          : "Bank details rejected and agent notified"
      );
    } catch (err: any) {
      showToast(err.message || "Failed to update bank verification");
    } finally {
      setSavingBank(false);
    }
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetail) return;
    setSavingPerms(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const wantActive = permActiveInput === "ACTIVE";
      if (wantActive !== Boolean(userDetail.isActive)) {
        await fetch(`/api/v1/admin/users/${userDetail.id}/suspend`, {
          method: "POST",
          credentials: "include",
          headers,
          body: JSON.stringify({
            isActive: wantActive,
            reason: wantActive
              ? "Reinstated by Admin"
              : "Marked dormant by Admin",
          }),
        });
      }

      if (
        userDetail.role === "AGENT" &&
        permTierInput !== userDetail.agentProfile?.tier
      ) {
        await fetch(`/api/v1/admin/users/${userDetail.id}`, {
          method: "PATCH",
          credentials: "include",
          headers,
          body: JSON.stringify({ agentTier: permTierInput }),
        });
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userDetail.id
            ? { ...u, isActive: wantActive, agentTier: permTierInput }
            : u
        )
      );
      setUserDetail((prev: any) => ({
        ...prev,
        isActive: wantActive,
        agentProfile: prev.agentProfile
          ? { ...prev.agentProfile, tier: permTierInput }
          : prev.agentProfile,
      }));
      showToast("Account permissions saved");
    } catch (err: any) {
      showToast(err.message || "Failed to save permissions");
    } finally {
      setSavingPerms(false);
    }
  };

  const agentsList = useMemo(
    () => users.filter((u) => u.role === "AGENT"),
    [users]
  );
  const endUsersList = useMemo(
    () => users.filter((u) => u.role === "USER"),
    [users]
  );

  const currentRoleList = roleTab === "AGENT" ? agentsList : endUsersList;
  const activeCount = useMemo(
    () => currentRoleList.filter((u) => u.isActive).length,
    [currentRoleList]
  );
  const dormantCount = useMemo(
    () => currentRoleList.filter((u) => !u.isActive).length,
    [currentRoleList]
  );

  const filtered = useMemo(() => {
    return currentRoleList.filter((u) => {
      if (activityTab === "ACTIVE" && !u.isActive) return false;
      if (activityTab === "DORMANT" && u.isActive) return false;
      if (kycFilter !== "ALL" && u.kycStatus !== kycFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (u.name && u.name.toLowerCase().includes(q)) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.toLowerCase().includes(q)) ||
          (u.operativeCode && u.operativeCode.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [currentRoleList, activityTab, kycFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedUsers = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const activeLabel = roleTab === "AGENT" ? "Active Agents" : "Active Users";
  const dormantLabel = roleTab === "AGENT" ? "Dormant Agents" : "Dormant Users";

  // ─── FULL DETAIL VIEW (Matches Profile & KYC / Permissions Mockup) ───
  if (selectedUserId) {
    const { docs: docsList, fields: kycFields } = extractKycArtifacts(
      userDetail?.accreditationDocuments
    );

    const activeDoc =
      docsList.find((d) => d.key === selectedDocKey) || docsList[0] || null;
    const activeDocUrl = activeDoc?.url || null;
    const isPdfDoc = Boolean(
      activeDoc?.isPdf ||
        (activeDocUrl &&
          (activeDocUrl.toLowerCase().includes(".pdf") ||
            activeDocUrl.startsWith("data:application/pdf")))
    );

    const fullName = userDetail?.name || "Unnamed User";
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "—";
    const lastName = nameParts.slice(1).join(" ") || "—";
    const initials = fullName.slice(0, 2).toUpperCase();

    const kycBadgeClass =
      userDetail?.kycStatus === "VERIFIED"
        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        : userDetail?.kycStatus === "REJECTED"
        ? "bg-red-500/15 text-red-500"
        : "bg-amber-500/20 text-amber-700 dark:text-amber-300";

    return (
      <div className="max-w-4xl mx-auto space-y-5">
        {toastMessage && (
          <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
            <div className="bg-[var(--bg-card)] border border-[var(--primary)] text-[var(--text-heading)] px-4 py-2 rounded-md shadow-lg text-xs font-semibold">
              {toastMessage}
            </div>
          </div>
        )}

        {/* Top Bar: < Back + Overview & Stats / Profile & KYC / Permissions Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedUserId(null);
              setUserDetail(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-heading)] hover:text-[var(--primary)] cursor-pointer w-fit"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-6 border-b border-[var(--border-color)] sm:border-none">
            <button
              type="button"
              onClick={() => setDetailTab("OVERVIEW")}
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                detailTab === "OVERVIEW"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              Overview &amp; Stats
            </button>
            <button
              type="button"
              onClick={() => setDetailTab("PROFILE_KYC")}
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                detailTab === "PROFILE_KYC"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              {userDetail?.role === "USER" ? "Profile & Email Verification" : "Profile & KYC"}
            </button>
            {userDetail?.role === "AGENT" && (
              <button
                type="button"
                onClick={() => setDetailTab("RATINGS_CONDUCT")}
                className={`pb-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  detailTab === "RATINGS_CONDUCT"
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                }`}
              >
                <span>Ratings &amp; Conduct</span>
                {Array.isArray(userDetail?.ratingsAndReports) &&
                  userDetail.ratingsAndReports.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] text-[10px] font-bold">
                      {userDetail.ratingsAndReports.length}
                    </span>
                  )}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDetailTab("PERMISSIONS")}
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                detailTab === "PERMISSIONS"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              Permissions
            </button>
          </div>
        </div>

        {isLoadingDetail || !userDetail ? (
          <DynamicLoadingState variant="documents" count={3} />
        ) : detailTab === "OVERVIEW" ? (
          <div className="space-y-6">
            {/* Compact Header Summary Card */}
            <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {userDetail.avatarUrl ? (
                  <img
                    src={resolveMediaPreviewUrl(userDetail.avatarUrl)}
                    alt={fullName}
                    className="w-14 h-14 rounded-full object-cover border border-[var(--border-color)] pointer-events-none"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-bold text-lg flex items-center justify-center border border-[var(--primary)]/20">
                    {initials}
                  </div>
                )}
                <div>
                  <h2 className="text-base font-bold text-[var(--text-heading)]">
                    {fullName}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {userDetail.email} · {userDetail.phone || "No phone"}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)]">
                      {userDetail.role === "AGENT"
                        ? getAgentTypeLabel(userDetail.agentProfile?.tier)
                        : userDetail.userStats?.userType || "Individual Client"}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${kycBadgeClass}`}>
                      KYC {userDetail.kycStatus}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                        userDetail.isActive
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/15 text-red-500"
                      }`}
                    >
                      {userDetail.isActive ? "Active" : "Dormant"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right text-xs">
                <p className="text-[var(--text-muted)]">Subscription Tier</p>
                <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                  <span className="font-semibold text-[var(--text-heading)]">
                    {userDetail.subscription?.plan || "Standard"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            {userDetail.role === "AGENT" ? (
              <>
                {/* Agent KPI Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
                    <p className="text-[11px] text-[var(--text-muted)]">Operative Rating</p>
                    <p className="text-xl font-bold text-[var(--text-heading)] mt-1">
                      {Number(userDetail.agentStats?.rating || 0).toFixed(1)}{" "}
                      <span className="text-xs font-medium text-amber-500">/ 5.0 ★</span>
                    </p>
                    <p className="text-[10.5px] text-[var(--text-muted)] mt-1">
                      {userDetail.agentStats?.completionRate || 0}% completion rate
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
                    <p className="text-[11px] text-[var(--text-muted)]">Tasks Completed</p>
                    <p className="text-xl font-bold text-[var(--text-heading)] mt-1">
                      {userDetail.agentStats?.completedTasks || 0}{" "}
                      <span className="text-xs font-medium text-[var(--text-muted)]">
                        / {userDetail.agentStats?.totalTasks || 0}
                      </span>
                    </p>
                    <p className="text-[10.5px] text-[var(--text-muted)] mt-1">
                      {userDetail.agentStats?.activeTasks || 0} active ·{" "}
                      {userDetail.agentStats?.disputedTasks || 0} disputed
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
                    <p className="text-[11px] text-[var(--text-muted)]">Wallet Balance</p>
                    <p className="text-xl font-bold text-[var(--primary)] mt-1">
                      {formatCurrency(userDetail.agentStats?.walletBalanceNgn || 0)}
                    </p>
                    <p className="text-[10.5px] text-[var(--text-muted)] mt-1">
                      Earned: {formatCurrency(userDetail.agentStats?.totalEarnedNgn || 0)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
                    <p className="text-[11px] text-[var(--text-muted)]">Total Paid Out</p>
                    <p className="text-xl font-bold text-[var(--text-heading)] mt-1">
                      {formatCurrency(userDetail.agentStats?.totalPaidOutNgn || 0)}
                    </p>
                    <p className="text-[10.5px] text-[var(--text-muted)] mt-1">
                      Pending: {formatCurrency(userDetail.agentStats?.pendingPayoutsNgn || 0)}
                    </p>
                  </div>
                </div>

                {/* Agent Payout History */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                    Payout History ({userDetail.payouts?.length || 0})
                  </h3>
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                    {!userDetail.payouts || userDetail.payouts.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                        No payout withdrawals recorded yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[11px] text-[var(--text-muted)]">
                            <tr>
                              <th className="px-4 py-2.5 font-semibold">Date</th>
                              <th className="px-4 py-2.5 font-semibold">Account</th>
                              <th className="px-4 py-2.5 font-semibold">Reference</th>
                              <th className="px-4 py-2.5 font-semibold">Amount</th>
                              <th className="px-4 py-2.5 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-color)]">
                            {userDetail.payouts.map((p: any) => (
                              <tr key={p.id}>
                                <td className="px-4 py-2.5 text-[var(--text-muted)]">
                                  {formatShortDate(p.createdAt)}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[var(--text-heading)]">
                                  {p.bankCode} · {p.accountNumber}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[var(--text-muted)]">
                                  {p.gatewayRef || "—"}
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-[var(--text-heading)]">
                                  {formatCurrency(p.amountNgn)}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                                      p.status === "COMPLETED"
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                        : p.status === "FAILED"
                                        ? "bg-red-500/15 text-red-500"
                                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* End User KPI Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
                    <p className="text-[11px] text-[var(--text-muted)]">Tasks Requested</p>
                    <p className="text-xl font-bold text-[var(--text-heading)] mt-1">
                      {userDetail.userStats?.tasksRequested || 0}
                    </p>
                    <p className="text-[10.5px] text-[var(--text-muted)] mt-1">
                      {userDetail.userStats?.tasksActive || 0} active ·{" "}
                      {userDetail.userStats?.tasksCancelled || 0} cancelled
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
                    <p className="text-[11px] text-[var(--text-muted)]">Successful Tasks</p>
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {userDetail.userStats?.tasksSuccessful || 0}
                    </p>
                    <p className="text-[10.5px] text-[var(--text-muted)] mt-1">
                      {userDetail.userStats?.successRate || 0}% success rate
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
                    <p className="text-[11px] text-[var(--text-muted)]">Credit Balance</p>
                    <p className="text-xl font-bold text-[var(--primary)] mt-1">
                      {userDetail.userStats?.creditBalance || 0}{" "}
                      <span className="text-xs font-medium text-[var(--text-muted)]">credits</span>
                    </p>
                    <p className="text-[10.5px] text-[var(--text-muted)] mt-1">
                      Credits spent: {userDetail.userStats?.creditsSpent || 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-4">
                    <p className="text-[11px] text-[var(--text-muted)]">Spent on Credits</p>
                    <p className="text-xl font-bold text-[var(--text-heading)] mt-1">
                      {formatCurrency(userDetail.userStats?.amountSpentOnCreditsNgn || 0)}
                    </p>
                    <p className="text-[10.5px] text-[var(--text-muted)] mt-1">
                      {userDetail.paymentHistory?.length || 0} payment records
                    </p>
                  </div>
                </div>

                {/* End User Credit & Payment History */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                    Credit Purchases &amp; Payment History ({userDetail.paymentHistory?.length || 0})
                  </h3>
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                    {!userDetail.paymentHistory || userDetail.paymentHistory.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                        No credit purchases or payment transactions yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[11px] text-[var(--text-muted)]">
                            <tr>
                              <th className="px-4 py-2.5 font-semibold">Date</th>
                              <th className="px-4 py-2.5 font-semibold">Gateway</th>
                              <th className="px-4 py-2.5 font-semibold">Reference</th>
                              <th className="px-4 py-2.5 font-semibold">Amount</th>
                              <th className="px-4 py-2.5 font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-color)]">
                            {userDetail.paymentHistory.map((p: any) => (
                              <tr key={p.id}>
                                <td className="px-4 py-2.5 text-[var(--text-muted)]">
                                  {formatShortDate(p.createdAt)}
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-[var(--text-heading)]">
                                  {p.gateway}
                                </td>
                                <td className="px-4 py-2.5 font-mono text-[var(--text-muted)]">
                                  {p.gatewayRef || "—"}
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-[var(--text-heading)]">
                                  {formatCurrency(p.amountNgn)}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                                      p.status === "CAPTURED" || p.status === "RELEASED"
                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                        : p.status === "FAILED" || p.status === "REFUNDED"
                                        ? "bg-red-500/15 text-red-500"
                                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                    }`}
                                  >
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Shared Task History Table (Agent Tasks / User Requests) */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                {userDetail.role === "AGENT" ? "Task History" : "Task Request History"} (
                {userDetail.taskHistory?.length || 0})
              </h3>
              <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
                {!userDetail.taskHistory || userDetail.taskHistory.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                    No tasks recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] text-[11px] text-[var(--text-muted)]">
                        <tr>
                          <th className="px-4 py-2.5 font-semibold">Task</th>
                          <th className="px-4 py-2.5 font-semibold">Module</th>
                          <th className="px-4 py-2.5 font-semibold">
                            {userDetail.role === "AGENT" ? "Agent Pay" : "Amount"}
                          </th>
                          <th className="px-4 py-2.5 font-semibold">Status</th>
                          <th className="px-4 py-2.5 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {userDetail.taskHistory.map((t: any) => (
                          <tr key={t.id}>
                            <td className="px-4 py-2.5">
                              <p className="font-semibold text-[var(--text-heading)]">
                                {t.title}
                              </p>
                              {t.locationAddress && (
                                <p className="text-[10.5px] text-[var(--text-muted)] truncate max-w-[220px]">
                                  {t.locationAddress}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-[var(--text-muted)]">
                              {String(t.moduleType || "").replace(/_/g, " ")}
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-[var(--text-heading)]">
                              {formatCurrency(t.amountNgn || 0)}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                                  t.status === "COMPLETED"
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : t.status === "CANCELLED" || t.status === "DISPUTED"
                                    ? "bg-red-500/15 text-red-500"
                                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                {String(t.status || "").replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-[var(--text-muted)]">
                              {formatShortDate(t.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : detailTab === "PROFILE_KYC" ? (
          <div className="space-y-6">
            {/* Personal Information Card */}
            <div className="space-y-2.5">
              <h2 className="text-sm font-semibold text-[var(--text-heading)]">
                Personal Information
              </h2>
              <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 sm:p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  {userDetail.avatarUrl ? (
                    <img
                      src={resolveMediaPreviewUrl(userDetail.avatarUrl)}
                      alt={fullName}
                      className="w-20 h-20 rounded-full object-cover border border-[var(--border-color)] pointer-events-none"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-bold text-xl flex items-center justify-center border border-[var(--primary)]/20">
                      {initials}
                    </div>
                  )}
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold ${kycBadgeClass}`}
                  >
                    KYC {userDetail.kycStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                  <div>
                    <p className="text-[var(--text-muted)] mb-1">First Name</p>
                    <p className="font-semibold text-[var(--text-heading)]">
                      {firstName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)] mb-1">Last Name</p>
                    <p className="font-semibold text-[var(--text-heading)]">
                      {lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)] mb-1">
                      {userDetail.role === "AGENT" ? "Operative ID" : "Role"}
                    </p>
                    <p className="font-semibold text-[var(--text-heading)] font-mono">
                      {userDetail.operativeCode || userDetail.role}
                    </p>
                  </div>

                  <div>
                    <p className="text-[var(--text-muted)] mb-1">Email</p>
                    <p className="font-semibold text-[var(--text-heading)] break-all">
                      {userDetail.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)] mb-1">
                      Phone Number
                    </p>
                    <p className="font-semibold text-[var(--text-heading)]">
                      {userDetail.phone || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[var(--text-muted)] mb-1">
                      Account Status
                    </p>
                    <p className="font-semibold text-[var(--text-heading)]">
                      {userDetail.isActive ? "Active" : "Dormant"}
                    </p>
                  </div>

                  {userDetail.wallet && (
                    <div>
                      <p className="text-[var(--text-muted)] mb-1">
                        Wallet Balance
                      </p>
                      <p className="font-semibold text-[var(--primary)]">
                        {formatCurrency(
                          Number(userDetail.wallet.balanceNgn || 0)
                        )}
                      </p>
                    </div>
                  )}
                  {userDetail.agentProfile && (
                    <div>
                      <p className="text-[var(--text-muted)] mb-1">
                        Agent Type / Specialty
                      </p>
                      <p className="font-semibold text-[var(--text-heading)]">
                        {getAgentTypeLabel(userDetail.agentProfile.tier)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-[var(--text-muted)] mb-1">Joined On</p>
                    <p className="font-semibold text-[var(--text-heading)]">
                      {formatShortDate(userDetail.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details & Name-Match Verification Card (Agents Only) */}
            {userDetail.role === "AGENT" && (() => {
              const bankAcctName = userDetail.agentProfile?.bankAccountName || "";
              const bankAcctNum = userDetail.agentProfile?.bankAccountNumber || "";
              const bankCode = userDetail.agentProfile?.bankCode || "";
              const hasBank = Boolean(bankAcctNum || bankAcctName);
              const bv = userDetail.bankVerification || {
                status: hasBank ? "PENDING" : "NOT_SUBMITTED",
                note: null,
                reviewedAt: null,
              };
              const nameMismatch =
                hasBank &&
                bankAcctName.trim().toLowerCase() !== fullName.trim().toLowerCase();

              const bvBadge =
                bv.status === "VERIFIED"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : bv.status === "REJECTED"
                  ? "bg-red-500/15 text-red-500"
                  : bv.status === "WARNING"
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                  : bv.status === "PENDING"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-[var(--bg-secondary)] text-[var(--text-muted)]";

              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-semibold text-[var(--text-heading)]">
                      Bank Details &amp; Name-Match Verification
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${bvBadge}`}>
                      {bv.status === "VERIFIED"
                        ? "Bank Verified"
                        : bv.status === "REJECTED"
                        ? "Bank Rejected"
                        : bv.status === "WARNING"
                        ? "Warning Sent"
                        : bv.status === "PENDING"
                        ? "Pending Review"
                        : "Not Submitted"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4">
                    {!hasBank ? (
                      <p className="text-xs text-[var(--text-muted)]">
                        Agent has not submitted payout bank account details yet.
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-[var(--text-muted)] mb-1">Bank Account Name</p>
                            <p className="font-semibold text-[var(--text-heading)]">
                              {bankAcctName || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[var(--text-muted)] mb-1">Account Number</p>
                            <p className="font-semibold font-mono text-[var(--text-heading)]">
                              {bankAcctNum || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[var(--text-muted)] mb-1">Bank Code</p>
                            <p className="font-semibold font-mono text-[var(--text-heading)]">
                              {bankCode || "—"}
                            </p>
                          </div>
                        </div>

                        {nameMismatch && (
                          <div className="rounded-md bg-amber-500/10 border border-amber-500/30 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-300">
                            <span className="font-semibold">Name Mismatch Detected:</span>{" "}
                            Bank account name (<span className="font-semibold">{bankAcctName}</span>)
                            does not exactly match the profile/KYC name (
                            <span className="font-semibold">{fullName}</span>). Verify against
                            submitted KYC documents before approving payouts.
                          </div>
                        )}

                        {bv.note && (
                          <div className="rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] px-3.5 py-2 text-xs text-[var(--text-muted)]">
                            <span className="font-semibold text-[var(--text-heading)]">
                              Last Admin Note:
                            </span>{" "}
                            {bv.note}
                          </div>
                        )}

                        <div className="space-y-2.5 pt-2 border-t border-[var(--border-color)]">
                          <label className="text-xs font-medium text-[var(--text-heading)] block">
                            Bank Verification Note / Warning to Agent
                          </label>
                          <textarea
                            rows={2}
                            value={bankNoteInput}
                            onChange={(e) => setBankNoteInput(e.target.value)}
                            placeholder="e.g. Your bank account name does not match your NIN / Passport name. Please update your bank details..."
                            className="w-full p-2.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={savingBank}
                              onClick={() => handleBankVerification("VERIFIED")}
                              className="px-3.5 h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >
                              Approve Bank Details
                            </button>
                            <button
                              type="button"
                              disabled={savingBank}
                              onClick={() => handleBankVerification("WARNING")}
                              className="px-3.5 h-8 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >
                              Send Warning to Agent
                            </button>
                            <button
                              type="button"
                              disabled={savingBank}
                              onClick={() => handleBankVerification("REJECTED")}
                              className="px-3.5 h-8 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                            >
                              Reject Bank Details
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* KYC / Email Verification Information Card */}
            <div className="space-y-2.5">
              <h2 className="text-sm font-semibold text-[var(--text-heading)]">
                {userDetail.role === "USER" ? "Email Verification" : "KYC Information"}
              </h2>
              <form
                onSubmit={handleSubmitKyc}
                className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 sm:p-6 space-y-5 text-xs"
              >
                {/* Unified Independent Collapsible Verification Sections */}
                {(() => {
                  const statusBadgeStyle = (raw: string | undefined | null) => {
                    const s = String(raw || "pending").toLowerCase();
                    if (s === "verified" || s === "approved") {
                      return {
                        label: "Verified",
                        cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        dot: "bg-emerald-500",
                        isVerified: true,
                      };
                    }
                    if (s === "rejected") {
                      return {
                        label: "Rejected",
                        cls: "bg-red-500/15 text-red-600 dark:text-red-400",
                        dot: "bg-red-500",
                        isVerified: false,
                      };
                    }
                    if (s === "submitted" || s === "reviewing") {
                      return {
                        label: "Pending Review",
                        cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                        dot: "bg-amber-500",
                        isVerified: false,
                      };
                    }
                    return {
                      label: "Pending",
                      cls: "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-color)]",
                      dot: "bg-[var(--text-muted)]",
                      isVerified: false,
                    };
                  };

                  type UnifiedSection = {
                    id: string;
                    title: string;
                    subtitle: string;
                    status: string;
                    detailValue?: string | null;
                    doc?: KycDocItem | null;
                    approvePayload: Record<string, any>;
                    rejectPayload: Record<string, any>;
                  };

                  const ninDoc =
                    docsList.find((d) =>
                      ["government_id", "nin_slip"].includes(d.key.toLowerCase())
                    ) || null;
                  const addressDoc =
                    docsList.find((d) =>
                      ["proof_of_address", "utility_bill"].includes(d.key.toLowerCase())
                    ) || null;
                  const usedDocKeys = new Set(
                    [ninDoc?.key, addressDoc?.key].filter(Boolean) as string[]
                  );

                  const bgCheckRaw =
                    userDetail.accreditationDocuments &&
                    typeof userDetail.accreditationDocuments === "object"
                      ? (userDetail.accreditationDocuments as Record<string, any>)
                          .background_check
                      : null;
                  const hasBgConsent = Boolean(
                    userDetail.consentSignedAt || bgCheckRaw?.status
                  );

                  const isEmailVerified = Boolean(
                    userDetail.accreditationDocuments?.emailVerified ||
                      userDetail.kycStatus === "VERIFIED"
                  );

                  // For End Users (role === 'USER'), only show Email Verification (no NIN, Address, or NBA KYC!)
                  const sections: UnifiedSection[] =
                    userDetail.role === "USER"
                      ? [
                          {
                            id: "email_verification",
                            title: "Email Address Verification",
                            subtitle: isEmailVerified
                              ? `${userDetail.email} · Verified${
                                  userDetail.accreditationDocuments?.emailVerifiedAt
                                    ? ` on ${formatShortDate(
                                        userDetail.accreditationDocuments.emailVerifiedAt
                                      )}`
                                    : ""
                                }`
                              : `${userDetail.email} · Awaiting 6-digit OTP confirmation`,
                            status: isEmailVerified ? "verified" : "pending",
                            detailValue: userDetail.email,
                            doc: null,
                            approvePayload: {
                              emailVerified: true,
                              kycStatus: "VERIFIED",
                            },
                            rejectPayload: {
                              emailVerified: false,
                              kycStatus: "PENDING",
                            },
                          },
                        ]
                      : [
                          {
                            id: "email_verification",
                            title: "Email Verification",
                            subtitle: isEmailVerified
                              ? `${userDetail.email} · Verified`
                              : `${userDetail.email} · Pending OTP verification`,
                            status: isEmailVerified ? "verified" : "pending",
                            detailValue: userDetail.email,
                            doc: null,
                            approvePayload: { emailVerified: true },
                            rejectPayload: { emailVerified: false },
                          },
                          {
                            id: "nin",
                            title: "NIN Verification",
                            subtitle:
                              userDetail.agentProfile?.ninId ||
                              userDetail.accreditationDocuments?.ninNumber ||
                              (ninDoc ? "ID document uploaded" : "Not submitted"),
                            status:
                              userDetail.ninVerificationStatus || ninDoc?.status || "pending",
                            detailValue:
                              userDetail.agentProfile?.ninId ||
                              userDetail.accreditationDocuments?.ninNumber ||
                              null,
                            doc: ninDoc,
                            approvePayload: {
                              ninVerificationStatus: "verified",
                              ...(ninDoc
                                ? { documentKey: ninDoc.key, documentStatus: "VERIFIED" }
                                : {}),
                            },
                            rejectPayload: {
                              ninVerificationStatus: "rejected",
                              ...(ninDoc
                                ? { documentKey: ninDoc.key, documentStatus: "REJECTED" }
                                : {}),
                            },
                          },
                          {
                            id: "address",
                            title: "Address Verification",
                            subtitle:
                              userDetail.address ||
                              userDetail.location ||
                              (addressDoc ? "Proof of address uploaded" : "Not submitted"),
                            status:
                              userDetail.addressVerificationStatus ||
                              addressDoc?.status ||
                              "pending",
                            detailValue: userDetail.address || userDetail.location || null,
                            doc: addressDoc,
                            approvePayload: {
                              addressVerificationStatus: "verified",
                              ...(addressDoc
                                ? { documentKey: addressDoc.key, documentStatus: "VERIFIED" }
                                : {}),
                            },
                            rejectPayload: {
                              addressVerificationStatus: "rejected",
                              ...(addressDoc
                                ? { documentKey: addressDoc.key, documentStatus: "REJECTED" }
                                : {}),
                            },
                          },
                          {
                            id: "nba",
                            title: `${
                              getAgentTypeOption(userDetail.agentProfile?.tier)
                                .credential.title
                            }${
                              userDetail.agentProfile?.nbaNumber ? " (NBA SCN)" : ""
                            }`,
                            subtitle:
                              userDetail.agentProfile?.nbaNumber ||
                              userDetail.accreditationDocuments?.professional_license
                                ?.metadata?.qualificationLabel ||
                              userDetail.accreditationDocuments?.investigation_certificate
                                ?.metadata?.qualificationLabel ||
                              userDetail.accreditationDocuments?.bar_practicing_license
                                ?.metadata?.qualificationLabel ||
                              userDetail.accreditationDocuments?.professional_license
                                ?.metadata?.licenseNumber ||
                              "Role-specific credential or B.Sc / HND / Equivalent",
                            status:
                              userDetail.nbaVerificationStatus !== "not_applicable"
                                ? userDetail.nbaVerificationStatus
                                : userDetail.accreditationDocuments
                                    ?.professional_license?.status ||
                                  userDetail.accreditationDocuments
                                    ?.investigation_certificate?.status ||
                                  userDetail.accreditationDocuments
                                    ?.bar_practicing_license?.status ||
                                  "pending",
                            detailValue:
                              [
                                userDetail.accreditationDocuments?.investigation_certificate
                                  ?.metadata?.qualificationLabel ||
                                  userDetail.accreditationDocuments?.bar_practicing_license
                                    ?.metadata?.qualificationLabel,
                                userDetail.accreditationDocuments?.investigation_certificate
                                  ?.metadata?.issuingBody ||
                                  userDetail.accreditationDocuments?.bar_practicing_license
                                    ?.metadata?.issuingBody,
                                userDetail.agentProfile?.nbaNumber ||
                                  userDetail.accreditationDocuments?.investigation_certificate
                                    ?.metadata?.certificateNumber ||
                                  userDetail.accreditationDocuments?.bar_practicing_license
                                    ?.metadata?.certificateNumber ||
                                  userDetail.accreditationDocuments?.professional_license
                                    ?.metadata?.licenseNumber,
                              ]
                                .filter(Boolean)
                                .join(" · ") || null,
                            doc: null,
                            approvePayload: {
                              nbaVerificationStatus: "verified",
                              documentKey: "professional_license",
                              documentStatus: "VERIFIED",
                            },
                            rejectPayload: {
                              nbaVerificationStatus: "rejected",
                              documentKey: "professional_license",
                              documentStatus: "REJECTED",
                            },
                          },
                          {
                            id: "background_check",
                            title: "Background Check & Compliance Consent",
                            subtitle: hasBgConsent
                              ? `Digital consent signed${
                                  userDetail.consentSignedAt
                                    ? ` on ${formatShortDate(userDetail.consentSignedAt)}`
                                    : ""
                                }`
                              : "Awaiting agent consent authorization",
                            status:
                              bgCheckRaw?.status ||
                              (userDetail.consentSignedAt ? "SUBMITTED" : "pending"),
                            detailValue: hasBgConsent
                              ? "Agent authorized Oversite Central Operations to conduct criminal & professional background verification."
                              : null,
                            doc: null,
                            approvePayload: {
                              documentKey: "background_check",
                              documentStatus: "VERIFIED",
                            },
                            rejectPayload: {
                              documentKey: "background_check",
                              documentStatus: "REJECTED",
                            },
                          },
                          ...docsList
                            .filter(
                              (d) =>
                                !usedDocKeys.has(d.key) &&
                                d.key.toLowerCase() !== "background_check"
                            )
                            .map((doc) => ({
                              id: `doc:${doc.key}`,
                              title: doc.label,
                              subtitle: doc.submittedAt
                                ? `Uploaded ${formatShortDate(doc.submittedAt)}`
                                : "Submitted document",
                              status: doc.status || "SUBMITTED",
                              detailValue: null,
                              doc,
                              approvePayload: {
                                documentKey: doc.key,
                                documentStatus: "VERIFIED",
                              },
                              rejectPayload: {
                                documentKey: doc.key,
                                documentStatus: "REJECTED",
                              },
                            })),
                        ];

                  const verifiedTotal = sections.filter(
                    (s) => statusBadgeStyle(s.status).isVerified
                  ).length;
                  const pct =
                    sections.length > 0
                      ? Math.round((verifiedTotal / sections.length) * 100)
                      : 0;
                  const progressTheme =
                    pct >= 100
                      ? {
                          bar: "bg-emerald-500",
                          track: "bg-emerald-500/15",
                          badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                        }
                      : pct >= 50
                      ? {
                          bar: "bg-amber-500",
                          track: "bg-amber-500/15",
                          badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                        }
                      : {
                          bar: "bg-red-500",
                          track: "bg-red-500/15",
                          badge: "bg-red-500/15 text-red-600 dark:text-red-400",
                        };

                  return (
                    <div className="space-y-4">
                      {/* Verification Progress Bar */}
                      <div className="p-3.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--text-heading)]">
                            Verification Progress
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10.5px] font-semibold ${progressTheme.badge}`}
                          >
                            {verifiedTotal}/{sections.length} Verified ({pct}%)
                          </span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${progressTheme.track} overflow-hidden`}>
                          <div
                            className={`h-full rounded-full ${progressTheme.bar} transition-all duration-300`}
                            style={{ width: `${Math.max(pct, verifiedTotal === 0 ? 4 : pct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Independent Collapsible Verification Sections */}
                      <div className="space-y-2">
                        {sections.map((sec) => {
                          const badge = statusBadgeStyle(sec.status);
                          const isOpen = expandedSection === sec.id;
                          return (
                            <div
                              key={sec.id}
                              className="rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSection(isOpen ? null : sec.id)
                                }
                                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[var(--bg-card)]/60 transition-colors cursor-pointer"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-[var(--text-heading)] truncate">
                                    {sec.title}
                                  </p>
                                  <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                                    {sec.subtitle}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2.5 shrink-0">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold ${badge.cls}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                    {badge.label}
                                  </span>
                                  <ChevronDown
                                    className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${
                                      isOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                </div>
                              </button>

                              {isOpen && (
                                <div className="px-4 pb-4 pt-3 border-t border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
                                  {sec.detailValue && (
                                    <div className="p-2.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-0.5">
                                        Submitted Value
                                      </p>
                                      <p className="text-xs font-semibold text-[var(--text-heading)] break-words">
                                        {sec.detailValue}
                                      </p>
                                    </div>
                                  )}

                                  {sec.doc ? (
                                    <div className="space-y-3">
                                      <div className="w-full rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3 flex flex-col items-center justify-center gap-2">
                                        {sec.doc.backUrl && (
                                          <span className="self-start text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                                            Front Side
                                          </span>
                                        )}
                                        <KycMediaPreview
                                          url={sec.doc.url}
                                          title={sec.title}
                                          isPdf={sec.doc.isPdf}
                                        />
                                      </div>

                                      {sec.doc.backUrl && (
                                        <div className="w-full rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] p-3 flex flex-col items-center justify-center gap-2">
                                          <span className="self-start text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                                            Back Side
                                          </span>
                                          <KycMediaPreview
                                            url={sec.doc.backUrl}
                                            title={`${sec.title} (Back)`}
                                            isPdf={sec.doc.backIsPdf}
                                          />
                                        </div>
                                      )}

                                      {sec.doc.submittedAt && (
                                        <p className="text-[10.5px] text-[var(--text-muted)] text-center">
                                          Uploaded {formatShortDate(sec.doc.submittedAt)}
                                        </p>
                                      )}
                                    </div>
                                  ) : !sec.detailValue ? (
                                    <div className="p-4 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-center text-[var(--text-muted)]">
                                      <Eye className="w-4 h-4 mx-auto opacity-40 mb-1" />
                                      <p className="text-[11px]">No file or details submitted yet.</p>
                                    </div>
                                  ) : null}

                                  <div className="flex items-center justify-end gap-2 pt-1">
                                    <button
                                      type="button"
                                      disabled={savingItemKey === sec.id}
                                      onClick={() =>
                                        handleItemVerification(
                                          sec.id,
                                          sec.rejectPayload,
                                          `${sec.title} rejected`
                                        )
                                      }
                                      className="px-3.5 h-8 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      type="button"
                                      disabled={savingItemKey === sec.id}
                                      onClick={() =>
                                        handleItemVerification(
                                          sec.id,
                                          sec.approvePayload,
                                          `${sec.title} approved`
                                        )
                                      }
                                      className="px-3.5 h-8 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer disabled:opacity-50"
                                    >
                                      Approve
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Additional Human-Readable Form Fields (Agents only) */}
                      {userDetail.role === "AGENT" && kycFields.length > 0 && (
                        <div className="pt-2 border-t border-[var(--border-color)]">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                            Additional Form Details
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {kycFields.map((f) => (
                              <div
                                key={f.key}
                                className="p-2.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                              >
                                <p className="text-[10.5px] text-[var(--text-muted)] mb-0.5">
                                  {f.label}
                                </p>
                                <p className="text-xs font-semibold text-[var(--text-heading)] break-words">
                                  {f.value}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Status Select & Leave a Note (Agents only; End users only need Email Verification above) */}
                {userDetail.role === "AGENT" && (
                  <div className="space-y-4 pt-1">
                    <div className="max-w-xs space-y-1.5">
                      <label className="text-xs font-medium text-[var(--text-heading)] block">
                        Overall KYC Status
                      </label>
                      <ResponsiveSelect
                        label="Overall KYC Status"
                        value={kycStatusInput}
                        onChange={(val) => setKycStatusInput(val)}
                        options={[
                          { value: "PENDING", label: "Pending" },
                          { value: "SUBMITTED", label: "Submitted" },
                          { value: "VERIFIED", label: "Verified (Approve All)" },
                          { value: "REJECTED", label: "Rejected" },
                        ]}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--text-heading)] block">
                        Review Note / Rejection Reason (Sent to Agent)
                      </label>
                      <textarea
                        rows={3}
                        value={kycNoteInput}
                        onChange={(e) => setKycNoteInput(e.target.value)}
                        placeholder="Enter compliance note or reason for rejection (visible on the agent's verification page and sent via notification)..."
                        className="w-full p-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingKyc}
                        className="px-5 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {savingKyc ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        ) : detailTab === "RATINGS_CONDUCT" ? (
          /* RATINGS, CLIENT REPORTS & DISCIPLINARY / ESCALATION TAB (AGENTS) */
          <div className="space-y-6">
            {/* 7-Day Matured Credibility Score & Rating Summary */}
            <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-[var(--text-heading)]">
                  Operative Credibility &amp; 7-Day Matured Rating Score
                </h2>
                <p className="text-xs text-[var(--text-muted)] max-w-xl leading-relaxed">
                  Reflects explicit client task ratings, 7-day post-completion uncontested good-standing credits (+5.0 ★), and client issue reports / disputes.
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-[var(--primary)]">
                    {Number(userDetail.agentStats?.rating || 5).toFixed(2)} ★
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {userDetail.agentStats?.completionRate || 100}% completion ·{" "}
                    {userDetail.agentStats?.disputedTasks || 0} disputes
                  </p>
                </div>
              </div>
            </div>

            {/* Client Ratings & Issue Reports Feed */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                Client Ratings, 7-Day Matured Credits &amp; Issue Reports (
                {userDetail.ratingsAndReports?.length || 0})
              </h3>
              <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)]">
                {!userDetail.ratingsAndReports ||
                userDetail.ratingsAndReports.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                    No client ratings, 7-day auto-verified credits, or issue reports recorded for this operative yet.
                  </div>
                ) : (
                  userDetail.ratingsAndReports.map((item: any) => {
                    const isIssue =
                      item.kind === "ISSUE_REPORT" ||
                      (item.rating !== null && item.rating <= 2);
                    const isAuto = item.kind === "AUTO_GOOD_STANDING";
                    return (
                      <div
                        key={item.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isIssue
                                  ? "bg-red-500/15 text-red-500"
                                  : isAuto
                                  ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {item.kind === "ISSUE_REPORT"
                                ? "CLIENT ISSUE REPORT"
                                : isAuto
                                ? "7-DAY MATURED GOOD STANDING"
                                : `CLIENT RATING · ${item.rating}/5 ★`}
                            </span>
                            <span className="font-semibold text-[var(--text-heading)]">
                              {item.taskTitle}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)]">
                              ({String(item.moduleType || "").replace(/_/g, " ")})
                            </span>
                          </div>
                          <p className="text-[var(--text-body)] leading-relaxed">
                            {item.comment}
                          </p>
                        </div>
                        <span className="text-[11px] text-[var(--text-muted)] shrink-0">
                          {formatShortDate(item.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Admin Disciplinary Action, Revolving Probation & Specialist Escalation Form */}
            <div className="space-y-2.5">
              <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                Issue Warning, Revolving Probation, or Escalate to Specialist Admin
              </h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSavingDisc(true);
                  try {
                    const token =
                      typeof window !== "undefined"
                        ? localStorage.getItem("oversite_token")
                        : null;
                    const headers: Record<string, string> = {
                      "Content-Type": "application/json",
                    };
                    if (token) headers["Authorization"] = `Bearer ${token}`;

                    const res = await fetch(`/api/v1/admin/users/${userDetail.id}`, {
                      method: "PATCH",
                      credentials: "include",
                      headers,
                      body: JSON.stringify({
                        disciplinaryAction: {
                          actionType: discActionType,
                          targetDepartment: discTargetDept,
                          note: discNote.trim(),
                        },
                      }),
                    });
                    const json = await res.json();
                    if (!json.success) {
                      throw new Error(json.error?.message || "Failed to execute action");
                    }
                    const detailRes = await fetch(
                      `/api/v1/admin/users/${userDetail.id}`,
                      { credentials: "include", headers }
                    );
                    const detailJson = await detailRes.json();
                    if (detailJson.success && detailJson.data) {
                      setUserDetail(detailJson.data);
                    }
                    setDiscNote("");
                    showToast(
                      discActionType === "ISSUE_WARNING"
                        ? "Official warning issued and sent to operative"
                        : discActionType === "REVOLVING_PROBATION"
                        ? "Operative placed on revolving QA probation"
                        : discActionType === "ESCALATE_SPECIALIST"
                        ? `Escalated to ${discTargetDept}`
                        : "Operative suspended pending investigation"
                    );
                  } catch (err: any) {
                    showToast(err.message || "Failed to record disciplinary action");
                  } finally {
                    setSavingDisc(false);
                  }
                }}
                className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-heading)] block">
                      Action Type
                    </label>
                    <ResponsiveSelect
                      label="Select Disciplinary or Escalation Action"
                      value={discActionType}
                      onChange={(val) => setDiscActionType(val)}
                      options={[
                        {
                          value: "ISSUE_WARNING",
                          label: "Issue Official Warning to Operative",
                          description: "Sends a formal compliance warning notification & email to the agent",
                        },
                        {
                          value: "REVOLVING_PROBATION",
                          label: "Proceed to Revolving QA Action (14-Day Probation)",
                          description: "Flags the agent for mandatory deliverable audit on their next 3 tasks",
                        },
                        {
                          value: "ESCALATE_SPECIALIST",
                          label: "Escalate to Specialized Admin Desk",
                          description: "Routes the case to Legal, Quality Control, or Senior Operations Admin",
                        },
                        {
                          value: "SUSPEND_OPERATIVE",
                          label: "Suspend Operative Account Immediately",
                          description: "Freezes task dispatch while under investigation",
                        },
                      ]}
                    />
                  </div>

                  {discActionType === "ESCALATE_SPECIALIST" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[var(--text-heading)] block">
                        Target Specialist Admin Desk
                      </label>
                      <ResponsiveSelect
                        label="Select Target Specialist Admin Desk"
                        value={discTargetDept}
                        onChange={(val) => setDiscTargetDept(val)}
                        options={[
                          {
                            value: "Quality Control & Field Audit Admin",
                            label: "Quality Control & Field Audit Admin",
                          },
                          {
                            value: "Legal & Statutory Compliance Admin",
                            label: "Legal & Statutory Compliance Admin",
                          },
                          {
                            value: "Financial & Escrow Dispute Admin",
                            label: "Financial & Escrow Dispute Admin",
                          },
                          {
                            value: "Super Admin / Executive Operations",
                            label: "Super Admin / Executive Operations",
                          },
                        ]}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-heading)] block">
                    Directive / Warning Message / Escalation Brief
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={discNote}
                    onChange={(e) => setDiscNote(e.target.value)}
                    placeholder="Specify the task discrepancy, client report summary, required corrective action, or specialist escalation instructions..."
                    className="w-full p-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingDisc}
                    className="px-5 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {savingDisc ? "Processing..." : "Execute Action"}
                  </button>
                </div>
              </form>
            </div>

            {/* Disciplinary & Escalation Audit Log */}
            {Array.isArray(userDetail.disciplinaryLog) &&
              userDetail.disciplinaryLog.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                    Disciplinary &amp; Escalation History ({userDetail.disciplinaryLog.length})
                  </h3>
                  <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] text-xs">
                    {userDetail.disciplinaryLog.map((entry: any) => (
                      <div key={entry.id} className="p-4 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[var(--text-heading)]">
                            {String(entry.actionType || "").replace(/_/g, " ")}
                            {entry.targetDepartment ? ` → ${entry.targetDepartment}` : ""}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            {formatShortDate(entry.createdAt)}
                          </span>
                        </div>
                        <p className="text-[var(--text-body)]">{entry.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ) : (
          /* PERMISSIONS TAB */
          <div className="space-y-2.5">
            <h2 className="text-sm font-semibold text-[var(--text-heading)]">
              Account Permissions
            </h2>
            <form
              onSubmit={handleSavePermissions}
              className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 sm:p-6 space-y-6"
            >
              <div className="flex items-start justify-between gap-4">
                {userDetail.avatarUrl ? (
                  <img
                    src={userDetail.avatarUrl}
                    alt={fullName}
                    className="w-20 h-20 rounded-full object-cover border border-[var(--border-color)] pointer-events-none"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-bold text-xl flex items-center justify-center border border-[var(--primary)]/20">
                    {initials}
                  </div>
                )}
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold ${kycBadgeClass}`}
                >
                  KYC {userDetail.kycStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-heading)] block">
                    Account Status
                  </label>
                  <ResponsiveSelect
                    label="Account Status"
                    value={permActiveInput}
                    onChange={(val) =>
                      setPermActiveInput(val as "ACTIVE" | "DORMANT")
                    }
                    options={[
                      { value: "ACTIVE", label: "Active" },
                      { value: "DORMANT", label: "Dormant (Suspended)" },
                    ]}
                  />
                </div>

                {userDetail.role === "AGENT" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--text-heading)] block">
                      Agent Type / Specialization (Admin Override)
                    </label>
                    <ResponsiveSelect
                      label="Agent Type / Specialization"
                      value={permTierInput}
                      onChange={(val) => setPermTierInput(val)}
                      options={CANONICAL_AGENT_TYPES.map((t) => ({
                        value: t.tierCode,
                        label: t.label,
                        description: t.description,
                      }))}
                    />
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Initially set from agent signup (locked for the agent).
                      Override here if a role change is requested or after KYC
                      review.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingPerms}
                  className="px-5 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {savingPerms ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ─── LIST VIEW ───
  return (
    <div className="space-y-4">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[var(--bg-card)] border border-[var(--primary)] text-[var(--text-heading)] px-4 py-2 rounded-md shadow-lg text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      {/* Role Switcher: Field Agents vs End Users */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] p-1 w-fit">
          <button
            type="button"
            onClick={() => setRoleTab("AGENT")}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              roleTab === "AGENT"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
            }`}
          >
            <span>Field Agents</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                roleTab === "AGENT"
                  ? "bg-white/20 text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
              }`}
            >
              {agentsList.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRoleTab("USER")}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              roleTab === "USER"
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
            }`}
          >
            <span>End Users</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                roleTab === "USER"
                  ? "bg-white/20 text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
              }`}
            >
              {endUsersList.length}
            </span>
          </button>
        </div>

        {/* Mobile Search & Filters Bar */}
        <div className="flex md:hidden items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="h-9 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-heading)] flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Directory Card */}
      <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
        <div className="px-4 sm:px-6 pt-4 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActivityTab("ACTIVE")}
              className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activityTab === "ACTIVE"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              <span>{activeLabel}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activityTab === "ACTIVE"
                    ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                }`}
              >
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActivityTab("DORMANT")}
              className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                activityTab === "DORMANT"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              <span>{dormantLabel}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activityTab === "DORMANT"
                    ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                }`}
              >
                {dormantCount}
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-3 pb-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`h-9 px-3 rounded-md border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                showFilters || kycFilter !== "ALL"
                  ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
                  : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-heading)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="px-4 sm:px-6 py-3 bg-[var(--bg-secondary)]/60 border-b border-[var(--border-color)] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-[var(--text-muted)] mr-1">
              KYC Status:
            </span>
            {["ALL", "PENDING", "SUBMITTED", "VERIFIED", "REJECTED"].map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setKycFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                    kycFilter === st
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        )}

        {isLoading ? (
          <div className="p-6">
            <DynamicLoadingState variant="documents" count={4} />
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="p-10 text-center text-xs text-[var(--text-muted)]">
            No {activityTab.toLowerCase()}{" "}
            {roleTab === "AGENT" ? "agents" : "users"} match your current search
            or filter.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[11px] font-semibold text-[var(--text-muted)]">
                    <th className="py-3.5 px-6">Full Name</th>
                    <th className="py-3.5 px-4">
                      {roleTab === "AGENT" ? "Operative ID" : "KYC Status"}
                    </th>
                    <th className="py-3.5 px-4">Phone Number</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Created on</th>
                    <th className="py-3.5 px-6 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-xs">
                  {paginatedUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-[var(--bg-secondary)]/40 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-medium text-[var(--text-heading)]">
                        {u.name || "Unnamed"}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)]">
                        {roleTab === "AGENT" ? (
                          <span className="font-mono text-[11px] text-[var(--primary)] font-semibold">
                            {u.operativeCode || "OS-AGENT"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] font-semibold">
                            {u.kycStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-heading)]">
                        {u.phone || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-heading)]">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)]">
                        {formatShortDate(u.createdAt)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => openUserDetail(u.id)}
                          className="px-3.5 py-1.5 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-xs font-medium text-[var(--text-heading)] transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-[var(--border-color)]">
              {paginatedUsers.map((u) => (
                <div key={u.id} className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-muted)]">Full Name</span>
                    <span className="font-semibold text-[var(--text-heading)]">
                      {u.name || "Unnamed"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-muted)]">
                      {roleTab === "AGENT" ? "Operative ID" : "KYC Status"}
                    </span>
                    <span className="font-medium text-[var(--text-heading)]">
                      {roleTab === "AGENT"
                        ? u.operativeCode || "OS-AGENT"
                        : u.kycStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-muted)]">Email</span>
                    <span className="text-[var(--text-heading)] truncate max-w-[65%]">
                      {u.email}
                    </span>
                  </div>
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => openUserDetail(u.id)}
                      className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-center gap-4 text-xs">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1.5 text-[var(--text-heading)] hover:text-[var(--primary)] disabled:opacity-40 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(0, 7)
                  .map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                        currentPage === pageNum
                          ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                          : "text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="inline-flex items-center gap-1.5 text-[var(--text-heading)] hover:text-[var(--primary)] disabled:opacity-40 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
