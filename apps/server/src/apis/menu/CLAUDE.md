# Menu Module

## Overview
Returns the role-based navigation menu for the authenticated user, filtered by their permissions.

## Base Path
`/api/menu`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/` | Authenticated | Get menu items filtered by user's permissions |

## Models Used
None directly -- menu is built from the static `menu-config.ts` configuration and filtered against the user's permissions from JWT.

## Special Middleware
- All routes require authentication (`router.use(authenticate)`)
- No `authorize` middleware -- the menu endpoint itself filters items based on permissions

## Seed Data
None -- menu structure is defined statically in `menu-config.ts`.

## Menu Items
This module IS the menu system. The full menu structure is defined in `menu-config.ts`.

When adding new feature pages, `menu-config.ts` must be updated with a new entry including:
- `id` -- unique identifier
- `label` -- display name
- `icon` -- Material icon name
- `path` -- dashboard route path
- `permission` -- required permission string
- `order` -- display order
- `children` -- optional sub-menu items

Current top-level menu items (in order): Dashboard, Staff, Patients, Doctors, Prescriptions, Appointments, Vitals, EMR, Dispensing, Lab & Diagnostics, Inventory, Queue, Departments, Reports, Settings, Compliance, Security Admin.

## Related
- Web routes: N/A (menu data consumed by sidebar component)
- Client: `apps/web/src/lib/menu-client.ts`
- Hook: `apps/web/src/hooks/use-menu.ts`
- Docs: `apps/docs/src/content/docs/api/07-menu.md`
- Tests: `apps/server/__tests__/menu/`
