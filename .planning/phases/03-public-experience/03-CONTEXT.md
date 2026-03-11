---
phase: "03"
name: "public-experience"
created: 2026-03-04
---

# Phase 3: public-experience — Context

## Decisions

- Public endpoints are strict visibility gateways: only `is_public=true` and non-soft-deleted items are returned.
- Public catalog query state (`q`, brand filters, condition, sort) is URL-driven for deterministic navigation and shareable links.
- Detail media rendering priority is `spinner(default with frames) -> gallery(images) -> explicit empty-media fallback`.

## Discretion Areas

- Related-items ranking strategy may evolve (currently same-brand/model + recent fallback).
- Public catalog filter source is category metadata; future personalization can extend this.

## Deferred Ideas

- Add dedicated frontend tests for public catalog/detail URL-state and media fallback branches.
- Add server-side facet endpoint for public catalog filters to avoid category query coupling.
