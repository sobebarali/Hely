---
description: Scaffold API endpoints — one at a time or all endpoints for a module
argument-hint: domain (e.g., lab) or domain/action (e.g., patients/update)
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent
model: opus
---

You are the orchestrator for adding API endpoints. You will coordinate multiple agents to scaffold, review, and test endpoints.

**Input**: $ARGUMENTS

## Step 1: Parse Arguments

Parse `$ARGUMENTS` to determine the mode:

- **Module mode** (just a domain, e.g., `lab`): Build all endpoints for this domain. Go to Step 2A.
- **Single endpoint mode** (domain/action, e.g., `patients/discharge`): Build one endpoint. Go to Step 2B.

If the format is invalid, ask the user for clarification.

## Step 2A: Module Mode — Discover Endpoints from API Docs

Read the API documentation for this domain from `apps/docs/src/content/docs/api/`. This is the **primary source of truth** for what endpoints to build.

Also read API docs for any **dependent domains** referenced in the doc (e.g., if lab endpoints reference patients or departments, read those docs to understand relationships).

Based on the API doc, list all endpoints defined in the documentation.

Then **check which endpoints already exist** by scanning:
- `apps/server/src/apis/{domain}/` — look for existing service/controller/validation files
- `apps/server/src/apis/{domain}/{domain}.routes.ts` — look for already-wired routes

Categorize each endpoint as **NEW** (needs scaffolding) or **EXISTS** (skip).

Present the plan to the user:

```
## Endpoints for {domain} module

From API docs:
1. POST   /api/{domain}       — create        [NEW]
2. GET    /api/{domain}       — list          [EXISTS - skip]
3. GET    /api/{domain}/:id   — get by ID     [NEW]
4. PATCH  /api/{domain}/:id   — update        [NEW]
5. DELETE /api/{domain}/:id   — delete        [EXISTS - skip]
... (other domain-specific endpoints from the doc)

Will scaffold: {count} new endpoints
Already exist: {count} endpoints (skipped)
Dependencies: {list of dependent domain docs read}

Proceed?
```

If ALL endpoints already exist, inform the user and ask if they want to review existing code instead.

After confirmation, go to Step 3 with only the **NEW** endpoints.

## Step 2B: Single Endpoint Mode

Read the API documentation from `apps/docs/src/content/docs/api/` for this domain plus any dependent domain docs.

Check if this specific endpoint already exists by looking for `{action}.{domain}.service.ts` in `apps/server/src/apis/{domain}/services/`. If it exists, inform the user and ask if they want to overwrite or review the existing code instead.

Then go to Step 3 with the single action.

## Step 3: Scaffold (One Agent Per Endpoint)

Launch a **separate `endpoint-scaffolder` agent for each NEW endpoint**. This ensures each endpoint gets full attention and avoids hitting turn limits.

**For module mode**, launch one agent per NEW endpoint in parallel:

For each endpoint in the NEW list, use the Agent tool with this prompt:

> Scaffold the `{action}` endpoint for the `{domain}` domain. Read the API documentation at `apps/docs/src/content/docs/api/` for this domain — it is the primary source of truth for endpoint contracts (method, path, request/response schema, status codes, business rules). Also read API docs for these dependent domains: {list from Step 2A}.
>
> This endpoint: {METHOD} {path} — {action}
> Endpoints that already exist (DO NOT recreate or modify their route entries): {list of EXISTS endpoints}
>
> Create all 6 layers: validation, repository, service, controller, route entry, and test files. When adding to the routes file, preserve ALL existing routes — only ADD this endpoint's route. Return the list of all files created and modified.

Launch ALL scaffolder agents in parallel (multiple Agent tool calls in one response). Wait for all to complete. Collect the lists of created/modified files from each.

**For single endpoint mode**, launch one scaffolder agent:

> Scaffold a `{action}` endpoint for the `{domain}` domain. Read the API documentation from `apps/docs/src/content/docs/api/` for this domain — it is the primary source of truth. Also read API docs for any dependent domains referenced in the doc. Then create all 6 layers: validation, repository, service, controller, route, and test files. Return the list of all files created and modified.

Wait for the agent to complete. Capture the list of created/modified files.

**IMPORTANT**: After all scaffolder agents complete, verify the routes file (`{domain}.routes.ts`) is not corrupted from parallel writes. If multiple agents modified it, consolidate the route entries so all NEW endpoints are properly registered without duplicates.

## Step 4: Review (One Agent Per Endpoint)

Launch a **separate `endpoint-reviewer` agent for each endpoint** that was scaffolded. This ensures thorough review per endpoint.

For each scaffolded endpoint, use the Agent tool with this prompt:

> Review the `{action}` endpoint in the `{domain}` domain. Files to review:
> - Validation: `apps/server/src/apis/{domain}/validations/{action}.{domain}.validation.ts`
> - Repository: `apps/server/src/apis/{domain}/repositories/{action}.{domain}.repository.ts`
> - Service: `apps/server/src/apis/{domain}/services/{action}.{domain}.service.ts`
> - Controller: `apps/server/src/apis/{domain}/controllers/{action}.{domain}.controller.ts`
> - Route entry in: `apps/server/src/apis/{domain}/{domain}.routes.ts`
> - Tests: `apps/server/__tests__/{domain}/{action}/`
>
> Focus on: security (tenantId isolation), bugs, anti-patterns, best practices, and test coverage. Verify the implementation matches the API documentation at `apps/docs/src/content/docs/api/`. Suggest concrete fixes for any issues found.

Launch ALL reviewer agents in parallel. Wait for all to complete. Collect the review findings from each.

## Step 5: Run Tests

Run the tests for the domain using Bash:

**Module mode:**
```
npx vitest run -c apps/server/vitest.config.ts --reporter=verbose __tests__/{domain}/
```

**Single endpoint mode:**
```
npx vitest run -c apps/server/vitest.config.ts --reporter=verbose __tests__/{domain}/{action}/
```

Capture the test output (pass/fail count).

## Step 6: Summary

Present a clear summary to the user:

```
## Endpoints Added: {domain} module

### Endpoints
- {METHOD} /api/{domain}/... — {action}
- ...

### Files Created
- {list of files}

### Files Modified
- {list of modified files}

### Review Findings
- P0: {count} | P1: {count} | P2: {count} | P3: {count}
- {key findings}

### Test Results
- {pass/fail summary}

### Next Steps
- {any fixes recommended by the reviewer}
```

If the reviewer found P0 or P1 issues, offer to fix them immediately.
