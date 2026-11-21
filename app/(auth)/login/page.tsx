"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { EyeOff, Eye, ShieldCheck, ArrowLeft, KeyRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function LoginFormContent() {
  const { user, isLoading: authLoading, setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAgentMode = searchParams.get("role") === "agent";

  // 2FA state
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<{ token: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [verifying2fa, setVerifying2fa] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "AGENT") {
        router.replace("/agent/dashboard");
      } else if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error?.message || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      // Check if 2FA challenge is required
      if (data.data?.requiresTwoFactor && data.data?.twoFactorToken) {
        setTwoFactorChallenge({ token: data.data.twoFactorToken });
        setLoading(false);
        return;
      }

      if (data.data?.user) {
        await setSession(data.data.user, data.data.token);
      } else if (data.data?.token) {
        localStorage.setItem("oversite_token", data.data.token);
      }

      if (data.data?.user?.role === "AGENT") {
        router.push("/agent/dashboard");
      } else if (data.data?.user?.role === "ADMIN" || data.data?.user?.role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setErrorMessage("Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorChallenge?.token || !twoFactorCode.trim()) return;

    setVerifying2fa(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v1/auth/login/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          twoFactorToken: twoFactorChallenge.token,
          code: twoFactorCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error?.message || "Invalid code. Please try again.");
        setVerifying2fa(false);
        return;
      }

      if (data.data?.user) {
        await setSession(data.data.user, data.data.token);
      } else if (data.data?.token) {
        localStorage.setItem("oversite_token", data.data.token);
      }

      if (data.data?.user?.role === "AGENT") {
        router.push("/agent/dashboard");
      } else if (data.data?.user?.role === "ADMIN" || data.data?.user?.role === "SUPER_ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setErrorMessage("Failed to verify code. Please try again.");
      setVerifying2fa(false);
    }
  };

  // 2FA Screen
  if (twoFactorChallenge) {
    return (
      <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-start mt-2 mb-8 w-full">
          <button
            type="button"
            onClick={() => {
              setTwoFactorChallenge(null);
              setTwoFactorCode("");
              setErrorMessage(null);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)] mb-6 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>

          <div className="w-12 h-12 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-4 border border-[var(--primary-border)] shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <h1 className="text-[24px] font-bold text-[var(--text-heading)] mb-2">
            Two-Factor Authentication
          </h1>
          <p className="text-[13px] font-medium text-[var(--text-muted)] leading-relaxed">
            Enter the 6-digit verification code sent to your registered email address.
          </p>
        </div>

        {errorMessage && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleVerify2fa} className="w-full space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-[var(--text-heading)] block">
              Security Code
            </label>
            <div className="flex items-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]/70 focus-within:ring-2 focus-within:ring-[var(--primary)] focus-within:border-transparent transition-all shadow-2xs">
              <input
                type="text"
                maxLength={6}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full py-3.5 px-4 text-center tracking-[8px] text-[22px] font-bold font-mono bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none"
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={verifying2fa || twoFactorCode.length < 6}
            className="w-full py-3 rounded-2xl bg-[var(--primary)] text-white font-semibold text-[13px] active:scale-[0.98] transition-transform hover:bg-[var(--primary-hover)] flex justify-center items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {verifying2fa ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-muted)] mt-6">
          Didn&apos;t receive the code? Check your spam folder or return to sign in to request a new code.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-start mt-2 mb-10 w-full">
        <div className="flex flex-col mt-4">
          <h1 className="text-[27px] font-bold text-(--text-heading) mb-2">
            {isAgentMode ? "Agent Sign In" : "Welcome back!"}
          </h1>
          <p className="text-[13px] font-medium text-(--text-muted) leading-relaxed">
            {isAgentMode ? (
              <>Sign in to manage your inspection tasks, field reports and earnings.</>
            ) : (
              <>
                Sign in to manage your property, tasks and documents<br />from anywhere in the world.
              </>
            )}
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="w-full mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        {/* Email Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-(--text-heading) block">
            Email
          </label>
          <div className="flex items-center bg-(--bg-card) rounded-3xl overflow-hidden border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] focus-within:ring-1 focus-within:ring-(--primary) focus-within:border-[var(--primary)] transition-all">
            <input
              type="text"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="e.g. mailali@gmail.com"
              className="w-full py-3 px-6 bg-transparent text-(--text-heading) placeholder:text-[#a0aab4] focus:outline-none text-[12px] font-medium"
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--text-heading)] block">
            Password
          </label>
          <div className="relative bg-(--bg-card) rounded-[24px] border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] focus-within:ring-1 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)] transition-all">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full py-3 pl-6 pr-12 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-[12px] font-medium tracking-widest"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-var(--text-muted) hover:text-[var(--text-body)] transition-colors"
            >
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Forget Password Link */}
        <div className="flex justify-end pt-1 mb-8">
          <Link href="/forgot-password" className="text-[11px] font-bold text-[var(--primary)] hover:underline">
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <div className="pt-0">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-[24px] bg-[var(--primary)] text-white font-semibold text-[13px] active:scale-[0.98] transition-transform hover:bg-[var(--primary-hover)] flex justify-center items-center cursor-pointer shadow-sm"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </div>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 text-center space-y-2">
        <p className="text-[13px] font-medium text-[var(--text-body)]">
          Don&apos;t have an account?{" "}
          <Link href={isAgentMode ? "/register/agent" : "/register"} className="font-bold text-(--primary) hover:underline">
            Sign up
          </Link>
        </p>
        <p className="text-[12px] text-(--text-muted)">
          {isAgentMode ? (
            <>
              Looking for property inspections?{" "}
              <Link href="/login" className="font-bold text-(--primary) hover:underline">
                Client Login
              </Link>
            </>
          ) : (
            <>
              Are you an inspector or advisor?{" "}
              <Link href="/register/agent" className="font-bold text-(--primary) hover:underline">
                Sign up as Agent
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center w-full max-w-sm mx-auto p-8 animate-pulse text-center">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
          <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded-full mb-8"></div>
          <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl mb-4"></div>
          <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-3xl mb-4"></div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
