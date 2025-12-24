# TODO / Roadmap – Diecast360

## MVP (ưu tiên cao)
- [ ] CRUD Item (soft delete, trạng thái `con_hang/giu_cho/da_ban`, toggle `is_public`).
- [ ] Upload ảnh thường (thumbnail, chọn cover, reorder, xóa).
- [ ] Public catalog (list/detail, dùng cover, trạng thái hiển thị, fallback gallery nếu chưa có spinner).
- [ ] Copy caption Facebook + copy link từ trang admin.
- [ ] Spinner 360°
  - [ ] Quản lý spin set (nhiều bộ, 1 default).
  - [ ] Upload frame (thumbnail, validate frame_index, reorder, xóa).
  - [ ] Component Spinner360 (drag/touch, autoplay, preload dần, fallback gallery nếu thiếu spinner).

## Production-like / nâng cao
- [ ] Watermark ảnh (dùng Sharp trước khi lưu/publish).
- [ ] CSV export (danh sách item + trạng thái) cho admin.
- [ ] Docker Compose (PostgreSQL + backend + frontend) với volume cho `UPLOAD_DIR`.
- [ ] CI cơ bản (lint/test/build) và publish artifact.
- [ ] README polish (hướng dẫn chạy, deploy, tài liệu chi tiết).
