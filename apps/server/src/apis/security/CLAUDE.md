# Security Module

## Overview
Encryption key management and security event monitoring, including key rotation that re-encrypts all PHI data and security event logging/querying.

## Base Path
`/api/security`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/keys/status` | `SECURITY:READ` | Get current encryption key status, rotation history, and recommendations |
| POST | `/keys/rotate` | `SECURITY:MANAGE` | Rotate encryption master key (re-encrypts all data; requires .env update and restart) |
| GET | `/events` | `SECURITY:READ` | List security events with filtering (severity, type, user, tenant, date range) |
| GET | `/events/:id` | `SECURITY:READ` | Get a specific security event by ID |

## Models Used
- `SecurityEvent` - security event records
- `KeyRotation` - encryption key rotation history
- `Patient`, `Prescription`, `Staff`, `Vitals` - re-encrypted during key rotation

## Special Middleware
- No special middleware beyond standard `authenticate` + `authorize`
- WARNING: Key rotation (`POST /keys/rotate`) is a destructive operation requiring manual `.env` update and server restart

## Seed Data
- File: None
- Dependencies: N/A

## Menu Items
- **Security Admin** (`admin-security`): requires `SECURITY:READ`
  - **Overview** (`admin-security-overview`): `/dashboard/admin/security` - requires `SECURITY:READ`
  - **Security Events** (`admin-security-events`): `/dashboard/admin/security/events` - requires `SECURITY:READ`
  - **Encryption Keys** (`admin-security-keys`): `/dashboard/admin/security/keys` - requires `SECURITY:MANAGE`

## Related
- Web routes: `apps/web/src/routes/dashboard/security/` (not yet created)
- Client: `apps/web/src/lib/security-client.ts`
- Hook: `apps/web/src/hooks/use-security.ts`
- Docs: `apps/docs/src/content/docs/api/15-security.md`
- Tests: `apps/server/__tests__/security/` (events, key-management, access-control, encryption, mfa)
