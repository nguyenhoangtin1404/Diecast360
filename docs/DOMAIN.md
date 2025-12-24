# Domain Knowledge

## User
- Email là duy nhất
- Không cho phép xoá cứng nếu đã phát sinh dữ liệu
- Trạng thái: ACTIVE | INACTIVE | LOCKED

## Role
- Một User có thể có nhiều Role
- Role quyết định quyền, không quyết định nghiệp vụ

## Order (ví dụ)
- Chỉ được CANCEL khi status = PENDING
- Không cho sửa giá sau khi CONFIRMED

---

## Domain Principles
- Domain rule không phụ thuộc framework
- Domain không biết DB, HTTP, JSON
