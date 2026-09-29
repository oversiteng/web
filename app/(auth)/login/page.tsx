"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock, Mail, ArrowRight, Eye, EyeOff, AlertCircle, Loader2, UserCheck, Shield } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedRoleHint, setSelectedRoleHint] = useState<"USER" | "AGENT">("USER");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Invalid email or password");
      }

      // Store Auth Session in Client Storage & Cookie for Middleware
      const token = data.data.token;
      const user = data.data.user;

      if (token) {
        localStorage.setItem("oversite_token", token);
        document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
      }

      if (user) {
        localStorage.setItem("oversite_user", JSON.stringify(user));
      }

      // Dynamic routing according to authenticated role
      if (user?.role === "AGENT") {
        window.location.href = "/agent/dashboard";
      } else if (user?.role === "ADMIN") {
        window.location.href = "/admin/dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      setErrorMessage((err as Error).message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const fillDemo = (role: "USER" | "AGENT") => {
    setSelectedRoleHint(role);
    setErrorMessage(null);
    if (role === "USER") {
      setEmail("client@oversite.ng");
      setPassword("password123");
    } else {
      setEmail("agent@oversite.ng");
      setPassword("agentpass123");
    }
  };

  return (
    <div>
      {/* Header and Persona Toggle */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Access your ground operations & property dashboard
        </p>

        {/* Persona Segmented Control */}
        <div className="mt-4 p-1 bg-slate-950/80 border border-slate-800 rounded-xl grid grid-cols-2 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedRoleHint("USER")}
            className={`py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              selectedRoleHint === "USER"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Client / Investor
          </button>
          <button
            type="button"
            onClick={() => setSelectedRoleHint("AGENT")}
            className={`py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
              selectedRoleHint === "AGENT"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Field Agent
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Email Address
          </label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={selectedRoleHint === "USER" ? "investor@example.com" : "agent@oversite.ng"}
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 rounded-md transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me Toggle */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0 cursor-pointer accent-emerald-500"
            />
            <span>Remember this device for 30 days</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-emerald-500/30 active:scale-[0.99] mt-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying credentials...</span>
            </>
          ) : (
            <>
              <span>Sign in to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Developer / Demo Quick Fill Helper */}
      <div className="mt-5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="text-slate-400">Quick fill demo:</span>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => fillDemo("USER")}
            className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
          >
            Client
          </button>
          <button
            type="button"
            onClick={() => fillDemo("AGENT")}
            className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
          >
            Field Agent
          </button>
        </div>
      </div>

      {/* Onboarding Callouts */}
      <div className="mt-6 pt-5 border-t border-slate-800/80 text-center text-xs text-slate-400 space-y-2">
        <div>
          <span>New to Oversite? </span>
          <Link
            href="/register"
            className="text-emerald-400 font-semibold hover:text-emerald-300 hover:underline transition-colors"
          >
            Create free client account
          </Link>
        </div>
        <div className="text-[11px] text-slate-400">
          <span>Are you an accredited professional? </span>
          <Link
            href="/register/agent"
            className="text-teal-400 font-semibold hover:text-teal-300 hover:underline transition-colors"
          >
            Join as Field Agent &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
