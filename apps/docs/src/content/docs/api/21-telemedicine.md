---
title: Telemedicine API
description: API reference for virtual visit management and telemedicine workflows.
---

## Overview

The Telemedicine API enables virtual healthcare consultations. It covers scheduling virtual visits, retrieving visit details, and cancelling visits.

All endpoints require a valid JWT. The `tenantId` is extracted from the token automatically — it must never be supplied in the request.

---

## Create Virtual Visit

**POST** `/api/telemedicine/visits`

Creates a new virtual visit (telemedicine appointment).

### Authentication

Required. Bearer token with `TELEMEDICINE:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Patient ID |
| doctorId | string | Yes | Staff ID of the doctor |
| scheduledAt | string | Yes | Scheduled date/time (ISO 8601). Must be in the future. |
| duration | number | No | Expected duration in minutes (default: 30, must be a positive integer) |
| reason | string | Yes | Reason for visit |
| type | string | No | `CONSULTATION`, `FOLLOW_UP`, `SECOND_OPINION` (default: `CONSULTATION`) |
| notes | string | No | Additional notes |

### Example Request

```json
{
  "patientId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "doctorId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "scheduledAt": "2026-03-10T14:00:00.000Z",
  "duration": 30,
  "reason": "Follow-up consultation",
  "type": "CONSULTATION",
  "notes": "Patient requested video consultation"
}
```

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Internal document ID (UUID) |
| visitId | string | Human-readable unique identifier: `{tenantId}-TM-{sequential}` |
| patientId | string | Patient ID |
| doctorId | string | Staff ID of the doctor (mapped from `providerId` in the database) |
| scheduledAt | string | ISO 8601 scheduled date/time |
| duration | number | Expected duration (minutes) |
| type | string | Visit type |
| status | string | Always `SCHEDULED` on creation |
| joinUrl | string | Relative URL for joining the session (e.g. `/telemedicine/join/{visitId}`) |
| createdAt | string | ISO 8601 timestamp |

### Example Response

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "visitId": "tenant-abc-TM-1",
  "patientId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "doctorId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "scheduledAt": "2026-03-10T14:00:00.000Z",
  "duration": 30,
  "type": "CONSULTATION",
  "status": "SCHEDULED",
  "joinUrl": "/telemedicine/join/tenant-abc-TM-1",
  "createdAt": "2026-03-05T10:00:00.000Z"
}
```

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields, or `scheduledAt` is not in the future |
| 400 | INVALID_PATIENT | Patient not found in the tenant |
| 400 | INVALID_DOCTOR | Staff member (doctor) not found in the tenant |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Visit ID auto-generated: `{tenantId}-TM-{sequential}` using an atomic counter
- `scheduledAt` must be a valid ISO 8601 string and must be in the future
- Both patient and doctor are validated to belong to the same tenant
- `joinUrl` is a relative path, not a full URL

---

## List Virtual Visits

**GET** `/api/telemedicine/visits`

Retrieves a paginated list of virtual visits for the authenticated tenant.

### Authentication

Required. Bearer token with `TELEMEDICINE:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number (positive integer) |
| limit | number | 20 | Results per page (max 100) |
| patientId | string | - | Filter by patient ID |
| doctorId | string | - | Filter by doctor (staff) ID |
| status | string | - | Filter by status: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| type | string | - | Filter by type: `CONSULTATION`, `FOLLOW_UP`, `SECOND_OPINION` |
| startDate | string | - | Filter visits scheduled on or after this date (ISO 8601) |
| endDate | string | - | Filter visits scheduled on or before this date (ISO 8601) |
| sortBy | string | `scheduledAt` | Field to sort by |
| sortOrder | string | `desc` | Sort direction: `asc` or `desc` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of virtual visit objects |
| pagination.page | number | Current page |
| pagination.limit | number | Results per page |
| pagination.total | number | Total matching results |
| pagination.totalPages | number | Total pages |

Each object in `data` contains:

| Field | Type | Description |
|-------|------|-------------|
| id | string | Internal document ID |
| visitId | string | Human-readable unique identifier |
| patientId | string | Patient ID |
| doctorId | string | Staff ID of the doctor |
| scheduledAt | string | ISO 8601 scheduled date/time |
| duration | number | Expected duration (minutes) |
| type | string | Visit type |
| reason | string | Reason for visit |
| status | string | Current visit status |
| joinUrl | string | Session join URL |
| notes | string (optional) | Additional notes |
| createdAt | string | ISO 8601 timestamp |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Get Virtual Visit

**GET** `/api/telemedicine/visits/:visitId`

Retrieves details of a specific virtual visit. The `visitId` path parameter is the internal document ID (UUID), not the human-readable `visitId` field.

### Authentication

Required. Bearer token with `TELEMEDICINE:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| visitId | string | Internal document ID (UUID) of the virtual visit |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Internal document ID |
| visitId | string | Human-readable unique identifier |
| patientId | string | Patient ID |
| doctorId | string | Staff ID of the doctor |
| scheduledAt | string | ISO 8601 scheduled date/time |
| duration | number | Expected duration (minutes) |
| type | string | Visit type |
| reason | string | Reason for visit |
| status | string | Current visit status |
| joinUrl | string | Session join URL |
| notes | string (optional) | Additional notes |
| createdAt | string | ISO 8601 timestamp |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Virtual visit not found in the tenant |

---

## Cancel Visit

**POST** `/api/telemedicine/visits/:visitId/cancel`

Cancels a scheduled virtual visit. The `visitId` path parameter is the internal document ID (UUID).

### Authentication

Required. Bearer token with `TELEMEDICINE:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| visitId | string | Internal document ID (UUID) of the virtual visit |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | Yes | Cancellation reason (min 1 character) |
| cancelledBy | string | Yes | ID of the staff or user who cancelled (min 1 character) |

### Example Request

```json
{
  "reason": "Patient requested cancellation",
  "cancelledBy": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
}
```

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Internal document ID |
| status | string | Updated to `CANCELLED` |
| cancellationReason | string | Reason for cancellation |
| cancelledAt | string | ISO 8601 timestamp of cancellation |

### Example Response

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "status": "CANCELLED",
  "cancellationReason": "Patient requested cancellation",
  "cancelledAt": "2026-03-05T11:00:00.000Z"
}
```

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Visit is not in `SCHEDULED` status and cannot be cancelled |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Virtual visit not found in the tenant |

### Business Rules

- Only visits with status `SCHEDULED` can be cancelled
- `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, and `NO_SHOW` visits cannot be cancelled

---

## Visit Status Flow

| Status | Description |
|--------|-------------|
| SCHEDULED | Visit created and scheduled |
| IN_PROGRESS | Video session active |
| COMPLETED | Session ended, consultation complete |
| CANCELLED | Visit cancelled before session start |
| NO_SHOW | Patient did not join the session |

## Visit Types

| Type | Description |
|------|-------------|
| CONSULTATION | Initial consultation |
| FOLLOW_UP | Follow-up visit |
| SECOND_OPINION | Second opinion consultation |

## Not Implemented

The following endpoints are documented in older versions of this file but are **not implemented** in the current codebase. Do not call them — they will return 404.

- `POST /api/telemedicine/visits/:visitId/start`
- `POST /api/telemedicine/visits/:visitId/join`
- `POST /api/telemedicine/visits/:visitId/end`
- `POST /api/telemedicine/visits/:visitId/attachments`
- `GET /api/telemedicine/visits/:visitId/summary`
