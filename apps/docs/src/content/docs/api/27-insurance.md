---
title: Insurance & Claims API
description: API reference for managing patient insurance information, claim submissions, and insurance provider operations.
---

## Overview

The Insurance & Claims API handles patient insurance management, eligibility verification, claim submissions, and insurance provider configuration. It supports the full claims lifecycle from submission through adjudication and payment tracking.

---

## Add Patient Insurance

**POST** `/api/patients/:patientId/insurance`

Adds insurance information to a patient's record.

### Authentication

Required. Bearer token with `INSURANCE:CREATE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| patientId | string | Patient ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| providerId | string | Yes | Insurance provider ID |
| policyNumber | string | Yes | Policy/member number |
| groupNumber | string | No | Group number |
| planType | string | Yes | `HMO`, `PPO`, `EPO`, `POS`, `GOVERNMENT`, `SELF_PAY` |
| subscriberName | string | Yes | Name of policy subscriber |
| subscriberRelation | string | Yes | `SELF`, `SPOUSE`, `CHILD`, `OTHER` |
| effectiveDate | string | Yes | Coverage start date (ISO 8601) |
| expirationDate | string | No | Coverage end date (ISO 8601) |
| isPrimary | boolean | No | Is primary insurance (default: true) |
| copay | number | No | Copay amount |
| deductible | number | No | Annual deductible |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Insurance record ID |
| patientId | string | Patient ID |
| providerId | string | Insurance provider ID |
| provider | object | Provider details |
| policyNumber | string | Policy number |
| planType | string | Plan type |
| isPrimary | boolean | Primary insurance flag |
| status | string | `ACTIVE` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INVALID_PROVIDER | Insurance provider not found |
| 400 | DUPLICATE_POLICY | Policy number already exists for patient |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Patient not found |

---

## List Patient Insurance

**GET** `/api/patients/:patientId/insurance`

Retrieves all insurance records for a patient.

### Authentication

Required. Bearer token with `INSURANCE:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| patientId | string | Patient ID |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | ACTIVE | Filter by status: `ACTIVE`, `EXPIRED`, `ALL` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of insurance records |
| data[].id | string | Insurance record ID |
| data[].providerId | string | Provider ID |
| data[].provider | object | Provider details |
| data[].policyNumber | string | Policy number |
| data[].planType | string | Plan type |
| data[].isPrimary | boolean | Primary flag |
| data[].status | string | Record status |
| data[].effectiveDate | string | Coverage start |
| data[].expirationDate | string | Coverage end |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Patient not found |

---

## Verify Insurance

**POST** `/api/patients/:patientId/insurance/:insuranceId/verify`

Verifies insurance eligibility and coverage for a patient.

### Authentication

Required. Bearer token with `INSURANCE:VERIFY` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| patientId | string | Patient ID |
| insuranceId | string | Insurance record ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| serviceDate | string | No | Date of service (defaults to today) |
| serviceType | string | No | Type of service for coverage check |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Insurance record ID |
| verified | boolean | Verification result |
| eligibility | object | Eligibility details |
| eligibility.active | boolean | Policy currently active |
| eligibility.effectiveDate | string | Coverage start date |
| eligibility.expirationDate | string | Coverage end date |
| coverage | object | Coverage details |
| coverage.copay | number | Copay amount |
| coverage.deductible | number | Annual deductible |
| coverage.deductibleMet | number | Deductible amount met |
| coverage.outOfPocketMax | number | Out-of-pocket maximum |
| coverage.coinsurance | number | Coinsurance percentage |
| verifiedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | VERIFICATION_FAILED | Unable to verify with provider |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Insurance record not found |

### Business Rules

- Verification checks real-time eligibility with the insurance provider
- Results are cached for 24 hours
- Coverage details reflect the specific plan benefits

---

## Submit Claim

**POST** `/api/claims`

Submits a new insurance claim.

### Authentication

Required. Bearer token with `CLAIM:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Patient ID |
| insuranceId | string | Yes | Patient's insurance record ID |
| encounterId | string | No | Associated encounter/visit ID |
| admissionId | string | No | Associated admission ID |
| claimType | string | Yes | `PROFESSIONAL`, `INSTITUTIONAL`, `PHARMACY` |
| diagnosis | array | Yes | Array of ICD-10 diagnosis codes |
| diagnosis[].code | string | Yes | ICD-10 code |
| diagnosis[].type | string | Yes | `PRINCIPAL`, `SECONDARY` |
| services | array | Yes | Array of service line items |
| services[].code | string | Yes | CPT/HCPCS procedure code |
| services[].description | string | Yes | Service description |
| services[].quantity | number | Yes | Quantity |
| services[].unitPrice | number | Yes | Unit price |
| services[].serviceDate | string | Yes | Date of service (ISO 8601) |
| totalAmount | number | Yes | Total claim amount |
| notes | string | No | Additional claim notes |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Claim ID |
| claimId | string | Unique identifier: `{tenantId}-CLM-{sequential}` |
| patientId | string | Patient ID |
| insuranceId | string | Insurance record ID |
| claimType | string | Claim type |
| totalAmount | number | Total claim amount |
| status | string | `SUBMITTED` |
| submittedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INVALID_INSURANCE | Insurance record not found or inactive |
| 400 | INVALID_DIAGNOSIS | Invalid diagnosis codes |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Claim ID auto-generated: `{tenantId}-CLM-{sequential}`
- At least one diagnosis and one service line required
- Insurance must be active and verified
- Claims submitted electronically to the provider

---

## List Claims

**GET** `/api/claims`

Retrieves a paginated list of insurance claims.

### Authentication

Required. Bearer token with `CLAIM:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| patientId | string | - | Filter by patient |
| insuranceId | string | - | Filter by insurance |
| status | string | - | Filter by claim status |
| claimType | string | - | Filter by claim type |
| startDate | string | - | Filter from submission date |
| endDate | string | - | Filter to submission date |
| sortBy | string | submittedAt | Sort field |
| sortOrder | string | desc | `asc` or `desc` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of claim objects |
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

## Get Claim

**GET** `/api/claims/:claimId`

Retrieves details of a specific claim.

### Authentication

Required. Bearer token with `CLAIM:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| claimId | string | Claim ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Claim ID |
| claimId | string | Unique identifier |
| patientId | string | Patient ID |
| patient | object | Patient details |
| insuranceId | string | Insurance record ID |
| insurance | object | Insurance details |
| claimType | string | Claim type |
| diagnosis | array | Diagnosis codes |
| services | array | Service line items |
| totalAmount | number | Total claim amount |
| approvedAmount | number | Approved amount (if adjudicated) |
| paidAmount | number | Paid amount |
| patientResponsibility | number | Patient's responsibility |
| status | string | Claim status |
| statusHistory | array | Status change history |
| denialReason | string | Denial reason (if denied) |
| submittedAt | string | Submission timestamp |
| adjudicatedAt | string | Adjudication timestamp |
| paidAt | string | Payment timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Claim not found |

---

## Update Claim

**PUT** `/api/claims/:claimId`

Updates a claim (only allowed for draft or denied claims for resubmission).

### Authentication

Required. Bearer token with `CLAIM:UPDATE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| claimId | string | Claim ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| diagnosis | array | No | Updated diagnosis codes |
| services | array | No | Updated service line items |
| totalAmount | number | No | Updated total amount |
| notes | string | No | Updated notes |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Claim ID |
| status | string | Claim status |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Invalid fields |
| 400 | INVALID_STATUS | Claim cannot be updated in current status |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Claim not found |

### Business Rules

- Only `DRAFT` or `DENIED` claims can be updated
- Updated denied claims can be resubmitted

---

## List Insurance Providers

**GET** `/api/insurance/providers`

Retrieves a list of configured insurance providers.

### Authentication

Required. Bearer token with `INSURANCE:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 50 | Results per page |
| search | string | - | Search by provider name |
| status | string | ACTIVE | Filter by status |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of provider objects |
| data[].id | string | Provider ID |
| data[].name | string | Provider name |
| data[].code | string | Provider code |
| data[].type | string | Provider type |
| data[].contactPhone | string | Contact phone |
| data[].contactEmail | string | Contact email |
| data[].status | string | Provider status |
| pagination | object | Pagination details |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Add Insurance Provider

**POST** `/api/insurance/providers`

Adds a new insurance provider to the system.

### Authentication

Required. Bearer token with `INSURANCE:MANAGE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Provider name |
| code | string | Yes | Unique provider code |
| type | string | Yes | `PRIVATE`, `GOVERNMENT`, `CORPORATE` |
| contactPhone | string | Yes | Contact phone number |
| contactEmail | string | No | Contact email |
| address | object | No | Provider address |
| payerId | string | No | Electronic payer ID |
| notes | string | No | Additional notes |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Provider ID |
| name | string | Provider name |
| code | string | Provider code |
| type | string | Provider type |
| status | string | `ACTIVE` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | DUPLICATE_CODE | Provider code already exists |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Claim Status Flow

| Status | Description |
|--------|-------------|
| DRAFT | Claim created, not yet submitted |
| SUBMITTED | Claim submitted to insurance provider |
| IN_REVIEW | Claim under review by provider |
| APPROVED | Claim approved |
| PARTIALLY_APPROVED | Claim partially approved |
| DENIED | Claim denied |
| PAID | Payment received |
| APPEALED | Denied claim under appeal |

## Plan Types

| Type | Description |
|------|-------------|
| HMO | Health Maintenance Organization |
| PPO | Preferred Provider Organization |
| EPO | Exclusive Provider Organization |
| POS | Point of Service |
| GOVERNMENT | Government insurance (Medicare, Medicaid) |
| SELF_PAY | Self-pay / no insurance |
