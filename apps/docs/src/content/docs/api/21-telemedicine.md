---
title: Telemedicine API
description: API reference for virtual visit management, video session handling, and telemedicine workflows.
---

## Overview

The Telemedicine API enables virtual healthcare consultations through video sessions. It covers the full workflow from scheduling virtual visits, managing real-time sessions, to generating consultation summaries.

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
| doctorId | string | Yes | Doctor ID |
| scheduledAt | string | Yes | Scheduled date/time (ISO 8601) |
| duration | number | No | Expected duration in minutes (default: 30) |
| reason | string | Yes | Reason for visit |
| type | string | No | `CONSULTATION`, `FOLLOW_UP`, `SECOND_OPINION` (default: `CONSULTATION`) |
| notes | string | No | Additional notes |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Virtual visit ID |
| visitId | string | Unique identifier: `{tenantId}-TM-{sequential}` |
| patientId | string | Patient ID |
| doctorId | string | Doctor ID |
| scheduledAt | string | Scheduled date/time |
| duration | number | Expected duration (minutes) |
| type | string | Visit type |
| status | string | `SCHEDULED` |
| joinUrl | string | URL for joining the session |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INVALID_PATIENT | Patient not found |
| 400 | INVALID_DOCTOR | Doctor not found |
| 400 | SCHEDULE_CONFLICT | Doctor has a conflicting appointment |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Visit ID auto-generated: `{tenantId}-TM-{sequential}`
- Scheduled time must be in the future
- Doctor availability is validated before booking
- Join URL generated for both patient and doctor

---

## List Virtual Visits

**GET** `/api/telemedicine/visits`

Retrieves a paginated list of virtual visits.

### Authentication

Required. Bearer token with `TELEMEDICINE:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| patientId | string | - | Filter by patient ID |
| doctorId | string | - | Filter by doctor ID |
| status | string | - | Filter by visit status |
| type | string | - | Filter by visit type |
| startDate | string | - | Filter from date (ISO 8601) |
| endDate | string | - | Filter to date (ISO 8601) |
| sortBy | string | scheduledAt | Sort field |
| sortOrder | string | desc | `asc` or `desc` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of virtual visit objects |
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

## Get Virtual Visit

**GET** `/api/telemedicine/visits/:visitId`

Retrieves details of a specific virtual visit.

### Authentication

Required. Bearer token with `TELEMEDICINE:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| visitId | string | Virtual visit ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Virtual visit ID |
| visitId | string | Unique identifier |
| patientId | string | Patient ID |
| patient | object | Patient details |
| doctorId | string | Doctor ID |
| doctor | object | Doctor details |
| scheduledAt | string | Scheduled date/time |
| duration | number | Expected duration (minutes) |
| type | string | Visit type |
| reason | string | Reason for visit |
| status | string | Visit status |
| joinUrl | string | Session join URL |
| attachments | array | Uploaded attachments |
| summary | object | Consultation summary (if completed) |
| createdAt | string | ISO 8601 timestamp |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Virtual visit not found |

---

## Start Session

**POST** `/api/telemedicine/visits/:visitId/start`

Starts the video session for a virtual visit.

### Authentication

Required. Bearer token with `TELEMEDICINE:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| visitId | string | Virtual visit ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Virtual visit ID |
| status | string | Updated to `IN_PROGRESS` |
| sessionToken | string | Video session token |
| sessionUrl | string | Video session URL |
| startedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Visit not in valid state to start |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Virtual visit not found |

### Business Rules

- Visit must be in `SCHEDULED` status
- Only the assigned doctor can start the session
- Session token expires after the scheduled duration + 15 minutes

---

## Join Session

**POST** `/api/telemedicine/visits/:visitId/join`

Joins an active video session.

### Authentication

Required. Bearer token with `TELEMEDICINE:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| visitId | string | Virtual visit ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Virtual visit ID |
| sessionToken | string | Participant session token |
| sessionUrl | string | Video session URL |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | SESSION_NOT_STARTED | Session has not been started yet |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Not a participant of this visit |
| 404 | NOT_FOUND | Virtual visit not found |

### Business Rules

- Session must be in `IN_PROGRESS` status
- Only the assigned patient and doctor can join

---

## End Session

**POST** `/api/telemedicine/visits/:visitId/end`

Ends the video session for a virtual visit.

### Authentication

Required. Bearer token with `TELEMEDICINE:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| visitId | string | Virtual visit ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Virtual visit ID |
| status | string | Updated to `COMPLETED` |
| duration | number | Actual session duration (minutes) |
| endedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Visit not in valid state to end |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Virtual visit not found |

### Business Rules

- Visit must be in `IN_PROGRESS` status
- Only the assigned doctor can end the session
- Actual duration is calculated and recorded

---

## Cancel Visit

**POST** `/api/telemedicine/visits/:visitId/cancel`

Cancels a scheduled virtual visit.

### Authentication

Required. Bearer token with `TELEMEDICINE:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| visitId | string | Virtual visit ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | Yes | Cancellation reason |
| cancelledBy | string | Yes | Staff or patient ID who cancelled |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Virtual visit ID |
| status | string | Updated to `CANCELLED` |
| cancellationReason | string | Reason for cancellation |
| cancelledAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Visit cannot be cancelled in current state |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Virtual visit not found |

### Business Rules

- Only `SCHEDULED` visits can be cancelled
- In-progress sessions must be ended, not cancelled

---

## Upload Attachment

**POST** `/api/telemedicine/visits/:visitId/attachments`

Uploads a file attachment to a virtual visit (e.g., prescriptions, reports).

### Authentication

Required. Bearer token with `TELEMEDICINE:CREATE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| visitId | string | Virtual visit ID |

### Request Body

Multipart form data:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | File to upload (max 10MB) |
| description | string | No | File description |
| type | string | No | `PRESCRIPTION`, `LAB_REPORT`, `IMAGING`, `OTHER` |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Attachment ID |
| fileName | string | Original file name |
| fileSize | number | File size in bytes |
| type | string | Attachment type |
| url | string | Download URL |
| uploadedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing file or invalid format |
| 400 | FILE_TOO_LARGE | File exceeds 10MB limit |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Virtual visit not found |

---

## Get Consultation Summary

**GET** `/api/telemedicine/visits/:visitId/summary`

Retrieves the consultation summary for a completed virtual visit.

### Authentication

Required. Bearer token with `TELEMEDICINE:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| visitId | string | Virtual visit ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Summary ID |
| visitId | string | Virtual visit ID |
| chiefComplaint | string | Patient's chief complaint |
| findings | string | Doctor's findings |
| diagnosis | string | Diagnosis |
| prescriptions | array | Prescribed medications |
| followUpDate | string | Recommended follow-up date |
| notes | string | Additional notes |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | VISIT_NOT_COMPLETED | Summary only available for completed visits |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Virtual visit not found |

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
