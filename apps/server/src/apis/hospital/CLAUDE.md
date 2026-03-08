# Hospital Module

## Overview
Manages hospital registration, verification, profile updates, status management, and branding configuration.

## Base Path
`/api/hospitals`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/branding` | Public | Get branding by custom domain (query param `?domain=...`) |
| POST | `/` | Public | Register a new hospital |
| POST | `/:id/verify` | Public | Verify hospital using verification token |
| PATCH | `/branding` | `TENANT_UPDATE` | Update hospital branding settings |
| POST | `/branding/:type` | `TENANT_UPDATE` | Upload branding asset (logo or favicon) |
| GET | `/:id` | `TENANT_READ` | Get hospital by ID |
| PATCH | `/:id` | `TENANT_UPDATE` | Update hospital details |
| PATCH | `/:id/status` | `TENANT_MANAGE` | Update hospital status |

## Models Used
`Hospital`, `Organization`, `Account`, `User`, `Staff`, `Role`, `Counter`, `Department` (from `@hms/db`)

Also uses enums: `OrganizationType`, `PricingTier`, `HospitalStatus`, `OrganizationStatus`

## Special Middleware
- `apiRateLimiter` on public `/branding` endpoint
- Permissions imported from `../../constants` (`Permissions.TENANT_READ`, `Permissions.TENANT_UPDATE`, `Permissions.TENANT_MANAGE`)
- No authentication on registration and verification routes

## Seed Data
- File: `src/lib/seed/organizations.seed.ts`
- Dependencies: `system-roles.seed.ts`

## Menu Items
Settings children in `menu-config.ts`:
- `settings-general` -- General (`/dashboard/settings/general`, `SETTINGS:MANAGE`)
- `settings-profile` -- Hospital Profile (`/dashboard/settings/profile`, `SETTINGS:MANAGE`)
- `settings-branding` -- Branding (`/dashboard/settings/branding`, `SETTINGS:MANAGE`)

## Related
- Web routes: `apps/web/src/routes/dashboard/settings/`
- Client: `apps/web/src/lib/api-client.ts` (hospital endpoints)
- Hook: `apps/web/src/hooks/use-hospital.ts`
- Docs: `apps/docs/src/content/docs/api/01-hospital.md`
- Tests: `apps/server/__tests__/hospital/`
