"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Share2, Download, CheckCircle2, BadgeCheck } from "lucide-react";

function PaystackIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 8C6 6.5 10 6.5 13 8C16 9.5 20 9.5 22 8"
        stroke="#00C3F7"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M3 16C6 14.5 10 14.5 13 16C16 17.5 20 17.5 22 16"
        stroke="#00C3F7"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ReceiptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic parameters with mock fallbacks matching screenshot
  const txnNo = searchParams.get("txn") || "T83746192048591";
  const amount = searchParams.get("amount") || "₦5,000";
  const service = searchParams.get("service") || "CAC certified copy";
  const date = searchParams.get("date") || "Jul 19th, 2026 16:45";
  const method = searchParams.get("method") || "Paystack";
  const status = searchParams.get("status") || "Paid";

  const handleDownload = () => {
    setToastMessage("Receipt downloaded successfully!");
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);

    // Simulate file download
    const receiptText = `OVERSITE.NG PAYMENT RECEIPT\nTransaction No: ${txnNo}\nService: ${service}\nAmount: ${amount}\nDate: ${date}\nStatus: ${status}\nPayment Gateway: ${method}\n\nThank you for choosing Oversite.ng.`;
    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${txnNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Oversite Receipt - ${service}`,
          text: `Payment receipt of ${amount} for ${service}. Ref: ${txnNo}`,
          url: window.location.href,
        });
      } catch (err) {
        // User canceled or not allowed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToastMessage("Receipt link copied to clipboard!");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-16 select-none">
      {/* ── Toast Notification Banner matching Screenshot 2 ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 px-4 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.2]" />
            <span className="text-[13.5px] font-medium tracking-wide">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="flex items-center py-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* ── Receipt Card Container ── */}
      <div className="w-full bg-white dark:bg-[#1a1b1e] border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-6 sm:p-8 shadow-xl text-zinc-900 dark:text-white mb-8 transition-colors">
        {/* Scalloped Green Check Badge */}
        <div className="flex justify-center pt-2">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
            <BadgeCheck className="w-12 h-12 text-emerald-500 fill-emerald-500 text-white stroke-[1.5]" />
          </div>
        </div>

        {/* Amount */}
        <div className="text-center mt-5 mb-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {amount}
          </h1>
        </div>

        {/* Payment Successful */}
        <p className="text-[15px] font-semibold text-zinc-600 dark:text-zinc-300 text-center mb-1">
          Payment Successful
        </p>

        {/* Timestamp */}
        <p className="text-[12px] text-zinc-400 dark:text-zinc-500 text-center mb-8">
          {date}
        </p>

        {/* Details Table */}
        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
          {/* Transaction No */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] text-zinc-400 dark:text-zinc-400 font-normal">
              Transaction No
            </span>
            <span className="text-[13px] text-zinc-900 dark:text-white font-bold tracking-tight">
              {txnNo}
            </span>
          </div>

          {/* Service */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] text-zinc-400 dark:text-zinc-400 font-normal">
              Service
            </span>
            <span className="text-[13px] text-zinc-900 dark:text-white font-bold">
              {service}
            </span>
          </div>

          {/* Payment Method */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] text-zinc-400 dark:text-zinc-400 font-normal">
              Payment Method
            </span>
            <div className="flex items-center gap-1.5">
              <PaystackIcon className="w-4 h-4" />
              <span className="text-[13px] text-zinc-900 dark:text-white font-bold">
                {method}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] text-zinc-400 dark:text-zinc-400 font-normal">
              Status
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Action Buttons matching Screenshot ── */}
      <div className="flex items-center gap-3">
        {/* Share Button */}
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 py-3.5 px-4 rounded-full border-2 border-[#2BB44A] text-[#2BB44A] font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[#2BB44A]/10 active:scale-[0.99] transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4 stroke-[2.2]" />
          <span>Share</span>
        </button>

        {/* Download Receipt Button */}
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 py-3.5 px-4 rounded-full bg-[#2BB44A] hover:bg-[#249e41] text-white font-semibold text-[14px] flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer shadow-md"
        >
          <Download className="w-4 h-4 stroke-[2.2]" />
          <span>Download Receipt</span>
        </button>
      </div>
    </div>
  );
}
