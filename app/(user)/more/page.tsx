"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  FileText,
  CreditCard,
  Shield,
  MessageSquare,
  Info,
  LogOut,
  Trash2,
  ChevronRight,
  Pencil,
  CheckCircle2,
  BarChart3,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/ui/PageHeader";

export default function MorePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // Modal States
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (user?.role === "AGENT") {
      router.replace("/agent/more");
    }
  }, [user, router]);

  const isAgent = user?.role === "AGENT";
  const displayName = user?.name || user?.fullName || "Oversite User";
  const displayEmail = user?.email || "";
  const initials =
    displayName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "OU";

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setIsLogoutModalOpen(false);
    logout();
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("oversite_token")
          : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/v1/users/me", {
        method: "DELETE",
        headers,
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("oversite_token");
        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }

      setIsDeleteModalOpen(false);
      showToast("Account deleted successfully.");
      setTimeout(() => {
        router.push("/register");
      }, 1000);
    } catch (e) {
      console.error("Delete account error:", e);
      setIsDeleteModalOpen(false);
      router.push("/login");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative w-full text-[var(--text-heading)] transition-colors duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[90] flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] border border-[var(--border-color)] shadow-2xl px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-5 h-5 text-[var(--primary)] shrink-0 stroke-[2.2]" />
            <span className="text-[13px] font-medium tracking-wide">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      <div>
        {/* Unified Page Header */}
        <PageHeader title="More" />

          {/* â”€â”€ Profile Card â”€â”€ */}
          <Link
            href="/settings/profile"
            className="flex items-center gap-3.5 p-4 rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs mb-4 hover:border-[var(--primary)]/30 transition-all cursor-pointer group"
          >
            <div className="relative w-14 h-14 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-[18px] shrink-0 overflow-visible">
              {user?.avatarUrl || user?.avatar ? (
                <img
                  src={user.avatarUrl || user.avatar || ""}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover border border-[var(--border-color)]"
                />
              ) : (
                initials
              )}
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center border-2 border-[var(--bg-card)] shadow-xs">
                <Pencil className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-bold text-[var(--text-heading)] truncate group-hover:text-[var(--primary)] transition-colors">
                {displayName}
              </h2>
              <p className="text-[12.5px] text-[var(--text-muted)] truncate mt-0.5">
                {displayEmail}
              </p>
            </div>

            <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
          </Link>

          {/* â”€â”€ Group 1: General Menu Card â”€â”€ */}
          <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs mb-4 overflow-hidden divide-y divide-[var(--border-color)]">
            {/* Settings */}
            <Link
              href="/settings"
              className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-heading)] shrink-0">
                <Settings className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-[var(--text-heading)]">
                  Settings
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] truncate">
                  Update profile and manage account
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
            </Link>

            {isAgent && (
              <>
                <Link
                  href="/agent/stats"
                  className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--primary)] shrink-0">
                    <BarChart3 className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14.5px] font-semibold text-[var(--text-heading)]">
                      My Stats
                    </h3>
                    <p className="text-[12px] text-[var(--text-muted)] truncate">
                      Tier progress, rating &amp; acceptance rate
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
                </Link>

                <Link
                  href="/agent/verification"
                  className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--primary)] shrink-0">
                    <ShieldCheck className="w-5 h-5 stroke-[1.8]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14.5px] font-semibold text-[var(--text-heading)]">
                      Verification
                    </h3>
                    <p className="text-[12px] text-[var(--text-muted)] truncate">
                      6-step accreditation &amp; KYC documents
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
                </Link>
              </>
            )}

            {/* Document Vault */}
            <Link
              href={isAgent ? "/agent/tasks" : "/vault"}
              className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--primary)] shrink-0">
                <FileText className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-[var(--text-heading)]">
                  {isAgent ? "Field Assignments" : "Document Vault"}
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] truncate">
                  {isAgent ? "Active tasks, drafts and history" : "Reports, copies and evidence"}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
            </Link>

            {/* Billing and Payments */}
            <Link
              href={isAgent ? "/agent/wallet" : "/billing"}
              className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-heading)] shrink-0">
                <CreditCard className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-[var(--text-heading)]">
                  {isAgent ? "Earnings and Payouts" : "Billing and Payments"}
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] truncate">
                  {isAgent ? "Balance, bank accounts and payouts" : "Plan, methods and history"}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
            </Link>

            {/* Security */}
            <Link
              href="/security"
              className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-heading)] shrink-0">
                <Shield className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-[var(--text-heading)]">
                  Security
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] truncate">
                  Change password, 2FA
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
            </Link>

            {/* Support */}
            <Link
              href="/support"
              className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-heading)] shrink-0">
                <MessageSquare className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-[var(--text-heading)]">
                  Support
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] truncate">
                  Chat support for quick response
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
            </Link>

            {/* About */}
            <Link
              href="/about"
              className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-heading)] shrink-0">
                <Info className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-[var(--text-heading)]">
                  About
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] truncate">
                  Learn more about oversite
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
            </Link>
          </div>

          {/* â”€â”€ Group 2: Account Actions Card â”€â”€ */}
          <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs overflow-hidden divide-y divide-[var(--border-color)]">
            {/* Logout Action */}
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-heading)] shrink-0">
                <LogOut className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-[var(--text-heading)]">
                  Logout
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] truncate">
                  Sign out of your account
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
            </button>

            {/* Delete Account Action */}
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full flex items-center gap-3.5 p-3.5 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-rose-500">
                  Delete Account
                </h3>
                <p className="text-[12px] text-[var(--text-muted)] truncate">
                  Permanently remove your data
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-rose-500 shrink-0" />
            </button>
          </div>
        </div>

        {/* Space above mobile bottom nav */}
        <div className="pb-32" />

      {/* â”€â”€ Logout Confirmation Modal â”€â”€ */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity animate-in fade-in"
            onClick={() => !isLoggingOut && setIsLogoutModalOpen(false)}
          />
          <div
            className="relative w-full max-w-[340px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[28px] p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[19px] font-bold text-[var(--text-heading)]">
              Logout
            </h3>
            <p className="text-[13.5px] text-[var(--text-muted)] mt-2 mb-6 leading-relaxed">
              Are you sure you want to log out?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-3 py-1.5 text-[14.5px] font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleConfirmLogout}
                className="px-3 py-1.5 text-[14.5px] font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Delete Account Confirmation Modal â”€â”€ */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity animate-in fade-in"
            onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
          />
          <div
            className="relative w-full max-w-[340px] bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[28px] p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[19px] font-bold text-[var(--text-heading)]">
              Delete Account
            </h3>
            <p className="text-[13.5px] text-[var(--text-muted)] mt-2 mb-6 leading-relaxed">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 text-[14.5px] font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-[14.5px] font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
