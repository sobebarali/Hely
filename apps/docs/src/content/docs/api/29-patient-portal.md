---
title: Patient Portal API
description: API reference for patient-facing portal operations including authentication, profile management, appointments, and medical records access.
---

## Overview

The Patient Portal API provides patient-facing endpoints for self-service operations. Patients can manage their profiles, book and manage appointments, view prescriptions, access lab results, and download medical records — all through a secure, authenticated portal.

---

## Patient Login

**POST** `/api/portal/login`

Authenticates a patient to the portal.

### Authentication

Not required (public endpoint).

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Registered phone number |
| dateOfBirth | string | Yes | Date of birth for verification (ISO 8601) |
| patientId | string | No | Patient ID (optional, for disambiguation) |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| message | string | OTP sent confirmation |
| otpToken | string | Temporary token for OTP verification |
| expiresIn | number | OTP expiry in seconds |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 404 | PATIENT_NOT_FOUND | No matching patient record |
| 429 | TOO_MANY_REQUESTS | Rate limit exceeded |

### Business Rules

- Phone number and date of birth must match a registered patient
- OTP sent via SMS to the registered phone number
- OTP expires in 5 minutes
- Maximum 3 OTP requests per hour

---

## Request OTP

**POST** `/api/portal/otp/verify`

Verifies the OTP and returns an access token.

### Authentication

Not required (public endpoint). Requires `otpToken` from login.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| otpToken | string | Yes | Token from login response |
| otp | string | Yes | 6-digit OTP code |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| accessToken | string | JWT access token |
| refreshToken | string | Refresh token |
| expiresIn | number | Token expiry in seconds |
| patient | object | Patient summary |
| patient.id | string | Patient ID |
| patient.name | string | Patient name |
| patient.patientId | string | Display patient ID |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_OTP | Incorrect OTP code |
| 400 | OTP_EXPIRED | OTP has expired |
| 429 | TOO_MANY_ATTEMPTS | Maximum OTP attempts exceeded |

### Business Rules

- Maximum 3 OTP verification attempts
- After 3 failed attempts, OTP is invalidated
- Access token valid for 1 hour
- Refresh token valid for 7 days

---

## Get Profile

**GET** `/api/portal/profile`

Retrieves the authenticated patient's profile.

### Authentication

Required. Bearer token (patient portal token).

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Patient ID |
| patientId | string | Display patient ID |
| firstName | string | First name |
| lastName | string | Last name |
| dateOfBirth | string | Date of birth |
| gender | string | Gender |
| phone | string | Phone number |
| email | string | Email address |
| bloodGroup | string | Blood group |
| address | object | Address details |
| emergencyContact | object | Emergency contact |
| photo | string | Profile photo URL |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |

---

## Update Profile

**PUT** `/api/portal/profile`

Updates the authenticated patient's profile (limited fields).

### Authentication

Required. Bearer token (patient portal token).

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | No | Updated phone number |
| email | string | No | Updated email address |
| address | object | No | Updated address |
| emergencyContact | object | No | Updated emergency contact |
| photo | string | No | Base64 encoded photo |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Patient ID |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Invalid fields |
| 401 | UNAUTHORIZED | Missing or invalid token |

### Business Rules

- Patients cannot update name, date of birth, or gender (requires staff assistance)
- Phone number update triggers reverification

---

## List Appointments

**GET** `/api/portal/appointments`

Retrieves the patient's appointments.

### Authentication

Required. Bearer token (patient portal token).

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Results per page |
| status | string | - | Filter by status |
| upcoming | boolean | - | Show only upcoming appointments |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of appointment objects |
| data[].id | string | Appointment ID |
| data[].doctorName | string | Doctor name |
| data[].department | string | Department name |
| data[].scheduledAt | string | Appointment date/time |
| data[].type | string | Appointment type |
| data[].status | string | Appointment status |
| pagination | object | Pagination details |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |

---

## Book Appointment

**POST** `/api/portal/appointments`

Books a new appointment through the patient portal.

### Authentication

Required. Bearer token (patient portal token).

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| doctorId | string | Yes | Doctor ID |
| departmentId | string | Yes | Department ID |
| date | string | Yes | Preferred date (ISO 8601) |
| timeSlot | string | Yes | Time slot ID |
| reason | string | Yes | Reason for visit |
| type | string | No | `IN_PERSON`, `TELEMEDICINE` (default: `IN_PERSON`) |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Appointment ID |
| doctorName | string | Doctor name |
| department | string | Department name |
| scheduledAt | string | Appointment date/time |
| type | string | Appointment type |
| status | string | `SCHEDULED` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | SLOT_UNAVAILABLE | Selected time slot is no longer available |
| 400 | BOOKING_LIMIT | Maximum active bookings reached |
| 401 | UNAUTHORIZED | Missing or invalid token |

### Business Rules

- Patients limited to 3 active future appointments
- Appointments must be at least 1 hour in the future
- Availability is validated in real-time

---

## Cancel Appointment

**POST** `/api/portal/appointments/:appointmentId/cancel`

Cancels a booked appointment.

### Authentication

Required. Bearer token (patient portal token).

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| appointmentId | string | Appointment ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | No | Cancellation reason |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Appointment ID |
| status | string | Updated to `CANCELLED` |
| cancelledAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_STATUS | Appointment cannot be cancelled |
| 400 | TOO_LATE | Cannot cancel within 2 hours of appointment |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 404 | NOT_FOUND | Appointment not found |

### Business Rules

- Cancellation not allowed within 2 hours of appointment time
- Only `SCHEDULED` appointments can be cancelled

---

## Get Prescriptions

**GET** `/api/portal/prescriptions`

Retrieves the patient's prescriptions.

### Authentication

Required. Bearer token (patient portal token).

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Results per page |
| status | string | - | Filter by status: `ACTIVE`, `COMPLETED`, `ALL` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of prescription objects |
| data[].id | string | Prescription ID |
| data[].doctorName | string | Prescribing doctor |
| data[].date | string | Prescription date |
| data[].medications | array | Prescribed medications |
| data[].medications[].name | string | Medication name |
| data[].medications[].dosage | string | Dosage |
| data[].medications[].frequency | string | Frequency |
| data[].medications[].duration | string | Duration |
| data[].status | string | Prescription status |
| pagination | object | Pagination details |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |

---

## Get Lab Results

**GET** `/api/portal/lab-results`

Retrieves the patient's lab test results.

### Authentication

Required. Bearer token (patient portal token).

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Results per page |
| startDate | string | - | Filter from date |
| endDate | string | - | Filter to date |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of lab result objects |
| data[].id | string | Lab order ID |
| data[].orderId | string | Order number |
| data[].date | string | Order date |
| data[].tests | array | Tests and results |
| data[].tests[].name | string | Test name |
| data[].tests[].result | string | Result value |
| data[].tests[].unit | string | Unit |
| data[].tests[].normalRange | string | Reference range |
| data[].tests[].flag | string | Result flag |
| data[].status | string | Order status |
| pagination | object | Pagination details |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |

### Business Rules

- Only verified/released results are shown to patients
- Results pending verification are not visible

---

## Get Medical Records

**GET** `/api/portal/records`

Retrieves a summary of the patient's medical records.

### Authentication

Required. Bearer token (patient portal token).

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Results per page |
| type | string | - | Filter by record type: `NOTE`, `DISCHARGE`, `LAB`, `IMAGING`, `PRESCRIPTION` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of record objects |
| data[].id | string | Record ID |
| data[].type | string | Record type |
| data[].title | string | Record title |
| data[].date | string | Record date |
| data[].doctorName | string | Associated doctor |
| data[].department | string | Department |
| data[].hasDocument | boolean | Whether a downloadable document exists |
| pagination | object | Pagination details |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |

---

## Download Document

**GET** `/api/portal/records/:recordId/download`

Downloads a medical document (PDF).

### Authentication

Required. Bearer token (patient portal token).

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| recordId | string | Record ID |

### Response

**Status: 200 OK**

Returns a PDF file (`application/pdf`).

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 404 | NOT_FOUND | Record not found or no document available |

### Business Rules

- Only the patient's own records can be downloaded
- Download activity is logged for audit
