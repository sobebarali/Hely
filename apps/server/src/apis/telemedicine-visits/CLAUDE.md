# Telemedicine Visits Module (INCOMPLETE)

## Overview
Partially scaffolded telemedicine visits module with only repositories and validations implemented. No routes, controllers, or services exist. This module appears to be a work-in-progress or superseded by the `telemedicine` module.

## Base Path
N/A (no routes defined)

## Endpoints
None - no route file exists.

## Models Used
- `TelemedicineVisit` - virtual visit records (same model as the `telemedicine` module)

## Existing Files
### Repositories
- `repositories/shared.telemedicine-visits.repository.ts` - `findTelemedicineVisitById`
- `repositories/create.telemedicine-visits.repository.ts` - `createTelemedicineVisit`
- `repositories/list.telemedicine-visits.repository.ts` - `listTelemedicineVisits` (with pagination and filters)

### Validations
- `validations/create.telemedicine-visits.validation.ts` - create schema (patientId, providerId, scheduledAt, type, reason, meetingLink, notes, metadata)
- `validations/list.telemedicine-visits.validation.ts` - list query schema
- `validations/get-by-id.telemedicine-visits.validation.ts` - get by ID params schema
- `validations/update.telemedicine-visits.validation.ts` - update schema

### Missing Layers
- No `telemedicine-visits.routes.ts`
- No `controllers/` directory
- No `services/` directory

## Special Middleware
N/A

## Seed Data
- File: None
- Dependencies: N/A

## Menu Items
- None

## Related
- See `telemedicine` module for the active implementation using the same `TelemedicineVisit` model
- Web routes: N/A
- Client: N/A
- Hook: N/A
- Docs: N/A
- Tests: N/A
