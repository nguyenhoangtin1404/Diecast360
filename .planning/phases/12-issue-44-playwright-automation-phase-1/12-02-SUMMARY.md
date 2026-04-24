---
plan: 12-02
status: complete
completed: 2026-04-24
---

# Summary: Smoke E2E Coverage

## One-liner
Added auth, admin-items, and public-catalog Playwright smoke specs covering critical user journeys with mocked API routes.

## What was built
- `frontend/tests/e2e/auth.spec.ts` — 4 scenarios: login form render, successful login redirect, bad-credentials error, protected-route redirect.
- `frontend/tests/e2e/items.spec.ts` — 3 scenarios: page heading, item row count from mocked API, input presence. Key learnings: item names render in both a `mobileOnly` div and a `desktopOnly` td per row; `getByText().first()` returns the hidden mobile element, so h1 + tbody row count is used instead.
- `frontend/tests/e2e/public-catalog.spec.ts` — 3 scenarios: product names from public API, search input, unauthenticated access.

## Key files
- `frontend/tests/e2e/auth.spec.ts` (created)
- `frontend/tests/e2e/items.spec.ts` (created)
- `frontend/tests/e2e/public-catalog.spec.ts` (created)

## Self-Check: PASSED
- All 10 tests pass locally.
- Items page requires `/auth/csrf` mock to avoid slow Vite proxy 502; documented inline.
