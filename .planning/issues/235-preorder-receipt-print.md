# Issue #235 — Phiếu đặt hàng pre-order (in nhiệt + ảnh share)

GitHub: https://github.com/nguyenhoangtin1404/Diecast360/issues/235

## Quyết định nghiệp vụ (chốt 2026-05-25)

| # | Chủ đề | Quyết định |
|---|--------|------------|
| 1 | Ai / khi nào in | Admin: sau tạo + in lại. Khách tự đặt cũng in/share. Không auto-print khi tạo. |
| 2 | Số phiếu | `pre_order.id` (UUID v7) |
| 3 | Tổng thanh toán | Cả **đã thu** (`paid_amount`) và **còn lại** (`total_amount - paid_amount`). Đặt cọc = `deposit_amount`. |
| 4 | Chiết khấu | Luôn **0** |
| 5 | Địa chỉ khách | Thêm `members.address`; ẩn dòng nếu trống |
| 6 | Số dòng hàng | MVP: 1 đơn = 1 item. Sau: nhiều item + tách/gộp đơn (ngoài scope) |
| 7 | Khổ in | Nhiệt 58mm — `printQr.ts`. Không PDF. Nút in thủ công. |
| 8 | Trạng thái | In mọi status; hủy → nhãn **ĐÃ HỦY** |
| 9 | Header shop | Thiếu field → ẩn |
| 10 | Số tiền bằng chữ | Theo **Tổng cộng** (`total_amount`) |
| 11 | **Ảnh share** | Tạo **PNG** cùng nội dung phiếu; nút **Chia sẻ / Tải ảnh** (Zalo, FB, …). Không thay PDF. |

## Ảnh hóa đơn (share nhanh) — bổ sung

- Cùng template HTML với in nhiệt (1 nguồn truth).
- Render off-screen → `canvas` / `html2canvas` (hoặc tương đương) → PNG.
- Khổ ảnh: chiều rộng cố định (~400–480px), chiều cao theo nội dung (receipt dọc).
- Hành động:
  - **Chia sẻ** (`navigator.share` với `files[]` nếu hỗ trợ).
  - Fallback: **Tải ảnh** (`download` tên `phieu-dat-hang-{shortId}.png`).
  - Tùy chọn: **Sao chép ảnh** (clipboard) trên desktop Chromium.
- Admin + public: cùng nút cạnh **In phiếu**.
- Loading/error toast giống pattern QR.
