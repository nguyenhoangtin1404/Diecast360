# Error Handling – Diecast360

## Envelope
- Success: `{ "ok": true, "data": {}, "message": "" }`.
- Error: `{ "ok": false, "error": { "code": "ERROR_CODE", "details": [] }, "message": "" }`.
- `details` dùng cho list lỗi validation hoặc field cụ thể.

## Error codes & HTTP mapping
| Code | HTTP | Ý nghĩa / Ngữ cảnh |
| --- | --- | --- |
| AUTH_INVALID_CREDENTIALS | 401 | Sai email/password khi login. |
| AUTH_TOKEN_EXPIRED | 401 | Access/refresh token hết hạn. |
| AUTH_FORBIDDEN | 403 | Token bị revoke hoặc user bị khóa. |
| VALIDATION_ERROR | 422 | Input sai định dạng/thiếu field. `details` chứa danh sách field lỗi. |
| NOT_FOUND | 404 | Không tìm thấy resource (item/image/spin_set/frame/user). |
| PUBLIC_SHOP_REQUIRED | 422 | Production public catalog/detail/contact thiếu shop scope (`shop_id` hoặc JWT active shop). |
| UPLOAD_INVALID_TYPE | 400 | MIME type không nằm trong `ALLOWED_MIME`. |
| UPLOAD_TOO_LARGE | 413 | File vượt `MAX_UPLOAD_MB`. |
| SPIN_FRAME_INDEX_CONFLICT | 409 | `frame_index` trùng hoặc bỏ số (vi phạm unique và tính liên tục). |
| DRAFT_IMAGE_PROCESSING_FAILED | 500 | Xử lý ảnh AI draft lỗi. |
| IMAGE_WATERMARK_FAILED | 422 | Watermark/branding image không xử lý được. |
| ITEM_STATUS_TRANSITION_INVALID | 422 | Transition trạng thái item/pre-order không hợp lệ theo rule service. |
| ITEM_CATEGORY_INVALID | 422 | Category/brand scope không hợp lệ cho item/tenant. |
| RATE_LIMIT_EXCEEDED | 429 | Vượt rate limit global hoặc endpoint throttle. |
| INTERNAL_SERVER_ERROR | 500 | Lỗi ngoài dự kiến, không lộ stacktrace ra client. |
| FACEBOOK_AUTH_ERROR | 401 | Facebook Access Token không hợp lệ hoặc đã hết hạn. |
| FACEBOOK_PERMISSION_ERROR | 403 | Token không có quyền publish lên Facebook Page. |
| FACEBOOK_PUBLISH_ERROR | 502 | Facebook Graph API trả về lỗi không xác định. |

## Nguyên tắc xử lý lỗi
- Luôn trả code chuẩn + message ngắn gọn, không lộ thông tin nhạy cảm.
- Log đầy đủ ở server (stacktrace, request id) nhưng không trả về client.
- Với upload, dừng xử lý ngay khi vi phạm rule (size/type) và không lưu file dang dở.
- Với spinner reorder, nếu input thiếu frame hoặc lặp frame thì trả `VALIDATION_ERROR` kèm chi tiết.
- Các route public vẫn dùng cùng envelope để client xử lý thống nhất.
