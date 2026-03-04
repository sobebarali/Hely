---
title: Blood Bank Management API
description: API reference for donor management, blood donation recording, inventory tracking, and transfusion operations.
---

## Overview

The Blood Bank Management API manages the complete blood banking workflow including donor registration, donation recording, inventory management, blood requests, cross-matching, blood issuance, and transfusion reaction reporting. It ensures safe blood supply chain management with full traceability.

---

## Register Donor

**POST** `/api/blood-bank/donors`

Registers a new blood donor.

### Authentication

Required. Bearer token with `BLOODBANK:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| firstName | string | Yes | Donor first name |
| lastName | string | Yes | Donor last name |
| dateOfBirth | string | Yes | Date of birth (ISO 8601) |
| gender | string | Yes | `MALE`, `FEMALE`, `OTHER` |
| bloodGroup | string | Yes | `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-` |
| phone | string | Yes | Contact phone number |
| email | string | No | Email address |
| address | object | No | Donor address |
| patientId | string | No | Link to patient record (if applicable) |
| medicalHistory | object | No | Relevant medical history |
| medicalHistory.lastDonation | string | No | Date of last donation |
| medicalHistory.conditions | array | No | Medical conditions |
| medicalHistory.medications | array | No | Current medications |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Donor ID |
| donorId | string | Unique identifier: `{tenantId}-DNR-{sequential}` |
| firstName | string | First name |
| lastName | string | Last name |
| bloodGroup | string | Blood group |
| status | string | `ACTIVE` |
| eligibleToDonateSince | string | Date eligible to donate |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | DUPLICATE_DONOR | Donor with same phone already exists |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Donor ID auto-generated: `{tenantId}-DNR-{sequential}`
- Donors must be 18-65 years old
- Minimum 56 days between whole blood donations

---

## List Donors

**GET** `/api/blood-bank/donors`

Retrieves a paginated list of registered donors.

### Authentication

Required. Bearer token with `BLOODBANK:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| bloodGroup | string | - | Filter by blood group |
| status | string | ACTIVE | Filter by donor status |
| eligible | boolean | - | Filter by donation eligibility |
| search | string | - | Search by name or phone |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | `asc` or `desc` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of donor objects |
| data[].id | string | Donor ID |
| data[].donorId | string | Display donor ID |
| data[].name | string | Full name |
| data[].bloodGroup | string | Blood group |
| data[].lastDonation | string | Last donation date |
| data[].eligible | boolean | Currently eligible to donate |
| data[].status | string | Donor status |
| pagination | object | Pagination details |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Record Donation

**POST** `/api/blood-bank/donations`

Records a new blood donation.

### Authentication

Required. Bearer token with `BLOODBANK:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| donorId | string | Yes | Donor ID |
| donationType | string | Yes | `WHOLE_BLOOD`, `PLATELETS`, `PLASMA`, `RED_CELLS` |
| volume | number | Yes | Volume in mL |
| collectedBy | string | Yes | Staff ID who collected |
| collectedAt | string | No | Collection timestamp (defaults to now) |
| preScreening | object | Yes | Pre-donation screening results |
| preScreening.hemoglobin | number | Yes | Hemoglobin level (g/dL) |
| preScreening.bloodPressure | string | Yes | Blood pressure reading |
| preScreening.pulse | number | Yes | Pulse rate |
| preScreening.temperature | number | Yes | Temperature |
| preScreening.weight | number | Yes | Weight in kg |
| notes | string | No | Collection notes |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Donation ID |
| donationId | string | Unique identifier: `{tenantId}-DON-{sequential}` |
| donorId | string | Donor ID |
| donationType | string | Donation type |
| volume | number | Volume (mL) |
| bagId | string | Auto-generated blood bag ID |
| status | string | `COLLECTED` |
| collectedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | DONOR_NOT_ELIGIBLE | Donor not eligible to donate |
| 400 | SCREENING_FAILED | Pre-screening criteria not met |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Donor not found |

### Business Rules

- Donor eligibility is verified before recording
- Hemoglobin must be >= 12.5 g/dL (female) or >= 13.0 g/dL (male)
- Blood bag ID auto-generated for tracking
- Donor's next eligible date is updated

---

## List Inventory

**GET** `/api/blood-bank/inventory`

Retrieves current blood bank inventory.

### Authentication

Required. Bearer token with `BLOODBANK:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| bloodGroup | string | - | Filter by blood group |
| component | string | - | Filter by component type |
| status | string | AVAILABLE | Filter by status |
| expiringBefore | string | - | Filter units expiring before date |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| summary | object | Inventory summary |
| summary.totalUnits | number | Total units available |
| summary.byBloodGroup | object | Count per blood group |
| summary.expiringIn7Days | number | Units expiring within 7 days |
| units | array | Array of blood unit objects |
| units[].id | string | Unit ID |
| units[].bagId | string | Blood bag ID |
| units[].bloodGroup | string | Blood group |
| units[].component | string | Component type |
| units[].volume | number | Volume (mL) |
| units[].collectedAt | string | Collection date |
| units[].expiresAt | string | Expiry date |
| units[].status | string | Unit status |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Request Blood

**POST** `/api/blood-bank/requests`

Creates a blood request for a patient.

### Authentication

Required. Bearer token with `BLOODBANK:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Patient ID |
| doctorId | string | Yes | Requesting doctor ID |
| bloodGroup | string | Yes | Required blood group |
| component | string | Yes | `WHOLE_BLOOD`, `PACKED_RED_CELLS`, `PLATELETS`, `FFP`, `CRYOPRECIPITATE` |
| units | number | Yes | Number of units required |
| priority | string | No | `ROUTINE`, `URGENT`, `EMERGENCY` (default: `ROUTINE`) |
| reason | string | Yes | Reason for request |
| requiredBy | string | No | Date/time needed by |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Request ID |
| requestId | string | Unique identifier: `{tenantId}-BRQ-{sequential}` |
| patientId | string | Patient ID |
| bloodGroup | string | Blood group |
| component | string | Component type |
| units | number | Units requested |
| priority | string | Request priority |
| status | string | `PENDING` |
| availableUnits | number | Currently available matching units |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INSUFFICIENT_STOCK | Not enough units available |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Patient not found |

### Business Rules

- Request ID auto-generated: `{tenantId}-BRQ-{sequential}`
- Emergency requests trigger immediate alerts to blood bank staff
- Availability is checked but low stock does not block request creation

---

## Cross-Match

**POST** `/api/blood-bank/requests/:requestId/crossmatch`

Performs cross-matching for a blood request.

### Authentication

Required. Bearer token with `BLOODBANK:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| requestId | string | Blood request ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| unitIds | array | Yes | Array of blood unit IDs to cross-match |
| performedBy | string | Yes | Lab technician staff ID |
| method | string | No | `IMMEDIATE_SPIN`, `FULL_CROSSMATCH`, `ELECTRONIC` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| requestId | string | Blood request ID |
| results | array | Cross-match results per unit |
| results[].unitId | string | Blood unit ID |
| results[].compatible | boolean | Compatibility result |
| results[].method | string | Method used |
| results[].performedBy | object | Technician details |
| results[].performedAt | string | ISO 8601 timestamp |
| status | string | Updated request status |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | INVALID_STATUS | Request not in valid state |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Request or unit not found |

### Business Rules

- Cross-match required before blood can be issued
- Incompatible units are flagged and cannot be issued
- Results are recorded for traceability

---

## Issue Blood

**POST** `/api/blood-bank/requests/:requestId/issue`

Issues blood units for a cross-matched request.

### Authentication

Required. Bearer token with `BLOODBANK:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| requestId | string | Blood request ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| unitIds | array | Yes | Array of compatible unit IDs to issue |
| issuedBy | string | Yes | Staff ID issuing blood |
| issuedTo | string | Yes | Staff ID receiving blood (ward nurse) |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| requestId | string | Blood request ID |
| issuedUnits | array | Array of issued unit details |
| issuedUnits[].unitId | string | Blood unit ID |
| issuedUnits[].bagId | string | Blood bag ID |
| issuedUnits[].bloodGroup | string | Blood group |
| issuedUnits[].component | string | Component type |
| status | string | Updated to `ISSUED` |
| issuedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | NOT_CROSSMATCHED | Units not cross-matched |
| 400 | INCOMPATIBLE_UNIT | Unit is incompatible |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Request or unit not found |

### Business Rules

- Only cross-matched compatible units can be issued
- Issued units are removed from available inventory
- Chain of custody recorded (issued by / issued to)
- Blood must be transfused within 30 minutes of issue

---

## Report Transfusion Reaction

**POST** `/api/blood-bank/reactions`

Reports a transfusion reaction.

### Authentication

Required. Bearer token with `BLOODBANK:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Patient ID |
| requestId | string | Yes | Blood request ID |
| unitId | string | Yes | Blood unit ID that caused reaction |
| reactionType | string | Yes | `FEBRILE`, `ALLERGIC`, `HEMOLYTIC`, `ANAPHYLACTIC`, `TRALI`, `TACO`, `OTHER` |
| severity | string | Yes | `MILD`, `MODERATE`, `SEVERE`, `LIFE_THREATENING` |
| symptoms | array | Yes | Array of symptoms observed |
| onsetTime | string | Yes | When reaction started (ISO 8601) |
| reportedBy | string | Yes | Reporting staff ID |
| actionsTaken | string | Yes | Actions taken in response |
| notes | string | No | Additional notes |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Reaction report ID |
| patientId | string | Patient ID |
| unitId | string | Blood unit ID |
| reactionType | string | Type of reaction |
| severity | string | Severity level |
| status | string | `REPORTED` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Request or unit not found |

### Business Rules

- Reaction reports trigger immediate alerts to blood bank and attending doctor
- All remaining units from the same donation are quarantined
- Donor record is flagged for investigation
- Incident is recorded for hemovigilance reporting

---

## Blood Request Status Flow

| Status | Description |
|--------|-------------|
| PENDING | Request created, awaiting processing |
| CROSSMATCHED | Cross-matching completed |
| ISSUED | Blood units issued |
| TRANSFUSED | Transfusion completed |
| CANCELLED | Request cancelled |

## Blood Components

| Component | Shelf Life | Storage |
|-----------|------------|---------|
| WHOLE_BLOOD | 35 days | 2-6°C |
| PACKED_RED_CELLS | 42 days | 2-6°C |
| PLATELETS | 5 days | 20-24°C (agitation) |
| FFP | 1 year | -18°C or below |
| CRYOPRECIPITATE | 1 year | -18°C or below |

## Reaction Types

| Type | Description |
|------|-------------|
| FEBRILE | Febrile non-hemolytic reaction |
| ALLERGIC | Allergic/urticarial reaction |
| HEMOLYTIC | Hemolytic transfusion reaction |
| ANAPHYLACTIC | Anaphylactic reaction |
| TRALI | Transfusion-related acute lung injury |
| TACO | Transfusion-associated circulatory overload |
| OTHER | Other reaction type |
