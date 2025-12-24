# AI RULES – MUST FOLLOW

## 1. General
- AI không được tự quyết kiến trúc
- AI chỉ code theo chỉ định
- Không giả định nghiệp vụ nếu chưa có mô tả

---

## 2. Coding Rules
- Không viết business logic trong Controller
- Service không truy cập DB trực tiếp, phải qua Repository
- Một function chỉ làm một việc
- Function ≤ 50 dòng
- Class ≤ 300 dòng

---

## 3. Error Handling
- Không throw error chung chung
- Mỗi lỗi phải có error code rõ ràng
- Không log thông tin nhạy cảm

---

## 4. Forbidden
- Không hardcode config
- Không dùng biến global
- Không dùng `any` (TS) / dynamic kiểu mơ hồ
- Không copy code từ bên ngoài nếu chưa kiểm soát

---

## 5. Mandatory
- Validate input
- Handle null/empty
- Viết code dễ test
