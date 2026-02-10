# TODO / Roadmap – Diecast360

## MVP (ưu tiên cao)
- [x] CRUD Item (soft delete, trạng thái `con_hang/giu_cho/da_ban`, toggle `is_public`).
- [x] Upload ảnh thường (thumbnail, chọn cover, reorder, xóa).
- [x] Public catalog (list/detail, dùng cover, trạng thái hiển thị, fallback gallery nếu chưa có spinner).
- [x] Copy caption Facebook + copy link từ trang admin.
- [x] Spinner 360°
  - [x] Quản lý spin set (nhiều bộ, 1 default).
  - [x] Upload frame (thumbnail, validate frame_index, reorder, xóa).
  - [x] Component Spinner360 (drag/touch, autoplay, preload dần, fallback gallery nếu thiếu spinner).

## Production-like / nâng cao
- [ ] Watermark ảnh (dùng Sharp trước khi lưu/publish).
- [x] CSV export (danh sách item + trạng thái) cho admin.
- [ ] Docker Compose (PostgreSQL + backend + frontend) với volume cho `UPLOAD_DIR`.
- [x] CI cơ bản (lint/test/build) và publish artifact.
- [x] README polish (hướng dẫn chạy, deploy, tài liệu chi tiết).
