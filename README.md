# AI Ready Project

## 1. Purpose
Dự án được thiết kế để phát triển phần mềm với sự hỗ trợ của AI (Cursor, Copilot, ChatGPT) theo hướng:
- Code nhanh
- Ít lỗi
- Dễ bảo trì
- Kiểm soát được chất lượng

AI chỉ hỗ trợ viết code, không tự quyết định kiến trúc hay nghiệp vụ.

---

## 2. Tech Stack
Điền cụ thể để AI không phải đoán:
- Backend: (ví dụ Node.js + Express + TypeScript)
- Frontend: (ví dụ React + Vite)
- Database: (ví dụ PostgreSQL)
- Auth: (ví dụ JWT, OAuth2)
- Cache: (ví dụ Redis)
- Message Queue (nếu có):
- CI/CD: (ví dụ GitHub Actions)

---

## 3. Architecture Overview
Mô hình phân lớp:

Controller → Service → Domain → Repository → Infrastructure

Nguyên tắc:
- Controller mỏng
- Business logic nằm ở Service/Domain
- Repository chỉ xử lý dữ liệu
- Không bypass layer

---

## 4. Development Rules
- Tuân thủ tài liệu trong thư mục `/docs`
- AI phải tuân theo `docs/AI_RULES.md`
- Mỗi thay đổi phải nhỏ, có kiểm soát
- Không commit code chưa review
- Nếu thiếu thông tin, AI phải hỏi lại, không được giả định

---

## 5. Run Local (example)
```bash
# backend
npm install
npm run dev
```

## 6. Project Structure (tóm tắt)
- `/docs`: yêu cầu, kiến trúc, luật cho AI, env
- `/src`: mã nguồn chính (theo layers Controller → Service → Domain → Repository → Infrastructure)
- `/tests`: kiểm thử (bổ sung theo nghiệp vụ thực tế)

## 7. Cách yêu cầu AI làm việc
- Luôn chỉ rõ file cần sửa và scope thay đổi
- Nhắc lại ràng buộc nghiệp vụ/ngữ cảnh liên quan (API, domain, error code)
- Đưa expected output (response, log, error) nếu có
- Yêu cầu kiểm tra/test cụ thể sau khi chỉnh sửa
