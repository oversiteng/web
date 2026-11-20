"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/context/AuthContext";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import {
  ADMIN_DEPARTMENTS,
  AdminDepartment,
  AdminPolicy,
  DepartmentDefinition,
} from "@/lib/auth/adminPermissions";
import {
  UserPlus,
  Search,
  ChevronLeft,
  ArrowLeft,
  ArrowRight,
  Lock,
  KeyRound,
  Trash2,
  CheckCircle2,
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
  { id: "tasks", label: "Tasks & Agent Pay" },
  { id: "chat", label: "Inbox & Moderation" },
  { id: "support", label: "CRS Support" },
  { id: "users", label: "Users & KYC" },
  { id: "reports", label: "QA & Dossiers" },
  { id: "finance", label: "Revenue & Payouts" },
  { id: "communications", label: "Broadcasts & Mail" },
  { id: "settings", label: "Settings" },
];

const PAGE_SIZE = 10;

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}

export default function AdminTeamGovernancePage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<DepartmentDefinition[]>(
    Object.values(ADMIN_DEPARTMENTS)
  );
  const [loading, setLoading] = useState(true);
  const [activityTab, setActivityTab] = useState<"ACTIVE" | "DORMANT">("ACTIVE");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Full Detail View State (Matches Profile / Permissions Mockup)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"PROFILE" | "PERMISSIONS">(
    "PROFILE"
  );
  const [editDept, setEditDept] = useState<AdminDepartment>("ADMINISTRATIVE");
  const [editStatus, setEditStatus] = useState<"APPROVED" | "SUSPENDED">(
    "APPROVED"
  );
  const [editCanRead, setEditCanRead] = useState(true);
  const [editCanWrite, setEditCanWrite] = useState(true);
  const [editCanDelete, setEditCanDelete] = useState(false);
  const [editModules, setEditModules] = useState<string[]>(["dashboard"]);
  const [savingEdit, setSavingEdit] = useState(false);

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

  // Delete Confirm Modal
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null);
  const [deletingMember, setDeletingMember] = useState(false);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiClient.get("/api/v1/admin/team");
      const data = res?.data || res;
      if (Array.isArray(data?.staff)) setStaff(data.staff);
      if (Array.isArray(data?.departments)) setDepartments(data.departments);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text:
          err?.message ||
          "Only Super Admins can manage administrative staff.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activityTab, searchQuery]);

  const selectedMember = useMemo(
    () => staff.find((s) => s.id === selectedMemberId) || null,
    [staff, selectedMemberId]
  );

  const openMemberDetail = (member: StaffMember) => {
    setSelectedMemberId(member.id);
    setDetailTab("PROFILE");
    setEditDept(member.adminPolicy.department);
    setEditStatus(
      member.isActive && member.adminPolicy.onboardingStatus !== "SUSPENDED"
        ? "APPROVED"
        : "SUSPENDED"
    );
    setEditCanRead(member.adminPolicy.canRead);
    setEditCanWrite(member.adminPolicy.canWrite);
    setEditCanDelete(member.adminPolicy.canDelete);
    setEditModules(member.adminPolicy.allowedModules || ["dashboard"]);
  };

  const handleEditDepartmentChange = (dept: AdminDepartment) => {
    setEditDept(dept);
    const def = ADMIN_DEPARTMENTS[dept];
    if (def) setEditModules(def.defaultModules);
  };

  const toggleModule = (modId: string) => {
    if (modId === "dashboard") return;
    setEditModules((prev) =>
      prev.includes(modId) ? prev.filter((m) => m !== modId) : [...prev, modId]
    );
  };

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
          `Admin account created and credentials sent to ${newEmail}.`,
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

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSavingEdit(true);
    setFeedback(null);
    try {
      const action =
        editStatus === "SUSPENDED"
          ? "SUSPEND"
          : selectedMember.adminPolicy.onboardingStatus === "PENDING_APPROVAL"
          ? "APPROVE"
          : !selectedMember.isActive
          ? "REINSTATE"
          : "UPDATE_PRIVILEGES";

      const res: any = await apiClient.patch(
        `/api/v1/admin/team/${selectedMember.id}`,
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
        text: res?.message || "Admin permissions updated.",
      });
      await loadTeam();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to save permissions.",
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleQuickAction = async (
    member: StaffMember,
    action: "APPROVE" | "RESET_CREDENTIALS"
  ) => {
    setFeedback(null);
    try {
      const res: any = await apiClient.patch(
        `/api/v1/admin/team/${member.id}`,
        { action }
      );
      setFeedback({
        type: "success",
        text: res?.message || "Action completed.",
      });
      await loadTeam();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Action failed.",
      });
    }
  };

  const confirmDeleteAdmin = async () => {
    if (!memberToDelete) return;
    setDeletingMember(true);
    setFeedback(null);
    try {
      const res: any = await apiClient.delete(
        `/api/v1/admin/team/${memberToDelete.id}`
      );
      setFeedback({
        type: "success",
        text: res?.message || "Admin account removed.",
      });
      if (selectedMemberId === memberToDelete.id) {
        setSelectedMemberId(null);
      }
      setMemberToDelete(null);
      await loadTeam();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Failed to delete admin account.",
      });
    } finally {
      setDeletingMember(false);
    }
  };

  const activeStaff = useMemo(
    () =>
      staff.filter(
        (s) => s.isActive && s.adminPolicy.onboardingStatus === "APPROVED"
      ),
    [staff]
  );
  const dormantOrPendingStaff = useMemo(
    () =>
      staff.filter(
        (s) => !s.isActive || s.adminPolicy.onboardingStatus !== "APPROVED"
      ),
    [staff]
  );

  const currentList =
    activityTab === "ACTIVE" ? activeStaff : dormantOrPendingStaff;

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase();
    return currentList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.adminPolicy.departmentLabel.toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedStaff = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  if (user && user.role !== "SUPER_ADMIN") {
    return (
      <div className="p-8 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-center space-y-3 max-w-md mx-auto mt-10">
        <Lock className="w-8 h-8 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-[var(--text-heading)]">
          Super Admin Access Required
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Only the Executive Super Admin can manage administrators and
          departmental privileges.
        </p>
      </div>
    );
  }

  // ─── FULL DETAIL VIEW (Same Design as Users View Details) ───
  if (selectedMember) {
    const isSelf = selectedMember.id === user?.id;
    const nameParts = selectedMember.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "—";
    const lastName = nameParts.slice(1).join(" ") || "—";
    const initials = selectedMember.name.slice(0, 2).toUpperCase();
    const pol = selectedMember.adminPolicy;

    const statusBadgeClass =
      pol.onboardingStatus === "APPROVED" && selectedMember.isActive
        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
        : pol.onboardingStatus === "SUSPENDED" || !selectedMember.isActive
        ? "bg-red-500/15 text-red-500"
        : "bg-amber-500/20 text-amber-700 dark:text-amber-300";

    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {feedback && (
          <div
            className={`px-4 py-2.5 rounded-md border text-xs font-semibold flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 border-red-500/25 text-red-500"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="underline ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedMemberId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-heading)] hover:text-[var(--primary)] cursor-pointer w-fit"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-6 border-b border-[var(--border-color)] sm:border-none">
            <button
              type="button"
              onClick={() => setDetailTab("PROFILE")}
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                detailTab === "PROFILE"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              Profile
            </button>
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

        {detailTab === "PROFILE" ? (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--text-heading)]">
              Personal Information
            </h2>
            <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 sm:p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="w-20 h-20 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-bold text-xl flex items-center justify-center border border-[var(--primary)]/20">
                  {initials}
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold ${statusBadgeClass}`}
                >
                  {pol.onboardingStatus.replace(/_/g, " ")}
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
                  <p className="text-[var(--text-muted)] mb-1">Role</p>
                  <p className="font-semibold text-[var(--text-heading)]">
                    {selectedMember.role === "SUPER_ADMIN"
                      ? "Super Admin"
                      : "Department Admin"}
                  </p>
                </div>

                <div>
                  <p className="text-[var(--text-muted)] mb-1">Email</p>
                  <p className="font-semibold text-[var(--text-heading)] break-all">
                    {selectedMember.email}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1">Department</p>
                  <p className="font-semibold text-[var(--text-heading)]">
                    {pol.departmentLabel}
                  </p>
                </div>
                <div>
                  <p className="text-[var(--text-muted)] mb-1">Created On</p>
                  <p className="font-semibold text-[var(--text-heading)]">
                    {formatShortDate(selectedMember.createdAt)}
                  </p>
                </div>
              </div>

              {/* Quick Admin Lifecycle Actions */}
              {!isSelf && (
                <div className="pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center gap-2.5">
                  {pol.onboardingStatus === "PENDING_APPROVAL" && (
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickAction(selectedMember, "APPROVE")
                      }
                      className="px-3.5 h-9 rounded-md bg-[var(--primary)] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve &amp; Activate</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleQuickAction(selectedMember, "RESET_CREDENTIALS")
                    }
                    className="px-3.5 h-9 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] hover:border-[var(--primary)] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Email Temp Credentials</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMemberToDelete(selectedMember)}
                    className="px-3.5 h-9 rounded-md bg-red-500/10 border border-red-500/25 text-red-500 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Admin</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* PERMISSIONS TAB */
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-[var(--text-heading)]">
              Department &amp; Access Permissions
            </h2>
            <form
              onSubmit={handleSavePermissions}
              className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 sm:p-6 space-y-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-20 h-20 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] font-bold text-xl flex items-center justify-center border border-[var(--primary)]/20">
                  {initials}
                </div>
                <span
                  className={`px-3 py-1 rounded text-xs font-semibold ${statusBadgeClass}`}
                >
                  {pol.onboardingStatus.replace(/_/g, " ")}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-heading)] block">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    disabled={isSelf}
                    onChange={(e) =>
                      setEditStatus(e.target.value as "APPROVED" | "SUSPENDED")
                    }
                    className="w-full h-10 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-50"
                  >
                    <option value="APPROVED">Active (Approved)</option>
                    <option value="SUSPENDED">Dormant (Suspended)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-heading)] block">
                    Department
                  </label>
                  <select
                    value={editDept}
                    onChange={(e) =>
                      handleEditDepartmentChange(
                        e.target.value as AdminDepartment
                      )
                    }
                    className="w-full h-10 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    {departments.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2.5">
                <p className="text-xs font-semibold text-[var(--text-heading)]">
                  CRUD Privileges
                </p>
                <div className="flex flex-wrap gap-5 text-xs">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanRead}
                      onChange={(e) => setEditCanRead(e.target.checked)}
                    />
                    <span>Read</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanWrite}
                      onChange={(e) => setEditCanWrite(e.target.checked)}
                    />
                    <span>Write / Modify</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCanDelete}
                      onChange={(e) => setEditCanDelete(e.target.checked)}
                    />
                    <span>Delete</span>
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2.5">
                <p className="text-xs font-semibold text-[var(--text-heading)]">
                  Permitted Modules
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
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

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        <ConfirmModal
          open={Boolean(memberToDelete)}
          title="Delete Administrator Account"
          description={`Permanently delete admin account for ${memberToDelete?.name || ""} (${memberToDelete?.email || ""})?`}
          confirmLabel="Delete Admin"
          loading={deletingMember}
          onConfirm={confirmDeleteAdmin}
          onCancel={() => setMemberToDelete(null)}
        />
      </div>
    );
  }

  // ─── LIST VIEW (Matches Agents / End Users Table + Mobile Cards) ───
  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={`px-4 py-2.5 rounded-md border text-xs font-semibold flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/25 text-red-500"
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--text-muted)]">
          Manage administrators, approve onboarding, and configure departmental
          permissions.
        </p>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Create Admin</span>
        </button>
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
              <span>Active Admins</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activityTab === "ACTIVE"
                    ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                }`}
              >
                {activeStaff.length}
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
              <span>Pending / Dormant</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  activityTab === "DORMANT"
                    ? "bg-[var(--primary)]/15 text-[var(--primary)]"
                    : "bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                }`}
              >
                {dormantOrPendingStaff.length}
              </span>
            </button>
          </div>

          <div className="pb-3">
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full h-9 pl-9 pr-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)]">
            Loading administrators...
          </div>
        ) : paginatedStaff.length === 0 ? (
          <div className="p-10 text-center text-xs text-[var(--text-muted)]">
            No administrators in this tab.
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-[11px] font-semibold text-[var(--text-muted)]">
                    <th className="py-3.5 px-6">Full Name</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Created on</th>
                    <th className="py-3.5 px-6 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)] text-xs">
                  {paginatedStaff.map((member) => (
                    <tr
                      key={member.id}
                      className="hover:bg-[var(--bg-secondary)]/40 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-medium text-[var(--text-heading)]">
                        {member.name}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)]">
                        {member.role === "SUPER_ADMIN"
                          ? "Executive Super Admin"
                          : member.adminPolicy.departmentLabel}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-heading)]">
                        {member.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] font-semibold">
                          {member.adminPolicy.onboardingStatus.replace(
                            /_/g,
                            " "
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-muted)]">
                        {formatShortDate(member.createdAt)}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => openMemberDetail(member)}
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

            {/* MOBILE CARDS */}
            <div className="md:hidden divide-y divide-[var(--border-color)]">
              {paginatedStaff.map((member) => (
                <div key={member.id} className="p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-muted)]">Full Name</span>
                    <span className="font-semibold text-[var(--text-heading)]">
                      {member.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-muted)]">Department</span>
                    <span className="text-[var(--text-heading)]">
                      {member.adminPolicy.departmentLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[var(--text-muted)]">Email</span>
                    <span className="text-[var(--text-heading)] truncate max-w-[65%]">
                      {member.email}
                    </span>
                  </div>
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      onClick={() => openMemberDetail(member)}
                      className="text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
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
              <span className="text-[var(--text-muted)]">
                Page {currentPage} of {totalPages}
              </span>
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

      {/* CREATE ADMIN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-heading)]">
                  Create Administrator
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Temporary login credentials will be emailed directly to the
                  administrator.
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
                  <label className="text-xs font-medium text-[var(--text-heading)] block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Chidinma Okafor"
                    className="w-full h-9 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-heading)] block mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="staff@oversite.ng"
                    className="w-full h-9 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--text-heading)] block mb-1">
                    Admin Tier
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) =>
                      setNewRole(e.target.value as "ADMIN" | "SUPER_ADMIN")
                    }
                    className="w-full h-9 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
                  >
                    <option value="ADMIN">Departmental Admin</option>
                    <option value="SUPER_ADMIN">Executive Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--text-heading)] block mb-1">
                    Department
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) =>
                      setNewDept(e.target.value as AdminDepartment)
                    }
                    disabled={newRole === "SUPER_ADMIN"}
                    className="w-full h-9 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-xs text-[var(--text-heading)]"
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

              <div className="p-3.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] space-y-2">
                <p className="text-xs font-semibold text-[var(--text-heading)]">
                  Initial CRUD Privileges
                </p>
                <div className="flex flex-wrap gap-4 text-xs">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanRead}
                      onChange={(e) => setNewCanRead(e.target.checked)}
                    />
                    <span>Read</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanWrite}
                      onChange={(e) => setNewCanWrite(e.target.checked)}
                    />
                    <span>Write / Modify</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanDelete}
                      onChange={(e) => setNewCanDelete(e.target.checked)}
                    />
                    <span>Delete</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 h-9 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-heading)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 h-9 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create & Send Email"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
