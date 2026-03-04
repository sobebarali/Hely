---
title: Staff Scheduling & Shifts API
description: API reference for shift templates, roster management, shift assignments, leave requests, and staff availability.
---

## Overview

The Staff Scheduling & Shifts API manages workforce scheduling including shift template configuration, roster planning, shift assignments and swaps, leave management, and staff availability tracking. It supports overtime reporting for compliance and payroll.

---

## Create Shift Template

**POST** `/api/scheduling/templates`

Creates a reusable shift template.

### Authentication

Required. Bearer token with `SCHEDULING:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Template name (e.g., "Morning Shift") |
| startTime | string | Yes | Shift start time (HH:mm) |
| endTime | string | Yes | Shift end time (HH:mm) |
| breakDuration | number | No | Break duration in minutes |
| color | string | No | Display color (hex code) |
| departmentId | string | No | Associated department |
| roles | array | No | Applicable roles |
| description | string | No | Template description |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Template ID |
| name | string | Template name |
| startTime | string | Start time |
| endTime | string | End time |
| duration | number | Shift duration in hours |
| breakDuration | number | Break duration in minutes |
| status | string | `ACTIVE` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | DUPLICATE_NAME | Template name already exists |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## List Shift Templates

**GET** `/api/scheduling/templates`

Retrieves all shift templates.

### Authentication

Required. Bearer token with `SCHEDULING:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| departmentId | string | - | Filter by department |
| status | string | ACTIVE | Filter by status |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of shift template objects |
| data[].id | string | Template ID |
| data[].name | string | Template name |
| data[].startTime | string | Start time |
| data[].endTime | string | End time |
| data[].duration | number | Duration in hours |
| data[].status | string | Template status |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Create Roster

**POST** `/api/scheduling/rosters`

Creates a new staff roster for a specific period.

### Authentication

Required. Bearer token with `SCHEDULING:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Roster name |
| departmentId | string | Yes | Department ID |
| startDate | string | Yes | Roster start date (ISO 8601) |
| endDate | string | Yes | Roster end date (ISO 8601) |
| assignments | array | Yes | Array of shift assignments |
| assignments[].staffId | string | Yes | Staff member ID |
| assignments[].date | string | Yes | Assignment date (ISO 8601) |
| assignments[].templateId | string | Yes | Shift template ID |
| assignments[].notes | string | No | Assignment notes |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Roster ID |
| name | string | Roster name |
| departmentId | string | Department ID |
| startDate | string | Start date |
| endDate | string | End date |
| assignmentCount | number | Number of assignments |
| status | string | `DRAFT` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INVALID_DATE_RANGE | End date before start date |
| 400 | SCHEDULE_CONFLICT | Staff member has conflicting assignments |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Roster created in `DRAFT` status
- Validates no double-booking of staff
- Minimum rest period between shifts is enforced (default: 8 hours)

---

## Get Roster

**GET** `/api/scheduling/rosters/:rosterId`

Retrieves details of a specific roster with all assignments.

### Authentication

Required. Bearer token with `SCHEDULING:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| rosterId | string | Roster ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Roster ID |
| name | string | Roster name |
| departmentId | string | Department ID |
| department | object | Department details |
| startDate | string | Start date |
| endDate | string | End date |
| status | string | Roster status |
| assignments | array | Array of assignment objects |
| assignments[].id | string | Assignment ID |
| assignments[].staffId | string | Staff member ID |
| assignments[].staff | object | Staff details |
| assignments[].date | string | Assignment date |
| assignments[].template | object | Shift template details |
| assignments[].status | string | Assignment status |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Roster not found |

---

## Update Assignment

**PUT** `/api/scheduling/assignments/:assignmentId`

Updates a shift assignment in a roster.

### Authentication

Required. Bearer token with `SCHEDULING:UPDATE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| assignmentId | string | Assignment ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | string | No | New shift template ID |
| staffId | string | No | New staff member ID |
| date | string | No | New date (ISO 8601) |
| notes | string | No | Updated notes |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Assignment ID |
| staffId | string | Staff member ID |
| date | string | Assignment date |
| templateId | string | Shift template ID |
| status | string | Assignment status |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Invalid fields |
| 400 | SCHEDULE_CONFLICT | New assignment conflicts with existing |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Assignment not found |

---

## Swap Assignments

**POST** `/api/scheduling/assignments/swap`

Swaps shift assignments between two staff members.

### Authentication

Required. Bearer token with `SCHEDULING:UPDATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| assignmentId1 | string | Yes | First assignment ID |
| assignmentId2 | string | Yes | Second assignment ID |
| reason | string | No | Reason for swap |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| assignment1 | object | Updated first assignment |
| assignment2 | object | Updated second assignment |
| swappedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing assignment IDs |
| 400 | SCHEDULE_CONFLICT | Swap creates a conflict |
| 400 | INCOMPATIBLE_ROLES | Staff roles not compatible for swap |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | One or both assignments not found |

### Business Rules

- Both assignments must be in the same roster
- Staff must have compatible roles for the swapped shifts
- Minimum rest period is validated after swap

---

## Request Leave

**POST** `/api/scheduling/leave`

Submits a leave request.

### Authentication

Required. Bearer token with `SCHEDULING:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| staffId | string | Yes | Staff member ID |
| type | string | Yes | `ANNUAL`, `SICK`, `PERSONAL`, `MATERNITY`, `PATERNITY`, `UNPAID`, `EMERGENCY` |
| startDate | string | Yes | Leave start date (ISO 8601) |
| endDate | string | Yes | Leave end date (ISO 8601) |
| reason | string | Yes | Leave reason |
| attachments | array | No | Supporting documents |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Leave request ID |
| staffId | string | Staff member ID |
| type | string | Leave type |
| startDate | string | Start date |
| endDate | string | End date |
| totalDays | number | Total leave days |
| status | string | `PENDING` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INSUFFICIENT_BALANCE | Not enough leave balance |
| 400 | OVERLAPPING_LEAVE | Overlaps with existing leave |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Leave balance is checked before approval
- Emergency leave can be retroactive
- Sick leave over 3 days may require medical certificate

---

## List Leave Requests

**GET** `/api/scheduling/leave`

Retrieves leave requests with optional filters.

### Authentication

Required. Bearer token with `SCHEDULING:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| staffId | string | - | Filter by staff member |
| departmentId | string | - | Filter by department |
| type | string | - | Filter by leave type |
| status | string | - | Filter by status |
| startDate | string | - | Filter from date |
| endDate | string | - | Filter to date |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of leave request objects |
| pagination | object | Pagination details |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Approve/Reject Leave

**POST** `/api/scheduling/leave/:leaveId/review`

Approves or rejects a leave request.

### Authentication

Required. Bearer token with `SCHEDULING:APPROVE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| leaveId | string | Leave request ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| action | string | Yes | `APPROVE` or `REJECT` |
| comments | string | No | Review comments |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Leave request ID |
| status | string | `APPROVED` or `REJECTED` |
| reviewedBy | object | Reviewer details |
| reviewedAt | string | ISO 8601 timestamp |
| comments | string | Review comments |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_ACTION | Invalid action value |
| 400 | ALREADY_REVIEWED | Leave request already reviewed |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Leave request not found |

### Business Rules

- Only managers/supervisors can approve leave
- Approved leave deducts from leave balance
- Affected shift assignments are flagged for reassignment

---

## Staff Availability

**GET** `/api/scheduling/availability`

Retrieves staff availability for a given date range.

### Authentication

Required. Bearer token with `SCHEDULING:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| departmentId | string | - | Filter by department |
| date | string | today | Specific date (ISO 8601) |
| startDate | string | - | Range start date |
| endDate | string | - | Range end date |
| role | string | - | Filter by staff role |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| date | string | Queried date |
| staff | array | Array of staff availability |
| staff[].staffId | string | Staff member ID |
| staff[].name | string | Staff member name |
| staff[].role | string | Staff role |
| staff[].status | string | `AVAILABLE`, `ON_SHIFT`, `ON_LEAVE`, `OFF_DUTY` |
| staff[].shift | object | Current/next shift details (if applicable) |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Overtime Report

**GET** `/api/scheduling/overtime`

Generates an overtime report for a given period.

### Authentication

Required. Bearer token with `SCHEDULING:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| departmentId | string | - | Filter by department |
| staffId | string | - | Filter by staff member |
| startDate | string | - | Period start date (required) |
| endDate | string | - | Period end date (required) |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| period | object | Report period |
| period.startDate | string | Start date |
| period.endDate | string | End date |
| summary | object | Overall summary |
| summary.totalStaff | number | Staff included |
| summary.totalOvertimeHours | number | Total overtime hours |
| staff | array | Per-staff breakdown |
| staff[].staffId | string | Staff member ID |
| staff[].name | string | Staff name |
| staff[].department | string | Department name |
| staff[].scheduledHours | number | Scheduled hours |
| staff[].actualHours | number | Actual hours worked |
| staff[].overtimeHours | number | Overtime hours |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_DATE_RANGE | Missing or invalid date range |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Roster Status Flow

| Status | Description |
|--------|-------------|
| DRAFT | Roster created, can be edited |
| PUBLISHED | Roster published to staff |
| ARCHIVED | Past roster, read-only |

## Leave Status Flow

| Status | Description |
|--------|-------------|
| PENDING | Awaiting review |
| APPROVED | Leave approved |
| REJECTED | Leave rejected |
| CANCELLED | Leave cancelled by staff |

## Leave Types

| Type | Description |
|------|-------------|
| ANNUAL | Annual/vacation leave |
| SICK | Sick leave |
| PERSONAL | Personal leave |
| MATERNITY | Maternity leave |
| PATERNITY | Paternity leave |
| UNPAID | Unpaid leave |
| EMERGENCY | Emergency leave |
