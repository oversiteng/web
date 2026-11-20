# 04 — Agent Flow Audit (R3)

**Core Summary:** The Field Agent portal (`app/(agent)/agent/*`) provides complete UI scaffolding and DB schema coverage across verification, task queue/execution, milestone feedback/chat, final reports, and wallet withdrawals, but is **blocked from production readiness** by critical security defects, broken UI-to-API contracts, and simulated payout/gateway behavior:
1. **Unverified agents (`kycStatus: "PENDING"`) are NOT gated** from viewing open tasks, claiming tasks (confirmed live `200 OK`), arriving on site, submitting reports, or withdrawing funds.
2. **Task Queue (`GET /api/v1/tasks?status=PENDING,MATCHED`) crashes with live HTTP `500`**, UI double-discounts already-discounted `agentPayoutNgn` (`0.7x`/`0.8x`), UI bypasses `400 GEOFENCE_VIOLATION` on site arrival, and UI calls `/reports/submit` which drops structured inputs and leaves `tasks.status` unchanged.
3. **Pay Withdrawal is a non-atomic DB-only `STUB`**: deducts `agentWallets` outside any DB transaction/lock, fabricates `OVS-PAYOUT-*` with immediate `COMPLETED` status (no Paystack Transfer call), ignores `bankVerification`, allows PIN overwrite without `currentPin`, and stores the 4-digit PIN in plaintext in `localStorage`.

---

## 1. Flow 1: Agent Verification & Onboarding

### 1.1 End-to-End Trace

1. **Signup UI (`app/(auth)/register/agent/page.tsx:61-117`)**:
   - Collects `firstName`, `lastName`, `email`, `phoneNumber`, `tier` (`"GENERAL"`, `"LEGAL"`, `"TECHNICAL"` at lines 250-252), `nbaNumber` (if `tier === "LEGAL"` at line 259), and `password`.
   - Posts `POST /api/v1/auth/register` (`line 83`), calls `setSession()` (`AuthContext.tsx:127`), and routes to `/agent/dashboard` (`line 111`).
2. **Registration API (`app/api/v1/auth/register/route.ts:31-238`, aliased at `signup/route.ts:1`)**:
   - Confirmed live (`201 Created`): inserts `users` (`role: "AGENT"`, `kycStatus: "PENDING"`, `ninVerificationStatus: "pending"`, `nbaVerificationStatus: "pending"`, `isActive: true`) and `agentProfiles` (`isAvailable: false`, `tier`, `nbaNumber`, `ninId`).
   - **BUG (`register/agent/page.tsx:93, 250-252` vs `register/route.ts:160-163`)**: UI sends `"LEGAL"` / `"TECHNICAL"`, whereas `register/route.ts:161` validates against `db/schema.ts:72-78` (`["GENERAL", "TECHNICAL_SUPERVISOR", "INVESTIGATOR", "LEGAL_COUNSEL", "ENFORCEMENT_LIAISON"]`) and silently coerces unknown strings to `"GENERAL"`.
3. **Verification Portal UI (`app/(agent)/agent/verification/page.tsx`)**:
   - Fetches `GET /api/v1/kyc/status` (`line 222`) to render 6 checklist items: `nin-slip` (`GOVERNMENT_ID`), `passport-photo` (`PASSPORT_PHOTO` via WebRTC camera at line 1192), `proof-of-address` (`PROOF_OF_ADDRESS`), `guarantor-form` (`GUARANTOR_FORM`), `investigation-cert` (`INVESTIGATION_CERTIFICATE`), and `background-check` (`BACKGROUND_CHECK`).
   - **Media Upload (`lib/storage/agentUpload.ts:146-250`)**: Compresses via `<canvas>`, then tries:
     1. `POST /api/v1/agent/upload` -> `processAndCompressMedia` (`lib/middleware/mediaCompression.ts`, imports `sharp` which is undeclared in `package.json` but hoisted via `next` `optionalDependencies` — **confirmed live `200 OK`** to `oversite-storage-bucket.s3.eu-west-2.amazonaws.com`).
     2. Fallback `POST /api/v1/agent/upload/presign` -> presigned S3 `PUT`.
     3. **GAP (`agentUpload.ts:240-249`)**: If both S3 endpoints fail, returns raw `data:` base64 URL (`storedOnServer: false`); `verification/page.tsx:546, 620` persists that raw base64 inside `users.accreditationDocuments` and `users.avatarUrl` (`kyc/documents/route.ts:114`).
   - **Submission Dispatches (`verification/page.tsx:563-626`)**:
     - `nin-slip`: calls `POST /api/v1/kyc/verify/nin` (`.catch(() => null)`, validates `^\d{11}$` regex only — **`MISSING` NIMC API**), then `POST /api/v1/kyc/documents`.
     - `background-check`: calls `POST /api/v1/kyc/consent`, then `POST /api/v1/kyc/documents` with synthetic `documentUrl: "kyc/background-check/completed.pdf"` (`line 620`).
     - **Unused KYC Endpoints**: `POST /api/v1/kyc/verify/nba` (regex-only, **`MISSING` NBA API**, not wired in UI) and legacy `POST /api/v1/auth/kyc`.
4. **Admin Moderation Handoff**:
   - Admin approves/rejects via `PATCH /api/v1/admin/users/[id]` or `POST /api/v1/admin/users/[id]/verify`. As detailed in `03-ADMIN-FLOW-AUDIT.md §2.2`, `/verify` leaves `addressVerificationStatus` and `accreditationDocuments.*.status` untouched, keeping `/api/v1/kyc/status` checklist items `"reviewing"`. (Authenticated Admin verify path **`UNVERIFIED`** live.)
5. **Verification Gating (`MISSING`) & Online State Drift**:
   - **CRITICAL**: Neither `proxy.ts`, `app/(agent)/layout.tsx`, nor ANY agent API route (`tasks`, `accept`, `respond`, `arrive`, `status`, `reports/submit`, `wallet/withdraw`, `availability`) checks `kycStatus === "VERIFIED"`. **Confirmed live**: newly registered `PENDING` KYC agent claimed a task (`POST /api/v1/tasks/:id/accept` -> **`200 OK`**).
   - `AgentLayout` (`app/(agent)/layout.tsx:47`) and `AgentTopNav` (`components/agent/AgentTopNav.tsx:35`) initialize `isOnline = true` in React state while DB `agentProfiles.isAvailable` starts `false`.

---

## 2. Flow 2: Task Acceptance & Execution

### 2.1 End-to-End Trace

1. **Viewing Available Offers (Queue & Dashboard)**:
   - **Queue UI (`app/(agent)/agent/queue/page.tsx:55`)** calls `GET /api/v1/tasks?status=PENDING,MATCHED`.
   - **Dashboard UI (`app/(agent)/agent/dashboard/page.tsx:198`)** calls `GET /api/v1/tasks` (no `status` param).
   - **API (`app/api/v1/tasks/route.ts:28-54`)**: Only `status === "open" || status === "PENDING"` selects `agentId IS NULL AND status IN ('PENDING', 'MATCHED')`; otherwise it filters `eq(tasks.agentId, user.sub)` AND passes `status` straight into `eq(tasks.status, status as TaskStatus)`.
   - **LIVE HTTP `500` CRASH**: Confirmed both in `oversite_web_app` container logs and live probe — `GET /api/v1/tasks?status=PENDING,MATCHED` throws **`500 Internal Server Error`** (`PostgresError: invalid input value for enum task_status: "PENDING,MATCHED"`). Meanwhile `GET /api/v1/tasks?status=open` returned `200 OK` live, and `dashboard/page.tsx:198` (without `status=open`) never receives unassigned open tasks.
   - **Fabricated Dashboard Schedule (`dashboard/page.tsx:253-320`)**: `daysSchedule` injects hardcoded fake tasks (`id: "urgent-today-due-diligence"`, `"scheduled-1..5"`, `"Victoria Island Registry, Lagos"`).
2. **Accepting / Declining Tasks**:
   - **Accept (`POST /api/v1/tasks/:id/accept`, `accept/route.ts:9-109`)**: Sets `agentId = user.sub`, `status = "AGENT_EN_ROUTE"`, notifies `task.userId`.
     - **GAPS**: `acceptableStatuses = ["PENDING", "MATCHED", "DRAFT"]` (`line 45`) allows claiming **unpaid `DRAFT` tasks**; check-then-update lacks `AND agent_id IS NULL` in `WHERE` (race condition); no `kycStatus === "VERIFIED"` check (confirmed live).
   - **Decline (`POST /api/v1/tasks/:id/respond`, `respond/route.ts:9-116`)**: Unassigns `agentId = null`, sets `status = "PENDING"`, records rejection in `formData.rejections`. **CRITICAL IDOR (`lines 40-94`)**: Does **not** verify `task.agentId === user.sub` or valid status before mutating (`REJECT` can unassign another agent's task; `ACCEPT` can hijack another agent's task).
   - **Unused**: `PATCH /api/v1/tasks/:id/assign` (self-assign to `MATCHED`, unused by web UI).
3. **Active Tasks & Double-Discounted Payout Display**:
   - `GET /api/v1/tasks` (`tasks/route.ts:142`) and `GET /api/v1/tasks/[id]` (`tasks/[id]/route.ts:371`) already transform `priceNgn = dual.agentPayoutNgn` (`lib/services/pricing.ts:115-162`, default **70%** of client price).
   - `dashboard/page.tsx:603,669` and `queue/page.tsx:259,320` render `task.priceNgn` (100% of `agentPayoutNgn`), **but `agent/tasks/page.tsx:206` multiplies `task.priceNgn * 0.7` (49% of client price) and `agent/tasks/[id]/page.tsx:265` multiplies `task.priceNgn * 0.8` (56% of client price)!**
4. **Site Arrival & Geofencing (Step 1 -> Step 2)**:
   - UI (`tasks/[id]/page.tsx:285-336`) calls `navigator.geolocation.getCurrentPosition`, then `POST /api/v1/tasks/:id/arrive` (`arrive/route.ts:26-191`).
   - **Backend Geofence Verified Live**: `400 Bad Request` (`GEOFENCE_VIOLATION`, `480923m > 500m`) at far coordinates; `200 OK` (`AGENT_ON_SITE`, `0m`) at site coordinates.
   - **GEOFENCE BYPASS IN UI (`tasks/[id]/page.tsx:311-335`)**: If `/arrive` returns `400` or geolocation fails, UI shows `"GPS recorded. Proceeding to inspection."` and advances to `currentStep = 2` anyway.
   - **Dead / Unused Execution Controls**: `POST /api/v1/tasks/:id/location` and `PATCH /api/v1/tasks/:id/status` have no web UI callers; `"Save Remark"` (`dashboard/page.tsx:1132-1143`) is a toast-only `STUB`.

---

## 3. Flow 3: Feedbacks / Report

### 3.1 Evidence Upload & Modular Slots
- Step 2 (`app/(agent)/agent/tasks/[id]/page.tsx:60-108, 488-529, 942-1032`) uses a hardcoded client switch `getEvidenceSlotsForModule` instead of reading `task.executionBlueprint.evidenceSlots`, ignoring Admin-customized slots. Uploads use `uploadAgentMedia(file, "evidence")` (S3 -> presign -> base64 fallback).

### 3.2 Milestone Feedback & Moderated Chat
- **Milestone Report (`tasks/[id]/page.tsx:376-439`)**: Calls `PATCH /api/v1/tasks/:id/milestones` (`milestones/route.ts:188-376`), updating `taskMilestones` (`IN_PROGRESS`, `75%`, media/notes) and inserting a `PENDING_REVIEW` `MILESTONE_UPDATE` card into `taskChats`.
- **Mission Chat (`tasks/[id]/page.tsx:215-256, 451-486, 1324-1496`)**: Calls `GET/POST /api/v1/chat/:taskId/messages`. Messages are held at `PENDING_REVIEW` on `admin:chat:moderation`, yet UI toast (`line 480`) falsely states `"Message delivered to client feed"`, and the chat modal never subscribes to `/api/v1/chat/[taskId]/stream` SSE (live SSE **`UNVERIFIED`**).

### 3.3 Final Report Submission Endpoints (Divergence)

| Endpoint | Caller | Behavior & Verified Gaps |
|---|---|---|
| **`POST /api/v1/reports/submit`** (`app/api/v1/reports/submit/route.ts:10-120`) | **Web UI** (`tasks/[id]/page.tsx:563`) | Inserts `taskReports` (`SUBMITTED`, `OVS-RPT-...`), `reportMedia`, and `FINAL_SUBMISSION` chat card (`PENDING_REVIEW`). **CRITICAL BUGS**: (1) No `taskRow` existence or `taskRow.agentId === user.sub` check (IDOR); (2) silently drops `severity`, `checklist`, `metadata`, and `media[].caption` (`lines 14, 38-64`); (3) leaves `tasks.status` unchanged (`AGENT_ON_SITE`); (4) UI ignores `res.ok` and errors, always advancing to Step 4. |
| **`POST /api/v1/tasks/[id]/reports`** (`reports/route.ts:11-180`) | **Unused by Web UI** | Canonical endpoint: verifies `task.agentId === user.sub`, persists `checklist`, `measurements`, `severity`, `incidentalExpenses`, `metadata`, `caption`, sets `tasks.status = "REPORT_SUBMITTED"`, notifies client. |
| **`POST /api/v1/tasks/[id]/report/sync`** (`report/sync/route.ts:10-173`) | **Unused by Web UI** (`offlineReportsStorage` in `clientStorage.ts:24` unused) | **Verified Live (`201 Created`, `OVS-SYNC-...`)**: inserts `taskReports` + `reportMedia` and enqueues `GENERATE_WATERMARK_PDF` to Redis `oversite:queue:jobs` (`LLEN` rose `7 -> 8`, unconsumed because no worker runs). |

---

## 4. Flow 4: Milestone Completion & Final Submission

1. **Milestone Completion Handoff**: Agent clicks `"Submit Milestone"` (`tasks/[id]/page.tsx:926`) -> `PATCH /api/v1/tasks/:id/milestones` (`feedbackType: "SUBMISSION"`, `status: "COMPLETED"`). Server (`milestones/route.ts:252-270`) holds `taskMilestones.status = "IN_PROGRESS"` with `pendingApproval = true` and emits `MILESTONE_SUBMISSION` (`PENDING_REVIEW`) to `taskChats`. Admin `APPROVE`/`REFINE` in `POST /api/v1/admin/chats/:messageId/moderate` (`moderate/route.ts:107-147`) promotes milestone to `COMPLETED` (`100%`) and publishes to `task:chat:${taskId}`.
2. **Final Submission Conflict**:
   - Admin Chat Moderate (`moderate/route.ts:150-215`) sets `taskReports=APPROVED` and `tasks=REPORT_SUBMITTED` (never credits wallet).
   - Admin Reports Compile (`compile/route.ts:10-130`) sets `taskReports=UNDER_REVIEW` and `tasks=UNDER_REVIEW` with a phantom `pdfS3Key` (no S3 upload).
3. **Client Approval & Settlement**:
   - `POST /api/v1/tasks/:id/reports/[reportId]/approve` (`approve/route.ts:10-176`) sets `taskReports=APPROVED`, `tasks=COMPLETED`, `payments=RELEASED`, and credits `agentWallets` (no idempotency guard -> double-credit risk).
   - `tasks/[id]/page.tsx:1296` falsely tells the Agent `"Credited to Pending Clearance"` immediately upon submission (no pending escrow balance exists on `agentWallets`; `GET /api/v1/agent/wallet` computes `pendingClearanceNgn` solely from `PENDING` rows in `payoutTransactions`).
   - `agentProfiles.totalTasks` is **never incremented** anywhere on task completion.

---

## 5. Flow 5: Pay Withdrawal

> **Live Runtime Caveat (`UNVERIFIED`):** `GET /api/v1/agent/wallet` was verified live (`200 OK`, auto-provisions `agent_wallets` row). Actual execution of `POST /api/v1/agent/wallet/withdraw` was **not** run live (zero-balance test wallet; Admin credit endpoints were not executed). All withdrawal mechanics below are verified statically.

### 5.1 End-to-End Trace & Defects

1. **Wallet Overview (`app/(agent)/agent/wallet/page.tsx:149-214`, `GET /api/v1/agent/wallet` -> `agent/wallet/route.ts:9-137`, aliased at `app/api/v1/wallets/route.ts`)**:
   - Reads `agentWallets`, `agentProfiles` single bank columns, `withdrawalPinHash` presence, and last 10 `payoutTransactions`.
   - **Fabricated Stats (`wallet/page.tsx:181-184`)**: `thisMonth` equals lifetime `totalEarnedNgn`, and `thisWeek` is fabricated as `Math.round(totalEarnedNgn * 0.35)`.
2. **Bank Account Setup (`wallet/page.tsx:216-269, 498-565`)**:
   - Calls `POST /api/v1/banks/resolve` (Paystack `/bank/resolve` if `PAYSTACK_SECRET_KEY` set, else fallback `"OVERSITE ACCREDITED OPERATIVE"`) and `POST /api/v1/agent/bank-accounts` (`agent/bank-accounts/route.ts:9-104`), overwriting single `bankCode`/`bankAccountNumber`/`bankAccountName` on `agentProfiles`.
   - **Gaps**: Multi-bank UI (`savedAccounts`) and `handleDeleteAccount` (`lines 498-510`) are client-only; `withdraw/route.ts` ignores Admin `bankVerificationStatus`.
3. **Withdrawal PIN (`wallet/page.tsx:401-449`, `POST /api/v1/agent/wallet/pin` -> `pin/route.ts:9-75`)**:
   - **CRITICAL AUTH BYPASS (`pin/route.ts:51`)**: `if (docs.withdrawalPinHash && currentPin)` skips checking `currentPin` when `currentPin` is omitted — any stolen JWT can overwrite the withdrawal PIN!
   - **CRITICAL PLAINTEXT STORAGE (`wallet/page.tsx:143, 423, 455`)**: Stores the 4-digit PIN in plaintext in `localStorage.oversite_withdrawal_pin`.
   - **WEAK HASH & NO LOCKOUT (`pin/route.ts:9-11`)**: Uses unsalted-key-stretched `sha256("oversite_pin:" + userId + ":" + pin)` for 10,000 4-digit combinations with zero rate limiting.
4. **Withdrawal Execution (`POST /api/v1/agent/wallet/withdraw` -> `withdraw/route.ts:14-216`, aliased at `app/api/v1/wallets/withdraw/route.ts`)**:
   - **CRITICAL `MISSING` PAYMENT GATEWAY (`lines 138-165`)**: Generates local `OVS-PAYOUT-<hex>`, deducts `agentWallets.balanceNgn`, and inserts `payoutTransactions` directly with `status: "COMPLETED"` and `processedAt: now`. **Zero integration** with Paystack Transfers, Flutterwave, or `payment-service` (`:4000`).
   - **CRITICAL RACE CONDITION (`lines 74-165`)**: Non-transactional `SELECT` -> JS `<` comparison -> `UPDATE agent_wallets` -> `INSERT payout_transactions` without `FOR UPDATE`, conditional `WHERE balance_ngn >= amount`, or `idempotencyKey`. Concurrent requests can double-spend the wallet.
   - **MISSING GATES**: Does not require `kycStatus === "VERIFIED"`, `bankVerification.status === "VERIFIED"`, or require `withdrawalPinHash` to be configured (`if (userDocs.withdrawalPinHash)` at line 44 skips PIN verification if unset).

---

## 6. Agent RBAC, Security & Cross-Role Handoffs

- **Proxy & Middleware**: `proxy.ts:38-64` skips HMAC verification; `withAuth` does not re-check `users.isActive` or call `validateSession()` (suspended agents retain 7-day JWT access); `lib/auth/rbac.ts` `hasPermission()` is unused.
- **Endpoint IDORs**: `GET/PATCH /api/v1/tasks/[id]`, `GET/POST/PATCH /api/v1/tasks/[id]/milestones`, `POST /api/v1/reports/submit`, `POST /api/v1/tasks/[id]/respond`, and `GET /api/v1/agents`/`[id]` (leaks `ninId` & `nbaNumber` to `USER`).
- **Handoff Summary**:
  1. `Agent Register (PENDING, coerced tier)` -> `6 KYC Docs (S3 or base64)` -> `Admin Verify (broken /verify sync, no gate)`
  2. `Queue (500 crash) / Admin Assign (MATCHED)` -> `Accept (DRAFT allowed, unverified allowed) -> AGENT_EN_ROUTE` -> `Arrive (500m geofence bypassed in UI) -> AGENT_ON_SITE`
  3. `Chat / Milestone Card (PENDING_REVIEW)` -> `Admin Moderate (no SSE)` -> `Client/Agent Feed`
  4. `Report (/reports/submit drops fields, status stuck)` -> `Admin Compile (phantom S3 key) / Moderate` -> `Client Approve (no idempotency) -> Wallet Credit`
  5. `Link Bank -> Set PIN (overwrite bypass + localStorage) -> Withdraw (DB-only STUB, no Paystack Transfer, race condition)`
