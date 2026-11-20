# 01 — Flow Pattern Model & Executive Gap Summary

This document models the **Intended vs. Actual** end-to-end architecture across all three roles (**User/Client ↔ Admin ↔ Agent ↔ Workers/Gateways**) and summarizes the highest-severity gaps discovered across static and live runtime verification.

---

## 1. End-to-End Cross-Role Architecture Model

### 1.1 High-Level Cross-Role Sequence (Intended vs. Actual)

```mermaid
sequenceDiagram
    autonumber
    actor Client as User / Client
    actor Admin as Admin / Central Ops
    actor Agent as Field Agent
    participant API as Next.js API & proxy.ts
    participant DB as Postgres & Redis
    participant Ext as Paystack / S3 / SES / Worker

    Note over Client,Ext: 1. ACCOUNT CREATION & VERIFICATION
    Client->>API: POST /api/v1/auth/register (USER)
    API->>DB: Insert users (kycStatus=PENDING), skip createSession() & email OTP
    Agent->>API: POST /api/v1/auth/register (AGENT) + tier="LEGAL"/"TECHNICAL"
    API->>DB: Coerces unknown tier to "GENERAL", inserts agentProfiles (isAvailable=false)
    Agent->>API: POST /api/v1/kyc/documents (6 docs) + /api/v1/agent/upload (S3 or base64 fallback)
    Admin->>API: POST /api/v1/admin/users/:id/verify OR PATCH /api/v1/admin/users/:id
    Note right of API: ACTUAL BUG: /verify skips address/doc sub-statuses & notifications;<br/>kycStatus=VERIFIED is NEVER gated on tasks/accept/withdraw

    Note over Client,Ext: 2. PROPERTY REGISTERING & OVERSIGHT
    Client->>API: POST /api/v1/properties (base64 proof & photos inside JSON description.__meta)
    API->>DB: Saves properties + hardcoded Lekki fake intel + unpaid task (quoteStatus="PAID_ESCROW")

    Note over Client,Ext: 3. TASK PLACING, PRICING & PAYMENT
    Client->>API: 6 modules -> POST /api/v1/tasks (status="PENDING" directly, bypasses Paystack!)
    Client->>API: Quick Errands -> POST /tasks/quick-errands (DRAFT) -> POST /payments/initialize
    API->>Ext: Paystack /transaction/initialize (trusts client amount without task.priceNgn check)
    Ext-->>API: Webhook POST /api/v1/payments/webhook (signature bypassed if header omitted!)
    API-->>Client: POST /api/v1/payments/verify (OVS_* prefix auto-succeeds unpaid txns!)

    Note over Client,Ext: 4. ASSIGNMENT, EXECUTION & HUB-AND-SPOKE CHAT
    Agent->>API: GET /api/v1/tasks?status=PENDING,MATCHED (ACTUAL: 500 Postgres enum crash!)
    Admin->>API: POST /api/v1/admin/tasks/:id/assign (MATCHED) OR Agent POST /tasks/:id/accept (AGENT_EN_ROUTE)
    Agent->>API: POST /api/v1/tasks/:id/arrive (500m geofence -> AGENT_ON_SITE; UI ignores 400 error!)
    Client->>API: POST /api/v1/chat/:taskId/messages (saved PENDING_REVIEW -> admin:chat:moderation)
    Agent->>API: PATCH /api/v1/tasks/:id/milestones (PENDING_REVIEW card)
    Admin->>API: POST /api/v1/admin/chats/:messageId/moderate (APPROVE/REFINE -> task:chat:taskId)
    Note right of API: ACTUAL BUG: No Admin SSE listener on admin:chat:moderation

    Note over Client,Ext: 5. FINAL REPORT, PDF DOSSIER & SETTLEMENT
    Agent->>API: POST /api/v1/reports/submit (drops checklist/severity/caption; task stays AGENT_ON_SITE)
    Admin->>API: POST /admin/tasks/:id/reports/:reportId/compile (synthetic pdfS3Key, no S3 upload)
    Client->>API: GET /api/v1/reports/:id/pdf (live pdfkit PDF; User UI downloads fake .txt instead!)
    Client->>API: POST /api/v1/tasks/:id/reports/:reportId/approve (no idempotency -> double-credit risk!)
    API->>DB: tasks=COMPLETED, payments=RELEASED, credits agentWallets
    Agent->>API: POST /api/v1/agent/wallet/withdraw (non-atomic DB deduction -> COMPLETED, NO Paystack Transfer!)
    Ext--xDB: Worker (AUTO_RELEASE_ESCROW / GENERATE_WATERMARK_PDF) = STUB & NOT RUNNING
```

---

## 2. Core Flow Pattern Models (Intended vs. Actual)

### 2.1 Pattern A: Account, Session & Verification Lifecycle

```
[INTENDED]
Signup -> Email/Phone OTP Verify -> createSession() -> KYC Docs Upload (S3)
       -> Admin Vetting (NIMC/NBA/Bank) -> kycStatus="VERIFIED" -> Platform Access Unlocked
       -> Logout/Suspend -> Session Revoked Everywhere

[ACTUAL]
Signup ──(no OTP, no createSession)──> Immediate Dashboard Access (JWT in JS cookie + localforage)
  │
  ├── User: NO KYC submission UI; /security 2FA enables without OTP; /forgot-password is a stub
  ├── Agent: Tier "LEGAL"/"TECHNICAL" coerced to "GENERAL"; S3 failures silently store base64 in JSONB
  ├── Admin Moderation: /verify leaves doc sub-statuses "reviewing"; AdminPolicy ignored by withAuth
  └── Enforcement: ZERO APIs check kycStatus==="VERIFIED"; validateSession() is dead code;
                   proxy.ts skips JWT HMAC signature check; logout leaves Bearer JWTs valid (200 OK)
```

### 2.2 Pattern B: Property Onboarding & Oversight Loop

```
[INTENDED]
Register Property -> Upload Proof/Photos to S3 -> Verified Ownership Badge (pending Admin review)
                  -> Subscription Plan + Recurring Worker Dispenses Real Field Tasks -> Timeline Updates

[ACTUAL]
Register Property (app/(user)/properties/new/page.tsx)
  ├─ Reads files via FileReader.readAsDataURL() -> raw base64 stuffed into properties.description JSON (__meta)
  ├─ Unconditionally renders "Verified Owner" badge in UI
  ├─ Auto-dispenses PROPERTY_OVERSITE task with quoteStatus="PAID_ESCROW" (₦15,000, 0 payment)
  ├─ Seeds fabricated Lekki Phase 1 intel ("Tunde C.", "98%", Feb 2024 policies)
  ├─ Subscriptions & Credits tables are MISSING (GET /api/v1/subscriptions is static mock)
  └─ No Edit/Delete UI; PATCH corrupts __meta; DELETE hits Postgres FK 500 error (tasks.propertyId)
```

### 2.3 Pattern C: Task Lifecycle State Machine (Escrow → Execution → Settlement)

```
  [User Places Task]
        │
        ├──(Quick Errands)──> DRAFT ──[/payments/initialize]──> Paystack (or OVS_* verify bypass / unsigned webhook) ──> PENDING
        └──(Other 6 Modules + Property Auto-Task)───────────────────────────────────────────────────────────────────────> PENDING (UNPAID!)
                                                                                                                             │
             ┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
             ▼
     [Task Pool / Assignment]
        ├── Admin POST /admin/tasks/:id/assign (no validation/notification) ──> MATCHED
        └── Agent POST /tasks/:id/accept (allows DRAFT & unverified KYC!) ────> AGENT_EN_ROUTE
                                                                                     │
                                                                                     ▼
                                                                    Agent POST /tasks/:id/arrive (500m geofence; UI bypasses 400!)
                                                                                     │
                                                                                     ▼
                                                                              AGENT_ON_SITE
                                                                                     │
                    ┌────────────────────────────────────────────────────────────────┴──────────────────────────┐
                    ▼                                                                                           ▼
        [Agent UI calls /reports/submit]                                                        [Unused Canonical /tasks/:id/reports]
        - Drops checklist/severity/caption                                                      - Validates agentId === user.sub
        - Leaves tasks.status = AGENT_ON_SITE                                                   - Sets tasks.status = REPORT_SUBMITTED
                    │
                    ├── Path A: Admin Chat Moderate (generatePdf) ──> taskReports=APPROVED, tasks=REPORT_SUBMITTED (no wallet credit)
                    └── Path B: Admin Reports /compile ─────────────> taskReports=UNDER_REVIEW, tasks=UNDER_REVIEW (phantom pdfS3Key)
                                                                                     │
                                        ┌────────────────────────────────────────────┴──────────────────────────────────────────┐
                                        ▼                                                                                       ▼
                      Client/Admin POST .../approve (NO IDEMPOTENCY!)                                             Client POST .../reject
                      - tasks=COMPLETED, payments=RELEASED                                                        - taskReports=REJECTED, tasks=DISPUTED
                      - Credits agentWallets (double-credit on retry)                                             - Admin /finance/overview:
                                        │                                                                           CREDIT_AGENT | REFUND_CLIENT (DB-only) | REMEDIATE
                                        ▼
                      Agent POST /agent/wallet/withdraw (NO PAYSTACK TRANSFER, NO TX/LOCK, NO KYC/BANK CHECK)
                      - Deducts agentWallets non-atomically -> payoutTransactions status="COMPLETED" (OVS-PAYOUT-*)
```

### 2.4 Pattern D: Hub-and-Spoke Moderated Communication

```
  User / Client ──(POST /chat/:taskId/messages)──┐
                                                 ├──> DB taskChats (moderationStatus = PENDING_REVIEW)
  Field Agent   ──(POST /chat/:taskId/messages   │         │
                   or PATCH .../milestones       │         ▼ (publishes to Redis "admin:chat:moderation" — NO SSE LISTENER!)
                   or POST /reports/submit)──────┘    Admin Console (/admin/chat — manual refresh only)
                                                           │
                              POST /admin/chats/:messageId/moderate (APPROVE / REFINE / REJECT)
                                                           │
                                                           ▼ (publishes to "task:chat:<taskId>")
                                                Client & Agent Feeds
                                    (Agent UI modal does not connect to /stream SSE)
```

---

## 3. Executive Gap Summary Matrix

| Severity | ID | Category | Finding Summary | Primary Code / Runtime Evidence |
|---|---|---|---|---|
| **CRITICAL** | **GAP-01** | Payments / Webhook | Unsigned Paystack webhook bypass on both Next.js (`:3000`) and `payment-service` (`:4000`) when `x-paystack-signature` header is omitted (**live HTTP `200`**). | `app/api/v1/payments/webhook/route.ts:16-21`; `services/payment-service/src/index.ts:16-25` |
| **CRITICAL** | **GAP-02** | Payments / Verify | Any reference prefixed `OVS_` (all initialized refs) auto-succeeds verification without Paystack confirmation; `initialize` trusts arbitrary client `amount` (**live `502` on `₦1,000` for `₦15,000` task**) & lacks ownership check. | `app/api/v1/payments/verify/route.ts:83-86`; `app/api/v1/payments/initialize/route.ts:12-42` |
| **CRITICAL** | **GAP-03** | Task Placement | 6 of 7 user task modules (plus Property auto-task with `PAID_ESCROW`) create `PENDING` tasks directly without calling `/payments/initialize`, and UI swallows API errors to show success modals. | `app/(user)/{property-oversite,projects,diligence,legal,enforcement,vulnerability}/**`; `app/api/v1/properties/route.ts:142` |
| **CRITICAL** | **GAP-04** | Finance / Payouts | `agent/wallet/withdraw` has **no Paystack Transfer / bank API call** (synthetic `OVS-PAYOUT-*`, immediate `COMPLETED`), non-atomic balance deduction (race condition), no idempotency, and no KYC/bank verification gate. | `app/api/v1/agent/wallet/withdraw/route.ts:74-165`; `app/(admin)/admin/finance/page.tsx:266-353` |
| **CRITICAL** | **GAP-05** | Finance / Double-Credit | `reports/[reportId]/approve`, `payments/disburse`, `payments/payout`, and `admin/finance/overview` (`CREDIT_AGENT`) lack idempotency/state guards & DB locks; `disburse` allows clients to pass `customAgentPayoutNgn`; `payout` defaults to 100% client price. | `approve/route.ts:61-131`; `disburse/route.ts:45-133`; `payout/route.ts:40-80`; `finance/overview/route.ts:270-306` |
| **CRITICAL** | **GAP-06** | Auth / Edge Proxy | `proxy.ts` decodes JWT without verifying HMAC signature (**live `200 OK` on `/admin/dashboard` with forged unsigned cookie**) and omits `/billing`, `/payments`, `/documents`, `/settings`, `/security`, `/support`, `/about`, `/messages` (**live `200 OK` unauth**). | `proxy.ts:5-21, 38-64, 185-209` |
| **CRITICAL** | **GAP-07** | Auth / Sessions & OTP | `validateSession()` is dead code; `logout` does not revoke sessions (**live `200 OK` on `/auth/me` post-logout**); hardcoded `"000000"` OTP/reset bypass; `/forgot-password` & `/reset-password` UIs are disconnected stubs. | `lib/auth/sessionManager.ts:283`; `app/api/v1/auth/logout/route.ts:4-22`; `otp/verify/route.ts:19-24`; `reset-password/route.ts:45` |
| **CRITICAL** | **GAP-08** | Auth / RBAC & IDOR | `GET/PATCH /api/v1/tasks/[id]`, `GET/POST/PATCH /tasks/[id]/milestones`, `POST /reports/submit`, `POST /tasks/[id]/respond` lack ownership/assignment checks; `GET /api/v1/media` serves private S3 KYC docs **unauthenticated**; `withAuth` ignores `isActive` & `AdminPolicy`. | `tasks/[id]/route.ts:140,420`; `milestones/route.ts:33,98,188`; `media/route.ts:21-63`; `lib/auth/middleware.ts:40-88` |
| **CRITICAL** | **GAP-09** | Agent Security | `POST /api/v1/agent/wallet/pin` overwrites existing PIN if `currentPin` is omitted; plaintext PIN stored in `localStorage`; unverified agents (`PENDING` KYC) can claim & execute tasks (**confirmed live `200 OK`**). | `app/api/v1/agent/wallet/pin/route.ts:51`; `agent/wallet/page.tsx:423,455`; `tasks/[id]/accept/route.ts:45` |
| **HIGH** | **GAP-10** | Live 500 Crashes | `GET /api/v1/tasks?status=PENDING,MATCHED` (called by Agent Queue UI) crashes with **`500`** Postgres enum error; all `/api/v1/external/*` endpoints crash with **`500`** (`request.headers.get("")`). | `app/(agent)/agent/queue/page.tsx:55`; `app/api/v1/tasks/route.ts:52-54`; `lib/api/externalAuth.ts:20` |
| **HIGH** | **GAP-11** | Workers & PDF | No worker container in Compose; `scripts/worker.ts` drops non-email jobs; `worker.ts` has `TODO` stubs for `AUTO_RELEASE_ESCROW` & `GENERATE_WATERMARK_PDF`; milestone PDFs **`MISSING`**; `/compile` fakes S3 key; User report UI downloads `.txt` instead of PDF; `pdfGenerator.ts` omits `reportMedia`. | `docker-compose*.yml`; `scripts/worker.ts:22-26`; `worker.ts:19-27`; `compile/route.ts:60`; `dashboard/tasks/[id]/report/page.tsx:70-107` |
| **HIGH** | **GAP-12** | UI-API Divergences | Task pricing mismatches (`₦12k` UI vs `₦45k`/`₦50k`/`₦65k`/`₦75k` backend); agent double-discounting (`0.7x`/`0.8x` on `agentPayoutNgn`); agent signup sends `"LEGAL"`/`"TECHNICAL"` coerced to `"GENERAL"`; geofence `400` ignored by UI; `/reports/submit` drops fields & leaves task status unchanged. | `lib/services/pricing.ts:88-162`; `agent/tasks/page.tsx:206`; `register/agent/page.tsx:250-252`; `agent/tasks/[id]/page.tsx:295-335,563-590` |
| **HIGH** | **GAP-13** | Chat & Realtime | No Admin SSE endpoint for `admin:chat:moderation`; `RedisSocketBridge` duplicates local+Redis events and leaks/breaks shared subscriber on `unsubscribe`; `DELETE .../moderate` & `/chats/threads` unused; no mute/audit log. | `app/(admin)/admin/chat/page.tsx:88-188`; `lib/realtime/websocketHandlers.ts:15-89`; `moderate/route.ts:320-364` |
| **MEDIUM** | **GAP-14** | Schema, Data & Subs | `docs/SUBSCRIPTION_PLANS_AND_FEATURES.md` tables **`MISSING`** (`subscriptions` endpoints are mocks); fake seed data (`DEFAULT_TASKS`, `DEMO_PROPERTIES`, `SAMPLE_STAGE_PHOTOS`, fake Lekki intel); `properties.description` JSON overloading & broken FK `DELETE`; missing `POST /tasks/[id]/rate`; `sharp` undeclared in `package.json`; 29 ESLint errors/warnings. | `db/schema.ts`; `app/api/v1/subscriptions/*`; `lib/services/propertyTaskService.ts:28-153`; `app/api/v1/properties/[id]/route.ts:244,308-317`; `package.json:20-53` |
