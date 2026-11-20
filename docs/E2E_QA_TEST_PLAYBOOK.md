# Oversite WebApp — End-to-End Live QA Test Playbook & Real Input Data

Use this playbook to walk through every **User/Client**, **Agent**, and **Admin** path in order using realistic test data, covering happy paths, rejections, deletions, email triggers, and edge cases.

> **Base URL**: `http://localhost:3000`  
> **Preserved Admin Account**: `oversiteng@gmail.com` (`SUPER_ADMIN`)

---

## 1. Account Creation, Auth & Email Flows

### 1.1 User / Client Registration
- **Path**: `/register`
- **Inputs**:
  - **Full Name**: `Chinedu Okafor`
  - **Email**: `chinedu.okafor.test@gmail.com` *(or your real test inbox to verify AWS SES emails)*
  - **Phone**: `+2348031112233`
  - **Password**: `OversiteUser#2026`
  - **Confirm Password**: `OversiteUser#2026`
- **Expected**:
  - Account created (`201`), session recorded in DB & Redis, redirected to `/dashboard`.
  - Empty states on `/dashboard`, `/dashboard/tasks`, `/properties` (zero mock/placeholder data).

### 1.2 Agent Registration (Test Tier Preservation)
- **Path**: `/register/agent`
- **Inputs (Agent A — Technical Supervisor)**:
  - **Full Name**: `Engr. Tunde Bakare`
  - **Email**: `tunde.bakare.agent@gmail.com`
  - **Phone**: `+2348094445566`
  - **Specialization / Tier**: `Technical` / `TECHNICAL_SUPERVISOR`
  - **NIN**: `12345678901`
  - **Password**: `OversiteAgent#2026`
- **Inputs (Agent B — Legal Counsel, optional for multi-agent testing)**:
  - **Full Name**: `Barr. Amina Yusuf`
  - **Email**: `amina.yusuf.agent@gmail.com`
  - **Phone**: `+2348027778899`
  - **Specialization / Tier**: `Legal` / `LEGAL_COUNSEL`
  - **NBA Number**: `SCN/098765`
  - **Password**: `OversiteAgent#2026`
- **Expected**:
  - Redirected to `/agent/dashboard`.
  - `agent_profiles.tier` is saved as `TECHNICAL_SUPERVISOR` / `LEGAL_COUNSEL` (NOT coerced to `GENERAL`).
  - On `/settings/profile`, Agent Role / Specialization is locked (read-only with lock icon).

### 1.3 Auth Edge Cases & Security Checks
- **Logout & Session Revocation**:
  - Click Sign Out → verify `GET /api/v1/auth/me` with old token returns `401`.
- **Unauthenticated SSR Protection**:
  - Visit `/billing`, `/settings`, `/security`, `/messages`, `/admin/dashboard` while logged out → must redirect to `/login` (or `/admin/login`).
- **OTP Bypass Check**:
  - On `/forgot-password` / `/reset-password` or `POST /api/v1/auth/otp/verify`, try code `000000` → must fail with `400 OTP_INVALID`.

---

## 2. Agent Onboarding, KYC & Bank Details

### 2.1 Agent Verification Submission
- **Path**: `/agent/verification`
- **Inputs**:
  - **NIN**: `12345678901`
  - **Government ID Upload**: Upload any `.jpg`/`.png` ID photo
  - **Utility Bill / Proof of Address**: Upload any `.jpg`/`.png` or `.pdf`
  - **Selfie / Passport Photo**: Upload any `.jpg`/`.png`
- **Expected**:
  - Uploads succeed and status shows `PENDING` review.

### 2.2 Agent Bank Account & Withdrawal PIN Setup
- **Path**: `/agent/wallet`
- **Inputs (Bank Details)**:
  - **Bank**: `Guaranty Trust Bank` (`058`)
  - **Account Number**: `0123456789`
  - **Account Name (Match test)**: `Tunde Bakare` *(or `Wrong Name` to test Admin Name-Mismatch Warning!)*
- **Inputs (Withdrawal PIN)**:
  - **New PIN**: `4829`
  - **Update PIN Test (Negative)**: Try changing PIN without `currentPin` → must return `400 CURRENT_PIN_REQUIRED`.
  - **Update PIN Test (Positive)**: Provide `currentPin: 4829`, `newPin: 5910` → `200 OK`.

---

## 3. Admin Verification & Moderation of Accounts

### 3.1 Admin Login
- **Path**: `/admin/login`
- **Inputs**: `oversiteng@gmail.com` + your Super Admin password.

### 3.2 User & Agent KYC + Bank Verification
- **Path**: `/admin/users`
- **Steps**:
  1. Open `Engr. Tunde Bakare` → check **`Overview & Stats`** tab (all counters `0`), **`Profile & KYC`** tab.
  2. Click uploaded KYC document → verify **Protected In-App Viewer (DLP)** opens (images, PDFs, videos supported; no download).
  3. **Test Rejection First**: Reject one document or set Bank Verification to `WARNING` with note `"Account name does not match NIN"` → confirm Agent receives an `ALERT` notification.
  4. **Test Approval**: Approve Agent KYC (`VERIFIED`) and set Bank Verification to `VERIFIED`.
  5. Open `Chinedu Okafor` (`USER`) → verify `Overview & Stats` tab shows `0` tasks, `0` credits spent.

---

## 4. Property Registration & Admin Property Management

### 4.1 User Registers Owned Property
- **Path**: `/properties/new`
- **Inputs**:
  - **Ownership Type**: `OWNED` (`I own this property`)
  - **Property Title**: `Harmony Court Duplex — Plot 14`
  - **Property Type**: `RESIDENTIAL`
  - **Address**: `Plot 14, Harmony Estate, Lekki Phase 1, Lagos`
  - **Parcel / Survey Number**: `LS/D/LA/2026/014`
  - **Description**: `4-bedroom detached duplex under finishing stage with perimeter fence.`
  - **Proof of Ownership**: Upload a `.pdf` or `.jpg`
  - **Baseline Photos**: Upload 2 property photos
- **Expected**:
  - Property appears in `/properties` and `/properties/[id]` with **empty** Intel Timeline (no fake `"Tunde C."` or `"Feb 2024"` entries).

### 4.2 User Registers Non-Owned / Target Property (Encroachment / Acquisition)
- **Path**: `/properties/new`
- **Inputs**:
  - **Ownership Type**: `OTHER` (`I do not own this property yet`)
  - **Property Title**: `Admiralty Commercial Plot 9`
  - **Property Type**: `COMMERCIAL`
  - **Address**: `Plot 9, Admiralty Way, Lekki Phase 1, Lagos`
  - **Description**: `Prospective commercial land acquisition — needs title & physical check.`

### 4.3 Admin Property Listings & Quick-Action Task Dispatch
- **Path**: `/admin/properties`
- **Steps**:
  1. Open `Harmony Court Duplex — Plot 14`.
  2. Click **Assign Listing to a Manager** → search `Tunde` → select `Engr. Tunde Bakare` → Save.
  3. Open **Quick Action Timeline Drawer** → verify it opens the drawer without immediately dispatching.
  4. Click **`Dispense New Task`** → select **Physical Site Inspection** or **Building Material Cost Audit** → confirm subscription-included task is created (`₦0` client charge, fixed Agent Pay).
  5. Open `Admiralty Commercial Plot 9` (`OTHER`) → attempt to dispense **Vulnerability Test** → confirm it is blocked (`OWNED`-only rule).

### 4.4 Property Edit & Delete Edge Case
- **Path**: `PATCH /api/v1/properties/[id]` & `DELETE /api/v1/properties/[id]`
- **Expected**:
  - Editing `description` preserves `ownershipType`, `baselinePhotos`, and `proofOfOwnershipUrl` (`__meta` not wiped).
  - Deleting a property that has linked tasks succeeds (`200 OK`) by unlinking `tasks.propertyId = NULL` instead of crashing with FK `500`.

---

## 5. Task Creation Across Service Modules (User)

### 5.1 Project Watch (Milestone-Based Task)
- **Path**: `/projects/new`
- **Inputs**:
  - **Title**: `Lekki Duplex Structural & Finishing Audit`
  - **Location**: `Plot 14, Harmony Estate, Lekki Phase 1, Lagos`
  - **Scope / Instructions**: `Verify foundation curing, column reinforcement, roof parapet waterproofing, and compare contractor BOQ against site progress.`
  - **Property**: Select `Harmony Court Duplex — Plot 14`

### 5.2 Quick Errands (Non-Milestone Task)
- **Path**: `/errands/new`
- **Inputs**:
  - **Title**: `Building Material Market Price Check — Alaba & Lekki`
  - **Location**: `Alaba International Market, Ojo, Lagos`
  - **Instructions**: `Collect current unit prices from 3 dealers for Dangote 42.5R cement, 16mm iron rods, and 9-inch vibrated blocks.`

### 5.3 Due Diligence / Legal / Enforcement / Vulnerability
- **Paths**: `/diligence`, `/legal`, `/enforcement`, `/vulnerability`
- **Inputs (Vulnerability Test)**:
  - Verify dropdown shows ONLY real registered properties (no `DEMO_PROPERTIES`).
  - **Title**: `Perimeter & Encroachment Vulnerability Audit`

---

## 6. Admin Task Structuring, Assignment & Deletion

### 6.1 Card Grid vs. Table View, Double-Tap & Swipe-Delete
- **Path**: `/admin/tasks`
- **Steps**:
  1. Toggle between **Card View** and **Table View**.
  2. Verify columns/cards show **Credits / Subscription** + **Agent Pay** (no client cash margin).
  3. **Test Delete & Refund**: Swipe left on a test task (or click Delete) → confirm via `ConfirmModal` → verify task is deleted, client receives an `ALERT` notification, and any spent credits are refunded.
  4. **Double-tap** `Lekki Duplex Structural & Finishing Audit` card to open `/admin/tasks/[id]`.

### 6.2 Task Blueprint Structuring & Operative Assignment
- **Path**: `/admin/tasks/[id]`
- **Steps**:
  1. **Agent Pay & SLA Tab**: Set Agent Pay to `₦12,000`, Agent Turnaround `24h` → Save.
  2. **Scope & Structuring Tab**:
     - Edit **Operational Brief**.
     - Toggle **Uses Milestones** (`ON` for Project Watch; `OFF` for Quick Errands).
     - Add a **Deliverable Checklist** item: `"Verify 16mm reinforcement bar diameter with vernier caliper"`.
     - Add a **Required Agent Input**: `"Current Cement Price (NGN/bag)"` (`number`, required).
     - Save Blueprint.
  3. **Operative Assignment Tab**: Assign `Engr. Tunde Bakare`.

---

## 7. Hub-and-Spoke Chat Moderation (User ↔ Admin ↔ Agent)

### 7.1 User & Agent Send Messages
- **User Path**: `/chat` → open task thread (confirm no `"Admin-Moderated"` banner).
  - Send: `"Please confirm whether the site engineer is present today."`
- **Agent Path**: `/agent/tasks` → tap top-right **Message** icon (confirm Refresh icon is gone) → `/agent/messages` → open task thread.
  - Send: `"Yes, I am speaking with the site engineer now. Sharing photos shortly."`
- **Expected**:
  - Neither party sees the other's unapproved message before Admin approves it!

### 7.2 Admin Moderates Messages
- **Path**: `/admin/chat`
- **Steps**:
  1. Confirm full-bleed 2-pane inbox scrolls independently; Client bubbles on left, Operative bubbles on right.
  2. **Test Approve**: Approve User's message → confirm it appears in Agent's `/agent/messages/[taskId]` in real time AND after refresh.
  3. **Test Refine**: Refine Agent's message to `"The site engineer is on site. Verified photos will be uploaded shortly."` → Deliver → confirm User sees refined text.
  4. **Test Reject**: Send a test message containing a phone number (`"Call me on 08031234567"`) → Reject with reason `"Direct contact sharing is not permitted."` → confirm sender sees rejection reason and recipient never sees it.

---

## 8. Agent Task Execution, Milestones & Final Submission

### 8.1 Agent Queue & Acceptance
- **Path**: `/agent/queue`
- **Expected**:
  - Loads with `200 OK` (no `500` enum crash on `?status=PENDING,MATCHED`).
  - Payout amount displays exact `agentPayoutNgn` (no `0.7x`/`0.8x` double-discount).

### 8.2 Step-by-Step Execution
- **Path**: `/agent/tasks/[id]`
- **Steps**:
  1. **Header**: Confirm no floating chat modal; tapping **Message** navigates to `/agent/messages/[taskId]`.
  2. **Step 1 (Arrival)**: Confirm arrival (note: if GPS is outside geofence, verify behavior).
  3. **Step 2 (Evidence & Optional Milestones)**:
     - On **Quick Errands** (`usesMilestones: false`): confirm top Milestone section is **hidden**.
     - On **Project Watch** (`usesMilestones: true`): upload milestone photo + note `"Foundation curing verified at 28-day spec."` → submit milestone.
     - Upload required evidence photos in Evidence Slots.
  4. **Step 3 (Report & Final Submission)**:
     - Check off blueprint **Deliverables Checklist** items.
     - Fill **Required Agent Inputs** (e.g., `Current Cement Price: 9200`).
     - **Findings / Notes**: `"Site inspection completed. Perimeter fence intact, 16mm steel bars verified, no encroachment observed."`
     - Submit → confirm `POST /api/v1/tasks/[id]/reports` returns `201`/`200` and advances to Step 4.

---

## 9. Admin QA Review, Dossier Compilation & User PDF Preview

### 9.1 Admin Inspects Submission & Compiles Official Dossier
- **Path**: `/admin/chat` → confirm `FINAL_SUBMISSION` renders as a **Structured Card** (not raw JSON) → click **`Inspect Full Report →`**.
- **Path**: `/admin/reports`
- **Steps**:
  1. Review all submitted findings, structured inputs, checklist, and evidence photos.
  2. Click **Compile & Release Official Dossier** (`POST /api/v1/admin/tasks/[id]/reports/[reportId]/compile`).
  3. Confirm real watermarked PDF is generated (with **Oversite logo** in diagonal watermark) and uploaded to S3.

### 9.2 User Views Task Details, Plain PDF Preview & Rates Task
- **Path**: `/dashboard/tasks/[id]`
  - Verify real submitted/approved notes, milestones (only if applicable), and summary data.
  - Test **Milestone PDF**: click Download on a completed milestone → downloads valid `.pdf` via `/api/v1/tasks/[id]/milestones/[milestoneId]/pdf?download=1`.
  - Test **Rate Agent**: submit `5` stars + `"Thorough and timely inspection."` → confirm `POST /api/v1/tasks/[id]/rate` returns `200 OK`.
- **Path**: `/dashboard/tasks/[id]/report`
  - Verify **plain, full-bleed PDF preview** (no top control header, no Chrome toolbar).
  - Verify **Oversite logo watermark** is visible diagonally on the PDF.
  - Test **Zoom In (`125%`, `150%`, `200%`) & Zoom Out (`75%`, `50%`)** → confirm text stays vector-sharp (not blurry).
  - Test **Download PDF** button in floating bottom pill → downloads genuine `.pdf` file (never `.txt`).
  - Test right-click & `Ctrl+P` → blocked on viewer container.
