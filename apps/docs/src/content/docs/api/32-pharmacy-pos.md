---
title: Pharmacy POS API
description: API reference for pharmacy point-of-sale operations including sales, returns, receipts, and daily summaries.
---

## Overview

The Pharmacy POS API provides point-of-sale functionality for the hospital pharmacy. It supports creating sales transactions, processing returns and refunds, generating receipts, applying discounts, and generating daily sales summaries for reconciliation.

---

## Create Sale

**POST** `/api/pharmacy/sales`

Creates a new pharmacy sale transaction.

### Authentication

Required. Bearer token with `PHARMACY_POS:CREATE` permission.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| patientId | string | No | Patient ID (optional for walk-in) |
| prescriptionId | string | No | Associated prescription ID |
| items | array | Yes | Array of sale items |
| items[].medicationId | string | Yes | Medication/product ID |
| items[].name | string | Yes | Item name |
| items[].quantity | number | Yes | Quantity |
| items[].unitPrice | number | Yes | Unit price |
| items[].discount | number | No | Item-level discount percentage |
| items[].batchNumber | string | No | Inventory batch number |
| paymentMethod | string | Yes | `CASH`, `CARD`, `UPI`, `INSURANCE`, `CREDIT` |
| paymentDetails | object | No | Payment-specific details |
| paymentDetails.cardLast4 | string | No | Last 4 digits of card |
| paymentDetails.transactionRef | string | No | Payment gateway reference |
| paymentDetails.insuranceId | string | No | Patient insurance record ID |
| discount | number | No | Overall discount percentage |
| taxRate | number | No | Tax rate percentage |
| notes | string | No | Sale notes |

### Response

**Status: 201 Created**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Sale ID |
| saleId | string | Unique identifier: `{tenantId}-SALE-{sequential}` |
| patientId | string | Patient ID |
| items | array | Sale items with calculated totals |
| subtotal | number | Subtotal before discount and tax |
| discountAmount | number | Total discount amount |
| taxAmount | number | Tax amount |
| totalAmount | number | Final total |
| paymentMethod | string | Payment method |
| status | string | `COMPLETED` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid required fields |
| 400 | INSUFFICIENT_STOCK | One or more items out of stock |
| 400 | INVALID_MEDICATION | Medication ID not found |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

### Business Rules

- Sale ID auto-generated: `{tenantId}-SALE-{sequential}`
- Inventory is deducted on sale creation
- Prescription-linked sales validate medication against prescription
- At least one item required per sale

---

## List Sales

**GET** `/api/pharmacy/sales`

Retrieves a paginated list of pharmacy sales.

### Authentication

Required. Bearer token with `PHARMACY_POS:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page (max 100) |
| patientId | string | - | Filter by patient |
| paymentMethod | string | - | Filter by payment method |
| status | string | - | Filter by status |
| startDate | string | - | Filter from date (ISO 8601) |
| endDate | string | - | Filter to date (ISO 8601) |
| search | string | - | Search by sale ID or patient name |
| sortBy | string | createdAt | Sort field |
| sortOrder | string | desc | `asc` or `desc` |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| data | array | Array of sale objects |
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

## Get Sale

**GET** `/api/pharmacy/sales/:saleId`

Retrieves details of a specific sale transaction.

### Authentication

Required. Bearer token with `PHARMACY_POS:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| saleId | string | Sale ID |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Sale ID |
| saleId | string | Unique identifier |
| patientId | string | Patient ID |
| patient | object | Patient details |
| prescriptionId | string | Prescription ID |
| items | array | Sale items |
| items[].medicationId | string | Medication ID |
| items[].name | string | Item name |
| items[].quantity | number | Quantity |
| items[].unitPrice | number | Unit price |
| items[].discount | number | Item discount |
| items[].total | number | Line total |
| items[].batchNumber | string | Batch number |
| subtotal | number | Subtotal |
| discountAmount | number | Discount amount |
| taxAmount | number | Tax amount |
| totalAmount | number | Final total |
| paymentMethod | string | Payment method |
| paymentDetails | object | Payment details |
| status | string | Sale status |
| soldBy | object | Cashier details |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Sale not found |

---

## Return/Refund

**POST** `/api/pharmacy/sales/:saleId/return`

Processes a return and refund for a sale.

### Authentication

Required. Bearer token with `PHARMACY_POS:RETURN` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| saleId | string | Sale ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| items | array | Yes | Items to return |
| items[].medicationId | string | Yes | Medication ID |
| items[].quantity | number | Yes | Quantity to return |
| items[].reason | string | Yes | Return reason |
| refundMethod | string | Yes | `CASH`, `CARD`, `ORIGINAL_METHOD` |
| notes | string | No | Return notes |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Return ID |
| saleId | string | Original sale ID |
| items | array | Returned items |
| refundAmount | number | Total refund amount |
| refundMethod | string | Refund method |
| status | string | `REFUNDED` |
| createdAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | INVALID_QUANTITY | Return quantity exceeds sold quantity |
| 400 | RETURN_PERIOD_EXPIRED | Return window has passed |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Sale not found |

### Business Rules

- Returns allowed within 7 days of sale
- Returned items are added back to inventory if in acceptable condition
- Controlled substances cannot be returned
- Refund amount calculated based on original item price

---

## Get Receipt PDF

**GET** `/api/pharmacy/sales/:saleId/receipt`

Generates and downloads a sale receipt as PDF.

### Authentication

Required. Bearer token with `PHARMACY_POS:READ` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| saleId | string | Sale ID |

### Response

**Status: 200 OK**

Returns a PDF file (`application/pdf`).

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Sale not found |

---

## Daily Summary

**GET** `/api/pharmacy/sales/daily-summary`

Retrieves a daily sales summary for reconciliation.

### Authentication

Required. Bearer token with `PHARMACY_POS:READ` permission.

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| date | string | today | Summary date (ISO 8601) |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| date | string | Summary date |
| totalSales | number | Number of transactions |
| totalRevenue | number | Total revenue |
| totalDiscounts | number | Total discounts given |
| totalTax | number | Total tax collected |
| totalReturns | number | Number of returns |
| totalRefunds | number | Total refund amount |
| netRevenue | number | Net revenue (revenue - refunds) |
| byPaymentMethod | object | Breakdown by payment method |
| byPaymentMethod.CASH | number | Cash total |
| byPaymentMethod.CARD | number | Card total |
| byPaymentMethod.UPI | number | UPI total |
| byPaymentMethod.INSURANCE | number | Insurance total |
| byPaymentMethod.CREDIT | number | Credit total |
| topSellingItems | array | Top 10 selling items |
| topSellingItems[].name | string | Item name |
| topSellingItems[].quantity | number | Quantity sold |
| topSellingItems[].revenue | number | Revenue |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |

---

## Apply Discount

**POST** `/api/pharmacy/sales/:saleId/discount`

Applies or updates a discount on an existing sale (before finalization).

### Authentication

Required. Bearer token with `PHARMACY_POS:DISCOUNT` permission.

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| saleId | string | Sale ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| discountType | string | Yes | `PERCENTAGE`, `FIXED` |
| discountValue | number | Yes | Discount value (percentage or fixed amount) |
| reason | string | Yes | Reason for discount |
| approvedBy | string | No | Manager ID (required for discounts > 20%) |

### Response

**Status: 200 OK**

| Field | Type | Description |
|-------|------|-------------|
| id | string | Sale ID |
| subtotal | number | Subtotal |
| discountAmount | number | Updated discount amount |
| totalAmount | number | Updated total |
| updatedAt | string | ISO 8601 timestamp |

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_REQUEST | Missing or invalid fields |
| 400 | DISCOUNT_TOO_HIGH | Discount exceeds maximum allowed |
| 400 | APPROVAL_REQUIRED | Manager approval required for this discount level |
| 401 | UNAUTHORIZED | Missing or invalid token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Sale not found |

### Business Rules

- Discounts over 20% require manager approval
- Maximum discount is 50% of sale total
- Discount reason is recorded for audit
- Insurance sales cannot have additional discounts

---

## Sale Status Flow

| Status | Description |
|--------|-------------|
| PENDING | Sale created, payment pending |
| COMPLETED | Payment received, sale finalized |
| PARTIALLY_RETURNED | Some items returned |
| FULLY_RETURNED | All items returned |
| VOIDED | Sale voided (before completion) |

## Payment Methods

| Method | Description |
|--------|-------------|
| CASH | Cash payment |
| CARD | Credit/debit card |
| UPI | UPI digital payment |
| INSURANCE | Insurance/third-party payer |
| CREDIT | Store credit / pay later |
