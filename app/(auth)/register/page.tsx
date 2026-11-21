"use client";

import Link from "next/link";
import { useState, useMemo, useRef } from "react";
import { Eye, ArrowLeft, EyeClosed, MailCheck, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Country } from "country-state-city";
import { ResponsiveSelect } from "@/components/ui/ResponsiveSelect";

export default function RegisterPage() {
  const { setSession } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedCountryIso, setSelectedCountryIso] = useState("NG");

  const countryList = useMemo(() => {
    const countries = Country.getAllCountries()
      .filter((c) => c.phonecode)
      .map((c) => {
        const rawCode = c.phonecode.replace(/[^0-9]/g, "");
        return {
          isoCode: c.isoCode,
          name: c.name,
          flag: c.flag,
          phonecode: rawCode ? `+${rawCode}` : `+${c.phonecode}`,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    const ngIndex = countries.findIndex((c) => c.isoCode === "NG");
    if (ngIndex > -1) {
      const [ng] = countries.splice(ngIndex, 1);
      return [ng, ...countries];
    }
    return countries;
  }, []);

  const selectedCountry = useMemo(() => {
    return (
      countryList.find((c) => c.isoCode === selectedCountryIso) ||
      countryList[0] || {
        isoCode: "NG",
        name: "Nigeria",
        flag: "🇳🇬",
        phonecode: "+234",
      }
    );
  }, [countryList, selectedCountryIso]);

  const countryOptions = useMemo(
    () =>
      countryList.map((c) => ({
        value: c.isoCode,
        label: `${c.flag} ${c.name} (${c.phonecode})`,
      })),
    [countryList]
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [step, setStep] = useState<"FORM" | "OTP">("FORM");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }
    setLoading(true);
    setErrorMessage(null);

    const trimmedPhone = phoneNumber.trim();
    let formattedPhone = "";
    if (trimmedPhone) {
      if (trimmedPhone.startsWith("+")) {
        formattedPhone = trimmedPhone;
      } else {
        const cleaned = trimmedPhone.replace(/[\s\-()]/g, "");
        const nationalNumber = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned;
        formattedPhone = `${selectedCountry.phonecode}${nationalNumber}`;
      }
    }

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          phoneNumber: formattedPhone,
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMessage(data.error?.message || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      if (data.data?.user) {
        await setSession(data.data.user, data.data.token);
      } else if (data.data?.token) {
        localStorage.setItem("oversite_token", data.data.token);
      }

      setLoading(false);
      setStep("OTP");
      setOtpNotice(`We sent a 6-digit verification code to ${email.trim()}`);
    } catch (error) {
      console.error(error);
      setErrorMessage("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split("");
      const next = [...otpDigits];
      chars.forEach((c, idx) => {
        if (index + idx < 6) next[index + idx] = c;
      });
      setOtpDigits(next);
      const nextFocus = Math.min(5, index + chars.length);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }
    const next = [...otpDigits];
    next[index] = clean;
    setOtpDigits(next);
    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }
    setVerifyingOtp(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email.trim(), code }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.error?.message || "Invalid or expired verification code.");
        setVerifyingOtp(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setErrorMessage("Network error while verifying code. Please try again.");
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    setErrorMessage(null);
    setOtpNotice(null);
    try {
      const res = await fetch("/api/v1/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email.trim(), action: "RESEND" }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setOtpNotice("A fresh 6-digit verification code has been sent to your email.");
      } else {
        setErrorMessage(json.error?.message || "Could not resend verification code.");
      }
    } catch {
      setErrorMessage("Network error while resending code.");
    } finally {
      setResendingOtp(false);
    }
  };

  if (step === "OTP") {
    return (
      <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="flex flex-col items-start mb-6 w-full">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center mb-4">
            <MailCheck className="w-6 h-6" />
          </div>
          <h1 className="text-[24px] font-bold text-[var(--text-heading)] mb-1.5">
            Verify Your Email
          </h1>
          <p className="text-[13px] font-medium text-[var(--text-muted)] leading-relaxed">
            Enter the 6-digit code sent to{" "}
            <strong className="text-[var(--text-heading)]">{email.trim()}</strong> to complete your account verification.
          </p>
        </div>

        {otpNotice && (
          <div className="w-full mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{otpNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div className="w-full mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleVerifyEmailOtp} className="w-full space-y-5">
          <div className="grid grid-cols-6 gap-2">
            {otpDigits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
                    otpInputRefs.current[idx - 1]?.focus();
                  }
                }}
                className="w-full h-12 text-center text-base font-bold rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-heading)] focus:outline-none focus:border-[var(--primary)]"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={verifyingOtp}
            className="w-full py-2.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold text-[13px] transition-all cursor-pointer disabled:opacity-50"
          >
            {verifyingOtp ? "Verifying..." : "Verify Email & Continue"}
          </button>

          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              disabled={resendingOtp}
              onClick={handleResendOtp}
              className="font-semibold text-[var(--primary)] hover:underline cursor-pointer disabled:opacity-50"
            >
              {resendingOtp ? "Sending..." : "Resend 6-digit code"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
            >
              Verify later →
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col items-start mb-6 w-full">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6 text-[var(--text-heading)]" />
        </button>
        <div className="flex flex-col">
          <h1 className="text-[26px] font-bold text-[var(--text-heading)] mb-1.5">Sign Up</h1>
          <p className="text-[13px] font-medium text-[var(--text-muted)] leading-relaxed">
            Create an account to continue!
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="w-full mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center animate-in fade-in">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-3">
        {/* Name Row */}
        <div className="flex flex-row gap-3">
          <div className="space-y-1 flex-1">
            <label className="text-[11px] font-medium text-[var(--text-heading)] block">
              First Name
            </label>
            <div className="flex items-center bg-[var(--bg-card)] rounded-lg overflow-hidden border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First"
                className="w-full py-2.5 px-3.5 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-xs font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-1 flex-1">
            <label className="text-[11px] font-medium text-[var(--text-heading)] block">
              Last Name
            </label>
            <div className="flex items-center bg-[var(--bg-card)] rounded-lg overflow-hidden border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last"
                className="w-full py-2.5 px-3.5 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-xs font-medium"
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
          <div className="flex items-center bg-[var(--bg-card)] rounded-lg overflow-hidden border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. mailali@gmail.com"
              className="w-full py-2.5 px-3.5 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-xs font-medium"
              required
            />
          </div>
        </div>

        {/* Phone Number Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--text-heading)] block">
            Phone Number
          </label>
          <div className="flex items-center bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
            <ResponsiveSelect
              value={selectedCountryIso}
              onChange={setSelectedCountryIso}
              options={countryOptions}
              modalTitle="Select Country Dialing Code"
              searchable={true}
              searchPlaceholder="Search country or code..."
              className="shrink-0"
              triggerClassName="border-0 border-r border-[var(--border-color)] rounded-none rounded-l-lg px-3 py-2.5 bg-transparent"
              renderTriggerValue={() => (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                  <span>{selectedCountry.flag}</span>
                  <span>{selectedCountry.phonecode}</span>
                </span>
              )}
            />
            <input
              type="tel"
              inputMode="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder={selectedCountry.isoCode === "NG" ? "801 234 5678" : "Phone number"}
              className="w-full py-2.5 px-3.5 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-xs font-medium"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--text-heading)] block">
            Password
          </label>
          <div className="relative bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full py-2.5 pl-3.5 pr-10 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-xs font-medium tracking-widest"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a0aab4] hover:text-[var(--text-heading)] transition-colors"
            >
              {showPassword ? <Eye className="w-4 h-4" /> : <EyeClosed className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-[var(--text-heading)] block">
            Confirm Password
          </label>
          <div className="relative bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)] focus-within:border-[var(--primary)] transition-all">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
              className="w-full py-2.5 pl-3.5 pr-10 bg-transparent text-[var(--text-heading)] placeholder:text-[#a0aab4] focus:outline-none text-xs font-medium tracking-widest"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a0aab4] hover:text-[var(--text-heading)] transition-colors"
            >
              {showConfirmPassword ? <Eye className="w-4 h-4" /> : <EyeClosed className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="flex items-center pt-1 pb-4 px-1">
          <input
            type="checkbox"
            id="terms"
            className="w-3.5 h-3.5 rounded-xs border-gray-300 accent-[var(--primary)] focus:ring-[var(--primary)] mr-2.5 bg-[var(--bg-card)]"
            required
          />
          <label htmlFor="terms" className="text-xs font-semibold text-[var(--text-heading)]">
            I agree to the Terms and Conditions
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-0">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[var(--primary)] text-white font-semibold text-[13px] active:scale-[0.99] transition-all hover:bg-[var(--primary-hover)] flex justify-center items-center cursor-pointer"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </div>
      </form>

      {/* Switch to Login */}
      <div className="mt-6 text-center">
        <p className="text-[13px] font-medium text-[var(--text-body)]">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[var(--primary)] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
