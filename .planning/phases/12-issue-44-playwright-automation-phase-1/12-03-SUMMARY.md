---
plan: 12-03
status: complete
completed: 2026-04-24
---

# Summary: Playwright CI Integration

## One-liner
Added Playwright failure-artifact upload to CI pipeline, enabled HTML reporter in CI, and documented the E2E QA workflow in `docs/TODO.md`.

## What was built
- `.github/workflows/ci.yml` — added "Upload Playwright report on failure" step (`if: failure()`) that uploads `frontend/playwright-report/` as `playwright-report` artifact (retained 14 days).
- `frontend/playwright.config.ts` — CI reporter changed from `'github'` to `[['github'], ['html', { open: 'never' }]]` so Playwright generates a downloadable HTML report on every CI run.
- `docs/TODO.md` — added "Playwright E2E — Quy trình chạy và đọc kết quả" section with local run commands, directory structure, CI report reading guide, and debug tips.

## Key files
- `.github/workflows/ci.yml` (updated)
- `frontend/playwright.config.ts` (updated)
- `docs/TODO.md` (updated)

## Self-Check: PASSED
- CI already ran Playwright in the existing frontend job — this change only adds the artifact upload step.
- HTML reporter generates `playwright-report/index.html` with trace, screenshot, and log data.
