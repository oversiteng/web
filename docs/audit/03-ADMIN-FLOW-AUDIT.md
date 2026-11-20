# 03 — Admin Flow Audit (R2)

**Core Summary:** The Admin Console (`app/(admin)/admin/*`) implements extensive UI workflows across user/agent KYC vetting, task structuring/quoting/assignment, hub-and-spoke chat moderation, finance ledger/disputes, QA report compilation, property oversight, communications, and Super Admin team governance; however:
1. **Departmental RBAC/CRUD enforcement is almost entirely client-side only**, and `proxy.ts` skips JWT signature verification (confirmed live: forged unsigned JWT cookie rendered `/admin/dashboard` with **`200 OK`**).
2. **Bank payout disbursement and Paystack refunds have no gateway integration** (`MISSING` Paystack Transfers & Refunds, DB-only `STUB` actions, non-idempotent wallet credits).
3. **PDFs are generated dynamically in memory without S3 persistence, media embedding, or milestone-specific PDF support**, and **background workers are unimplemented `STUB`s and not running**.

> **Live Runtime Caveat (`UNVERIFIED`):** Authenticated Admin API endpoints (`/admin/users/[id]/verify`, `/admin/tasks/[id]/assign`, `/admin/chats/[messageId]/moderate`, `/compile`, `/payments/disburse`, `/payments/payout`) were **not** executed live because Admin credentials were unavailable and existing DB accounts were not modified/impersonated. All Admin flow steps below are verified via static code inspection, except where cross-cutting live probes (`proxy.ts`, `/api/v1/admin/users` unauth/forged Bearer `401`) were executed.

---

## 1. Admin Authentication, Onboarding & RBAC Architecture

### 1.1 Route Protection & Middleware (`proxy.ts`, `lib/auth/*`)

1. **Edge Route Gate (`proxy.ts:5-181`)**:
   - `PROTECTED_PREFIXES` includes `"/admin"` (`proxy.ts:20`); `/admin/login` is publicly allowed (`proxy.ts:120-122`). Unauthenticated requests redirect to `/admin/login?returnUrl=...` (`307` verified live); non-admins redirect to `getDashboardUrlForRole(payload.role)`.
   - **CRITICAL Security Flaw (`proxy.ts:38-64`)**: `getValidPayload(token)` decodes payload via `atob()` and checks `exp`/`sub` **without verifying HMAC signature**. **Confirmed live**: sending `Cookie: token=<header>.<sub:"fake-id",role:"ADMIN",exp:9999999999>.forgedsig` to `GET /admin/dashboard` returned **`200 OK`** (while `GET /api/v1/admin/users` with the same forged Bearer token properly returned `401 Unauthorized`).
2. **API Auth Middleware (`lib/auth/middleware.ts:40-88`)**:
   - `withAuth(handler, { roles })` verifies HS256 JWT (`verifyToken`) and automatically permits `SUPER_ADMIN` whenever `"ADMIN"` is in `roles` (`lines 64-66`).
   - **CRITICAL `MISSING` Enforcement**: `withAuth` trusts stateless 7-day JWTs without checking `users.isActive`, without calling `validateSession(token)` (`lib/auth/sessionManager.ts:283-311` is dead code), and without evaluating `AdminPolicy` (`extractAdminPolicy` in `lib/auth/adminPermissions.ts:120-183`).

### 1.2 3-Step Admin Onboarding Handshake & Departmental RBAC

- **Departments & Policy Model (`lib/auth/adminPermissions.ts:1-199`)**: Defines 8 departments (`EXECUTIVE`, `ADMINISTRATIVE`, `LOGISTICS`, `EMAIL_CONTENT`, `CRS_SUPPORT`, `FRAUD_REGULATOR`, `FINANCE_TREASURY`, `QUALITY_DOSSIER`), `onboardingStatus` (`INVITED_PENDING_PASSWORD` -> `PENDING_APPROVAL` -> `APPROVED` | `SUSPENDED`), `mustChangePassword`, `canRead`, `canWrite`, `canDelete`, `noExportOrCopy: true`, and `allowedModules`, stored in `users.accreditationDocuments.adminPolicy` (`db/schema.ts:166`).
- **Step 1 (Invite)**: `SUPER_ADMIN` creates staff in `app/(admin)/admin/team/page.tsx:165-202` -> `POST /api/v1/admin/team` (`app/api/v1/admin/team/route.ts:119-285`), inserting `users` (`kycStatus: "VERIFIED"`, `isActive: true`, `onboardingStatus: "INVITED_PENDING_PASSWORD"`, `mustChangePassword: true`), logging `outboundEmails`, calling `sendEmailAsync` (`ADMIN_INVITE_CREDENTIALS`), and inserting a `notifications` row.
- **Step 2 (Password Setup)**: Staff logs in at `app/(auth)/admin/login/page.tsx:132-233` (`POST /api/v1/auth/login` + optional `/2fa`; note `login/route.ts:187-190` only enforces 2FA if `twoFactorEnabled` is already `true`). `evaluateAdminRoute()` (`lines 51-83`) routes to `SETUP_PASSWORD` -> `POST /api/v1/admin/auth/setup-password` (`app/api/v1/admin/auth/setup-password/route.ts:17-172`), transitioning to `PENDING_APPROVAL` and alerting `SUPER_ADMIN`s.
  - **Auth Defect (`setup-password/route.ts:56`)**: Only verifies `currentPassword` `if (currentPassword && dbUser.passwordHash)` — passing empty `currentPassword` skips old-password verification.
- **Step 3 (Approval & Governance)**: `app/(admin)/admin/team/page.tsx:204-266` -> `PATCH /api/v1/admin/team/[id]` (`APPROVE`, `SUSPEND`, `REINSTATE`, `RESET_CREDENTIALS`, `UPDATE_PRIVILEGES`) and `DELETE /api/v1/admin/team/[id]` (`route.ts:37-316`).
- **Critical RBAC Gaps**:
  - **UI Path Bug (`app/(admin)/layout.tsx:136-147`)**: `resolveModuleFromPath(pathname)` omits `"/admin/properties"`, defaulting it to `"dashboard"` (always allowed by `canAccessAdminModule`), contradicting `ADMIN_NAV` (`layout.tsx:55`, `moduleId: "tasks"`).
  - **Backend Departmental & CRUD Bypass (`MISSING` guards)**: Across all `/api/v1/admin/*` endpoints, **only `DELETE /api/v1/tasks/[id]` (`app/api/v1/tasks/[id]/route.ts:500-520`) checks `extractAdminPolicy(dbAdmin)?.canDelete`**. Every other admin route only checks `roles: ["ADMIN", "SUPER_ADMIN"]` (or `["SUPER_ADMIN"]` for `/admin/team`). An admin with `PENDING_APPROVAL`, `SUSPENDED` (unexpired JWT), `canWrite: false`, or restricted `allowedModules` can invoke any admin API directly.

---

## 2. Flow 1: Moderation of Agent & User Account Creation (Verification)

### 2.1 End-to-End Trace

1. **Account Creation & KYC Submission (Handoff from User/Agent)**:
   - `POST /api/v1/auth/register` creates `users` (`kycStatus: "PENDING"`) and for Agents inserts `agentProfiles` (`isAvailable: false`).
   - KYC docs arrive via `POST /api/v1/kyc/documents` (`app/api/v1/kyc/documents/route.ts:9-131`, structured objects under `accreditationDocuments[type.toLowerCase()]`, sets `kycStatus: "SUBMITTED"`) or legacy `POST /api/v1/auth/kyc` (`app/api/v1/auth/kyc/route.ts:8-67`, flat strings).
2. **Admin Dashboard Queue & Directory**:
   - `app/(admin)/layout.tsx:280` & `app/(admin)/admin/dashboard/page.tsx:86` fetch `GET /api/v1/admin/analytics/overview` (`pendingKycCount` where `kycStatus IN ('SUBMITTED', 'PENDING')`).
   - `app/(admin)/admin/users/page.tsx:327` calls `GET /api/v1/admin/users?limit=200` (`app/api/v1/admin/users/route.ts:9-92` clamps `limit` to `100`).
3. **Inspecting KYC, Credentials, Bank & Stats**:
   - `View Details` (`admin/users/page.tsx:352-388`) calls `GET /api/v1/admin/users/[id]` (`app/api/v1/admin/users/[id]/route.ts:34-319`). `extractKycArtifacts` (`admin/users/page.tsx:105-271`) resolves S3/media URLs via `/api/v1/media?key=...` or `/api/v1/media?url=...` (`lines 76-92`).
   - Renders `NIN Verification`, `Address Verification`, `NBA Verification`, uploaded docs, and for Agents `Bank Details & Name-Match Verification` (`admin/users/page.tsx:1189-1664`).
4. **Admin Approve / Reject / Tier / Suspend Actions**:
   - **Per-Item Verify/Reject** (`handleItemVerification`, `admin/users/page.tsx:445-491`): calls `PATCH /api/v1/admin/users/[id]` (`route.ts:322-545`), updating sub-statuses & `accreditationDocuments[documentKey].status`, inserting `notifications` on `"REJECTED"`.
   - **Bank Verification** (`handleBankVerification`, `admin/users/page.tsx:493-543`): calls `PATCH /api/v1/admin/users/[id]` (`route.ts:421-467`), storing `accreditationDocuments.bankVerification` (`VERIFIED`/`WARNING`/`REJECTED`) + notification.
   - **Overall KYC Submit** (`handleSubmitKyc`, `admin/users/page.tsx:390-443`): branches `kycStatusInput === "VERIFIED"` to `POST /api/v1/admin/users/[id]/verify` (`verify/route.ts:8-62`), and other statuses to `PATCH /api/v1/admin/users/[id]`.
   - **Suspend / Tier Override** (`handleSavePermissions`, `admin/users/page.tsx:545-606`): calls `POST /api/v1/admin/users/[id]/suspend` (`suspend/route.ts:8-76`) to toggle `users.isActive` + notification, plus `PATCH /api/v1/admin/users/[id]` for `agentTier`.

### 2.2 Gaps, Bugs & Unverified Steps

| Severity | Finding | Evidence |
|---|---|---|
| **CRITICAL** | **Unauthenticated S3 Media Proxy**: `GET /api/v1/media` has NO `withAuth` guard; anyone can stream private KYC IDs, utility bills, or report documents with `?key=...` or `?bucket=...` and `Cache-Control: public`. | `app/api/v1/media/route.ts:21-63` |
| **HIGH** | **Split Verify Path Skips Sub-Statuses & Notification**: UI routes `VERIFIED` to `POST /api/v1/admin/users/[id]/verify`, which only updates `kycStatus` and `ninVerificationStatus`, skipping `addressVerificationStatus`, `nbaVerificationStatus`, `accreditationDocuments[*].status`, and `notifications` (leaving `/api/v1/kyc/status` showing docs as `"reviewing"`). | `admin/users/page.tsx:404-413`; `verify/route.ts:14-30`; `kyc/status/route.ts:144-180` |
| **HIGH** | **KYC Verification Does Not Gate Platform Actions (`MISSING`)**: `POST /api/v1/tasks`, `POST /api/v1/tasks/[id]/accept` (confirmed live with `PENDING` KYC agent!), `POST /api/v1/tasks/[id]/assign`, and `POST /api/v1/agent/wallet/withdraw` never verify `kycStatus === "VERIFIED"`. | `tasks/route.ts:262-293`; `accept/route.ts:9-109`; `assign/route.ts:105-153`; `withdraw/route.ts:14-216` |
| **HIGH** | **Suspension Does Not Revoke Active Sessions**: `suspend/route.ts:32-45` sets `isActive: false` (blocking new logins) without revoking `userSessions`, and `withAuth` never checks `isActive` or `validateSession()`. | `suspend/route.ts:32-45`; `lib/auth/middleware.ts:40-88` |
| **MEDIUM** | **Legacy `/auth/kyc` Keys Ignored**: `PATCH /api/v1/admin/users/[id]` requires `typeof docs[documentKey] === "object"`, silently ignoring flat string keys (`documentUrl`, `selfieUrl`) from `POST /api/v1/auth/kyc`. | `auth/kyc/route.ts:38-45`; `admin/users/[id]/route.ts:398` |
| **MEDIUM** | **No Email & No Automated NIMC/NBA API**: Verification/rejection/suspension writes DB `notifications` only (no `sendEmailAsync` / `outboundEmails`). NIMC and NBA checks are manual toggles (`MISSING` live provider APIs). | `admin/users/[id]/route.ts:505-522`; `suspend/route.ts:47-54` |
| **MEDIUM** | **100-User Hard Cap**: UI requests `?limit=200`, API clamps to `100` with no pagination cursor. | `admin/users/page.tsx:327`; `admin/users/route.ts:14` |

---

## 3. Flow 2: Task Assigning & Mission Structuring

### 3.1 End-to-End Trace

1. **Task Intake**: Tasks appear in `app/(admin)/admin/tasks/page.tsx:298` (`GET /api/v1/tasks?limit=150`) and `app/(admin)/admin/tasks/[id]/page.tsx:105` (`GET /api/v1/tasks/[id]`).
2. **Quoting, Agent Pay & SLA**: `PAY_SLA` tab (`admin/tasks/[id]/page.tsx:152-183`) or quick modal (`admin/tasks/page.tsx:319-358`) calls `PATCH /api/v1/admin/tasks/[id]/quote` (`quote/route.ts:15-186`), updating `priceNgn`, `quoteStatus: "OFFICIALLY_QUOTED"`, `pricingMode: "ADMIN_MANUAL"`, `agentTargetHours`, `clientPromisedHours` (`calculateClientBufferedHours`), `agentPayoutNgn`, and inserting `notifications`.
3. **Scope Structuring & Milestones**: `DELIVERABLES` tab calls `PATCH /api/v1/tasks/[id]` to save `formData.executionBlueprint`. `MILESTONES` tab calls `POST /api/v1/tasks/[id]/milestones` (`milestones/route.ts:98-185`) instead of the dedicated `POST /api/v1/admin/tasks/[id]/milestones` (`admin/tasks/[id]/milestones/route.ts:10-105`, unused by UI).
4. **Operative Assignment**: `OPERATIVE` tab (`admin/tasks/[id]/page.tsx:106, 311-321, 593-658`) fetches `GET /api/v1/admin/users?role=AGENT&limit=100`, filters `a.isActive`, and calls `POST /api/v1/tasks/[id]/assign` (re-exported at `app/api/v1/admin/tasks/[id]/assign/route.ts:1`), setting `agentId` and `status: "MATCHED"`.
5. **Property-Level Assignment & Task Dispensing**: `app/(admin)/admin/properties/page.tsx:207-249` verifies ownership & sets `properties.description.__meta.assignedAgentId` via `PATCH /api/v1/admin/properties/[id]`, and dispenses tasks via `POST /api/v1/admin/properties/[id]/dispense` (auto-assigning `ext.assignedAgentId` and notifying both parties).
6. **Status Override & Deletion / Credit Refund**: `PATCH /api/v1/tasks/[id]/status` overrides status; `DELETE /api/v1/tasks/[id]` (`route.ts:484-621`) checks `policy.canDelete`, refunds `creditsToRefund` to `users.accreditationDocuments.creditBalance`, cascades deletes across child tables, and notifies the client. *(Note: `creditBalance` is JSONB in `accreditationDocuments` — no dedicated DB table/column exists per `docs/SUBSCRIPTION_PLANS_AND_FEATURES.md`.)*

### 3.2 Gaps & Bugs in Flow 2

| Severity | Finding | Evidence |
|---|---|---|
| **CRITICAL** | **IDOR on `GET/PATCH /api/v1/tasks/[id]` & `GET/POST/PATCH /api/v1/tasks/[id]/milestones`**: `PATCH /tasks/[id]` only guards `executionBlueprint` for admins; `...rest` fields (`status`, `priceNgn`, `agentId`, `userId`) can be mutated by **any authenticated user/agent**. `GET /tasks/[id]` and `milestones` lack ownership/role guards completely. | `tasks/[id]/route.ts:140-158, 420-469`; `milestones/route.ts:33-53, 98-185` |
| **HIGH** | **`POST /api/v1/tasks/[id]/assign` Has Zero Validation or Notifications**: Does not verify task existence (`200` on invalid ID), active/verified `AGENT` status, or disallow assigning `COMPLETED`/`CANCELLED`/`DISPUTED` tasks; sends no notification or email. | `tasks/[id]/assign/route.ts:105-153` |
| **MEDIUM** | **Unverified Agent Assignment Allowed in UI**: `admin/tasks/[id]/page.tsx:311-321` & `admin/properties/[id]/route.ts:141` only filter `a.isActive`, permitting assignment of `PENDING`/`REJECTED` KYC agents. | `admin/tasks/[id]/page.tsx:311-321, 634`; `admin/properties/[id]/route.ts:141` |
| **MEDIUM** | **Unused Admin Milestones Route**: UI posts to `/api/v1/tasks/[id]/milestones` instead of `/api/v1/admin/tasks/[id]/milestones` (which sets `directives` and notifies the agent). | `admin/tasks/[id]/page.tsx:233`; `admin/tasks/[id]/milestones/route.ts:10-105` |

---

## 4. Flow 3: Chat Moderation (Hub-and-Spoke)

### 4.1 End-to-End Trace

1. **Message Interception**: Non-admin messages (`POST /api/v1/chat/[taskId]/messages`), milestone cards (`PATCH .../milestones`), and final report cards (`POST /api/v1/reports/submit`) persist in `taskChats` with `isModerated: false`, `moderationStatus: "PENDING_REVIEW"`. `chat/[taskId]/messages/route.ts:313-319` publishes `pending_message` to `admin:chat:moderation`.
2. **Admin Inbox**: `app/(admin)/admin/chat/page.tsx:88-156` loads `/api/v1/tasks?limit=100` + `GET /api/v1/admin/chats/pending`, and fetches thread history via `GET /api/v1/chat/[taskId]/messages` (`isAdmin` returns `rawMessage`, `PENDING_REVIEW`, and `REJECTED`).
3. **Moderation Actions**: `POST /api/v1/admin/chats/[messageId]/moderate` (`moderate/route.ts:12-317`) supports:
   - `APPROVE` -> `APPROVED_AS_IS`
   - `REFINE` -> updates `message` + `moderatedMessage` in place, sets `REFINED_BY_ADMIN`
   - `REJECT` -> `REJECTED`, clears `pendingApproval` on linked milestone (`lines 217-239`)
   - Promotes linked `taskMilestones` to `COMPLETED` (`completionPct = 100`) on `APPROVE`/`REFINE` and publishes `message` + `message_moderated` to `task:chat:${taskId}` (`lines 276-292`).
4. **Admin Direct Messaging & CRS Support**: Admin composer targets `CLIENT` or `AGENT` (`APPROVED_AS_IS` immediately). Separate CRS Helpdesk (`app/(admin)/admin/support/page.tsx`) polls `GET /api/v1/support/tickets?mode=admin` every 10s, storing tickets in `users.accreditationDocuments.supportTicket`.

### 4.2 Gaps & Bugs in Flow 3

| Severity | Finding | Evidence |
|---|---|---|
| **HIGH** | **No Admin Realtime Stream (`MISSING`)**: `messages/route.ts:313-319` publishes to `admin:chat:moderation`, but **no SSE endpoint subscribes to `admin:chat:moderation`** and `admin/chat/page.tsx` does not connect to `/api/v1/chat/[taskId]/stream`. | `messages/route.ts:313-319`; `admin/chat/page.tsx:88-188` |
| **HIGH** | **`RedisSocketBridge` Duplicate Delivery & Shared Subscriber Bug**: Publishes to BOTH `localEmitter` and Redis pub/sub simultaneously (causing duplicate delivery when Redis is active) and registers per-SSE `this.subscriber.on("message", ...)` handlers on a single shared subscriber whose `unsubscribe(channel)` tears down all listeners for that channel. Live SSE streaming **`UNVERIFIED`**. | `lib/realtime/websocketHandlers.ts:15-89`; `lib/cache/redis.ts:5-18` |
| **MEDIUM** | **Dead Code / Unwired Features**: `GET /api/v1/admin/chats/threads` (`threads/route.ts:38-200`), `DELETE /api/v1/admin/chats/[messageId]/moderate` (`moderate/route.ts:320-364`), and `generatePdf: true` are unused by `admin/chat/page.tsx` (which also truncates at 100 tasks). | `admin/chat/page.tsx:88-156, 221-251`; `threads/route.ts`; `moderate/route.ts:17, 320-364` |
| **MEDIUM** | **No User Muting & No Moderation Audit Log (`MISSING`)**: `DELETE` erases rows; `REFINE` mutates in place; no mute endpoint exists; moderation routes lack `canWrite`/`canDelete` `AdminPolicy` checks. | `db/schema.ts:445-479`; `moderate/route.ts:242-254, 316, 363` |

---

## 5. Flow 4: Admin Payout, Escrow Settlement & Finance

### 5.1 End-to-End Trace

1. **Finance Ledger**: `app/(admin)/admin/finance/page.tsx:38-45` loads `GET /api/v1/admin/finance/overview` (`taskRevenueLedger`, `agentWalletsLedger`, `payoutTransactionsLedger`, `disputedTasks`).
2. **Wallet Credits**:
   - `POST /api/v1/tasks/[id]/reports/[reportId]/approve` (from `admin/reports/page.tsx:128-160`): sets `taskReports=APPROVED`, `tasks=COMPLETED`, `payments=RELEASED`, credits `agentWallets` (`dual.agentPayoutNgn` or `15000` fallback).
   - `POST /api/v1/admin/finance/overview` (from `admin/finance/page.tsx:57-83`): resolves `DISPUTED` tasks via `CREDIT_AGENT`, `REFUND_CLIENT`, or `REMEDIATE`.
   - `POST /api/v1/payments/disburse` & `POST /api/v1/payments/payout`: standalone credit endpoints (neither called by Admin UI).
3. **Bank Withdrawal**: Tab 2 in `admin/finance/page.tsx:266-353` is **read-only** (`MISSING` Admin payout approval/execution/retry UI). Withdrawals run solely via Agent self-service `POST /api/v1/agent/wallet/withdraw` (DB-only `STUB`).

### 5.2 Gaps & Bugs in Flow 4

| Severity | Finding | Evidence |
|---|---|---|
| **CRITICAL** | **No Paystack Transfers / Bank Disbursement Integration (`MISSING`)**: Neither `withdraw/route.ts` nor any admin route calls Paystack `/transferrecipient` or `/transfer`. `payoutTransactions` is marked `COMPLETED` with local `OVS-PAYOUT-*` ref without moving real funds. | `agent/wallet/withdraw/route.ts:138-165`; `admin/finance/page.tsx:266-353` |
| **CRITICAL** | **No Idempotency / Double-Credit Guard & Client `disburse` Abuse**: `approve/route.ts`, `disburse/route.ts`, `payout/route.ts`, and `finance/overview` (`CREDIT_AGENT`) do **not** check `tasks.status === "COMPLETED"` or `payments.status === "RELEASED"` and use no DB transactions/row locks. Worse, `disburse/route.ts:45-46, 74` lets the **client** (`task.userId`) trigger operative credit with an arbitrary `customAgentPayoutNgn`! | `approve/route.ts:61-131`; `disburse/route.ts:45-133`; `payout/route.ts:55-80`; `finance/overview/route.ts:270-306` |
| **HIGH** | **`/api/v1/payments/payout` Uses 100% Client Price**: Line 40 defaults to `Number(task.priceNgn \|\| 0)` rather than `agentPayoutNgn`. | `payments/payout/route.ts:40` |
| **HIGH** | **`REFUND_CLIENT` Is a DB-Only `STUB` (`MISSING` Paystack Refund)**: Updates `tasks=CANCELLED`, `payments=REFUNDED` without calling Paystack `/refund` or restoring `creditBalance`. | `admin/finance/overview/route.ts:323-347` |
| **HIGH** | **Incomplete Webhooks & `STUB` Escrow Worker**: `payments/webhook/route.ts` ignores `transfer.*` / `refund.*` events; `services/payment-service` webhook only logs; `worker.ts:19-22` `AUTO_RELEASE_ESCROW` is a `TODO` `STUB` and `scripts/worker.ts` drops it. | `webhook/route.ts:27-77`; `payment-service/src/index.ts:12-36`; `worker.ts:19-22`; `scripts/worker.ts:22-26` |

---

## 6. Flow 5: PDF Report Generation (Milestone & Final Reports)

### 6.1 End-to-End Trace

1. **Agent Submission**: Agent submits final reports via `POST /api/v1/reports/submit` or `POST /api/v1/tasks/[id]/report/sync` (which enqueues `GENERATE_WATERMARK_PDF` to Redis — verified live, sits unconsumed), and milestone updates via `PATCH /api/v1/tasks/[id]/milestones`.
2. **Admin QA Review (`app/(admin)/admin/reports/page.tsx:72, 328-477`)**: Loads `GET /api/v1/admin/reports/pending`. Admin can:
   - **Compile**: `POST /api/v1/admin/tasks/[id]/reports/[reportId]/compile` (aliased at `/compile-and-release`), setting `watermarkCode` (`OVS-DOSS-...`), `pdfS3Key = "dossiers/.../official.pdf"`, `status = "UNDER_REVIEW"`, `tasks.status = "UNDER_REVIEW"`.
   - **Reject**: `POST .../reject` -> `taskReports=REJECTED`, `tasks=DISPUTED`.
   - **Approve**: `POST .../approve` -> `APPROVED` / `COMPLETED` / `RELEASED` + wallet credit.
3. **PDF Rendering**: `GET /api/v1/reports/[id]/pdf` (`pdf/route.ts:19-152`) checks auth (`header`/`cookie`/`?token=`), verifies `isAdmin || isOwner || isAssignedAgent`, and runs `generateWatermarkedReportPdf()` (`lib/services/pdfGenerator.ts:21-138`) using `pdfkit` (**verified live**: `200 OK`, `2743` bytes, `%PDF-1.3`). Enforces DLP (`?download=1` forced to `inline` for `ADMIN`/`SUPER_ADMIN`).

### 6.2 Gaps & Bugs in Flow 5

| Severity | Finding | Evidence |
|---|---|---|
| **CRITICAL** | **Milestone-Level PDF Generation is `MISSING`**: `taskMilestones` has no PDF route or template (`pdfGenerated: false` at `milestones/route.ts:269, 322`). Calling `POST /admin/chats/[messageId]/moderate` with `generatePdf: true` sets `parsedCard.pdfUrl = "/dashboard/tasks/${taskId}/report"` (a React page!) then overwrites/creates the single task-wide `taskReports` row (`moderate/route.ts:91-94, 150-207`), and `admin/chat/page.tsx` never even sends `generatePdf: true`. | `milestones/route.ts:269, 322`; `moderate/route.ts:91-94, 150-207`; `admin/chat/page.tsx:221-251` |
| **HIGH** | **Phantom S3 Key (No S3 Persistence)**: `compile/route.ts:60` writes a synthetic `pdfS3Key` without generating a PDF or calling `uploadFile()`, while `moderate/route.ts:168, 196` stores `/api/v1/reports/${id}/pdf?inline=1` in `pdfS3Key`. PDFs exist only transiently in memory on `GET`. | `compile/route.ts:60-76`; `moderate/route.ts:168, 196`; `pdf/route.ts:111-128` |
| **HIGH** | **Background PDF Worker Is a `STUB`**: `report/sync` enqueues `GENERATE_WATERMARK_PDF`, `worker.ts:24-27` is a `TODO` `STUB`, `scripts/worker.ts` ignores it, and no worker runs in Compose. | `report/sync/route.ts:141-144`; `worker.ts:24-27`; `scripts/worker.ts:22-26` |
| **HIGH** | **PDF Omits All Photos & Expenses**: `generateWatermarkedReportPdf()` does not query or embed `reportMedia` photos/captions/GPS or `incidentalExpenses`. | `lib/services/pdfGenerator.ts:3-138`; `pdf/route.ts:111-127` |
| **MEDIUM** | **Due Diligence Dossiers & Admin DLP Preview Gaps**: `GET /api/v1/diligence/[id]/dossier` (`route.ts:50-53`) returns an unverified S3/fallback URL (`https://storage.oversite.ng/...`) with no generation path. `admin/reports/page.tsx` has no PDF preview button, and `AdminLayout` DLP modal (`layout.tsx:810-816`) only renders `<img>` (breaks on PDF/video evidence). | `diligence/[id]/dossier/route.ts:50-53`; `admin/reports/page.tsx:403-408`; `app/(admin)/layout.tsx:311-323, 810-817` |

---

## 7. Other Admin Modules

- **Platform Settings (`app/(admin)/admin/settings/page.tsx`, `app/api/v1/admin/settings/route.ts:16-127`)**: `runtimePlatformConfig` is an **in-memory module variable (`STUB`)** — lost on restart and never read by `lib/services/pricing.ts`.
- **Communications (`app/(admin)/admin/communications/page.tsx`, `app/api/v1/admin/communications/route.ts:309`)**: Bulk email silently slices `emailRecipients.slice(0, 50)` and inserts `outboundEmails` regardless of SES delivery result (live SES sending **`UNVERIFIED`**).
