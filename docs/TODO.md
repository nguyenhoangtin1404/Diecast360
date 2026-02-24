# TODO / Roadmap – Diecast360

## MVP (ưu tiên cao)
- [x] CRUD Item (soft delete, trạng thái `con_hang/giu_cho/da_ban`, toggle `is_public`).
- [x] Quản lý danh mục (Brand, Car Brand, Model Brand, Scale, v.v.).
- [x] Upload ảnh thường (thumbnail, chọn cover, reorder, xóa).
- [x] Public catalog (list/detail, dùng cover, trạng thái hiển thị, fallback gallery nếu chưa có spinner).
- [x] Copy caption Facebook + copy link từ trang admin.
- [x] Spinner 360°
  - [x] Quản lý spin set (nhiều bộ, 1 default).
  - [x] Upload frame (thumbnail, validate frame_index, reorder, xóa).
  - [x] Component Spinner360 (drag/touch, autoplay, preload dần, fallback gallery nếu thiếu spinner).

## Tính năng AI (Đã hoàn thành)
- [x] Tự động sinh mô tả sản phẩm (SEO friendly).
- [x] Tự động viết content bán hàng Facebook (kèm hashtag, emoji).
- [x] Nhập liệu từ ảnh (Vision API): Tự động nhận diện hãng, dòng xe, tỷ lệ, màu sắc từ ảnh chụp.

## Production-like / nâng cao
- [x] Watermark ảnh (dùng Sharp trước khi lưu/publish).
- [x] CSV export (danh sách item + trạng thái) cho admin.
- [/] Docker Compose (Backend + Frontend, chưa có DB service).
- [x] CI cơ bản (lint/test/build) và publish artifact.
- [x] AI Code Review tự động trên PR (OpenAI GPT-4o-mini).
- [x] README polish (hướng dẫn chạy, deploy, tài liệu chi tiết).
