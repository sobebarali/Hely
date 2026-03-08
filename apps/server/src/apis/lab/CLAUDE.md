# Lab Module

## Overview
Manages the lab diagnostics workflow -- test catalog management, lab order creation, sample collection, result entry, verification, and PDF report generation.

## Base Path
`/api/lab`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/tests` | LAB:READ | List test catalog |
| POST | `/tests` | LAB:MANAGE | Add test to catalog |
| GET | `/orders` | LAB:READ | List lab orders |
| POST | `/orders` | LAB:CREATE | Create new lab order |
| POST | `/orders/:orderId/collect` | LAB:COLLECT | Collect sample for lab order |
| POST | `/orders/:orderId/results` | LAB:RESULT | Enter results for lab order |
| POST | `/orders/:orderId/verify` | LAB:VERIFY | Verify results for lab order |
| GET | `/orders/:orderId/report` | LAB:READ | Download PDF report for verified lab order |

## Models Used
- `LabOrder` -- lab order records with test results
- `TestCatalog` -- test definitions (name, code, reference ranges, sample type)
- `Counter` -- auto-increment order numbers
- Enums: `LabOrderStatus`, `TestCatalogStatus`, `TestCategory`, `SampleType`, `TestPriority`, `ResultFlag`

## Special Middleware
None beyond standard `authenticate` and `authorize`. Note the granular permission model:
- `LAB:READ` -- view orders and reports
- `LAB:CREATE` -- create new orders
- `LAB:MANAGE` -- manage test catalog
- `LAB:COLLECT` -- collect samples
- `LAB:RESULT` -- enter test results
- `LAB:VERIFY` -- verify results (prevents self-verification)

## Seed Data
- File: `src/lib/seed/test-catalog.seed.ts`
  - Dependencies: `Organization`, `SampleType`, `TestCatalog`, `TestCatalogStatus`, `TestCategory`
- File: `src/lib/seed/lab-orders.seed.ts`
  - Dependencies: `Counter`, `LabOrder`, `LabOrderStatus`, `Organization`, `Patient`, `PatientType`, `ResultFlag`, `Role`, `SampleType`, `Staff`, `TestCatalog`, `TestPriority`

## Menu Items
- Parent: **Lab & Diagnostics** (id: `lab`, icon: `biotech`, order: 10, permission: `LAB:READ`)
  - Lab Orders: `/dashboard/lab`
  - Create Order: `/dashboard/lab/create`
  - Test Catalog: `/dashboard/lab/tests`

## Related
- Web routes: `apps/web/src/routes/dashboard/lab/`
- Client: `apps/web/src/lib/lab-client.ts`
- Hook: `apps/web/src/hooks/use-lab.ts`
- Docs: `apps/docs/src/content/docs/api/20-lab-diagnostics.md`
- Tests: `apps/server/__tests__/lab/`
