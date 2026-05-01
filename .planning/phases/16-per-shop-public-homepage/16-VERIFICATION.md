---
phase: 16-per-shop-public-homepage
status: passed
date: 2026-04-30
---

# Phase 16 Verification Report

## Scope

Per-shop public catalog: optional `shop_id` on API and client; URL/env/JWT precedence; E2E proving isolation under mocked API.

## Automated checks

| Command | Result |
|---------|--------|
| `cd backend && npx jest src/public/` | Pass |
| `cd frontend && pnpm exec tsc --noEmit` | Pass |
| `cd frontend && pnpm run build` | Pass |
| `cd frontend && pnpm exec vitest run` | Pass |
| `cd frontend && pnpm exec playwright test public-catalog.spec.ts --reporter=line` | **9 passed** (requires `pnpm exec playwright install chromium` locally if browsers missing) |

## Must-haves verified

- With `?shop_id=shop-a`, UI shows shop A fixture titles and **does not** show shop B exclusive title.
- With `?shop_id=shop-b`, converse holds.
- Without `shop_id`, aggregate fixture still renders (legacy deployment behavior).
- Preorder nav link on catalog preserves `shop_id` query.

## Requirements

- **PBLC-03**: Satisfied for API + UX when shop context is set; aggregate-without-context documented in API contract.
- **MULT-01 / MULT-03**: Public read path honors explicit shop scope without JWT overriding query.
- **QATE-02**: Additional Playwright coverage for per-shop public catalog (`public-catalog.spec.ts`). Organization-wide “release gate” enforcement remains as defined in CI / Phase 13 scope.

## Residual risks / notes

- E2E uses mocked responses (does not hit live Postgres); integration truth remains backend resolver + Prisma.
- Full Playwright suite not re-run in this report slice; CI should run full `tests/e2e` job.
