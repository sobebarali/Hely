# Server App - API Guidelines

## Endpoint File Structure
```
src/apis/{domain}/
  {domain}.routes.ts
  controllers/{action}.{domain}.controller.ts
  services/{action}.{domain}.service.ts
  repositories/{action}.{domain}.repository.ts
  repositories/shared.{domain}.repository.ts    # cross-endpoint queries
  validations/{action}.{domain}.validation.ts
```

## Adding a New Endpoint
1. Define Zod schema in `validations/` — export `{Action}Input` type
2. Create repository in `repositories/` — data access only
3. Create service in `services/` — business logic, throw typed errors
4. Create controller in `controllers/` — call service, send response
5. Add route in `{domain}.routes.ts` with middleware chain:
   ```typescript
   router.post("/path", authenticate, authorize([PERM]), validate(schema), controller);
   ```
6. Add tests in `__tests__/{domain}/{action}/`

## Middleware Chain
`authenticate` -> `authorize([permissions])` -> `validate(zodSchema)` -> `controller`

Optional: `checkSubscription`, `rateLimiter`

## Validation Pattern
```typescript
import { z } from "zod";
export const createPatientSchema = z.object({
  body: z.object({ name: z.string(), ... }),
  params: z.object({ ... }).optional(),
  query: z.object({ ... }).optional(),
});
export type CreatePatientInput = z.infer<typeof createPatientSchema>["body"];
```

## Controller Pattern
```typescript
import { asyncHandler } from "@/utils/async-handler";
export const createPatient = asyncHandler(async (req, res) => {
  const input = req.body as CreatePatientInput;
  const result = await createPatientService(input, req.user.tenantId);
  res.status(201).json(result);
});
```

## Repository Pattern
- Always filter by `tenantId`
- Use `lean()` for read queries
- Use field projection to limit returned data
- Log operations via structured logger

## Testing
- Real HTTP calls: `request(app).post("/api/...").set("Authorization", ...)`
- Create org/user/staff/role in `beforeAll`
- Delete test data in `afterAll`
- No mocking — test full stack

## Key Imports
```typescript
import { Patient } from "@hms/db";
import { NotFoundError, ConflictError } from "@/errors";
import { asyncHandler } from "@/utils/async-handler";
import { logger } from "@/lib/logger";
```
