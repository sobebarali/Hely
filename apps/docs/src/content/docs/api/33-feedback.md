---
title: Feedback & Surveys API
description: API reference for survey template management, patient feedback collection, complaint handling, and satisfaction analytics.
---

## Overview

The Feedback & Surveys API enables the hospital to collect, manage, and analyze patient feedback and complaints. It supports configurable survey templates, feedback submission across multiple touchpoints, formal complaint workflows, and satisfaction analytics for quality improvement.

---

## Create Survey Template

**POST** `/api/feedback/templates`

Creates a new survey template.

### Authentication

Required. Bearer token with `FEEDBACK:MANAGE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Template name |
| description | string | No | Template description |
| type | string | Yes | `POST_VISIT`, `POST_DISCHARGE`, `SERVICE_QUALITY`, `GENERAL` |
| departmentId | string | No | Associated department |
| questions | array | Yes | Array of survey questions |
| questions[].text | string | Yes | Question text |
| questions[].type | string | Yes | `RATING`, `TEXT`, `MULTIPLE_CHOICE`, `YES_NO`, `SCALE` |
| questions[].required | boolean | No | Whether answer is required (default: true) |
| questions[].options | array | No | Options for multiple choice questions |
| questions[].scaleMin | number | No | Minimum scale value (for SCALE type) |
| questions[].scaleMax | number | No | Maximum scale value (for SCALE type) |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Template ID |
| name | string | Template name |
| type | string | Survey type |
| questionCount | number | Number of questions |
| status | string | `ACTIVE` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | DUPLICATE_NAME | Template name already exists |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- At least one question required per template
- RATING type defaults to 1-5 star scale
- SCALE type requires scaleMin and scaleMax

---

## List Survey Templates

**GET** `/api/feedback/templates`

Retrieves all survey templates.

### Authentication

Required. Bearer token with `FEEDBACK:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| type | string | - | Filter by survey type |
| departmentId | string | - | Filter by department |
| status | string | ACTIVE | Filter by status |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of template objects |
| data[].id | string | Template ID |
| data[].name | string | Template name |
| data[].type | string | Survey type |
| data[].questionCount | number | Number of questions |
| data[].responseCount | number | Total responses received |
| data[].averageRating | number | Average satisfaction rating |
| data[].status | string | Template status |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Submit Feedback

**POST** `/api/feedback/responses`

Submits a feedback response to a survey.

### Authentication

Required. Bearer token with `FEEDBACK:CREATE` permission (or patient portal token).

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | string | Yes | Survey template ID |
| patientId | string | Yes | Patient ID |
| encounterId | string | No | Associated encounter/visit ID |
| departmentId | string | No | Associated department ID |
| doctorId | string | No | Associated doctor ID |
| answers | array | Yes | Array of answers |
| answers[].questionId | string | Yes | Question ID from template |
| answers[].rating | number | No | Rating value (for RATING/SCALE) |
| answers[].text | string | No | Text answer |
| answers[].selectedOptions | array | No | Selected option IDs (MULTIPLE_CHOICE) |
| answers[].yesNo | boolean | No | Yes/No answer |
| overallRating | number | No | Overall satisfaction (1-5) |
| comments | string | No | Additional comments |
| isAnonymous | boolean | No | Submit anonymously (default: false) |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Response ID |
| templateId | string | Template ID |
| patientId | string | Patient ID (null if anonymous) |
| overallRating | number | Overall rating |
| status | string | `SUBMITTED` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | INVALID_TEMPLATE | Template not found or inactive |
| 400 | MISSING_REQUIRED | Required questions not answered |
| 401 | UNAUTHORIZED | Missing or invalid token |

### Business Rules

- All required questions must be answered
- Anonymous submissions hide patient identity in reports
- Duplicate submissions for same encounter are prevented

---

## List Feedback

**GET** `/api/feedback/responses`

Retrieves a paginated list of feedback responses.

### Authentication

Required. Bearer token with `FEEDBACK:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| templateId | string | - | Filter by template |
| departmentId | string | - | Filter by department |
| doctorId | string | - | Filter by doctor |
| minRating | number | - | Minimum overall rating |
| maxRating | number | - | Maximum overall rating |
| startDate | string | - | Filter from date |
| endDate | string | - | Filter to date |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | `asc` or `desc` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of feedback response objects |
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

## Get Feedback

**GET** `/api/feedback/responses/:responseId`

Retrieves a specific feedback response with all answers.

### Authentication

Required. Bearer token with `FEEDBACK:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| responseId | string | Response ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Response ID |
| templateId | string | Template ID |
| template | object | Template details |
| patientId | string | Patient ID (null if anonymous) |
| patient | object | Patient details (null if anonymous) |
| encounterId | string | Encounter ID |
| departmentId | string | Department ID |
| doctorId | string | Doctor ID |
| answers | array | All answers with questions |
| overallRating | number | Overall rating |
| comments | string | Additional comments |
| isAnonymous | boolean | Anonymous flag |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Response not found |

---

## Submit Complaint

**POST** `/api/feedback/complaints`

Submits a formal complaint.

### Authentication

Required. Bearer token with `FEEDBACK:CREATE` permission (or patient portal token).

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | Yes | Patient ID |
| category | string | Yes | `CLINICAL_CARE`, `STAFF_BEHAVIOR`, `WAIT_TIME`, `BILLING`, `FACILITY`, `COMMUNICATION`, `OTHER` |
| subject | string | Yes | Complaint subject |
| description | string | Yes | Detailed description |
| departmentId | string | No | Related department |
| staffId | string | No | Related staff member |
| encounterId | string | No | Related encounter |
| priority | string | No | `LOW`, `MEDIUM`, `HIGH` (default: `MEDIUM`) |
| attachments | array | No | Supporting document IDs |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Complaint ID |
| complaintId | string | Unique identifier: `{tenantId}-CMP-{sequential}` |
| category | string | Complaint category |
| subject | string | Subject |
| priority | string | Priority level |
| status | string | `OPEN` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 401 | UNAUTHORIZED | Missing or invalid token |

### Business Rules

- Complaint ID auto-generated: `{tenantId}-CMP-{sequential}`
- High priority complaints trigger immediate notification to department head
- Complaints must be acknowledged within 24 hours

---

## List Complaints

**GET** `/api/feedback/complaints`

Retrieves a paginated list of complaints.

### Authentication

Required. Bearer token with `FEEDBACK:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| category | string | - | Filter by category |
| status | string | - | Filter by status |
| priority | string | - | Filter by priority |
| departmentId | string | - | Filter by department |
| startDate | string | - | Filter from date |
| endDate | string | - | Filter to date |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | `asc` or `desc` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of complaint objects |
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

## Update Complaint

**PUT** `/api/feedback/complaints/:complaintId`

Updates a complaint's status or adds resolution details.

### Authentication

Required. Bearer token with `FEEDBACK:MANAGE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| complaintId | string | Complaint ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | No | `ACKNOWLEDGED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| assignedTo | string | No | Staff ID assigned to handle |
| resolution | string | No | Resolution details |
| internalNotes | string | No | Internal notes (not visible to patient) |
| followUpAction | string | No | Follow-up action required |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Complaint ID |
| status | string | Updated status |
| assignedTo | object | Assigned staff |
| resolution | string | Resolution details |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Invalid fields |
| 400 | INVALID_STATUS_TRANSITION | Invalid status transition |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Complaint not found |

### Business Rules

- Status must follow valid transitions: OPEN → ACKNOWLEDGED → IN_PROGRESS → RESOLVED → CLOSED
- Resolution is required when marking as RESOLVED
- Patient is notified on status changes

---

## Satisfaction Analytics

**GET** `/api/feedback/analytics`

Retrieves satisfaction analytics and trends.

### Authentication

Required. Bearer token with `FEEDBACK:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| departmentId | string | - | Filter by department |
| doctorId | string | - | Filter by doctor |
| templateId | string | - | Filter by survey template |
| startDate | string | 30 days ago | Period start date |
| endDate | string | today | Period end date |
| groupBy | string | day | Group by: `day`, `week`, `month` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| period | object | Analytics period |
| period.startDate | string | Start date |
| period.endDate | string | End date |
| summary | object | Overall summary |
| summary.totalResponses | number | Total feedback responses |
| summary.averageRating | number | Average overall rating |
| summary.npsScore | number | Net Promoter Score |
| summary.satisfactionRate | number | Percentage rating >= 4 |
| summary.totalComplaints | number | Total complaints |
| summary.resolvedComplaints | number | Resolved complaints |
| summary.averageResolutionTime | number | Average resolution time (hours) |
| trends | array | Rating trends over time |
| trends[].period | string | Period label |
| trends[].averageRating | number | Average rating |
| trends[].responseCount | number | Number of responses |
| byDepartment | array | Department breakdown |
| byDepartment[].departmentId | string | Department ID |
| byDepartment[].departmentName | string | Department name |
| byDepartment[].averageRating | number | Average rating |
| byDepartment[].responseCount | number | Response count |
| topIssues | array | Most common complaint categories |
| topIssues[].category | string | Complaint category |
| topIssues[].count | number | Number of complaints |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Complaint Status Flow

| Status | Description |
|--------|-------------|
| OPEN | Complaint submitted |
| ACKNOWLEDGED | Complaint received and acknowledged |
| IN_PROGRESS | Being investigated/addressed |
| RESOLVED | Resolution provided |
| CLOSED | Complaint closed |

## Survey Types

| Type | Description |
|------|-------------|
| POST_VISIT | After outpatient visit |
| POST_DISCHARGE | After inpatient discharge |
| SERVICE_QUALITY | General service quality |
| GENERAL | General feedback |

## Complaint Categories

| Category | Description |
|----------|-------------|
| CLINICAL_CARE | Issues with medical care quality |
| STAFF_BEHAVIOR | Staff attitude or behavior |
| WAIT_TIME | Excessive waiting times |
| BILLING | Billing disputes or errors |
| FACILITY | Facility cleanliness or maintenance |
| COMMUNICATION | Communication issues |
| OTHER | Other complaints |
