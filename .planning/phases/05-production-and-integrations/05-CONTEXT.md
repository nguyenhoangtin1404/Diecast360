---
phase: "05"
name: "production-and-integrations"
created: 2026-03-04
completed: 2026-03-16
---

# Phase 5: Production & Integrations — Context

## Decisions

1. **Facebook integration is optional** — validation at request time, not startup. App boots fine without `FACEBOOK_PAGE_ID` / `FACEBOOK_PAGE_ACCESS_TOKEN`.
2. **Separate endpoint for automated publish** — `POST /items/:id/facebook-posts/publish` is parallel to existing manual `POST /items/:id/facebook-posts`. No breaking changes.
3. **access_token in request body** — Graph API accepts it in both URL params and body; body chosen to avoid token leaking into server access logs.
4. **Docker healthcheck uses `node fetch`** — Alpine images don't have `wget`/`curl` by default; Node.js is always available.
5. **Frontend dev stage without `COPY . .`** — source is mounted via docker-compose volumes; removing it speeds up compose rebuilds.
6. **`ci-success` does not gate on `security` job** — security audit is advisory (`continue-on-error: true`); breaking the build on npm audit findings would cause false positives.

## Discretion Areas

- Facebook Graph API version pinned to `v21.0`; update as Facebook deprecates versions.
- Post limit hardcoded at 50 per item; adjustable if business needs change.
- Rate limit on publish endpoint: 5 req/min; tune based on production traffic.

## Deferred Ideas

- Token refresh automation (current token is long-lived, manually rotated).
- Multi-page support (currently single page via env vars).
- Publish with images/photos (current flow is text-only via `/{page-id}/feed`).
- Bulk publish across multiple items.
- Frontend E2E test for publish button flow.
