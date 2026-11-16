"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  ShieldCheck,
  CreditCard,
  MapPin,
  BarChart3,
  ClipboardCheck,
  Lock,
  Headphones,
  LogOut,
  ChevronRight,
  Pencil,
  Trash2,
  CheckCircle2,
  Star,
} from "lucide-react";
import { GraphUpIcon } from '@solar-icons/react/outline/graph-up'
import { useAuth } from "@/context/AuthContext";
import { AgentTopNav } from "@/components/agent/AgentTopNav";
import { InfoCircleIcon } from "@solar-icons/react/outline";

export default function AgentMorePage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [verifiedCount, setVerifiedCount] = useState<number | null>(null);

  React.useEffect(() => {
    async function loadKyc() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
        if (!token) return;
        const res = await fetch("/api/v1/kyc/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          setVerifiedCount(json.data.verifiedCount ?? json.data.completedSteps ?? 0);
        }
      } catch {}
    }
    loadKyc();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const displayName = user?.name || user?.fullName || "Agent";
  const displayEmail = user?.email || "";
  const rawId = (user?.id || "12344").replace(/[^a-zA-Z0-9]/g, "");
  const agentIdCode = rawId.slice(-5).toUpperCase() || "12344";
  const agentIdDisplay = `Agent #OS-${agentIdCode}`;
  const rating = user?.agentProfile?.rating ? parseFloat(user.agentProfile.rating).toFixed(1) : "4.9";
  const totalTasks = typeof user?.agentProfile?.totalTasks === "number" ? user.agentProfile.totalTasks : 128;
  const initials =
    displayName
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AG";

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  const handleConfirmDelete = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("oversite_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch("/api/v1/users/me", {
        method: "DELETE",
        headers,
      });

      if (typeof window !== "undefined") {
        localStorage.removeItem("oversite_token");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }

      setIsDeleteModalOpen(false);
      showToast("Account deactivated successfully.");
      setTimeout(() => {
        router.push("/register");
      }, 1000);
    } catch (e) {
      setIsDeleteModalOpen(false);
      router.push("/login");
    }
  };

  return (
    <div className="space-y-4 max-w-full pb-12">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-[90] flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] border border-[var(--border-color)] shadow-2xl px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-5 h-5 sm:w-6.5 h-6.5 text-[var(--primary)] shrink-0 stroke-[2.2]" />
            <span className="text-[13px] font-medium tracking-wide truncate">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* ── Unified Top Navigation Bar ── */}
      <AgentTopNav title="More" subtitle="Operative tools, credentials & settings" />

      {/* ── Agent Profile Card ── */}
      <Link
        href="/settings/profile"
        className="flex items-center gap-3.5 p-4 rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs hover:border-[var(--primary)]/40 transition-all cursor-pointer group"
      >
        <div className="relative w-14 h-14 rounded-full bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center font-bold text-[18px] shrink-0 overflow-visible">
          {user?.avatarUrl || user?.avatar ? (
            <img
              src={user.avatarUrl || user.avatar}
              alt={displayName}
              className="w-full h-full rounded-full object-cover border border-[var(--border-color)]"
            />
          ) : (
            initials
          )}
          <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6.5 h-6.5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center border-2 border-[var(--bg-card)] shadow-xs">
            <Pencil className="w-2.5 h-2.5 stroke-[2.5]" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[16px] font-bold text-[var(--text-heading)] truncate group-hover:text-[var(--primary)] transition-colors">
              {agentIdDisplay}
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-border)] shrink-0">
              Agent
            </span>
          </div>
          <p className="text-[12.5px] text-[var(--text-muted)] truncate mt-0.5">
            {displayEmail}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--primary)] font-medium mt-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{rating} · {totalTasks} {totalTasks === 1 ? "task" : "tasks"}</span>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 sm:w-6.5 h-6.5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
      </Link>

      {/* ── Group 1: Field Operations & Accreditation ── */}
      <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs overflow-hidden divide-y divide-[var(--border-color)]">
        {/* My Stats & Performance */}
        <Link
          href="/agent/stats"
          className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
            <GraphUpIcon size={24} className="w-5 h-5 sm:w-6.5 h-6.5 stroke-[1.8]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] sm:text-[15px] font-normal text-[var(--text-heading)]">
              My Stats
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] truncate">
              Your standing and rating
            </p>
          </div>
          <ChevronRight className="w-5 h-5 sm:w-6.5 h-6.5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
        </Link>
        {/* Settings */}
        <Link
          href="/settings"
          className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-emerald-500 shrink-0 ">
            <Settings className="w-5 h-5 sm:w-6.5 h-6.5 stroke-[1.8]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] sm:text-[15px] font-normal text-[var(--text-heading)]">
              Settings
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] truncate">
              Update profile &amp; manage account
            </p>
          </div>
          <ChevronRight className="w-5 h-5 sm:w-6.5 h-6.5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
        </Link>
        {/* Verification & Accreditation */}
        <Link
          href="/agent/verification"
          className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6.5 h-6.5 stroke-[1.8]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] sm:text-[15px] font-normal text-[var(--text-heading)]">
              Verification
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] truncate">
              Vitting , documents, coverage
            </p>
          </div>
          <span className="text-[var(--primary)] bg-[var(--primary-light)] border border-[var(--primary-border)] text-xs font-semibold rounded-full px-3 py-0.5">
            {verifiedCount !== null ? `${verifiedCount}/6 Verified` : "Accreditation"}
          </span>
          <ChevronRight className="w-5 h-5 sm:w-6.5 h-6.5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
        </Link>


        {/* Earnings & Banking */}
        <Link
          href="/agent/wallet"
          className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
            <CreditCard className="w-5 h-5 sm:w-6.5 h-6.5 stroke-[1.8]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] sm:text-[15px] font-normal text-[var(--text-heading)]">
              Bank &amp; Payouts
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] truncate">
              Accounts, withdrawal PIN, history
            </p>
          </div>
          <ChevronRight className="w-5 h-5 sm:w-6.5 h-6.5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
        </Link>
      </div>

      {/* ── Group 2: Account & Security ── */}
      <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs overflow-hidden divide-y divide-[var(--border-color)]">

        {/* Security Hub */}
        <Link
          href="/security"
          className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-emerald-500">
            <Lock className="w-5 h-5 sm:w-6.5 h-6.5 stroke-[1.8]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] sm:text-[15px] font-normal text-[var(--text-heading)]">
              Security
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] truncate">
              Change password, 2FA &amp; PIN
            </p>
          </div>
          <ChevronRight className="w-5 h-5 sm:w-6.5 h-6.5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
        </Link>

        {/* Mission Control Support */}
        <Link
          href="/support"
          className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center  text-emerald-500 shrink-0">
            <Headphones className="w-5 h-5 sm:w-6.5 h-6.5 stroke-[1.8]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] sm:text-[15px] font-normal text-[var(--text-heading)]">
              Support
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] truncate">
              Chat support for quick response
            </p>
          </div>
          <ChevronRight className="w-5 h-5 sm:w-6.5 h-6.5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
        </Link>
        {/* About */}
        <Link
          href="/about"
          className="flex items-center gap-3.5 p-3.5 hover:bg-[var(--bg-secondary)] transition-colors group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-emerald-500">
            <InfoCircleIcon className="w-5 h-5 sm:w-6.5 h-6.5 stroke-[1.8]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] sm:text-[15px] font-normal text-[var(--text-heading)]">
              About
            </h3>
            <p className="text-[12px] text-[var(--text-muted)] truncate">
              Learn more about oversite
            </p>
          </div>
          <ChevronRight className="w-5 h-5 sm:w-6.5 h-6.5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors shrink-0" />
        </Link>
      </div>

      {/* ── Group 3: Actions (Sign Out & Deactivate) ── */}
      <div className="rounded-[22px] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs overflow-hidden divide-y divide-[var(--border-color)]">
        <button
          type="button"
          onClick={() => setIsLogoutModalOpen(true)}
          className="w-full flex items-center gap-3.5 p-3.5 text-left text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-red-500 shrink-0">
            <LogOut className="w-5 h-5 sm:w-6.5 h-6.5 stroke-[1.8]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] sm:text-[15px] font-normal text-red-500">Sign Out</h3>
            <p className="text-[12px] text-[var(--text-muted)] truncate">
              Sign out of this device
            </p>
          </div>
        </button>
      </div>

      {/* ── Logout Modal ── */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[var(--text-heading)]">Sign Out</h3>
              <p className="text-xs text-[var(--text-muted)]">
                Are you sure you want to sign out of your operative account?
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 rounded-full border border-[var(--border-color)] text-xs font-normal text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-xs font-normal text-white transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivate Modal ── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-[24px] bg-[var(--bg-card)] border border-[var(--border-color)] p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-[var(--text-heading)]">Deactivate Account</h3>
              <p className="text-xs text-[var(--text-muted)]">
                This will unpublish your operative badge and pause dispatch requests. You can reactivate anytime by logging back in.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-full border border-[var(--border-color)] text-xs font-normal text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-xs font-normal text-white transition-colors cursor-pointer"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

