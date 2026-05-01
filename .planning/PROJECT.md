# Diecast360

## What This Is

Diecast360 is a full-stack web application for managing 1:64 diecast inventory with 360-degree spinner media, a public catalog, and social-selling tools.
The main users are collectors and sellers who need to publish products quickly with consistent product content.

## Core Value

A seller can create and publish a diecast listing with complete media and ready-to-post content in one smooth flow.

## Requirements

### Validated

- [x] Item CRUD with status and soft delete
- [x] Image upload with cover and ordering
- [x] Spinner set and frame management
- [x] Public catalog listing and details
- [x] AI-generated description and Facebook caption draft

### Active

- [ ] Pre-order lifecycle management (Issue #13, Phase 9)
- [ ] Transaction-based inventory with audit trail (Issue #46, Phase 8)
- [ ] Reporting and analytics dashboard (Issue #49, Phase 10)

### Completed (milestone note)

- [x] Per-shop public homepage and catalog URLs (Phase 16 — PBLC-03)

### Out of Scope

- Native mobile app in this milestone - web-first delivery
- Marketplace payment processing - not part of current selling flow

## Context

The repository already contains backend and frontend implementation, plus domain and API documentation under `docs/`.
Current work is focused on pre-order marketplace MVP delivery, starting with pre-order schema, APIs, and admin/public mobile workflows.

## Constraints

- **Tech stack**: Node.js + NestJS + Prisma + PostgreSQL + React/Vite - aligned with existing codebase
- **API contract**: `/api/v1` and snake_case response schema - must remain stable
- **Media handling**: Spinner frame ordering and cover rules must stay deterministic for UI behavior

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Prisma with PostgreSQL as canonical data layer | Existing migrations and docs already standardized | ✓ Good |
| Keep storage abstraction for upload backend | Enables local now and object storage later | ✓ Good |
| Keep social flow centered on Facebook posting UX | Matches target seller workflow | ✓ Good |

---
*Last updated: 2026-04-08 after docs normalization*
