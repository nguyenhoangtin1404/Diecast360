---
phase: "01"
name: "inventory-foundation"
created: 2026-03-04
updated: 2026-03-05
---

# Phase 1: inventory-foundation — Context

## Decisions

- Item lifecycle rules are enforced in the service layer before persistence, not left to UI assumptions.
- Inventory list behavior must remain deterministic, with stable pagination and sorting so admin workflows do not drift as data grows.
- `da_ban` is treated as a terminal state for the initial lifecycle model; backward transitions are blocked.
- Category metadata used by items must resolve against active taxonomy records so downstream filters stay coherent.

## Discretion Areas

- Admin list UX can evolve independently as long as it continues to honor the canonical `/items` query contract.
- Additional lifecycle states can be introduced later if business flow expands, but Phase 1 keeps the status model intentionally minimal.
- Validation detail can be tightened over time, provided the item service remains the single authority for lifecycle/business-rule checks.

## Deferred Ideas

- Add audit/history tracking for item status changes instead of relying only on current-state fields.
- Extend item attributes beyond the initial core fields once quantity/custom-attribute work lands.
- Add dedicated frontend tests for inventory list filtering/search/pagination behavior rather than relying mostly on backend service coverage.
