# Appointments Module

## Overview
Manages appointment scheduling, OPD queue, doctor availability, check-in, completion, and cancellation workflows.

## Base Path
`/api/appointments`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/queue` | `QUEUE:READ` | Get OPD queue |
| GET | `/availability/:doctorId` | `DOCTOR:READ` | Get doctor availability |
| POST | `/` | `APPOINTMENT:CREATE` | Create new appointment |
| GET | `/` | `APPOINTMENT:READ` | List appointments with pagination |
| GET | `/:id` | `APPOINTMENT:READ` | Get appointment by ID |
| PATCH | `/:id` | `APPOINTMENT:UPDATE` | Update appointment |
| DELETE | `/:id` | `APPOINTMENT:DELETE` | Cancel appointment |
| POST | `/:id/check-in` | `QUEUE:MANAGE` | Check in patient for appointment |
| POST | `/:id/complete` | `APPOINTMENT:UPDATE` | Complete appointment |

## Models Used
From `@hms/db`:
- `Appointment`, `AppointmentStatus`, `AppointmentPriority`, `AppointmentType`
- `Counter` (for appointment number generation)
- `Patient`, `PatientType`
- `Staff`
- `Department`

## Special Middleware
- No ABAC ownership policies beyond standard `authorize` checks

## Seed Data
- File: `src/lib/seed/appointments.seed.ts`
- Dependencies: organizations, patients, staff

## Menu Items
```
id: "appointments" (order: 6)
  label: "Appointments"
  icon: "schedule"
  permission: "APPOINTMENT:READ"
  children:
    - "All Appointments" -> /dashboard/appointments          (APPOINTMENT:READ)
    - "Schedule"         -> /dashboard/appointments/schedule  (APPOINTMENT:CREATE)
    - "Calendar"         -> /dashboard/appointments/calendar  (APPOINTMENT:READ)
```

## Related
- Web routes: `apps/web/src/routes/dashboard/appointments/`
- Client: `apps/web/src/lib/appointments-client.ts`
- Hook: `apps/web/src/hooks/use-appointments.ts`
- Docs: `apps/docs/src/content/docs/api/08-appointments.md`
- Tests: `apps/server/__tests__/appointments/`
