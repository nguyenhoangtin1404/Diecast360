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

- [ ] Facebook Graph API posting and comment sync
- [ ] Dockerized local stack with database service
- [ ] Production hardening for upload, auth, and observability

### Out of Scope

- Native mobile app in this milestone - web-first delivery
- Marketplace payment processing - not part of current selling flow

## Context

The repository already contains backend and frontend implementation, plus domain and API documentation under `docs/`.
Current work is focused on production-readiness and Facebook workflow automation.

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
*Last updated: 2026-03-13 after Phase 4 execution*
