# Oversite WebApp — End-to-End Architecture & Workflow Audit (`docs/audit/`)

> **Audit Date:** 2026-11-20  
> **Target Repository:** `Oversite_WebApp_V2026` (`main-web`, Next.js `16.3.5` + PostgreSQL 16 + Redis 7 + Express `payment-service`)  
> **Audit Mode:** Strictly Read-Only (zero modifications to application source code, DB schema, migrations, `package.json`, Dockerfiles, or `.env*` files; all disposable runtime test records cleaned from Postgres and Redis)

---

## 1. Audit Scope & Integrity Rules

This audit suite documents an end-to-end, evidence-backed walkthrough and architectural quality check of the **Oversite WebApp** across all three operational personas:

1. **User / Client (`R1`)**: Account creation & auth/2FA/session lifecycle, property registering & oversight intelligence, and task placing across all 7 service modules, pricing, Paystack checkout/webhooks, and post-placement tracking/approvals/reports.
2. **Admin (`R2`)**: Staff onboarding & departmental RBAC (`AdminPolicy`), user & agent KYC verification moderation, task structuring/quoting/assignment, hub-and-spoke chat moderation, admin payout/escrow settlement & refunds, and milestone & final PDF dossier compilation.
3. **Agent (`R3`)**: Operative signup & 6-step KYC verification, task queue/acceptance/geofenced execution, milestone feedback & moderated chat, final report submission, and wallet/PIN/bank-account/withdrawal flows.
4. **Cross-Cutting Architecture & Live Runtime (`R4`)**: Flow-pattern modeling across roles, database schema & migration drift, background worker & Redis queue execution, storage/SES/Paystack integrations, and a prioritized remediation plan.

### Integrity & Tagging Conventions
Per audit integrity rules, **no unverified step or behavior is assumed or filled in**. Every gap or unexercised path is explicitly labeled using the following tags:

- **`MISSING`**: Expected capability, security gate, UI-to-API link, schema table/column, or gateway integration does not exist in the codebase.
- **`STUB`**: Placeholder or simulated implementation (`TODO` worker handlers, `setTimeout` UI mocks, hardcoded fallback data, DB-only status updates without gateway calls).
- **`UNVERIFIED`**: Runtime path or build step that could not be exercised live under read-only/credential/safety constraints and is therefore established by static code inspection only.

No raw secrets, passwords, private keys, or API key strings are included anywhere in these documents.

---

## 2. Deliverable Index

| File | Purpose |
|---|---|
| [`README.md`](./README.md) | Audit scope, integrity conventions, local environment & runtime verification matrix, and reconciled static checks. |
| [`01-FLOW-PATTERN-MODEL-AND-GAP-SUMMARY.md`](./01-FLOW-PATTERN-MODEL-AND-GAP-SUMMARY.md) | High-level flow pattern model (Intended vs. Actual), Mermaid & structured state/sequence diagrams across all 3 roles, and executive gap summary matrix. |
| [`02-USER-CLIENT-FLOW-AUDIT.md`](./02-USER-CLIENT-FLOW-AUDIT.md) | Complete step-by-step R1 trace for User/Client account creation, property registering, task placing, post-placement lifecycle, and RBAC/handoffs. |
| [`03-ADMIN-FLOW-AUDIT.md`](./03-ADMIN-FLOW-AUDIT.md) | Complete step-by-step R2 trace for Admin auth/RBAC, KYC moderation, task assignment, chat moderation, payout/finance, and PDF report generation. |
| [`04-AGENT-FLOW-AUDIT.md`](./04-AGENT-FLOW-AUDIT.md) | Complete step-by-step R3 trace for Agent verification, task queue/execution, feedbacks/reports, milestone/final submission, and pay withdrawal. |
| [`05-ARCHITECTURE-GAPS-AND-REMEDIATION-PLAN.md`](./05-ARCHITECTURE-GAPS-AND-REMEDIATION-PLAN.md) | Consolidated architectural gaps, `MISSING` / `STUB` / `UNVERIFIED` register, and prioritized `P0`–`P3` remediation & implementation plan. |

*(Existing repository docs at [`docs/SUBSCRIPTION_PLANS_AND_FEATURES.md`](../SUBSCRIPTION_PLANS_AND_FEATURES.md) and [`docs/api_documentation.md`](../api_documentation.md) were audited as reference specifications and left untouched.)*

---

## 3. Local Environment & Static/Build Verification Matrix

### 3.1 Running Docker Services Observed (`2026-11-20T08:33–08:37Z`)

| Service / Container | Status | Host / Port | Notes |
|---|---|---|---|
| `oversite_web_app` | Up (running `next dev`, Next.js `16.3.5`) | `0.0.0.0:3000->3000/tcp` | Serves Next.js UI & `/api/v1/*` routes |
| `oversite_payment_service` | Up | `0.0.0.0:4000->4000/tcp` | Express microservice (`dist/index.js`); **unused by Next.js** and lacks `PAYSTACK_SECRET_KEY` in Compose |
| `oversite_postgres` | Up (healthy) | `0.0.0.0:5433->5432/tcp` | PostgreSQL 16 (`oversitedb`), **20 tables** & **16 pgEnums** verified via `\dt` |
| `oversite_redis` | Up (healthy) | `0.0.0.0:6379->6379/tcp` | Redis 7 (`LLEN oversite:queue:jobs = 7` pre-existing unconsumed `SEND_EMAIL` jobs from `2026-11-16`) |
| Background Worker (`worker`) | **NOT RUNNING (`MISSING`)** | — | Not defined in `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.staging.yml`, or `docker-compose.prod.yml` |

### 3.2 Environment & Dependency Reconciliation

| Item | Observed State | Notes |
|---|---|---|
| Core Env Keys (`.env.local`, values withheld) | `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `EXTERNAL_API_KEYS`, `AWS_REGION` (`eu-west-2`), `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_MEDIA_BUCKET`, `AWS_SES_FROM_EMAIL`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_CALLBACK_URL` are **SET** | `AWS_S3_MEDIA_BUCKET` and `AWS_SES_FROM_EMAIL` are defined twice in `.env.local` (last wins). Repo root also holds untracked key files (`oversite-key.pem`, `oversite-s3-app-user_accessKeys.csv` — ignored by `.gitignore`, hygiene risk). |
| `USE_REDIS_EMAIL_WORKER` | **NOT SET** | `lib/services/mailService.ts:44` defaults to inline fire-and-forget SES unless `"true"`. |
| `FLUTTERWAVE_*` | **`MISSING`** | Referenced in `paymentStatusEnum`/`paymentGatewayEnum` (`db/schema.ts:57-62`), no integration or keys exist. |
| **`sharp` Dependency Reconciliation** | **Absent from `package.json:20-53`**, but **present at runtime** | Direct inspection confirms `sharp` is NOT declared in `package.json`, yet `next@16.3.5` declares `"sharp": "^0.35.4"` in `optionalDependencies`. Thus `sharp` is hoisted in `package-lock.json` (`node_modules/sharp`) and resolves inside `oversite_web_app` (`/app/node_modules/sharp/dist/index.cjs`), enabling `lib/middleware/mediaCompression.ts:1` and live `POST /api/v1/agent/upload` (`200 OK`). Remains fragile if `--omit=optional` is used or `next` removes `sharp`. |

### 3.3 Reconciled Static & Build Checks

| Check | Execution Context & Command | Exit Code | Result |
|---|---|---|---|
| TypeScript (`host`) | `npx tsc --noEmit` on Windows host (R1/R2) | Timed out (>90s) | `UNVERIFIED` on Windows host due to shell timeout. |
| TypeScript (`container`) | `docker exec oversite_web_app ./node_modules/.bin/tsc --noEmit --incremental false` | **`0`** | **PASS** — Zero TypeScript errors across the project (`TSC_EXIT=0`). |
| ESLint (`core infra`) | `docker exec oversite_web_app ./node_modules/.bin/eslint lib/ proxy.ts worker.ts db/` | **`1`** | **29 problems (25 errors, 4 warnings)** — primarily `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars`. |
| Production Build (`next build`) | Not executed | — | **`UNVERIFIED`** — intentionally skipped because `package.json:9` (`prebuild`) runs `npm run clean` (`rm -rf .next`), which would disrupt the running `oversite_web_app` dev container. |

---

## 4. Live Runtime Verification Matrix (Tested vs. `UNVERIFIED`)

All live tests were performed on `2026-11-20` against `http://127.0.0.1:3000` and `http://127.0.0.1:4000` using disposable `audit_*@oversite-test.local` records, followed by complete Postgres & Redis cleanup restoring baseline counts (`users=3, properties=1, tasks=4, task_milestones=8, task_reports=0, payments=1, notifications=8, LLEN oversite:queue:jobs=7`). *(Note: one 1x1 test PNG uploaded during S3 verification remains isolated in the S3 bucket.)*

| Domain / Flow | What Was Verified Live | Live Outcome | What Remains `UNVERIFIED` Live |
|---|---|---|---|
| **Health & Infra** | `GET /api/health` (`:3000`), `GET /api/payments/health` (`:4000`), `psql \dt`, `redis-cli LLEN` | `200 OK` on both; 20 tables; 7 queued jobs; **CORS bug** (`Allow-Credentials: true` + `Allow-Origin: *`) | Production `next build` standalone artifact |
| **Auth, Proxy & RBAC** | Unauth `/dashboard`, `/billing`, `/documents`, `/settings`, `/security`; forged unsigned JWT cookie on `GET /admin/dashboard`; forged Bearer on `GET /api/v1/admin/users`; `register`, `login`, `me`, `sessions`, `logout` -> `me` | Unauth `/billing`..`/security` returned **`200 OK`** (`proxy.ts` omission); forged JWT rendered `/admin/dashboard` **`200 OK`**; `logout` left Bearer token returning **`200 OK`** on `/auth/me` | Live AWS SES email delivery for 2FA (`POST /api/v1/auth/login/2fa`), `forgot-password`, and `NEW_LOGIN_ALERT` |
| **External API** | `GET /api/v1/external/health`, `POST /api/v1/external/notifications` | **`500 Internal Server Error`** (`request.headers.get("")` crash at `lib/api/externalAuth.ts:20`) | External partner key auth once header name is fixed |
| **User / Client Flow** | `POST /api/v1/properties`, `POST /api/v1/tasks` (`QUICK_ERRANDS`), `GET /api/v1/subscriptions`, `POST /api/v1/payments/initialize` (`amount: 1000` on ₦15k task) | Property persisted hardcoded Lekki intel + unpaid `PAID_ESCROW` task; task created `PENDING` unpaid; `initialize` accepted `₦1,000` and hit Paystack (`502` on `.local` email) | Full Paystack hosted checkout completion with public email; Paystack-signed webhook delivery; browser E2E UI walkthrough |
| **Payments & Webhooks** | `POST /api/v1/payments/webhook` (`:3000`) & `POST /api/payments/webhook` (`:4000`) without `x-paystack-signature` | **Both returned `200 OK {"received":true}`** (signature bypass confirmed live) | Flutterwave gateway (`MISSING` integration & keys) |
| **Agent Flow** | `register` (`AGENT`), `GET /api/v1/tasks?status=open`, `GET /api/v1/tasks?status=PENDING,MATCHED`, `GET /api/v1/agent/wallet`, `POST /api/v1/tasks/:id/accept` (`PENDING` KYC), `POST /arrive` (480km & 0m), `POST /report/sync`, `GET /reports/:id/pdf`, `POST /upload` | `?status=PENDING,MATCHED` crashed **`500`**; unverified agent claimed task **`200`**; geofence enforced (`400`/`200`); `report/sync` enqueued Redis job (`7->8`); PDF returned `2743` bytes (`%PDF-1.3`); S3 upload `200 OK` | Funded `POST /api/v1/agent/wallet/withdraw` execution; live SSE streams (`/chat/[taskId]/stream`, `/notifications/stream`) |
| **Admin Flow** | Static source & schema trace across all Admin UI, API, and RBAC files | Static findings confirmed across all 5 Admin flows | **All authenticated Admin runtime mutations** (`/admin/users/[id]/verify`, `/admin/tasks/[id]/assign`, `/admin/chats/[messageId]/moderate`, `/compile`, `/disburse`, `/payout`) — not run without Admin credentials/impersonation |
| **Background Worker** | Redis queue inspection (`LLEN oversite:queue:jobs` = 7 -> 8) | Confirmed no worker running in Compose/host; jobs sit unconsumed | Live execution of `npm run worker` (`scripts/worker.ts`) loop |
