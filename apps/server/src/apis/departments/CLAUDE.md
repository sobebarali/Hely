# Departments Module

## Overview
Manages hospital departments including hierarchy, staff assignments, and department metadata.

## Base Path
`/api/departments`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/tree` | `DEPARTMENT:READ` | Get department hierarchy tree |
| GET | `/` | `DEPARTMENT:READ` | List all departments |
| POST | `/` | `DEPARTMENT:CREATE` | Create a new department |
| GET | `/:id` | `DEPARTMENT:READ` | Get department by ID |
| PATCH | `/:id` | `DEPARTMENT:UPDATE` | Update a department |
| DELETE | `/:id` | `DEPARTMENT:DELETE` | Delete (deactivate) a department |
| GET | `/:id/staff` | `DEPARTMENT:READ` | Get staff in a department |
| POST | `/:id/staff` | `DEPARTMENT:MANAGE` | Assign staff to a department |
| DELETE | `/:id/staff/:userId` | `DEPARTMENT:MANAGE` | Remove staff from a department |

## Models Used
`Department`, `Staff`, `Role`, `User`, `Patient` (from `@hms/db`)

## Special Middleware
- All routes require authentication (`router.use(authenticate)`)
- `/tree` route is placed before `/:id` to avoid matching "tree" as an ID parameter
- No special middleware beyond standard authenticate/authorize/validate

## Seed Data
- File: `src/lib/seed/organizations.seed.ts`
- Dependencies: `system-roles.seed.ts`
- Seeds 10 departments: General Medicine, Emergency, Pharmacy, Administration, Cardiology, Neurology, Orthopedics, Pediatrics, Oncology, Radiology

## Menu Items
Departments section in `menu-config.ts`:
- `departments` -- Departments (parent, icon: `business`, `DEPARTMENT:READ`)
- `departments-list` -- All Departments (`/dashboard/departments`, `DEPARTMENT:READ`)
- `departments-add` -- Add Department (`/dashboard/departments/add`, `DEPARTMENT:CREATE`)

## Related
- Web routes: `apps/web/src/routes/dashboard/departments/`
- Client: `apps/web/src/lib/departments-client.ts`
- Hook: `apps/web/src/hooks/use-departments.ts`
- Docs: `apps/docs/src/content/docs/api/11-departments.md`
- Tests: `apps/server/__tests__/departments/`
