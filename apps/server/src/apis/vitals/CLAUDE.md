# Vitals Module

## Overview
Manages patient vital sign recording, retrieval, trends analysis, and history with ABAC ownership policies restricting doctor access to their assigned patients' vitals.

## Base Path
`/api/vitals`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/patient/:patientId/latest` | `VITALS:READ` | Get latest vitals for a patient |
| GET | `/patient/:patientId/trends` | `VITALS:READ` | Get vitals trends for a patient |
| GET | `/patient/:patientId` | `VITALS:READ` | List vitals for a patient |
| POST | `/` | `VITALS:CREATE` | Record new vitals |
| GET | `/:id` | `VITALS:READ` | Get vitals by ID |
| PATCH | `/:id` | `VITALS:UPDATE` | Update vitals (notes only) |

## Models Used
From `@hms/db`:
- `Vitals`
- `GlucoseTiming`, `GlucoseUnit`, `HeightUnit`, `TemperatureUnit`, `WeightUnit` (enums used in seed/validation)

## Special Middleware
- **`vitalsOwnershipPolicy`** (ABAC) on `GET /:id` and `PATCH /:id` — doctors can only access/update vitals for their assigned patients

## Seed Data
- File: `src/lib/seed/vitals.seed.ts`
- Dependencies: organizations, patients, staff

## Menu Items
```
id: "vitals" (order: 7)
  label: "Vitals"
  icon: "vital_signs"
  permission: "VITALS:READ"
  children:
    - "Record Vitals" -> /dashboard/vitals/record  (VITALS:CREATE)
    - "History"        -> /dashboard/vitals/history (VITALS:READ)
```

## Related
- Web routes: `apps/web/src/routes/dashboard/vitals/`
- Client: `apps/web/src/lib/vitals-client.ts`
- Hook: `apps/web/src/hooks/use-vitals.ts`
- Docs: `apps/docs/src/content/docs/api/09-vitals.md`
- Tests: `apps/server/__tests__/vitals/`
