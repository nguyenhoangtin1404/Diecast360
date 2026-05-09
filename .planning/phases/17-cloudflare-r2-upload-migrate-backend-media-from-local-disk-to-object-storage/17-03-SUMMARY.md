---
phase: 17-cloudflare-r2-upload-migrate-backend-media-from-local-disk-to-object-storage
plan: 03
subsystem: infra
tags: [r2, deployment, documentation, runbook]

requires:
  - phase: 17-cloudflare-r2-upload-migrate-backend-media-from-local-disk-to-object-storage
    provides: Media R2 proxy + storage driver
provides:
  - ENV / deployment / Pi docs for R2 and cutover
  - Cutover runbook in cloudflare migration plan
  - backend/scripts/README.md migration outline
affects: []

tech-stack:
  added: []
  patterns:
    - "Document rclone sync as primary migration path"

key-files:
  created:
    - backend/scripts/README.md
  modified:
    - docs/ENV.md
    - docs/DEPLOYMENT.md
    - docs/BACKEND_PI_CLOUDFLARE.md
    - docs/plans/cloudflare-r2-upload-migration.md
    - AGENTS.md

key-decisions:
  - "Staging bucket human smoke left to operator; recorded as not executed in-session below."

patterns-established: []

requirements-completed: [PLAT-01, PLAT-02]

duration: unknown
completed: 2026-05-09
---

# Phase 17 plan 03 summary

**Operator docs for `STORAGE_DRIVER` / R2, Pi uploads optionally, deployment cutover section, and a Cutover runbook with rclone example.**

## Staging bucket smoke (human checkpoint)

- [ ] **Not run** in this agent session (2026-05-09). Operator should create dev bucket + token, run backend with `STORAGE_DRIVER=r2`, upload branding + one spinner frame, confirm DB paths unchanged and images render.

## Accomplishments

- `docs/ENV.md`: table rows + **Object storage (Cloudflare R2)** subsection.
- `docs/DEPLOYMENT.md`: Pi note for R2 vs local uploads; env table rows; **§8 Cutover**.
- `docs/BACKEND_PI_CLOUDFLARE.md`: `mkdir uploads` only when `STORAGE_DRIVER=local`.
- `docs/plans/cloudflare-r2-upload-migration.md`: **Cutover runbook** (prerequisites, rclone example, validation, flag order, links to 17-01..03).
- `backend/scripts/README.md`: points to runbook and optional future Node sync outline.
- `AGENTS.md`: one-line cross-link to ENV R2 section.

## Deviations

None.

---
*Phase: 17 — plan 03*
