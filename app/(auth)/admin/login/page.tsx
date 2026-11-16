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

type OnboardingStep = "SIGN_IN" | "VERIFY_2FA" | "SETUP_PASSWORD" | "PENDING_APPROVAL";

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
            "A 6-digit 2FA verification code has been sent to your official email."
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
          "Access Denied: This portal is restricted to Oversite Administrators and Departmental Staff."
        );
        setLoading(false);
        return;
      }

      setCurrentPassword(password);
      await setSession(loggedInUser, data.data.token);
      evaluateAdminRoute(loggedInUser.role, loggedInUser.adminPolicy);
    } catch {
      setErrorMessage("Network error while connecting to Admin Command.");
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
          data.error?.message || "Invalid or expired 2FA security code."
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
          "Password updated! Your account is now awaiting Super Admin approval."
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
      className="flex flex-col items-center w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 select-none"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Security Badge */}
      <div className="w-full flex flex-col items-start mt-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-[11px] font-bold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Oversite Command &amp; Department Portal
        </div>

        {step === "SIGN_IN" && (
          <>
            <h1 className="text-[24px] font-bold text-[var(--text-heading)]">
              Administrator Sign In
            </h1>
            <p className="text-[12.5px] font-medium text-[var(--text-muted)] mt-1 leading-relaxed">
              Sign in with your Super Admin or Departmental Admin credentials.
              First-time staff will be prompted to update their temporary
              password.
            </p>
          </>
        )}

        {step === "VERIFY_2FA" && (
          <>
            <h1 className="text-[24px] font-bold text-[var(--text-heading)]">
              2FA Security Verification
            </h1>
            <p className="text-[12.5px] font-medium text-[var(--text-muted)] mt-1 leading-relaxed">
              Enter the 6-digit verification code sent to{" "}
              <strong className="text-[var(--text-heading)]">{email}</strong>.
              Two-factor authentication is mandatory for all Oversite
              Administrators.
            </p>
          </>
        )}

        {step === "SETUP_PASSWORD" && (
          <>
            <h1 className="text-[24px] font-bold text-[var(--text-heading)]">
              Update Temporary Password
            </h1>
            <p className="text-[12.5px] font-medium text-[var(--text-muted)] mt-1 leading-relaxed">
              Step 2 of 3: Replace the temporary password sent to your email.
              Once updated, the Super Admin will approve your account and
              activate your departmental workspace.
            </p>
          </>
        )}

        {step === "PENDING_APPROVAL" && (
          <>
            <h1 className="text-[24px] font-bold text-[var(--text-heading)]">
              Awaiting Super Admin Approval
            </h1>
            <p className="text-[12.5px] font-medium text-[var(--text-muted)] mt-1 leading-relaxed">
              Step 3 of 3: Your password has been secured. The Super Admin has
              been notified to approve your account and confirm your
              departmental privileges.
            </p>
          </>
        )}
      </div>

      {/* Onboarding Progress Stepper */}
      <div className="w-full grid grid-cols-3 gap-2 mb-6">
        <div
          className={`p-2.5 rounded-2xl border text-center ${
            step === "SIGN_IN"
              ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider">
            1. Credentials
          </p>
        </div>
        <div
          className={`p-2.5 rounded-2xl border text-center ${
            step === "SETUP_PASSWORD"
              ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
              : step === "PENDING_APPROVAL"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider">
            2. New Password
          </p>
        </div>
        <div
          className={`p-2.5 rounded-2xl border text-center ${
            step === "PENDING_APPROVAL"
              ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
              : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-muted)]"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider">
            3. Approval
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="w-full mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {statusMessage && (
        <div className="w-full mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* STEP 1: SIGN IN */}
      {step === "SIGN_IN" && (
        <form onSubmit={handleLoginSubmit} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[var(--text-heading)] block">
              Official Admin Email
            </label>
            <div className="flex items-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@oversite.ng"
                className="w-full py-3 px-4 bg-transparent text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none text-[13px] font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[var(--text-heading)] block">
              Password / Temporary Credential
            </label>
            <div className="relative bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-3 pl-4 pr-11 bg-transparent text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none text-[13px] font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
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
            className="w-full py-3 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            <Lock className="w-4 h-4" />
            {loading ? "Authenticating..." : "Sign In to Admin Command"}
          </button>
        </form>
      )}

      {/* STEP 1B: 2FA VERIFICATION */}
      {step === "VERIFY_2FA" && (
        <form onSubmit={handleVerify2fa} className="w-full space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[var(--text-heading)] block">
              6-Digit Security Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              placeholder="123456"
              className="w-full py-3 px-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] text-center tracking-[0.4em] font-mono text-base focus:outline-none focus:border-[var(--primary)]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || twoFactorCode.trim().length < 6}
            className="w-full py-3 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? "Verifying Code..." : "Verify & Continue"}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep("SIGN_IN");
              setTwoFactorCode("");
              setErrorMessage(null);
            }}
            className="w-full py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
          >
            Back to Sign In
          </button>
        </form>
      )}

      {/* STEP 2: MANDATORY PASSWORD UPDATE */}
      {step === "SETUP_PASSWORD" && (
        <form onSubmit={handleSetupPassword} className="w-full space-y-4">
          {policy && (
            <div className="p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center gap-3">
              <Building2 className="w-5 h-5 text-[var(--primary)] shrink-0" />
              <div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Assigned Department
                </p>
                <p className="text-[13px] font-bold text-[var(--text-heading)]">
                  {policy.departmentLabel}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[var(--text-heading)] block">
              New Personal Password (Min. 8 Characters)
            </label>
            <div className="relative bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] focus-within:border-[var(--primary)]">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter strong new password"
                className="w-full py-3 pl-4 pr-11 bg-transparent text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none text-[13px]"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
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
            <label className="text-[11px] font-semibold text-[var(--text-heading)] block">
              Confirm New Password
            </label>
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] focus-within:border-[var(--primary)]">
              <input
                type={showNewPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full py-3 px-4 bg-transparent text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none text-[13px]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <KeyRound className="w-4 h-4" />
            {loading
              ? "Updating Password..."
              : "Save Password & Request Approval"}
          </button>
        </form>
      )}

      {/* STEP 3: PENDING SUPER ADMIN APPROVAL */}
      {step === "PENDING_APPROVAL" && (
        <div className="w-full rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] p-6 space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10.5px] font-bold uppercase tracking-wider">
              Pending Super Admin Approval
            </span>
            <h3 className="text-base font-bold text-[var(--text-heading)] pt-1">
              {user?.name || email}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Department:{" "}
              <strong className="text-[var(--text-heading)]">
                {policy?.departmentLabel || "Departmental Staff"}
              </strong>
            </p>
          </div>

          <p className="text-xs text-[var(--text-muted)] leading-relaxed bg-[var(--bg-secondary)] p-3.5 rounded-2xl border border-[var(--border-color)]">
            Your new password is active. Once the Super Admin approves your
            profile and confirms your Read/Write/Delete privileges in{" "}
            <strong className="text-[var(--text-heading)]">
              Team &amp; Access Governance
            </strong>
            , this screen will automatically unlock your departmental console.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={checkApprovalStatus}
              disabled={checkingApproval}
              className="flex-1 py-2.5 px-4 rounded-2xl bg-[var(--primary)] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  checkingApproval ? "animate-spin" : ""
                }`}
              />
              {checkingApproval ? "Checking..." : "Check Approval Status"}
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                setStep("SIGN_IN");
              }}
              className="py-2.5 px-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-heading)] text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-80 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Zero-Exfiltration DLP Notice */}
      <div className="mt-8 w-full p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[11px] text-[var(--text-muted)] leading-relaxed text-center">
        <strong className="text-[var(--text-heading)]">
          Zero-Exfiltration Security Policy:
        </strong>{" "}
        Copying, downloading, printing, or exporting platform data of any kind
        is strictly disabled across all Oversite Admin terminals.
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center w-full max-w-md mx-auto p-8 animate-pulse text-center">
          <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded-full mb-4" />
          <div className="h-4 w-72 bg-slate-200 dark:bg-slate-800 rounded-full mb-8" />
          <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-2xl mb-4" />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
