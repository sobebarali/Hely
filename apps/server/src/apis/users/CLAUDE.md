# Users Module

## Overview
Manages staff user accounts including creation, updates, password management, and deactivation.

## Base Path
`/api/users`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/forgot-password` | Public | Initiate password reset |
| POST | `/reset-password` | Public | Complete password reset with token |
| POST | `/change-password` | Authenticated | Change own password |
| POST | `/` | `USER:CREATE` | Create a new user |
| GET | `/` | `USER:READ` | List users with pagination |
| GET | `/:id` | `USER:READ` | Get user by ID |
| PATCH | `/:id` | `USER:UPDATE` | Update user |
| DELETE | `/:id` | `USER:DELETE` | Deactivate user |
| POST | `/:id/force-password-change` | `USER:MANAGE` | Force password change on next login |

## Models Used
`User`, `Staff`, `Account`, `Role`, `Department`, `Session`, `Counter`, `Verification` (from `@hms/db`)

## Special Middleware
- `checkUserLimit` on `POST /` -- checks subscription user limit before allowing creation
- Public routes (`/forgot-password`, `/reset-password`) have no authentication
- `router.use(authenticate)` applied after public routes for all remaining endpoints

## Seed Data
- File: `src/lib/seed/organizations.seed.ts`
- Dependencies: `system-roles.seed.ts`

## Menu Items
Staff section in `menu-config.ts`:
- `users` -- Staff (parent, icon: `badge`, `USER:READ`)
- `users-list` -- All Staff (`/dashboard/staff`, `USER:READ`)
- `users-add` -- Add Staff (`/dashboard/staff/add`, `USER:CREATE`)

## Related
- Web routes: `apps/web/src/routes/dashboard/staff/`
- Client: `apps/web/src/lib/users-client.ts`
- Hook: `apps/web/src/hooks/use-users.ts`
- Docs: `apps/docs/src/content/docs/api/03-users.md`
- Tests: `apps/server/__tests__/users/`
