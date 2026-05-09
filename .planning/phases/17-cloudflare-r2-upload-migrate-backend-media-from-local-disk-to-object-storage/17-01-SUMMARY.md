---
phase: 17-cloudflare-r2-upload-migrate-backend-media-from-local-disk-to-object-storage
plan: 01
subsystem: infra
tags: [cloudflare, r2, s3, nestjs, aws-sdk, presigned-url]

requires: []
provides:
  - R2StorageService implementing IStorageService with PutObject, CopyObject+DeleteObject move, presigned GetObject URLs
  - StorageModule factory selecting LocalStorageService vs R2StorageService from STORAGE_DRIVER
affects:
  - 17-cloudflare-r2-upload-migrate-backend-media-from-local-disk-to-object-storage

tech-stack:
  added: ["@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner"]
  patterns:
    - "Config-driven storage provider via useFactory + assertR2Env for r2 driver"
    - "Relative object keys match local layout (e.g. spinner/frame.jpg)"

key-files:
  created:
    - backend/src/storage/r2-storage.service.ts
    - backend/src/storage/r2-storage.service.spec.ts
  modified:
    - backend/src/storage/storage.module.ts
    - backend/src/storage/storage.interface.ts
    - backend/src/storage/local-storage.service.ts
    - backend/package.json
    - backend/.env.example

key-decisions:
  - "Presigned GET URLs use getSignedUrl; IStorageService.getFileUrl is async (Promise<string>) so TTL aligns with MEDIA_URL_TTL_MS without blocking the event loop."
  - "R2 S3 client uses region auto, forcePathStyle, endpoint https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com"

patterns-established:
  - "Consumers resolve media URLs with await Promise.all when mapping lists."

requirements-completed: [MEDI-01, MEDI-02, PLAT-02]

duration: unknown
completed: 2026-05-09
---

# Phase 17 plan 01: R2 storage provider summary

**Conditional Cloudflare R2-backed `IStorageService` with S3 API, presigned read URLs, and Jest-mocked unit tests; local disk remains the default driver.**

## Performance

- **Duration:** (not recorded)
- **Tasks:** 3 (per plan)
- **Files modified:** 20+ (including consumer await updates for async `getFileUrl`)

## Accomplishments

- Added `R2StorageService` with `saveFile`, `deleteFile`, `moveFile` (copy + delete), and presigned `getFileUrl` using `MEDIA_URL_TTL_MS` (default 7d).
- `StorageModule` wires `IStorageService` from `STORAGE_DRIVER` (`local` default, `r2` with required env validation).
- Documented `STORAGE_DRIVER` and `R2_*` variables in `backend/.env.example`.

## Task commits

Single integration commit: feat(storage): add R2 driver and async getFileUrl

## Files created/modified

- `backend/src/storage/r2-storage.service.ts` — R2 / S3 implementation
- `backend/src/storage/r2-storage.service.spec.ts` — mocked S3 `send` + presigner
- `backend/src/storage/storage.module.ts` — factory provider
- `backend/src/storage/storage.interface.ts` — `getFileUrl` → `Promise<string>`
- `backend/src/storage/local-storage.service.ts` — async `getFileUrl`
- Consumer services/specs — `await` / `Promise.all` for URL resolution

## Decisions made

- `getFileUrl` is asynchronous across the stack because `@aws-sdk/s3-request-presigner` `getSignedUrl` is async; local implementation returns the same signed API URLs via `Promise` for a uniform contract.

## Deviations from plan

### Documented deviation

**Async `getFileUrl` on `IStorageService`**

- **Issue:** Plan text assumed a synchronous `getFileUrl`; AWS presigned URL generation is async.
- **Fix:** Changed the interface to `Promise<string>` and updated all call sites to `await` (often via `Promise.all` in list mappings).
- **Verification:** `pnpm --filter ./backend test` (479 tests) green.

Otherwise the plan was followed: dependencies, R2 service, module switch, `.env.example`, and unit tests without live R2.

## Issues encountered

- None blocking; Jest 30 uses `--testPathPatterns` instead of `--testPathPattern` when running filtered suites from CLI.

## User setup required

For `STORAGE_DRIVER=r2`, configure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET` in `backend/.env` (see `backend/.env.example`). No secrets committed.

## Next phase readiness

- Plan 17-02 can focus on `MediaController` and delivery edge cases while uploads already use `IStorageService` keys compatible with R2.

---
*Phase: 17-cloudflare-r2-upload-migrate-backend-media-from-local-disk-to-object-storage*
*Completed: 2026-05-09*
