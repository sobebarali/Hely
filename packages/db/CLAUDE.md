# DB Package - Model Conventions

## Structure
```
src/
  index.ts              # connectDB(), getClient(), re-exports all models
  models/{entity}.model.ts
  plugins/field-encryption.plugin.ts
```

## Model Pattern
- Mongoose schemas with TypeScript
- Every model with tenant data MUST have `tenantId` field with index
- Export model + status enums
- Use compound indexes for common query patterns (tenantId + field)

## Field-Level Encryption
- Custom plugin (`field-encryption.plugin.ts`) auto-encrypts PII/PHI
- AES-256-GCM encryption
- Specified per model (e.g., Patient encrypts name, email, phone, address)
- HIPAA/GDPR compliance requirement

## Importing Models
```typescript
import { Patient, PatientStatus } from "@hms/db";
```

## 27 Models
Core: Patient, Staff, Department, Organization, Appointment, Admission, Vitals
Clinical: Prescription, Dispensing, Medicine, Inventory, Lab Order, Test Catalog
Auth: User, Account, Session, Verification, Role
Compliance: AuditLog, AuditExport, Consent, ConsentHistory, SecurityEvent, DataSubjectRequest, KeyRotation
Business: Subscription, SubscriptionBilling, Counter
