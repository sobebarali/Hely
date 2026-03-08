# EMR Module

## Overview
Manages Electronic Medical Records including clinical notes (create, update, sign, amend), medical history, problem lists, and patient timelines.

## Base Path
`/api/emr`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/notes` | `EMR:CREATE` | Create clinical note |
| GET | `/notes` | `EMR:READ` | List clinical notes |
| GET | `/notes/:noteId` | `EMR:READ` | Get clinical note |
| PUT | `/notes/:noteId` | `EMR:UPDATE` | Update clinical note |
| POST | `/notes/:noteId/sign` | `EMR:SIGN` | Sign clinical note |
| POST | `/notes/:noteId/amend` | `EMR:AMEND` | Amend clinical note |
| GET | `/patients/:patientId/history` | `EMR:READ` | Get medical history |
| PUT | `/patients/:patientId/history` | `EMR:UPDATE` | Update medical history |
| GET | `/patients/:patientId/problems` | `EMR:READ` | Get problem list |
| POST | `/patients/:patientId/problems` | `EMR:CREATE` | Add problem |
| GET | `/patients/:patientId/timeline` | `EMR:READ` | Patient timeline |

## Models Used
From `@hms/db`:
- `ClinicalNote`, `ClinicalNoteStatus`, `ClinicalNoteType`
- `MedicalHistory`
- `ProblemList`, `ProblemStatus`
- `Counter` (for note number generation)
- `DiagnosisType`
- Timeline aggregates from: `Admission`, `Appointment`, `LabOrder`, `Prescription`, `Vitals`

## Special Middleware
- No ABAC ownership policies beyond standard `authorize` checks

## Seed Data
- File: `src/lib/seed/emr.seed.ts`
- Dependencies: organizations, patients, staff

## Menu Items
```
id: "emr" (order: 8)
  label: "EMR"
  icon: "clinical_notes"
  permission: "EMR:READ"
  children:
    - "Clinical Notes" -> /dashboard/emr/notes (EMR:READ)
    - "EMR Overview"   -> /dashboard/emr       (EMR:READ)
```

## Related
- Web routes: `apps/web/src/routes/dashboard/emr/`
- Client: `apps/web/src/lib/emr-client.ts`
- Hook: `apps/web/src/hooks/use-emr.ts`
- Docs: `apps/docs/src/content/docs/api/22-emr.md`
- Tests: `apps/server/__tests__/emr/`
