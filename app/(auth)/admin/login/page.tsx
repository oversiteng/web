"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api/client";
import type { AdminPolicy } from "@/lib/auth/adminPermissions";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Building2,
} from "lucide-react";

type OnboardingStep =
  | "SIGN_IN"
  | "VERIFY_2FA"
  | "SETUP_PASSWORD"
  | "PENDING_APPROVAL";

function AdminLoginContent() {
  const { user, isLoading: authLoading, setSession, logout } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<OnboardingStep>("SIGN_IN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [policy, setPolicy] = useState<AdminPolicy | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const evaluateAdminRoute = useCallback(
    (role?: string, adminPolicy?: AdminPolicy | null) => {
      if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return;
      }
      if (role === "SUPER_ADMIN") {
        router.replace("/admin/dashboard");
        return;
      }
      if (
        adminPolicy?.mustChangePassword ||
        adminPolicy?.onboardingStatus === "INVITED_PENDING_PASSWORD"
      ) {
        setPolicy(adminPolicy);
        setStep("SETUP_PASSWORD");
        return;
      }
      if (adminPolicy?.onboardingStatus === "PENDING_APPROVAL") {
        setPolicy(adminPolicy);
        setStep("PENDING_APPROVAL");
        return;
      }
      if (adminPolicy?.onboardingStatus === "SUSPENDED") {
        setErrorMessage(
          "Your administrative account has been suspended by the Super Admin."
        );
        setStep("SIGN_IN");
        return;
      }
      router.replace("/admin/dashboard");
    },
    [router]
  );

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        evaluateAdminRoute(user.role, user.adminPolicy);
      }
    }
  }, [user, authLoading, evaluateAdminRoute]);

  const checkApprovalStatus = useCallback(async () => {
    setCheckingApproval(true);
    setErrorMessage(null);
    try {
      const res: any = await apiClient.get("/api/v1/users/me");
      const profile = res?.data || res;
      if (profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN") {
        const latestPolicy: AdminPolicy | null = profile.adminPolicy || null;
        setPolicy(latestPolicy);
        const token = localStorage.getItem("oversite_token") || "";
        if (token) {
          await setSession(profile, token);
        }
        if (
          profile.role === "SUPER_ADMIN" ||
          (latestPolicy?.onboardingStatus === "APPROVED" &&
            !latestPolicy?.mustChangePassword)
        ) {
          router.replace("/admin/dashboard");
        } else if (latestPolicy?.onboardingStatus === "SUSPENDED") {
          setErrorMessage(
            "Your administrative account was suspended by the Super Admin."
          );
          setStep("SIGN_IN");
        }
      }
    } catch {
      // Ignore transient network errors during poll
    } finally {
      setCheckingApproval(false);
    }
  }, [router, setSession]);

  useEffect(() => {
    if (step !== "PENDING_APPROVAL") return;
    const interval = setInterval(checkApprovalStatus, 8000);
    return () => clearInterval(interval);
  }, [step, checkApprovalStatus]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error?.message || "Invalid administrative credentials."
        );
        setLoading(false);
        return;
      }

      if (data.data?.requiresTwoFactor && data.data?.twoFactorToken) {
        setCurrentPassword(password);
        setTwoFactorToken(data.data.twoFactorToken);
        setStatusMessage(
          data.message ||
            "A 6-digit verification code has been sent to your email."
        );
        setStep("VERIFY_2FA");
        setLoading(false);
        return;
      }

      const loggedInUser = data.data?.user;
      if (
        loggedInUser?.role !== "ADMIN" &&
        loggedInUser?.role !== "SUPER_ADMIN"
      ) {
        setErrorMessage(
          "Access Denied: This portal is restricted to Oversite Administrators."
        );
        setLoading(false);
        return;
      }

      setCurrentPassword(password);
      await setSession(loggedInUser, data.data.token);
      evaluateAdminRoute(loggedInUser.role, loggedInUser.adminPolicy);
    } catch {
      setErrorMessage("Network error while connecting to Admin Console.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/v1/auth/login/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twoFactorToken,
          code: twoFactorCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(
          data.error?.message || "Invalid or expired verification code."
        );
        setLoading(false);
        return;
      }

      const loggedInUser = data.data?.user;
      if (
        loggedInUser?.role !== "ADMIN" &&
        loggedInUser?.role !== "SUPER_ADMIN"
      ) {
        setErrorMessage(
          "Access Denied: This portal is restricted to Oversite Administrators."
        );
        setLoading(false);
        return;
      }

      await setSession(loggedInUser, data.data.token);
      evaluateAdminRoute(loggedInUser.role, loggedInUser.adminPolicy);
    } catch {
      setErrorMessage("Network error while verifying 2FA code.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      const res: any = await apiClient.post(
        "/api/v1/admin/auth/setup-password",
        {
          currentPassword: currentPassword || undefined,
          newPassword,
        }
      );

      const updatedPolicy: AdminPolicy =
        res?.data?.adminPolicy || res?.adminPolicy;
      setPolicy(updatedPolicy);
      setStatusMessage(
        res?.message ||
          "Password updated. Your account is now awaiting Super Admin approval."
      );

      if (user) {
        const token = localStorage.getItem("oversite_token") || "";
        await setSession(
          {
            ...user,
            adminPolicy: updatedPolicy,
          },
          token
        );
      }

      if (updatedPolicy?.onboardingStatus === "APPROVED") {
        router.replace("/admin/dashboard");
      } else {
        setStep("PENDING_APPROVAL");
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Failed to update password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-sm mx-auto select-none"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="mb-7">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--primary)] mb-1.5">
          Oversite Admin
        </p>

        {step === "SIGN_IN" && (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">
              Sign in to Console
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Enter your administrator credentials to access your workspace.
            </p>
          </>
        )}

        {step === "VERIFY_2FA" && (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">
              Two-Factor Verification
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold text-[var(--text-heading)]">
                {email}
              </span>
              .
            </p>
          </>
        )}

        {step === "SETUP_PASSWORD" && (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">
              Set Your Password
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Replace your temporary password to submit your account for Super
              Admin approval.
            </p>
          </>
        )}

        {step === "PENDING_APPROVAL" && (
          <>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">
              Awaiting Approval
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
              Your password is set. The Super Admin has been notified to
              activate your departmental access.
            </p>
          </>
        )}
      </div>

      {errorMessage && (
        <div className="mb-4 px-3.5 py-2.5 rounded-md bg-red-500/10 border border-red-500/25 text-red-500 text-xs font-medium flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {statusMessage && (
        <div className="mb-4 px-3.5 py-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* SIGN IN */}
      {step === "SIGN_IN" && (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-heading)] block">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@oversite.ng"
              className="w-full h-10 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-heading)] block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-10 pl-3 pr-10 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? "Signing in..." : "Sign in"}</span>
          </button>
        </form>
      )}

      {/* 2FA VERIFICATION */}
      {step === "VERIFY_2FA" && (
        <form onSubmit={handleVerify2fa} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-heading)] block">
              6-Digit Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              placeholder="000000"
              className="w-full h-11 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] text-center tracking-[0.4em] font-mono text-base focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || twoFactorCode.trim().length < 6}
            className="w-full h-10 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? "Verifying..." : "Verify & Continue"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("SIGN_IN");
              setTwoFactorCode("");
              setErrorMessage(null);
            }}
            className="w-full py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
          >
            Back to Sign In
          </button>
        </form>
      )}

      {/* FIRST-TIME PASSWORD SETUP */}
      {step === "SETUP_PASSWORD" && (
        <form onSubmit={handleSetupPassword} className="space-y-4">
          {policy && (
            <div className="px-3.5 py-2.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-[var(--text-muted)]">
                  Department
                </p>
                <p className="text-xs font-semibold text-[var(--text-heading)] truncate">
                  {policy.departmentLabel}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-heading)] block">
              New password (min. 8 characters)
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full h-10 pl-3 pr-10 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                {showNewPassword ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[var(--text-heading)] block">
              Confirm new password
            </label>
            <input
              type={showNewPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full h-10 px-3 rounded-md bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            <span>
              {loading ? "Updating..." : "Save Password & Request Approval"}
            </span>
          </button>
        </form>
      )}

      {/* PENDING SUPER ADMIN APPROVAL */}
      {step === "PENDING_APPROVAL" && (
        <div className="rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-500 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[var(--text-heading)] truncate">
                {user?.name || email}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {policy?.departmentLabel || "Departmental Staff"}
              </p>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Once the Super Admin approves your profile and assigns your
            departmental privileges, this page will automatically redirect to
            your workspace.
          </p>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={checkApprovalStatus}
              disabled={checkingApproval}
              className="flex-1 h-9 px-3 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  checkingApproval ? "animate-spin" : ""
                }`}
              />
              <span>{checkingApproval ? "Checking..." : "Check Status"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                setStep("SIGN_IN");
              }}
              className="h-9 px-3 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-80 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm mx-auto p-6 animate-pulse space-y-4">
          <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-md" />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
