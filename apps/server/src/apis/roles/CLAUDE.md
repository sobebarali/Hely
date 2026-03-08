# Roles Module

## Overview
CRUD operations for managing custom roles and permissions within a tenant.

## Base Path
`/api/roles`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/` | `ROLE:READ` | List all roles |
| GET | `/:id` | `ROLE:READ` | Get role by ID |
| POST | `/` | `ROLE:CREATE` | Create a new custom role |
| PATCH | `/:id` | `ROLE:UPDATE` | Update a role |
| DELETE | `/:id` | `ROLE:DELETE` | Delete (deactivate) a role |

## Models Used
`Role`, `Staff` (from `@hms/db`)

## Special Middleware
- All routes require authentication (`router.use(authenticate)`)
- No special middleware beyond standard authenticate/authorize/validate

## Seed Data
- File: `src/lib/seed/organizations.seed.ts`
- Dependencies: `system-roles.seed.ts` (seeds the built-in system roles)

## Menu Items
Staff > Roles in `menu-config.ts`:
- `users-roles` -- Roles (`/dashboard/staff/roles`, `ROLE:READ`)

## Related
- Web routes: `apps/web/src/routes/dashboard/staff/roles.tsx`
- Client: `apps/web/src/lib/roles-client.ts`
- Hook: `apps/web/src/hooks/use-roles.ts`
- Docs: `apps/docs/src/content/docs/api/04-roles.md`
- Tests: `apps/server/__tests__/roles/`
