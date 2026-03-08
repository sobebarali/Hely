# Compliance Module

## Overview
GDPR compliance endpoints for consent management, data export (Right of Access), data deletion (Right to Erasure), and admin request processing.

## Base Path
`/api/compliance`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/consent` | Authenticated (own data) | List all consent records for authenticated user |
| POST | `/consent` | Authenticated (own data) | Record new consent or update existing |
| PUT | `/consent/:id/withdraw` | Authenticated (own data) | Withdraw consent |
| GET | `/consent/:purpose/history` | Authenticated (own data) | Get consent history for a purpose |
| POST | `/data-export` | Authenticated (own data) | Request data export (202 Accepted) |
| GET | `/data-export/:requestId` | Authenticated (own data) | Check export status |
| GET | `/data-export/:requestId/download` | Authenticated (own data) | Download export file |
| POST | `/data-deletion` | Authenticated (own data) | Request data deletion (202 Accepted) |
| POST | `/data-deletion/:requestId/verify` | Authenticated (own data) | Verify deletion request |
| POST | `/data-deletion/:requestId/cancel` | Authenticated (own data) | Cancel deletion request |
| GET | `/data-deletion/:requestId` | Authenticated (own data) | Get deletion status |
| GET | `/requests` | `COMPLIANCE:READ` | List all data subject requests (admin) |
| PUT | `/requests/:requestId/process` | `COMPLIANCE:MANAGE` | Process data request (admin) |

## Models Used
- `Consent` - consent records
- `ConsentHistory` - consent change audit trail
- `DataSubjectRequest` - data export/deletion requests
- `Appointment`, `AuditLog`, `Prescription`, `Staff`, `User`, `Vitals` - collected during data export
- Enums: `ConsentPurpose`, `ConsentSource`, `ConsentHistoryAction`, `DataExportFormat`, `DataSubjectRequestType`, `DataSubjectRequestStatus`

## Special Middleware
- `complianceDeletionRateLimiter` - 3 deletion requests per day on `POST /data-deletion`
- `complianceVerificationRateLimiter` - 5 verification attempts per hour on `POST /data-deletion/:requestId/verify`
- Most endpoints require only authentication (no permission) since users access their own data

## Seed Data
- File: `src/lib/seed/compliance.seed.ts`
- Dependencies: organizations (tenants), users
- Creates consent records for admin user per tenant (all 6 purposes, marketing + third-party denied)

## Menu Items
- **Compliance** (`admin-compliance`): `/dashboard/admin/compliance` - requires `COMPLIANCE:MANAGE`
- **Settings > Privacy & Consent** (`settings-privacy`): `/dashboard/settings/privacy` - requires `COMPLIANCE:READ`
- **Settings > Data Export** (`settings-data-export`): `/dashboard/settings/data-export` - requires `COMPLIANCE:READ`
- **Settings > Data Deletion** (`settings-data-deletion`): `/dashboard/settings/data-deletion` - requires `COMPLIANCE:READ`

## Related
- Web routes: `apps/web/src/routes/dashboard/compliance/` (not yet created)
- Client: `apps/web/src/lib/compliance-client.ts`
- Hook: `apps/web/src/hooks/use-compliance.ts`
- Docs: `apps/docs/src/content/docs/api/18-compliance.md`
- Tests: `apps/server/__tests__/compliance/` (consent, data-deletion, data-export, admin, cross-tenant)
