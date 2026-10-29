# Oversite REST API Reference Manual (v2026)

Welcome to the official, exhaustive API reference manual for the **Oversite Web & Flutter Mobile Platforms**. 

This document provides complete, production-grade specifications for every available API endpoint, including URL paths, HTTP methods, access control requirements, required request headers, path/query parameters, complete JSON request bodies, success response bodies, and error codes.

---

## Table of Contents
1. [Global Architecture & Conventions](#global-architecture--conventions)
2. [Module 1: Authentication & Identity Lifecycle](#module-1-authentication--identity-lifecycle)
3. [Module 2: User Profile, Preferences & Account Settings](#module-2-user-profile-preferences--account-settings)
4. [Module 3: KYC, Identity Verification & Accreditation](#module-3-kyc-identity-verification--accreditation)
5. [Module 4: Service Task Creation & Booking (7 Core Modules)](#module-4-service-task-creation--booking-7-core-modules)
6. [Module 5: Task Lifecycle, Quotations & Milestone Directives](#module-5-task-lifecycle-quotations--milestone-directives)
7. [Module 6: Offline-First Field Reporting & Deliverable Settlement](#module-6-offline-first-field-reporting--deliverable-settlement)
8. [Module 7: Hub-and-Spoke Chat API (Admin-Moderated)](#module-7-hub-and-spoke-chat-api-admin-moderated)
9. [Module 8: Media Vault & S3 Pre-Signed Uploads](#module-8-media-vault--s3-pre-signed-uploads)
10. [Module 9: Payments, Wallets & Banking](#module-9-payments-wallets--banking)
11. [Module 10: Monitored Properties Registry](#module-10-monitored-properties-registry)
12. [Module 11: Legal Counsel Directory & Consultations](#module-11-legal-counsel-directory--consultations)
13. [Module 12: Mission Control / Admin Console](#module-12-mission-control--admin-console)
14. [Module 13: Dashboard Metrics, Activities & Support](#module-13-dashboard-metrics-activities--support)

---

## Global Architecture & Conventions

### 1. Base URLs
* **Local Development:** `http://localhost:3000/api/v1`
* **Staging Environment:** `https://staging-api.oversite.ng/api/v1`
* **Production Environment:** `https://api.oversite.ng/api/v1`

### 2. Standard JSON Response Envelope
All API endpoints return JSON conforming to the standardized `ApiResponse<T>` envelope:

#### Standard Success Response (200 OK / 201 Created)
```json
{
  "success": true,
  "data": { ... },
  "message": "Human-readable operation summary (optional)"
}
```

#### Standard Paginated Success Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Standard Error Response (4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed description of the validation or business logic error"
  }
}
```

### 3. Authentication & Authorization Headers
Protected endpoints require a valid JSON Web Token (JWT) passed in the `Authorization` HTTP header:
```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 4. Platform User Roles
* `USER` — End-clients booking inspections, property oversite, project watch, or diligence tasks.
* `AGENT` — Vetted, accredited operatives in the field executing inspections and submitting reports.
* `ADMIN` — Oversite Mission Control supervisors scrutinizing tasks, issuing quotes, and moderating communication.
* `SUPER_ADMIN` — System executives with complete administrative governance.

### 5. Platform Trust & Financial Guarantee
Oversite directly employs and vets her operatives. Client funds for booked services are protected directly by the platform under the **Oversite Satisfaction Guarantee** and held securely until deliverables are approved by the client.

---

## Module 1: Authentication & Identity Lifecycle

### 1.1 Register New User or Agent
* **Endpoint:** `POST /api/v1/auth/register` (also aliased at `/api/v1/auth/signup`)
* **Access Level:** Public
* **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "Tunde C.",
  "phone": "08012345678",
  "role": "USER"
}
```
*Note: Set `"role": "AGENT"` to register as an accredited field operative.*

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "61a3e911-1a96-46ce-989f-c4c212de4db7",
      "email": "user@example.com",
      "name": "Tunde C.",
      "fullName": "Tunde C.",
      "phone": "08012345678",
      "role": "USER",
      "kycStatus": "PENDING",
      "ninVerificationStatus": "pending",
      "createdAt": "2026-10-27T12:00:00.000Z"
    }
  },
  "message": "User registered successfully"
}
```

#### Error Response (409 Conflict)
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "An account with this email address already exists"
  }
}
```

---

### 1.2 User & Agent Login
* **Endpoint:** `POST /api/v1/auth/login`
* **Access Level:** Public
* **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "fcmToken": "optional_firebase_push_device_token"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "61a3e911-1a96-46ce-989f-c4c212de4db7",
      "email": "user@example.com",
      "name": "Tunde C.",
      "fullName": "Tunde C.",
      "phone": "08012345678",
      "role": "USER",
      "kycStatus": "PENDING",
      "ninVerificationStatus": "pending",
      "isActive": true
    }
  },
  "message": "Login successful"
}
```

#### Error Response (401 Unauthorized)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  }
}
```

---

### 1.3 User Logout
* **Endpoint:** `POST /api/v1/auth/logout`
* **Access Level:** Public / Authenticated
* **Headers:** Optional Bearer token

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "loggedOut": true
  },
  "message": "Logged out successfully"
}
```

---

### 1.4 Forgot Password (Request OTP)
* **Endpoint:** `POST /api/v1/auth/forgot-password`
* **Access Level:** Public
* **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "email": "user@example.com"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "expiresIn": 600,
    "previewCode": "489201"
  },
  "message": "Password reset OTP has been sent to your email"
}
```

---

### 1.5 Reset Password (Verify OTP & Update)
* **Endpoint:** `POST /api/v1/auth/reset-password`
* **Access Level:** Public
* **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "email": "user@example.com",
  "code": "489201",
  "newPassword": "newSecurePassword2026!"
}
```
*Note: In development and automated testing environments, `code: "000000"` is accepted as a valid bypass.*

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "reset": true
  },
  "message": "Password has been reset successfully. You can now log in."
}
```

---

### 1.6 Change Password (Authenticated User)
* **Endpoint:** `POST /api/v1/auth/change-password` (also supported via `PUT /api/v1/users/me/password`)
* **Access Level:** Authenticated (`USER`, `AGENT`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "currentPassword": "securepassword123",
  "newPassword": "brandNewPassword2026!"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Password updated successfully"
  }
}
```

---

### 1.7 Verify Generic OTP Code
* **Endpoint:** `POST /api/v1/auth/otp/verify`
* **Access Level:** Public
* **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "identifier": "08012345678",
  "code": "123456"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "verified": true
  }
}
```

---

## Module 2: User Profile, Preferences & Account Settings

### 2.1 Get Authenticated User Profile
* **Endpoint:** `GET /api/v1/users/me` (also aliased at `GET /api/v1/profile`)
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "61a3e911-1a96-46ce-989f-c4c212de4db7",
    "email": "user@example.com",
    "name": "Tunde C.",
    "fullName": "Tunde C.",
    "phone": "08012345678",
    "title": "Architect",
    "address": "14 Admiralty Way, Lekki Phase 1",
    "location": "Lekki, Lagos",
    "occupation": "Real Estate Developer",
    "state": "Lagos",
    "country": "Nigeria",
    "residence": "Lekki, Lagos",
    "avatarUrl": "https://oversite-media.s3.amazonaws.com/avatars/user-avatar.jpg",
    "role": "USER",
    "kycStatus": "VERIFIED",
    "ninVerificationStatus": "verified",
    "nbaVerificationStatus": "pending",
    "isActive": true,
    "isDiasporaUser": false,
    "preferredCurrency": "NGN",
    "joinedDate": "2026-10-27T12:00:00.000Z",
    "createdAt": "2026-10-27T12:00:00.000Z",
    "updatedAt": "2026-10-27T14:30:00.000Z",
    "agentProfile": null
  },
  "message": "Profile retrieved successfully"
}
```

---

### 2.2 Update Profile Information
* **Endpoint:** `PATCH /api/v1/users/me` (also aliased at `PATCH /api/v1/profile`)
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "name": "Tunde Chinedu",
  "phone": "08012345678",
  "title": "Managing Director",
  "address": "Plot 12, Victoria Island, Lagos",
  "location": "Victoria Island, Lagos",
  "occupation": "Civil Engineer",
  "state": "Lagos",
  "country": "Nigeria",
  "residence": "Victoria Island, Lagos",
  "avatarUrl": "https://oversite-media.s3.amazonaws.com/avatars/user-avatar.jpg",
  "isAvailable": true
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "61a3e911-1a96-46ce-989f-c4c212de4db7",
    "email": "user@example.com",
    "name": "Tunde Chinedu",
    "fullName": "Tunde Chinedu",
    "phone": "08012345678",
    "title": "Managing Director",
    "address": "Plot 12, Victoria Island, Lagos",
    "location": "Victoria Island, Lagos",
    "occupation": "Civil Engineer",
    "state": "Lagos",
    "country": "Nigeria",
    "residence": "Victoria Island, Lagos",
    "avatarUrl": "https://oversite-media.s3.amazonaws.com/avatars/user-avatar.jpg",
    "updatedAt": "2026-10-29T10:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

---

### 2.3 Deactivate Account
* **Endpoint:** `DELETE /api/v1/users/me`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Account deactivated successfully"
  },
  "message": "Account deactivated successfully"
}
```

---

### 2.4 Toggle Two-Factor Authentication (2FA)
* **Endpoint:** `POST /api/v1/users/me/2fa`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "enable": true
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "twoFactorEnabled": true,
    "message": "Two-factor authentication has been enabled."
  }
}
```

---

### 2.5 Get User Preferences & Settings
* **Endpoint:** `GET /api/v1/users/me/settings`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "notifications": {
      "push": true,
      "email": true,
      "sms": false
    },
    "language": "en",
    "theme": "system",
    "twoFactorEnabled": false
  },
  "message": "User settings retrieved successfully"
}
```

---

### 2.6 Update User Preferences & Settings
* **Endpoint:** `PATCH /api/v1/users/me/settings`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "notifications": {
    "push": true,
    "email": false,
    "sms": true
  },
  "language": "en",
  "theme": "dark"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "notifications": {
      "push": true,
      "email": false,
      "sms": true
    },
    "language": "en",
    "theme": "dark",
    "twoFactorEnabled": false
  },
  "message": "User settings updated successfully"
}
```

---

### 2.7 Pre-sign User Avatar Image Upload
* **Endpoint:** `POST /api/v1/user/avatar/presign`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "contentType": "image/jpeg",
  "fileExtension": "jpg"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://oversite-media.s3.amazonaws.com/avatars/user-id-173000000.jpg?X-Amz-Algorithm=...",
    "objectKey": "avatars/user-id-173000000.jpg",
    "publicUrl": "https://oversite-media.s3.amazonaws.com/avatars/user-id-173000000.jpg"
  }
}
```

---

## Module 3: KYC, Identity Verification & Accreditation

### 3.1 Get 6-Step Operative KYC Status Pipeline
* **Endpoint:** `GET /api/v1/kyc/status`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "overallStatus": "SUBMITTED",
    "isVerified": false,
    "steps": {
      "phone": { "status": "VERIFIED", "completed": true, "value": "08012345678" },
      "nin": { "status": "VERIFIED", "completed": true, "ninId": "12345678901" },
      "nba": { "status": "PENDING", "completed": false, "nbaNumber": "NBA/2026/041" },
      "address": { "status": "VERIFIED", "completed": true, "address": "12 Admiralty Way" },
      "documents": { "status": "SUBMITTED", "completed": true, "documentCount": 2 },
      "consent": { "status": "VERIFIED", "completed": true, "signedAt": "2026-10-27T10:00:00Z" }
    }
  },
  "message": "KYC status retrieved successfully"
}
```

---

### 3.2 Verify National Identity Number (NIN)
* **Endpoint:** `POST /api/v1/kyc/verify/nin`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "ninNumber": "12345678901"
}
```
*Note: An 11-digit numerical NIN is required. Numbers starting with `99` intentionally fail in test mode.*

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "ninVerified": true,
    "kycStatus": "VERIFIED",
    "ninVerificationStatus": "verified",
    "verifiedAt": "2026-10-27T12:00:00.000Z"
  },
  "message": "NIN verified successfully"
}
```

---

### 3.3 Verify Nigerian Bar Association (NBA) Enrollment
* **Endpoint:** `POST /api/v1/kyc/verify/nba`
* **Access Level:** Authenticated (`AGENT`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "nbaNumber": "NBA/LAG/2026/0491"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "nbaVerified": true,
    "nbaNumber": "NBA/LAG/2026/0491",
    "nbaVerificationStatus": "verified",
    "tier": "LEGAL_COUNSEL"
  },
  "message": "NBA accreditation verified successfully"
}
```

---

### 3.4 Upload Accreditation Document Evidence
* **Endpoint:** `POST /api/v1/kyc/documents`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "documentType": "BAR_CERTIFICATE",
  "documentUrl": "https://oversite-media.s3.amazonaws.com/accreditation/cert.pdf",
  "notes": "Original call to the Nigerian bar certificate"
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "documentId": "doc-uuid-99",
    "documentType": "BAR_CERTIFICATE",
    "status": "UNDER_REVIEW"
  },
  "message": "Accreditation document uploaded for Mission Control verification"
}
```

---

### 3.5 Submit Background Check Consent
* **Endpoint:** `POST /api/v1/kyc/consent`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "consent": true,
  "signature": "Tunde Chinedu",
  "ipAddress": "197.210.45.12"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "consentRecorded": true,
    "timestamp": "2026-10-27T15:00:00.000Z"
  },
  "message": "Consent agreement recorded successfully"
}
```

---

## Module 4: Service Task Creation & Booking (7 Core Modules)

### 4.1 General Task Booking
* **Endpoint:** `POST /api/v1/tasks`
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "moduleType": "QUICK_ERRANDS",
  "title": "CAC certified copy retrieval",
  "description": "Obtain certified true copy from CAC Head Office",
  "locationAddress": "Plot 420 Tigris Crescent, Maitama, Abuja",
  "locationLat": 9.0820,
  "locationLng": 7.4913,
  "priceNgn": 25000.00,
  "propertyId": "optional-property-uuid"
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "title": "CAC certified copy retrieval",
    "moduleType": "QUICK_ERRANDS",
    "status": "PENDING",
    "quoteStatus": "PENDING",
    "priceNgn": 25000.00,
    "createdAt": "2026-10-27T16:00:00.000Z"
  },
  "message": "Task created successfully and submitted to Mission Control for operative assignment"
}
```

---

### 4.2 Book Property Oversite (Perimeter & Beacon Inspection)
* **Endpoint:** `POST /api/v1/tasks/property-oversite`
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "title": "Perimeter Beacon & Boundary Inspection",
  "locationAddress": "Plot 12, Block 4, Victoria Island, Lagos",
  "perimeterScale": "standard",
  "inspectionType": "ROUTINE",
  "isExpress": false,
  "surveyPlanUrl": "https://oversite-media.s3.amazonaws.com/plans/survey-plot12.pdf",
  "specialInstructions": "Verify boundary beacon markers 401A through 401D."
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "task-uuid-oversite-001",
    "title": "Perimeter Beacon & Boundary Inspection",
    "moduleType": "PROPERTY_OVERSITE",
    "status": "UNDER_REVIEW",
    "quoteStatus": "PENDING",
    "estimatedPriceNgn": 35000.00,
    "slaHours": 48
  },
  "message": "Property Oversite inspection booking submitted. Mission Control is reviewing pricing."
}
```

---

### 4.3 Book Quick Physical Errand
* **Endpoint:** `POST /api/v1/tasks/quick-errands`
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "categoryId": "LEGAL_FILING",
  "title": "High Court certified true copy",
  "location": "Lagos State High Court, Tafawa Balewa Square",
  "timeWindow": "Today before 2:00 PM",
  "instructions": "Collect certified copy of judgment suit number LD/2026/08."
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "task-uuid-errand-002",
    "moduleType": "QUICK_ERRANDS",
    "status": "PENDING",
    "estimatedPriceNgn": 18000.00
  }
}
```

---

### 4.4 Book Project Watch (Construction Oversight)
* **Endpoint:** `POST /api/v1/tasks/project-watch`
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "title": "Four-Bedroom Duplex Decking Concrete Pouring",
  "locationAddress": "Guzape District, Abuja",
  "contractorName": "Apex Build Ltd",
  "milestoneDescription": "Inspection of 1st floor slab reinforcement rebar and concrete batch slump test.",
  "targetDate": "2026-11-15T09:00:00Z"
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "task-uuid-project-003",
    "moduleType": "PROJECT_WATCH",
    "status": "UNDER_REVIEW",
    "quoteStatus": "PENDING"
  }
}
```

---

### 4.5 Book Due Diligence Investigation
* **Endpoint:** `POST /api/v1/tasks/due-diligence` (also aliased at `POST /api/v1/diligence/request`)
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "tier": "Tier 3 - Deep Investigation",
  "subjectName": "Primewater Holdings Ltd",
  "subjectType": "BUSINESS",
  "cacNumber": "RC-998811",
  "landRegistryNumber": "Page 40, Volume 102, Lagos Registry",
  "anonymizeRequest": true
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "taskId": "task-uuid-dd-004",
    "dossierId": "dossier-uuid-77",
    "moduleType": "DUE_DILIGENCE",
    "status": "UNDER_REVIEW",
    "confidentialWatermark": "CONFIDENTIAL-OVS-881"
  },
  "message": "Due diligence investigation commissioned."
}
```

---

### 4.6 Book Legal Advisory
* **Endpoint:** `POST /api/v1/tasks/legal-advisory`
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "legalDomain": "REAL_ESTATE",
  "serviceType": "DEED_OF_ASSIGNMENT_REVIEW",
  "caseSummary": "Review deed of assignment and Governor's consent documents for 2 plots in Epe.",
  "documentUrls": [
    "https://oversite-media.s3.amazonaws.com/deeds/deed-draft.pdf"
  ]
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "task-uuid-legal-005",
    "moduleType": "LEGAL_ADVISORY",
    "status": "UNDER_REVIEW"
  }
}
```

---

### 4.7 Book Law Enforcement Proxy Dispatch
* **Endpoint:** `POST /api/v1/tasks/enforcement` (also aliased at `POST /api/v1/enforcement/dispatch`)
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "agency": "LSSOES",
  "incidentType": "Illegal Encroachment & Perimeter Wall Demolition",
  "locationAddress": "KM 42 Lekki-Epe Expressway, Lagos",
  "urgency": "EMERGENCY",
  "notes": "Trespassers observed attempting to mount perimeter structure."
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "task-uuid-law-006",
    "moduleType": "LAW_ENFORCEMENT",
    "status": "MATCHED",
    "dispatchPriority": "CRITICAL",
    "slaHours": 2
  },
  "message": "Emergency liaison protocol activated. Liaison operative alerted."
}
```

---

### 4.8 Book Vulnerability Test
* **Endpoint:** `POST /api/v1/tasks/vulnerability-test`
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "title": "Physical Security & Access Point Vulnerability Assessment",
  "locationAddress": "Warehouse 4, Ikeja Industrial Estate, Lagos",
  "facilityType": "COMMERCIAL_WAREHOUSE",
  "focusAreas": ["Gate Access Control", "Perimeter Lighting", "CCTV Blindspots"]
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "task-uuid-vuln-007",
    "moduleType": "VULNERABILITY_TEST",
    "status": "UNDER_REVIEW"
  }
}
```

---

## Module 5: Task Lifecycle, Quotations & Milestone Directives

### 5.1 Query Tasks Feed
* **Endpoint:** `GET /api/v1/tasks`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:**
  * `status` (optional): Filter by task status (`PENDING`, `MATCHED`, `IN_PROGRESS`, `REPORT_SUBMITTED`, `COMPLETED`, `open`)
  * `module` (optional): Filter by module type (`PROPERTY_OVERSITE`, `PROJECT_WATCH`, etc.)
  * `page` (optional): Default `1`
  * `limit` (optional): Default `20`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
      "userId": "61a3e911-1a96-46ce-989f-c4c212de4db7",
      "agentId": "8b51d423-4e31-482a-9cb2-93881df3e019",
      "moduleType": "PROPERTY_OVERSITE",
      "title": "Perimeter Beacon Inspection",
      "description": "Verify beacons 401A-401D",
      "status": "IN_PROGRESS",
      "quoteStatus": "ACCEPTED",
      "locationAddress": "Plot 12, Victoria Island, Lagos",
      "locationLat": 6.4281,
      "locationLng": 3.4219,
      "priceNgn": 35000.00,
      "priority": "normal",
      "createdAt": "2026-10-27T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 5.2 Get Single Task Detail
* **Endpoint:** `GET /api/v1/tasks/:id`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "userId": "61a3e911-1a96-46ce-989f-c4c212de4db7",
    "agentId": "8b51d423-4e31-482a-9cb2-93881df3e019",
    "moduleType": "PROPERTY_OVERSITE",
    "title": "Perimeter Beacon Inspection",
    "status": "IN_PROGRESS",
    "quoteStatus": "ACCEPTED",
    "locationAddress": "Plot 12, Victoria Island, Lagos",
    "priceNgn": 35000.00,
    "createdAt": "2026-10-27T10:00:00.000Z"
  }
}
```

---

### 5.3 Accept Quoted Price
* **Endpoint:** `POST /api/v1/tasks/:id/quote/accept` (also aliased at `POST /api/v1/tasks/:id/accept-quote`)
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "quoteStatus": "ACCEPTED",
    "priceNgn": 35000.00,
    "message": "Quote accepted under Oversite Satisfaction Guarantee. You may now proceed with secured payment.",
    "checkoutReady": true
  }
}
```

---

### 5.4 Counter-Offer Quoted Price
* **Endpoint:** `POST /api/v1/tasks/:id/quote/counter`
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "counterPriceNgn": 28000.00,
  "counterNote": "Site is within 5 minutes of your Lekki operations branch."
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "quoteStatus": "COUNTER_OFFERED",
    "counterPriceNgn": 28000.00,
    "message": "Counter-offer submitted to Mission Control for appraisal review."
  }
}
```

---

### 5.5 Decline Quoted Price
* **Endpoint:** `POST /api/v1/tasks/:id/quote/decline`
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "reason": "Price exceeds allocated Q4 budget"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "quoteStatus": "DECLINED",
    "status": "CANCELLED"
  },
  "message": "Quote declined and task closed."
}
```

---

### 5.6 Geofenced Site Arrival Check-In (Agent)
* **Endpoint:** `POST /api/v1/tasks/:id/arrive`
* **Access Level:** Authenticated (`AGENT`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "latitude": 6.4281,
  "longitude": 3.4219,
  "accuracy": 4.5
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "status": "AGENT_ON_SITE",
    "distanceMeters": 42.8,
    "arrivedAt": "2026-10-27T11:30:00.000Z"
  },
  "message": "Geofence verified. Operative arrival confirmed on site."
}
```

---

### 5.7 Self-Claim or Assign Agent to Task
* **Endpoint:** `POST /api/v1/tasks/:id/assign` (also supports `PATCH`)
* **Access Level:** Authenticated (`AGENT`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body (Agent self-claim)
```json
{
  "action": "accept"
}
```

#### Request Body (Admin assigning agent)
```json
{
  "agentId": "8b51d423-4e31-482a-9cb2-93881df3e019"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "agentId": "8b51d423-4e31-482a-9cb2-93881df3e019",
    "status": "MATCHED"
  },
  "message": "Operative assigned successfully"
}
```

---

### 5.8 Fetch Task Milestones
* **Endpoint:** `GET /api/v1/tasks/:id/milestones`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "ms-uuid-1",
      "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
      "title": "Perimeter Beacon Boundary Verification",
      "description": "Inspect and capture geotagged photos of all four corner boundary beacons.",
      "orderIndex": 1,
      "deliverableType": "INSPECTION_CHECKLIST",
      "status": "IN_PROGRESS",
      "completionPct": 50,
      "checklist": [
        { "item": "Beacon 401A intact", "completed": true },
        { "item": "Beacon 401B intact", "completed": true },
        { "item": "Beacon 401C intact", "completed": false },
        { "item": "Beacon 401D intact", "completed": false }
      ]
    }
  ],
  "message": "Milestones retrieved successfully"
}
```

---

## Module 6: Offline-First Field Reporting & Deliverable Settlement

### 6.1 Sync Offline Field Report
* **Endpoint:** `POST /api/v1/tasks/:id/report/sync`
* **Access Level:** Authenticated (`AGENT`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "offlineCapturedAt": "2026-10-27T12:00:00.000Z",
  "summary": "Boundary beacon 401C partially covered by weed growth; perimeter intact.",
  "findings": "No evidence of physical encroachment. Coordinates verified against survey plan.",
  "completionPct": 100,
  "checklist": [
    { "item": "Beacon 401A", "completed": true },
    { "item": "Beacon 401B", "completed": true },
    { "item": "Beacon 401C", "completed": true },
    { "item": "Beacon 401D", "completed": true }
  ],
  "media": [
    {
      "mediaType": "IMAGE",
      "s3ObjectKey": "reports/de9cb8a7/beacon401a.jpg",
      "caption": "Beacon 401A marker photo",
      "latitude": 6.4281,
      "longitude": 3.4219,
      "capturedAt": "2026-10-27T11:45:00.000Z"
    }
  ]
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "reportId": "report-uuid-8899",
    "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "status": "SUBMITTED",
    "watermarkCode": "OVS-REP-A1B2C3D4",
    "mediaUploaded": 1
  },
  "message": "Operative report synced successfully. Mission Control review queued."
}
```

---

### 6.2 Submit Standard Field Report
* **Endpoint:** `POST /api/v1/tasks/:id/reports` (also aliased at `POST /api/v1/reports/submit`)
* **Access Level:** Authenticated (`AGENT`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "summary": "Completed foundation depth verification.",
  "findings": "Dug to 1.5m standard requirement in accordance with structural drawings.",
  "completionPct": 100,
  "mediaUrls": [
    "https://oversite-media.s3.amazonaws.com/reports/foundation.jpg"
  ]
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "reportId": "report-uuid-9911",
    "status": "SUBMITTED"
  },
  "message": "Field report submitted for Mission Control inspection."
}
```

---

### 6.3 Download Compiled Official PDF Report
* **Endpoint:** `GET /api/v1/reports/:id/pdf`
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`

#### Response
* **Content-Type:** `application/pdf`
* **Content-Disposition:** `attachment; filename="Oversite-Report-report-id.pdf"`
* Streams the signed, official, cryptographic PDF report with tamper-proof watermarks and GPS evidence coordinates.

---

### 6.4 Client Final Approval of Deliverables
* **Endpoint:** `POST /api/v1/tasks/:id/approve` (also aliased at `POST /api/v1/tasks/:id/reports/:reportId/approve`)
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "reportId": "report-uuid-8899",
    "taskStatus": "COMPLETED",
    "reportStatus": "APPROVED",
    "disbursementReleased": true,
    "payoutStatus": "RELEASED",
    "message": "Deliverables approved under Oversite Satisfaction Guarantee. Payout released to accredited operative."
  }
}
```

---

### 6.5 Client Dispute / Reject Deliverables
* **Endpoint:** `POST /api/v1/tasks/:id/dispute` (also aliased at `POST /api/v1/tasks/:id/reports/:reportId/reject`)
* **Access Level:** Authenticated (`USER`, `ADMIN`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "reason": "Beacon 401C marker is blurry in the photograph. Need clearer zoomed photo showing coordinates."
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "status": "DISPUTED",
    "reportStatus": "REJECTED",
    "fundsProtected": true,
    "message": "Deliverable rejected. Mission Control has been alerted to review operative execution."
  }
}
```

---

## Module 7: Hub-and-Spoke Chat API (Admin-Moderated)

All communications between Clients and Field Operatives are intercepted and routed through **Oversite Mission Control** to scrutinize and refine messaging for operative clarity and customer trust.

### 7.1 List Conversation Threads
* **Endpoint:** `GET /api/v1/chats` (also aliased at `GET /api/v1/chat`)
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
      "taskTitle": "Perimeter Beacon Inspection",
      "moduleType": "PROPERTY_OVERSITE",
      "lastMessage": "Operative is on site and has begun beacon verification.",
      "lastMessageAt": "2026-10-27T11:35:00.000Z",
      "unreadCount": 0
    }
  ]
}
```

---

### 7.2 Fetch Task Chat Message History
* **Endpoint:** `GET /api/v1/chat/:taskId/messages`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-uuid-001",
      "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
      "senderId": "61a3e911-1a96-46ce-989f-c4c212de4db7",
      "senderRole": "USER",
      "content": "Can you check the north boundary line for fresh surveyor pegs?",
      "moderationStatus": "APPROVED_AS_IS",
      "createdAt": "2026-10-27T11:15:00.000Z"
    },
    {
      "id": "msg-uuid-002",
      "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
      "senderId": "admin-uuid",
      "senderRole": "ADMIN",
      "content": "Mission Control has dispatched directive to operative on site.",
      "moderationStatus": "APPROVED_AS_IS",
      "createdAt": "2026-10-27T11:20:00.000Z"
    }
  ]
}
```

---

### 7.3 Send Chat Message into Moderated Queue
* **Endpoint:** `POST /api/v1/chat/:taskId/messages` (also aliased at `POST /api/v1/chat/:taskId/message`)
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "content": "Please verify if the contractor has left the site generator running.",
  "fileUrl": "optional_s3_media_key"
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "messageId": "msg-uuid-003",
    "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "moderationStatus": "PENDING_REVIEW",
    "createdAt": "2026-10-27T12:00:00.000Z"
  },
  "message": "Message sent to Mission Control for dispatch."
}
```

---

## Module 8: Media Vault & S3 Pre-Signed Uploads

### 8.1 Generate S3 Pre-Signed Upload URL
* **Endpoint:** `POST /api/v1/external/media/presign`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "objectKey": "reports/de9cb8a7/site-photo-1.jpg",
  "contentType": "image/jpeg"
}
```

#### Success Response (201 Created)
```json
{
  "uploadUrl": "https://oversite-media.s3.amazonaws.com/reports/de9cb8a7/site-photo-1.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&...",
  "objectKey": "reports/de9cb8a7/site-photo-1.jpg"
}
```
*Note: The mobile client uploads the binary image directly to `uploadUrl` via HTTP `PUT` with the corresponding `Content-Type` header.*

---

### 8.2 Query Aggregated Document Vault
* **Endpoint:** `GET /api/v1/vault/documents`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:**
  * `category` (optional): `property`, `documents`, `diligence`
  * `limit` (optional): Default `50`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "rpt-report-uuid-8899",
      "name": "Perimeter Beacon Inspection - Final Report.pdf",
      "category": "property",
      "type": "PDF",
      "fileUrl": "/api/v1/reports/report-uuid-8899/pdf",
      "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
      "taskTitle": "Perimeter Beacon Inspection",
      "createdAt": "2026-10-27T13:00:00.000Z"
    }
  ]
}
```

---

## Module 9: Payments, Wallets & Banking

### 9.1 Initialize Secured Service Payment
* **Endpoint:** `POST /api/v1/payments/initialize`
* **Access Level:** Authenticated (`USER`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
  "amount": 35000.00,
  "gateway": "PAYSTACK"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "reference": "OVS_TXN_1730000000000",
    "transactionReference": "OVS_TXN_1730000000000",
    "authorizationUrl": "https://checkout.paystack.com/3f089a8b11c...",
    "paymentUrl": "https://checkout.paystack.com/3f089a8b11c..."
  },
  "message": "Payment initialized successfully under Oversite Payment Protection"
}
```

---

### 9.2 Payment Gateway Webhook
* **Endpoint:** `POST /api/v1/payments/webhook`
* **Access Level:** Public (Verified via Paystack/Flutterwave HMAC SHA512 Signature)
* **Headers:** `x-paystack-signature: <hmac>`

#### Request Body
```json
{
  "event": "charge.success",
  "data": {
    "reference": "OVS_TXN_1730000000000",
    "amount": 3500000,
    "status": "success",
    "currency": "NGN"
  }
}
```

#### Success Response (200 OK)
```json
{
  "received": true
}
```

---

### 9.3 Get Payment & Billing History
* **Endpoint:** `GET /api/v1/payments/history`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "pay-uuid-001",
      "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
      "taskTitle": "Perimeter Beacon Inspection",
      "amount": 35000.00,
      "amountNgn": 35000.00,
      "status": "CAPTURED",
      "gateway": "PAYSTACK",
      "gatewayRef": "OVS_TXN_1730000000000",
      "createdAt": "2026-10-27T10:30:00.000Z"
    }
  ]
}
```

---

### 9.4 List Saved Tokenized Payment Methods
* **Endpoint:** `GET /api/v1/payments/methods`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "card-uuid-1",
      "brand": "mastercard",
      "cardType": "Debit",
      "last4": "4081",
      "expiryMonth": "08",
      "expiryYear": "28",
      "bank": "Zenith Bank",
      "isDefault": true,
      "createdAt": "2026-10-27T10:00:00.000Z"
    }
  ],
  "message": "Payment methods retrieved successfully"
}
```

---

### 9.5 Save Tokenized Payment Method
* **Endpoint:** `POST /api/v1/payments/methods`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "authorizationCode": "AUTH_8b11c90a12",
  "last4": "4081",
  "brand": "mastercard",
  "cardType": "Debit",
  "expiryMonth": "08",
  "expiryYear": "28",
  "bank": "Zenith Bank",
  "isDefault": true
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "card-uuid-1",
    "last4": "4081",
    "isDefault": true
  },
  "message": "Payment card saved securely"
}
```

---

### 9.6 Delete Saved Payment Method
* **Endpoint:** `DELETE /api/v1/payments/methods/:id`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": { "deleted": true },
  "message": "Payment method removed"
}
```

---

### 9.7 Get Operative Wallet Overview
* **Endpoint:** `GET /api/v1/wallets` (also aliased at `GET /api/v1/agent/wallet`)
* **Access Level:** Authenticated (`AGENT`)
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "walletId": "wallet-uuid-001",
    "balanceNgn": 145000.00,
    "totalEarnedNgn": 420000.00,
    "pendingClearanceNgn": 35000.00,
    "currency": "NGN",
    "bankDetails": {
      "bankName": "Access Bank",
      "bankCode": "044",
      "accountNumber": "0123456789",
      "accountName": "TUNDE CHINEDU"
    }
  },
  "message": "Operative wallet details retrieved"
}
```

---

### 9.8 Request Payout / Withdrawal
* **Endpoint:** `POST /api/v1/wallets/withdraw` (also aliased at `POST /api/v1/agent/wallet/withdraw`)
* **Access Level:** Authenticated (`AGENT`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "amountNgn": 50000.00,
  "bankCode": "044",
  "accountNumber": "0123456789",
  "notes": "Weekly inspection earnings payout"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "transactionId": "payout-uuid-99",
    "amountNgn": 50000.00,
    "status": "PROCESSING",
    "estimatedSettlement": "Same Day (within 2 hours)"
  },
  "message": "Withdrawal request dispatched to payment clearing switch."
}
```

---

### 9.9 List Supported Nigerian Banks
* **Endpoint:** `GET /api/v1/banks`
* **Access Level:** Public / Authenticated

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    { "name": "Access Bank", "code": "044", "slug": "access-bank" },
    { "name": "Guaranty Trust Bank", "code": "058", "slug": "gtbank" },
    { "name": "United Bank for Africa", "code": "033", "slug": "uba" },
    { "name": "Zenith Bank", "code": "057", "slug": "zenith-bank" }
  ]
}
```

---

### 9.10 Resolve Bank Account Number (NUBAN)
* **Endpoint:** `POST /api/v1/banks/resolve`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "accountNumber": "0123456789",
  "bankCode": "044"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "accountNumber": "0123456789",
    "accountName": "TUNDE CHINEDU",
    "bankCode": "044"
  },
  "message": "Account resolved successfully"
}
```

---

### 9.11 Link Bank Account to Operative Profile
* **Endpoint:** `POST /api/v1/agent/bank-accounts`
* **Access Level:** Authenticated (`AGENT`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "bankCode": "044",
  "accountNumber": "0123456789",
  "accountName": "TUNDE CHINEDU"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "bankAccountLinked": true,
    "accountName": "TUNDE CHINEDU"
  },
  "message": "Bank account linked successfully"
}
```

---

## Module 10: Monitored Properties Registry

### 10.1 List Monitored Properties
* **Endpoint:** `GET /api/v1/properties`
* **Access Level:** Authenticated (`USER`)
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:** `page` (default 1), `limit` (default 20)

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "prop-uuid-001",
      "userId": "61a3e911-1a96-46ce-989f-c4c212de4db7",
      "title": "Victoria Island Commercial Plot",
      "address": "Plot 12, Block 4, Victoria Island, Lagos",
      "latitude": 6.4281,
      "longitude": 3.4219,
      "parcelNumber": "LA/VI/2026/041",
      "propertyType": "COMMERCIAL",
      "createdAt": "2026-10-20T10:00:00.000Z",
      "currentTask": {
        "id": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
        "title": "Perimeter Beacon Inspection",
        "status": "IN_PROGRESS"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 10.2 Register New Monitored Property
* **Endpoint:** `POST /api/v1/properties`
* **Access Level:** Authenticated (`USER`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "title": "Epe Waterfront Agricultural Parcel",
  "address": "Alaro City Corridor, Epe, Lagos",
  "latitude": 6.5833,
  "longitude": 3.9833,
  "parcelNumber": "EPE/AGR/2026/102",
  "propertyType": "LAND",
  "description": "5 acres waterfront perimeter marked for poultry farm."
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "prop-uuid-002",
    "title": "Epe Waterfront Agricultural Parcel",
    "parcelNumber": "EPE/AGR/2026/102",
    "createdAt": "2026-10-27T16:00:00.000Z"
  },
  "message": "Property added to monitored portfolio"
}
```

---

### 10.3 Get Property Detail
* **Endpoint:** `GET /api/v1/properties/:id`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "prop-uuid-001",
    "title": "Victoria Island Commercial Plot",
    "address": "Plot 12, Block 4, Victoria Island, Lagos",
    "latitude": 6.4281,
    "longitude": 3.4219,
    "parcelNumber": "LA/VI/2026/041",
    "propertyType": "COMMERCIAL"
  }
}
```

---

## Module 11: Legal Counsel Directory & Consultations

### 11.1 List Accredited Legal Counsel
* **Endpoint:** `GET /api/v1/legal/lawyers`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "lawyer-uuid-1",
      "name": "Barrister Femi Alabi",
      "nbaNumber": "NBA/LAG/2014/1982",
      "specialization": "Real Estate & Land Registry Titling",
      "rating": "4.95",
      "consultationFeeNgn": 35000.00,
      "isAvailable": true
    }
  ]
}
```

---

### 11.2 Book Legal Consultation
* **Endpoint:** `POST /api/v1/legal/consultations`
* **Access Level:** Authenticated (`USER`)
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "lawyerId": "lawyer-uuid-1",
  "consultationType": "VIRTUAL",
  "scheduledAt": "2026-11-04T14:00:00Z",
  "brief": "Need consultation on Land Use Act Governor's consent procedure."
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "consultationId": "cons-uuid-01",
    "status": "SCHEDULED",
    "scheduledAt": "2026-11-04T14:00:00Z"
  },
  "message": "Consultation booked successfully"
}
```

---

## Module 12: Mission Control / Admin Console

*Access to all endpoints in this section is restricted strictly to users with role `ADMIN` or `SUPER_ADMIN`.*

### 12.1 List Platform Users
* **Endpoint:** `GET /api/v1/admin/users`
* **Access Level:** `ADMIN`, `SUPER_ADMIN`
* **Headers:** `Authorization: Bearer <token>`
* **Query Parameters:** `role` (`USER` | `AGENT`), `kycStatus`, `search`, `page`, `limit`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "61a3e911-1a96-46ce-989f-c4c212de4db7",
      "email": "user@example.com",
      "name": "Tunde C.",
      "role": "USER",
      "kycStatus": "VERIFIED",
      "isActive": true,
      "createdAt": "2026-10-27T12:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

---

### 12.2 Suspend / Unsuspend User
* **Endpoint:** `POST /api/v1/admin/users/:id/suspend`
* **Access Level:** `ADMIN`, `SUPER_ADMIN`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "isActive": false,
  "reason": "Suspected breach of field reporting integrity"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "userId": "61a3e911-1a96-46ce-989f-c4c212de4db7",
    "isActive": false
  },
  "message": "User account suspended"
}
```

---

### 12.3 Manual KYC Verification Override
* **Endpoint:** `POST /api/v1/admin/users/:id/verify`
* **Access Level:** `ADMIN`, `SUPER_ADMIN`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "status": "VERIFIED",
  "notes": "Verified physically at Oversite headquarters"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "userId": "61a3e911-1a96-46ce-989f-c4c212de4db7",
    "kycStatus": "VERIFIED"
  },
  "message": "User KYC status updated manually"
}
```

---

### 12.4 Get Pending Chats Moderation Queue
* **Endpoint:** `GET /api/v1/admin/chats/pending`
* **Access Level:** `ADMIN`, `SUPER_ADMIN`
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "messageId": "msg-uuid-003",
      "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
      "taskTitle": "Perimeter Beacon Inspection",
      "senderId": "61a3e911-1a96-46ce-989f-c4c212de4db7",
      "senderRole": "USER",
      "content": "Make sure you check the generator.",
      "createdAt": "2026-10-27T12:00:00.000Z"
    }
  ]
}
```

---

### 12.5 Moderate Chat Message (Scrutinize & Refine)
* **Endpoint:** `POST /api/v1/admin/chats/:messageId/moderate`
* **Access Level:** `ADMIN`, `SUPER_ADMIN`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body (Refine example)
```json
{
  "action": "REFINE",
  "refinedMessage": "Directive from Client: Please inspect the site generator status and verify if it is powered off."
}
```
*Allowed actions:* `APPROVE` (dispatches as-is), `REFINE` (dispatches refined message), `REJECT` (blocks message).

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "messageId": "msg-uuid-003",
    "action": "REFINE",
    "moderationStatus": "REFINED_BY_ADMIN"
  },
  "message": "Message refined and dispatched to operative."
}
```

---

### 12.6 Admin Set Task Price Quote
* **Endpoint:** `POST /api/v1/admin/tasks/:id/quote`
* **Access Level:** `ADMIN`, `SUPER_ADMIN`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "priceNgn": 35000.00,
  "adminNotes": "Includes travel to remote area and boundary clearing equipment."
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "priceNgn": 35000.00,
    "quoteStatus": "QUOTED"
  },
  "message": "Quote issued to client for acceptance."
}
```

---

### 12.7 Admin Setup Task Directives & Milestones
* **Endpoint:** `POST /api/v1/admin/tasks/:id/milestones`
* **Access Level:** `ADMIN`, `SUPER_ADMIN`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "directives": "Operative must verify beacon numbers 401A, 401B, 401C, and 401D with high-resolution geotagged photographs.",
  "milestones": [
    {
      "title": "Site Arrival & Perimeter Scan",
      "description": "Log GPS arrival and record perimeter video.",
      "orderIndex": 1,
      "deliverableType": "PHOTO_SERIES"
    },
    {
      "title": "Beacon 401 Coordinate Audit",
      "description": "Capture all 4 beacons and compile findings.",
      "orderIndex": 2,
      "deliverableType": "INSPECTION_CHECKLIST"
    }
  ]
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "milestonesCreated": 2
  },
  "message": "Task directives and milestones set successfully."
}
```

---

### 12.8 Get Pending Operative Reports Queue
* **Endpoint:** `GET /api/v1/admin/reports/pending`
* **Access Level:** `ADMIN`, `SUPER_ADMIN`
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "reportId": "report-uuid-8899",
      "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
      "taskTitle": "Perimeter Beacon Inspection",
      "agentName": "Suleiman Ibrahim",
      "summary": "Completed inspection of beacons.",
      "submittedAt": "2026-10-27T12:00:00.000Z"
    }
  ]
}
```

---

### 12.9 Compile Official Dossier & Release to Client
* **Endpoint:** `POST /api/v1/admin/tasks/:id/reports/:reportId/compile-and-release` (also aliased at `POST .../compile`)
* **Access Level:** `ADMIN`, `SUPER_ADMIN`
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "officialNotes": "All boundary coordinates verified against Lagos State Ministry of Physical Planning cadastral master plan.",
  "customWatermark": "OFFICIAL-OVS-DOSSIER-2026"
}
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "reportId": "report-uuid-8899",
    "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
    "watermarkCode": "OFFICIAL-OVS-DOSSIER-2026",
    "pdfUrl": "/api/v1/reports/report-uuid-8899/pdf",
    "status": "APPROVED",
    "releasedToClient": true
  },
  "message": "Official dossier compiled and dispatched to client for review."
}
```

---

## Module 13: Dashboard Metrics, Activities & Support

### 13.1 Get Role-Specific Dashboard Metrics
* **Endpoint:** `GET /api/v1/dashboard/summary`
* **Access Level:** Authenticated

#### Success Response for `USER` (200 OK)
```json
{
  "success": true,
  "data": {
    "role": "CLIENT",
    "activeRequests": 3,
    "pendingReports": 1,
    "monitoredProperties": 2
  }
}
```

#### Success Response for `AGENT` (200 OK)
```json
{
  "success": true,
  "data": {
    "role": "AGENT",
    "pendingAssignments": 2,
    "activeTasks": 1,
    "completedTasks": 14,
    "walletBalance": 145000.00,
    "totalEarnings": 420000.00
  }
}
```

---

### 13.2 Unified Chronological Activities Feed
* **Endpoint:** `GET /api/v1/activities`
* **Access Level:** Authenticated
* **Query Parameters:** `limit` (default 20), `offset` (default 0)

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "act-01",
      "type": "TASK",
      "title": "Perimeter Beacon Inspection",
      "description": "Task status updated to IN_PROGRESS",
      "timestamp": "2026-10-27T11:30:00.000Z",
      "status": "IN_PROGRESS"
    },
    {
      "id": "act-02",
      "type": "PAYMENT",
      "title": "Payment Protection Authorized",
      "description": "NGN 35,000 authorized for Perimeter Beacon Inspection",
      "timestamp": "2026-10-27T10:30:00.000Z",
      "status": "CAPTURED"
    }
  ]
}
```

---

### 13.3 Get Membership Subscription Tiers
* **Endpoint:** `GET /api/v1/subscriptions`
* **Access Level:** Authenticated

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "plan-starter",
      "name": "Starter Oversight",
      "priceNgn": 0,
      "billingCycle": "monthly",
      "features": [
        "Pay-as-you-go task requests",
        "Standard diligence turnaround (72h)",
        "Direct chat with admin dispatch"
      ],
      "isCurrentPlan": true
    },
    {
      "id": "plan-pro",
      "name": "Professional Portfolio",
      "priceNgn": 45000,
      "billingCycle": "monthly",
      "features": [
        "Up to 5 properties monitored simultaneously",
        "Priority 24h report turnaround",
        "Dedicated accredited project supervisor",
        "Automated monthly milestone audits"
      ],
      "isCurrentPlan": false
    },
    {
      "id": "plan-enterprise",
      "name": "Enterprise Developer",
      "priceNgn": 150000,
      "billingCycle": "monthly",
      "features": [
        "Unlimited properties & site watches",
        "Dedicated legal counsel retainer access",
        "Drone mapping & 4K evidence vaulting",
        "Direct API integration & multi-user team seats"
      ],
      "isCurrentPlan": false
    }
  ]
}
```

---

### 13.4 List Customer Support Tickets
* **Endpoint:** `GET /api/v1/support/tickets`
* **Access Level:** Authenticated

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "tkt-001",
      "userId": "61a3e911-1a96-46ce-989f-c4c212de4db7",
      "subject": "Inquiry about property boundary survey",
      "description": "Wanted to confirm the surveyor accreditation details.",
      "category": "Service Inquiry",
      "status": "RESOLVED",
      "priority": "NORMAL",
      "createdAt": "2026-10-25T10:00:00.000Z",
      "updatedAt": "2026-10-26T14:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

---

### 13.5 Create Customer Support Ticket
* **Endpoint:** `POST /api/v1/support/tickets`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "subject": "Request for additional beacon marker report",
  "description": "Please provide an additional elevation profile for the south fence line.",
  "category": "Report Clarification",
  "priority": "HIGH"
}
```

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "tkt-002",
    "subject": "Request for additional beacon marker report",
    "status": "OPEN",
    "priority": "HIGH",
    "createdAt": "2026-10-29T10:00:00.000Z"
  },
  "message": "Support ticket opened. A supervisor will respond shortly."
}
```

---

### 13.6 In-App Notifications Feed
* **Endpoint:** `GET /api/v1/notifications`
* **Access Level:** Authenticated
* **Headers:** `Authorization: Bearer <token>`

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-uuid-1",
      "type": "TASK_UPDATE",
      "title": "Operative Arrived On Site",
      "message": "Your operative has arrived at Plot 12, Victoria Island and begun inspection.",
      "taskId": "de9cb8a7-5c36-49f8-a2d0-9d5174e09124",
      "isRead": false,
      "createdAt": "2026-10-27T11:30:00.000Z"
    }
  ]
}
```

---

## Summary Index of All Endpoints

| Module | Method | Endpoint | Access Level | Description |
| :--- | :---: | :--- | :---: | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | Public | Register new user or operative |
| **Auth** | `POST` | `/api/v1/auth/signup` | Public | Alias for user/agent registration |
| **Auth** | `POST` | `/api/v1/auth/login` | Public | Authenticate and issue JWT |
| **Auth** | `POST` | `/api/v1/auth/logout` | Authenticated | Clear session cookies |
| **Auth** | `POST` | `/api/v1/auth/forgot-password` | Public | Request 6-digit password reset OTP |
| **Auth** | `POST` | `/api/v1/auth/reset-password` | Public | Verify OTP & update password |
| **Auth** | `POST` | `/api/v1/auth/change-password` | Authenticated | Change password while logged in |
| **Auth** | `PUT` | `/api/v1/users/me/password` | Authenticated | Direct password update endpoint |
| **Auth** | `POST` | `/api/v1/auth/otp/verify` | Public | Generic OTP verification |
| **User Core** | `GET` | `/api/v1/users/me` | Authenticated | Get current user extended profile |
| **User Core** | `GET` | `/api/v1/profile` | Authenticated | Alias to get current user profile |
| **User Core** | `PATCH` | `/api/v1/users/me` | Authenticated | Update user profile fields |
| **User Core** | `DELETE` | `/api/v1/users/me` | Authenticated | Deactivate user account |
| **User Core** | `POST` | `/api/v1/users/me/2fa` | Authenticated | Enable/disable 2FA |
| **User Core** | `GET` | `/api/v1/users/me/settings` | Authenticated | Fetch notification, language & theme preferences |
| **User Core** | `PATCH` | `/api/v1/users/me/settings` | Authenticated | Update notification, language & theme preferences |
| **User Core** | `POST` | `/api/v1/user/avatar/presign` | Authenticated | S3 pre-signed upload URL for avatar |
| **KYC** | `GET` | `/api/v1/kyc/status` | Authenticated | Get 6-step accreditation pipeline status |
| **KYC** | `POST` | `/api/v1/kyc/verify/nin` | Authenticated | Submit & verify 11-digit NIN |
| **KYC** | `POST` | `/api/v1/kyc/verify/nba` | `AGENT` | Verify NBA legal enrollment number |
| **KYC** | `POST` | `/api/v1/kyc/documents` | Authenticated | Upload accreditation certificates |
| **KYC** | `POST` | `/api/v1/kyc/consent` | Authenticated | Submit signed background check consent |
| **Task Booking** | `POST` | `/api/v1/tasks` | Authenticated | Create general task |
| **Task Booking** | `POST` | `/api/v1/tasks/property-oversite` | Authenticated | Book Property Oversite beacon check |
| **Task Booking** | `POST` | `/api/v1/tasks/quick-errands` | Authenticated | Book Quick Physical Errand |
| **Task Booking** | `POST` | `/api/v1/tasks/project-watch` | Authenticated | Book Project Watch construction audit |
| **Task Booking** | `POST` | `/api/v1/tasks/due-diligence` | Authenticated | Book Due Diligence investigation |
| **Task Booking** | `POST` | `/api/v1/tasks/legal-advisory` | Authenticated | Book Legal Advisory consultation |
| **Task Booking** | `POST` | `/api/v1/tasks/enforcement` | Authenticated | Book Emergency Law Enforcement dispatch |
| **Task Booking** | `POST` | `/api/v1/tasks/vulnerability-test` | Authenticated | Book Vulnerability Assessment |
| **Task Flow** | `GET` | `/api/v1/tasks` | Authenticated | List tasks with filters & pagination |
| **Task Flow** | `GET` | `/api/v1/tasks/:id` | Authenticated | Fetch task detail |
| **Task Flow** | `PATCH` | `/api/v1/tasks/:id` | Authenticated | Update task fields |
| **Task Flow** | `PATCH` | `/api/v1/tasks/:id/status` | Authenticated | Update task status |
| **Task Flow** | `POST` | `/api/v1/tasks/:id/quote/accept` | Authenticated | Accept quoted task price |
| **Task Flow** | `POST` | `/api/v1/tasks/:id/quote/counter` | Authenticated | Submit counter-offer on quote |
| **Task Flow** | `POST` | `/api/v1/tasks/:id/quote/decline` | Authenticated | Decline quoted price |
| **Task Flow** | `POST` | `/api/v1/tasks/:id/arrive` | `AGENT` | Geofenced GPS arrival check-in |
| **Task Flow** | `POST` | `/api/v1/tasks/:id/assign` | `AGENT`/`ADMIN` | Self-claim or assign operative to task |
| **Task Flow** | `GET` | `/api/v1/tasks/:id/milestones` | Authenticated | Get task milestones |
| **Reporting** | `POST` | `/api/v1/tasks/:id/report/sync` | `AGENT` | Offline-first field report sync |
| **Reporting** | `POST` | `/api/v1/tasks/:id/reports` | `AGENT` | Submit field report |
| **Reporting** | `GET` | `/api/v1/tasks/:id/reports` | Authenticated | List reports for task |
| **Reporting** | `GET` | `/api/v1/reports/:id` | Authenticated | Get report detail |
| **Reporting** | `GET` | `/api/v1/reports/:id/pdf` | Authenticated | Download signed official PDF report |
| **Reporting** | `POST` | `/api/v1/tasks/:id/approve` | Authenticated | Client approve final deliverables |
| **Reporting** | `POST` | `/api/v1/tasks/:id/dispute` | Authenticated | Client dispute/reject deliverables |
| **Chat** | `GET` | `/api/v1/chats` | Authenticated | List conversation threads |
| **Chat** | `GET` | `/api/v1/chat/:taskId/messages` | Authenticated | Fetch message history for thread |
| **Chat** | `POST` | `/api/v1/chat/:taskId/messages` | Authenticated | Post message into moderated queue |
| **Vault** | `POST` | `/api/v1/external/media/presign` | Authenticated | S3 pre-signed upload URL for files |
| **Vault** | `GET` | `/api/v1/vault/documents` | Authenticated | List documents in vault |
| **Payments** | `POST` | `/api/v1/payments/initialize` | Authenticated | Initialize payment via Paystack/Flutterwave |
| **Payments** | `POST` | `/api/v1/payments/webhook` | Public | Payment gateway webhook callback |
| **Payments** | `GET` | `/api/v1/payments/history` | Authenticated | Transaction history |
| **Payments** | `GET` | `/api/v1/payments/methods` | Authenticated | List saved payment cards |
| **Payments** | `POST` | `/api/v1/payments/methods` | Authenticated | Save tokenized card |
| **Payments** | `DELETE` | `/api/v1/payments/methods/:id` | Authenticated | Remove saved card |
| **Wallets** | `GET` | `/api/v1/wallets` | `AGENT` | Get operative wallet balance & earnings |
| **Wallets** | `POST` | `/api/v1/wallets/withdraw` | `AGENT` | Request payout withdrawal |
| **Banks** | `GET` | `/api/v1/banks` | Public | List Nigerian commercial banks |
| **Banks** | `POST` | `/api/v1/banks/resolve` | Authenticated | Resolve NUBAN bank account |
| **Banks** | `POST` | `/api/v1/agent/bank-accounts` | `AGENT` | Link bank account to operative |
| **Properties** | `GET` | `/api/v1/properties` | Authenticated | List monitored properties |
| **Properties** | `POST` | `/api/v1/properties` | Authenticated | Register new property |
| **Properties** | `GET` | `/api/v1/properties/:id` | Authenticated | Get property detail |
| **Legal** | `GET` | `/api/v1/legal/lawyers` | Authenticated | List accredited lawyers |
| **Legal** | `POST` | `/api/v1/legal/consultations` | Authenticated | Book legal consultation |
| **Admin** | `GET` | `/api/v1/admin/users` | `ADMIN` | List all platform users |
| **Admin** | `POST` | `/api/v1/admin/users/:id/suspend` | `ADMIN` | Suspend or unsuspend user |
| **Admin** | `POST` | `/api/v1/admin/users/:id/verify` | `ADMIN` | Manual KYC verification |
| **Admin** | `GET` | `/api/v1/admin/chats/pending` | `ADMIN` | Queue of chats awaiting moderation |
| **Admin** | `POST` | `/api/v1/admin/chats/:messageId/moderate` | `ADMIN` | Scrutinize, refine, or approve chat |
| **Admin** | `POST` | `/api/v1/admin/tasks/:id/quote` | `ADMIN` | Issue price quote on task |
| **Admin** | `POST` | `/api/v1/admin/tasks/:id/milestones` | `ADMIN` | Setup task directives and milestones |
| **Admin** | `GET` | `/api/v1/admin/reports/pending` | `ADMIN` | Pending reports for review |
| **Admin** | `POST` | `/api/v1/admin/tasks/:id/reports/:reportId/compile-and-release` | `ADMIN` | Compile official dossier & release to client |
| **Admin** | `POST` | `/api/v1/payments/disburse` | `ADMIN` | Release payment to operative wallet |
| **Dashboard** | `GET` | `/api/v1/dashboard/summary` | Authenticated | Role-specific dashboard statistics |
| **Activities** | `GET` | `/api/v1/activities` | Authenticated | Unified activity timeline |
| **Billing** | `GET` | `/api/v1/subscriptions` | Authenticated | Membership plans |
| **Support** | `GET` | `/api/v1/support/tickets` | Authenticated | List support tickets |
| **Support** | `POST` | `/api/v1/support/tickets` | Authenticated | Create support ticket |
| **Notifications** | `GET` | `/api/v1/notifications` | Authenticated | In-app notifications feed |
