---
title: Queue Management API
description: API reference for patient queue management, token generation, and real-time queue operations.
---

## Overview

The Queue Management API provides a digital queuing system for managing patient flow across departments. It supports token generation, queue operations (call, skip, recall), real-time analytics, and display board data for waiting area screens.

---

## Generate Token

**POST** `/api/queues/tokens`

Generates a queue token for a patient.

### Authentication

Required. Bearer token with `QUEUE:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Patient ID |
| departmentId | string | Yes | Department ID |
| serviceType | string | Yes | `CONSULTATION`, `LAB`, `PHARMACY`, `RADIOLOGY`, `BILLING`, `GENERAL` |
| doctorId | string | No | Specific doctor (for consultation queues) |
| priority | string | No | `NORMAL`, `PRIORITY`, `EMERGENCY` (default: `NORMAL`) |
| appointmentId | string | No | Associated appointment ID |
| notes | string | No | Additional notes |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Token ID |
| tokenNumber | string | Display token number (e.g., `A-001`, `B-015`) |
| patientId | string | Patient ID |
| departmentId | string | Department ID |
| serviceType | string | Service type |
| priority | string | Token priority |
| status | string | `WAITING` |
| estimatedWaitTime | number | Estimated wait in minutes |
| position | number | Position in queue |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INVALID_PATIENT | Patient not found |
| 400 | INVALID_DEPARTMENT | Department not found |
| 400 | ALREADY_IN_QUEUE | Patient already has active token for this service |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Token number format varies by service type (e.g., A-series for consultation, B-series for lab)
- Emergency priority tokens are placed at the front of the queue
- Estimated wait time calculated based on current queue and average service time
- One active token per patient per service type

---

## Get Queue Status

**GET** `/api/queues/status`

Retrieves real-time queue status for a department or service.

### Authentication

Required. Bearer token with `QUEUE:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| departmentId | string | - | Filter by department (required) |
| serviceType | string | - | Filter by service type |
| doctorId | string | - | Filter by doctor |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| departmentId | string | Department ID |
| department | string | Department name |
| queues | array | Array of queue objects |
| queues[].serviceType | string | Service type |
| queues[].doctorId | string | Doctor ID (if applicable) |
| queues[].doctorName | string | Doctor name |
| queues[].currentToken | string | Currently serving token |
| queues[].waitingCount | number | Number of patients waiting |
| queues[].averageWaitTime | number | Average wait time (minutes) |
| queues[].tokens | array | Array of tokens in queue |
| queues[].tokens[].tokenNumber | string | Token number |
| queues[].tokens[].patientName | string | Patient name |
| queues[].tokens[].priority | string | Token priority |
| queues[].tokens[].status | string | Token status |
| queues[].tokens[].waitingSince | string | Waiting start time |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Department ID required |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Call Next

**POST** `/api/queues/call-next`

Calls the next patient in the queue.

### Authentication

Required. Bearer token with `QUEUE:MANAGE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| departmentId | string | Yes | Department ID |
| serviceType | string | Yes | Service type |
| doctorId | string | No | Specific doctor's queue |
| counterId | string | No | Counter/room number for display |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| token | object | Called token details |
| token.id | string | Token ID |
| token.tokenNumber | string | Token number |
| token.patientId | string | Patient ID |
| token.patientName | string | Patient name |
| token.status | string | Updated to `SERVING` |
| counter | string | Counter/room number |
| calledAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | QUEUE_EMPTY | No patients waiting in queue |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Priority tokens are called before normal tokens
- Emergency tokens are always called first
- Display board is updated in real-time

---

## Skip Token

**POST** `/api/queues/tokens/:tokenId/skip`

Skips a token (patient not present when called).

### Authentication

Required. Bearer token with `QUEUE:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| tokenId | string | Token ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | No | Reason for skipping |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Token ID |
| tokenNumber | string | Token number |
| status | string | Updated to `SKIPPED` |
| skippedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Token not in valid state to skip |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Token not found |

---

## Recall Token

**POST** `/api/queues/tokens/:tokenId/recall`

Recalls a skipped token back into the queue.

### Authentication

Required. Bearer token with `QUEUE:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| tokenId | string | Token ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Token ID |
| tokenNumber | string | Token number |
| status | string | Updated to `WAITING` |
| position | number | New position in queue |
| recalledAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Token not in valid state to recall |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Token not found |

### Business Rules

- Only `SKIPPED` tokens can be recalled
- Recalled tokens are placed at the front of the normal priority queue

---

## Complete Token

**POST** `/api/queues/tokens/:tokenId/complete`

Marks a token as completed (service finished).

### Authentication

Required. Bearer token with `QUEUE:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| tokenId | string | Token ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Token ID |
| tokenNumber | string | Token number |
| status | string | Updated to `COMPLETED` |
| serviceTime | number | Actual service time in minutes |
| completedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Token not in valid state to complete |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Token not found |

### Business Rules

- Only `SERVING` tokens can be completed
- Service time is calculated and recorded for analytics

---

## Cancel Token

**POST** `/api/queues/tokens/:tokenId/cancel`

Cancels a queue token.

### Authentication

Required. Bearer token with `QUEUE:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| tokenId | string | Token ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | No | Cancellation reason |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Token ID |
| tokenNumber | string | Token number |
| status | string | Updated to `CANCELLED` |
| cancelledAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Token already completed or cancelled |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Token not found |

---

## Queue Analytics

**GET** `/api/queues/analytics`

Retrieves queue performance analytics.

### Authentication

Required. Bearer token with `QUEUE:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| departmentId | string | - | Filter by department |
| serviceType | string | - | Filter by service type |
| date | string | today | Specific date (ISO 8601) |
| startDate | string | - | Range start date |
| endDate | string | - | Range end date |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| period | object | Analytics period |
| summary | object | Overall summary |
| summary.totalTokens | number | Total tokens generated |
| summary.served | number | Patients served |
| summary.skipped | number | Patients skipped |
| summary.cancelled | number | Tokens cancelled |
| summary.averageWaitTime | number | Average wait time (minutes) |
| summary.averageServiceTime | number | Average service time (minutes) |
| summary.peakHour | string | Busiest hour |
| byService | array | Breakdown by service type |
| byHour | array | Hourly distribution |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Display Board

**GET** `/api/queues/display`

Retrieves data for the queue display board (public-facing waiting area screen).

### Authentication

Required. Bearer token with `QUEUE:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| departmentId | string | - | Department ID (required) |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| departmentName | string | Department name |
| counters | array | Array of counter/room statuses |
| counters[].counterId | string | Counter ID |
| counters[].counterName | string | Counter/room name |
| counters[].currentToken | string | Currently serving token |
| counters[].doctorName | string | Doctor name |
| waitingTokens | array | Next tokens in queue |
| waitingTokens[].tokenNumber | string | Token number |
| waitingTokens[].serviceType | string | Service type |
| announcements | array | Active announcements |
| updatedAt | string | Last update timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Department ID required |
| 401 | UNAUTHORIZED | Missing or invalid token |

---

## Token Status Flow

| Status | Description |
|--------|-------------|
| WAITING | Patient waiting in queue |
| SERVING | Patient currently being served |
| COMPLETED | Service completed |
| SKIPPED | Patient not present when called |
| CANCELLED | Token cancelled |

## Service Types

| Type | Description |
|------|-------------|
| CONSULTATION | Doctor consultation |
| LAB | Laboratory services |
| PHARMACY | Pharmacy pickup |
| RADIOLOGY | Radiology/imaging |
| BILLING | Billing and payments |
| GENERAL | General services |
