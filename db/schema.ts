import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "USER",
  "AGENT",
  "ADMIN",
]);

export const kycStatusEnum = pgEnum("kyc_status", [
  "PENDING",
  "SUBMITTED",
  "VERIFIED",
  "REJECTED",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "DRAFT",
  "PENDING",
  "MATCHED",
  "AGENT_EN_ROUTE",
  "AGENT_ON_SITE",
  "IN_PROGRESS",
  "REPORT_SUBMITTED",
  "UNDER_REVIEW",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
]);

export const taskModuleEnum = pgEnum("task_module", [
  "QUICK_ERRANDS",
  "PROPERTY_OVERSITE",
  "PROJECT_WATCH",
  "DUE_DILIGENCE",
  "LEGAL_ADVISORY",
  "LAW_ENFORCEMENT",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "AUTHORIZED",
  "CAPTURED",
  "ESCROWED",
  "RELEASED",
  "REFUNDED",
  "FAILED",
]);

export const paymentGatewayEnum = pgEnum("payment_gateway", [
  "PAYSTACK",
  "FLUTTERWAVE",
]);

export const agentTierEnum = pgEnum("agent_tier", [
  "GENERAL",
  "TECHNICAL_SUPERVISOR",
  "INVESTIGATOR",
  "LEGAL_COUNSEL",
  "ENFORCEMENT_LIAISON",
]);

export const mediaStatusEnum = pgEnum("media_status", [
  "pending",
  "processing",
  "ready",
  "failed",
]);

export const milestoneStatusEnum = pgEnum("milestone_status", [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "OVERDUE",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
]);

export const riskRatingEnum = pgEnum("risk_rating", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const consultationStatusEnum = pgEnum("consultation_status", [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

export const payoutStatusEnum = pgEnum("payout_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "TASK_UPDATE",
  "PAYMENT",
  "CHAT",
  "SYSTEM",
  "ALERT",
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

// Users — extended with role, phone, auth fields
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    name: varchar("name", { length: 120 }),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("USER"),
    kycStatus: kycStatusEnum("kyc_status").notNull().default("PENDING"),
    avatarUrl: text("avatar_url"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_role_idx").on(table.role),
  ],
);

// Agent Profiles — linked to users with role=AGENT
export const agentProfiles = pgTable(
  "agent_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id)
      .unique(),
    tier: agentTierEnum("tier").notNull().default("GENERAL"),
    nbaNumber: varchar("nba_number", { length: 50 }),
    ninId: varchar("nin_id", { length: 20 }),
    rating: numeric("rating", { precision: 3, scale: 2 }).default("0.00"),
    totalTasks: integer("total_tasks").notNull().default(0),
    isAvailable: boolean("is_available").notNull().default(false),
    serviceAreaLat: numeric("service_area_lat", { precision: 10, scale: 7 }),
    serviceAreaLng: numeric("service_area_lng", { precision: 10, scale: 7 }),
    serviceRadiusKm: numeric("service_radius_km", { precision: 6, scale: 2 }).default("10.00"),
    bankCode: varchar("bank_code", { length: 10 }),
    bankAccountNumber: varchar("bank_account_number", { length: 20 }),
    bankAccountName: varchar("bank_account_name", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("agent_profiles_tier_idx").on(table.tier),
    index("agent_profiles_available_idx").on(table.isAvailable),
  ],
);

// Properties — registered real estate assets
export const properties = pgTable(
  "properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 255 }).notNull(),
    address: text("address").notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    parcelNumber: varchar("parcel_number", { length: 50 }),
    propertyType: varchar("property_type", { length: 50 }),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("properties_user_idx").on(table.userId),
  ],
);

// Tasks — universal task table for all 6 service modules
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    agentId: uuid("agent_id").references(() => users.id),
    propertyId: uuid("property_id").references(() => properties.id),
    moduleType: taskModuleEnum("module_type").notNull(),
    status: taskStatusEnum("status").notNull().default("DRAFT"),
    priority: varchar("priority", { length: 20 }).default("normal"),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    locationAddress: text("location_address"),
    locationLat: numeric("location_lat", { precision: 10, scale: 7 }),
    locationLng: numeric("location_lng", { precision: 10, scale: 7 }),
    formData: jsonb("form_data"),
    priceNgn: numeric("price_ngn", { precision: 12, scale: 2 }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tasks_user_idx").on(table.userId),
    index("tasks_agent_idx").on(table.agentId),
    index("tasks_module_idx").on(table.moduleType),
    index("tasks_status_idx").on(table.status),
  ],
);

// Task Milestones — for ProWatch project timeline tracking
export const taskMilestones = pgTable(
  "task_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    title: varchar("title", { length: 255 }).notNull(),
    targetDate: timestamp("target_date", { withTimezone: true }),
    status: milestoneStatusEnum("status").notNull().default("PENDING"),
    completionPct: integer("completion_pct").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_milestones_task_idx").on(table.taskId),
  ],
);

// Task Reports — agent-submitted inspection/verification reports
export const taskReports = pgTable(
  "task_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => users.id),
    summary: text("summary"),
    findings: text("findings"),
    pdfS3Key: text("pdf_s3_key"),
    watermarkCode: varchar("watermark_code", { length: 32 }),
    status: reportStatusEnum("status").notNull().default("DRAFT"),
    completionPct: integer("completion_pct").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_reports_task_idx").on(table.taskId),
    index("task_reports_agent_idx").on(table.agentId),
  ],
);

// Report Media — geotagged photos/videos attached to reports
export const reportMedia = pgTable(
  "report_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reportId: uuid("report_id")
      .notNull()
      .references(() => taskReports.id),
    mediaUrl: text("media_url").notNull(),
    mediaType: varchar("media_type", { length: 20 }).notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("report_media_report_idx").on(table.reportId),
  ],
);

// Task Chats — encrypted in-app messaging
export const taskChats = pgTable(
  "task_chats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id),
    receiverId: uuid("receiver_id")
      .notNull()
      .references(() => users.id),
    message: text("message"),
    fileUrl: text("file_url"),
    isModerated: boolean("is_moderated").notNull().default(false),
    moderatedBy: uuid("moderated_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_chats_task_idx").on(table.taskId),
    index("task_chats_sender_idx").on(table.senderId),
  ],
);

// Payments — client payment records with escrow support
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    amountNgn: numeric("amount_ngn", { precision: 12, scale: 2 }).notNull(),
    gateway: paymentGatewayEnum("gateway").notNull(),
    gatewayRef: varchar("gateway_ref", { length: 255 }),
    status: paymentStatusEnum("status").notNull().default("PENDING"),
    escrowReleasedAt: timestamp("escrow_released_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payments_task_idx").on(table.taskId),
    index("payments_user_idx").on(table.userId),
    index("payments_status_idx").on(table.status),
  ],
);

// Agent Wallets — earnings balance tracker
export const agentWallets = pgTable(
  "agent_wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => users.id)
      .unique(),
    balanceNgn: numeric("balance_ngn", { precision: 12, scale: 2 })
      .notNull()
      .default("0.00"),
    totalEarnedNgn: numeric("total_earned_ngn", { precision: 14, scale: 2 })
      .notNull()
      .default("0.00"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

// Payout Transactions — agent bank withdrawal records
export const payoutTransactions = pgTable(
  "payout_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => agentWallets.id),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => users.id),
    amountNgn: numeric("amount_ngn", { precision: 12, scale: 2 }).notNull(),
    bankCode: varchar("bank_code", { length: 10 }).notNull(),
    accountNumber: varchar("account_number", { length: 20 }).notNull(),
    gatewayRef: varchar("gateway_ref", { length: 255 }),
    status: payoutStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    index("payout_transactions_agent_idx").on(table.agentId),
    index("payout_transactions_status_idx").on(table.status),
  ],
);

// Legal Consultations — lawyer booking & retainer
export const legalConsultations = pgTable(
  "legal_consultations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    lawyerAgentId: uuid("lawyer_agent_id")
      .notNull()
      .references(() => users.id),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    durationMins: integer("duration_mins").default(60),
    retainerAmountNgn: numeric("retainer_amount_ngn", { precision: 12, scale: 2 }),
    status: consultationStatusEnum("status").notNull().default("SCHEDULED"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("legal_consultations_task_idx").on(table.taskId),
    index("legal_consultations_lawyer_idx").on(table.lawyerAgentId),
  ],
);

// Due Diligence Dossiers — compiled investigation results
export const dueDiligenceDossiers = pgTable(
  "due_diligence_dossiers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id)
      .unique(),
    riskRating: riskRatingEnum("risk_rating"),
    anonymized: boolean("anonymized").notNull().default(false),
    dossierPdfS3Key: text("dossier_pdf_s3_key"),
    findings: jsonb("findings"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("due_diligence_dossiers_task_idx").on(table.taskId),
  ],
);

// Notifications — platform-wide notification records
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: notificationTypeEnum("type").notNull().default("SYSTEM"),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body"),
    isRead: boolean("is_read").notNull().default(false),
    taskId: uuid("task_id").references(() => tasks.id),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_read_idx").on(table.isRead),
  ],
);

// Media Assets — existing table, kept as-is
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull().references(() => users.id),
    objectKey: text("object_key").notNull(),
    bucket: varchar("bucket", { length: 128 }).notNull(),
    status: mediaStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("media_assets_owner_idx").on(table.ownerId)],
);

// Outbound Emails — existing table, kept as-is
export const outboundEmails = pgTable(
  "outbound_emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    toAddress: varchar("to_address", { length: 320 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    template: varchar("template", { length: 120 }).notNull(),
    retries: integer("retries").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("outbound_emails_to_address_idx").on(table.toAddress)],
);
