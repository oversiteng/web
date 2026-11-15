"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Check,
  X,
  Eye,
  ShieldCheck,
  FileText,
  Award,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

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

export default function AdminUsersKycPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [kycFilter, setKycFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Slide-over Dossier Drawer state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [rejectionInput, setRejectionInput] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const params = new URLSearchParams();
        if (roleFilter !== "ALL") params.set("role", roleFilter);
        if (kycFilter !== "ALL") params.set("kycStatus", kycFilter);

        const res = await fetch(`/api/v1/admin/users?${params.toString()}`, {
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
  }, [roleFilter, kycFilter]);

  const openUserDossier = async (id: string) => {
    setSelectedUserId(id);
    setIsLoadingDetail(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/users/${id}`, {
        credentials: "include",
        headers,
      });
      const json = await res.json();
      if (json.success) {
        setUserDetail(json.data);
      }
    } catch {
      showToast("Failed to load user dossier");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleApproveKyc = async (id: string, name: string | null) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/users/${id}/verify`, {
        method: "POST",
        credentials: "include",
        headers,
      });

      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, kycStatus: "VERIFIED" } : u))
        );
        if (userDetail?.id === id) {
          setUserDetail((prev: any) => ({ ...prev, kycStatus: "VERIFIED" }));
        }
        showToast(`KYC verified for ${name || "User"}`);
      } else {
        showToast(json.error?.message || "Failed to verify user");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to verify user");
    }
  };

  const handleUpdateUserPatch = async (id: string, payload: Record<string, any>) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers,
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  ...(payload.kycStatus ? { kycStatus: payload.kycStatus } : {}),
                  ...(payload.agentTier ? { agentTier: payload.agentTier } : {}),
                }
              : u
          )
        );
        openUserDossier(id);
        showToast(json.message || "Profile updated");
      } else {
        showToast(json.error?.message || "Update failed");
      }
    } catch (err: any) {
      showToast(err.message || "Update error");
    }
  };

  const handleToggleSuspend = async (id: string, currentActive: boolean) => {
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/users/${id}/suspend`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          isActive: !currentActive,
          reason: currentActive ? "Administrative suspension" : "Reinstated by Admin",
        }),
      });

      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, isActive: !currentActive } : u))
        );
        if (userDetail?.id === id) {
          setUserDetail((prev: any) => ({ ...prev, isActive: !currentActive }));
        }
        showToast(currentActive ? "Account suspended" : "Account reinstated");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update account status");
    }
  };

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q)) ||
      (u.operativeCode && u.operativeCode.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-[var(--bg-card)] border border-[var(--primary-border)] text-[var(--text-heading)] px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-heading)] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--primary)]" />
            User & Operative Directory (KYC & Tier Vault)
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Audit 6-point KYC accreditation documents, NIN/NBA credentials, anonymized OS-IDs, and operative tiers.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, or OS-123ABC code..."
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter users by role"
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="ALL">All Roles</option>
          <option value="AGENT">Field Operatives (AGENT)</option>
          <option value="USER">End Users (CLIENT)</option>
          <option value="ADMIN">Admins</option>
        </select>

        <select
          value={kycFilter}
          onChange={(e) => setKycFilter(e.target.value)}
          aria-label="Filter users by KYC status"
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs font-medium text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="ALL">All KYC Statuses</option>
          <option value="SUBMITTED">Submitted (Awaiting Review)</option>
          <option value="PENDING">Pending Upload</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <DynamicLoadingState variant="documents" count={4} />
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--text-muted)] rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          No registered users found matching the query.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-xs">
          <table className="w-full text-left text-xs text-[var(--text-body)]">
            <thead className="bg-[var(--bg-secondary)] text-[11px] uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-color)]">
              <tr>
                <th className="px-4 py-3 font-semibold">User / Operative ID</th>
                <th className="px-4 py-3 font-semibold">Role & Tier</th>
                <th className="px-4 py-3 font-semibold">KYC Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-[var(--bg-secondary)]/60 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.operativeCode && (
                        <span className="px-2 py-0.5 rounded bg-[var(--primary-light)] text-[var(--primary)] font-mono font-bold text-[10px]">
                          {u.operativeCode}
                        </span>
                      )}
                      <span className="font-semibold text-[var(--text-heading)]">
                        {u.name || "Unnamed"}
                      </span>
                      {!u.isActive && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-500 text-[9px] font-bold">
                          SUSPENDED
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">{u.email}</div>
                    {u.phone && (
                      <div className="text-[10px] text-[var(--text-muted)]">{u.phone}</div>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === "AGENT"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : u.role === "ADMIN" || u.role === "SUPER_ADMIN"
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                              : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        }`}
                      >
                        {u.role}
                      </span>
                      {u.role === "AGENT" && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)]">
                          {u.agentTier || "GENERAL"}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        u.kycStatus === "VERIFIED"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : u.kycStatus === "SUBMITTED"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : u.kycStatus === "REJECTED"
                              ? "bg-red-500/15 text-red-600 dark:text-red-400"
                              : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                      }`}
                    >
                      {u.kycStatus}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {new Date(u.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openUserDossier(u.id)}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] hover:bg-[var(--primary-light)] text-[var(--text-heading)] border border-[var(--border-color)] text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3 text-[var(--primary)]" />
                        <span>Inspect KYC</span>
                      </button>

                      {u.kycStatus !== "VERIFIED" && (
                        <button
                          type="button"
                          onClick={() => handleApproveKyc(u.id, u.name)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Verify</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleSuspend(u.id, u.isActive)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          u.isActive
                            ? "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {u.isActive ? "Suspend" : "Reinstate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-Over KYC & Operative Dossier Drawer */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-[var(--bg-card)] border-l border-[var(--border-color)] h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-heading)] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--primary)]" />
                  <span>Identity & KYC Accreditation Dossier</span>
                </h2>
                {userDetail?.operativeCode && (
                  <p className="text-xs text-[var(--primary)] font-mono font-bold mt-0.5">
                    Client-Facing ID: {userDetail.operativeCode}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUserId(null);
                  setUserDetail(null);
                }}
                className="p-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingDetail || !userDetail ? (
              <DynamicLoadingState variant="documents" count={3} />
            ) : (
              <div className="space-y-6">
                {/* Identity Summary */}
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Full Name</span>
                    <span className="font-bold text-[var(--text-heading)]">
                      {userDetail.name || "Unnamed"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Email</span>
                    <span className="font-semibold text-[var(--text-heading)]">
                      {userDetail.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Phone</span>
                    <span className="font-semibold text-[var(--text-heading)]">
                      {userDetail.phone || "Not provided"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Location / State</span>
                    <span className="font-semibold text-[var(--text-heading)]">
                      {userDetail.state || userDetail.location || "Nigeria"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">NIN / NBA Status</span>
                    <span className="font-mono font-semibold text-[var(--primary)]">
                      NIN: {userDetail.ninVerificationStatus} · NBA:{" "}
                      {userDetail.nbaVerificationStatus}
                    </span>
                  </div>
                </div>

                {/* Operative Tier & Wallet Summary */}
                {userDetail.role === "AGENT" && (
                  <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-heading)] flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[var(--primary)]" />
                        Operative Tier Classification
                      </span>
                      <select
                        value={userDetail.agentProfile?.tier || "GENERAL"}
                        onChange={(e) =>
                          handleUpdateUserPatch(userDetail.id, {
                            agentTier: e.target.value,
                          })
                        }
                        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--primary)]"
                      >
                        {AGENT_TIERS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {userDetail.wallet && (
                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)] text-xs">
                        <span className="text-[var(--text-muted)] flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5 text-[var(--primary)]" />
                          Wallet Balance / Total Earned
                        </span>
                        <span className="font-bold text-[var(--text-heading)]">
                          {formatCurrency(userDetail.wallet.balanceNgn)} /{" "}
                          {formatCurrency(userDetail.wallet.totalEarnedNgn)}
                        </span>
                      </div>
                    )}

                    {userDetail.agentProfile?.bankAccountNumber && (
                      <div className="text-[11px] text-[var(--text-muted)]">
                        Settlement Bank: {userDetail.agentProfile.bankAccountName} (
                        {userDetail.agentProfile.bankAccountNumber})
                      </div>
                    )}
                  </div>
                )}

                {/* Uploaded Accreditation Documents */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Uploaded KYC & Accreditation Artifacts
                  </h3>

                  {Object.keys(userDetail.accreditationDocuments || {}).length === 0 ? (
                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-muted)]">
                      No accreditation documents uploaded yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(userDetail.accreditationDocuments).map(
                        ([docKey, docVal]: [string, any]) => {
                          if (!docVal || typeof docVal !== "object") return null;
                          return (
                            <div
                              key={docKey}
                              className="p-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-[var(--text-heading)] uppercase flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-[var(--primary)]" />
                                  {docKey.replace(/_/g, " ")}
                                </p>
                                <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                                  {docVal.fileName || docVal.documentUrl || "Uploaded artifact"} · Status:{" "}
                                  <strong>{docVal.status || "SUBMITTED"}</strong>
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {docVal.documentUrl && (
                                  <a
                                    href={docVal.documentUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] font-semibold text-[var(--primary)]"
                                  >
                                    View
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleUpdateUserPatch(userDetail.id, {
                                      documentKey: docKey,
                                      documentStatus: "VERIFIED",
                                    })
                                  }
                                  className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold cursor-pointer"
                                >
                                  Approve
                                </button>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* Master KYC Decision Footer */}
                <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-3">
                  <label className="block text-xs font-semibold text-[var(--text-heading)]">
                    KYC Decision / Rejection Note
                  </label>
                  <input
                    type="text"
                    value={rejectionInput}
                    onChange={(e) => setRejectionInput(e.target.value)}
                    placeholder="Reason if rejecting KYC (sent to operative)..."
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-heading)]"
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateUserPatch(userDetail.id, {
                          kycStatus: "REJECTED",
                          rejectionReason: rejectionInput,
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold cursor-pointer"
                    >
                      Reject KYC
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApproveKyc(userDetail.id, userDetail.name)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify Full KYC</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
