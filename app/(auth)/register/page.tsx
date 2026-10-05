"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, ArrowLeft, EyeClosed } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Implement actual registration logic
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-start mb-6 w-full">
        <button
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="w-6 h-6 text-[var(--text-heading)]" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-[27px] font-bold text-[var(--text-heading)] mb-2">Sign Up</h1>
          <p className="text-[13px] font-medium text-var(--text-muted) leading-relaxed">
            Create an account to continue!
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        {/* Name Row */}
        <div className="flex flex-row gap-3">
          {/* First Name */}
          <div className="space-y-1 flex-1">
            <label className="text-[11px] font-medium text-[var(--text-heading)] block">
              First Name
            </label>
            <div className="flex items-center bg-(--bg-card) rounded-[24px] overflow-hidden border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] focus-within:ring-1 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)] transition-all">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First"
                className="w-full py-3 px-6 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-[12px] font-medium"
                required
              />
            </div>
          </div>

          {/* Last Name */}
          <div className="space-y-1 flex-1">
            <label className="text-[11px] font-medium text-[var(--text-heading)] block">
              Last Name
            </label>
            <div className="flex items-center bg-(--bg-card) rounded-[24px] overflow-hidden border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] focus-within:ring-1 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)] transition-all">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last"
                className="w-full py-3 px-6 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-[12px] font-medium"
                required
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--text-heading)] block">
            Email
          </label>
          <div className="flex items-center bg-(--bg-card) rounded-[24px] overflow-hidden border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] focus-within:ring-1 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)] transition-all">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. mailali@gmail.com"
              className="w-full py-3 px-6 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-[12px] font-medium"
              required
            />
          </div>
        </div>

        {/* Phone Number Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--text-heading)] block">
            Phone Number
          </label>
          <div className="flex items-center bg-(--bg-card) rounded-[24px] overflow-hidden border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] focus-within:ring-1 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)] transition-all pl-2">
            <div className="pl-4 pr-3 py-3 text-[var(--text-heading)] font-semibold text-[12px] border-r border-(--border-color) flex-shrink-0">
              +234
            </div>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="801 234 5678"
              className="w-full py-3 px-4 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-[12px] font-medium"
              required
            />
          </div>
        </div>

        {/* Password */}
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
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#a0aab4] hover:text-[var(--text-heading)] transition-colors"
            >
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeClosed className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-(--text-heading) block">
            Confirm Password
          </label>
          <div className="relative bg-(--bg-card) rounded-3xl border border-transparent shadow-[0_0_10px_rgba(0,0,0,0.03)] focus-within:ring-1 focus-within:ring-[var(--primary)] focus-within:border-[var(--primary)] transition-all">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
              className="w-full py-3 pl-6 pr-12 bg-transparent text-(--text-heading) placeholder:text-[#a0aab4] focus:outline-none text-[12px] font-medium tracking-widest"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#a0aab4] hover:text-(--text-heading) transition-colors"
            >
              {showConfirmPassword ? <Eye className="w-5 h-5" /> : <EyeClosed className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="flex items-center pt-2 pb-6 px-2">
          <input
            type="checkbox"
            id="terms"
            className="w-3 h-3 rounded-xs border-gray-300 accent-(--primary) focus:ring-(--primary) mr-3 bg-(--bg-card)"
            required
          />
          <label htmlFor="terms" className="text-[12px] font-semibold text-(--text-heading)">
            I agree to the Terms and Conditions
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-0">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-3xl bg-(--primary) text-white font-semibold text-[13px] active:scale-[0.98] transition-transform hover:bg-[var(--primary-hover)] flex justify-center items-center"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </div>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 text-center">
        <p className="text-[13px] font-medium text-(--text-body)">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-(--primary) hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
