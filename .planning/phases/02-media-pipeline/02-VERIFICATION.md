---
phase: 02-media-pipeline
plan: 02-01
date: 2026-03-10
status: completed
---

# Phase 2 Verification Report

## Verification Commands

- `backend`: `npm run build` -> pass
- `backend`: `npx jest src/images/images.service.spec.ts src/spinner/spinner.service.spec.ts --runInBand` -> pass (48 tests)
- `frontend`: `npm run test:unit` -> pass (27 tests)
- `frontend`: `npx playwright test tests/e2e/spinner-max-frames.spec.ts --project=chromium` -> pass (2 tests)
- `lint`: backend lint pass with warnings only; frontend lint pass

## Issue Matrix (18 items)

| ID | Severity | Final Status | Evidence |
|---|---|---|---|
| 1 | Major | Fixed | `backend/src/images/images.service.ts` (`reorderImages` validation + reorder inside Serializable transaction with retry) |
| 2 | Critical | Fixed | `backend/src/spinner/spinner.service.ts` (`deleteFrame` uses `reorderSpinFramesSafely` 2-phase SQL) |
| 3 | Critical | Fixed | `backend/src/images/images.service.ts` (`deleteImage` uses `reorderItemImagesSafely` 2-phase) |
| 4 | Major | Fixed | `backend/src/images/images.service.ts` (`ensureSingleCover` accepts preloaded images and returns fresh DB state when needed) |
| 5 | Major | Fixed | `backend/src/images/images.service.ts` (`insertImageWithOrdering` queries `existingCover` only when required) |
| 6 | Major | Fixed | `backend/src/spinner/spinner.service.ts` (`reorderSpinFramesSafely` bulk SQL with VALUES) |
| 7 | Major | Fixed | `backend/src/common/upload/upload-support.service.ts` reused by `ImagesService` + `SpinnerService` |
| 8 | Major | Fixed | `UploadSupportService.resolveMaxUploadBytes/resolveMaxSpinnerFrames` fallback + warn (no constructor throw) |
| 9 | Minor | Fixed | `ensureSingleCover` now transaction-client based; no internal transaction overload branch |
| 10 | Minor | Fixed | `backend/src/spinner/spinner.service.ts` uses `Prisma.SpinSetUpdateInput` |
| 11 | Major | Fixed | Image/spinner filenames use distinct prefixes (`img_`, `thumb_`, `frame_`) |
| 12 | Minor/Suggestion | Fixed | `frontend/tests/e2e/spinner-max-frames.spec.ts` stubs/captures `window.alert` |
| 13 | Minor/Suggestion | Fixed | `frontend/vitest.config.ts` sets `test.environment = 'jsdom'` |
| 14 | Minor/Suggestion | Fixed | `backend/src/images/images.service.spec.ts` includes retry + re-validation race case |
| 15 | Minor/Suggestion | Fixed | `backend/src/spinner/spinner.service.spec.ts` includes deleteFrame unique-conflict regression case |
| 16 | Minor/Suggestion | Fixed | `frontend/playwright.config.ts` uses `webServer.url` readiness; CI runs targeted E2E |
| 17 | Suggestion | Fixed | Retry loops in `insertImageWithOrdering` and `insertFrameWithOrdering` clarified (no ambiguous tail branch) |
| 18 | Suggestion | Fixed | `frontend/src/constants/spinner.ts` reads `import.meta.env.VITE_MAX_SPINNER_FRAMES` directly |

## Additional Closure Notes

- CI now includes backend unit test execution in `.github/workflows/ci.yml`.
- Playwright cache usage improved: browser install runs only on cache miss in CI.
- API contract unchanged (no route/payload changes).

## Residual Risks

- Backend lint still has legacy warnings outside phase-2 scope (no blocking errors).
- Large pre-existing dirty working tree exists; phase-2 closure changes were scoped to media/CI/planning files only.
