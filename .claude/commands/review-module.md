---
description: Review all existing endpoints in a module and add missing tests
argument-hint: domain (e.g., patients, lab, appointments)
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent
model: opus
---

You are the orchestrator for reviewing all existing endpoints in a module and ensuring test coverage. You will coordinate multiple agents in parallel.

**Input**: $ARGUMENTS (a domain name, e.g., `patients`, `lab`, `appointments`)

## Step 1: Discover Existing Endpoints

Scan the domain to find all existing endpoints:

1. Read the routes file: `apps/server/src/apis/{domain}/{domain}.routes.ts`
2. List all service files: `apps/server/src/apis/{domain}/services/*.ts`
3. Read API documentation: `apps/docs/src/content/docs/api/` for this domain

From the routes file, extract each endpoint's:
- HTTP method and path
- Action name (from the file naming pattern `{action}.{domain}.service.ts`)

Then check which endpoints have tests by scanning `apps/server/__tests__/{domain}/`.

Present the discovery to the user:

```
## Module: {domain}

### Existing Endpoints
1. POST   /api/{domain}       — create    [tests: YES]
2. GET    /api/{domain}       — list      [tests: NO]
3. GET    /api/{domain}/:id   — get       [tests: YES]
4. PATCH  /api/{domain}/:id   — update    [tests: NO]
5. DELETE /api/{domain}/:id   — delete    [tests: NO]

### Plan
- Review: {count} endpoints (all)
- Add tests: {count} endpoints (missing tests)

Proceed?
```

Wait for user confirmation.

## Step 2: Review All Endpoints (Parallel)

Launch a **separate `endpoint-reviewer` agent for each endpoint** in parallel.

For each endpoint, use the Agent tool with this prompt:

> Review the `{action}` endpoint in the `{domain}` domain. Files to review:
> - Validation: `apps/server/src/apis/{domain}/validations/{action}.{domain}.validation.ts`
> - Repository: `apps/server/src/apis/{domain}/repositories/{action}.{domain}.repository.ts`
> - Service: `apps/server/src/apis/{domain}/services/{action}.{domain}.service.ts`
> - Controller: `apps/server/src/apis/{domain}/controllers/{action}.{domain}.controller.ts`
> - Route entry in: `apps/server/src/apis/{domain}/{domain}.routes.ts`
> - Tests: `apps/server/__tests__/{domain}/{action}/`
>
> Focus on: security (tenantId isolation), bugs, anti-patterns, best practices, and test coverage. Verify the implementation matches the API documentation at `apps/docs/src/content/docs/api/`. Suggest concrete fixes for any issues found.

Launch ALL reviewer agents in parallel (multiple Agent tool calls in one response). Wait for all to complete. Collect findings from each.

## Step 3: Add Missing Tests (Parallel)

For each endpoint that has **no tests**, launch a **separate `endpoint-scaffolder` agent** to create test files.

For each endpoint missing tests, use the Agent tool with this prompt:

> Create tests ONLY (no other files) for the `{action}` endpoint in the `{domain}` domain.
>
> Read the existing implementation:
> - Validation: `apps/server/src/apis/{domain}/validations/{action}.{domain}.validation.ts`
> - Service: `apps/server/src/apis/{domain}/services/{action}.{domain}.service.ts`
> - Controller: `apps/server/src/apis/{domain}/controllers/{action}.{domain}.controller.ts`
> - Route: `apps/server/src/apis/{domain}/{domain}.routes.ts`
> - API docs: `apps/docs/src/content/docs/api/`
>
> Create test file at: `apps/server/__tests__/{domain}/{action}/{action}-{domain}.test.ts`
>
> Test scenarios:
> - Success case with valid input
> - Validation errors (missing required fields)
> - Authentication error (no token)
> - Authorization error (wrong permissions)
> - Domain-specific error cases (not found, conflict, etc.)
>
> Return the list of files created.

Launch ALL test-scaffolder agents in parallel. Wait for all to complete.

## Step 4: Run Tests

Run all tests for the domain:

```
npx vitest run -c apps/server/vitest.config.ts --reporter=verbose __tests__/{domain}/
```

Capture the test output.

## Step 5: Summary

Present a combined summary:

```
## Module Review: {domain}

### Endpoints Reviewed: {count}

### Review Findings (per endpoint)

#### {action} — {METHOD} /api/{domain}/...
- P0: {n} | P1: {n} | P2: {n} | P3: {n}
- {key findings}

#### {action} — {METHOD} /api/{domain}/...
- P0: {n} | P1: {n} | P2: {n} | P3: {n}
- {key findings}

...

### Tests Added
- {list of new test files created}

### Test Results
- {pass/fail summary}

### Combined Issues
- Total P0: {n} | P1: {n} | P2: {n} | P3: {n}

### Next Steps
- {fixes recommended, prioritized by severity}
```

If any P0 or P1 issues were found, offer to fix them immediately.
