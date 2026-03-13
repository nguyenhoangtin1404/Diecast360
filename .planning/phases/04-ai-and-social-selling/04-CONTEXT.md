---
phase: "04"
name: "ai-and-social-selling"
created: 2026-03-04
updated: 2026-03-13
---

# Phase 4: ai-and-social-selling — Context

## Decisions

- AI endpoints keep the global `{ ok, data, message }` response envelope via the shared response interceptor, while controllers return raw DTOs.
- Provider-facing AI errors are normalized before reaching clients: `429` becomes `RATE_LIMIT_EXCEEDED`, provider `4xx` becomes sanitized `VALIDATION_ERROR`, and malformed provider payloads fall back to `INTERNAL_SERVER_ERROR`.
- AI draft import must not leave orphaned state: analysis failure stops before storage, storage/database failures trigger cleanup of already-saved draft files, and partial item-media import must surface an explicit admin warning path.
- `AISO-02` for Phase 4 is satisfied by generating a Facebook-ready caption, copying that caption, and copying the public item listing link used during manual posting; Facebook post URL copy remains optional extension behavior.
- Manual Facebook post history stores a snapshot of the best available caption at create time so later edits to `item.fb_post_content` do not rewrite history semantics.
- Cross-page admin coherence is favored over micro-optimization for this phase: social actions invalidate item detail, inventory list, and Facebook history queries to avoid stale state.

## Discretion Areas

- AI prompt wording and model choice can evolve as long as response shape, validation guarantees, and error semantics remain stable for admin consumers.
- Admin UX for partial draft import can move from basic toast/warning messaging to richer inline review flows without changing the backend contract.
- Query-cache optimization may later replace broad invalidation with targeted cache patching if admin list refetch cost becomes material.

## Deferred Ideas

- Add browser/E2E coverage for the full admin flow: AI draft import -> edit -> save -> generate caption -> save -> add/remove Facebook post link.
- Replace broad React Query invalidation in social actions with targeted `setQueryData` updates when list/history cache shapes are standardized.
- Consider shared frontend typing/helpers for API envelopes so page-level code does not need repeated generic return-shape annotations.
