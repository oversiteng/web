"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Search, Building2, MessageSquare, Scale, X } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DynamicLoadingState } from "@/components/ui/DynamicLoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

interface NotificationItem {
  id: string;
  icon: typeof FileText;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  isUnread?: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    icon: FileText,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    title: "The report for the Ikoyi site visit is now complete.",
    subtitle: "Property Oversite · 2h ago",
    isUnread: true,
  },
  {
    id: "notif-2",
    icon: FileText,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    title: "Assigned Agent: Retrieval of CAC Copy",
    subtitle: "Documents processing · 5h ago",
    isUnread: true,
  },
  {
    id: "notif-3",
    icon: Search,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    title: "Encroachment alert on Lekki plot",
    subtitle: "Property Oversite · today",
  },
  {
    id: "notif-4",
    icon: Building2,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    title: "We have successfully processed your payment of ₦18,500. Thank you for your transaction!",
    subtitle: "Billing · today",
  },
  {
    id: "notif-5",
    icon: MessageSquare,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    title: "New message from Tunde C.",
    subtitle: "Messages · yesterday",
  },
  {
    id: "notif-6",
    icon: Scale,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    title: "Your tenancy review is complete!",
    subtitle: "Legal Advisory · 5d ago",
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(DEFAULT_NOTIFICATIONS);
  const [isLoading, setIsLoading] = useState(false);

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="relative w-full text-[var(--text-heading)] pb-12 transition-colors duration-150">
      {/* ── Unified Page Header ── */}
      <PageHeader
        title="Notifications"
        showBack={true}
        onBack={() => router.back()}
        rightSlot={
          notifications.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[12px] font-semibold text-[var(--text-muted)] hover:text-red-500 transition-colors cursor-pointer px-1 py-1"
            >
              Clear all
            </button>
          ) : null
        }
      />

      {/* ── Notifications Content ── */}
      <div className="pt-1">
        {isLoading ? (
          <DynamicLoadingState variant="notifications" count={5} />
        ) : notifications.length === 0 ? (
          <EmptyState
            preset="notifications"
            action={{
              label: "Back to Dashboard",
              href: "/dashboard",
            }}
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const IconComp = notif.icon;
              return (
                <div
                  key={notif.id}
                  className="group relative flex items-start gap-3.5 p-3.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)]/70 hover:border-[var(--primary)]/40 shadow-xs transition-all"
                >
                  {/* Icon badge */}
                  <div
                    className={`relative shrink-0 w-10 h-10 rounded-full ${notif.iconBg} flex items-center justify-center mt-0.5`}
                  >
                    <IconComp className={`w-5 h-5 ${notif.iconColor}`} />
                    {notif.isUnread && (
                      <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--primary)] border-2 border-[var(--bg-card)] rounded-full" />
                    )}
                  </div>

                  {/* Body Text */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-[13.5px] sm:text-[14px] font-semibold text-[var(--text-heading)] leading-snug">
                      {notif.title}
                    </p>
                    <p className="text-[11.5px] text-[var(--text-muted)] mt-1 font-medium">
                      {notif.subtitle}
                    </p>
                  </div>

                  {/* Dismiss Button */}
                  <button
                    type="button"
                    onClick={() => handleDismiss(notif.id)}
                    aria-label="Dismiss notification"
                    className="absolute top-3.5 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-secondary)] opacity-60 group-hover:opacity-100 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
