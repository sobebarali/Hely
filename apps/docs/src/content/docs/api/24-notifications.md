---
title: Notifications & Alerts API
description: API reference for managing notifications, alert preferences, and real-time messaging.
---

## Overview

The Notifications & Alerts API provides a unified notification system for the hospital management platform. It supports sending, receiving, and managing notifications across multiple channels (in-app, email, SMS, push) with configurable user preferences.

---

## List Notifications

**GET** `/api/notifications`

Retrieves a paginated list of notifications for the authenticated user.

### Authentication

Required. Bearer token with `NOTIFICATION:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| read | boolean | - | Filter by read status |
| type | string | - | Filter by notification type |
| priority | string | - | Filter by priority |
| startDate | string | - | Filter from date (ISO 8601) |
| endDate | string | - | Filter to date (ISO 8601) |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | `asc` or `desc` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of notification objects |
| data[].id | string | Notification ID |
| data[].type | string | Notification type |
| data[].title | string | Notification title |
| data[].message | string | Notification message |
| data[].priority | string | Priority level |
| data[].read | boolean | Read status |
| data[].actionUrl | string | Optional action link |
| data[].createdAt | string | ISO 8601 timestamp |
| pagination | object | Pagination details |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Get Notification

**GET** `/api/notifications/:notificationId`

Retrieves a specific notification.

### Authentication

Required. Bearer token with `NOTIFICATION:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| notificationId | string | Notification ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Notification ID |
| type | string | Notification type |
| title | string | Notification title |
| message | string | Notification message |
| priority | string | Priority level |
| read | boolean | Read status |
| readAt | string | Read timestamp |
| actionUrl | string | Optional action link |
| metadata | object | Additional context data |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Notification not found |

---

## Delete Notification

**DELETE** `/api/notifications/:notificationId`

Deletes a specific notification.

### Authentication

Required. Bearer token with `NOTIFICATION:DELETE` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| notificationId | string | Notification ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| message | string | Success confirmation |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Notification not found |

---

## Mark as Read

**POST** `/api/notifications/:notificationId/read`

Marks a specific notification as read.

### Authentication

Required. Bearer token with `NOTIFICATION:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| notificationId | string | Notification ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Notification ID |
| read | boolean | `true` |
| readAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 404 | NOT_FOUND | Notification not found |

---

## Mark All as Read

**POST** `/api/notifications/read-all`

Marks all unread notifications as read for the authenticated user.

### Authentication

Required. Bearer token with `NOTIFICATION:READ` permission.

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| message | string | Success confirmation |
| count | number | Number of notifications marked as read |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |

---

## Get Unread Count

**GET** `/api/notifications/unread-count`

Returns the count of unread notifications for the authenticated user.

### Authentication

Required. Bearer token with `NOTIFICATION:READ` permission.

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| count | number | Number of unread notifications |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |

---

## Send Notification

**POST** `/api/notifications`

Sends a notification to one or more users.

### Authentication

Required. Bearer token with `NOTIFICATION:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| recipientIds | array | Yes | Array of user IDs to notify |
| title | string | Yes | Notification title |
| message | string | Yes | Notification message |
| type | string | Yes | `ALERT`, `REMINDER`, `INFO`, `TASK`, `SYSTEM` |
| priority | string | No | `LOW`, `NORMAL`, `HIGH`, `URGENT` (default: `NORMAL`) |
| channels | array | No | Delivery channels: `IN_APP`, `EMAIL`, `SMS`, `PUSH` (default: `[IN_APP]`) |
| actionUrl | string | No | URL for notification action |
| metadata | object | No | Additional context data |
| scheduledAt | string | No | Schedule delivery time (ISO 8601) |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Notification batch ID |
| recipientCount | number | Number of recipients |
| channels | array | Delivery channels used |
| status | string | `SENT` or `SCHEDULED` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INVALID_RECIPIENTS | One or more recipient IDs invalid |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- URGENT priority notifications are sent on all enabled channels
- Scheduled notifications are queued for delivery at the specified time
- Notifications respect user channel preferences

---

## Get Preferences

**GET** `/api/notifications/preferences`

Retrieves notification preferences for the authenticated user.

### Authentication

Required. Bearer token with `NOTIFICATION:READ` permission.

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| userId | string | User ID |
| channels | object | Channel preferences |
| channels.inApp | boolean | In-app notifications enabled |
| channels.email | boolean | Email notifications enabled |
| channels.sms | boolean | SMS notifications enabled |
| channels.push | boolean | Push notifications enabled |
| types | object | Per-type preferences |
| types.ALERT | object | Alert notification settings |
| types.REMINDER | object | Reminder notification settings |
| types.INFO | object | Info notification settings |
| types.TASK | object | Task notification settings |
| quietHours | object | Quiet hours configuration |
| quietHours.enabled | boolean | Quiet hours active |
| quietHours.start | string | Start time (HH:mm) |
| quietHours.end | string | End time (HH:mm) |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |

---

## Update Preferences

**PUT** `/api/notifications/preferences`

Updates notification preferences for the authenticated user.

### Authentication

Required. Bearer token with `NOTIFICATION:UPDATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| channels | object | No | Channel enable/disable settings |
| channels.inApp | boolean | No | Enable in-app notifications |
| channels.email | boolean | No | Enable email notifications |
| channels.sms | boolean | No | Enable SMS notifications |
| channels.push | boolean | No | Enable push notifications |
| types | object | No | Per-type channel preferences |
| quietHours | object | No | Quiet hours configuration |
| quietHours.enabled | boolean | No | Enable quiet hours |
| quietHours.start | string | No | Start time (HH:mm) |
| quietHours.end | string | No | End time (HH:mm) |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| userId | string | User ID |
| channels | object | Updated channel preferences |
| types | object | Updated type preferences |
| quietHours | object | Updated quiet hours |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Invalid preference values |
| 401 | UNAUTHORIZED | Missing or invalid token |

### Business Rules

- In-app channel cannot be disabled (always active)
- URGENT priority notifications bypass quiet hours
- System notifications cannot be disabled

---

## Notification Types

| Type | Description |
|------|-------------|
| ALERT | Critical alerts requiring attention |
| REMINDER | Appointment and task reminders |
| INFO | Informational notifications |
| TASK | Task assignments and updates |
| SYSTEM | System-level notifications |

## Priority Levels

| Priority | Description |
|----------|-------------|
| LOW | Low importance, batched delivery |
| NORMAL | Standard delivery |
| HIGH | Important, immediate delivery |
| URGENT | Critical, all channels, bypasses quiet hours |
