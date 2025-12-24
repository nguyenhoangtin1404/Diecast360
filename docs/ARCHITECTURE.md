# Architecture Design

## 1. Layers

### Controller
- Nhận request
- Validate input cơ bản
- Gọi Service
- Map response

### Service
- Xử lý nghiệp vụ
- Điều phối flow
- Quản lý transaction

### Domain
- Rule nghiệp vụ cốt lõi
- Entity, Value Object

### Repository
- CRUD
- Query database
- Không chứa logic nghiệp vụ

---

## 2. Data Flow
Client  
→ Controller  
→ Service  
→ Repository  
→ Database  

---

## 3. Transaction Strategy
- Transaction mở ở Service layer
- Mỗi request = 1 transaction
- Không nested transaction trừ khi đặc biệt

---

## 4. Security Boundary
- Auth middleware trước Controller
- Service không tin input từ Controller
