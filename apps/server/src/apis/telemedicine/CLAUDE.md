# Telemedicine Module

## Overview
Virtual visit management for telemedicine sessions, supporting creation, listing, retrieval, and cancellation of video/audio/chat visits.

## Base Path
`/api/telemedicine`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/visits` | `TELEMEDICINE:CREATE` | Create a virtual visit |
| GET | `/visits` | `TELEMEDICINE:READ` | List virtual visits |
| GET | `/visits/:visitId` | `TELEMEDICINE:READ` | Get a virtual visit by ID |
| POST | `/visits/:visitId/cancel` | `TELEMEDICINE:MANAGE` | Cancel a virtual visit |

## Models Used
- `TelemedicineVisit` - virtual visit records
- `Counter` - sequential ID generation for visits

## Special Middleware
- `router.use(authenticate)` applied at router level (all routes require authentication)
- No special middleware beyond standard `authenticate` + `authorize`

## Seed Data
- File: None
- Dependencies: N/A

## Menu Items
- None (no menu entry in `menu-config.ts`)

## Related
- Web routes: `apps/web/src/routes/dashboard/telemedicine/` (not yet created)
- Client: `apps/web/src/lib/telemedicine-client.ts` (not yet created)
- Hook: `apps/web/src/hooks/use-telemedicine.ts` (not yet created)
- Docs: `apps/docs/src/content/docs/api/21-telemedicine.md`
- Tests: `apps/server/__tests__/telemedicine/` (create, list, get-by-id, cancel)
