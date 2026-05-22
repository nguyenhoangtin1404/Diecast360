---
title: Test Plan - Diecast360
version: 1.0.0
created: 2026-05-22
author: QA Lead - Group 6
status: Draft
---

# Test Plan — Diecast360

## Mục lục

1. [Mục tiêu kiểm thử](#1-mục-tiêu-kiểm-thử)
2. [Phạm vi kiểm thử](#2-phạm-vi-kiểm-thử)
3. [Các loại kiểm thử](#3-các-loại-kiểm-thử)
4. [Môi trường kiểm thử](#4-môi-trường-kiểm-thử)
5. [Chiến lược dữ liệu kiểm thử](#5-chiến-lược-dữ-liệu-kiểm-thử)
6. [Tiêu chí vào/ra](#6-tiêu-chí-vàora)
7. [Lịch kiểm thử](#7-lịch-kiểm-thử)
8. [Phân công trách nhiệm](#8-phân-công-trách-nhiệm)
9. [Ưu tiên kiểm thử theo rủi ro](#9-ưu-tiên-kiểm-thử-theo-rủi-ro)
10. [Công cụ kiểm thử](#10-công-cụ-kiểm-thử)
11. [Quy trình quản lý lỗi](#11-quy-trình-quản-lý-lỗi)
12. [Metrics và tiêu chí chất lượng](#12-metrics-và-tiêu-chí-chất-lượng)

---

## 1. Mục tiêu kiểm thử

### 1.1 Mục tiêu chính

- Xác minh tất cả các tính năng nghiệp vụ hoạt động đúng theo tài liệu yêu cầu và `docs/DOMAIN.md`
- Đảm bảo tính toàn vẹn dữ liệu đa tenant: mỗi shop chỉ thấy dữ liệu của mình
- Kiểm tra các bất biến nghiệp vụ quan trọng:
  - Item `da_ban` luôn có `quantity = 0`
  - Pre-order state machine chỉ cho phép các transition hợp lệ
  - Mọi thay đổi điểm thành viên đều đi qua `MemberPointsLedger`
  - Không thể xóa member có pre-order đang hoạt động
- Xác nhận hệ thống bảo mật: CSRF, auth cookie, RBAC, SQL injection

### 1.2 Mục tiêu phụ

- Đảm bảo hiệu năng tải ảnh và spinner 360° chấp nhận được (< 3s trên staging)
- Xác minh giao diện người dùng đáp ứng trải nghiệm mượt mà trên Chrome/Edge/Firefox
- Xác nhận error envelope `{ok, data/error, message}` nhất quán trên mọi endpoint
- Phát hiện rủi ro hồi quy khi deploy tính năng mới

---

## 2. Phạm vi kiểm thử

### 2.1 Trong phạm vi (In-scope)

| Module | Mức kiểm thử | Ghi chú |
|--------|-------------|---------|
| Authentication (login, logout, refresh, CSRF) | Unit + Integration + E2E | Bao gồm cookie flow và Bearer fallback |
| Item Management (CRUD, status transition, soft delete) | Unit + Integration + E2E | Đặc biệt chú ý bất biến `da_ban` |
| Image Upload & Gallery | Integration + E2E | Validate type, size, display_order |
| Spinner 360° (SpinSet, frames) | Integration + E2E | Frame index continuity, UNIQUE constraint |
| Public Catalog (browse, filter, search) | Integration + E2E | Multi-tenant isolation, inactive shop |
| Pre-Orders (full lifecycle) | Unit + Integration + E2E | State machine, terminal states |
| Inventory (stock_in/out/adjustment) | Unit + Integration | Ledger integrity |
| Members (CRUD, FK RESTRICT) | Integration + E2E | Points ledger |
| Member Points (earn/redeem/adjust) | Unit + Integration | Chỉ qua ledger |
| AI Draft (upload → analysis → confirm) | Integration + E2E | Happy path + reject flow |
| Facebook Integration | Integration | Save URL, publish via Graph API |
| Multi-tenant isolation | Integration + E2E | Cross-shop data leak prevention |
| Platform Admin (shop CRUD, audit logs) | Integration + E2E | `platform_super` role |
| RBAC (shop_admin, shop_staff, platform_super) | Unit + Integration | Permission boundary tests |
| Security (injection, CSRF, XSS) | Security Testing | Tất cả input surfaces |

### 2.2 Ngoài phạm vi (Out-of-scope)

- Kiểm thử tương thích trình duyệt mobile (iOS Safari, Chrome Android) — Phase sau
- Load testing trên production environment — chỉ staging
- Penetration testing chuyên sâu (ngoài basic security scan)
- Tính năng đa ngôn ngữ (hệ thống chỉ hỗ trợ Tiếng Việt)
- Tích hợp payment gateway (chưa có trong scope hiện tại)
- Kiểm thử database failover / backup recovery

---

## 3. Các loại kiểm thử

### 3.1 Unit Tests — NestJS Services, Guards, Pipes

**Framework:** Jest 29  
**Thư mục:** `backend/src/**/*.spec.ts`  
**Mục tiêu coverage:** ≥ 80% statement coverage trên tất cả services

**Phạm vi:**
- Service logic: `ItemService`, `PreOrderService`, `MemberService`, `InventoryService`, `PointsService`
- Guards: `JwtAuthGuard`, `TenantGuard`, `RolesGuard`, `CsrfGuard`
- Pipes: `ValidationPipe`, `ParseUUIDPipe` với các edge cases
- Utilities: status transition validator, storage path builder

**Conventions:**
```
describe('ItemService', () => {
  describe('create()', () => {
    it('should throw when status=da_ban and quantity > 0')
    it('should scope item to active shop')
  })
})
```

**Mocking strategy:** Mock `PrismaService` với `jest.fn()`, không dùng real DB trong unit tests.

---

### 3.2 Integration Tests — API Endpoints với DB

**Framework:** Jest + Supertest + `@nestjs/testing`  
**Database:** PostgreSQL test instance (Docker), schema tạo lại trước mỗi test suite  
**Thư mục:** `backend/test/integration/**/*.spec.ts`

**Phạm vi:**
- Mỗi controller endpoint: happy path + validation errors + auth errors
- Database constraints: FK RESTRICT, UNIQUE constraints, NOT NULL
- Transaction rollback khi có lỗi giữa chừng
- Multi-tenant isolation: request của shop A không thấy dữ liệu shop B

**Setup mẫu:**
```typescript
beforeAll(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE items CASCADE`;
  await seedTestShop(); // tạo shop A và shop B
});
afterAll(async () => prisma.$disconnect());
```

---

### 3.3 E2E Tests — Playwright

**Framework:** Playwright 1.x  
**Thư mục:** `frontend/e2e/**/*.spec.ts`  
**Hiện trạng:** 53 tests đang chạy  
**Mục tiêu:** 100% coverage cho critical user paths

**Các flow E2E ưu tiên:**

| Flow | Priority | Test file |
|------|----------|-----------|
| Login → Browse → Logout | P1 | `auth.spec.ts` |
| Tạo item + upload ảnh + đặt cover | P1 | `items.spec.ts` |
| Upload spinner 360° + reorder frames | P1 | `spinner.spec.ts` |
| Tạo pre-order → PAID → kiểm tra điểm | P1 | `preorder.spec.ts` |
| Public catalog → xem item detail | P1 | `public.spec.ts` |
| Shop staff thử PATCH item → bị từ chối | P2 | `rbac.spec.ts` |
| AI draft upload → confirm | P2 | `ai-draft.spec.ts` |

**Playwright config:**
```typescript
// playwright.config.ts
export default {
  baseURL: 'http://localhost:5173',
  use: { storageState: 'e2e/.auth/shop_admin.json' },
  testDir: './e2e',
  reporter: [['html'], ['junit', { outputFile: 'e2e-results.xml' }]],
}
```

---

### 3.4 Manual Testing — UI/UX và Edge Cases

**Khi nào:** Sau khi automated tests pass, trước mỗi release  
**Người thực hiện:** QA tester + Product Owner (UAT)

**Checklist manual:**
- [ ] Spinner 360° animation mượt trên Chrome (60fps kiểm bằng DevTools)
- [ ] Drag-and-drop reorder ảnh hoạt động trên Firefox
- [ ] Toast notification hiển thị đúng thời gian (3s) và không bị che khuất
- [ ] Form validation messages hiển thị đúng tiếng Việt
- [ ] Responsive layout trên 1280px, 1440px, 1920px
- [ ] Image lazy loading không bị flash khi scroll
- [ ] AI draft: preview ảnh phân tích hiển thị đúng
- [ ] Facebook publish: share URL mở đúng trang

---

### 3.5 Performance Testing

**Framework:** k6  
**Mục tiêu:** Staging environment với dataset thực tế (1000 items, 500 members)

| Kịch bản | Metric | Ngưỡng chấp nhận |
|----------|--------|-----------------|
| Public catalog browse (50 concurrent users) | p95 response time | < 500ms |
| Image upload (10MB file) | Upload time | < 5s |
| Spinner 24 frames upload | Total time | < 10s |
| Pre-order creation (20 concurrent) | p95 response time | < 300ms |
| AI analysis (upload photo) | Analysis time | < 15s |

**Script k6 mẫu:**
```javascript
// k6/catalog-load.js
import http from 'k6/http';
export let options = { vus: 50, duration: '2m' };
export default function() {
  http.get(`${__ENV.BASE_URL}/api/v1/public/items?shop_id=${__ENV.SHOP_ID}`);
}
```

---

### 3.6 Security Testing

**Phương pháp:** Kết hợp automated scan (OWASP ZAP) và manual pentest cơ bản

| Test | Công cụ | Mô tả |
|------|---------|-------|
| SQL Injection via query params | OWASP ZAP + manual | `?name='; DROP TABLE items;--` |
| XSS in item name/description | Manual + ZAP | `<script>alert(1)</script>` |
| CSRF bypass | Manual | Gọi POST thiếu `X-CSRF-Token` |
| Cross-tenant access | Postman | Shop A token + shop B resource ID |
| Cookie security flags | Browser DevTools | HttpOnly, Secure, SameSite |
| JWT manipulation | jwt.io + Postman | Thay đổi `shop_id` trong payload |
| Rate limiting | k6 rapid fire | 429 sau X requests/phút |
| File upload bypass | Manual | Đổi extension, MIME type |

---

## 4. Môi trường kiểm thử

### 4.1 Local Development

| Component | Version | Cấu hình |
|-----------|---------|---------|
| Node.js | 20.x LTS | `.nvmrc` trong repo |
| PostgreSQL | 16.x | Docker: `docker-compose up db` |
| Backend | NestJS 11 | `pnpm dev` tại `backend/` |
| Frontend | React 19 + Vite 7 | `pnpm dev` tại `frontend/` |
| Storage | Local (`STORAGE_DRIVER=local`) | `UPLOAD_DIR=./uploads` |

**Env file:** `.env.test` với database riêng biệt (`diecast360_test`)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/diecast360_test
STORAGE_DRIVER=local
UPLOAD_DIR=./test-uploads
JWT_SECRET=test-secret-do-not-use-in-prod
```

### 4.2 Staging Environment

| Component | Cấu hình |
|-----------|---------|
| URL | `https://staging.diecast360.vn` |
| Database | PostgreSQL 16 trên Neon / Supabase |
| Storage | Cloudflare R2 (staging bucket) |
| Auth | Cookie domain: `.staging.diecast360.vn` |
| CI/CD | GitHub Actions deploy on merge to `main` |

**Lưu ý staging:**
- Dữ liệu reset mỗi thứ Hai 00:00 ICT từ seed script
- Không dùng dữ liệu thật của khách hàng
- SMTP mock (Mailhog) để không gửi email thật

---

## 5. Chiến lược dữ liệu kiểm thử

### 5.1 Seed Scripts

**Vị trí:** `backend/prisma/seed/`

| Seed file | Dữ liệu tạo ra |
|-----------|---------------|
| `01_platform.ts` | 1 platform_super user |
| `02_shops.ts` | Shop A (active), Shop B (active), Shop C (inactive) |
| `03_users.ts` | shop_admin + shop_staff cho mỗi shop |
| `04_items.ts` | 50 items mỗi shop: mix con_hang/giu_cho/da_ban, có/không có ảnh |
| `05_members.ts` | 20 members mỗi shop, 1 member có active pre-order |
| `06_preorders.ts` | Pre-orders ở mọi trạng thái |
| `07_inventory.ts` | Lịch sử inventory transactions |
| `08_points.ts` | Ledger entries cho members |

**Chạy seed:**
```bash
cd backend && pnpm prisma db seed
```

### 5.2 Test Fixtures (Integration Tests)

```typescript
// test/fixtures/item.fixture.ts
export const validItem = {
  name: 'Hot Wheels Ferrari 599XX',
  brand: 'Hot Wheels',
  scale: '1:64',
  status: 'con_hang',
  quantity: 10,
  price: 85000,
};

export const dabanItem = {
  ...validItem,
  status: 'da_ban',
  quantity: 0, // INVARIANT: luôn 0
};
```

### 5.3 Test Data Cleanup

- **Unit tests:** Không cần cleanup (mock hoàn toàn)
- **Integration tests:** `beforeEach` truncate các bảng liên quan, transaction rollback sau mỗi test
- **E2E tests:** Playwright `beforeAll` chạy API để reset trạng thái; `afterAll` xóa test data qua API
- **Staging:** Cron job reset hàng tuần; manual reset có thể kích hoạt qua GitHub Actions

---

## 6. Tiêu chí vào/ra

### 6.1 Entry Criteria (Bắt đầu kiểm thử)

- [ ] Code đã được review và merge vào branch `staging` hoặc `develop`
- [ ] Build CI/CD thành công, không có compilation error
- [ ] Database migration đã chạy thành công trên môi trường test
- [ ] Seed data đã được nạp
- [ ] Tài liệu yêu cầu (API_CONTRACT.md, DOMAIN.md) đã được cập nhật
- [ ] Unit tests pass 100% (CI green)
- [ ] QA tester đã có tài khoản và quyền truy cập môi trường test

### 6.2 Exit Criteria (Kết thúc kiểm thử / Release)

- [ ] Tất cả test cases P1 (Critical) pass 100%
- [ ] Tất cả test cases P2 (High) pass ≥ 95%
- [ ] Không còn bug Severity Critical hoặc High ở trạng thái Open
- [ ] Code coverage unit tests ≥ 80%
- [ ] E2E Playwright suite pass ≥ 98% (≤ 1 flaky test cho phép)
- [ ] Performance: p95 public catalog < 500ms trên staging
- [ ] Security: không có vulnerability Critical/High từ OWASP ZAP scan
- [ ] UAT sign-off từ Product Owner
- [ ] Tài liệu release notes đã cập nhật

---

## 7. Lịch kiểm thử

### Phase 3 — Tháng 4–5/2026

| Sprint | Tuần | Hoạt động kiểm thử | Deliverable |
|--------|------|---------------------|-------------|
| Sprint 1 | Tuần 1–2 (T4/W1-W2) | Viết unit tests cho core services | Unit test suite v1 |
| Sprint 1 | Tuần 2 | Integration tests: Auth + Items | Test report Sprint 1 |
| Sprint 2 | Tuần 3–4 (T4/W3-W4) | Integration tests: Spinner + Images + Pre-orders | Test report Sprint 2 |
| Sprint 2 | Tuần 4 | E2E Playwright: Auth + Items + Pre-order flows | E2E suite v1 |
| Sprint 3 | Tuần 5–6 (T5/W1-W2) | Integration tests: Members + Points + Inventory | Test report Sprint 3 |
| Sprint 3 | Tuần 6 | Security testing (CSRF, injection, cross-tenant) | Security report |
| Sprint 4 | Tuần 7 (T5/W3) | Performance testing trên staging | Performance report |
| Sprint 4 | Tuần 7–8 | E2E full regression pass | E2E regression report |
| UAT | Tuần 8–9 (T5/W4 – cuối T5) | UAT với stakeholders | UAT sign-off |
| Release | Cuối T5 | Final regression + go/no-go | Release report |

---

## 8. Phân công trách nhiệm

| Vai trò | Tên | Trách nhiệm |
|---------|-----|-------------|
| QA Lead | [Group 6 Lead] | Lập kế hoạch, review test cases, report metrics, triage bug |
| QA Tester 1 | [Member A] | Unit tests backend (services, guards) |
| QA Tester 2 | [Member B] | Integration tests (API + DB) |
| QA Tester 3 | [Member C] | E2E Playwright, manual testing UI |
| QA Tester 4 | [Member D] | Security testing, performance testing |
| Developer | Backend team | Sửa bug, hỗ trợ setup test environment |
| Developer | Frontend team | Sửa bug UI, hỗ trợ Playwright selectors |
| Business Analyst | [BA] | Làm rõ yêu cầu, verify UAT acceptance criteria |
| Product Owner | [PO] | UAT coordination, final sign-off |

### Ma trận RACI

| Hoạt động | QA Lead | QA Tester | Dev | BA | PO |
|-----------|---------|-----------|-----|----|----|
| Viết Test Plan | R/A | C | C | C | I |
| Viết Test Cases | A | R | C | C | I |
| Thực thi Unit/Integration Tests | I | R/A | R | I | I |
| Thực thi E2E Tests | A | R | C | I | I |
| Security Testing | A | R | C | I | I |
| Bug Triage | R/A | C | C | C | I |
| UAT Execution | C | C | I | A | R |
| Release Go/No-Go | C | C | C | C | R/A |

_R=Responsible, A=Accountable, C=Consulted, I=Informed_

---

## 9. Ưu tiên kiểm thử theo rủi ro

### Risk Matrix

| Rủi ro | Xác suất | Tác động | Mức độ | Test ưu tiên |
|--------|----------|----------|--------|-------------|
| Cross-tenant data leak | Thấp | Rất cao | **CRITICAL** | P1 — test đầu tiên |
| Pre-order state machine sai | Trung bình | Cao | **HIGH** | P1 |
| `da_ban` quantity invariant vi phạm | Trung bình | Cao | **HIGH** | P1 |
| CSRF bypass | Thấp | Cao | **HIGH** | P1 |
| Member points sai do bypass ledger | Trung bình | Cao | **HIGH** | P1 |
| Spinner frame_index conflict | Cao | Trung bình | **MEDIUM** | P2 |
| Image cover reassignment sai | Trung bình | Trung bình | **MEDIUM** | P2 |
| AI draft reject flow | Thấp | Trung bình | **MEDIUM** | P2 |
| Performance catalog chậm | Thấp | Thấp | **LOW** | P3 |
| Facebook publish lỗi | Thấp | Thấp | **LOW** | P3 |

### Ưu tiên module

```
[P1 - Critical Path]
  Auth → Multi-tenant isolation → Pre-order lifecycle → Points ledger

[P2 - Core Business]
  Item management → Image/Spinner → Members → Inventory

[P3 - Extended Features]
  AI Draft → Facebook Integration → Platform Admin → Performance
```

---

## 10. Công cụ kiểm thử

| Công cụ | Phiên bản | Mục đích |
|---------|-----------|---------|
| **Jest** | 29.x | Unit tests + Integration tests (backend) |
| **Playwright** | 1.44.x | E2E browser automation |
| **Supertest** | 7.x | HTTP assertions trong integration tests |
| **Postman / curl** | - | Thủ công test API, bug reproduction |
| **k6** | 0.50.x | Load testing và performance |
| **OWASP ZAP** | 2.14.x | Automated security scan |
| **Docker Compose** | 2.x | Spin up test PostgreSQL |
| **GitHub Actions** | - | CI/CD: chạy tests tự động trên PR |
| **Allure Report** | 2.x | Test report visualization |
| **Mailhog** | Latest | Mock SMTP server cho staging |

### GitHub Actions CI Pipeline

```yaml
# .github/workflows/test.yml (tóm tắt)
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - run: cd backend && pnpm test --coverage

  integration-tests:
    services:
      postgres:
        image: postgres:16
    steps:
      - run: cd backend && pnpm test:integration

  e2e-tests:
    steps:
      - run: pnpm build
      - run: pnpm playwright test
      - uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 11. Quy trình quản lý lỗi

### 11.1 Vòng đời Bug

```
[Phát hiện] → OPEN
     ↓
[Dev nhận] → IN PROGRESS
     ↓
[Fix xong] → IN REVIEW (QA verify)
     ↓
[QA pass] → FIXED → VERIFIED → CLOSED
     ↓
[QA fail] → REOPENED → IN PROGRESS (lặp lại)
```

### 11.2 Severity Levels

| Severity | Định nghĩa | Ví dụ Diecast360 | SLA fix |
|----------|-----------|-----------------|---------|
| **Critical** | Hệ thống không dùng được, security breach, data loss | Cross-tenant data leak; da_ban cho quantity > 0 | 4 giờ |
| **High** | Tính năng core bị hỏng, không có workaround | Pre-order không chuyển trạng thái; điểm không ghi ledger | 1 ngày |
| **Medium** | Tính năng bị hỏng nhưng có workaround | Spinner reorder lệch index; cover ảnh không reassign đúng | 3 ngày |
| **Low** | UI/UX nhỏ, cosmetic, typo | Toast hiển thị sai màu; label tiếng Việt chưa chuẩn | Sprint sau |

### 11.3 Bug Triage Meeting

- **Tần suất:** Mỗi thứ Ba và thứ Năm, 09:30–10:00 ICT
- **Thành phần:** QA Lead + 1 dev backend + 1 dev frontend + BA
- **Output:** Bug được assign, severity confirmed, sprint backlog cập nhật

### 11.4 Bug Tracking Tool

- **Tool:** GitHub Issues với labels: `bug`, `severity:critical`, `severity:high`, `severity:medium`, `severity:low`, `status:open`, `status:in-progress`, `status:verified`
- **Template:** Xem file `33_bug_report_template.md`

---

## 12. Metrics và tiêu chí chất lượng

### 12.1 Coverage Targets

| Loại | Metric | Target |
|------|--------|--------|
| Unit Tests | Statement coverage | ≥ 80% |
| Unit Tests | Branch coverage | ≥ 70% |
| Integration Tests | API endpoint coverage | 100% của routes trong API_CONTRACT.md |
| E2E Tests | Critical user path coverage | 100% |
| E2E Tests | Overall pass rate | ≥ 98% |

### 12.2 Quality Gates (CI/CD)

- PR không được merge nếu unit tests fail
- PR không được merge nếu coverage giảm xuống dưới threshold
- Deployment lên staging bị block nếu E2E suite fail > 2%
- Release lên production bị block nếu có bug Severity Critical/High mở

### 12.3 Reporting Cadence

| Report | Tần suất | Người nhận |
|--------|----------|------------|
| Daily test run summary | Mỗi ngày (tự động từ CI) | Dev team |
| Weekly test progress report | Mỗi thứ Sáu | Team lead, PO |
| Sprint test summary | Cuối mỗi sprint | Toàn team |
| Release readiness report | Trước mỗi release | PO, Stakeholders |

### 12.4 KPI theo dõi

- **Test Execution Rate:** số test case thực thi / tổng số test case kế hoạch
- **Defect Detection Rate:** bug phát hiện bởi QA / tổng bug (chỉ số hiệu quả QA)
- **Defect Leakage Rate:** bug phát hiện sau release / tổng bug (mục tiêu < 5%)
- **Mean Time to Detect (MTTD):** thời gian trung bình phát hiện bug từ lúc code merge
- **Mean Time to Resolve (MTTR):** thời gian trung bình từ lúc báo cáo đến lúc verified

---

_Tài liệu này được duy trì bởi QA Lead và cập nhật theo từng sprint. Mọi thay đổi cần thông báo cho toàn team._
