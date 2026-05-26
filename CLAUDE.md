# CLAUDE.md — Diecast360

Behavioral guidelines for working in this codebase. Principles derived from Andrej Karpathy's observations on LLM coding pitfalls, adapted for Diecast360.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## Project snapshot

pnpm monorepo: `backend/` (NestJS 11 + Prisma 6 + PostgreSQL 16) and `frontend/` (React 19 + Vite 7 + TanStack Query + Tailwind CSS 3).

**Key docs** (always sync when changing behavior):
- [`AGENTS.md`](AGENTS.md) — env, commands, gotchas for Cursor Cloud
- [`docs/DOMAIN.md`](docs/DOMAIN.md) — business entities and rules
- [`docs/DB_SCHEMA.md`](docs/DB_SCHEMA.md) — schema and migration principles
- [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) — REST contract, envelopes, validation
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layering and module responsibilities
- [`docs/ENV.md`](docs/ENV.md) — all environment variables
- [`docs/ERROR_HANDLING.md`](docs/ERROR_HANDLING.md) — error codes and envelope format

**API conventions:**
- Prefix: `/api/v1`. Payload: JSON snake_case.
- Success: `{ ok: true, data, message }` / Error: `{ ok: false, error: { code, details }, message }`.
- Auth: **HttpOnly Cookie (primary)** or Bearer token (fallback) for admin routes. CSRF double-submit (`X-CSRF-Token` header) required on all mutating requests (`POST`/`PATCH`/`DELETE`) except `POST /auth/login`.
- Upload: `multipart/form-data`, field `file` (images) or `frame` (spinner).

**Multi-tenant:** every data query scoped to active shop (`active_shop_id`). Never return cross-shop data. `TenantGuard` is the enforcement point.

**RBAC:** `platform_super` for platform-wide admin ops (no active tenant needed). `shop_admin` for read/write in active shop. `shop_staff` is read-only on all mutating HTTP methods.

**Storage:** `STORAGE_DRIVER=local` (default, files at `UPLOAD_DIR`) or `r2` (Cloudflare R2). Media URLs are signed: `GET /api/v1/media?d=...&s=...`. Never hardcode storage paths.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

**Diecast360 examples:**
- "Add search" → clarify: by name only, or also brand/year/category? Exact or substring? Cross-tenant or scoped to active shop?
- "Fix inventory bug" → clarify: which transaction type? `stock_in`/`stock_out`/`adjustment`? Does the fix touch the ledger or just item quantity?
- "Improve pre-order flow" → clarify: admin side or public side? Which status transition is broken? Does it affect the member points ledger on `PAID`?
- "Update auth" → clarify: cookie flow or Bearer flow? Does CSRF handling need updating? Does it affect refresh token revocation?

---

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

**Diecast360 examples:**
- Don't build a generic discount engine when only percentage-off is needed.
- Don't add multi-currency support; the app is VND-only.
- Don't create a new abstract service layer when a single Prisma call suffices.
- A `WHERE name ILIKE '%query%'` beats a premature full-text or vector search for simple filtering.
- Don't add a new storage abstraction layer on top of the existing `StorageService`.

---

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

**Diecast360 examples:**
- Fixing a pre-order status transition bug → don't touch unrelated member points or inventory ledger logic.
- Adding a new item field → update schema, DTO, and the relevant UI component only — not the entire items module.
- Updating a guard decorator → don't reformat the surrounding controller or rename unrelated variables.
- Fixing a CSRF issue → don't refactor cookie handling for unrelated endpoints at the same time.

---

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**Diecast360 examples:**
- "Add member tier upgrade" → "Points crossing a tier threshold auto-upgrade the member. Downgrade does not happen automatically. Ledger records the event with `reference_type/reference_id`."
- "Fix spinner upload" → "24-frame upload succeeds. Frame order preserved after reorder. `(spin_set_id, frame_index)` unique constraint not violated. Exceeding `VITE_MAX_SPINNER_FRAMES` shows an error."
- "Fix public catalog tenant isolation" → "Requests with `shop_id` query param never bleed into another shop. Inactive shop returns 404. Anonymous requests in production return `PUBLIC_SHOP_REQUIRED (422)`."

---

## 5. Diecast360-specific invariants

**Schema:** never edit an applied migration — always create a new one. `items.shop_id` is nullable for backward compat; all new items must have a shop.

**Multi-tenant isolation:** queries on `Item`, `PreOrder`, `Member`, `InventoryTransaction`, `MemberPointsLedger` must filter by `shop_id`. `TenantGuard` enforces this — don't bypass.

**Pre-order state machine:** only valid transitions are `PENDING_CONFIRMATION → WAITING_FOR_GOODS|CANCELLED → ARRIVED|CANCELLED → PAID|CANCELLED → REFUNDED`; `REFUNDED` and `CANCELLED` are terminal. Never set status directly without going through the service state machine.

**Member FK RESTRICT:** cannot delete a member who has active (non-terminal) pre-orders. Service must check before calling DELETE; the DB will reject otherwise.

**Member points:** every points change must go through the ledger (`MemberPointsLedger`) — never mutate `points_balance` directly.

**Item `da_ban` invariant:** `quantity` is always `0` when `status = da_ban`. Service enforces this on both create and update; don't bypass.

**API contract:** changes to request/response shape must be reflected in `docs/API_CONTRACT.md`. Business logic changes go in `docs/DOMAIN.md`. Update docs before or alongside code — never after.

**Tests:** Playwright E2E suite (53 tests) is the CI quality gate. When a feature touches a covered flow, update the relevant spec. Don't delete assertions to make tests pass.

**Lint:** frontend has pre-existing lint errors — don't treat them as regressions, but don't add new ones.

**Production data isolation:** `UPLOAD_DIR` (và mọi user state khác) **không bao giờ** được đặt trong `DEPLOY_REMOTE_PATH` (mặc định `/opt/diecast360-backend`). Default đã chuyển ra `/var/lib/diecast360/uploads`. Workflow Pi dùng `rsync --delete` ở mức gốc của `DEPLOY_REMOTE_PATH`; bất kỳ thứ gì không thuộc deploy bundle và không nằm trong exclude list sẽ bị xoá. Đây là invariant rút ra từ sự cố 2026-05-26 (xem [`docs/POSTMORTEMS/2026-05-26-uploads-wiped.md`](docs/POSTMORTEMS/2026-05-26-uploads-wiped.md)).

**CI/CD touching deploy paths:** PR sửa `.github/workflows/deploy-*.yml` (đặc biệt phần `rsync`, `--delete`, `rm`, container image swap) phải:
1. Kèm `--dry-run` output trong PR description, hoặc
2. Verify trên staging Pi/VM trước, hoặc
3. Scope hẹp 1 mục tiêu để dễ review từng dòng `--delete`/`--exclude`.

Không gộp deploy changes với CI hygiene / dependency bumps / lockfile cleanup trong cùng PR.

**Data loss response:** Nghi mất dữ liệu trên production → `systemctl stop diecast360-api` **TRƯỚC** khi điều tra (bảo toàn ext4 inode cho recovery). Quy trình: [`docs/RUNBOOKS/data-loss-incident.md`](docs/RUNBOOKS/data-loss-incident.md).

**Pi single-point-of-failure:** production chạy trên 1 Raspberry Pi với 1 SSD/SD card. Đã có 2 sự cố trong 2026 mất sạch `UPLOAD_DIR`: 1 do hardware (SSD chết, ~4h downtime), 1 do software (rsync wipe). Cùng root cause vận hành: **không có backup tự động**. Cho tới khi backup chạy + test restore quarterly thành công (xem [`docs/RUNBOOKS/backup.md`](docs/RUNBOOKS/backup.md)), mọi feature đẩy thêm dữ liệu vào `UPLOAD_DIR` đều **tăng giá trị** thứ có thể mất lần tới. Cân nhắc: cutover sang R2 ([`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) §8) để loại Pi disk khỏi data path.

---

**These guidelines are working if:** diffs are minimal, questions come before implementation, rewrites due to overcomplication are rare, and every changed line traces to the stated requirement.
