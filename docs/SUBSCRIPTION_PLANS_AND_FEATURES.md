# Oversite Subscription Plans & Features Specification

> **Status**: Draft Architecture Specification (To Be Implemented)
> **Scope**: End-User Property Oversight Subscriptions, Credit System Integration, and Recurring Task Automation

---

## 1. Core Financial Model

Oversite operates a **hybrid Dual-Layer financial model** for End Users:
1. **Credits (Pay-As-You-Go Execution)**: End users purchase Oversite Credits with money (NGN via Paystack/Flutterwave) to fund on-demand missions, errands, due diligence, legal advisory, and ad-hoc property checks.
2. **Subscription Plans (Property Oversight & Tier Privileges)**: End users subscribe to a tier that governs:
   - **Maximum number of listed properties** (Owned & Encroachment Watch)
   - **Automated recurring intelligence cadence** (Word on the Street, State Policy Updates, Expert Review, Landmarks, Site Summary)
   - **Frequency adjustment privileges** (min/max cadence bounds the user can self-adjust)
   - **Access to specialized services** (e.g., Vulnerability Tests, Priority Dispatch, Dedicated Operative)

---

## 2. Property Types & Task Eligibility Matrix

Not all tasks can be carried out on every property due to physical access and legal permission constraints:

| Property Type | Description | Eligible Tasks / Quick Actions | Restricted Tasks |
| :--- | :--- | :--- | :--- |
| **Owned Property (`OWNED`)** | Property legally owned by the end user (with Proof of Ownership submitted for Admin verification). | Site Summary, Word on the Street, Expert Review, State Policy Updates, Landmarks, Building Material Cost, Community Update, **Ownership Verification**, **Vulnerability Test** | None |
| **Encroachment / Watch (`OTHER`)** | Property monitored for encroachment, acquisition interest, or boundary watch without full owner access. | Site Summary (external perimeter), Word on the Street, Expert Review (desk/external), State Policy Updates, Landmarks, Community Update | **Vulnerability Test** (No physical access/permission), **Ownership Verification** (Not owned by client) |

---

## 3. Subscription Tiers & Feature Matrix

| Feature | **Basic (Starter)** *(Cheapest)* | **Standard (Guardian)** | **Pro (Portfolio)** | **Enterprise (Institutional)** |
| :--- | :--- | :--- | :--- | :--- |
| **Max Listed Properties** | Up to **1** property | Up to **3** properties | Up to **10** properties | **Unlimited** (Custom SLA) |
| **Default Recurring Cadence** | **Annually** (Every 12 months) | **Semi-Annually** (Every 6 months) | **Semi-Annually** (Every 6 months) | **Semi-Annually** (Every 6 months) |
| **Allowed User Frequency Range** | Annually only (Fixed) | Quarterly – Annually | Bi-Monthly – Annually | Monthly – Annually |
| **User Self-Service Cadence Request** | No (Upgrade required) | Yes (within plan min/max) | Yes (within plan min/max) | Yes (within plan min/max) |
| **Automated Intel Timeline** | Policy Updates, Word on Street | + Expert Review, Landmarks | + Site Summary, Community Updates | Full Suite + Custom Directives |
| **Ownership Verification** | Included (1-time per owned property) | Included | Priority Queue | Dedicated Compliance Officer |
| **Vulnerability Test** | Paid via Credits | Paid via Credits (10% off) | 1 Included / Year + Credits | Quarterly Included |
| **Dedicated Property Manager** | Pool Dispatch | Pool Dispatch | Preferred Operative | Dedicated Operative |

---

## 4. Recurring Automation Cadence Rules

Supported recurrence intervals across the platform:
- `MONTHLY` — Every 1 month
- `BI_MONTHLY` — Every 2 months
- `TRI_MONTHLY` — Every 3 months
- `QUARTERLY` — Every 3 months (Calendar Quarter)
- `SEMI_ANNUALLY` — Every 6 months (**Platform Default** for all tiers except Basic)
- `ANNUALLY` — Every 12 months (**Default** for Basic / cheapest plan)

### Cadence Adjustment Rules
1. Every newly listed property defaults to **`SEMI_ANNUALLY` (Every 6 Months)**, except users on the **Basic (cheapest)** plan who default to **`ANNUALLY`**.
2. End users reserve the privilege to **extend** (e.g., from 6 months to Annually) or **shorten** (e.g., from 6 months to Quarterly, Tri-Monthly, Bi-Monthly, or Monthly) their property's automated check frequency, **strictly within the min/max bounds of their active subscription plan**.
3. When a scheduled cycle triggers, the background worker auto-dispenses the configured Property Intelligence tasks and appends the resulting verified reports to the top of each section's timeline on the property details page.



---

## 5. In-App Credit System & Task Cancellation/Refund Rules

- **No Direct Cash-Per-Task for Clients**: End users purchase **Oversite In-App Credits** with NGN (via Paystack/Flutterwave) and spend those credits to initiate on-demand tasks.
- **Subscription-Included Property Tasks**: Automated or admin-dispensed property intelligence tasks cost **0 credits** (covered by the user's active subscription plan).
- **Admin Task Economics**: Because clients pay in credits (or via subscription), Admin task views display **Credits Used / Subscription Included** alongside **Agent Task Pay (NGN)** rather than client cash margin.
- **Task Deletion & Automatic Credit Refund**: Whenever Central Operations (Admin) deletes or cancels a task:
  1. Any Oversite Credits spent on that task are **automatically refunded** to the client's `creditBalance`.
  2. The client immediately receives an in-app **notification** confirming the task removal/cancellation and the exact number of credits returned.
