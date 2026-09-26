"use client";

import { useState } from "react";
import { Users, Search, Check, X, Shield, Eye, Filter } from "lucide-react";

export default function AdminUsersKycPage() {
  const [users, setUsers] = useState([
    {
      id: "u-1",
      name: "Engr. Babajide Sanusi",
      email: "babajide@oversite.ng",
      role: "AGENT",
      tier: "TECHNICAL_SUPERVISOR",
      nin: "88291048192",
      nba: "N/A",
      kycStatus: "SUBMITTED",
      joinedAt: "Sept 20, 2026",
    },
    {
      id: "u-2",
      name: "Barr. Adebayo Adeleke",
      email: "adebayo@lexpartners.ng",
      role: "AGENT",
      tier: "LEGAL_COUNSEL",
      nin: "19284019284",
      nba: "NBA/LAG/2014/0982",
      kycStatus: "VERIFIED",
      joinedAt: "Sept 10, 2026",
    },
    {
      id: "u-3",
      name: "Chukwuma Obi",
      email: "chukwuma.obi@gmail.com",
      role: "USER",
      tier: "CLIENT",
      nin: "39201948190",
      nba: "N/A",
      kycStatus: "VERIFIED",
      joinedAt: "Aug 15, 2026",
    },
  ]);

  const handleApproveKyc = (id: string) => {
    setUsers(users.map((u) => (u.id === id ? { ...u, kycStatus: "VERIFIED" } : u)));
    alert(`KYC approved for ${id}`);
  };

  return (
    <div className="space-y-6">
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
            placeholder="Search by name, email, NIN, or NBA number..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">User / Legal Name</th>
                <th className="py-3.5 px-4 font-semibold">Role & Tier</th>
                <th className="py-3.5 px-4 font-semibold">NIN / Credentials</th>
                <th className="py-3.5 px-4 font-semibold">KYC Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{u.name}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-200">{u.role}</span>
                    <span className="block text-[10px] text-slate-400">{u.tier}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-300">NIN: {u.nin}</div>
                    {u.nba !== "N/A" && (
                      <div className="text-cyan-400 font-mono text-[10px]">{u.nba}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.kycStatus === "VERIFIED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : u.kycStatus === "SUBMITTED"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {u.kycStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {u.kycStatus === "SUBMITTED" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleApproveKyc(u.id)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                          title="Approve KYC"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => alert(`Rejecting KYC for ${u.id}`)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Reject KYC"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500">Verified</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
