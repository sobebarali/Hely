---
title: Lab & Diagnostics API
description: API reference for laboratory test ordering, sample collection, result entry, and test catalog management.
---

## Overview

The Lab & Diagnostics API manages the full lifecycle of laboratory testing — from order creation and sample collection through result entry, verification, and report generation. It also provides test catalog management for configuring available tests.

---

## Create Lab Order

**POST** `/api/lab/orders`

Creates a new laboratory test order for a patient.

### Authentication

Required. Bearer token with `LAB:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Patient ID |
| appointmentId | string | No | Associated appointment ID |
| admissionId | string | No | Associated admission ID (IPD) |
| doctorId | string | Yes | Ordering physician ID |
| tests | array | Yes | Array of test objects |
| tests[].testId | string | Yes | Test catalog ID |
| tests[].priority | string | No | `ROUTINE`, `URGENT`, `STAT` (default: `ROUTINE`) |
| tests[].clinicalNotes | string | No | Clinical notes for the test |
| diagnosis | string | No | Clinical diagnosis or indication |
| notes | string | No | Additional order notes |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Lab order ID |
| orderId | string | Unique order identifier: `{tenantId}-LAB-{sequential}` |
| patientId | string | Patient ID |
| doctorId | string | Ordering physician ID |
| tests | array | Array of ordered tests with status |
| status | string | Order status: `ORDERED` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INVALID_PATIENT | Patient not found |
| 400 | INVALID_TEST | One or more test IDs not found in catalog |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Order ID auto-generated: `{tenantId}-LAB-{sequential}`
- At least one test is required per order
- STAT priority orders are flagged for immediate processing
- Orders linked to appointment or admission if provided

---

## List Lab Orders

**GET** `/api/lab/orders`

Retrieves a paginated list of lab orders with optional filters.

### Authentication

Required. Bearer token with `LAB:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| patientId | string | - | Filter by patient ID |
| doctorId | string | - | Filter by ordering doctor |
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
| data | array | Array of lab order objects |
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

## Get Lab Order

**GET** `/api/lab/orders/:orderId`

Retrieves details of a specific lab order including test results.

### Authentication

Required. Bearer token with `LAB:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | Lab order ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Lab order ID |
| orderId | string | Unique order identifier |
| patientId | string | Patient ID |
| patient | object | Patient details |
| doctorId | string | Ordering physician ID |
| doctor | object | Doctor details |
| tests | array | Array of test objects with results |
| tests[].testId | string | Test catalog ID |
| tests[].name | string | Test name |
| tests[].status | string | Test status |
| tests[].results | object | Test results (if available) |
| status | string | Order status |
| diagnosis | string | Clinical diagnosis |
| notes | string | Order notes |
| createdAt | string | ISO 8601 timestamp |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Lab order not found |

---

## Collect Sample

**POST** `/api/lab/orders/:orderId/collect`

Records sample collection for a lab order.

### Authentication

Required. Bearer token with `LAB:COLLECT` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | Lab order ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| sampleType | string | Yes | `BLOOD`, `URINE`, `STOOL`, `SWAB`, `TISSUE`, `CSF`, `OTHER` |
| collectedBy | string | Yes | Staff ID who collected the sample |
| collectedAt | string | No | Collection timestamp (defaults to now) |
| sampleId | string | No | External sample barcode/ID |
| notes | string | No | Collection notes |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Lab order ID |
| status | string | Updated to `SAMPLE_COLLECTED` |
| sampleDetails | object | Sample collection details |
| sampleDetails.sampleType | string | Type of sample |
| sampleDetails.collectedBy | object | Staff who collected |
| sampleDetails.collectedAt | string | ISO 8601 timestamp |
| sampleDetails.sampleId | string | Sample identifier |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | INVALID_STATUS | Order not in valid state for collection |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Lab order not found |

### Business Rules

- Order must be in `ORDERED` status
- Sample ID generated automatically if not provided
- Status transitions to `SAMPLE_COLLECTED`

---

## Enter Results

**POST** `/api/lab/orders/:orderId/results`

Enters test results for a lab order.

### Authentication

Required. Bearer token with `LAB:RESULT` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | Lab order ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| results | array | Yes | Array of result entries |
| results[].testId | string | Yes | Test catalog ID |
| results[].value | string | Yes | Result value |
| results[].unit | string | No | Unit of measurement |
| results[].normalRange | string | No | Reference range |
| results[].flag | string | No | `NORMAL`, `LOW`, `HIGH`, `CRITICAL` |
| results[].interpretation | string | No | Result interpretation |
| enteredBy | string | Yes | Lab technician staff ID |
| notes | string | No | Additional notes |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Lab order ID |
| status | string | Updated to `RESULTS_ENTERED` |
| tests | array | Tests with entered results |
| enteredBy | object | Staff who entered results |
| enteredAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | INVALID_STATUS | Order not in valid state for result entry |
| 400 | INVALID_TEST | Test ID not part of this order |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Lab order not found |

### Business Rules

- Order must be in `SAMPLE_COLLECTED` status
- All tests in the order must have results entered
- Critical values trigger automatic alerts
- Status transitions to `RESULTS_ENTERED`

---

## Verify Results

**POST** `/api/lab/orders/:orderId/verify`

Verifies and approves entered lab results for release.

### Authentication

Required. Bearer token with `LAB:VERIFY` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | Lab order ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| verifiedBy | string | Yes | Pathologist/supervisor staff ID |
| comments | string | No | Verification comments |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Lab order ID |
| status | string | Updated to `VERIFIED` |
| verifiedBy | object | Staff who verified |
| verifiedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Order not in valid state for verification |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Lab order not found |

### Business Rules

- Order must be in `RESULTS_ENTERED` status
- Verifier must be different from the person who entered results
- Once verified, results are released to the ordering physician
- Status transitions to `VERIFIED`

---

## Get Report PDF

**GET** `/api/lab/orders/:orderId/report`

Generates and downloads the lab report as a PDF.

### Authentication

Required. Bearer token with `LAB:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| orderId | string | Lab order ID |

### Response

**Status: 200 OK**

Returns a PDF file (`application/pdf`).

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | RESULTS_NOT_VERIFIED | Results must be verified before generating report |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Lab order not found |

### Business Rules

- Report only available after results are verified
- PDF includes patient details, test results, reference ranges, and flags

---

## List Test Catalog

**GET** `/api/lab/tests`

Retrieves the available test catalog.

### Authentication

Required. Bearer token with `LAB:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Results per page (max 200) |
| category | string | - | Filter by test category |
| search | string | - | Search by test name or code |
| status | string | ACTIVE | Filter by status |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of test catalog entries |
| data[].id | string | Test ID |
| data[].name | string | Test name |
| data[].code | string | Test code |
| data[].category | string | Test category |
| data[].sampleType | string | Required sample type |
| data[].turnaroundTime | string | Expected turnaround time |
| data[].price | number | Test price |
| data[].status | string | `ACTIVE` or `INACTIVE` |
| pagination | object | Pagination details |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Add Test to Catalog

**POST** `/api/lab/tests`

Adds a new test to the laboratory test catalog.

### Authentication

Required. Bearer token with `LAB:MANAGE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Test name |
| code | string | Yes | Unique test code |
| category | string | Yes | Test category (e.g., `HEMATOLOGY`, `BIOCHEMISTRY`, `MICROBIOLOGY`) |
| sampleType | string | Yes | Required sample type |
| turnaroundTime | string | Yes | Expected turnaround time (e.g., `2h`, `24h`, `48h`) |
| price | number | Yes | Test price |
| referenceRanges | array | No | Normal reference ranges |
| referenceRanges[].gender | string | No | `MALE`, `FEMALE`, `ALL` |
| referenceRanges[].ageGroup | string | No | Age group (e.g., `ADULT`, `PEDIATRIC`) |
| referenceRanges[].min | number | No | Minimum normal value |
| referenceRanges[].max | number | No | Maximum normal value |
| referenceRanges[].unit | string | No | Unit of measurement |
| description | string | No | Test description |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Test catalog ID |
| name | string | Test name |
| code | string | Test code |
| category | string | Test category |
| sampleType | string | Required sample type |
| turnaroundTime | string | Expected turnaround time |
| price | number | Test price |
| status | string | `ACTIVE` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | DUPLICATE_CODE | Test code already exists |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Order Status Flow

| Status | Description |
|--------|-------------|
| ORDERED | Order created, awaiting sample collection |
| SAMPLE_COLLECTED | Sample collected, awaiting processing |
| RESULTS_ENTERED | Results entered by lab technician |
| VERIFIED | Results verified by pathologist |
| CANCELLED | Order cancelled |

## Test Categories

| Category | Description |
|----------|-------------|
| HEMATOLOGY | Blood count and related tests |
| BIOCHEMISTRY | Chemical analysis of body fluids |
| MICROBIOLOGY | Culture and sensitivity tests |
| IMMUNOLOGY | Immune system tests |
| PATHOLOGY | Tissue examination |
| SEROLOGY | Blood serum tests |
| URINALYSIS | Urine analysis |
