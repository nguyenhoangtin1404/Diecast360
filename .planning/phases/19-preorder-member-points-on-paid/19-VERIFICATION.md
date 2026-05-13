---
phase: 19-preorder-member-points-on-paid
slug: 19-preorder-member-points-on-paid
updated: 2026-05-13
---

# Phase 19 — Verification strategy

## Goal-backward checks

1. Một pre-order có `member_id` hợp lệ, khi admin chuyển `ARRIVED → PAID`, member nhận đúng số điểm `floor(basis / vnd_per_point)` và ledger có một dòng `earn` với reference preorder.
2. Gọi lại / race không tạo hai dòng earn cho cùng `pre_order.id`.
3. `PAID → REFUNDED` tạo đúng một dòng trừ điểm (redeem hoặc adjust âm theo implementation) idempotent với reference refund.
4. Tạo pre-order thiếu `member_id` → 400 (hoặc lỗi validation tương đương).

## Automated signals

- `pnpm --filter ./backend test` — tests mới cho preorder loyalty + members.
- `pnpm --filter ./backend lint`
- `cd frontend && npx tsc -b --noEmit` sau khi đổi types.

## Manual UAT (ngắn)

- Admin: tạo đơn có member + số tiền đã biết → chuyển `PAID` → mở Members ledger thấy dòng lý do preorder.
- Admin: hoàn tác → ledger có dòng trừ, số dư khớp.
