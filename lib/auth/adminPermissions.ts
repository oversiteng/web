export type AdminDepartment =
  | "EXECUTIVE" // Super Admin (All Access)
  | "ADMINISTRATIVE" // Chat & Milestone Moderation
  | "LOGISTICS" // Task Command, Quoting, Agent Pay & Field Dispatch
  | "EMAIL_CONTENT" // Professional Mailer, Broadcasts, Templates & Waitlist
  | "CRS_SUPPORT" // CRS / CCR / Live Support Helpdesk & Account Support
  | "FRAUD_REGULATOR" // KYC Vetting, NIN/NBA, Compliance, Disputes & Suspensions
  | "FINANCE_TREASURY" // Client Revenue Ledger, Agent Task Pay Credits & Payouts
  | "QUALITY_DOSSIER"; // Technical / Legal QA Audit & Official Dossier Compilation

export type AdminOnboardingStatus =
  | "INVITED_PENDING_PASSWORD"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SUSPENDED";

export interface AdminPolicy {
  department: AdminDepartment;
  departmentLabel: string;
  onboardingStatus: AdminOnboardingStatus;
  mustChangePassword: boolean;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  noExportOrCopy: true; // Strictly enforced across all admins
  allowedModules: string[];
  invitedBy?: string | null;
  invitedAt?: string | null;
  passwordUpdatedAt?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export interface DepartmentDefinition {
  key: AdminDepartment;
  label: string;
  shortLabel: string;
  description: string;
  defaultModules: string[];
}

export const ADMIN_DEPARTMENTS: Record<AdminDepartment, DepartmentDefinition> = {
  EXECUTIVE: {
    key: "EXECUTIVE",
    label: "Executive Super Admin",
    shortLabel: "Super Admin",
    description:
      "Full platform oversight, executive analytics, staff creation, role/privilege assignment, and system configuration.",
    defaultModules: [
      "dashboard",
      "team",
      "tasks",
      "users",
      "chat",
      "support",
      "reports",
      "finance",
      "communications",
      "settings",
    ],
  },
  ADMINISTRATIVE: {
    key: "ADMINISTRATIVE",
    label: "Administrative (Chat & Moderation)",
    shortLabel: "Administrative",
    description:
      "Hub-and-spoke task chat moderation, milestone card verification, and disintermediation defense.",
    defaultModules: ["dashboard", "chat", "reports"],
  },
  LOGISTICS: {
    key: "LOGISTICS",
    label: "Logistics & Field Dispatch",
    shortLabel: "Logistics",
    description:
      "Task intake, manual quoting, setting Agent Task Pay, operative assignment, waypoints, and GPS check-in monitoring.",
    defaultModules: ["dashboard", "tasks"],
  },
  EMAIL_CONTENT: {
    key: "EMAIL_CONTENT",
    label: "Email & Content Manager",
    shortLabel: "Email & Content",
    description:
      "Crafting, managing, and disbursing professional emails, in-app notifications, support FAQs, and waitlist communications.",
    defaultModules: ["dashboard", "communications", "support", "settings"],
  },
  CRS_SUPPORT: {
    key: "CRS_SUPPORT",
    label: "CRS / CCR / Customer & Operative Support",
    shortLabel: "CRS / Support",
    description:
      "Live support helpdesk (/support/chat), client & operative inquiry resolution, and account assistance.",
    defaultModules: ["dashboard", "support", "chat", "users", "tasks"],
  },
  FRAUD_REGULATOR: {
    key: "FRAUD_REGULATOR",
    label: "Fraud, Compliance & Regulator",
    shortLabel: "Fraud & Regulator",
    description:
      "6-point KYC accreditation audit, NIN/NBA verification, operative tier governance, contested deliverables, and account suspensions.",
    defaultModules: ["dashboard", "users", "reports", "finance"],
  },
  FINANCE_TREASURY: {
    key: "FINANCE_TREASURY",
    label: "Finance, Revenue & Settlements",
    shortLabel: "Finance & Treasury",
    description:
      "Client payment ledger, Agent Task Pay wallet credits, platform margins, bank withdrawals, and client refunds.",
    defaultModules: ["dashboard", "finance", "tasks"],
  },
  QUALITY_DOSSIER: {
    key: "QUALITY_DOSSIER",
    label: "QA & Official Dossier Compilation",
    shortLabel: "QA & Dossiers",
    description:
      "Auditing field operative evidence, measurements, and compiling watermarked Oversite Vault dossiers (OVS-DOSS).",
    defaultModules: ["dashboard", "reports", "tasks"],
  },
};

export function extractAdminPolicy(userRecord: {
  role?: string | null;
  isActive?: boolean | null;
  accreditationDocuments?: unknown;
}): AdminPolicy {
  const role = userRecord?.role || "USER";

  if (role === "SUPER_ADMIN") {
    return {
      department: "EXECUTIVE",
      departmentLabel: ADMIN_DEPARTMENTS.EXECUTIVE.label,
      onboardingStatus: "APPROVED",
      mustChangePassword: false,
      canRead: true,
      canWrite: true,
      canDelete: true,
      noExportOrCopy: true,
      allowedModules: ADMIN_DEPARTMENTS.EXECUTIVE.defaultModules,
    };
  }

  const rawDocs =
    userRecord?.accreditationDocuments &&
    typeof userRecord.accreditationDocuments === "object"
      ? (userRecord.accreditationDocuments as Record<string, any>)
      : {};

  const saved =
    rawDocs.adminPolicy && typeof rawDocs.adminPolicy === "object"
      ? (rawDocs.adminPolicy as Partial<AdminPolicy>)
      : {};

  const deptKey: AdminDepartment =
    saved.department && ADMIN_DEPARTMENTS[saved.department]
      ? saved.department
      : "ADMINISTRATIVE";

  const deptDef = ADMIN_DEPARTMENTS[deptKey];

  const onboardingStatus: AdminOnboardingStatus =
    userRecord?.isActive === false
      ? "SUSPENDED"
      : saved.onboardingStatus || "APPROVED";

  return {
    department: deptKey,
    departmentLabel: deptDef.label,
    onboardingStatus,
    mustChangePassword: Boolean(saved.mustChangePassword),
    canRead: saved.canRead !== undefined ? Boolean(saved.canRead) : true,
    canWrite: saved.canWrite !== undefined ? Boolean(saved.canWrite) : true,
    canDelete: saved.canDelete !== undefined ? Boolean(saved.canDelete) : false,
    noExportOrCopy: true,
    allowedModules:
      Array.isArray(saved.allowedModules) && saved.allowedModules.length > 0
        ? saved.allowedModules
        : deptDef.defaultModules,
    invitedBy: saved.invitedBy || null,
    invitedAt: saved.invitedAt || null,
    passwordUpdatedAt: saved.passwordUpdatedAt || null,
    approvedBy: saved.approvedBy || null,
    approvedAt: saved.approvedAt || null,
  };
}

export function canAccessAdminModule(
  policy: AdminPolicy | null | undefined,
  moduleId: string,
  userRole?: string | null
): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  if (!policy) return false;
  if (policy.onboardingStatus !== "APPROVED" || policy.mustChangePassword) {
    return false;
  }
  if (!policy.canRead) return false;
  if (moduleId === "dashboard") return true;
  if (moduleId === "team") return false; // Only SUPER_ADMIN can access /admin/team
  return policy.allowedModules.includes(moduleId);
}
