const fs = require('fs');
const path = require('path');

let doc = fs.readFileSync('docs/api_documentation.md', 'utf8');

// Section additions to be appended to appropriate modules or as new modules

const newEndpointsDoc = `
---

## Module 14: Geo-Services, Forward & Reverse Geocoding

### 14.1 Geocode Address & Spatial Distance Analysis
* **Endpoint:** \`GET /api/v1/geo\`
* **Access Level:** Public / Authenticated
* **Headers:** \`Content-Type: application/json\`
* **Query Parameters:**
  * \`address\` (optional, string): Human-readable street address or landmark in Nigeria.
  * \`lat\` (optional, number): Latitude coordinate for reverse geocoding.
  * \`lng\` (optional, number): Longitude coordinate for reverse geocoding.
  * \`compareLat\` (optional, number): User device latitude for real-time proximity calculation.
  * \`compareLng\` (optional, number): User device longitude for real-time proximity calculation.

#### Example Request
\`\`\`http
GET /api/v1/geo?address=Plot+14+Idejo+Street+Victoria+Island+Lagos&compareLat=6.4281&compareLng=3.4219 HTTP/1.1
\`\`\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "latitude": 6.428512,
    "longitude": 3.422105,
    "displayName": "14 Idejo St, Victoria Island, Lagos 106104, Lagos State, Nigeria",
    "distanceFromUserKm": 0.05
  }
}
\`\`\`

#### Error Response (404 Not Found)
\`\`\`json
{
  "success": false,
  "error": {
    "message": "Address could not be located"
  }
}
\`\`\`

---

## Module 15: External Partner Integration & High-Frequency Telemetry

### 15.1 System Health & Connectivity Probe
* **Endpoint:** \`GET /api/v1/external/health\`
* **Access Level:** Partner API Key (\`x-api-key\`, \`x-client-id\`)
* **Headers:**
  * \`x-api-key: <partner_secret_key>\`
  * \`x-client-id: <partner_slug>\`

#### Success Response (200 OK)
\`\`\`json
{
  "status": "ok",
  "service": "oversite-external-api",
  "version": "v1",
  "timestamp": "2026-11-05T12:00:00.000Z"
}
\`\`\`

---

### 15.2 Dispatch External Transactional Notifications
* **Endpoint:** \`POST /api/v1/external/notifications\`
* **Access Level:** Partner API Key
* **Headers:**
  * \`x-api-key: <partner_secret_key>\`
  * \`x-client-id: <partner_slug>\`
  * \`Content-Type: application/json\`

#### Request Body
\`\`\`json
{
  "toAddress": "stakeholder@corporaterealty.ng",
  "subject": "Oversite Mission Completed - Milestone 2 Approved",
  "htmlBody": "<p>Your project inspection audit has been completed and verified by Mission Control.</p>"
}
\`\`\`

#### Success Response (202 Accepted)
\`\`\`json
{
  "queued": true
}
\`\`\`

---

### 15.3 Publish Real-time WebSocket Event Bridge
* **Endpoint:** \`POST /api/v1/external/realtime/publish\`
* **Access Level:** Partner API Key / System Internal
* **Headers:**
  * \`x-api-key: <partner_secret_key>\`
  * \`x-client-id: <partner_slug>\`
  * \`Content-Type: application/json\`

#### Request Body
\`\`\`json
{
  "channel": "task:8c43714b-2d7c-47a8-b631-0cf871dfa824",
  "event": "agent:location",
  "payload": {
    "taskId": "8c43714b-2d7c-47a8-b631-0cf871dfa824",
    "agentId": "23a8820c-032a-4122-86ee-77e8a939e083",
    "latitude": 6.4474,
    "longitude": 3.4723,
    "speed": 22.4,
    "heading": 85.0
  }
}
\`\`\`

#### Success Response (202 Accepted)
\`\`\`json
{
  "published": true
}
\`\`\`

---

## Additional Core Operational & Field Logistics Endpoints

### A.1 Real-Time Mission Telemetry Stream
* **Endpoint:** \`POST /api/v1/tasks/:id/location\`
* **Access Level:** \`AGENT\` (Assigned Operative), \`ADMIN\`, \`SUPER_ADMIN\`
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`

#### Request Body
\`\`\`json
{
  "latitude": 6.447382,
  "longitude": 3.472314,
  "accuracy": 4.5,
  "heading": 110.2,
  "speed": 18.2
}
\`\`\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "latitude": 6.447382,
    "longitude": 3.472314,
    "accuracy": 4.5,
    "heading": 110.2,
    "speed": 18.2,
    "timestamp": "2026-11-05T12:05:00.000Z"
  },
  "message": "Telemetry updated successfully."
}
\`\`\`

---

### A.2 Operative Self-Accept Mission Claim
* **Endpoint:** \`POST /api/v1/tasks/:id/accept\`
* **Access Level:** \`AGENT\`, \`ADMIN\`, \`SUPER_ADMIN\`
* **Headers:** \`Authorization: Bearer <token>\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "taskId": "8c43714b-2d7c-47a8-b631-0cf871dfa824",
    "agentId": "23a8820c-032a-4122-86ee-77e8a939e083",
    "status": "AGENT_EN_ROUTE",
    "updatedAt": "2026-11-05T12:06:00.000Z"
  },
  "message": "Mission accepted. Status set to AGENT_EN_ROUTE."
}
\`\`\`

---

### A.3 Operative Dispatch Response (Accept or Decline)
* **Endpoint:** \`POST /api/v1/tasks/:id/respond\`
* **Access Level:** \`AGENT\`, \`ADMIN\`
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`

#### Request Body (Accept)
\`\`\`json
{
  "action": "ACCEPT"
}
\`\`\`

#### Request Body (Reject / Decline)
\`\`\`json
{
  "action": "REJECT",
  "reason": "Outside scheduled patrol corridor"
}
\`\`\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "taskId": "8c43714b-2d7c-47a8-b631-0cf871dfa824",
    "action": "ACCEPT",
    "newStatus": "AGENT_EN_ROUTE"
  },
  "message": "Mission accepted."
}
\`\`\`

---

### A.4 Client Mission Flagging & Arbitration Request
* **Endpoint:** \`POST /api/v1/tasks/:id/flag\`
* **Access Level:** \`USER\` (Task Owner), \`ADMIN\`, \`SUPER_ADMIN\`
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`

#### Request Body
\`\`\`json
{
  "category": "OPERATIVE_DELAY",
  "reason": "Field operative has not arrived within the agreed delivery window and is unresponsive."
}
\`\`\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "taskId": "8c43714b-2d7c-47a8-b631-0cf871dfa824",
    "status": "DISPUTED",
    "flaggedAt": "2026-11-05T12:10:00.000Z",
    "reason": "Field operative has not arrived within the agreed delivery window and is unresponsive."
  },
  "message": "Mission successfully flagged. Secured payment is paused pending administrative arbitration."
}
\`\`\`

---

### A.5 Instant Algorithmic Task Quote Calculation
* **Endpoint:** \`POST /api/v1/tasks/quote\`
* **Access Level:** Authenticated
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`

#### Request Body
\`\`\`json
{
  "moduleType": "PROPERTY_OVERSITE",
  "urgency": "SAME_DAY",
  "landSizeSqm": 1200,
  "locationLat": 6.4474,
  "locationLng": 3.4723
}
\`\`\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "basePriceNgn": 25000,
    "urgencySurchargeNgn": 10000,
    "sizeAdjustmentNgn": 5000,
    "totalPriceNgn": 40000,
    "estimatedTurnaroundHours": 24,
    "pricingTier": "STANDARD_COMMERCIAL"
  }
}
\`\`\`

---

### A.6 Fetch Confidential Due Diligence Dossier
* **Endpoint:** \`GET /api/v1/diligence/:id/dossier\`
* **Access Level:** \`USER\` (Commissioning Client), \`ADMIN\`, \`SUPER_ADMIN\`
* **Headers:** \`Authorization: Bearer <token>\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "id": "dos-817294",
    "taskId": "8c43714b-2d7c-47a8-b631-0cf871dfa824",
    "riskRating": "LOW",
    "findings": {
      "cacStatus": "Active entity RC-1849204",
      "landRegistryVerified": true,
      "litigationClear": true,
      "directorNinVerified": true
    },
    "dossierUrl": "https://oversite-vault.s3.amazonaws.com/dossiers/dos-817294-confidential.pdf",
    "confidentialityNotice": "This document is privileged and strictly confidential. Unauthorized dissemination is prohibited."
  }
}
\`\`\`

---

### A.7 Client Active Subscription Status
* **Endpoint:** \`GET /api/v1/subscriptions/current\`
* **Access Level:** Authenticated
* **Headers:** \`Authorization: Bearer <token>\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "planId": "plan-starter",
    "name": "Starter Oversight",
    "tier": "STARTER",
    "priceNgn": 5000,
    "billingCycle": "monthly",
    "status": "ACTIVE",
    "features": [
      "Access to all 7 service oversite modules",
      "Standard dispatch, 24-48 hours",
      "Message your agent directly"
    ],
    "startDate": "2026-10-01T00:00:00.000Z",
    "renewalDate": "2026-12-01T00:00:00.000Z"
  },
  "message": "Current subscription retrieved"
}
\`\`\`

---

### A.8 Upgrade or Modify Subscription Plan
* **Endpoint:** \`POST /api/v1/subscriptions/upgrade\`
* **Access Level:** Authenticated
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`

#### Request Body
\`\`\`json
{
  "tier": "PRO"
}
\`\`\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "planId": "plan-pro",
    "tier": "PRO",
    "status": "ACTIVE",
    "priceNgn": 15000,
    "currency": "NGN",
    "effectiveDate": "2026-11-05T12:15:00.000Z",
    "renewalDate": "2026-12-05T12:15:00.000Z"
  },
  "message": "Successfully upgraded to PRO plan!"
}
\`\`\`

---

### A.9 Admin Overview Metrics & Live Activity Stream
* **Endpoint:** \`GET /api/v1/admin/analytics/overview\`
* **Access Level:** \`ADMIN\`, \`SUPER_ADMIN\`
* **Headers:** \`Authorization: Bearer <token>\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "stats": {
      "totalGmvNgn": 48500000,
      "activeTasksCount": 142,
      "verifiedAgentsCount": 318,
      "activeAgentsOnline": 87,
      "pendingAuditReportsCount": 11,
      "totalUsersCount": 1420
    },
    "moduleDistribution": [
      { "module": "PROPERTY_OVERSITE", "count": 64, "label": "Property Oversite" },
      { "module": "PROJECT_WATCH", "count": 32, "label": "Project Watch" },
      { "module": "DUE_DILIGENCE", "count": 24, "label": "Due Diligence" },
      { "module": "LEGAL_ADVISORY", "count": 12, "label": "Legal Advisory" },
      { "module": "QUICK_ERRANDS", "count": 10, "label": "Quick Errands" }
    ],
    "recentActivity": [
      {
        "id": "act-1",
        "action": "MISSION_DISPATCHED",
        "title": "Operative en route to Lekki Phase 1",
        "timestamp": "2026-11-05T12:00:00.000Z"
      }
    ]
  }
}
\`\`\`

---

### A.10 Mission Control Manual Operative Assignment
* **Endpoint:** \`POST /api/v1/admin/tasks/:id/assign\` (also aliased at \`POST /api/v1/tasks/:id/assign\`)
* **Access Level:** \`ADMIN\`, \`SUPER_ADMIN\`
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`

#### Request Body
\`\`\`json
{
  "agentId": "23a8820c-032a-4122-86ee-77e8a939e083"
}
\`\`\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "taskId": "8c43714b-2d7c-47a8-b631-0cf871dfa824",
    "agentId": "23a8820c-032a-4122-86ee-77e8a939e083",
    "status": "MATCHED",
    "message": "Task assigned to operative successfully."
  }
}
\`\`\`

---

### A.11 Field Operatives Directory
* **Endpoint:** \`GET /api/v1/agents\`
* **Access Level:** Authenticated
* **Headers:** \`Authorization: Bearer <token>\`
* **Query Parameters:**
  * \`state\` (optional, string): Filter by geographical state (e.g., \`Lagos\`).
  * \`tier\` (optional, string): Filter by operative tier (\`GENERAL\`, \`TECHNICAL_SUPERVISOR\`, \`LEGAL_COUNSEL\`).
  * \`available\` (optional, boolean): Filter by operative online availability.

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": [
    {
      "id": "23a8820c-032a-4122-86ee-77e8a939e083",
      "userId": "23a8820c-032a-4122-86ee-77e8a939e083",
      "name": "Babatunde Adeleke",
      "tier": "TECHNICAL_SUPERVISOR",
      "rating": "4.92",
      "totalTasks": 87,
      "isAvailable": true,
      "state": "Lagos",
      "serviceRadiusKm": "15.00"
    }
  ]
}
\`\`\`

---

### A.12 Operative Detailed Profile
* **Endpoint:** \`GET /api/v1/agents/:id\`
* **Access Level:** Authenticated
* **Headers:** \`Authorization: Bearer <token>\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "id": "23a8820c-032a-4122-86ee-77e8a939e083",
    "name": "Babatunde Adeleke",
    "email": "babatunde@oversite.ng",
    "phone": "08023456789",
    "tier": "TECHNICAL_SUPERVISOR",
    "rating": "4.92",
    "totalTasks": 87,
    "isAvailable": true,
    "kycStatus": "VERIFIED"
  }
}
\`\`\`

---

### A.13 Update Operative Profile & Service Area
* **Endpoint:** \`PATCH /api/v1/agents/:id\`
* **Access Level:** \`AGENT\` (Self), \`ADMIN\`, \`SUPER_ADMIN\`
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`

#### Request Body
\`\`\`json
{
  "serviceAreaLat": "6.4474",
  "serviceAreaLng": "3.4723",
  "serviceRadiusKm": "20.00"
}
\`\`\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "id": "23a8820c-032a-4122-86ee-77e8a939e083",
    "serviceRadiusKm": "20.00",
    "updatedAt": "2026-11-05T12:20:00.000Z"
  },
  "message": "Operative profile updated."
}
\`\`\`

---

### A.14 Toggle Operative Availability Status
* **Endpoint:** \`PATCH /api/v1/agents/:id/availability\`
* **Access Level:** \`AGENT\` (Self), \`ADMIN\`, \`SUPER_ADMIN\`
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`

#### Request Body
\`\`\`json
{
  "isAvailable": true
}
\`\`\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "agentId": "23a8820c-032a-4122-86ee-77e8a939e083",
    "isAvailable": true
  },
  "message": "Operative status set to AVAILABLE."
}
\`\`\`

---

### A.15 Execute Operative Wallet Payout Disbursement
* **Endpoint:** \`POST /api/v1/payments/payout\` (also aliased at \`POST /api/v1/payments/disburse\`)
* **Access Level:** \`ADMIN\`, \`SUPER_ADMIN\`
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`

#### Request Body
\`\`\`json
{
  "taskId": "8c43714b-2d7c-47a8-b631-0cf871dfa824",
  "agentId": "23a8820c-032a-4122-86ee-77e8a939e083",
  "amountNgn": 35000
}
\`\`\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "taskId": "8c43714b-2d7c-47a8-b631-0cf871dfa824",
    "releasedAmount": 35000,
    "status": "RELEASED"
  },
  "message": "Payment successfully disbursed to agent wallet."
}
\`\`\`

---

### A.16 Get Specific User Details (Admin / Self)
* **Endpoint:** \`GET /api/v1/users/:id\`
* **Access Level:** Authenticated User (Self) or \`ADMIN\` / \`SUPER_ADMIN\`
* **Headers:** \`Authorization: Bearer <token>\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "id": "61a3e911-1a96-46ce-989f-c4c212de4db7",
    "email": "user@example.com",
    "name": "Tunde C.",
    "phone": "08012345678",
    "role": "USER",
    "kycStatus": "VERIFIED",
    "isActive": true
  }
}
\`\`\`

---

### A.17 Update User Attributes (Admin / Self)
* **Endpoint:** \`PATCH /api/v1/users/:id\`
* **Access Level:** Authenticated User (Self) or \`ADMIN\` / \`SUPER_ADMIN\`
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`

#### Request Body
\`\`\`json
{
  "name": "Tunde Craig",
  "location": "Ikoyi, Lagos",
  "isActive": true
}
\`\`\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "id": "61a3e911-1a96-46ce-989f-c4c212de4db7",
    "email": "user@example.com",
    "name": "Tunde Craig",
    "phone": "08012345678",
    "role": "USER",
    "kycStatus": "VERIFIED",
    "isActive": true,
    "updatedAt": "2026-11-05T12:25:00.000Z"
  },
  "message": "User profile updated successfully."
}
\`\`\`

---

### A.18 Submit KYC Documentation
* **Endpoint:** \`POST /api/v1/auth/kyc\`
* **Access Level:** Authenticated (\`USER\` or \`AGENT\`)
* **Headers:** \`Authorization: Bearer <token>\`, \`Content-Type: application/json\`

#### Request Body
\`\`\`json
{
  "idType": "NIN",
  "idNumber": "12345678901",
  "documentUrl": "https://oversite-vault.s3.amazonaws.com/kyc/doc-123.pdf",
  "selfieUrl": "https://oversite-vault.s3.amazonaws.com/kyc/selfie-123.jpg"
}
\`\`\`

#### Success Response (200 OK)
\`\`\`json
{
  "success": true,
  "data": {
    "status": "SUBMITTED",
    "submittedAt": "2026-11-05T12:30:00.000Z"
  },
  "message": "KYC documentation submitted successfully for compliance review."
}
\`\`\`
`;

// Append to doc
const updatedDoc = doc + '\n' + newEndpointsDoc;
fs.writeFileSync('docs/api_documentation.md', updatedDoc, 'utf8');
fs.writeFileSync('scratch_folder/api_documentation.md', updatedDoc, 'utf8');
console.log('Successfully updated docs/api_documentation.md and scratch_folder/api_documentation.md');

