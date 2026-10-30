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
  "SUPER_ADMIN",
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
  "VULNERABILITY_TEST",
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

export const chatModerationStatusEnum = pgEnum("chat_moderation_status", [
  "PENDING_REVIEW",
  "APPROVED_AS_IS",
  "REFINED_BY_ADMIN",
  "REJECTED",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "TASK_UPDATE",
  "PAYMENT",
  "CHAT",
  "SYSTEM",
  "ALERT",
]);

export const waitlistStatusEnum = pgEnum("waitlist_status", [
  "PENDING",
  "CONTACTED",
  "CONVERTED",
]);

// ─── Tables ──────────────────────────────────────────────────────────────────

// Users — extended with role, phone, auth, and profile fields
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    name: varchar("name", { length: 120 }),
    title: varchar("title", { length: 50 }),
    address: text("address"),
    location: varchar("location", { length: 150 }),
    occupation: varchar("occupation", { length: 120 }),
    state: varchar("state", { length: 80 }),
    country: varchar("country", { length: 80 }),
    residence: varchar("residence", { length: 150 }),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull().default("USER"),
    kycStatus: kycStatusEnum("kyc_status").notNull().default("PENDING"),
    ninVerificationStatus: varchar("nin_verification_status", { length: 20 }).notNull().default("pending"),
    nbaVerificationStatus: varchar("nba_verification_status", { length: 20 }).notNull().default("pending"),
    addressVerificationStatus: varchar("address_verification_status", { length: 20 }).notNull().default("pending"),
    accreditationDocuments: jsonb("accreditation_documents"),
    consentSignedAt: timestamp("consent_signed_at", { withTimezone: true }),
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
    index("users_phone_idx").on(table.phone),
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
    pricingMode: varchar("pricing_mode", { length: 30 }).default("AUTOMATED"),
    quoteStatus: varchar("quote_status", { length: 30 }).default("ESTIMATED"),
    agentTargetHours: integer("agent_target_hours"),
    clientPromisedHours: integer("client_promised_hours"),
    clientPromisedDeliveryDate: timestamp("client_promised_delivery_date", { withTimezone: true }),
    waypoints: jsonb("waypoints"),
    purchaseItems: jsonb("purchase_items"),
    requiresOfficialDocs: boolean("requires_official_docs").default(false),
    pricingBreakdown: jsonb("pricing_breakdown"),
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
    index("tasks_property_idx").on(table.propertyId),
    index("tasks_module_idx").on(table.moduleType),
    index("tasks_status_idx").on(table.status),
    index("tasks_agent_status_idx").on(table.agentId, table.status),
    index("tasks_user_status_idx").on(table.userId, table.status),
  ],
);

// Task Milestones — operational directives, sequence tracking, and deliverables
export const taskMilestones = pgTable(
  "task_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    orderIndex: integer("order_index").notNull().default(0),
    deliverableType: varchar("deliverable_type", { length: 50 }).notNull().default("INSPECTION_CHECKLIST"),
    checklist: jsonb("checklist"),
    targetDate: timestamp("target_date", { withTimezone: true }),
    status: milestoneStatusEnum("status").notNull().default("PENDING"),
    completionPct: integer("completion_pct").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_milestones_task_idx").on(table.taskId),
    index("task_milestones_order_idx").on(table.taskId, table.orderIndex),
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
    checklist: jsonb("checklist"),
    measurements: jsonb("measurements"),
    severity: varchar("severity", { length: 20 }).default("NONE"),
    incidentalExpenses: jsonb("incidental_expenses"),
    metadata: jsonb("metadata"),
    pdfS3Key: text("pdf_s3_key"),
    watermarkCode: varchar("watermark_code", { length: 32 }),
    status: reportStatusEnum("status").notNull().default("DRAFT"),
    completionPct: integer("completion_pct").notNull().default(0),
    officialNotes: text("official_notes"),
    compiledAt: timestamp("compiled_at", { withTimezone: true }),
    compiledBy: uuid("compiled_by").references(() => users.id),
    userReviewedAt: timestamp("user_reviewed_at", { withTimezone: true }),
    userRejectionReason: text("user_rejection_reason"),
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
    index("task_reports_status_idx").on(table.status),
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
    caption: text("caption"),
    capturedAt: timestamp("captured_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("report_media_report_idx").on(table.reportId),
  ],
);

// Task Chats — hub-and-spoke in-app messaging with Mission Control moderation
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
    rawMessage: text("raw_message"),
    moderatedMessage: text("moderated_message"),
    fileUrl: text("file_url"),
    messageType: varchar("message_type", { length: 20 }).default("TEXT"),
    isModerated: boolean("is_moderated").notNull().default(false),
    moderationStatus: chatModerationStatusEnum("moderation_status").notNull().default("PENDING_REVIEW"),
    moderatedBy: uuid("moderated_by").references(() => users.id),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_chats_task_idx").on(table.taskId),
    index("task_chats_task_created_idx").on(table.taskId, table.createdAt),
    index("task_chats_sender_idx").on(table.senderId),
    index("task_chats_receiver_idx").on(table.receiverId),
    index("task_chats_moderation_idx").on(table.moderationStatus),
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
    index("payments_user_created_idx").on(table.userId, table.createdAt),
    index("payments_status_idx").on(table.status),
    index("payments_gateway_ref_idx").on(table.gatewayRef),
  ],
);

// User Payment Methods — PCI-DSS tokenized gateway authorizations (Paystack / Flutterwave)
export const userPaymentMethods = pgTable(
  "user_payment_methods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    authorizationCode: varchar("authorization_code", { length: 255 }).notNull(),
    cardType: varchar("card_type", { length: 50 }).notNull().default("card"),
    brand: varchar("brand", { length: 50 }).notNull(),
    last4: varchar("last4", { length: 4 }).notNull(),
    expiryMonth: varchar("expiry_month", { length: 4 }).notNull(),
    expiryYear: varchar("expiry_year", { length: 4 }).notNull(),
    bank: varchar("bank", { length: 120 }),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("user_payment_methods_user_idx").on(table.userId),
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
    index("payout_transactions_wallet_idx").on(table.walletId),
    index("payout_transactions_agent_idx").on(table.agentId),
    index("payout_transactions_agent_created_idx").on(table.agentId, table.createdAt),
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
    index("notifications_task_idx").on(table.taskId),
    index("notifications_read_idx").on(table.isRead),
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
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
  (table) => [
    index("outbound_emails_to_address_idx").on(table.toAddress),
    index("outbound_emails_user_idx").on(table.userId),
  ],
);

// Waitlist — captures early interest from the landing page
export const waitlist = pgTable(
  "waitlist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    name: varchar("name", { length: 120 }),
    interest: varchar("interest", { length: 120 }), // E.g., which service they want most
    status: waitlistStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("waitlist_email_unique").on(table.email),
    index("waitlist_status_idx").on(table.status),
    index("waitlist_interest_idx").on(table.interest),
  ],
);
