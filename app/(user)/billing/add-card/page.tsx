"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, Info, Check } from "lucide-react";

export default function AddCardPage() {
  const router = useRouter();

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Format Card Number (adds space every 4 digits)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 16) val = val.slice(0, 16);
    const formatted = val.replace(/(\d{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length > 2) {
      val = val.slice(0, 2) + "/" + val.slice(2);
    }
    setExpiry(val);
  };

  // Format CVV (max 3 digits)
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 3);
    setCvv(val);
  };

  const isFormValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    expiry.length === 5 &&
    cvv.length >= 3 &&
    cardholderName.trim().length > 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsSubmitting(true);
    setToastMessage("Card saved successfully!");

    setTimeout(() => {
      router.push("/billing");
    }, 1200);
  };

  return (
    <div className="relative w-full max-w-md mx-auto text-[var(--text-heading)] pb-16 select-none">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 flex justify-center pointer-events-none transition-all duration-300">
          <div className="w-full max-w-sm bg-[var(--bg-card)] text-[var(--text-heading)] px-4 py-3 rounded-2xl shadow-2xl border border-[var(--border-color)] flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4">
            <div className="w-5 h-5 rounded-full bg-[var(--primary-light)] flex items-center justify-center shrink-0">
              <Check className="w-3.5 h-3.5 text-[var(--primary)] stroke-[3]" />
            </div>
            <span className="text-[13px] font-medium tracking-wide truncate">
              {toastMessage}
            </span>
          </div>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="relative flex items-center justify-center py-3 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="absolute left-0 w-9 h-9 flex items-center justify-center text-[var(--text-heading)] hover:opacity-75 transition-opacity cursor-pointer -ml-1"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <h1 className="text-[17px] sm:text-[18px] font-semibold text-[var(--text-heading)]">
          Add payment method
        </h1>
      </div>

      {/* ── Card Input Form matching Screenshot 3 ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Number */}
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
            Card number
          </label>
          <div className="flex items-center gap-3.5 bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-4 transition-all shadow-xs">
            <CreditCard className="w-5 h-5 text-[var(--text-muted)] shrink-0 stroke-[1.8]" />
            <input
              type="text"
              value={cardNumber}
              onChange={handleCardNumberChange}
              placeholder="0000 0000 0000 0000"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none font-medium tracking-wider"
            />
          </div>
        </div>

        {/* Expiry & CVV Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Expiry */}
          <div>
            <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
              Expiry
            </label>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-4 transition-all shadow-xs">
              <input
                type="text"
                value={expiry}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none font-medium"
              />
            </div>
          </div>

          {/* CVV */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <label className="text-[13px] font-medium text-[var(--text-heading)]">
                CVV
              </label>
              <Info className="w-3.5 h-3.5 text-[var(--text-muted)] cursor-pointer" />
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-4 transition-all shadow-xs">
              <input
                type="password"
                maxLength={4}
                value={cvv}
                onChange={handleCvvChange}
                placeholder="---"
                className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none font-medium tracking-widest"
              />
            </div>
          </div>
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-[13px] font-medium text-[var(--text-heading)] mb-2">
            Cardholder name
          </label>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary)]/20 rounded-full px-5 py-4 transition-all shadow-xs">
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-transparent text-[14px] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] outline-none font-medium"
            />
          </div>
        </div>

        {/* Save Card Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-4 rounded-full font-semibold text-[14px] transition-all flex items-center justify-center gap-2 ${
              isFormValid
                ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-md active:scale-[0.99] cursor-pointer"
                : "bg-[var(--bg-secondary)] text-[var(--text-muted)] cursor-not-allowed opacity-80"
            }`}
          >
            {isSubmitting ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Save card"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
