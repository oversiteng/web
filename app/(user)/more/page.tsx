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

interface UserProfile {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: string;
}

export default function MorePage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile>({
    name: "Abraham Samuel",
    email: "abrahamsamuel03@gmail.com",
  });

  // Modal States
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("oversite_token")
            : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/v1/auth/me", { headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setUser({
              name: json.data.name || json.data.fullName || "Abraham Samuel",
              email: json.data.email || "abrahamsamuel03@gmail.com",
            });
          }
        }
      } catch (e) {
        console.error("Failed to load user profile in More page:", e);
      }
    }

    loadUser();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const displayName = user.name || "Abraham Samuel";
  const displayEmail = user.email || "abrahamsamuel03@gmail.com";
  const initials =
    displayName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AS";

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("oversite_token");
        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      setIsLogoutModalOpen(false);
      router.push("/login");
    } catch (e) {
      console.error("Logout error:", e);
      setIsLogoutModalOpen(false);
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
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
    <div className="bg-[#F2F4F2] dark:bg-[#111412] min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] text-[var(--text-heading)] transition-colors duration-150 -m-4 sm:-m-6 md:-m-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[90] flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-zinc-900/90 dark:bg-white/95 text-white dark:text-zinc-900 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-5 h-5 text-[#2BB44A] shrink-0 stroke-[2.2]" />
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
            <h1 className="text-[19px] sm:text-[20px] font-bold text-zinc-900 dark:text-white tracking-tight">
              More
            </h1>
          </div>

          {/* ── Profile Card ── */}
          <Link
            href="/settings/profile"
            className="flex items-center gap-3.5 p-4 rounded-[22px] bg-white dark:bg-[#1E2220] border border-zinc-100 dark:border-zinc-800/80 shadow-xs mb-4 hover:border-[var(--primary)]/30 transition-all cursor-pointer group"
          >
            <div className="relative w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[18px] shrink-0">
              {initials}
              <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#2BB44A] text-white flex items-center justify-center border-2 border-white dark:border-[#1E2220] shadow-xs">
                <Pencil className="w-2.5 h-2.5 stroke-[2.5]" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-bold text-zinc-900 dark:text-white truncate group-hover:text-[#2BB44A] transition-colors">
                {displayName}
              </h2>
              <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {displayEmail}
              </p>
            </div>

            <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors shrink-0" />
          </Link>

          {/* ── Group 1: General Menu Card ── */}
          <div className="rounded-[22px] bg-white dark:bg-[#1E2220] border border-zinc-100 dark:border-zinc-800/80 shadow-xs mb-4 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {/* Settings */}
            <Link
              href="/settings"
              className="flex items-center gap-3.5 p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                <Settings className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-zinc-900 dark:text-white">
                  Settings
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
                  Update profile and manage account
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
            </Link>

            {/* Document Vault */}
            <Link
              href="/vault"
              className="flex items-center gap-3.5 p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[#2BB44A] shrink-0">
                <FileText className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-zinc-900 dark:text-white">
                  Document Vault
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
                  Reports, copies and evidence
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
            </Link>

            {/* Billing and Payments */}
            <Link
              href="/billing"
              className="flex items-center gap-3.5 p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                <CreditCard className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-zinc-900 dark:text-white">
                  Billing and Payments
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
                  Plan, methods and history
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
            </Link>

            {/* Security */}
            <Link
              href="/security"
              className="flex items-center gap-3.5 p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                <Shield className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-zinc-900 dark:text-white">
                  Security
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
                  Change password, 2FA
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
            </Link>

            {/* Support */}
            <Link
              href="/support"
              className="flex items-center gap-3.5 p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                <MessageSquare className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-zinc-900 dark:text-white">
                  Support
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
                  Chat support for quick response
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
            </Link>

            {/* About */}
            <Link
              href="/about"
              className="flex items-center gap-3.5 p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                <Info className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-zinc-900 dark:text-white">
                  About
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
                  Learn more about oversite
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
            </Link>
          </div>

          {/* ── Group 2: Account Actions Card ── */}
          <div className="rounded-[22px] bg-white dark:bg-[#1E2220] border border-zinc-100 dark:border-zinc-800/80 shadow-xs overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {/* Logout Action */}
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full flex items-center gap-3.5 p-3.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group cursor-pointer text-left"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                <LogOut className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14.5px] font-semibold text-zinc-900 dark:text-white">
                  Logout
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
                  Sign out of your account
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
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
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 truncate">
                  Permanently remove your data
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-rose-500 shrink-0" />
            </button>
          </div>
        </div>

        {/* Space above mobile bottom nav */}
        <div className="pb-32" />
      </div>

      {/* ── Logout Confirmation Modal (Matches Screenshot 2 Exactly) ── */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity animate-in fade-in"
            onClick={() => !isLoggingOut && setIsLogoutModalOpen(false)}
          />
          <div
            className="relative w-full max-w-[340px] bg-white dark:bg-[#1E2220] rounded-[28px] p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[19px] font-bold text-zinc-900 dark:text-white">
              Logout
            </h3>
            <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400 mt-2 mb-6 leading-relaxed">
              Are you sure you want to log out?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={() => setIsLogoutModalOpen(false)}
                className="px-3 py-1.5 text-[14.5px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
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

      {/* ── Delete Account Confirmation Modal (Matches Screenshot 1 Exactly) ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity animate-in fade-in"
            onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
          />
          <div
            className="relative w-full max-w-[340px] bg-white dark:bg-[#1E2220] rounded-[28px] p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[19px] font-bold text-zinc-900 dark:text-white">
              Delete Account
            </h3>
            <p className="text-[13.5px] text-zinc-500 dark:text-zinc-400 mt-2 mb-6 leading-relaxed">
              Are you sure you want to delete your account? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 text-[14.5px] font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
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
