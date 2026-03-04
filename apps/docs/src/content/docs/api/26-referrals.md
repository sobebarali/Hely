---
title: Referral Management API
description: API reference for creating, tracking, and managing patient referrals between departments and specialists.
---

## Overview

The Referral Management API handles patient referrals between departments, specialists, and external facilities. It supports the full referral lifecycle from creation through acceptance, completion, or cancellation, with tracking at each stage.

---

## Create Referral

**POST** `/api/referrals`

Creates a new patient referral.

### Authentication

Required. Bearer token with `REFERRAL:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Patient ID |
| fromDoctorId | string | Yes | Referring doctor ID |
| toDoctorId | string | No | Target specialist doctor ID |
| toDepartmentId | string | Yes | Target department ID |
| priority | string | No | `ROUTINE`, `URGENT`, `EMERGENCY` (default: `ROUTINE`) |
| reason | string | Yes | Reason for referral |
| clinicalNotes | string | No | Clinical notes and relevant history |
| diagnosis | string | No | Current diagnosis |
| attachments | array | No | Supporting document IDs |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Referral ID |
| referralId | string | Unique identifier: `{tenantId}-REF-{sequential}` |
| patientId | string | Patient ID |
| fromDoctorId | string | Referring doctor |
| toDepartmentId | string | Target department |
| priority | string | Referral priority |
| status | string | `PENDING` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INVALID_PATIENT | Patient not found |
| 400 | INVALID_DOCTOR | Doctor not found |
| 400 | INVALID_DEPARTMENT | Department not found |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Referral ID auto-generated: `{tenantId}-REF-{sequential}`
- Emergency referrals trigger immediate notifications
- Target doctor is optional; department head reviews if no specific doctor

---

## List Referrals

**GET** `/api/referrals`

Retrieves a paginated list of referrals.

### Authentication

Required. Bearer token with `REFERRAL:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| patientId | string | - | Filter by patient ID |
| fromDoctorId | string | - | Filter by referring doctor |
| toDoctorId | string | - | Filter by target doctor |
| toDepartmentId | string | - | Filter by target department |
| status | string | - | Filter by status |
| priority | string | - | Filter by priority |
| startDate | string | - | Filter from date |
| endDate | string | - | Filter to date |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | `asc` or `desc` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of referral objects |
| pagination.page | number | Current page |
| pagination.limit | number | Results per page |
| pagination.total | number | Total results |
| pagination.totalPages | number | Total pages |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Get Referral

**GET** `/api/referrals/:referralId`

Retrieves details of a specific referral.

### Authentication

Required. Bearer token with `REFERRAL:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| referralId | string | Referral ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Referral ID |
| referralId | string | Unique identifier |
| patientId | string | Patient ID |
| patient | object | Patient details |
| fromDoctorId | string | Referring doctor ID |
| fromDoctor | object | Referring doctor details |
| toDoctorId | string | Target doctor ID |
| toDoctor | object | Target doctor details |
| toDepartmentId | string | Target department ID |
| toDepartment | object | Target department details |
| priority | string | Referral priority |
| reason | string | Referral reason |
| clinicalNotes | string | Clinical notes |
| diagnosis | string | Current diagnosis |
| status | string | Referral status |
| statusHistory | array | Status change history |
| attachments | array | Supporting documents |
| completionNotes | string | Specialist's completion notes |
| createdAt | string | ISO 8601 timestamp |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Referral not found |

---

## Accept Referral

**POST** `/api/referrals/:referralId/accept`

Accepts a pending referral.

### Authentication

Required. Bearer token with `REFERRAL:UPDATE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| referralId | string | Referral ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| acceptedBy | string | Yes | Accepting doctor ID |
| scheduledDate | string | No | Proposed appointment date |
| notes | string | No | Acceptance notes |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Referral ID |
| status | string | Updated to `ACCEPTED` |
| acceptedBy | object | Accepting doctor |
| scheduledDate | string | Proposed appointment |
| acceptedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Referral not in valid state |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Referral not found |

### Business Rules

- Only `PENDING` referrals can be accepted
- Accepting doctor must be in the target department
- Notification sent to referring doctor

---

## Decline Referral

**POST** `/api/referrals/:referralId/decline`

Declines a pending referral.

### Authentication

Required. Bearer token with `REFERRAL:UPDATE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| referralId | string | Referral ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | Yes | Reason for declining |
| suggestedAlternative | string | No | Suggested alternative department or doctor |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Referral ID |
| status | string | Updated to `DECLINED` |
| declineReason | string | Reason for declining |
| suggestedAlternative | string | Alternative suggestion |
| declinedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Referral not in valid state |
| 400 | INVALID_REQUEST | Missing decline reason |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Referral not found |

### Business Rules

- Only `PENDING` referrals can be declined
- Reason is mandatory
- Notification sent to referring doctor

---

## Complete Referral

**POST** `/api/referrals/:referralId/complete`

Marks a referral as completed after consultation.

### Authentication

Required. Bearer token with `REFERRAL:UPDATE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| referralId | string | Referral ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| completionNotes | string | Yes | Consultation findings and recommendations |
| diagnosis | string | No | Updated diagnosis |
| followUpRequired | boolean | No | Whether follow-up is needed |
| followUpDate | string | No | Recommended follow-up date |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Referral ID |
| status | string | Updated to `COMPLETED` |
| completionNotes | string | Consultation notes |
| completedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Referral not in valid state |
| 400 | INVALID_REQUEST | Missing completion notes |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Referral not found |

### Business Rules

- Only `ACCEPTED` referrals can be completed
- Completion notes are shared with referring doctor
- Notification sent to referring doctor

---

## Cancel Referral

**POST** `/api/referrals/:referralId/cancel`

Cancels a referral.

### Authentication

Required. Bearer token with `REFERRAL:UPDATE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| referralId | string | Referral ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | Yes | Cancellation reason |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Referral ID |
| status | string | Updated to `CANCELLED` |
| cancellationReason | string | Reason for cancellation |
| cancelledAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Referral already completed or cancelled |
| 400 | INVALID_REQUEST | Missing cancellation reason |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Referral not found |

### Business Rules

- Only `PENDING` or `ACCEPTED` referrals can be cancelled
- Only the referring doctor or an admin can cancel
- Notification sent to all parties

---

## Referral Status Flow

| Status | Description |
|--------|-------------|
| PENDING | Referral created, awaiting response |
| ACCEPTED | Referral accepted by target doctor/department |
| DECLINED | Referral declined |
| COMPLETED | Consultation completed |
| CANCELLED | Referral cancelled |

## Priority Levels

| Priority | Description |
|----------|-------------|
| ROUTINE | Standard priority, normal scheduling |
| URGENT | Elevated priority, expedited scheduling |
| EMERGENCY | Immediate attention required |
