# Patients Module

## Overview
Manages patient registration, listing, search, export, and updates with ABAC ownership policies restricting doctor access to assigned patients only.

## Base Path
`/api/patients`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/search` | `PATIENT:READ` | Search patients |
| GET | `/export` | `PATIENT:MANAGE` | Export patients |
| POST | `/` | `PATIENT:CREATE` | Register new patient |
| GET | `/` | `PATIENT:READ` | List patients with pagination |
| GET | `/:id` | `PATIENT:READ` | Get patient by ID |
| PATCH | `/:id` | `PATIENT:UPDATE` | Update patient |

## Models Used
From `@hms/db`:
- `Patient`
- `Counter` (for patient number generation)
- `Department`
- `Staff`

## Special Middleware
- **`checkPatientLimit`** on `POST /` — checks subscription patient limit before allowing registration
- **`patientOwnershipPolicy`** (ABAC) on `GET /:id` and `PATCH /:id` — doctors can only access/update their assigned patients

## Seed Data
- File: `src/lib/seed/patients.seed.ts`
- Dependencies: organizations (tenants, departments, staff)

## Menu Items
```
id: "patients" (order: 3)
  label: "Patients"
  icon: "people"
  permission: "PATIENT:READ"
  children:
    - "All Patients"     -> /dashboard/patients          (PATIENT:READ)
    - "Register Patient" -> /dashboard/patients/register  (PATIENT:CREATE)
    - "OPD Queue"        -> /dashboard/patients/opd-queue (QUEUE:MANAGE)
```

## Related
- Web routes: `apps/web/src/routes/dashboard/patients/`
- Client: `apps/web/src/lib/patients-client.ts`
- Hook: `apps/web/src/hooks/use-patients.ts`
- Docs: `apps/docs/src/content/docs/api/05-patients.md`
- Tests: `apps/server/__tests__/patients/`
