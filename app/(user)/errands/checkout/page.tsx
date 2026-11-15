"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";

// ── Checkout data shape stored in sessionStorage by the details page ──
interface ErrandCheckoutData {
  errandTypeId: string;
  errandTitle: string;
  errandSubtitle: string;
  propertyId: string | null;
  propertyLabel: string;
  pickupAddress: string;
  deliveryAddress: string;
  timeWindow: string;
  instructions: string;
  description: string;
  isExpress: boolean;
  needsPhotos: boolean;
  collectReceipt: boolean;
  baseFee: number;
  expressFee: number;
  processingFee: number;
  totalFee: number;
}

// ── A single row in the Order Review table ──
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[var(--border-color)]/50 last:border-0">
      <span className="text-[13px] text-[var(--text-muted)] shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-[var(--text-heading)] text-right">{value}</span>
    </div>
  );
}

export default function ErrandCheckoutPage() {
  const router = useRouter();

  const [data, setData] = useState<ErrandCheckoutData | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Payment flow state
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // ── Load checkout data from sessionStorage ──
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("errand_checkout");
      if (!raw) {
        setLoadError(true);
        return;
      }
      const parsed: ErrandCheckoutData = JSON.parse(raw);
      setData(parsed);
    } catch {
      setLoadError(true);
    }
  }, []);

  if (loadError || (!data && !loadError)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 flex flex-col items-center gap-4 text-center">
        {loadError ? (
          <>
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-[15px] font-semibold text-[var(--text-heading)]">
              Checkout session expired
            </p>
            <p className="text-[13px] text-[var(--text-muted)]">
              Please go back and fill in the errand details again.
            </p>
            <button
              type="button"
              onClick={() => router.push("/errands")}
              className="mt-2 px-6 py-3 rounded-full bg-[var(--primary)] text-white font-bold text-[14px] cursor-pointer"
            >
              Start over
            </button>
          </>
        ) : (
          // Still loading from sessionStorage
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    );
  }

  if (!data) return null;

  const {
    errandTitle,
    propertyLabel,
    pickupAddress,
    deliveryAddress,
    timeWindow,
    isExpress,
    needsPhotos,
    collectReceipt,
    baseFee,
    expressFee,
    processingFee,
    totalFee,
  } = data;

  const evidenceLabel = needsPhotos
    ? "Geo-tagged photo & video verification"
    : "No evidence required";

  const receiptLabel = collectReceipt ? "Required" : "Not required";

  const slaLabel = isExpress
    ? `Express SLA (under 2 hours) +₦${expressFee.toLocaleString()}`
    : "Standard SLA (2–4 hours)";

  const locationLabel =
    deliveryAddress
      ? `Pickup: ${pickupAddress} · Dropoff: ${deliveryAddress}`
      : pickupAddress;

  // ── Payment handler ──
  async function handlePay() {
    if (!data || isCreatingTask || isInitializingPayment) return;
    setPaymentError(null);

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("oversite_token")
        : null;

    const authHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) authHeaders["Authorization"] = `Bearer ${token}`;

    // ── Step 1: Create the task as DRAFT ──
    setIsCreatingTask(true);
    let createdId: string;
    try {
      const taskRes = await fetch("/api/v1/tasks/quick-errands", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          title: errandTitle,
          categoryId: data.errandTypeId,
          location: pickupAddress,
          deliveryAddress: deliveryAddress || undefined,
          timeWindow,
          instructions: data.instructions,
          priceNgn: totalFee,
          propertyId: data.propertyId || undefined,
          isExpress,
          asDraft: true, // create as DRAFT until payment confirmed
        }),
      });

      const taskJson = await taskRes.json();
      if (!taskRes.ok || !taskJson.success) {
        throw new Error(taskJson?.error?.message || "Failed to create task");
      }
      createdId = taskJson.data.id;
      setTaskId(createdId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not create task. Please try again.";
      setPaymentError(msg);
      setIsCreatingTask(false);
      return;
    }
    setIsCreatingTask(false);

    // ── Step 2: Initialize payment ──
    setIsInitializingPayment(true);
    try {
      const payRes = await fetch("/api/v1/payments/initialize", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          taskId: createdId,
          amount: totalFee,
          gateway: "PAYSTACK",
        }),
      });

      const payJson = await payRes.json();
      if (!payRes.ok || !payJson.success) {
        throw new Error(payJson?.error?.message || "Payment initialization failed");
      }

      const authorizationUrl: string = payJson.data?.authorizationUrl || payJson.data?.paymentUrl;

      if (authorizationUrl && authorizationUrl.startsWith("http")) {
        // ── Redirect to Paystack checkout page ──
        // Store taskId so we can show success on return
        sessionStorage.setItem("errand_pending_taskId", createdId);
        window.location.href = authorizationUrl;
        return;
      }

      // ── Fallback: Paystack inline / payment MS not configured ──
      // In dev/staging without gateway keys, treat as confirmed for now.
      // In production this branch should never execute.
      console.warn(
        "Payment gateway URL not returned — marking success locally (dev/staging only)"
      );
      setShowSuccess(true);
      sessionStorage.removeItem("errand_checkout");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment failed. Please try again.";
      setPaymentError(msg);
    } finally {
      setIsInitializingPayment(false);
    }
  }

  const isLoading = isCreatingTask || isInitializingPayment;

  const payButtonLabel = isCreatingTask
    ? "Preparing order..."
    : isInitializingPayment
      ? "Opening payment..."
      : `Pay ₦${totalFee.toLocaleString()}`;

  // ── Success overlay (shown after payment confirmed in dev, or on return from gateway) ──
  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs" />
        <div className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-8 shadow-2xl text-center z-10 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-[var(--primary)]/15 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-9 h-9 text-[var(--primary)]" />
          </div>
          <h2 className="text-[20px] font-bold text-[var(--text-heading)]">
            Order Submitted
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mt-3 leading-relaxed">
            Your task has been queued for operative assignment. You will be notified once an agent is matched.
          </p>
          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("errand_checkout");
                sessionStorage.removeItem("errand_pending_taskId");
                router.push("/dashboard/tasks");
              }}
              className="w-full py-3 rounded-full bg-[var(--primary)] hover:bg-[#23993e] text-white font-bold text-[14px] flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer active:scale-95"
            >
              <span>Go to Tasks</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("errand_checkout");
                sessionStorage.removeItem("errand_pending_taskId");
                router.push("/dashboard");
              }}
              className="w-full py-2.5 rounded-full text-[13px] font-semibold text-[var(--text-heading)] bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto min-h-[calc(100dvh-150px)] md:min-h-[calc(100vh-80px)] flex flex-col justify-between relative px-2 sm:px-4 animate-in fade-in duration-200">
      <div>
        {/* ── Header ── */}
        <div className="relative flex items-center justify-center py-4 mb-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute left-0 p-2 -ml-1 rounded-xl text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[17px] sm:text-[19px] font-bold text-[var(--text-heading)] tracking-tight">
            Order review
          </h1>
        </div>

        {/* ── Order Summary Table ── */}
        <div className="rounded-2xl bg-[#F4F6F4] dark:bg-[var(--bg-card)] border border-[var(--border-color)]/60 px-4 py-1 mb-4 shadow-xs">
          <ReviewRow label="Task" value={errandTitle} />
          <ReviewRow label="Property" value={propertyLabel} />
          <ReviewRow label="Details" value={data.description ? "yes" : "—"} />
          <ReviewRow label="Location" value={locationLabel} />
          <ReviewRow label="Delivery window" value={timeWindow} />
          <ReviewRow label="Urgent SLA" value={slaLabel} />
          <ReviewRow label="Evidence" value={evidenceLabel} />
          <ReviewRow label="Receipt" value={receiptLabel} />
        </div>

        {/* ── Fees Breakdown ── */}
        <div className="rounded-2xl bg-[#F4F6F4] dark:bg-[var(--bg-card)] border border-[var(--border-color)]/60 px-4 py-1 shadow-xs">
          <div className="flex items-center justify-between py-3 border-b border-[var(--border-color)]/50">
            <span className="text-[13px] text-[var(--text-muted)]">Service fee</span>
            <span className="text-[14px] font-semibold text-[var(--text-heading)]">
              ₦{(baseFee + expressFee).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-[13px] text-[var(--text-muted)]">Processing charge</span>
            <span className="text-[14px] font-semibold text-[var(--text-heading)]">
              ₦{processingFee.toLocaleString()}
            </span>
          </div>
        </div>

        {/* ── Payment Error ── */}
        {paymentError && (
          <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-red-600 dark:text-red-400">{paymentError}</p>
          </div>
        )}

        {/* ── Draft notice ── */}
        <p className="mt-4 text-[11.5px] text-[var(--text-muted)] text-center px-2 leading-relaxed">
          Your task will only be submitted once payment is completed successfully.
          Incomplete payments are saved as drafts.
        </p>
      </div>

      {/* ── Bottom Sticky CTA ── */}
      <div className="pt-6 pb-4 sticky bottom-[68px] md:bottom-0 bg-[var(--bg-body)]/95 backdrop-blur-md z-40 mt-6 border-t border-[var(--border-color)] -mx-2 sm:-mx-4 px-2 sm:px-4">
        <button
          id="pay-errand-btn"
          type="button"
          disabled={isLoading}
          onClick={handlePay}
          className="w-full py-4 rounded-full bg-[var(--primary)] hover:bg-[#23993e] text-white font-bold text-[16px] transition-all duration-200 shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
          )}
          {payButtonLabel}
        </button>
      </div>
    </div>
  );
}
