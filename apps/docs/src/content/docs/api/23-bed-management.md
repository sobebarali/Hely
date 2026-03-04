---
title: Bed & Ward Management API
description: API reference for ward configuration, bed management, patient admissions, transfers, discharges, and occupancy tracking.
---

## Overview

The Bed & Ward Management API (ADT — Admission, Discharge, Transfer) handles the complete inpatient lifecycle including ward and bed configuration, patient admissions, bed assignments, inter-ward transfers, and discharge processing. It also provides real-time occupancy dashboards.

---

## List Wards

**GET** `/api/wards`

Retrieves a list of all wards in the hospital.

### Authentication

Required. Bearer token with `WARD:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| status | string | - | Filter by status: `ACTIVE`, `INACTIVE` |
| type | string | - | Filter by ward type |
| search | string | - | Search by ward name |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of ward objects |
| data[].id | string | Ward ID |
| data[].name | string | Ward name |
| data[].type | string | Ward type |
| data[].floor | string | Floor/building location |
| data[].totalBeds | number | Total bed count |
| data[].occupiedBeds | number | Currently occupied beds |
| data[].availableBeds | number | Available beds |
| data[].status | string | Ward status |
| pagination | object | Pagination details |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Create Ward

**POST** `/api/wards`

Creates a new ward in the hospital.

### Authentication

Required. Bearer token with `WARD:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Ward name |
| type | string | Yes | `GENERAL`, `ICU`, `NICU`, `PICU`, `CCU`, `SURGICAL`, `MATERNITY`, `ISOLATION`, `EMERGENCY` |
| floor | string | Yes | Floor/building location |
| capacity | number | Yes | Maximum bed capacity |
| departmentId | string | No | Associated department ID |
| description | string | No | Ward description |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Ward ID |
| name | string | Ward name |
| type | string | Ward type |
| floor | string | Floor location |
| capacity | number | Maximum capacity |
| totalBeds | number | Current total beds (0) |
| status | string | `ACTIVE` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | DUPLICATE_NAME | Ward name already exists |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Get Ward

**GET** `/api/wards/:wardId`

Retrieves details of a specific ward including bed layout.

### Authentication

Required. Bearer token with `WARD:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| wardId | string | Ward ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Ward ID |
| name | string | Ward name |
| type | string | Ward type |
| floor | string | Floor location |
| capacity | number | Maximum capacity |
| totalBeds | number | Total beds |
| occupiedBeds | number | Occupied beds |
| availableBeds | number | Available beds |
| beds | array | Array of bed objects |
| departmentId | string | Associated department |
| status | string | Ward status |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Ward not found |

---

## List Beds

**GET** `/api/wards/:wardId/beds`

Retrieves all beds in a specific ward.

### Authentication

Required. Bearer token with `BED:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| wardId | string | Ward ID |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | - | Filter by status: `AVAILABLE`, `OCCUPIED`, `RESERVED`, `MAINTENANCE` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of bed objects |
| data[].id | string | Bed ID |
| data[].bedNumber | string | Bed number/label |
| data[].type | string | Bed type |
| data[].status | string | Bed status |
| data[].patient | object | Current patient (if occupied) |
| data[].admissionId | string | Current admission ID (if occupied) |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Ward not found |

---

## Get Bed

**GET** `/api/wards/:wardId/beds/:bedId`

Retrieves details of a specific bed.

### Authentication

Required. Bearer token with `BED:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| wardId | string | Ward ID |
| bedId | string | Bed ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Bed ID |
| bedNumber | string | Bed number/label |
| wardId | string | Ward ID |
| ward | object | Ward details |
| type | string | Bed type |
| status | string | Bed status |
| patient | object | Current patient (if occupied) |
| admissionId | string | Current admission ID |
| lastSanitized | string | Last sanitization timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Bed or ward not found |

---

## Create Bed

**POST** `/api/wards/:wardId/beds`

Adds a new bed to a ward.

### Authentication

Required. Bearer token with `BED:CREATE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| wardId | string | Ward ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| bedNumber | string | Yes | Bed number/label |
| type | string | Yes | `STANDARD`, `ELECTRIC`, `ICU`, `PEDIATRIC`, `BARIATRIC` |
| features | array | No | Bed features (e.g., `OXYGEN`, `SUCTION`, `MONITOR`) |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Bed ID |
| bedNumber | string | Bed number |
| wardId | string | Ward ID |
| type | string | Bed type |
| status | string | `AVAILABLE` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | DUPLICATE_BED | Bed number already exists in ward |
| 400 | WARD_FULL | Ward has reached maximum capacity |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Ward not found |

### Business Rules

- Bed number must be unique within the ward
- Cannot exceed ward capacity

---

## Admit Patient

**POST** `/api/admissions`

Admits a patient to a bed (creates an admission record).

### Authentication

Required. Bearer token with `ADMISSION:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Patient ID |
| wardId | string | Yes | Target ward ID |
| bedId | string | Yes | Target bed ID |
| doctorId | string | Yes | Attending physician ID |
| admissionType | string | Yes | `EMERGENCY`, `ELECTIVE`, `TRANSFER` |
| diagnosis | string | Yes | Admission diagnosis |
| expectedStay | number | No | Expected stay in days |
| notes | string | No | Admission notes |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Admission ID |
| admissionId | string | Unique identifier: `{tenantId}-ADM-{sequential}` |
| patientId | string | Patient ID |
| wardId | string | Ward ID |
| bedId | string | Bed ID |
| doctorId | string | Attending physician |
| admissionType | string | Admission type |
| status | string | `ADMITTED` |
| admittedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INVALID_PATIENT | Patient not found |
| 400 | BED_NOT_AVAILABLE | Bed is not available |
| 400 | PATIENT_ALREADY_ADMITTED | Patient already has an active admission |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Admission ID auto-generated: `{tenantId}-ADM-{sequential}`
- Bed status changes to `OCCUPIED`
- Patient type updated to `IPD`
- Only one active admission per patient at a time

---

## List Admissions

**GET** `/api/admissions`

Retrieves a paginated list of admissions.

### Authentication

Required. Bearer token with `ADMISSION:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| patientId | string | - | Filter by patient ID |
| wardId | string | - | Filter by ward |
| doctorId | string | - | Filter by attending doctor |
| status | string | - | Filter by admission status |
| admissionType | string | - | Filter by type |
| startDate | string | - | Filter from admission date |
| endDate | string | - | Filter to admission date |
| sortBy | string | admittedAt | Sort field |
| sortOrder | string | desc | `asc` or `desc` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of admission objects |
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

## Get Admission

**GET** `/api/admissions/:admissionId`

Retrieves details of a specific admission.

### Authentication

Required. Bearer token with `ADMISSION:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| admissionId | string | Admission ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Admission ID |
| admissionId | string | Unique identifier |
| patientId | string | Patient ID |
| patient | object | Patient details |
| wardId | string | Ward ID |
| ward | object | Ward details |
| bedId | string | Bed ID |
| bed | object | Bed details |
| doctorId | string | Attending physician |
| doctor | object | Doctor details |
| admissionType | string | Admission type |
| diagnosis | string | Admission diagnosis |
| status | string | Admission status |
| admittedAt | string | Admission timestamp |
| dischargedAt | string | Discharge timestamp (if discharged) |
| transfers | array | Transfer history |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Admission not found |

---

## Transfer Patient

**POST** `/api/admissions/:admissionId/transfer`

Transfers an admitted patient to a different bed or ward.

### Authentication

Required. Bearer token with `ADMISSION:TRANSFER` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| admissionId | string | Admission ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| targetWardId | string | Yes | Target ward ID |
| targetBedId | string | Yes | Target bed ID |
| reason | string | Yes | Transfer reason |
| transferDoctorId | string | No | New attending physician |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Admission ID |
| wardId | string | New ward ID |
| bedId | string | New bed ID |
| status | string | `ADMITTED` |
| transfers | array | Updated transfer history |
| transfers[].fromWard | string | Previous ward |
| transfers[].fromBed | string | Previous bed |
| transfers[].toWard | string | New ward |
| transfers[].toBed | string | New bed |
| transfers[].reason | string | Transfer reason |
| transfers[].transferredAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | BED_NOT_AVAILABLE | Target bed is not available |
| 400 | INVALID_STATUS | Patient not currently admitted |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Admission not found |

### Business Rules

- Previous bed status changes to `AVAILABLE` (requires sanitization)
- Target bed status changes to `OCCUPIED`
- Transfer history is maintained
- Optionally change the attending physician

---

## Discharge Patient

**POST** `/api/admissions/:admissionId/discharge`

Discharges an admitted patient.

### Authentication

Required. Bearer token with `ADMISSION:DISCHARGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| admissionId | string | Admission ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| dischargeType | string | Yes | `NORMAL`, `AGAINST_ADVICE`, `TRANSFERRED`, `DECEASED` |
| dischargeSummary | string | Yes | Discharge summary |
| followUpDate | string | No | Recommended follow-up date |
| followUpInstructions | string | No | Follow-up instructions |
| medications | array | No | Discharge medications |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Admission ID |
| status | string | Updated to `DISCHARGED` |
| dischargeType | string | Type of discharge |
| dischargeSummary | string | Discharge summary |
| dischargedAt | string | ISO 8601 timestamp |
| lengthOfStay | number | Total days stayed |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | INVALID_STATUS | Patient not currently admitted |
| 400 | PENDING_BILLS | Outstanding bills must be settled |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Admission not found |

### Business Rules

- Patient must be in `ADMITTED` status
- Bed status changes to `MAINTENANCE` (pending sanitization)
- Length of stay is calculated automatically
- Patient type reverts to `OPD`
- Outstanding bills should be settled before discharge

---

## Bed Occupancy Dashboard

**GET** `/api/wards/occupancy`

Retrieves real-time bed occupancy statistics across all wards.

### Authentication

Required. Bearer token with `WARD:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| wardId | string | - | Filter by specific ward |
| type | string | - | Filter by ward type |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| summary | object | Overall summary |
| summary.totalBeds | number | Total beds in hospital |
| summary.occupiedBeds | number | Currently occupied |
| summary.availableBeds | number | Available for admission |
| summary.maintenanceBeds | number | Under maintenance |
| summary.occupancyRate | number | Overall occupancy percentage |
| wards | array | Per-ward breakdown |
| wards[].wardId | string | Ward ID |
| wards[].name | string | Ward name |
| wards[].type | string | Ward type |
| wards[].totalBeds | number | Total beds |
| wards[].occupiedBeds | number | Occupied beds |
| wards[].availableBeds | number | Available beds |
| wards[].occupancyRate | number | Occupancy percentage |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Admission Status Flow

| Status | Description |
|--------|-------------|
| ADMITTED | Patient currently admitted |
| DISCHARGED | Patient discharged |
| TRANSFERRED_OUT | Patient transferred to another facility |

## Bed Status Flow

| Status | Description |
|--------|-------------|
| AVAILABLE | Bed available for admission |
| OCCUPIED | Bed currently in use |
| RESERVED | Bed reserved for incoming patient |
| MAINTENANCE | Bed under maintenance/sanitization |

## Ward Types

| Type | Description |
|------|-------------|
| GENERAL | General ward |
| ICU | Intensive Care Unit |
| NICU | Neonatal ICU |
| PICU | Pediatric ICU |
| CCU | Coronary Care Unit |
| SURGICAL | Surgical ward |
| MATERNITY | Maternity ward |
| ISOLATION | Isolation ward |
| EMERGENCY | Emergency ward |
