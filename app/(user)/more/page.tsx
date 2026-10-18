import Link from "next/link";
import Image from "next/image";

const MENU_ITEMS = [
  {
    icon: "ai-settings",
    title: "Settings",
    subtitle: "Update profile and manage account",
    href: "/settings",
  },
  {
    icon: "ai-file-text",
    title: "Document Vault",
    subtitle: "Reports, copies and evidence",
    href: "/vault",
  },
  {
    icon: "ai-card",
    title: "Billing and Payments",
    subtitle: "Plan, methods and history",
    href: "/billing",
  },
  {
    icon: "ai-shield",
    title: "Security",
    subtitle: "Change password, 2FA",
    href: "/security",
  },
  {
    icon: "ai-message",
    title: "Support",
    subtitle: "Chat support for quick response",
    href: "/support",
  },
  {
    icon: "ai-circle-info",
    title: "About",
    subtitle: "Learn more about oversite",
    href: "/about",
  },
  {
    icon: "ai-logout",
    title: "Logout",
    subtitle: "Sign out of your account",
    href: "/logout",
  },
  {
    icon: "ai-trash",
    title: "Delete Account",
    subtitle: "Permanently remove your data",
    href: "/delete-account",
    danger: true,
  },
];

export default function MorePage() {
  return (
    <div className="relative min-h-screen pb-24 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-center pt-4 pb-8 relative z-10">
        <h1 className="text-[18px] font-bold text-[var(--text-heading)]">More</h1>
      </div>

      {/* Profile Section */}
      <Link
        href="/settings/profile"
        className="flex items-center gap-4 px-4 mb-10 relative z-10 cursor-pointer hover:opacity-90 transition-opacity"
      >
        <div className="relative w-16 h-16 rounded-full bg-[#1A2F4C] flex items-center justify-center text-[22px] font-bold text-blue-400 shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.1)]">
          Al
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--primary)] text-white border-2 border-[var(--bg-body)] flex items-center justify-center">
            <i className="ai-edit-alt text-[12px]" />
          </div>
        </div>
        <div>
          <h2 className="text-[16px] font-bold text-[var(--text-heading)]">Aisha Lawal</h2>
          <p className="text-[13px] text-var(--text-muted) mt-0.5">adeeze19@gmail.com</p>
        </div>
        <div className="ml-auto">
          <i className="ai-chevron-right text-var(--text-muted) text-[20px]" />
        </div>
      </Link>

      {/* Menu List */}
      <div className="space-y-1 relative z-10">
        {MENU_ITEMS.map((item, idx) => (
          <Link
            key={idx}
            href={item.href}
            className="flex items-center gap-4 px-4 py-3 hover:bg-(--bg-secondary) transition-colors group"
          >
            <div className={`w-6 flex justify-center shrink-0 ${item.danger ? "text-red-500" : "text-[var(--text-heading)] dark:text-[var(--text-body)]"}`}>
              <i className={`${item.icon} text-[22px] font-light`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-[15px] font-semibold ${item.danger ? "text-red-500" : "text-[var(--text-heading)]"}`}>
                {item.title}
              </h3>
              <p className="text-[12px] text-var(--text-muted) mt-0.5">{item.subtitle}</p>
            </div>
            <div className="shrink-0 text-var(--text-muted) group-hover:text-[var(--text-heading)] transition-colors">
              <i className="ai-chevron-right text-[18px]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
