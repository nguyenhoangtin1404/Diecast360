# Phase 19: Pre-order PAID → điểm hội viên — Context

**Gathered:** 2026-05-13  
**Status:** Ready for planning  
**Source:** Chốt nghiệp vụ trực tiếp từ hội thoại (không còn mục mở).

---

## Phase boundary

Kết nối **pre-order** với **Member** và **MemberPointsLedger**: khi đơn chuyển sang trạng thái thanh toán hoàn tất (`PAID`), tự động **cộng điểm** theo cấu hình shop; khi **hoàn tác** sau `PAID`, **trừ điểm** tương ứng. Admin shop **bắt buộc** gắn hội viên khi tạo đơn.

Phạm vi: backend (Prisma, Nest), admin UI tạo/sửa pre-order, mở rộng FSM + nhãn frontend; không bắt buộc cổng public khách tự đặt (MVP vẫn admin tạo đơn).

---

## Decisions (locked — non-negotiable)

1. **Trigger cộng điểm:** chỉ khi chuyển trạng thái sang `PAID` **thành công** (một lần duy nhất mỗi `pre_order.id` — idempotent theo ledger reference).
2. **Đối tượng:** chỉ **`Member`** đã được gắn trên đơn (`member_id`); không suy luận từ `User` trừ khi sau này mở rộng (explicitly out of scope cho phase này).
3. **Tạo đơn:** `member_id` **bắt buộc** trên API tạo pre-order (và trên UI admin tương ứng); validate `member.shop_id === preorder.shop_id`.
4. **Công thức:** shop cấu hình **`vnd_per_point`** (số VND đổi 1 điểm), ví dụ `1000` → 50.000 VND = 50 điểm, 500.000 = 500 điểm.  
   - **Làm tròn:** `floor` (xuống số nguyên điểm).  
   - **Cơ sở số tiền:** cấu hình per-shop enum **`paid_amount` | `total_amount`** (mặc định `paid_amount`). Không nhân thêm `quantity` riêng nếu `total_amount` đã phản ánh quantity trong DB hiện tại.
5. **Nhiều đơn:** mỗi đơn `PAID` là một giao dịch earn độc lập (không gộp đơn).
6. **Hoàn tác:** thêm trạng thái terminal sau `PAID` (ví dụ `REFUNDED`) chỉ cho phép từ `PAID`; khi chuyển sang đó: **trừ điểm** đối xứng với lần earn của đơn đó (idempotent theo reference `preorder_refund` + `pre_order.id`). Không cho phép quay lại `ARRIVED` từ `PAID`.

---

## Claude's discretion

- Tên enum Prisma/DB cho trạng thái hoàn tác: `REFUNDED` hoặc `REVERSED` (ưu tiên `REFUNDED` + `@map` tiếng Việt nếu giữ pattern hiện có).
- Vị trí lưu cấu hình shop: JSON field trên `shops` (ví dụ `loyalty_json`) **hoặc** cột tách `vnd_per_point` + `preorder_points_basis` — chọn cách ít migration risk nhất nhưng có default an toàn (`vnd_per_point: 1000`, `basis: paid_amount`).
- `MembersModule` export `MembersService` vs tách `PreorderLoyaltyService` — ưu tiên tránh circular import; có thể gom logic earn/refund trong một service nhỏ trong `members` hoặc `preorders` gọi Prisma transaction thuần nếu tái sử dụng resolver tier.

---

## Deferred ideas

- Tự động tạo `Member` khi thiếu.
- Public API đặt pre-order + tự gắn member.
- Đồng bộ tier/marketing push notification.

---

*Phase: 19-preorder-member-points-on-paid*
