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

Then **check which pages already exist** by scanning:
- `apps/web/src/routes/dashboard/{domain}/` — look for existing route files (`index.tsx`, `$id.tsx`, `create.tsx`, etc.)
- `apps/web/src/lib/{domain}-client.ts` — check if API client exists
- `apps/web/src/hooks/use-{domain}.ts` — check if hooks exist

Categorize each page as **NEW** (needs scaffolding) or **EXISTS** (skip).

Present the plan to the user:

```
## Frontend pages for {domain} module

From API docs:
1. List page — /dashboard/{domain}/          [NEW]
2. Detail page — /dashboard/{domain}/$id     [EXISTS - skip]
3. Create page — /dashboard/{domain}/create  [NEW]
... (other pages based on endpoints)

Will scaffold: {count} new pages
Already exist: {count} pages (skipped)

Shared layers:
- API client: src/lib/{domain}-client.ts     [EXISTS - will ADD new functions]
- Hooks: src/hooks/use-{domain}.ts           [EXISTS - will ADD new hooks]
- Components: src/components/{domain}/

Proceed?
```

If ALL pages already exist, inform the user and ask if they want to review existing code instead.

After confirmation, go to Step 3 with only the **NEW** pages.

## Step 2B: Single Page Mode

Check if this specific page already exists at `apps/web/src/routes/dashboard/{domain}/{page-file}.tsx`. If it exists, inform the user and ask if they want to overwrite or review the existing code instead.

Proceed to Step 3 with the single page type.

## Step 3: Scaffold

Use the Agent tool to launch the `page-scaffolder` agent with this prompt:

**For module mode:**
> Scaffold the following NEW frontend pages for the `{domain}` module. Read the API docs at `apps/docs/src/content/docs/api/` and the backend routes at `apps/server/src/apis/{domain}/{domain}.routes.ts` to understand all endpoints.
>
> Pages to scaffold (NEW only): {list of NEW pages from Step 2A}
> Pages that already exist (DO NOT recreate): {list of EXISTS pages}
>
> Create all required layers:
> 1. API client (`src/lib/{domain}-client.ts`) — ADD functions for new endpoints only, preserve existing functions
> 2. TanStack Query hooks (`src/hooks/use-{domain}.ts`) — ADD hooks for new endpoints only, preserve existing hooks
> 3. Domain components (`src/components/{domain}/`) — create new components as needed
> 4. Route pages (`src/routes/dashboard/{domain}/`) — only create NEW route files
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
