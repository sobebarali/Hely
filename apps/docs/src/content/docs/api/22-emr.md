---
title: Electronic Medical Records API
description: API reference for clinical notes, medical history, problem lists, and patient timeline management.
---

## Overview

The Electronic Medical Records (EMR) API provides comprehensive clinical documentation capabilities including creating and managing clinical notes, maintaining medical histories, managing problem lists, and viewing unified patient timelines.

---

## Create Clinical Note

**POST** `/api/emr/notes`

Creates a new clinical note for a patient encounter.

### Authentication

Required. Bearer token with `EMR:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Patient ID |
| encounterId | string | No | Associated encounter/appointment ID |
| admissionId | string | No | Associated admission ID (IPD) |
| type | string | Yes | `SOAP`, `PROGRESS`, `PROCEDURE`, `DISCHARGE`, `CONSULTATION`, `OPERATIVE` |
| chiefComplaint | string | No | Chief complaint |
| subjective | string | No | Subjective findings (SOAP) |
| objective | string | No | Objective findings (SOAP) |
| assessment | string | No | Assessment (SOAP) |
| plan | string | No | Treatment plan (SOAP) |
| content | string | No | Free-text note content (non-SOAP types) |
| diagnosis | array | No | Array of diagnosis codes |
| diagnosis[].code | string | Yes | ICD-10 code |
| diagnosis[].description | string | Yes | Diagnosis description |
| diagnosis[].type | string | Yes | `PRIMARY`, `SECONDARY` |
| procedures | array | No | Procedures performed |
| procedures[].code | string | Yes | Procedure code |
| procedures[].description | string | Yes | Procedure description |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Clinical note ID |
| noteId | string | Unique identifier: `{tenantId}-NOTE-{sequential}` |
| patientId | string | Patient ID |
| type | string | Note type |
| status | string | `DRAFT` |
| authorId | string | Author's staff ID |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INVALID_PATIENT | Patient not found |
| 400 | INVALID_NOTE_TYPE | Invalid note type |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Note ID auto-generated: `{tenantId}-NOTE-{sequential}`
- Notes created in `DRAFT` status
- SOAP notes should have subjective, objective, assessment, and plan fields
- Author automatically set from the authenticated user

---

## List Clinical Notes

**GET** `/api/emr/notes`

Retrieves a paginated list of clinical notes.

### Authentication

Required. Bearer token with `EMR:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| patientId | string | - | Filter by patient ID |
| type | string | - | Filter by note type |
| status | string | - | Filter by note status |
| authorId | string | - | Filter by author |
| startDate | string | - | Filter from date (ISO 8601) |
| endDate | string | - | Filter to date (ISO 8601) |
| search | string | - | Full-text search in note content |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | `asc` or `desc` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of clinical note objects |
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

## Get Clinical Note

**GET** `/api/emr/notes/:noteId`

Retrieves a specific clinical note with full details.

### Authentication

Required. Bearer token with `EMR:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| noteId | string | Clinical note ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Clinical note ID (internal UUID) |
| noteId | string | Unique human-readable identifier |
| patientId | string | Patient ID |
| encounterId | string | Associated encounter ID (if provided) |
| type | string | Note type |
| chiefComplaint | string | Chief complaint (if set) |
| subjective | string | Subjective findings (if set) |
| objective | string | Objective findings (if set) |
| assessment | string | Assessment (if set) |
| plan | string | Treatment plan (if set) |
| content | string | Free-text content (if set) |
| diagnosis | array | Diagnosis codes |
| procedures | array | Procedures |
| status | string | Note status |
| authorId | string | Author's staff ID |
| signedBy | string | Staff ID of signer (if signed) |
| signedAt | string | Sign timestamp (if signed) |
| amendments | array | Note amendments |
| amendments[].reason | string | Amendment reason |
| amendments[].content | string | Amendment content |
| amendments[].amendedBy | string | Staff ID who amended |
| amendments[].amendedAt | string | ISO 8601 amendment timestamp |
| createdAt | string | ISO 8601 timestamp |
| updatedAt | string | ISO 8601 timestamp |

**Note**: The `patient` and `author` fields shown in earlier versions are not populated — the response contains `authorId` (string) and `signedBy` (string ID), not expanded objects.

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Clinical note not found |

---

## Update Clinical Note

**PUT** `/api/emr/notes/:noteId`

Updates a draft clinical note.

### Authentication

Required. Bearer token with `EMR:UPDATE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| noteId | string | Clinical note ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| chiefComplaint | string | No | Updated chief complaint |
| subjective | string | No | Updated subjective findings |
| objective | string | No | Updated objective findings |
| assessment | string | No | Updated assessment |
| plan | string | No | Updated treatment plan |
| content | string | No | Updated free-text content |
| diagnosis | array | No | Updated diagnosis codes |
| procedures | array | No | Updated procedures |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Clinical note ID (internal UUID) |
| status | string | Note status (`DRAFT`) |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Invalid fields |
| 400 | NOTE_ALREADY_SIGNED | Cannot edit a signed note |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions or not the author |
| 404 | NOT_FOUND | Clinical note not found |

### Business Rules

- Only `DRAFT` notes can be updated (returns 400 `NOTE_ALREADY_SIGNED` for any non-DRAFT status, including `AMENDED`)
- Only the original author can update a note (returns 403 `FORBIDDEN`)
- Signed notes must be amended instead of updated

---

## Sign Clinical Note

**POST** `/api/emr/notes/:noteId/sign`

Signs and finalizes a clinical note, making it part of the permanent medical record.

### Authentication

Required. Bearer token with `EMR:SIGN` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| noteId | string | Clinical note ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Clinical note ID (internal UUID) |
| status | string | Updated to `SIGNED` |
| signedBy | string | Staff ID who signed |
| signedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Note not in valid state for signing |
| 400 | INCOMPLETE_NOTE | Required fields missing for sign-off |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Clinical note not found |

### Business Rules

- Note must be in `DRAFT` status (returns 400 `INVALID_STATUS` otherwise)
- Any authenticated staff member with `EMR:SIGN` permission can sign (the "author or supervising physician only" restriction is not enforced in the current implementation)
- Signing is irreversible — note becomes part of the permanent record
- Status transitions to `SIGNED`

---

## Amend Clinical Note

**POST** `/api/emr/notes/:noteId/amend`

Adds an amendment to a signed clinical note.

### Authentication

Required. Bearer token with `EMR:AMEND` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| noteId | string | Clinical note ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | Yes | Reason for amendment |
| content | string | Yes | Amendment content |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Clinical note ID (internal UUID) |
| status | string | `AMENDED` |
| amendments | array | List of all amendments (full history) |
| amendments[].reason | string | Amendment reason |
| amendments[].content | string | Amendment content |
| amendments[].amendedBy | string | Staff ID who amended |
| amendments[].amendedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Note must be signed to amend |
| 400 | INVALID_REQUEST | Missing reason or content |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Clinical note not found |

### Business Rules

- Only `SIGNED` or `AMENDED` notes can be amended (returns 400 `INVALID_STATUS` for `DRAFT`)
- Original content is preserved; amendment is appended
- Full audit trail of all amendments is maintained
- Multiple sequential amendments are allowed

---

## Get Medical History

**GET** `/api/emr/patients/:patientId/history`

Retrieves the comprehensive medical history for a patient.

### Authentication

Required. Bearer token with `EMR:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| patientId | string | Patient ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| patientId | string | Patient ID |
| allergies | array | Known allergies |
| allergies[].allergen | string | Allergen name |
| allergies[].reaction | string | Reaction type |
| allergies[].severity | string | `MILD`, `MODERATE`, `SEVERE` |
| medications | array | Current medications |
| surgicalHistory | array | Past surgeries |
| familyHistory | array | Family medical history |
| socialHistory | object | Social history (smoking, alcohol, etc.) |
| immunizations | array | Immunization records |
| pastMedicalHistory | array | Past medical conditions |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Patient not found |

---

## Update Medical History

**PUT** `/api/emr/patients/:patientId/history`

Updates a patient's medical history.

### Authentication

Required. Bearer token with `EMR:UPDATE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| patientId | string | Patient ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| allergies | array | No | Updated allergies list |
| medications | array | No | Updated current medications |
| surgicalHistory | array | No | Updated surgical history |
| familyHistory | array | No | Updated family history |
| socialHistory | object | No | Updated social history |
| immunizations | array | No | Updated immunizations |
| pastMedicalHistory | array | No | Updated past medical conditions |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| patientId | string | Patient ID |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Invalid fields |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Patient not found |

### Business Rules

- Uses upsert semantics: creates the history document on first call, updates on subsequent calls
- Partial updates are supported: only fields included in the request body are updated; omitted fields retain their existing values
- The auditing and medication interaction checking described below are not implemented in the current version

---

## Get Problem List

**GET** `/api/emr/patients/:patientId/problems`

Retrieves the active problem list for a patient.

### Authentication

Required. Bearer token with `EMR:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| patientId | string | Patient ID |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | `ACTIVE` | Filter by status: `ACTIVE`, `RESOLVED`, or `ALL` (returns all regardless of status) |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of problem entries |
| data[].id | string | Problem ID |
| data[].code | string | ICD-10 code |
| data[].description | string | Problem description |
| data[].status | string | `ACTIVE` or `RESOLVED` |
| data[].onsetDate | string | Date problem was identified |
| data[].resolvedDate | string | Date problem was resolved |
| data[].addedBy | string | Staff ID who added |
| data[].createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Patient not found |

---

## Add Problem

**POST** `/api/emr/patients/:patientId/problems`

Adds a problem to the patient's problem list.

### Authentication

Required. Bearer token with `EMR:CREATE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| patientId | string | Patient ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | Yes | ICD-10 diagnosis code |
| description | string | Yes | Problem description |
| onsetDate | string | No | Date problem began (ISO 8601) |
| notes | string | No | Additional notes |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Problem ID (internal UUID) |
| code | string | ICD-10 code |
| description | string | Problem description |
| status | string | `ACTIVE` |
| onsetDate | string | Onset date (ISO 8601, if provided) |
| addedBy | string | Staff ID who added |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | DUPLICATE_PROBLEM | Problem already exists in active list |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Patient not found |

---

## Patient Timeline

**GET** `/api/emr/patients/:patientId/timeline`

Retrieves a unified timeline of all clinical events for a patient.

### Authentication

Required. Bearer token with `EMR:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| patientId | string | Patient ID |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| type | string | - | Filter by event type: `NOTE`, `VITALS`, `LAB`, `PRESCRIPTION`, `APPOINTMENT`, `ADMISSION` |
| startDate | string | - | Filter from date (ISO 8601) |
| endDate | string | - | Filter to date (ISO 8601) |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of timeline events |
| data[].id | string | Event ID |
| data[].type | string | Event type |
| data[].title | string | Event title/summary |
| data[].description | string | Event description |
| data[].metadata | object | Type-specific metadata |
| data[].author | object | Staff responsible (contains only `id` field: `{ id: string }`, present when `authorId` exists on the source record) |
| data[].occurredAt | string | ISO 8601 timestamp |
| pagination | object | Pagination details |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Patient not found |

### Business Rules

- Timeline aggregates events from: clinical notes, vitals, lab orders, prescriptions, appointments, and admissions
- Events sorted by occurrence date (newest first)
- Pagination is applied in-memory after fetching all matching events (not at the database level); for patients with very large histories this may have performance implications
- The `total` in the pagination response reflects the count of events for the requested filters, not just the current page

---

## Note Status Flow

| Status | Description |
|--------|-------------|
| DRAFT | Note created, can be edited |
| SIGNED | Note signed, part of permanent record |
| AMENDED | Signed note with amendments |

## Note Types

| Type | Description |
|------|-------------|
| SOAP | Subjective, Objective, Assessment, Plan format |
| PROGRESS | Progress note |
| PROCEDURE | Procedure documentation |
| DISCHARGE | Discharge summary |
| CONSULTATION | Consultation note |
| OPERATIVE | Operative note |
