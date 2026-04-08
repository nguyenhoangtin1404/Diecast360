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
- [x] Responsive mobile smoke checklist cho Phase 6 (#58).

## Responsive Smoke Checklist (#58)
Viewport mục tiêu:
- [x] `375x667`
- [x] `390x844`
- [x] `768x1024`

Admin:
- [x] `ItemsPage`: search, chuyển trang, mở item, toggle public, xóa item không bị vỡ layout/mobile card usable.
- [x] `ItemDetailPage`: đi hết 4 bước, auto-save khi đổi bước, upload ảnh thường, thao tác spinner cơ bản, social selling CTA reachable.
- [x] `CategoriesPage`: đổi tab, thêm/sửa/toggle/xóa danh mục trên mobile.
- [x] `FacebookPostsPage`: filter, search, mở social selling, mở link Facebook trên mobile.

Public:
- [x] `PublicCatalogPage`: search, filter, sort, cuộn danh sách, card spacing/CTA ổn trên mobile.
- [x] `PublicItemDetailPage`: back navigation, đọc thông tin, xem spinner/gallery, related items không overflow.

## Backlog theo issue (ưu tiên)
- [x] #58 - Cập nhật giao diện responsive mobile.
  Kế hoạch: `.planning/issues/58-mobile-responsive-ui.md`
- [x] #57 - Thêm số lượng + thuộc tính đặc biệt cho sản phẩm.
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
