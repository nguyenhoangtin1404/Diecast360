---
phase: 07-issue-57-quantity-and-custom-attributes
plan: 07-02
subsystem: backend-api
tags: [nestjs, dto-validation, inventory, json, api-contract]
requires: [07-01]
provides:
  - Item create/update APIs now accept validated `quantity` and flat `attributes` payloads.
  - Item create/update/list/detail responses now round-trip `quantity` and `attributes` consistently.
  - Sold-item writes remain stock-safe by forcing `quantity = 0` even when clients submit another value.
affects: [advanced-inventory-management, preorder-management, membership-and-points]
tech-stack:
  added: []
  patterns:
    - Flexible JSON payloads are guarded by a dedicated DTO validator instead of ad-hoc service checks.
    - Quantity persistence rules are centralized so sold-state stock invariants stay consistent across create and update flows.
key-files:
  created:
    - backend/src/items/dto/item-attributes.validator.ts
    - backend/src/items/dto/item-extensions.dto.spec.ts
    - .planning/phases/07-issue-57-quantity-and-custom-attributes/07-02-SUMMARY.md
  modified:
    - backend/src/items/dto/create-item.dto.ts
    - backend/src/items/dto/update-item.dto.ts
    - backend/src/items/items.service.ts
    - backend/src/items/items.service.spec.ts
    - docs/API_CONTRACT.md
    - .planning/ROADMAP.md
    - .planning/STATE.md
key-decisions:
  - "Custom attributes are restricted to flat scalar JSON values (`string | number | boolean | null`) so admin editing and validation stay deterministic."
  - "Null `quantity`/`attributes` payloads are rejected instead of being silently defaulted, preventing accidental stock resets and invalid JSON writes."
  - "Sold status remains authoritative over inventory count: both create and update coerce `quantity` to `0` when `status = da_ban`."
patterns-established:
  - "Use focused DTO validation specs to lock down class-transformer/class-validator behavior for new API fields."
  - "Keep persistence rules in small mapping helpers (`resolveQuantityForStatus`, `toItemAttributesJson`) rather than scattering field logic across controller/service branches."
requirements-completed: []
duration: 1 session
completed: 2026-04-01
---

# Phase 7 Plan 02 Summary

**Item APIs now validate and persist `quantity` plus flat custom `attributes` with deterministic sold-item stock behavior.**

## Performance

- Duration: 1 session
- Completed: 2026-04-01
- Tasks: 3 (DTO validation, service persistence/round-trip, contract and planning sync)
- Files modified: 7
- Files created: 3

## Accomplishments

- Added `quantity` and `attributes` to create/update DTOs with explicit validation for non-negative integer stock and flat scalar attribute objects.
- Introduced a reusable `IsItemAttributes` validator to reject nested JSON, reserved keys, oversized payloads, and invalid scalar values.
- Updated `ItemsService` create/update flows so explicit quantity/attributes persist correctly while sold items always resolve to `quantity = 0`.
- Extended service regression coverage for create/update/list/detail round-trip behavior and added DTO-focused validation tests for invalid payloads, including `null` edge cases.
- Updated API contract docs so request/response expectations for `quantity` and `attributes` are documented before the admin UI phase.
- Updated planning artifacts so Phase 7 now tracks `07-02` as completed and points the next execution step to `07-03`.

## Verification Evidence

- Command: `'/mnt/c/nvm4w/nodejs/node.exe' node_modules/jest/bin/jest.js src/items/dto/item-extensions.dto.spec.ts --runInBand --forceExit`
- Result: PASS (6 tests)
- Command: `'/mnt/c/nvm4w/nodejs/node.exe' node_modules/jest/bin/jest.js src/items/items.service.spec.ts --runInBand --forceExit`
- Result: PASS (57 tests)

## Deviations from Plan

### Intentional Scope Decisions

**1. Controller source did not require direct edits**
- Reason: `ItemsController` already binds `CreateItemDto`/`UpdateItemDto`, and global `ValidationPipe` enforcement means the API contract change is achieved by updating DTO validation rather than duplicating logic in the controller.
- Verification: DTO validation specs pass and service-level round-trip tests confirm the controller contract remains effective.

**2. Tightened null-handling beyond the initial task description**
- Reason: `class-validator` optional-field behavior can let `null` bypass validation, which would have caused silent quantity resets or invalid attribute writes.
- Fix: Replaced optional handling for the new fields with explicit `ValidateIf(... !== undefined)` checks and added regression tests.
- Verification: `src/items/dto/item-extensions.dto.spec.ts` now fails on `quantity: null` and `attributes: null`.

## Issues Encountered

- `node` is not available on the Linux PATH in this shell, so Jest verification was run via Windows `node.exe`.

## Next Phase Readiness

- `07-03` can now wire admin form controls directly to stable backend fields for `quantity` and `attributes`.
- Future inventory-oriented phases can rely on item APIs already returning deterministic stock and attribute payloads.
