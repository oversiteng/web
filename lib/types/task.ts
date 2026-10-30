// ─── Task & Module Type Definitions ─────────────────────────────────────────

export type TaskModule =
  | "QUICK_ERRANDS"
  | "PROPERTY_OVERSITE"
  | "PROJECT_WATCH"
  | "DUE_DILIGENCE"
  | "LEGAL_ADVISORY"
  | "LAW_ENFORCEMENT"
  | "VULNERABILITY_TEST";

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
  priority?: string | null;
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
  agentName?: string | null;
  agentTier?: string | null;
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
  checklist?: any;
  measurements?: any;
  severity?: string | null;
  incidentalExpenses?: any;
  metadata?: any;
  pdfS3Key?: string | null;
  watermarkCode?: string | null;
  status: ReportStatus;
  completionPct: number;
  officialNotes?: string | null;
  compiledAt?: string | null;
  compiledBy?: string | null;
  userReviewedAt?: string | null;
  userRejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
  media?: any[];
}

export type ChatModerationStatus =
  | "PENDING_REVIEW"
  | "APPROVED_AS_IS"
  | "REFINED_BY_ADMIN"
  | "REJECTED";

export interface ChatMessage {
  id: string;
  taskId: string;
  senderId: string;
  receiverId: string;
  message?: string | null;
  rawMessage?: string | null;
  moderatedMessage?: string | null;
  fileUrl?: string | null;
  messageType?: string | null;
  isModerated: boolean;
  moderationStatus?: ChatModerationStatus;
  moderatedBy?: string | null;
  moderatedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export type TaskChat = ChatMessage;

export interface LegalAdvisoryDeclaration {
  accurateConfirmed: boolean;
  noRelationshipConfirmed: boolean;
  conflictCheckConfirmed: boolean;
  ndpaConsentConfirmed: boolean;
  signature: string;
  declarationDate: string;
}

export interface LegalAdvisoryFormData {
  legalDomain?: string;
  legalType?: string;
  serviceType?: string;
  caseSummary?: string;
  consultationDate?: string;
  consultationDateRaw?: string;
  fileName?: string | null;
  workloadUnits?: number;
  declaration?: LegalAdvisoryDeclaration | null;
}

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

export interface PropertyCurrentTask {
  id: string;
  title: string;
  moduleType: TaskModule;
  status: TaskStatus;
  agentId?: string | null;
  agentName?: string | null;
  agentTitle?: string | null;
  agentDisplayName: string;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string | null;
  completedAt?: string | null;
  clientPromisedDeliveryDate?: string | null;
  timeAgo: string;
  formattedDisplay: string;
}

export interface PropertyWithCurrentTask extends Property {
  currentTask?: PropertyCurrentTask | null;
  activeTaskCount?: number;
  totalTaskCount?: number;
}
