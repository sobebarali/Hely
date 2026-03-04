---
title: Radiology & Imaging API
description: API reference for imaging order management, scan scheduling, report creation, and radiology workflows.
---

## Overview

The Radiology & Imaging API manages the complete radiology workflow from imaging order creation through scan scheduling, image acquisition, report creation, verification, and report delivery. It supports all modalities including X-ray, CT, MRI, ultrasound, and more.

---

## Create Imaging Order

**POST** `/api/radiology/orders`

Creates a new imaging/radiology order for a patient.

### Authentication

Required. Bearer token with `RADIOLOGY:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Patient ID |
| doctorId | string | Yes | Ordering physician ID |
| appointmentId | string | No | Associated appointment ID |
| admissionId | string | No | Associated admission ID (IPD) |
| modality | string | Yes | `XRAY`, `CT`, `MRI`, `ULTRASOUND`, `MAMMOGRAPHY`, `FLUOROSCOPY`, `PET`, `DEXA` |
| bodyPart | string | Yes | Body part to image |
| laterality | string | No | `LEFT`, `RIGHT`, `BILATERAL`, `NA` |
| priority | string | No | `ROUTINE`, `URGENT`, `STAT` (default: `ROUTINE`) |
| clinicalIndication | string | Yes | Clinical reason for imaging |
| contrast | boolean | No | Whether contrast is required |
| specialInstructions | string | No | Special instructions for the technologist |
| diagnosis | string | No | Clinical diagnosis |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Imaging order ID |
| orderId | string | Unique identifier: `{tenantId}-RAD-{sequential}` |
| patientId | string | Patient ID |
| doctorId | string | Ordering physician |
| modality | string | Imaging modality |
| bodyPart | string | Body part |
| priority | string | Order priority |
| status | string | `ORDERED` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INVALID_PATIENT | Patient not found |
| 400 | INVALID_MODALITY | Invalid modality for body part |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Order ID auto-generated: `{tenantId}-RAD-{sequential}`
- STAT priority orders are flagged for immediate scheduling
- Contrast orders require allergy check against patient record
- MRI orders trigger metal implant screening check

---

## List Imaging Orders

**GET** `/api/radiology/orders`

Retrieves a paginated list of imaging orders.

### Authentication

Required. Bearer token with `RADIOLOGY:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| patientId | string | - | Filter by patient ID |
| doctorId | string | - | Filter by ordering doctor |
| modality | string | - | Filter by modality |
| status | string | - | Filter by order status |
| priority | string | - | Filter by priority |
| startDate | string | - | Filter from date (ISO 8601) |
| endDate | string | - | Filter to date (ISO 8601) |
| search | string | - | Search by order ID or patient name |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | `asc` or `desc` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of imaging order objects |
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

## Get Imaging Order

**GET** `/api/radiology/orders/:orderId`

Retrieves details of a specific imaging order.

### Authentication

Required. Bearer token with `RADIOLOGY:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | Imaging order ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Imaging order ID |
| orderId | string | Unique identifier |
| patientId | string | Patient ID |
| patient | object | Patient details |
| doctorId | string | Ordering physician ID |
| doctor | object | Doctor details |
| modality | string | Imaging modality |
| bodyPart | string | Body part |
| laterality | string | Laterality |
| priority | string | Order priority |
| clinicalIndication | string | Clinical indication |
| contrast | boolean | Contrast required |
| specialInstructions | string | Special instructions |
| status | string | Order status |
| scheduledAt | string | Scheduled date/time |
| completedAt | string | Scan completion time |
| report | object | Radiology report (if available) |
| createdAt | string | ISO 8601 timestamp |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Imaging order not found |

---

## Schedule Scan

**POST** `/api/radiology/orders/:orderId/schedule`

Schedules a scan date/time for an imaging order.

### Authentication

Required. Bearer token with `RADIOLOGY:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | Imaging order ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| scheduledAt | string | Yes | Scheduled date/time (ISO 8601) |
| room | string | No | Imaging room/suite |
| technologistId | string | No | Assigned technologist ID |
| preparationInstructions | string | No | Patient preparation instructions |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Imaging order ID |
| status | string | Updated to `SCHEDULED` |
| scheduledAt | string | Scheduled date/time |
| room | string | Assigned room |
| technologist | object | Assigned technologist |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | INVALID_STATUS | Order not in valid state for scheduling |
| 400 | SCHEDULE_CONFLICT | Room/equipment conflict at requested time |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Imaging order not found |

### Business Rules

- Order must be in `ORDERED` status
- Room/equipment availability is validated
- Patient receives notification of scheduled time

---

## Complete Scan

**POST** `/api/radiology/orders/:orderId/complete-scan`

Records that the imaging scan has been completed.

### Authentication

Required. Bearer token with `RADIOLOGY:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | Imaging order ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| performedBy | string | Yes | Technologist staff ID |
| imagesCount | number | No | Number of images acquired |
| dose | object | No | Radiation dose information |
| dose.value | number | No | Dose value |
| dose.unit | string | No | Dose unit (e.g., `mGy`, `mSv`) |
| notes | string | No | Technologist notes |
| completedAt | string | No | Completion timestamp (defaults to now) |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Imaging order ID |
| status | string | Updated to `SCAN_COMPLETED` |
| performedBy | object | Technologist details |
| imagesCount | number | Images acquired |
| completedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Order not in valid state |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Imaging order not found |

### Business Rules

- Order must be in `SCHEDULED` status
- Radiation dose is recorded for applicable modalities
- Images are stored in PACS for radiologist review

---

## Create Report

**POST** `/api/radiology/orders/:orderId/report`

Creates a radiology report for a completed scan.

### Authentication

Required. Bearer token with `RADIOLOGY:REPORT` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | Imaging order ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| findings | string | Yes | Radiologist's findings |
| impression | string | Yes | Summary impression/conclusion |
| technique | string | No | Imaging technique description |
| comparison | string | No | Comparison with prior studies |
| recommendations | string | No | Follow-up recommendations |
| criticalFinding | boolean | No | Whether this is a critical finding |
| radiologistId | string | Yes | Reporting radiologist ID |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Report ID |
| orderId | string | Imaging order ID |
| findings | string | Findings |
| impression | string | Impression |
| status | string | `DRAFT` |
| radiologist | object | Reporting radiologist |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | INVALID_STATUS | Scan not completed |
| 400 | REPORT_EXISTS | Report already exists for this order |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Imaging order not found |

### Business Rules

- Scan must be in `SCAN_COMPLETED` status
- Critical findings trigger immediate notification to ordering physician
- Report created in `DRAFT` status

---

## Verify Report

**POST** `/api/radiology/orders/:orderId/report/verify`

Verifies and finalizes a radiology report.

### Authentication

Required. Bearer token with `RADIOLOGY:VERIFY` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | Imaging order ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| verifiedBy | string | Yes | Verifying radiologist ID |
| comments | string | No | Verification comments |
| amendments | string | No | Amendments to the report |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Report ID |
| orderId | string | Imaging order ID |
| status | string | Updated to `VERIFIED` |
| verifiedBy | object | Verifying radiologist |
| verifiedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Report not in valid state for verification |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Report not found |

### Business Rules

- Report must be in `DRAFT` status
- Verifier should ideally be a different radiologist than the author
- Verified report is released to the ordering physician
- Order status transitions to `REPORTED`

---

## Get Report PDF

**GET** `/api/radiology/orders/:orderId/report/pdf`

Downloads the radiology report as a PDF.

### Authentication

Required. Bearer token with `RADIOLOGY:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | Imaging order ID |

### Response

**Status: 200 OK**

Returns a PDF file (`application/pdf`).

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | REPORT_NOT_VERIFIED | Report must be verified before PDF generation |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Order or report not found |

### Business Rules

- PDF only available after report verification
- PDF includes findings, impression, patient details, and imaging metadata

---

## Order Status Flow

| Status | Description |
|--------|-------------|
| ORDERED | Order created, awaiting scheduling |
| SCHEDULED | Scan scheduled |
| SCAN_COMPLETED | Imaging performed |
| REPORTED | Report created and verified |
| CANCELLED | Order cancelled |

## Imaging Modalities

| Modality | Description |
|----------|-------------|
| XRAY | X-ray radiography |
| CT | Computed Tomography |
| MRI | Magnetic Resonance Imaging |
| ULTRASOUND | Ultrasonography |
| MAMMOGRAPHY | Mammography |
| FLUOROSCOPY | Fluoroscopic imaging |
| PET | Positron Emission Tomography |
| DEXA | Dual-energy X-ray Absorptiometry |
