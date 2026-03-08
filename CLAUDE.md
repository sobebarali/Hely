# Hely - Healthcare Management System

## Project Overview
Multi-tenant healthcare SaaS. Turborepo monorepo with npm workspaces.

## Structure
```
apps/server    - Express 5 REST API (TypeScript, MongoDB, Redis, BullMQ)
apps/web       - Vite + React 19 dashboard (TanStack Router/Query, shadcn/ui)
apps/docs      - API documentation
packages/db    - Mongoose models (27 models, field-level encryption)
packages/config - Shared TypeScript config
```

## Commands
```bash
npm run dev           # All apps
npm run dev:server    # Server only
npm run dev:web       # Web only
npm run test          # All tests (turbo)
npm run check         # Biome lint + format
npx vitest run -c apps/server/vitest.config.ts  # Server tests only
```

## Architecture (Server)
Layered pattern — strict separation:
1. **Validation** (Zod) — parse input at API boundary
2. **Controller** — thin, calls service, returns response
3. **Service** — business logic, throws typed errors
4. **Repository** — data access only, uses Mongoose models
5. **Routes** — wires middleware + controller

File naming: `{action}.{domain}.{layer}.ts`
Example: `create.patient.service.ts`

## Multi-Tenant Rules
- `tenantId` comes from JWT (`req.user.tenantId`) — NEVER from request params
- Every DB query MUST include tenantId filter
- AsyncLocalStorage provides context: `getTenantId()`, `getUserId()`

## Error Handling
Import typed errors from `@/errors`:
```typescript
throw new NotFoundError("Patient not found");
throw new ConflictError("Email already exists");
throw new BadRequestError("Invalid input");
```
Available: BadRequest, Unauthorized, Forbidden, NotFound, Conflict, Validation, RateLimit, Internal, ServiceUnavailable

## Conventions
- Files: kebab-case. Code: camelCase
- Path alias: `@/*` maps to `src/*`
- Models imported from `@hms/db`: `import { Patient } from "@hms/db"`
- Use `lean()` for read-only queries
- Use `asyncHandler()` wrapper for controllers
- No mocking in tests — real API calls with Vitest + Supertest

## Testing
- Create test data in `beforeAll`, clean up in `afterAll`
- Each test uses unique tenant for isolation
- Test files: `apps/server/__tests__/{domain}/{action}/*.test.ts`

## Web App
- TanStack Router (file-based routing in `src/routes/`)
- TanStack Query for server state (5min stale time)
- API clients in `src/lib/*-client.ts`
- shadcn/ui components in `src/components/ui/`
- Auth tokens stored in localStorage (`hms_*` prefix)

## Automation Rules

### Before Starting Any Task
1. Read relevant docs from `apps/docs/` for the feature area
2. Read the module CLAUDE.md at `apps/server/src/apis/{module}/CLAUDE.md`
3. Read `apps/server/src/constants/rbac.constants.ts` if adding permissions
4. Read `apps/server/src/apis/menu/menu-config.ts` if adding user-facing features

### After Completing Any Task
1. Run `npm run check` to verify lint + format
2. Run tests for the affected module
3. Update the module CLAUDE.md if endpoints, middleware, or models changed
4. Update seed data if new required data was added
5. Update menu config if new user-facing pages were added

### When Adding a New Module
Follow this 13-step checklist:
1. Create directory: `apps/server/src/apis/{module}/`
2. Create `CLAUDE.md` using the Module CLAUDE.md Template below
3. Create `{module}.routes.ts` with middleware chain
4. Create controllers, services, repositories, validations subdirectories
5. Add permissions to `apps/server/src/constants/rbac.constants.ts`
6. Register routes in `apps/server/src/app.ts`
7. Create seed file at `apps/server/src/lib/seed/{module}.seed.ts` (if needed)
8. Register seed in `apps/server/src/lib/seed/seed-all.ts` (respect dependency order)
9. Add menu item to `apps/server/src/apis/menu/menu-config.ts` (if user-facing)
10. Create web API client at `apps/web/src/lib/{module}-client.ts`
11. Create React hooks at `apps/web/src/hooks/use-{module}.ts`
12. Create web routes at `apps/web/src/routes/dashboard/{module}/`
13. Create API docs at `apps/docs/src/content/docs/api/{nn}-{module}.md`
14. Add tests at `apps/server/__tests__/{module}/`

### Module CLAUDE.md Template
```markdown
# {Module Name} Module

## Overview
{One sentence description}

## Base Path
`/api/{path}`

## Endpoints
| Method | Path | Permission | Description |
|--------|------|------------|-------------|

## Models Used
{From @hms/db}

## Special Middleware
{Beyond standard authenticate/authorize/validate}

## Seed Data
- File: `src/lib/seed/{file}.ts`
- Dependencies: {list}

## Menu Items
{References in menu-config.ts}

## Related
- Web routes: `apps/web/src/routes/dashboard/{module}/`
- Client: `apps/web/src/lib/{module}-client.ts`
- Hook: `apps/web/src/hooks/use-{module}.ts`
- Docs: `apps/docs/src/content/docs/api/{nn}-{module}.md`
- Tests: `apps/server/__tests__/{module}/`
```

### Seed Data Dependency Order
When adding or modifying seed data, respect this execution order:
1. organizations (tenants, departments, users, roles)
2. medicines (master data, no deps)
3. patients (needs organizations)
4. inventory (needs medicines)
5. appointments (needs patients, staff)
6. prescriptions (needs patients, medicines, appointments)
7. vitals (needs patients, staff)
8. admissions (needs IPD patients, staff)
9. dispensing (needs prescriptions, inventory)
10. test-catalog (master data)
11. lab-orders (needs patients, test-catalog)
12. emr (needs patients, staff)
