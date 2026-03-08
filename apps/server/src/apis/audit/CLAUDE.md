# Audit Module

## Overview
Audit log management for HIPAA compliance, including log querying, user/resource trails, compliance reports, export, and chain integrity verification.

## Base Path
`/api/audit`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/logs` | `AUDIT:READ` | List audit logs with filtering and pagination |
| GET | `/logs/:id` | `AUDIT:READ` | Get a specific audit log entry |
| GET | `/users/:userId/trail` | `AUDIT:READ` | Get user's audit trail |
| GET | `/resources/:resourceType/:resourceId/trail` | `AUDIT:READ` | Get resource audit trail |
| GET | `/reports/hipaa` | `AUDIT:REPORT` | Generate HIPAA compliance report |
| GET | `/reports/phi-access` | `AUDIT:REPORT` | Generate PHI access report |
| POST | `/export` | `AUDIT:EXPORT` | Export audit logs (202 Accepted, async) |
| GET | `/export/:exportId` | `AUDIT:EXPORT` | Get export job status |
| POST | `/verify` | `AUDIT:MANAGE` | Verify audit log chain integrity |

## Models Used
- `AuditLog` - audit log entries
- `AuditExport` - export job tracking
- Enums: `AuditEventCategory`, `AuditEventType`, `AuditExportStatus`

## Special Middleware
- No special middleware beyond standard `authenticate` + `authorize`

## Seed Data
- File: None
- Dependencies: N/A

## Menu Items
- None (admin area - accessed via direct navigation or compliance admin tools)

## Related
- Web routes: `apps/web/src/routes/dashboard/audit/` (not yet created)
- Client: `apps/web/src/lib/audit-client.ts` (not yet created)
- Hook: `apps/web/src/hooks/use-audit.ts` (not yet created)
- Docs: `apps/docs/src/content/docs/api/16-audit.md`
- Tests: `apps/server/__tests__/audit/` (list-logs, get-log, user-trail, resource-trail, hipaa-report, phi-access-report, export, export-status, verify)
