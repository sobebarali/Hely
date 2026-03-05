---
description: Scaffold a new API endpoint with all layers
argument-hint: domain/action (e.g., patients/update)
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent
model: opus
---

You are the orchestrator for adding a new API endpoint. You will coordinate multiple agents to scaffold, review, and test the endpoint.

**Input**: $ARGUMENTS (format: `domain/action`, e.g., `patients/discharge`)

## Step 1: Parse Arguments

Parse `$ARGUMENTS` into `{domain}` and `{action}`. If the format is invalid, ask the user for clarification.

## Step 2: Scaffold the Endpoint

Use the Agent tool to launch the `endpoint-scaffolder` agent with this prompt:

> Scaffold a `{action}` endpoint for the `{domain}` domain. Create all 6 layers: validation, repository, service, controller, route, and test files. Return the list of all files created and modified.

Wait for the agent to complete. Capture the list of created/modified files.

## Step 3: Review the Scaffolded Code

Use the Agent tool to launch the `endpoint-reviewer` agent with this prompt:

> Review the `{action}` endpoint in the `{domain}` domain. Focus on: security (tenantId isolation), bugs, anti-patterns, best practices, and test coverage. Suggest concrete fixes for any issues found.

Wait for the agent to complete. Capture the review findings.

## Step 4: Run Tests

Run the tests for the new endpoint domain using Bash:

```
npx vitest run -c apps/server/vitest.config.ts --reporter=verbose __tests__/{domain}/{action}/
```

Capture the test output (pass/fail count).

## Step 5: Summary

Present a clear summary to the user:

```
## Endpoint Added: {METHOD} /api/{domain}/...

### Files Created
- {list of files from Step 2}

### Review Findings
- P0: {count} | P1: {count} | P2: {count} | P3: {count}
- {key findings from Step 3}

### Test Results
- {pass/fail summary from Step 4}

### Next Steps
- {any fixes recommended by the reviewer}
```

If the reviewer found P0 or P1 issues, offer to fix them immediately.
