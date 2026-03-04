# TODO / Roadmap - Diecast360

## Đã hoàn thành
- [x] CRUD Item + soft delete + trạng thái + bật/tắt công khai.
- [x] Quản lý danh mục (brand/car brand/model brand/scale...).
- [x] Upload ảnh thường (thumbnail, ảnh đại diện, sắp xếp, xóa).
- [x] Public catalog + chi tiết + fallback gallery/spinner.
- [x] Spinner 360 (spin set, upload/sắp xếp/xóa frame, preview).
- [x] AI mô tả sản phẩm + AI nội dung Facebook.
- [x] AI import từ ảnh.
- [x] Quản lý bài đăng Facebook thủ công (lưu link, lịch sử cơ bản).
- [x] Watermark ảnh.
- [x] CSV export.
- [x] CI cơ bản.

## Đang triển khai
- [ ] Responsive mobile cho luồng admin item 4 bước (#58).

## Backlog theo issue (ưu tiên)
- [ ] #58 - Cập nhật giao diện responsive mobile.
  Kế hoạch: `.planning/issues/58-mobile-responsive-ui.md`
- [ ] #57 - Thêm số lượng + thuộc tính đặc biệt cho sản phẩm.
  Kế hoạch: `.planning/issues/57-quantity-and-custom-attributes.md`
- [ ] #46 - Quản lý kho mở rộng cho shop mô hình.
  Kế hoạch: `.planning/issues/46-advanced-inventory-management.md`
- [ ] #13 - Quản lý danh sách mô hình pre-order.
  Kế hoạch: `.planning/issues/13-preorder-management.md`
- [ ] #49 - Thêm chức năng báo cáo thống kê.
  Kế hoạch: `.planning/issues/49-reporting-and-analytics.md`
- [ ] #48 - Quản lý điểm, hội viên.
  Kế hoạch: `.planning/issues/48-membership-and-points.md`
- [ ] #44 - Playwright automation test (giai đoạn 1).
  Kế hoạch: `.planning/issues/44-playwright-phase-1.md`
- [ ] #33 - Playwright hardening/coverage (giai đoạn 2).
  Kế hoạch: `.planning/issues/33-playwright-phase-2.md`

## Ghi chú
- #44 và #33 được tách thành 2 giai đoạn để triển khai an toàn.
- #57 là nền tảng dữ liệu cho #46, #13 và #49.
