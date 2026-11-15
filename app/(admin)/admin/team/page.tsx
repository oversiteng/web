"use client";

import React, { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import {
  ADMIN_DEPARTMENTS,
  AdminDepartment,
  AdminPolicy,
  DepartmentDefinition,
} from "@/lib/auth/adminPermissions";
import {
  ShieldCheck,
  UserPlus,
  CheckCircle2,
  Clock,
  Ban,
  Trash2,
  KeyRound,
  Building2,
  Lock,
  RefreshCw,
  AlertTriangle,
  Settings2,
  Mail,
} from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  title?: string | null;
  role: "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  adminPolicy: AdminPolicy;
  createdAt: string;
}

const ALL_MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tasks", label: "Logistics & Tasks" },
  { id: "chat", label: "Task Chat Moderation" },
  { id: "support", label: "CRS Live Support" },
  { id: "users", label: "Users & KYC Compliance" },
  { id: "reports", label: "QA & Vault Dossiers" },
  { id: "finance", label: "Revenue & Settlements" },
  { id: "communications", label: "Email & Content" },
  { id: "settings", label: "Platform Settings" },
];

export default function AdminTeamGovernancePage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<DepartmentDefinition[]>(
    Object.values(ADMIN_DEPARTMENTS)
  );
  const [summary, setSummary] = useState({
    totalStaff: 0,
    superAdmins: 0,
    pendingPassword: 0,
    pendingApproval: 0,
    activeApproved: 0,
    suspended: 0,
  });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Create Admin Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "SUPER_ADMIN">("ADMIN");
  const [newDept, setNewDept] = useState<AdminDepartment>("ADMINISTRATIVE");
  const [newCanRead, setNewCanRead] = useState(true);
  const [newCanWrite, setNewCanWrite] = useState(true);
  const [newCanDelete, setNewCanDelete] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit / Approve Admin Modal State
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editDept, setEditDept] = useState<AdminDepartment>("ADMINISTRATIVE");
  const [editCanRead, setEditCanRead] = useState(true);
  const [editCanWrite, setEditCanWrite] = useState(true);
  const [editCanDelete, setEditCanDelete] = useState(false);
  const [editModules, setEditModules] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get("/api/v1/admin/team");
      const data = res?.data || res;
      if (Array.isArray(data?.staff)) setStaff(data.staff);
      if (Array.isArray(data?.departments)) setDepartments(data.departments);
      if (data?.summary) setSummary(data.summary);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text:
          err?.message ||
          "Only Super Admins can manage administrative staff and department privileges.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFeedback(null);
    try {
      const deptDef = ADMIN_DEPARTMENTS[newDept];
      const res: any = await apiClient.post("/api/v1/admin/team", {
        name: newName,
        email: newEmail,
        phone: newPhone || undefined,
        role: newRole,
        department: newDept,
        canRead: newCanRead,
        canWrite: newCanWrite,
        canDelete: newCanDelete,
        allowedModules: deptDef.defaultModules,
      });

      setFeedback({
        type: "success",
        text:
          res?.message ||
          `Admin account created and temporary credentials dispatched to ${newEmail}.`,
      });
      setShowCreateModal(false);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      await loadTeam();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to create admin account.",
      });
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (member: StaffMember) => {
    setEditingMember(member);
    setEditDept(member.adminPolicy.department);
    setEditCanRead(member.adminPolicy.canRead);
    setEditCanWrite(member.adminPolicy.canWrite);
    setEditCanDelete(member.adminPolicy.canDelete);
    setEditModules(member.adminPolicy.allowedModules || ["dashboard"]);
  };

  const handleEditDepartmentChange = (dept: AdminDepartment) => {
    setEditDept(dept);
    const def = ADMIN_DEPARTMENTS[dept];
    if (def) {
      setEditModules(def.defaultModules);
    }
  };

  const toggleModule = (modId: string) => {
    if (modId === "dashboard") return;
    setEditModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

  const handleSaveOrApprove = async (action: "APPROVE" | "UPDATE_PRIVILEGES") => {
    if (!editingMember) return;
    setSavingEdit(true);
    setFeedback(null);
    try {
      const res: any = await apiClient.patch(
        `/api/v1/admin/team/${editingMember.id}`,
        {
          action,
          department: editDept,
          canRead: editCanRead,
          canWrite: editCanWrite,
          canDelete: editCanDelete,
          allowedModules: editModules,
        }
      );
      setFeedback({
        type: "success",
        text: res?.message || "Admin privileges updated.",
      });
      setEditingMember(null);
      await loadTeam();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to update admin privileges.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleQuickAction = async (
    member: StaffMember,
    action: "APPROVE" | "SUSPEND" | "REINSTATE" | "RESET_CREDENTIALS"
  ) => {
    setFeedback(null);
    try {
      const res: any = await apiClient.patch(
        `/api/v1/admin/team/${member.id}`,
        { action }
      );
      setFeedback({
        type: "success",
        text: res?.message || `Action ${action} completed.`,
      });
      await loadTeam();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || `Failed to execute ${action}.`,
      });
    }
  };

  const handleDeleteAdmin = async (member: StaffMember) => {
    if (
      !window.confirm(
        `Permanently delete admin account for ${member.name} (${member.email})?`
      )
    ) {
      return;
    }
    setFeedback(null);
    try {
      const res: any = await apiClient.delete(`/api/v1/admin/team/${member.id}`);
      setFeedback({
        type: "success",
        text: res?.message || "Admin account removed.",
      });
      await loadTeam();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to delete admin account.",
      });
    }
  };

  if (user && user.role !== "SUPER_ADMIN") {
    return (
      <div className="p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-3">
        <Lock className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-[var(--text-heading)]">
          Executive Super Admin Access Required
        </h2>
        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
          Only the Super Admin can provision administrators, approve onboarding,
          and assign departmental Read/Write/Delete privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin Governance
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">
            Admin Team, Departments &amp; Access Control
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Create departmental admins, email temporary credentials, approve
            post-password-setup accounts, and govern Read/Write/Delete access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadTeam}
            className="px-3.5 py-2.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] text-xs font-semibold flex items-center gap-2 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Create Admin &amp; Email Credentials
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-500"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <p className="text-[11px] text-[var(--text-muted)]">Total Staff</p>
          <p className="text-xl font-bold text-[var(--text-heading)] mt-1">
            {summary.totalStaff}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <p className="text-[11px] text-[var(--text-muted)]">Super Admins</p>
          <p className="text-xl font-bold text-[var(--primary)] mt-1">
            {summary.superAdmins}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <p className="text-[11px] text-[var(--text-muted)]">
            1. Awaiting Password
          </p>
          <p className="text-xl font-bold text-blue-500 mt-1">
            {summary.pendingPassword}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-amber-500/30">
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            2. Awaiting Approval
          </p>
          <p className="text-xl font-bold text-amber-500 mt-1">
            {summary.pendingApproval}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <p className="text-[11px] text-[var(--text-muted)]">
            3. Approved &amp; Active
          </p>
          <p className="text-xl font-bold text-emerald-500 mt-1">
            {summary.activeApproved}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]">
          <p className="text-[11px] text-[var(--text-muted)]">Suspended</p>
          <p className="text-xl font-bold text-red-500 mt-1">
            {summary.suspended}
          </p>
        </div>
      </div>

      {/* Department Matrix Overview */}
      <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-5">
        <h2 className="text-sm font-bold text-[var(--text-heading)] mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[var(--primary)]" />
          Departmental RBAC Matrix &amp; Zero-Exfiltration Policy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {departments
            .filter((d) => d.key !== "EXECUTIVE")
            .map((dept) => (
              <div
                key={dept.key}
                className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-1.5"
              >
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold uppercase tracking-wider">
                  {dept.shortLabel}
                </span>
                <h3 className="text-xs font-bold text-[var(--text-heading)]">
                  {dept.label}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {dept.description}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden">
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-heading)]">
              Administrators &amp; Departmental Staff Directory
            </h2>
            <p className="text-[11px] text-[var(--text-muted)]">
              All admins are strictly bound by the No-Export / No-Download /
              No-Copy DLP policy.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-secondary)]/50">
                <th className="py-3.5 px-4">Administrator</th>
                <th className="py-3.5 px-4">Role &amp; Department</th>
                <th className="py-3.5 px-4">Onboarding Status</th>
                <th className="py-3.5 px-4">CRUD Privileges</th>
                <th className="py-3.5 px-4">Scoped Modules</th>
                <th className="py-3.5 px-4 text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-xs">
              {staff.map((member) => {
                const pol = member.adminPolicy;
                const isSelf = member.id === user?.id;
                return (
                  <tr
                    key={member.id}
                    className="hover:bg-[var(--bg-secondary)]/40 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <p className="font-bold text-[var(--text-heading)]">
                        {member.name}
                        {isSelf && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px]">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {member.email}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          member.role === "SUPER_ADMIN"
                            ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                            : "bg-[var(--primary)]/10 text-[var(--primary)]"
                        }`}
                      >
                        {member.role === "SUPER_ADMIN"
                          ? "SUPER ADMIN"
                          : pol.departmentLabel}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {pol.onboardingStatus === "INVITED_PENDING_PASSWORD" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10.5px] font-bold">
                          <Mail className="w-3 h-3" />
                          Invited (Pending Password)
                        </span>
                      )}
                      {pol.onboardingStatus === "PENDING_APPROVAL" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10.5px] font-bold animate-pulse">
                          <Clock className="w-3 h-3" />
                          Password Set — Needs Approval
                        </span>
                      )}
                      {pol.onboardingStatus === "APPROVED" && member.isActive && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10.5px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          Approved &amp; Active
                        </span>
                      )}
                      {(pol.onboardingStatus === "SUSPENDED" ||
                        !member.isActive) && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-[10.5px] font-bold">
                          <Ban className="w-3 h-3" />
                          Suspended
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            pol.canRead
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-zinc-500/10 text-zinc-400 line-through"
                          }`}
                        >
                          READ
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            pol.canWrite
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-zinc-500/10 text-zinc-400 line-through"
                          }`}
                        >
                          WRITE
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            pol.canDelete
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-zinc-500/10 text-zinc-400 line-through"
                          }`}
                        >
                          DELETE
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold">
                          NO COPY/EXPORT
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(pol.allowedModules || []).map((mod) => (
                          <span
                            key={mod}
                            className="px-2 py-0.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] text-[var(--text-muted)]"
                          >
                            /{mod}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end flex-wrap">
                        {pol.onboardingStatus === "PENDING_APPROVAL" && (
                          <button
                            type="button"
                            onClick={() => openEditModal(member)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Approve &amp; Assign
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openEditModal(member)}
                          className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] hover:border-[var(--primary)] cursor-pointer"
                          title="Configure Department & Privileges"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                        </button>

                        {!isSelf && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickAction(member, "RESET_CREDENTIALS")
                              }
                              className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-blue-500 hover:border-blue-500 cursor-pointer"
                              title="Re-issue Temporary Password via Email"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>

                            {member.isActive &&
                            pol.onboardingStatus !== "SUSPENDED" ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickAction(member, "SUSPEND")
                                }
                                className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-amber-500 hover:border-amber-500 cursor-pointer"
                                title="Suspend Admin"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickAction(member, "REINSTATE")
                                }
                                className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-emerald-500 hover:border-emerald-500 cursor-pointer"
                                title="Reinstate Admin"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(member)}
                              className="p-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-red-500 hover:border-red-500 cursor-pointer"
                              title="Delete Admin"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ADMIN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-heading)]">
                  Provision New Admin &amp; Send Email Credentials
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Step 1 of 3: Credentials are sent to the admin&apos;s email so
                  they can update their password before final approval.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-heading)] block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Chidinma Okafor"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-heading)] block mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="staff@oversite.ng"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-heading)] block mb-1">
                    Admin Tier
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) =>
                      setNewRole(e.target.value as "ADMIN" | "SUPER_ADMIN")
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
                  >
                    <option value="ADMIN">Departmental Admin (Scoped)</option>
                    <option value="SUPER_ADMIN">
                      Executive Super Admin (All Access)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-heading)] block mb-1">
                    Assigned Department
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) =>
                      setNewDept(e.target.value as AdminDepartment)
                    }
                    disabled={newRole === "SUPER_ADMIN"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
                  >
                    {departments
                      .filter((d) => d.key !== "EXECUTIVE")
                      .map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* CRUD Checkboxes */}
              <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2">
                <p className="text-[11px] font-bold text-[var(--text-heading)]">
                  Initial CRUD Access Permissions
                </p>
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanRead}
                      onChange={(e) => setNewCanRead(e.target.checked)}
                    />
                    <span>Read Access</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanWrite}
                      onChange={(e) => setNewCanWrite(e.target.checked)}
                    />
                    <span>Write / Modify Access</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanDelete}
                      onChange={(e) => setNewCanDelete(e.target.checked)}
                    />
                    <span>Delete Access</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {creating
                    ? "Provisioning & Emailing..."
                    : "Create Admin & Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / APPROVE ADMIN MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-heading)]">
                  Approve &amp; Configure Privileges: {editingMember.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {editingMember.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-[var(--text-heading)] block mb-1">
                  Assigned Department
                </label>
                <select
                  value={editDept}
                  onChange={(e) =>
                    handleEditDepartmentChange(
                      e.target.value as AdminDepartment
                    )
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
                >
                  {departments.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2">
                <p className="text-[11px] font-bold text-[var(--text-heading)]">
                  Departmental CRUD Privileges
                </p>
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanRead}
                      onChange={(e) => setEditCanRead(e.target.checked)}
                    />
                    <span>Read Access</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanWrite}
                      onChange={(e) => setEditCanWrite(e.target.checked)}
                    />
                    <span>Write / Create / Modify</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanDelete}
                      onChange={(e) => setEditCanDelete(e.target.checked)}
                    />
                    <span>Delete Access</span>
                  </label>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2">
                <p className="text-[11px] font-bold text-[var(--text-heading)]">
                  Permitted Console Modules
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {ALL_MODULES.map((mod) => (
                    <label
                      key={mod.id}
                      className="inline-flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={editModules.includes(mod.id)}
                        disabled={mod.id === "dashboard"}
                        onChange={() => toggleModule(mod.id)}
                      />
                      <span>{mod.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => handleSaveOrApprove("UPDATE_PRIVILEGES")}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] hover:border-[var(--primary)] cursor-pointer"
                >
                  Save Privileges
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => handleSaveOrApprove("APPROVE")}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                >
                  Approve &amp; Activate Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
