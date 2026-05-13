# Phase 19 — RESEARCH

## RESEARCH COMPLETE

### Anchor code paths

- `backend/src/preorders/preorders.service.ts` — `transitionStatus`: optimistic `updateMany` by prior `status`; sets `completed_at` on `PAID`.
- `backend/src/preorders/domain/preorder-transition.ts` — FSM matrix; extend with `PAID → REFUNDED` only.
- `backend/src/members/members.service.ts` — `adjustPoints`: transaction, tier resolution, `MemberPointsLedger` rows; needs **reference + idempotency** for preorder-driven earn/refund.
- `backend/prisma/schema.prisma` — `PreOrder` (no `member_id` today), `Member`, `MemberPointsLedger`, `Shop`.

### Technical constraints

- `paid_amount` / `total_amount` are `Decimal`; convert to integer VND (minor units or whole VND per product convention — repo uses VND whole numbers in UI) before `floor(amount / vnd_per_point)`.
- Nest: `PreordersModule` must import loyalty/members capability; `MembersModule` currently does not `exports: [MembersService]`.
- Idempotency: unique partial index or composite unique on `(shop_id, reference_type, reference_id)` on ledger **or** application check inside single transaction after conditional preorder update.

### Frontend touchpoints

- `frontend/src/pages/admin/preorders/CreatePreOrderPage.tsx` — add member picker + pass `member_id`.
- `frontend/src/types/preorder.ts`, `frontend/src/api/preorders.ts` — DTO/types.
- `frontend/src/constants/preorder.ts` — label/colors for new status.
- `frontend/src/pages/admin/preorders/status.ts` — align transitions with backend.

### Verification hooks

- Backend unit: transition + ledger counts; refund subtracts exactly prior earn.
- E2E optional: extend `frontend/tests/e2e/preorders.spec.ts` if API mocked supports new fields.
