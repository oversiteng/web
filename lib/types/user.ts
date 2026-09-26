// ─── User & Agent Type Definitions ──────────────────────────────────────────

export type UserRole = "USER" | "AGENT" | "ADMIN";
export type KycStatus = "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
export type AgentTier =
  | "GENERAL"
  | "TECHNICAL_SUPERVISOR"
  | "INVESTIGATOR"
  | "LEGAL_COUNSEL"
  | "ENFORCEMENT_LIAISON";

export interface UserProfile {
  id: string;
  email: string;
  phone?: string | null;
  name?: string | null;
  role: UserRole;
  kycStatus: KycStatus;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type User = UserProfile;

export interface AgentProfile {
  id: string;
  userId: string;
  tier: AgentTier;
  nbaNumber?: string | null;
  ninId?: string | null;
  rating: number;
  totalTasks: number;
  isAvailable: boolean;
  serviceAreaLat?: number | null;
  serviceAreaLng?: number | null;
  serviceRadiusKm: number;
  createdAt: string;
  updatedAt?: string;
}

/** JWT token payload embedded in every authenticated request */
export interface JwtPayload {
  sub: string; // user ID
  role: UserRole;
  iat: number;
  exp: number;
}
