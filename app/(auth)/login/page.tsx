"use client";

import Link from "next/link";
import { useState } from "react";
import { EyeOff, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement actual login logic with phone number
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-start mt-2 mb-10 w-full">
        <div className="flex flex-col mt-4">
          <h1 className="text-[27px] font-bold text-(--text-heading) mb-2">Welcome back!</h1>
          <p className="text-[13px] font-medium text-(--text-muted) leading-relaxed">
            Sign in to manage your property, tasks and documents<br />from anywhere in the world.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        {/* Email / Phone Number Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-(--text-heading) block">
            Email / Phone Number
          </label>
          <div className="flex items-center bg-(--bg-card) rounded-3xl overflow-hidden border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] focus-within:ring-1 focus-within:ring-(--primary) focus-within:border-[var(--primary)] transition-all">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
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
            className="w-full py-2 rounded-[24px] bg-[var(--primary)] text-white font-semibold text-[13px] active:scale-[0.98] transition-transform hover:bg-[var(--primary-hover)] flex justify-center items-center"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </div>
      </form>

      {/* Switch to Register */}
      <div className="mt-6 text-center">
        <p className="text-[13px] font-medium text-[var(--text-body)]">
          Don't have an account?{" "}
          <Link href="/register" className="font-bold text-(--primary) hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
