# Dispensing Module

## Overview
Handles the pharmacy dispensing workflow -- from pending prescriptions through medicine dispensing to completion, including partial dispensing and returns.

## Base Path
`/api/dispensing`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/pending` | DISPENSING:READ | List pending prescriptions awaiting dispensing |
| GET | `/history` | DISPENSING:READ | List dispensing history |
| GET | `/:prescriptionId` | DISPENSING:READ | Get dispensing by prescription ID |
| POST | `/:prescriptionId/start` | DISPENSING:CREATE | Start dispensing a prescription |
| POST | `/:prescriptionId/dispense` | DISPENSING:CREATE | Dispense medicines |
| POST | `/:prescriptionId/complete` | DISPENSING:CREATE | Complete dispensing |
| POST | `/:prescriptionId/unavailable` | DISPENSING:CREATE | Mark medicine as unavailable |
| POST | `/:prescriptionId/return` | DISPENSING:UPDATE | Return prescription to queue |

## Models Used
- `Dispensing` -- dispensing records with medicine line items
- `Prescription` -- source prescriptions for dispensing
- `Inventory` -- stock lookups during dispensing
- `Counter` -- auto-increment dispensing numbers
- Enums: `DispensingStatus`, `MedicineDispensingStatus`

## Special Middleware
- `requireFeature("PHARMACY")` -- subscription gate, requires PROFESSIONAL+ tier

## Seed Data
- File: `src/lib/seed/dispensing.seed.ts`
  - Dependencies: `Dispensing`, `DispensingStatus`, `Inventory`, `MedicineDispensingStatus`, `Organization`, `Prescription`, `PrescriptionStatus`, `Role`, `Staff`

## Menu Items
- Parent: **Dispensing** (id: `pharmacy`, icon: `local_pharmacy`, order: 9, permission: `DISPENSING:READ`)
  - Queue: `/dashboard/dispensing`
  - History: `/dashboard/dispensing/history`

## Related
- Web routes: `apps/web/src/routes/dashboard/dispensing/`
- Client: `apps/web/src/lib/dispensing-client.ts`
- Hook: `apps/web/src/hooks/use-dispensing.ts`
- Docs: `apps/docs/src/content/docs/api/10-dispensing.md`
- Tests: `apps/server/__tests__/dispensing/`
