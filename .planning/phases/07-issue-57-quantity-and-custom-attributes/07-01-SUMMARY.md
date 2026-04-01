---
phase: 07-issue-57-quantity-and-custom-attributes
plan: 07-01
subsystem: database
tags: [prisma, postgresql, jsonb, migration, inventory]
requires: [05-01]
provides:
  - Item schema now stores inventory quantity with a safe default and non-negative DB constraint.
  - Item schema now stores flexible custom attributes as JSONB with backward-compatible empty-object backfill.
  - Migration documents deterministic backfill and rollback notes for existing inventories.
affects: [advanced-inventory-management, preorder-management, membership-and-points]
tech-stack:
  added: []
  patterns:
    - Existing inventory rows are backfilled from current status instead of a blanket constant to avoid sold items retaining stock.
    - Flexible per-item metadata is stored as JSONB with an empty object default for forward-compatible API/UI work.
key-files:
  created:
    - backend/prisma/migrations/20260401000000_add_item_quantity_and_attributes/migration.sql
    - .planning/phases/07-issue-57-quantity-and-custom-attributes/07-01-SUMMARY.md
  modified:
    - backend/prisma/schema.prisma
    - backend/src/items/items.service.ts
    - backend/src/items/items.service.spec.ts
    - docs/DB_SCHEMA.md
    - .planning/ROADMAP.md
    - .planning/STATE.md
key-decisions:
  - "Backfill quantity from existing status: `da_ban` becomes `0`, all other legacy items become `1`."
  - "Store custom attributes as JSONB with `{}` default so later API/UI work can assume a consistent object shape."
  - "Enforce non-negative quantity at the database layer with a CHECK constraint instead of relying only on DTO validation."
  - "Before Phase 7 API work lands, item create/update keeps sold items at `quantity = 0` to avoid status/stock drift."
patterns-established:
  - "Safe schema migrations add columns nullable first, backfill deterministically, then tighten defaults and constraints."
  - "When schema introduces stock fields before DTO exposure, service-level defaults keep runtime behavior internally consistent."
requirements-completed: []
duration: 1 session
completed: 2026-04-01
---

# Phase 7 Plan 01 Summary

**Item inventory foundation now includes status-aware quantity backfill and JSONB custom attributes for downstream API/UI work.**

## Performance

- Duration: 1 session
- Completed: 2026-04-01
- Tasks: 4 (schema update, migration/backfill, runtime consistency guard, docs/test sync)
- Files modified: 6
- Files created: 2

## Accomplishments

- Added `quantity` to the Prisma `Item` model with a default of `1` for new records.
- Added `attributes` to the Prisma `Item` model as a JSON field with an empty-object default for flexible per-item metadata.
- Created a safe PostgreSQL migration that backfills legacy items from current status, initializes empty JSONB attributes, and adds a non-negative quantity check constraint.
- Synchronized `ItemsService` so sold items are created/updated with `quantity = 0` even before Phase `07-02` exposes explicit quantity payloads.
- Added regression tests for sold-item quantity defaults and updated DB schema docs to match the new item contract.
- Updated planning artifacts so Phase 7 now tracks `07-01` as completed and points the next execution step to `07-02`.

## Verification Evidence

- Command: `'/mnt/c/nvm4w/nodejs/node.exe' node_modules/prisma/build/index.js validate --schema prisma/schema.prisma`
- Result: PASS
- Command: `'/mnt/c/nvm4w/nodejs/node.exe' node_modules/prisma/build/index.js generate --schema prisma/schema.prisma`
- Result: PASS
- Command: `'/mnt/c/nvm4w/nodejs/node.exe' node_modules/jest/bin/jest.js src/items/items.service.spec.ts --runInBand --forceExit`
- Result: PASS (54 tests)
- Local PostgreSQL replay: PASS
- Evidence: previous migrations + seeded legacy rows applied successfully, quantity backfilled as `1/1/0` for `con_hang/giu_cho/da_ban`, and negative quantity insert was rejected by `items_quantity_non_negative_check`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Prevented sold status from drifting away from stock quantity**
- Found during: Post-implementation review
- Issue: With schema landed before DTO/API work, create/update flows could still leave a sold item at default stock.
- Fix: `ItemsService` now initializes sold items with `quantity = 0` and forces quantity to zero when status changes to `da_ban`.
- Files modified: `backend/src/items/items.service.ts`, `backend/src/items/items.service.spec.ts`
- Verification: `src/items/items.service.spec.ts` passes with new sold-item coverage.

**2. [Rule 2 - Missing Critical] Synced DB schema docs with the committed migration**
- Found during: Commit-readiness review
- Issue: `docs/DB_SCHEMA.md` no longer matched the actual Prisma/PostgreSQL contract after adding `quantity` and `attributes`.
- Fix: Added `items.quantity`, `items.attributes`, and the DB-level non-negative quantity rule to docs.
- Files modified: `docs/DB_SCHEMA.md`
- Verification: Static doc/code review against `backend/prisma/schema.prisma` and the migration SQL.

## Issues Encountered

- `node` is not available on the Linux PATH in this shell, so Prisma/Jest verification was run via Windows `node.exe`.

## Next Phase Readiness

- `07-02` can now expose `quantity` and `attributes` through DTO validation and item API responses without requiring more schema work.
- UI work in `07-03` can assume every item has a numeric quantity and an object-shaped attributes payload.
