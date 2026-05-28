# Phase 28: Voucher — Context

**Gathered:** 2026-05-27  
**Status:** Ready for execution (plans 28-01 … 28-03)  
**Source:** PR “Voucher” + codebase audit (`pre_orders` money fields; receipt `discount_amount` placeholder trong `PreordersService.getReceipt`).

---

## Phase boundary

**Trong scope:** Mã giảm giá **theo shop** (`shop_id`), tạo/sửa/xoá (soft-deactivate) bởi **shop_admin**; áp dụng lên **pre-order** tại create/update; lưu **snapshot** số tiền giảm và tham chiếu voucher trên đơn để lịch sử không đổi khi shop sửa rule sau; **phiếu / receipt** hiển thị dòng chiết khấu khi có snapshot (thay `discount_amount: null` hiện tại).

**Ngoài scope (defer):** Voucher công khai tự nhập trên public checkout (chưa có cart thanh toán tổng quát); stack nhiều voucher trên một đơn; voucher theo **item** hoặc **category**; tích hợp Shopee/Grab; marketing referral codes.

---

## Decisions (locked cho MVP)

1. **Đối tượng áp dụng:** chỉ **PreOrder** (đã có `total_amount`, `paid_amount`, `deposit_amount`, `quantity`, `unit_price`).
2. **Tenant:** mọi query/mutation voucher và redemption **bắt buộc** `shop_id` khớp `TenantGuard` / active shop — không leak cross-shop.
3. **Kiểu giảm (MVP):** hỗ trợ đúng hai loại — **`fixed_amount_vnd`** (số tiền cố định, làm tròn theo quy tắc VND nguyên) và **`percent`** với **trần tối đa VND** (`max_discount_vnd`) bắt buộc để tránh chiết khấu vô hạn.
4. **Stacking:** tối đa **một** voucher active trên một pre-order tại mọi thời điểm; đổi mã = tính lại discount và ghi snapshot mới (ghi log audit optional — defer).
5. **Điều kiện áp dụng:** `starts_at` / `ends_at` (nullable = không giới hạn phía đó), `max_redemptions` toàn cửa hàng (nullable = không giới hạn), `min_order_total_vnd` so với basis do shop chọn (`total_amount` sau quantity — document rõ trong DOMAIN).
6. **Trạng thái đơn:** chỉ cho phép apply/replace voucher khi pre-order ở trạng thái **chưa terminal** và chưa **PAID** nếu business quyết “không đổi giá sau thanh toán” — **MVP: không cho đổi mã sau `PAID`** (align với immutability expectations trên receipt).
7. **Member:** voucher **không** bắt buộc gắn member; nếu sau này có “chỉ dành cho tier X” thì defer — không làm trong phase này.
8. **Receipt:** `getReceipt` trả `discount_amount` từ snapshot trên `PreOrder` (Decimal), không đọc live rule từ bảng voucher (tránh lệch lịch sử).

---

## Claude's discretion

- Tên bảng: `vouchers` + `voucher_redemptions` **hoặc** chỉ `vouchers` + cột nullable `pre_orders.voucher_id` + các cột snapshot (`discount_amount`, `voucher_code_snapshot`) — chọn cách ít join nhất nhưng vẫn audit được lần dùng (redemption row mỗi lần apply hợp lệ).
- Sinh mã: `crypto.randomBytes` + charset dễ đọc **hoặc** cho admin nhập code + unique per `shop_id` (case-insensitive unique index).
- Module placement: `VouchersModule` mới + hook từ `PreordersService` khi create/update payload có `voucher_code`.

---

## Deferred ideas

- Multi-voucher stack và thứ tự ưu tiên.
- Voucher giới hạn theo member / tier.
- Public self-apply và rate-limit theo IP.
- Tự động sync lại `MemberPointsLedger` khi discount làm thay đổi `paid_amount` (Phase 19 basis) — cần phase riêng nếu điều chỉnh công thức points.

---

*Phase: 28-voucher*
