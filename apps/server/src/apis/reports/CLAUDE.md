# Reports Module

## Overview
Generates and manages downloadable reports (PDF/CSV) for patients, appointments, revenue, prescriptions, staff, and more with date-range filtering and grouping.

## Base Path
`/api/reports`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/` | REPORT:READ | List available report types |
| POST | `/generate` | REPORT:CREATE | Generate a new report |
| GET | `/history` | REPORT:READ | Get report generation history |
| GET | `/:reportId/download` | REPORT:READ | Download a generated report |

## Models Used
- `Report` -- generated report records with status and file references
- `Patient` -- data source for patient reports
- `Appointment` -- data source for appointment reports
- `Prescription` -- data source for prescription reports
- `Dispensing` -- data source for medicine usage reports
- `Staff` -- data source for staff reports
- `Department` -- data source for department utilization reports
- Enums: `ReportType`, `ReportFormat`, `ReportCategory`, `ReportStatus`, `PatientType`

## Special Middleware
None beyond standard `authenticate` and `authorize`.

## Seed Data
None

## Menu Items
- Parent: **Reports** (id: `reports`, icon: `assignment`, order: 14, permission: `REPORT:READ`)
  - Patient Reports: `/dashboard/reports/patients`
  - Appointment Reports: `/dashboard/reports/appointments`
  - Revenue Reports: `/dashboard/reports/revenue`

## Related
- Web routes: `apps/web/src/routes/dashboard/reports/`
- Client: `apps/web/src/lib/reports-client.ts`
- Hook: `apps/web/src/hooks/use-reports.ts`
- Docs: `apps/docs/src/content/docs/api/13-reports.md`
- Tests: `apps/server/__tests__/reports/`
