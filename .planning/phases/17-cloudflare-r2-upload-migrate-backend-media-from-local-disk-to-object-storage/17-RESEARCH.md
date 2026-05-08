# Phase 17 Research: Cloudflare R2 for backend media storage

**Phase:** 17 — Cloudflare R2 upload (local disk → object storage)  
**Date:** 2026-05-08

## RESEARCH COMPLETE

## 1. Code anchors (executor must re-read before coding)

**Storage contract (all features depend on this):**

- `backend/src/storage/storage.interface.ts` — `saveFile`, `deleteFile`, `moveFile`, `getFileUrl`
- `backend/src/storage/local-storage.service.ts` — disk I/O + `buildSignedMediaFileUrl` for `getFileUrl`
- `backend/src/storage/storage.module.ts` — hardcodes `LocalStorageService` as `IStorageService`

**Signed media delivery:**

- `backend/src/common/media/media.controller.ts` — resolves `UPLOAD_DIR`, streams file after `verifySignedMediaParams`
- `backend/src/common/media/signed-media.util.ts` — payload `{ p, exp }`; `p` is DB-relative key (`images/...`, `spinner/...`, `shop-branding/...`, `drafts/...`)

**Call sites (non-exhaustive; grep `IStorageService` for full list):**

- `items.service.ts` — `moveFile` drafts → `images/`
- `spinner.service.ts` — dual `saveFile` (image + thumbnail), cleanup `deleteFile`
- `shops.service.ts` — branding `saveFile` / `deleteFile`
- `ai-draft.controller.ts` — `saveFile` to `drafts/`, `getFileUrl`, rollback `deleteFile`

## 2. R2 + AWS SDK v3 (S3-compatible)

- Endpoint shape: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (see Cloudflare R2 S3 API docs).
- Use `@aws-sdk/client-s3` with `region: "auto"` (R2 convention) and `forcePathStyle: true` where applicable per current CF docs.
- **Presigned GET:** `@aws-sdk/s3-request-presigner` + `getSignedUrl` on `GetObjectCommand` — TTL should align with existing `MEDIA_URL_TTL_MS` / signing semantics so `<img src>` refresh behavior stays predictable.
- **PutObject:** set `ContentType` from file extension (mirror `MediaController` mime mapping or narrow set used by upload validators).
- **moveFile:** S3 has no rename — implement `CopyObject` + `DeleteObject`; on partial failure, planner tasks must define cleanup (mirror local `copyFile` + `unlink` fallback).

## 3. URL strategy (locked for planning)

**Recommendation:** **Presigned GET to R2** as primary `getFileUrl` when `STORAGE_DRIVER=r2` — offloads bytes from Nest/Pi, preserves expiry model.

**Backward compatibility:** Existing DB rows store **relative keys only** (not full URLs) — confirmed by `getFileUrl` building signed API URLs at read time. After R2, responses embed presigned R2 URLs until TTL expires; no DB migration for paths.

**Optional follow-up (defer if timeboxed):** Keep `GET /api/v1/media` as **proxy** to R2 for old signed links in the wild — only needed if production ever stored full `/media?...` strings in DB (grep before implementing).

## 4. Configuration surface

| Variable | Purpose |
|----------|---------|
| `STORAGE_DRIVER` | `local` (default) \| `r2` |
| `R2_ACCOUNT_ID` | R2 S3 endpoint segment |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | S3 API token |
| `R2_BUCKET` | Bucket name |
| `R2_PUBLIC_BASE_URL` | Optional; if using public bucket + short CDN URL instead of presigned (usually omit; prefer presigned) |

Document in `docs/ENV.md` + `backend/.env.example` (never commit secrets).

## 5. Testing strategy

- **Unit:** Mock S3 client (`@aws-sdk/client-s3`) like `local-storage.service.spec.ts` mocks `fs` — assert `PutObject`/`DeleteObject`/`CopyObject` args and key shape `{subfolder}/{filename}`.
- **CI:** No live R2 required; gate integration script behind env presence (document in plan 17-03).

## 6. Risks

- **Clock skew:** Presigned URL rejection if server time drifts — use modest TTL + NTP on deploy targets.
- **CORS:** Only if browser ever fetches R2 cross-origin without same-site proxy; typical `<img src=presigned>` is simple GET — validate against real domain layout.
- **moveFile mid-failure:** Orphan copies — tasks should log and optionally reconcile (same class of risk as local copy+unlink).

## 7. Relation to existing doc

Cross-check implementation order with `docs/plans/cloudflare-r2-upload-migration.md` (GitHub-issue style breakdown); plans 17-01..17-03 map to that document’s waves.
