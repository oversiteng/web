"use client";

import { useState, useEffect } from "react";
import { Users, Search, Check, X, Shield, Eye, Filter } from "lucide-react";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";

interface AdminUserItem {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  kycStatus: string;
  ninVerificationStatus: string | null;
  nbaVerificationStatus: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersKycPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadUsers() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const url = roleFilter !== "ALL" ? `/api/v1/admin/users?role=${roleFilter}` : `/api/v1/admin/users`;
        const res = await fetch(url, { credentials: "include", headers });
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
  }, [roleFilter]);

  const handleApproveKyc = async (id: string, name: string | null) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
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
        showToast(`KYC successfully approved for ${name || "User"}`);
      } else {
        showToast(json.error?.message || "Failed to verify user");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to verify user");
    }
  };

  const handleToggleSuspend = async (id: string, currentActive: boolean) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/v1/admin/users/${id}/suspend`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ reason: currentActive ? "Administrative suspension" : "Reinstated" }),
      });

      const json = await res.json();
      if (json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, isActive: !currentActive } : u))
        );
        showToast(currentActive ? "User suspended" : "User reinstated");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update suspension status");
    }
  };

  const filtered = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-semibold">
            {toastMessage}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-red-500" />
            User & Agent Directory (KYC Verification)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review government ID cards, National Identity Numbers (NIN), and NBA Supreme Court enrollments.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone number..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter users by role"
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-500"
        >
          <option value="ALL">All Roles</option>
          <option value="AGENT">Field Agents</option>
          <option value="USER">Clients</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <DynamicLoadingState variant="documents" count={4} />
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 rounded-2xl bg-slate-900/40 border border-slate-800">
          No registered users found matching the query.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">KYC Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{u.name || "Unnamed"}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                    {u.phone && <div className="text-[10px] text-slate-500">{u.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === "AGENT"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : u.role === "ADMIN"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.kycStatus === "VERIFIED"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : u.kycStatus === "SUBMITTED"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {u.kycStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {u.kycStatus !== "VERIFIED" && (
                        <button
                          onClick={() => handleApproveKyc(u.id, u.name)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>Verify KYC</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleSuspend(u.id, u.isActive)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          u.isActive
                            ? "bg-red-500/10 hover:bg-red-500/20 text-red-400"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
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
    </div>
  );
}
