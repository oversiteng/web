"use client";

import { ArrowLeft, FileText, Search, Building2, MessageSquare, Scale } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 relative pb-8">
      {/* Top Bar */}
      <div className="flex items-center gap-4 pt-2 mb-8">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-(--bg-card) rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.03)] hover:bg-(--bg-secondary) transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[var(--text-heading)]" />
        </button>
        <h1 className="text-[20px] font-bold text-[var(--text-heading)]">Notification</h1>
      </div>

      {/* Notification List */}
      <div className="space-y-6 px-1">

        {/* Notification 1 */}
        <div className="flex gap-4 items-start">
          <div className="relative shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mt-1">
            <FileText className="w-5 h-5 text-emerald-500" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[var(--bg-body)] rounded-full" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[var(--text-heading)] leading-snug">
              The report for the Ikoyi site visit is now complete.
            </p>
            <p className="text-[12px] text-var(--text-muted) mt-1">Property Oversite · 2h ago</p>
          </div>
        </div>

        {/* Notification 2 */}
        <div className="flex gap-4 items-start">
          <div className="relative shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mt-1">
            <FileText className="w-5 h-5 text-emerald-500" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[var(--bg-body)] rounded-full" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[var(--text-heading)] leading-snug">
              Assigned Agent: Retrieval of CAC Copy
            </p>
            <p className="text-[12px] text-var(--text-muted) mt-1">Documents processing · 5h ago</p>
          </div>
        </div>

        {/* Notification 3 */}
        <div className="flex gap-4 items-start">
          <div className="shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mt-1">
            <Search className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[var(--text-heading)] leading-snug">
              Encroachment alert on Lekki plot
            </p>
            <p className="text-[12px] text-var(--text-muted) mt-1">Property Oversite · today</p>
          </div>
        </div>

        {/* Notification 4 */}
        <div className="flex gap-4 items-start">
          <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mt-1">
            <Building2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[var(--text-heading)] leading-snug">
              We have successfully processed your payment of ₦18,500. Thank you for your transaction!
            </p>
            <p className="text-[12px] text-var(--text-muted) mt-1">Billing · today</p>
          </div>
        </div>

        {/* Notification 5 */}
        <div className="flex gap-4 items-start">
          <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mt-1">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[var(--text-heading)] leading-snug">
              New message from Tunde C.
            </p>
            <p className="text-[12px] text-var(--text-muted) mt-1">Messages · yesterday</p>
          </div>
        </div>

        {/* Notification 6 */}
        <div className="flex gap-4 items-start">
          <div className="shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mt-1">
            <Scale className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[var(--text-heading)] leading-snug">
              Your tenancy review is complete!
            </p>
            <p className="text-[12px] text-var(--text-muted) mt-1">Legal Advisory · 5d ago</p>
          </div>
        </div>

      </div>
    </div>
  );
}
