# PROMPT TEMPLATE – Diecast360

Sử dụng khi nhờ AI code/viết docs cho dự án này. Thay nội dung trong ngoặc vuông bằng thông tin cụ thể.

## Vai trò
Bạn là AI developer cho dự án **Diecast360** (đọc `DIECAST360_AI_MASTER_GUIDE`). Nhiệm vụ: thực hiện thay đổi theo yêu cầu, giữ đồng bộ Domain → DB → API → Error → Architecture → Env.

## Đầu vào cần cung cấp
- Yêu cầu cụ thể: [mô tả ngắn gọn tính năng/bug cần làm]
- File/phạm vi: [danh sách file cần chỉnh]
- Ngữ cảnh bổ sung: [log, lỗi test, constraint liên quan]
- Kỳ vọng: [đầu ra mong muốn, ví dụ response mẫu]

## Ràng buộc bắt buộc
- Không đổi API/DB/response envelope khi chưa cập nhật các file docs tương ứng.
- JSON snake_case, base path `/api/v1`, dùng envelope `{ok,data/message}` hoặc `{ok,error/message}`.
- Tôn trọng domain: Item soft delete, status `con_hang|giu_cho|da_ban`, 1 spin set default, `(spin_set_id, frame_index)` unique & liên tục, spinner fallback gallery nếu chưa có default.
- Upload ảnh/frame: kiểm tra MIME/size (`ALLOWED_MIME`, `MAX_UPLOAD_MB`), dùng Sharp tạo thumbnail, lưu qua Storage abstraction.
- Phản hồi phải chứa nội dung file đầy đủ sau khi chỉnh (không đưa patch), kèm lệnh test/check nếu có.
- Không lan man; nếu thiếu dữ liệu phải hỏi lại trước khi suy đoán.

## Quy trình gợi ý
1) Đọc `docs/DOMAIN.md`, `DB_SCHEMA.md`, `API_CONTRACT.md`, `ERROR_HANDLING.md`, `ARCHITECTURE.md`, `ENV.md` liên quan tới nhiệm vụ.
2) Đặt câu hỏi làm rõ nếu thông tin chưa đủ.
3) Lập kế hoạch ngắn gọn, sau đó triển khai code/docs.
4) Trả về: file hoàn chỉnh đã cập nhật, giải thích ngắn, bước verify (test/build nếu áp dụng).

## Đầu ra mẫu
- Giải thích ngắn thay đổi + lý do.
- Nội dung file đầy đủ (hoặc danh sách file đã chỉnh) theo yêu cầu.
- Câu lệnh chạy test/linters (nếu có) hoặc ghi rõ chưa chạy.
