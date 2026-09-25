// ─── Task & Module Type Definitions ─────────────────────────────────────────

export type TaskModule =
  | "QUICK_ERRANDS"
  | "PROPERTY_OVERSITE"
  | "PROJECT_WATCH"
  | "DUE_DILIGENCE"
  | "LEGAL_ADVISORY"
  | "LAW_ENFORCEMENT";

export type TaskStatus =
  | "DRAFT"
  | "PENDING"
  | "MATCHED"
  | "AGENT_EN_ROUTE"
  | "AGENT_ON_SITE"
  | "IN_PROGRESS"
  | "REPORT_SUBMITTED"
  | "UNDER_REVIEW"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type MilestoneStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
export type ReportStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
export type RiskRating = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Task {
  id: string;
  userId: string;
  agentId?: string | null;
  propertyId?: string | null;
  moduleType: TaskModule;
  status: TaskStatus;
  priority?: string;
  title: string;
  description?: string | null;
  locationAddress?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  formData?: Record<string, unknown> | null;
  priceNgn?: number | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface TaskMilestone {
  id: string;
  taskId: string;
  title: string;
  targetDate?: string | null;
  status: MilestoneStatus;
  completionPct: number;
  createdAt?: string;
}

export interface TaskReport {
  id: string;
  taskId: string;
  agentId: string;
  summary?: string | null;
  findings?: string | null;
  pdfS3Key?: string | null;
  watermarkCode?: string | null;
  status: ReportStatus;
  completionPct: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  taskId: string;
  senderId: string;
  receiverId: string;
  message?: string | null;
  fileUrl?: string | null;
  isModerated: boolean;
  createdAt: string;
}

export type TaskChat = ChatMessage;

export interface LegalConsultation {
  id: string;
  taskId: string;
  lawyerAgentId: string;
  scheduledAt?: string | null;
  durationMins?: number | null;
  retainerAmountNgn?: number | null;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  notes?: string | null;
  createdAt: string;
}

export interface DueDiligenceDossier {
  id: string;
  taskId: string;
  riskRating?: RiskRating | null;
  anonymized?: boolean;
  dossierPdfS3Key?: string | null;
  findings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt?: string;
}

export interface Property {
  id: string;
  userId: string;
  title: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  parcelNumber?: string | null;
  propertyType?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt?: string;
}
