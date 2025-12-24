# AI RULES – Diecast360

## Nguồn chân lý
- **DIECAST360_AI_MASTER_GUIDE** là single source of truth. Mọi thay đổi phải bám sát nội dung đó + các file trong `docs/`.
- Không sáng tác ngoài phạm vi mô tả; nếu thiếu thông tin phải hỏi lại.

## Luật chung khi code
- API/DB/response envelope không được đổi khi chưa cập nhật docs tương ứng (DOMAIN → DB → API → ERROR → ARCH → ENV → README → PROMPT_TEMPLATE).
- JSON snake_case, base path `/api/v1`, envelope chuẩn `{ok, data/message}` hoặc `{ok, error/message}`.
- Tôn trọng domain: Item soft delete, status `con_hang|giu_cho|da_ban`, 1 spin set default/item, `(spin_set_id, frame_index)` unique và liên tục.
- Upload ảnh/frame kiểm tra MIME (`ALLOWED_MIME`) và size (`MAX_UPLOAD_MB`); dùng Sharp để tạo thumbnail.
- Không lộ `password_hash/token_hash`; không hardcode secret/đường dẫn upload.

## Cách làm việc
1) Đọc yêu cầu + đối chiếu với `docs/DOMAIN.md`, `DB_SCHEMA.md`, `API_CONTRACT.md`, `ERROR_HANDLING.md`.
2) Nếu thay đổi API/DB: cập nhật docs trước, rồi mới viết code/migration.
3) Xuất kết quả là file hoàn chỉnh; không bỏ sót phần liên quan (model, DTO, validation, test nếu có).
4) Viết code dễ test, không bypass layer (Controller → Service → Repository → Storage/Processor).
5) Khi thiếu dữ liệu hoặc có xung đột, hỏi lại thay vì đoán.

## Forbidden
- Tạo thêm entity/field/endpoint không có trong docs.
- Bỏ qua rule spinner (frame_index liên tục, fallback gallery khi chưa có spin set default).
- Đổi format token hoặc response envelope.
