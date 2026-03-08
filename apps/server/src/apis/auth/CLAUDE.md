# Auth Module

## Overview
Handles authentication, token management, MFA, and multi-tenant switching.

## Base Path
`/api/auth`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/hospitals` | Public | Get hospitals for an email (login hospital selector) |
| POST | `/token` | Public | Get access/refresh tokens (password, authorization_code, refresh_token grants) |
| POST | `/revoke` | Authenticated | Revoke access or refresh token |
| GET | `/me` | Authenticated | Get current authenticated user |
| GET | `/tenants` | Authenticated | List all tenants the user belongs to |
| POST | `/mfa/enable` | Authenticated | Enable MFA, returns TOTP secret, QR code, backup codes |
| POST | `/mfa/verify` | Authenticated | Verify TOTP code and activate MFA |
| POST | `/mfa/disable` | Authenticated | Disable MFA and remove configuration |
| POST | `/switch-tenant` | Authenticated | Switch tenant context, revokes current tokens and issues new ones |

## Models Used
`User`, `Staff`, `Account`, `Session`, `Hospital`, `Role` (from `@hms/db`)

## Special Middleware
- `authRateLimiter` on public endpoints (`/hospitals`, `/token`) to prevent brute-force and user enumeration
- No `authorize` middleware -- endpoints use `authenticate` only (no permission checks beyond login)

## Seed Data
- File: `src/lib/seed/organizations.seed.ts`
- Dependencies: `system-roles.seed.ts`

## Menu Items
None (pre-auth module)

## Related
- Web routes: `apps/web/src/routes/` (login pages, not under dashboard)
- Client: `apps/web/src/lib/auth-client.ts`
- Hook: `apps/web/src/hooks/use-auth.ts`
- Docs: `apps/docs/src/content/docs/api/02-authentication.md`
- Tests: `apps/server/__tests__/auth/`
