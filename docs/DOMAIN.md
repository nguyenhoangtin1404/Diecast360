# Domain – Diecast360

## Bối cảnh
- Ứng dụng web giúp admin quản lý kho xe diecast tỉ lệ 1:64, đăng catalog công khai và cung cấp viewer 360° để khách xoay xe.
- Hỗ trợ bán trên Facebook qua thao tác copy caption + copy link từ trang admin.
- Mọi quy tắc dưới đây tuân theo DIECAST360_AI_MASTER_GUIDE và được dùng làm gốc cho API/DB/UX.

## Thực thể & trách nhiệm
### Item
- Mẫu xe diecast; thuộc tính chính: `id (uuid)`, `name`, `description`, `scale` (mặc định "1:64"), `brand` (tùy chọn), `car_brand`, `model_brand`, `condition`, `price`, `original_price`, `status`, `is_public`, `fb_post_content` (nội dung bài FB), `created_at`, `updated_at`, `deleted_at` (soft delete).
- Quan hệ: nhiều `ItemImage`, nhiều `SpinSet`; duy nhất 1 `SpinSet` được gắn cờ `is_default`.
- Giá trị trạng thái: `con_hang`, `giu_cho`, `da_ban` (lưu ý khi hiển thị catalog/sao chép caption).
- Ảnh cover lấy từ `ItemImage.is_cover = true`, fallback ảnh đầu tiên theo `display_order`.

### ItemImage
- Ảnh thường của item, lưu đường dẫn file + thumbnail để hiển thị gallery.
- Thuộc tính: `id`, `item_id`, `file_path`, `thumbnail_path`, `is_cover`, `display_order`, `created_at`.
- Mỗi item chỉ có 1 cover; `display_order` xác định thứ tự trong gallery.

### SpinSet
- Bộ ảnh 360° của một item.
- Thuộc tính: `id`, `item_id`, `label` (mô tả ngắn), `is_default`, `created_at`, `updated_at`.
- Một item có nhiều spin set nhưng chỉ được 1 `is_default = true`. Khi đánh dấu default, các spin set khác phải bỏ cờ default.

### SpinFrame
- 1 frame trong spin set, đại diện cho 1 góc chụp.
- Thuộc tính: `id`, `spin_set_id`, `frame_index` (0..n-1, không bỏ số), `file_path`, `thumbnail_path`, `created_at`, `updated_at`.
- Ràng buộc: `(spin_set_id, frame_index)` UNIQUE; `frame_index` liên tục sau khi reorder.

### User
- Admin hệ thống.
- Thuộc tính: `id`, `email` (duy nhất), `password_hash`, `full_name` (tùy chọn), `role` (mặc định `admin`), `is_active`, timestamp.

### RefreshToken
- Lưu refresh token đã phát hành để hỗ trợ revoke.
- Thuộc tính: `id`, `user_id`, `token_hash`, `expires_at`, `revoked_at` (nullable), `created_at`.

### AiItemDraft
- Bản nháp item do AI phân tích từ ảnh chụp sản phẩm.
- Thuộc tính: `id (uuid)`, `images_json` (JSON paths ảnh), `extracted_text` (text trích xuất), `ai_json` (dữ liệu item do AI phân tích), `confidence_json` (confidence scores), `status` (`PENDING|CONFIRMED|REJECTED`), `created_at`, `updated_at`.
- Quy trình: Upload ảnh → AI phân tích → tạo draft PENDING → user xác nhận hoặc hủy.

## Quy tắc nghiệp vụ
- Soft delete: item dùng `deleted_at`; dữ liệu đã xóa mềm không xuất hiện ở danh sách admin/public.
- Spinner:
  - Tối thiểu 1 spin set default mới cho phép hiển thị spinner; nếu chưa có → fallback gallery ảnh thường.
  - Số frame khuyến nghị 24 (tối đa 36); `frame_index` tăng dần, không bỏ số.
  - Có thumbnail cho frame (dùng Sharp).
- Ảnh thường:
  - Upload nhiều ảnh; có thể đổi cover và sắp xếp thứ tự.
  - Xóa ảnh phải cập nhật cover nếu ảnh cover bị xóa (chọn ảnh đầu tiên còn lại).
- Public catalog: chỉ hiển thị item `is_public = true` và chưa bị soft delete; trạng thái hiển thị nguyên giá trị (`con_hang/giu_cho/da_ban`).
- Social selling: UI cần cung cấp thao tác copy caption/link dựa trên dữ liệu item (không thay đổi dữ liệu gốc).

## Luồng chính
- Admin
  - Tạo item → upload ảnh thường → đặt cover + reorder → tạo spin set → upload frame → reorder frame → đặt default spin set → bật `is_public` để xuất bản.
  - Quản lý trạng thái kho (con_hang/giu_cho/da_ban), xóa mềm item, quản lý phiên đăng nhập (access/refresh token).
- Public
  - Xem danh sách item công khai, xem chi tiết item.
  - Nếu item có spin set default → dùng Spinner360 với drag/touch/autoplay/preload thông minh; nếu không → hiển thị gallery ảnh thường.
