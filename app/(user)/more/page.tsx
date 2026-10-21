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
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

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

  const displayName = user?.name || "Oversite User";
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
    <div className="bg-(--bg-body) min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-(--text-heading) transition-colors duration-150 -m-4 sm:-m-6 md:-m-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[90] flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-zinc-900/90 dark:bg-white/95 text-white dark:text-zinc-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-5 h-5 text-(--primary) shrink-0 stroke-[2.2]" />
            <span className="text-[13px] font-medium tracking-wide">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between px-4 sm:px-6 py-4 relative">
        <div>
          {/* ── Top Header ── */}
          <div className="flex items-center justify-center py-3 mb-3">
            <h1 className="text-[19px] sm:text-[20px] font-bold text-(--text-heading) tracking-tight">
              More
            </h1>
          </div>

          {/* ── Profile Card ── */}
          <Link
            href="/settings/profile"
            className="flex items-center gap-3.5 p-4 rounded-[22px] bg-(--bg-card) border border-(--border-color) shadow-xs mb-4 hover:border-(--primary)/30 transition-all cursor-pointer group"
          >
            <div className="relative w-14 h-14 rounded-full bg-(--primary-light) text-(--primary) flex items-center justify-center font-bold text-[18px] shrink-0 overflow-visible">
              {user?.avatarUrl || user?.avatar ? (
                <img
                  src={user.avatarUrl || user.avatar || ""}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover border border-(--border-color)"
                />
              ) : (
                initials
              )}
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-(--primary) text-white flex items-center justify-center border-2 border-(--bg-card) shadow-xs">
                <Pencil className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-bold text-(--text-heading) truncate group-hover:text-(--primary) transition-colors">
                {displayName}
              </h2>
              <p className="text-[12.5px] text-(--text-muted) truncate mt-0.5">
                {displayEmail}
              </p>
            </div>

            <ChevronRight className="w-5 h-5 text-(--text-muted) group-hover:text-(--text-heading) transition-colors shrink-0" />
          </Link>

          {/* ── Group 1: General Menu Card ── */}
          <div className="rounded-[22px] bg-(--bg-card) border border-(--border-color) shadow-xs mb-4 overflow-hidden divide-y divide-(--border-color)">
            {/* Settings */}
            <Link
              href="/settings"
              className="flex items-center gap-3.5 p-3.5 hover:bg-(--bg-secondary) transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-(--text-heading) shrink-0">
                <Settings className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-(--text-heading)">
                  Settings
                </h3>
                <p className="text-[12px] text-(--text-muted) truncate">
                  Update profile and manage account
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-(--text-muted) group-hover:text-(--text-heading) transition-colors shrink-0" />
            </Link>

            {/* Document Vault */}
            <Link
              href="/vault"
              className="flex items-center gap-3.5 p-3.5 hover:bg-(--bg-secondary) transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-(--primary) shrink-0">
                <FileText className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-(--text-heading)">
                  Document Vault
                </h3>
                <p className="text-[12px] text-(--text-muted) truncate">
                  Reports, copies and evidence
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-(--text-muted) group-hover:text-(--text-heading) transition-colors shrink-0" />
            </Link>

            {/* Billing and Payments */}
            <Link
              href="/billing"
              className="flex items-center gap-3.5 p-3.5 hover:bg-(--bg-secondary) transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-(--text-heading) shrink-0">
                <CreditCard className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-(--text-heading)">
                  Billing and Payments
                </h3>
                <p className="text-[12px] text-(--text-muted) truncate">
                  Plan, methods and history
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-(--text-muted) group-hover:text-(--text-heading) transition-colors shrink-0" />
            </Link>

            {/* Security */}
            <Link
              href="/security"
              className="flex items-center gap-3.5 p-3.5 hover:bg-(--bg-secondary) transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-(--text-heading) shrink-0">
                <Shield className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-(--text-heading)">
                  Security
                </h3>
                <p className="text-[12px] text-(--text-muted) truncate">
                  Change password, 2FA
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-(--text-muted) group-hover:text-(--text-heading) transition-colors shrink-0" />
            </Link>

            {/* Support */}
            <Link
              href="/support"
              className="flex items-center gap-3.5 p-3.5 hover:bg-(--bg-secondary) transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-(--text-heading) shrink-0">
                <MessageSquare className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-(--text-heading)">
                  Support
                </h3>
                <p className="text-[12px] text-(--text-muted) truncate">
                  Chat support for quick response
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-(--text-muted) group-hover:text-(--text-heading) transition-colors shrink-0" />
            </Link>

            {/* About */}
            <Link
              href="/about"
              className="flex items-center gap-3.5 p-3.5 hover:bg-(--bg-secondary) transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-(--text-heading) shrink-0">
                <Info className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-(--text-heading)">
                  About
                </h3>
                <p className="text-[12px] text-(--text-muted) truncate">
                  Learn more about oversite
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-(--text-muted) group-hover:text-(--text-heading) transition-colors shrink-0" />
            </Link>
          </div>

          {/* ── Group 2: Account Actions Card ── */}
          <div className="rounded-[22px] bg-(--bg-card) border border-(--border-color) shadow-xs overflow-hidden divide-y divide-(--border-color)">
            {/* Logout Action */}
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full flex items-center gap-3.5 p-3.5 hover:bg-(--bg-secondary) transition-colors group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-(--text-heading) shrink-0">
                <LogOut className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-(--text-heading)">
                  Logout
                </h3>
                <p className="text-[12px] text-(--text-muted) truncate">
                  Sign out of your account
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-(--text-muted) group-hover:text-(--text-heading) transition-colors shrink-0" />
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
                <p className="text-[12px] text-(--text-muted) truncate">
                  Permanently remove your data
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-(--text-muted) group-hover:text-rose-500 shrink-0" />
            </button>
          </div>
        </div>

        {/* Space above mobile bottom nav */}
        <div className="pb-32" />
      </div>

      {/* ── Logout Confirmation Modal ── */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity animate-in fade-in"
            onClick={() => !isLoggingOut && setIsLogoutModalOpen(false)}
          />
          <div
            className="relative w-full max-w-[340px] bg-(--bg-card) border border-(--border-color) rounded-[28px] p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[19px] font-bold text-(--text-heading)">
              Logout
            </h3>
            <p className="text-[13.5px] text-(--text-muted) mt-2 mb-6 leading-relaxed">
              Are you sure you want to log out?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-3 py-1.5 text-[14.5px] font-medium text-(--text-muted) hover:text-(--text-heading) transition-colors cursor-pointer disabled:opacity-50"
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

      {/* ── Delete Account Confirmation Modal ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity animate-in fade-in"
            onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
          />
          <div
            className="relative w-full max-w-[340px] bg-(--bg-card) border border-(--border-color) rounded-[28px] p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[19px] font-bold text-(--text-heading)">
              Delete Account
            </h3>
            <p className="text-[13.5px] text-(--text-muted) mt-2 mb-6 leading-relaxed">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 text-[14.5px] font-medium text-(--text-muted) hover:text-(--text-heading) transition-colors cursor-pointer disabled:opacity-50"
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
