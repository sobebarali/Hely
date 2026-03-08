# Prescriptions Module

## Overview
Manages prescriptions and prescription templates with ABAC ownership policies restricting doctor access to prescriptions they created.

## Base Path
`/api/prescriptions`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/templates` | `PRESCRIPTION:READ` | List prescription templates |
| POST | `/templates` | `PRESCRIPTION:CREATE` | Create prescription template |
| GET | `/templates/:id` | `PRESCRIPTION:READ` | Get template by ID |
| PATCH | `/templates/:id` | `PRESCRIPTION:UPDATE` | Update template |
| DELETE | `/templates/:id` | `PRESCRIPTION:DELETE` | Delete template |
| POST | `/` | `PRESCRIPTION:CREATE` | Create new prescription |
| GET | `/` | `PRESCRIPTION:READ` | List prescriptions with pagination |
| GET | `/:id` | `PRESCRIPTION:READ` | Get prescription by ID |
| PATCH | `/:id` | `PRESCRIPTION:UPDATE` | Update prescription |
| PATCH | `/:id/cancel` | `PRESCRIPTION:UPDATE` | Cancel prescription |

## Models Used
From `@hms/db`:
- `Prescription`, `PrescriptionStatus`
- `PrescriptionTemplate`
- `Counter` (for prescription number generation)

## Special Middleware
- **`prescriptionOwnershipPolicy`** (ABAC) on `GET /:id`, `PATCH /:id`, and `PATCH /:id/cancel` — doctors can only access/update/cancel prescriptions they created

## Seed Data
- File: `src/lib/seed/prescriptions.seed.ts`
- Dependencies: organizations, patients, medicines, appointments

## Menu Items
```
id: "prescriptions" (order: 5)
  label: "Prescriptions"
  icon: "medication"
  permission: "PRESCRIPTION:READ"
  children:
    - "All Prescriptions" -> /dashboard/prescriptions           (PRESCRIPTION:READ)
    - "Create"            -> /dashboard/prescriptions/create    (PRESCRIPTION:CREATE)
    - "Templates"         -> /dashboard/prescriptions/templates (PRESCRIPTION:MANAGE)
```

## Related
- Web routes: `apps/web/src/routes/dashboard/prescriptions/`
- Client: `apps/web/src/lib/prescriptions-client.ts`
- Hook: `apps/web/src/hooks/use-prescriptions.ts`
- Docs: `apps/docs/src/content/docs/api/06-prescriptions.md`
- Tests: `apps/server/__tests__/prescriptions/`
