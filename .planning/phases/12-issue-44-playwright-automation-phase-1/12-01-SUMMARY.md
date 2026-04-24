---
plan: 12-01
status: complete
completed: 2026-04-24
---

# Summary: Playwright Infrastructure Baseline

## One-liner
Established shared Playwright fixture layer with typed mock helpers and an `authenticatedPage` fixture extending Playwright's base `test`.

## What was built
- `frontend/tests/e2e/fixtures/index.ts` — centralised mock factories (`apiOk`, `apiError`, `authMePayload`, `authLoginPayload`) and typed constants (`ADMIN_USER`, `DEFAULT_SHOP`).
- `authenticatedPage` fixture via `test.extend()` — automatically wires `/auth/me` mock so specs can opt-in without repeating the route setup.
- `playwright.config.ts` was already production-ready (timeouts, retries, `trace: on-first-retry`, CI reporter) — no changes needed.

## Key files
- `frontend/tests/e2e/fixtures/index.ts` (created)

## Self-Check: PASSED
- Fixtures compile (TypeScript strict) with no errors.
- Pattern is consistent with existing spec files (`members.spec.ts`, `reports.spec.ts`).
