import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateInput?: Date | string | null): string {
  if (!dateInput) return "recently";

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "recently";

  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) {
    const futureMin = Math.round(Math.abs(diffMs) / 60000);
    if (futureMin < 60) return `in ${futureMin}m`;
    const futureHours = Math.round(futureMin / 60);
    if (futureHours < 24) return `in ${futureHours}h`;
    const futureDays = Math.round(futureHours / 24);
    return `in ${futureDays}d`;
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return "1m ago";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1h ago";
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const MODULE_NAMES: Record<string, string> = {
  QUICK_ERRANDS: "Quick Errand",
  PROPERTY_OVERSITE: "Property Oversite",
  PROJECT_WATCH: "Project Watch",
  DUE_DILIGENCE: "Due Diligence",
  LEGAL_ADVISORY: "Legal Advisory",
  DOCUMENT_PROCESSING: "Document Processing",
  LAW_ENFORCEMENT: "Law Enforcement",
  VULNERABILITY_TEST: "Vulnerability Test",
};

export function getModuleName(moduleType?: string | null): string {
  if (!moduleType) return "General Task";
  return (
    MODULE_NAMES[moduleType] ||
    moduleType
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
