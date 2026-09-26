import { UserRole } from "@/lib/types/user";

export type Permission =
  | "task:create"
  | "task:read_own"
  | "task:read_assigned"
  | "task:read_all"
  | "task:update_status"
  | "task:assign"
  | "task:cancel"
  | "report:submit"
  | "report:review"
  | "report:read"
  | "property:create"
  | "property:read"
  | "property:update"
  | "property:delete"
  | "wallet:view"
  | "wallet:withdraw"
  | "payment:initialize"
  | "payment:release_escrow"
  | "chat:send"
  | "chat:moderate"
  | "users:manage"
  | "agents:manage"
  | "system:audit";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: [
    "task:create",
    "task:read_own",
    "task:cancel",
    "report:read",
    "property:create",
    "property:read",
    "property:update",
    "property:delete",
    "payment:initialize",
    "chat:send",
  ],
  AGENT: [
    "task:read_assigned",
    "task:update_status",
    "report:submit",
    "report:read",
    "wallet:view",
    "wallet:withdraw",
    "chat:send",
  ],
  ADMIN: [
    "task:create",
    "task:read_own",
    "task:read_assigned",
    "task:read_all",
    "task:update_status",
    "task:assign",
    "task:cancel",
    "report:submit",
    "report:review",
    "report:read",
    "property:create",
    "property:read",
    "property:update",
    "property:delete",
    "wallet:view",
    "wallet:withdraw",
    "payment:initialize",
    "payment:release_escrow",
    "chat:send",
    "chat:moderate",
    "users:manage",
    "agents:manage",
    "system:audit",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function isAuthorizedRole(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  if (allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
}
