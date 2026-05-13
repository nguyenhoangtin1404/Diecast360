# Phase 19 — Plan check (self-verify)

## VERIFICATION PASSED

- [x] Mọi quyết định khóa trong `19-CONTEXT.md` đều có task tương ứng trong `19-01` … `19-03` (member bắt buộc, PAID earn, shop `vnd_per_point` + basis, floor, idempotent ledger, hoàn tác trừ điểm, FSM mở rộng).
- [x] `must_haves` mỗi plan gắn goal-backward; waves: 1 schema → 2 backend → 3 FSM+UI (dependency đúng).
- [x] `19-RESEARCH.md` kết thúc bằng marker `## RESEARCH COMPLETE` (chuẩn GSD).
- [x] `ROADMAP.md` đã có Phase 19 (pre-order điểm) trong overview, chi tiết và progress row (song song Phase 18 Issue #59).
- [x] Không có task nào triển khai các mục **Deferred** trong CONTEXT.

## Notes for executor

- Chạy `$gsd-execute-phase 19` (hoặc thực hiện thủ công từng `19-0X-PLAN.md`) sau `/clear` nếu context dài.
