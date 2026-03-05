---
description: Scaffold frontend dashboard pages for a module (reads API docs to determine what to build)
argument-hint: domain (e.g., lab, billing) or domain/page-type (e.g., lab/list)
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent
model: opus
---

You are the orchestrator for adding frontend dashboard pages. You will coordinate multiple agents to scaffold and review pages.

**Input**: $ARGUMENTS

## Step 1: Parse Arguments

Parse `$ARGUMENTS` to determine the mode:

- **Module mode** (just a domain, e.g., `lab`): Build the entire UI for this module. Go to Step 2A.
- **Single page mode** (domain/page-type, e.g., `lab/list`): Build one specific page. Go to Step 2B.

Page types for single mode: `list`, `details`, `create`, `edit`

If the format is invalid, ask the user for clarification.

## Step 2A: Module Mode — Discover Pages from API Docs

Read the API documentation for this domain from `apps/docs/src/content/docs/api/` to understand all available endpoints.

Also read the backend route file `apps/server/src/apis/{domain}/{domain}.routes.ts` to confirm actual endpoints.

Based on the endpoints, determine which pages to scaffold. Typical mapping:

| API Pattern | Page Type | Route File |
|---|---|---|
| `GET /api/{domain}` (list) | List page with table | `index.tsx` |
| `GET /api/{domain}/:id` (get by ID) | Detail page | `$id.tsx` |
| `POST /api/{domain}` (create) | Create form page | `create.tsx` |
| `PATCH/PUT /api/{domain}/:id` (update) | Edit form page (or inline in detail) | `edit.tsx` or part of `$id.tsx` |
| Domain-specific actions | Additional pages as needed | e.g., `history.tsx`, `calendar.tsx` |

Present the plan to the user:

```
## Frontend pages for {domain} module

Based on the API docs, I'll create:
1. List page — /dashboard/{domain}/ (table with filters, pagination)
2. Detail page — /dashboard/{domain}/$id (view single item)
3. Create page — /dashboard/{domain}/create (form)
... (other pages based on endpoints)

Shared layers:
- API client: src/lib/{domain}-client.ts
- Hooks: src/hooks/use-{domain}.ts
- Components: src/components/{domain}/

Proceed?
```

After confirmation, go to Step 3.

## Step 2B: Single Page Mode

Proceed directly to Step 3 with the single page type.

## Step 3: Scaffold

Use the Agent tool to launch the `page-scaffolder` agent with this prompt:

**For module mode:**
> Scaffold the complete frontend for the `{domain}` module. Read the API docs at `apps/docs/src/content/docs/api/` and the backend routes at `apps/server/src/apis/{domain}/{domain}.routes.ts` to understand all endpoints.
>
> Create these pages: {list of pages from Step 2A}
>
> Create all required layers:
> 1. API client (`src/lib/{domain}-client.ts`) — functions for ALL endpoints
> 2. TanStack Query hooks (`src/hooks/use-{domain}.ts`) — hooks for ALL endpoints
> 3. Domain components (`src/components/{domain}/`)
> 4. Route pages (`src/routes/dashboard/{domain}/`)
>
> Return the list of all files created and modified.

**For single page mode:**
> Scaffold a `{page-type}` page for the `{domain}` domain. Create all required layers: API client (if needed), TanStack Query hooks (if needed), domain components, and route page(s). Return the list of all files created and modified.

Wait for the agent to complete. Capture the list of created/modified files.

## Step 4: Review

Use the Agent tool to launch the `page-reviewer` agent with this prompt:

> Review all frontend pages in the `{domain}` domain. Focus on: data layer patterns (query keys, invalidation), component conventions (shadcn/ui usage), form handling, accessibility, and TypeScript types. Suggest concrete fixes for any issues found.

Wait for the agent to complete. Capture the review findings.

## Step 5: Summary

Present a clear summary to the user:

```
## Frontend Built: /dashboard/{domain}/

### Pages Created
- /dashboard/{domain}/ — List page (table, filters, pagination)
- /dashboard/{domain}/$id — Detail page
- /dashboard/{domain}/create — Create form
- ...

### Files Created
- {list of files}

### Files Modified
- {list of modified files}

### Review Findings
- P0: {count} | P1: {count} | P2: {count} | P3: {count}
- {key findings}

### Next Steps
- {any fixes recommended by the reviewer}
- Run `npm run dev:web` to verify the pages render correctly
- Add navigation entry in sidebar if needed
```

If the reviewer found P0 or P1 issues, offer to fix them immediately.
