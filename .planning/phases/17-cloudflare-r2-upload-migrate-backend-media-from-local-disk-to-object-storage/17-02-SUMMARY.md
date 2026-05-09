---
phase: 17-cloudflare-r2-upload-migrate-backend-media-from-local-disk-to-object-storage
plan: 02
subsystem: api
tags: [r2, s3, media, nestjs, proxy]

requires:
  - phase: 17-cloudflare-r2-upload-migrate-backend-media-from-local-disk-to-object-storage
    provides: R2StorageService, presigned getFileUrl
provides:
  - MediaController R2 proxy branch (GetObject stream after signed /api/v1/media)
  - Shared R2 S3 client factory (r2-s3.factory.ts) used by R2StorageService
affects: []

tech-stack:
  added: []
  patterns:
    - "Lazy-cached R2 client on MediaController for proxy path"
    - "Segment-based key safety check for R2 (no ..)"

key-files:
  created:
    - backend/src/storage/r2-s3.factory.ts
  modified:
    - backend/src/common/media/media.controller.ts
    - backend/src/common/media/media.controller.spec.ts
    - backend/src/storage/r2-storage.service.ts
    - docs/API_CONTRACT.md

key-decisions:
  - "Implemented R2 proxy for legacy signed /api/v1/media links; local driver unchanged and still reads UPLOAD_DIR."

patterns-established: []

requirements-completed: [MEDI-01, MEDI-02, MEDI-03]

duration: unknown
completed: 2026-05-09
---

# Phase 17 plan 02 summary

**Signed `GET /api/v1/media` now streams from Cloudflare R2 when `STORAGE_DRIVER=r2`, with no disk read of `UPLOAD_DIR`; local behavior unchanged.**

## Accomplishments

- Extracted `createR2S3ClientAndBucket`, `isR2StorageDriver`, and `normalizeR2ObjectKey` into `backend/src/storage/r2-s3.factory.ts`; `R2StorageService` reuses the factory.
- `MediaController.serveSigned` branches: R2 uses `GetObject` + pipe; local keeps `createReadStream`.
- Tests cover R2 happy path, `NoSuchKey` → 404, and misconfigured R2 env → 403.
- `docs/API_CONTRACT.md` documents URL semantics per `STORAGE_DRIVER`.

## Manual smoke (plan)

Not run in agent session: start backend with `STORAGE_DRIVER=r2` + real bucket, upload one asset, open presigned and `/media` URLs in browser.

## Deviations

None material.

---
*Phase: 17 — plan 02*
