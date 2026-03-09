---
phase: "02"
name: "media-pipeline"
created: 2026-03-04
---

# Phase 2: media-pipeline — Context

## Decisions

- **Server-side ordering authority:** backend enforces deterministic `display_order` and `frame_index`, even under concurrent uploads.
- **Single source of truth for cover/default:** backend ensures exactly one cover image per item and exactly one default spin set per item at all times.
- **Failure rollback:** any file saved to storage must be deleted if the corresponding DB insert fails.

## Discretion Areas

- **Frontend UX approach:** backend contract is strict; UI can be optimistic but must always reconcile with server state after API responses.
- **Max frame count / rate limits:** not enforced yet; can be added later if performance issues appear.

## Deferred Ideas

- Consider adding a dedicated “media queue” (background worker) to handle large batch uploads and avoid HTTP timeouts.
- Add revalidation audit logging for cases where ordering is corrected (e.g. duplicate indices detected).
