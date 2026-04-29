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

## Playwright E2E — Quy trình chạy và đọc kết quả

### Chạy local
```bash
cd frontend
npm run test:e2e                                       # chạy toàn bộ (headless)
npm run test:e2e -- tests/e2e/auth.spec.ts             # chạy 1 file
npm run test:e2e -- --ui                               # giao diện trực quan (UI mode)
npm run test:e2e -- --headed                           # chạy trên browser thật
npm run test:e2e -- --debug                            # step-through với Playwright Inspector (chỉ dùng local, không dùng trong CI)
```

### Cấu trúc thư mục test
```
frontend/tests/e2e/
  fixtures/index.ts          # mock helpers dùng chung (auth, apiOk, ...)
  auth.spec.ts               # smoke: login, redirect, bad credentials
  items.spec.ts              # smoke: admin items page
  members.spec.ts            # smoke: members & tiers
  public-catalog.spec.ts     # smoke: public catalog (không cần auth)
  preorders.spec.ts          # smoke: pre-order admin
  reports.spec.ts            # smoke: reports page
  spinner.spec.ts            # spinner reorder + upload (mocked API)
  social-selling.spec.ts     # AI FB caption, save, link history
  responsive.spec.ts         # admin items at mobile viewport
```

### Đọc báo cáo CI
- CI tự động chạy E2E sau khi build và unit test.
- Nếu có test fail → artifact `playwright-report` được upload trong GitHub Actions.
- Download artifact → mở `index.html` để xem trace, screenshot, và log chi tiết.
- Trace file có thể xem bằng `npx playwright show-trace trace.zip`.

### Tips debug
- Thêm `await page.waitForTimeout(2000)` để xem UI tại điểm đó.
- Dùng `page.screenshot({ path: 'debug.png' })` để chụp màn hình.
- Các selector dùng role/text thay vì CSS class (CSS Modules sinh tên ngẫu nhiên).
- Mock `/api/v1/auth/csrf` để tránh Vite proxy 502 làm chậm auth trong test.

### E2E gate trên PR (Phase 13 / Issue #33)
- Job **Frontend** trong GitHub Actions là **required check** trên nhánh được bảo vệ: PR không merge nếu Playwright fail (cùng job với lint, `tsc`, unit test).
- **Fail thật vs flaky:** xem trace/screenshot trong artifact `playwright-report`. Nếu chỉ fail trên một shard/lần chạy và pass khi re-run toàn job → nghi flaky; nếu fail lặp lại cùng spec → ưu tiên sửa code hoặc mock/route.
- **Rerun:** trên PR dùng "Re-run failed jobs" hoặc "Re-run all jobs"; không merge khi job Frontend còn đỏ.
- **Sửa test:** giữ mock API deterministic (`fixtures`, `stubAuthCsrf`); tránh `waitForTimeout` cố định, ưu tiên `expect(...).toBeVisible()` / `toHaveValue()` với timeout hợp lý.

## Ghi chú
- #44 và #33 được tách thành 2 giai đoạn để triển khai an toàn.
- #57 là nền tảng dữ liệu cho #46, #13 và #49.
