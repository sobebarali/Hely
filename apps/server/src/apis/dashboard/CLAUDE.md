# Dashboard Module

## Overview
Provides role-specific dashboard statistics, widgets, quick stats, and data refresh capabilities by aggregating data across multiple domain models.

## Base Path
`/api/dashboard`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/` | (authenticated) | Get role-specific dashboard data |
| GET | `/widgets/:widgetId` | (authenticated) | Get widget data |
| GET | `/quick-stats` | (authenticated) | Get quick stats for header |
| POST | `/refresh` | (authenticated) | Force refresh dashboard data |

## Models Used
From `@hms/db`:
- `Admission`, `AdmissionStatus`
- `Appointment`, `AppointmentStatus`
- `Dispensing`, `DispensingStatus`
- `Patient`, `PatientStatus`, `PatientType`
- `Prescription`, `PrescriptionStatus`
- `Staff`, `StaffStatus`
- `Vitals`

## Special Middleware
- No authorization middleware — all endpoints require only `authenticate` (role-specific data is returned based on the user's role from the JWT)

## Seed Data
- No seed file (aggregates data from other modules)

## Menu Items
```
id: "dashboard" (order: 1)
  label: "Dashboard"
  icon: "dashboard"
  path: "/dashboard"
  permission: "DASHBOARD:VIEW"
```

## Related
- Web routes: `apps/web/src/routes/dashboard/index.tsx`
- Client: `apps/web/src/lib/dashboard-client.ts`
- Hook: `apps/web/src/hooks/use-dashboard.ts`
- Docs: `apps/docs/src/content/docs/api/12-dashboard.md`
- Tests: `apps/server/__tests__/dashboard/`
