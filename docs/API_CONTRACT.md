# API Contract

## Create User
POST /api/users

### Request
```json
{
  "email": "string",
  "password": "string",
  "fullName": "string"
}
```

### Response – 201
```json
{
  "id": "uuid",
  "email": "string",
  "fullName": "string"
}
```

### Headers / Auth
- Content-Type: application/json
- Auth: (ghi rõ nếu cần, ví dụ Bearer token). Nếu không cần auth cho endpoint này, ghi rõ.

### Validation
- `email`: định dạng email, bắt buộc, duy nhất
- `password`: bắt buộc, quy tắc độ mạnh (ghi rõ nếu có)
- `fullName`: bắt buộc, không rỗng

### Errors
- 400: VALIDATION_ERROR (vi phạm rule trên)
- 409: EMAIL_EXISTS (email đã tồn tại)

> Khi thêm endpoint khác, mô tả đầy đủ: method, path, request/response JSON, validation, auth, danh sách error code cụ thể.
