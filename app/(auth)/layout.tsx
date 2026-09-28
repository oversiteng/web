import Link from "next/link";
import Image from "next/image";
import React from "react";
import { ArrowLeft, CheckCircle2, Shield, MapPin, Eye, Lock } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-150px] left-[-100px] w-[600px] h-[600px] bg-emerald-500/10 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-150px] right-[-100px] w-[600px] h-[600px] bg-teal-500/10 blur-[180px] pointer-events-none rounded-full" />

      {/* LEFT COLUMN: Brand Story & Social Proof (Visible on Desktop lg+) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 flex-col justify-between p-12 xl:p-16 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-2xl relative z-10">
        <div>
          {/* Brand Logo */}
          <Link href="/" className="inline-block mb-12 group transition-transform hover:scale-[1.02]">
            <Image
              src="/assets/app-icons/oversite_logo_dark.png"
              alt="Oversite.ng Logo"
              width={160}
              height={42}
              priority
              className="h-9 w-auto"
            />
          </Link>

          {/* Headline & Value Proposition */}
          <div className="space-y-4 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Decentralized Ground Intelligence
            </div>

            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Never build, buy, or monitor blind again.
            </h1>

            <p className="text-sm xl:text-base text-slate-300 leading-relaxed">
              Real-time site telemetry, boundary surveillance, and stage-gated escrow security for diaspora real estate investors.
            </p>
          </div>

          {/* Interactive Live Mission Card Simulation */}
          <div className="mt-10 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-semibold text-white">Live Mission #4829</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[11px] border border-emerald-500/20">
                AGENT_ON_SITE
              </span>
            </div>

            <div className="py-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Epe Corridor, Lagos
                </span>
                <span className="text-slate-400 font-mono text-[11px]">GPS: ±2.4m</span>
              </div>

              <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full w-[78%]" />
              </div>

              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                <span>Milestone 3 of 4: Decking Inspection</span>
                <span className="text-emerald-400 font-semibold font-mono">78% Verified</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                SHA-256 Watermark Enforced
              </span>
              <span className="text-slate-500 font-mono">Escrow: ₦450,000</span>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="mt-8 p-4 rounded-xl bg-slate-800/20 border border-slate-800/50">
            <p className="text-xs text-slate-300 italic leading-relaxed">
              &ldquo;Oversite changed how we monitor our developments from abroad. Verifiable field data, zero excuses.&rdquo;
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="text-xs font-semibold text-white">Elvis Osung</span>
              <span className="text-[11px] text-slate-500">• Total E&P / Diaspora Investor</span>
            </div>
          </div>
        </div>

        {/* Footer Trust Badges */}
        <div className="pt-8 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Accredited Field Agents
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Stage-Gated Escrow
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            CAC Verified
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Auth Content */}
      <div className="w-full lg:w-1/2 xl:w-7/12 flex flex-col justify-between p-6 sm:p-12 relative z-10 overflow-y-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8 sm:mb-12">
          {/* Mobile Logo */}
          <div className="lg:hidden">
            <Link href="/">
              <Image
                src="/assets/app-icons/oversite_logo_dark.png"
                alt="Oversite.ng Logo"
                width={130}
                height={34}
                priority
                className="h-8 w-auto"
              />
            </Link>
          </div>

          <div className="ml-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors bg-slate-900/60 hover:bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to main site
            </Link>
          </div>
        </div>

        {/* Centered Children Container */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          <div className="bg-slate-900/70 backdrop-blur-2xl border border-slate-800/80 rounded-2xl p-6 sm:p-9 shadow-2xl shadow-slate-950/80">
            {children}
          </div>
        </div>

        {/* Bottom Legal Notice */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <span>&copy; {new Date().getFullYear()} Oversite.ng. All rights reserved. </span>
          <Link href="#" className="hover:text-slate-300 underline underline-offset-2">Privacy Policy</Link>
          <span className="mx-1.5">&bull;</span>
          <Link href="#" className="hover:text-slate-300 underline underline-offset-2">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
