---
title: Test Cases - Diecast360
version: 1.0.0
created: 2026-05-22
author: QA Lead - Group 6
status: Draft
---

# Test Cases — Diecast360

## Quy ước

| Trường | Giá trị hợp lệ |
|--------|---------------|
| Priority | P1 (Critical), P2 (High), P3 (Medium), P4 (Low) |
| Status | Not Run / Pass / Fail / Blocked / Skip |
| Category | AUTH / ITEM / IMG / SPIN / PUB / PRE / INV / MEM / AI / FB / SEC / RBAC |

---

## TC-AUTH — Authentication

### TC-AUTH-001
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-AUTH-001 |
| **Category** | AUTH |
| **Title** | Login với email/password hợp lệ |
| **Priority** | P1 |
| **Preconditions** | Tồn tại user có email `admin@shopA.vn`, password `Test@1234`, role `shop_admin` |
| **Steps** | 1. POST `/api/v1/auth/login` với `{"email":"admin@shopA.vn","password":"Test@1234"}` |
| **Expected Result** | HTTP 200; body `{ok:true, data:{user:{...}}, message:"Đăng nhập thành công"}`; Set-Cookie header chứa `access_token` (HttpOnly, Secure, SameSite=Strict); Set-Cookie chứa `csrf_token` (Secure, không HttpOnly để JS đọc được) |
| **Actual Result** | |
| **Status** | Not Run |

### TC-AUTH-002
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-AUTH-002 |
| **Category** | AUTH |
| **Title** | Login với password sai |
| **Priority** | P1 |
| **Preconditions** | User `admin@shopA.vn` tồn tại |
| **Steps** | 1. POST `/api/v1/auth/login` với password `WrongPassword` |
| **Expected Result** | HTTP 401; body `{ok:false, error:{code:"AUTH_INVALID_CREDENTIALS"}, message:"..."}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-AUTH-003
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-AUTH-003 |
| **Category** | AUTH |
| **Title** | Login với email không tồn tại |
| **Priority** | P1 |
| **Preconditions** | Email `notexist@shopA.vn` không tồn tại trong DB |
| **Steps** | 1. POST `/api/v1/auth/login` với `{"email":"notexist@shopA.vn","password":"Test@1234"}` |
| **Expected Result** | HTTP 401; `{ok:false, error:{code:"AUTH_INVALID_CREDENTIALS"}}` — không tiết lộ email có tồn tại hay không |
| **Actual Result** | |
| **Status** | Not Run |

### TC-AUTH-004
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-AUTH-004 |
| **Category** | AUTH |
| **Title** | Gọi protected route không có cookie |
| **Priority** | P1 |
| **Preconditions** | Không có cookie nào |
| **Steps** | 1. GET `/api/v1/items` (không gửi cookie) |
| **Expected Result** | HTTP 401; `{ok:false, error:{code:"AUTH_UNAUTHENTICATED"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-AUTH-005
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-AUTH-005 |
| **Category** | AUTH |
| **Title** | Gọi mutating route thiếu X-CSRF-Token |
| **Priority** | P1 |
| **Preconditions** | Đã login, có cookie hợp lệ |
| **Steps** | 1. POST `/api/v1/items` với body hợp lệ nhưng **không** gửi header `X-CSRF-Token` |
| **Expected Result** | HTTP 403; `{ok:false, error:{code:"CSRF_TOKEN_MISSING"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-AUTH-006
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-AUTH-006 |
| **Category** | AUTH |
| **Title** | Refresh token trả về access_token mới |
| **Priority** | P1 |
| **Preconditions** | Đã login, cookie `refresh_token` hợp lệ |
| **Steps** | 1. POST `/api/v1/auth/refresh` với cookie `refresh_token` |
| **Expected Result** | HTTP 200; Set-Cookie cập nhật `access_token` mới; `refresh_token` vẫn còn hiệu lực |
| **Actual Result** | |
| **Status** | Not Run |

### TC-AUTH-007
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-AUTH-007 |
| **Category** | AUTH |
| **Title** | Refresh với revoked refresh token bị từ chối |
| **Priority** | P1 |
| **Preconditions** | User đã logout (refresh token bị revoke trong DB) |
| **Steps** | 1. POST `/api/v1/auth/refresh` với refresh_token đã bị revoke |
| **Expected Result** | HTTP 403; `{ok:false, error:{code:"AUTH_TOKEN_REVOKED"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-AUTH-008
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-AUTH-008 |
| **Category** | AUTH |
| **Title** | Logout xóa cookies và revoke token |
| **Priority** | P1 |
| **Preconditions** | Đã login |
| **Steps** | 1. POST `/api/v1/auth/logout` với cookie hợp lệ và CSRF token; 2. Dùng refresh_token cũ để gọi POST `/api/v1/auth/refresh` |
| **Expected Result** | Bước 1: HTTP 200; Set-Cookie xóa `access_token` và `refresh_token` (Max-Age=0); Bước 2: HTTP 403 |
| **Actual Result** | |
| **Status** | Not Run |

### TC-AUTH-009
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-AUTH-009 |
| **Category** | AUTH |
| **Title** | Switch shop cập nhật active_shop_id |
| **Priority** | P2 |
| **Preconditions** | User thuộc 2 shop (shopA, shopB), đang active shopA |
| **Steps** | 1. POST `/api/v1/auth/switch-shop` với `{shop_id: "<shopB_uuid>"}` và CSRF token |
| **Expected Result** | HTTP 200; access_token mới trong cookie có `active_shop_id = shopB_uuid`; gọi GET `/api/v1/items` chỉ trả items của shopB |
| **Actual Result** | |
| **Status** | Not Run |

### TC-AUTH-010
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-AUTH-010 |
| **Category** | AUTH |
| **Title** | shop_staff không được gọi POST item (mutating op) |
| **Priority** | P1 |
| **Preconditions** | Login với role `shop_staff` |
| **Steps** | 1. POST `/api/v1/items` với body hợp lệ và CSRF token |
| **Expected Result** | HTTP 403; `{ok:false, error:{code:"AUTH_FORBIDDEN"}}` |
| **Actual Result** | |
| **Status** | Not Run |

---

## TC-ITEM — Item Management

### TC-ITEM-001
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-001 |
| **Category** | ITEM |
| **Title** | Tạo item mới với dữ liệu hợp lệ |
| **Priority** | P1 |
| **Preconditions** | Login với `shop_admin`; có CSRF token |
| **Steps** | 1. POST `/api/v1/items` với `{name:"Hot Wheels Ferrari", status:"con_hang", quantity:5, price:85000, brand:"Hot Wheels", scale:"1:64"}` |
| **Expected Result** | HTTP 201; `{ok:true, data:{id:"<uuid>", shop_id:"<active_shop>", status:"con_hang", quantity:5, ...}}`; item được scope đúng `active_shop_id` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-002
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-002 |
| **Category** | ITEM |
| **Title** | Tạo item da_ban phải có quantity = 0 |
| **Priority** | P1 |
| **Preconditions** | Login với `shop_admin` |
| **Steps** | 1. POST `/api/v1/items` với `{name:"Old Car", status:"da_ban", quantity:5, price:50000}` |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"ITEM_DABAN_QUANTITY_INVALID"}, message:"Item da_ban phải có quantity = 0"}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-003
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-003 |
| **Category** | ITEM |
| **Title** | Tạo item da_ban với quantity = 0 thành công |
| **Priority** | P1 |
| **Preconditions** | Login với `shop_admin` |
| **Steps** | 1. POST `/api/v1/items` với `{name:"Old Car", status:"da_ban", quantity:0, price:50000}` |
| **Expected Result** | HTTP 201; item tạo thành công với `status:"da_ban"`, `quantity:0` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-004
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-004 |
| **Category** | ITEM |
| **Title** | PATCH item: cập nhật name và price |
| **Priority** | P2 |
| **Preconditions** | Item tồn tại trong active shop |
| **Steps** | 1. PATCH `/api/v1/items/:id` với `{name:"New Name", price:90000}` và CSRF token |
| **Expected Result** | HTTP 200; item trả về có name và price mới; các field khác không thay đổi |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-005
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-005 |
| **Category** | ITEM |
| **Title** | PATCH item da_ban không cho set quantity > 0 |
| **Priority** | P1 |
| **Preconditions** | Item có `status:"da_ban"` |
| **Steps** | 1. PATCH `/api/v1/items/:id` với `{quantity:5}` |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"ITEM_DABAN_QUANTITY_INVALID"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-006
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-006 |
| **Category** | ITEM |
| **Title** | Chuyển status từ con_hang → giu_cho |
| **Priority** | P2 |
| **Preconditions** | Item có `status:"con_hang"`, `quantity:5` |
| **Steps** | 1. PATCH `/api/v1/items/:id` với `{status:"giu_cho"}` |
| **Expected Result** | HTTP 200; item `status:"giu_cho"`; quantity không thay đổi |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-007
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-007 |
| **Category** | ITEM |
| **Title** | Chuyển status sang da_ban phải reset quantity về 0 |
| **Priority** | P1 |
| **Preconditions** | Item có `status:"con_hang"`, `quantity:5` |
| **Steps** | 1. PATCH `/api/v1/items/:id` với `{status:"da_ban"}` |
| **Expected Result** | HTTP 200; item `status:"da_ban"`, `quantity:0` — service tự động set quantity về 0 |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-008
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-008 |
| **Category** | ITEM |
| **Title** | Soft delete item |
| **Priority** | P2 |
| **Preconditions** | Item tồn tại |
| **Steps** | 1. DELETE `/api/v1/items/:id` với CSRF token; 2. GET `/api/v1/items/:id` |
| **Expected Result** | Bước 1: HTTP 200; Bước 2: HTTP 404 — item không xuất hiện trong danh sách nhưng vẫn tồn tại trong DB với `deleted_at` không null |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-009
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-009 |
| **Category** | ITEM |
| **Title** | Toggle is_public bật/tắt |
| **Priority** | P2 |
| **Preconditions** | Item có `is_public:false` |
| **Steps** | 1. PATCH `/api/v1/items/:id` với `{is_public:true}`; 2. GET public catalog và kiểm tra item xuất hiện |
| **Expected Result** | Sau bước 1: item `is_public:true`; Sau bước 2: item xuất hiện trong public catalog |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-010
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-010 |
| **Category** | ITEM |
| **Title** | Tìm kiếm item theo tên (substring match) |
| **Priority** | P2 |
| **Preconditions** | Tồn tại items: "Hot Wheels Ferrari", "Matchbox Ferrari", "Honda Civic" |
| **Steps** | 1. GET `/api/v1/items?search=Ferrari` |
| **Expected Result** | Trả 2 items chứa "Ferrari"; không trả "Honda Civic" |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-011
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-011 |
| **Category** | ITEM |
| **Title** | Lọc item theo status |
| **Priority** | P3 |
| **Preconditions** | Tồn tại items với các status khác nhau |
| **Steps** | 1. GET `/api/v1/items?status=da_ban` |
| **Expected Result** | Chỉ trả items có `status:"da_ban"` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-012
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-012 |
| **Category** | ITEM |
| **Title** | GET item của shop khác → 404 |
| **Priority** | P1 |
| **Preconditions** | Login với shopA; item_id thuộc shopB |
| **Steps** | 1. GET `/api/v1/items/:shopB_item_id` |
| **Expected Result** | HTTP 404; không tiết lộ item thuộc shop khác |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-013
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-013 |
| **Category** | ITEM |
| **Title** | Tạo item thiếu trường bắt buộc `name` |
| **Priority** | P2 |
| **Preconditions** | Login với `shop_admin` |
| **Steps** | 1. POST `/api/v1/items` với body thiếu `name` |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"VALIDATION_ERROR", details:[{field:"name", message:"name is required"}]}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-014
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-014 |
| **Category** | ITEM |
| **Title** | Pagination items |
| **Priority** | P3 |
| **Preconditions** | Tồn tại ≥ 25 items trong shop |
| **Steps** | 1. GET `/api/v1/items?page=1&limit=10`; 2. GET `/api/v1/items?page=2&limit=10` |
| **Expected Result** | Mỗi page trả 10 items; page 2 trả items khác page 1; response có `{total, page, limit}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-015
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-015 |
| **Category** | ITEM |
| **Title** | GET item không tồn tại → 404 |
| **Priority** | P2 |
| **Preconditions** | UUID ngẫu nhiên không có trong DB |
| **Steps** | 1. GET `/api/v1/items/00000000-0000-0000-0000-000000000000` |
| **Expected Result** | HTTP 404; `{ok:false, error:{code:"ITEM_NOT_FOUND"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-016
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-016 |
| **Category** | ITEM |
| **Title** | List items chỉ trả items của active shop |
| **Priority** | P1 |
| **Preconditions** | ShopA có 5 items, ShopB có 3 items; đang login với shopA |
| **Steps** | 1. GET `/api/v1/items` |
| **Expected Result** | Trả đúng 5 items, tất cả có `shop_id = shopA_id`; không có item của shopB |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-017
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-017 |
| **Category** | ITEM |
| **Title** | Sắp xếp items theo created_at giảm dần |
| **Priority** | P3 |
| **Preconditions** | Có nhiều items |
| **Steps** | 1. GET `/api/v1/items?sort=created_at&order=desc` |
| **Expected Result** | Items trả về theo thứ tự tạo mới nhất trước |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-018
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-018 |
| **Category** | ITEM |
| **Title** | Lọc theo brand |
| **Priority** | P3 |
| **Preconditions** | Có items thuộc brand "Hot Wheels" và "Matchbox" |
| **Steps** | 1. GET `/api/v1/items?brand=Hot+Wheels` |
| **Expected Result** | Chỉ trả items có brand "Hot Wheels" |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-019
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-019 |
| **Category** | ITEM |
| **Title** | price phải là số nguyên dương (VND) |
| **Priority** | P2 |
| **Preconditions** | Login với `shop_admin` |
| **Steps** | 1. POST `/api/v1/items` với `{price: -1000}` |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"VALIDATION_ERROR", details:[{field:"price", ...}]}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-ITEM-020
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-ITEM-020 |
| **Category** | ITEM |
| **Title** | Xóa item đã bị soft-delete không hiển thị trong public catalog |
| **Priority** | P2 |
| **Preconditions** | Item `is_public:true`; sau đó soft delete |
| **Steps** | 1. DELETE `/api/v1/items/:id`; 2. GET `/api/v1/public/items/:id` |
| **Expected Result** | Bước 2: HTTP 404 |
| **Actual Result** | |
| **Status** | Not Run |

---

## TC-IMG — Image Management

### TC-IMG-001
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-001 |
| **Category** | IMG |
| **Title** | Upload ảnh hợp lệ (JPEG, < 10MB) |
| **Priority** | P1 |
| **Preconditions** | Item tồn tại; login `shop_admin` |
| **Steps** | 1. POST `/api/v1/items/:id/images` với `multipart/form-data`, field `file`, file JPEG 2MB |
| **Expected Result** | HTTP 201; `{ok:true, data:{id, url, display_order:0 (nếu ảnh đầu tiên), is_cover:true (auto set nếu đầu tiên)}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-002
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-002 |
| **Category** | IMG |
| **Title** | Upload ảnh sai loại (PDF) |
| **Priority** | P2 |
| **Preconditions** | Item tồn tại |
| **Steps** | 1. POST `/api/v1/items/:id/images` với file PDF |
| **Expected Result** | HTTP 400; `{ok:false, error:{code:"UPLOAD_INVALID_TYPE"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-003
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-003 |
| **Category** | IMG |
| **Title** | Upload ảnh quá lớn (> 10MB) |
| **Priority** | P2 |
| **Preconditions** | Item tồn tại |
| **Steps** | 1. POST `/api/v1/items/:id/images` với file JPEG 15MB |
| **Expected Result** | HTTP 413; `{ok:false, error:{code:"UPLOAD_TOO_LARGE"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-004
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-004 |
| **Category** | IMG |
| **Title** | Set ảnh làm cover |
| **Priority** | P1 |
| **Preconditions** | Item có 3 ảnh; ảnh đầu là cover |
| **Steps** | 1. PATCH `/api/v1/items/:item_id/images/:img_id` với `{is_cover:true}` |
| **Expected Result** | HTTP 200; ảnh `img_id` có `is_cover:true`; ảnh cũ là cover được set `is_cover:false` tự động |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-005
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-005 |
| **Category** | IMG |
| **Title** | Reorder ảnh (cập nhật display_order) |
| **Priority** | P2 |
| **Preconditions** | Item có ảnh A (order 0), B (order 1), C (order 2) |
| **Steps** | 1. PATCH `/api/v1/items/:id/images/reorder` với `{orders:[{id:"C", order:0}, {id:"A", order:1}, {id:"B", order:2}]}` |
| **Expected Result** | HTTP 200; GET images trả về thứ tự C, A, B theo display_order |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-006
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-006 |
| **Category** | IMG |
| **Title** | Xóa ảnh cover → ảnh kế tiếp trở thành cover |
| **Priority** | P1 |
| **Preconditions** | Item có ảnh A (cover, order 0), B (order 1), C (order 2) |
| **Steps** | 1. DELETE `/api/v1/items/:item_id/images/:imgA_id` |
| **Expected Result** | HTTP 200; ảnh A bị xóa; ảnh B (display_order nhỏ nhất tiếp theo) tự động được set `is_cover:true` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-007
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-007 |
| **Category** | IMG |
| **Title** | Xóa ảnh không phải cover → cover không thay đổi |
| **Priority** | P2 |
| **Preconditions** | Item có ảnh A (cover), B (not cover) |
| **Steps** | 1. DELETE `/api/v1/items/:item_id/images/:imgB_id` |
| **Expected Result** | HTTP 200; ảnh A vẫn là cover |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-008
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-008 |
| **Category** | IMG |
| **Title** | Xóa ảnh duy nhất → item không còn cover |
| **Priority** | P2 |
| **Preconditions** | Item chỉ có 1 ảnh (là cover) |
| **Steps** | 1. DELETE `/api/v1/items/:item_id/images/:imgA_id` |
| **Expected Result** | HTTP 200; GET item không có cover ảnh |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-009
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-009 |
| **Category** | IMG |
| **Title** | Upload PNG hợp lệ |
| **Priority** | P3 |
| **Preconditions** | Item tồn tại |
| **Steps** | 1. POST upload với file PNG 5MB |
| **Expected Result** | HTTP 201; upload thành công |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-010
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-010 |
| **Category** | IMG |
| **Title** | GET image URL có chữ ký hợp lệ |
| **Priority** | P2 |
| **Preconditions** | Ảnh đã upload, storage driver = r2 |
| **Steps** | 1. GET `/api/v1/media?d=...&s=...` (URL có signed params) |
| **Expected Result** | HTTP 200; trả về file ảnh |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-011
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-011 |
| **Category** | IMG |
| **Title** | GET image URL chữ ký hết hạn |
| **Priority** | P2 |
| **Preconditions** | URL có chữ ký đã hết hạn |
| **Steps** | 1. GET `/api/v1/media?d=...&s=expired_sig` |
| **Expected Result** | HTTP 403 hoặc HTTP 400 |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-012
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-012 |
| **Category** | IMG |
| **Title** | Upload ảnh cho item của shop khác → 404 |
| **Priority** | P1 |
| **Preconditions** | Login shopA; item_id thuộc shopB |
| **Steps** | 1. POST `/api/v1/items/:shopB_item_id/images` |
| **Expected Result** | HTTP 404 |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-013
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-013 |
| **Category** | IMG |
| **Title** | WebP được chấp nhận |
| **Priority** | P3 |
| **Preconditions** | Item tồn tại |
| **Steps** | 1. POST upload với file WebP 3MB |
| **Expected Result** | HTTP 201; upload thành công |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-014
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-014 |
| **Category** | IMG |
| **Title** | Upload ảnh không gửi field `file` |
| **Priority** | P2 |
| **Preconditions** | Item tồn tại |
| **Steps** | 1. POST `/api/v1/items/:id/images` với empty multipart body |
| **Expected Result** | HTTP 400; `{ok:false, error:{code:"UPLOAD_MISSING_FILE"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-IMG-015
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-IMG-015 |
| **Category** | IMG |
| **Title** | GET danh sách ảnh của item |
| **Priority** | P2 |
| **Preconditions** | Item có 3 ảnh |
| **Steps** | 1. GET `/api/v1/items/:id/images` |
| **Expected Result** | HTTP 200; trả 3 ảnh có `id, url, display_order, is_cover`; sắp xếp theo `display_order` tăng dần |
| **Actual Result** | |
| **Status** | Not Run |

---

## TC-SPIN — Spinner 360°

### TC-SPIN-001
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-001 |
| **Category** | SPIN |
| **Title** | Tạo SpinSet mới cho item |
| **Priority** | P1 |
| **Preconditions** | Item tồn tại; login `shop_admin` |
| **Steps** | 1. POST `/api/v1/items/:id/spin-sets` với `{name:"360° View"}` |
| **Expected Result** | HTTP 201; `{ok:true, data:{id:"<uuid>", item_id, name, is_default:false, frames:[]}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-002
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-002 |
| **Category** | SPIN |
| **Title** | Upload frame vào SpinSet |
| **Priority** | P1 |
| **Preconditions** | SpinSet tồn tại với 0 frames |
| **Steps** | 1. POST `/api/v1/spin-sets/:id/frames` với `multipart/form-data`, field `frame`, file JPEG |
| **Expected Result** | HTTP 201; `{data:{id, spin_set_id, frame_index:0, url}}`; frame_index bắt đầu từ 0 |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-003
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-003 |
| **Category** | SPIN |
| **Title** | Upload 24 frames liên tiếp → frame_index 0..23 |
| **Priority** | P1 |
| **Preconditions** | SpinSet rỗng |
| **Steps** | 1. Upload 24 frames lần lượt |
| **Expected Result** | Sau 24 lần upload: frames có frame_index từ 0 đến 23 liên tục; không có gap |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-004
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-004 |
| **Category** | SPIN |
| **Title** | Upload frame trùng frame_index → 409 conflict |
| **Priority** | P1 |
| **Preconditions** | SpinSet có frame tại index 0 |
| **Steps** | 1. POST upload frame với `frame_index:0` tường minh |
| **Expected Result** | HTTP 409; `{ok:false, error:{code:"SPIN_FRAME_INDEX_CONFLICT"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-005
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-005 |
| **Category** | SPIN |
| **Title** | Reorder frames → frame_index cập nhật liên tục 0..n-1 |
| **Priority** | P1 |
| **Preconditions** | SpinSet có 5 frames (index 0-4) |
| **Steps** | 1. PATCH `/api/v1/spin-sets/:id/frames/reorder` với `{frame_ids:["C","A","B","D","E"]}` (thứ tự mới) |
| **Expected Result** | HTTP 200; GET frames trả frame_index: C=0, A=1, B=2, D=3, E=4; không có index bị trùng hoặc gap |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-006
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-006 |
| **Category** | SPIN |
| **Title** | Xóa frame giữa → frame_index còn lại được compacted |
| **Priority** | P1 |
| **Preconditions** | SpinSet có frames index 0,1,2,3,4 |
| **Steps** | 1. DELETE `/api/v1/spin-sets/:id/frames/:frame2_id` (frame_index=2) |
| **Expected Result** | HTTP 200; frames còn lại có index 0,1,2,3 (frames cũ index 3,4 được giảm xuống 2,3) |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-007
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-007 |
| **Category** | SPIN |
| **Title** | Set SpinSet là default |
| **Priority** | P2 |
| **Preconditions** | Item có 2 SpinSets; không cái nào là default |
| **Steps** | 1. PATCH `/api/v1/spin-sets/:id` với `{is_default:true}` |
| **Expected Result** | HTTP 200; SpinSet được set `is_default:true`; các SpinSet khác của cùng item được set `is_default:false` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-008
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-008 |
| **Category** | SPIN |
| **Title** | Upload frame sai loại (GIF) |
| **Priority** | P2 |
| **Preconditions** | SpinSet tồn tại |
| **Steps** | 1. POST upload frame với file GIF |
| **Expected Result** | HTTP 400; `{ok:false, error:{code:"UPLOAD_INVALID_TYPE"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-009
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-009 |
| **Category** | SPIN |
| **Title** | Upload frame quá kích thước |
| **Priority** | P2 |
| **Preconditions** | SpinSet tồn tại |
| **Steps** | 1. POST upload frame với file JPEG 20MB |
| **Expected Result** | HTTP 413; `{ok:false, error:{code:"UPLOAD_TOO_LARGE"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-010
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-010 |
| **Category** | SPIN |
| **Title** | GET SpinSet kèm danh sách frames |
| **Priority** | P2 |
| **Preconditions** | SpinSet có 10 frames |
| **Steps** | 1. GET `/api/v1/spin-sets/:id` |
| **Expected Result** | HTTP 200; `{data:{id, frames:[...]}}` — frames sắp xếp theo `frame_index` tăng dần |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-011
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-011 |
| **Category** | SPIN |
| **Title** | Xóa SpinSet → tất cả frames bị xóa |
| **Priority** | P2 |
| **Preconditions** | SpinSet có 5 frames |
| **Steps** | 1. DELETE `/api/v1/spin-sets/:id` |
| **Expected Result** | HTTP 200; SpinSet và tất cả frames bị xóa khỏi DB và storage |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-012
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-012 |
| **Category** | SPIN |
| **Title** | Vượt giới hạn VITE_MAX_SPINNER_FRAMES → lỗi |
| **Priority** | P2 |
| **Preconditions** | `VITE_MAX_SPINNER_FRAMES=24`; SpinSet đã có 24 frames |
| **Steps** | 1. POST upload frame thứ 25 |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"SPIN_FRAME_LIMIT_EXCEEDED"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-013
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-013 |
| **Category** | SPIN |
| **Title** | Reorder với danh sách frame_ids không đầy đủ → lỗi |
| **Priority** | P2 |
| **Preconditions** | SpinSet có 5 frames |
| **Steps** | 1. PATCH reorder chỉ gửi 3 frame IDs |
| **Expected Result** | HTTP 422; validation error — phải gửi đủ tất cả frame IDs |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-014
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-014 |
| **Category** | SPIN |
| **Title** | Public: SpinSet default hiển thị trong item detail |
| **Priority** | P2 |
| **Preconditions** | Item `is_public:true`; có SpinSet default với 12 frames |
| **Steps** | 1. GET `/api/v1/public/items/:id` |
| **Expected Result** | Response có `spin_set:{frames:[...12 frames...], is_default:true}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-015
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SPIN-015 |
| **Category** | SPIN |
| **Title** | SpinSet của shop khác → 404 |
| **Priority** | P1 |
| **Preconditions** | Login shopA; spin_set_id thuộc shopB |
| **Steps** | 1. GET `/api/v1/spin-sets/:shopB_spin_set_id` |
| **Expected Result** | HTTP 404 |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SPIN-016 đến TC-SPIN-020

| ID | Title | Priority | Expected |
|----|-------|----------|----------|
| TC-SPIN-016 | Tạo SpinSet thứ 2 cho cùng item | P3 | HTTP 201; item có 2 SpinSets |
| TC-SPIN-017 | Frame URL có chữ ký (signed URL) | P2 | URL không thể truy cập không có chữ ký |
| TC-SPIN-018 | Upload frame không gửi field `frame` | P2 | HTTP 400 UPLOAD_MISSING_FILE |
| TC-SPIN-019 | Xóa frame cuối → SpinSet rỗng, không lỗi | P3 | HTTP 200; SpinSet vẫn tồn tại, frames = [] |
| TC-SPIN-020 | Rename SpinSet | P3 | HTTP 200; name cập nhật |

---

## TC-PUB — Public Catalog

### TC-PUB-001
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PUB-001 |
| **Category** | PUB |
| **Title** | Browse public catalog với shop_id hợp lệ |
| **Priority** | P1 |
| **Preconditions** | ShopA có 10 items `is_public:true`; ShopB có 5 items `is_public:true` |
| **Steps** | 1. GET `/api/v1/public/items?shop_id=<shopA_uuid>` (anonymous) |
| **Expected Result** | HTTP 200; trả đúng 10 items của shopA; không có item của shopB |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PUB-002
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PUB-002 |
| **Category** | PUB |
| **Title** | Shop inactive → 404 |
| **Priority** | P1 |
| **Preconditions** | ShopC tồn tại nhưng `is_active:false` |
| **Steps** | 1. GET `/api/v1/public/items?shop_id=<shopC_uuid>` |
| **Expected Result** | HTTP 404; `{ok:false, error:{code:"SHOP_NOT_FOUND_OR_INACTIVE"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PUB-003
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PUB-003 |
| **Category** | PUB |
| **Title** | Production: anonymous không có shop_id → 422 |
| **Priority** | P1 |
| **Preconditions** | Môi trường production (`NODE_ENV=production`) |
| **Steps** | 1. GET `/api/v1/public/items` (không gửi `shop_id`) |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"PUBLIC_SHOP_REQUIRED"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PUB-004
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PUB-004 |
| **Category** | PUB |
| **Title** | Item `is_public:false` không xuất hiện trong catalog |
| **Priority** | P1 |
| **Preconditions** | Item có `is_public:false` |
| **Steps** | 1. GET `/api/v1/public/items?shop_id=<shopA>` |
| **Expected Result** | Item `is_public:false` không có trong response |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PUB-005
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PUB-005 |
| **Category** | PUB |
| **Title** | Item detail kèm gallery và spinner |
| **Priority** | P1 |
| **Preconditions** | Item `is_public:true`, có 3 ảnh, có SpinSet default với 12 frames |
| **Steps** | 1. GET `/api/v1/public/items/:id?shop_id=<shopA>` |
| **Expected Result** | HTTP 200; response có `images:[3 items]`, `spin_set:{frames:[12 items]}`; URLs có chữ ký |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PUB-006 đến TC-PUB-015

| ID | Title | Priority | Expected |
|----|-------|----------|----------|
| TC-PUB-006 | Tìm kiếm theo tên trong catalog | P2 | Substring match, chỉ trong shop scope |
| TC-PUB-007 | Lọc theo status con_hang trong catalog | P2 | Chỉ trả items có status con_hang |
| TC-PUB-008 | Lọc theo brand trong catalog | P3 | Filter đúng brand |
| TC-PUB-009 | Pagination catalog | P2 | page/limit hoạt động đúng |
| TC-PUB-010 | Item detail của shop khác → 404 | P1 | Không leak cross-tenant |
| TC-PUB-011 | Item soft-deleted không xuất hiện | P1 | 404 cho item đã delete |
| TC-PUB-012 | Rate limiting catalog (100 req/min) | P3 | 429 sau giới hạn |
| TC-PUB-013 | Sort catalog theo price ascending | P3 | Thứ tự đúng |
| TC-PUB-014 | Browse bằng shop slug (nếu có) | P3 | 200 với slug hợp lệ |
| TC-PUB-015 | Item da_ban không xuất hiện trong catalog | P2 | Items da_ban bị ẩn public |

---

## TC-PRE — Pre-Orders

### TC-PRE-001
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PRE-001 |
| **Category** | PRE |
| **Title** | Tạo pre-order mới |
| **Priority** | P1 |
| **Preconditions** | Member và Item tồn tại trong shop |
| **Steps** | 1. POST `/api/v1/pre-orders` với `{member_id, item_id, quantity:1, deposit:100000}` |
| **Expected Result** | HTTP 201; `{data:{id, status:"PENDING_CONFIRMATION", member_id, item_id, ...}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PRE-002
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PRE-002 |
| **Category** | PRE |
| **Title** | Chuyển PENDING_CONFIRMATION → WAITING_FOR_GOODS |
| **Priority** | P1 |
| **Preconditions** | Pre-order có status `PENDING_CONFIRMATION` |
| **Steps** | 1. PATCH `/api/v1/pre-orders/:id` với `{status:"WAITING_FOR_GOODS"}` |
| **Expected Result** | HTTP 200; `{data:{status:"WAITING_FOR_GOODS"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PRE-003
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PRE-003 |
| **Category** | PRE |
| **Title** | Chuyển WAITING_FOR_GOODS → ARRIVED |
| **Priority** | P1 |
| **Preconditions** | Pre-order ở `WAITING_FOR_GOODS` |
| **Steps** | 1. PATCH status `ARRIVED` |
| **Expected Result** | HTTP 200; status = `ARRIVED` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PRE-004
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PRE-004 |
| **Category** | PRE |
| **Title** | Chuyển ARRIVED → PAID → điểm được tạo |
| **Priority** | P1 |
| **Preconditions** | Pre-order ở `ARRIVED`; member có `points_balance:0` |
| **Steps** | 1. PATCH status `PAID` |
| **Expected Result** | HTTP 200; status = `PAID`; GET member → `points_balance` tăng theo rule earn; GET ledger → có entry mới với `reference_type:"pre_order"`, `reference_id:"<preorder_id>"` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PRE-005
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PRE-005 |
| **Category** | PRE |
| **Title** | Chuyển PAID → REFUNDED (terminal → terminal không cho phép) |
| **Priority** | P1 |
| **Preconditions** | Pre-order ở `PAID` (chưa phải terminal) → REFUNDED là terminal |
| **Steps** | 1. PATCH status `REFUNDED` |
| **Expected Result** | HTTP 200; status = `REFUNDED` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PRE-006
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PRE-006 |
| **Category** | PRE |
| **Title** | Pre-order đã REFUNDED không cho phép transition tiếp |
| **Priority** | P1 |
| **Preconditions** | Pre-order ở `REFUNDED` (terminal) |
| **Steps** | 1. PATCH status `CANCELLED` |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"ITEM_STATUS_TRANSITION_INVALID"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PRE-007
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PRE-007 |
| **Category** | PRE |
| **Title** | Pre-order đã CANCELLED là terminal |
| **Priority** | P1 |
| **Preconditions** | Pre-order ở `CANCELLED` |
| **Steps** | 1. PATCH status `PENDING_CONFIRMATION` |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"ITEM_STATUS_TRANSITION_INVALID"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PRE-008
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PRE-008 |
| **Category** | PRE |
| **Title** | Transition không hợp lệ: PENDING_CONFIRMATION → PAID |
| **Priority** | P1 |
| **Preconditions** | Pre-order ở `PENDING_CONFIRMATION` |
| **Steps** | 1. PATCH status `PAID` (bỏ qua các bước trung gian) |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"ITEM_STATUS_TRANSITION_INVALID"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PRE-009
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-PRE-009 |
| **Category** | PRE |
| **Title** | Hủy pre-order từ PENDING_CONFIRMATION → CANCELLED |
| **Priority** | P1 |
| **Preconditions** | Pre-order ở `PENDING_CONFIRMATION` |
| **Steps** | 1. PATCH status `CANCELLED` |
| **Expected Result** | HTTP 200; status = `CANCELLED` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-PRE-010 đến TC-PRE-020

| ID | Title | Priority | Expected |
|----|-------|----------|----------|
| TC-PRE-010 | Tạo pre-order thiếu member_id → validation error | P1 | HTTP 422 |
| TC-PRE-011 | Tạo pre-order với member thuộc shop khác → 404 | P1 | HTTP 404 |
| TC-PRE-012 | Tạo pre-order với item thuộc shop khác → 404 | P1 | HTTP 404 |
| TC-PRE-013 | List pre-orders của member cụ thể | P2 | HTTP 200 filtered |
| TC-PRE-014 | List pre-orders theo status | P2 | Filter đúng |
| TC-PRE-015 | Pre-order detail có member info và item info | P2 | Relations được embed |
| TC-PRE-016 | Hủy từ WAITING_FOR_GOODS → CANCELLED | P2 | HTTP 200 |
| TC-PRE-017 | Hủy từ ARRIVED → CANCELLED | P2 | HTTP 200 |
| TC-PRE-018 | PATCH pre-order của shop khác → 404 | P1 | HTTP 404 |
| TC-PRE-019 | Pagination pre-orders | P3 | page/limit hoạt động |
| TC-PRE-020 | Pre-order có notes field | P3 | notes được lưu và trả về |

---

## TC-INV — Inventory

### TC-INV-001
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-INV-001 |
| **Category** | INV |
| **Title** | stock_in tăng quantity của item |
| **Priority** | P1 |
| **Preconditions** | Item `quantity:5` |
| **Steps** | 1. POST `/api/v1/inventory/transactions` với `{item_id, type:"stock_in", quantity:10}` |
| **Expected Result** | HTTP 201; GET item → `quantity:15`; transaction lưu với `type:"stock_in"`, `quantity:10` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-INV-002
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-INV-002 |
| **Category** | INV |
| **Title** | stock_out giảm quantity |
| **Priority** | P1 |
| **Preconditions** | Item `quantity:10` |
| **Steps** | 1. POST transaction `{type:"stock_out", quantity:3}` |
| **Expected Result** | HTTP 201; item `quantity:7` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-INV-003
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-INV-003 |
| **Category** | INV |
| **Title** | stock_out quá quantity hiện tại → lỗi |
| **Priority** | P1 |
| **Preconditions** | Item `quantity:5` |
| **Steps** | 1. POST transaction `{type:"stock_out", quantity:10}` |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"INVENTORY_INSUFFICIENT_STOCK"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-INV-004
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-INV-004 |
| **Category** | INV |
| **Title** | adjustment (dương) tăng quantity |
| **Priority** | P2 |
| **Preconditions** | Item `quantity:5` |
| **Steps** | 1. POST transaction `{type:"adjustment", quantity:3}` |
| **Expected Result** | HTTP 201; item `quantity:8` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-INV-005
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-INV-005 |
| **Category** | INV |
| **Title** | adjustment (âm) giảm quantity |
| **Priority** | P2 |
| **Preconditions** | Item `quantity:10` |
| **Steps** | 1. POST transaction `{type:"adjustment", quantity:-4}` |
| **Expected Result** | HTTP 201; item `quantity:6` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-INV-006
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-INV-006 |
| **Category** | INV |
| **Title** | adjustment zero → validation error |
| **Priority** | P2 |
| **Preconditions** | Item tồn tại |
| **Steps** | 1. POST transaction `{type:"adjustment", quantity:0}` |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"VALIDATION_ERROR"}}` — quantity adjustment phải khác 0 |
| **Actual Result** | |
| **Status** | Not Run |

### TC-INV-007
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-INV-007 |
| **Category** | INV |
| **Title** | Reversal của transaction |
| **Priority** | P2 |
| **Preconditions** | Tồn tại transaction `stock_in` quantity=10 |
| **Steps** | 1. POST `/api/v1/inventory/transactions/:id/reverse` |
| **Expected Result** | HTTP 200; quantity item giảm 10; transaction reversal được ghi với reference đến transaction gốc |
| **Actual Result** | |
| **Status** | Not Run |

### TC-INV-008
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-INV-008 |
| **Category** | INV |
| **Title** | List transactions của item |
| **Priority** | P2 |
| **Preconditions** | Item có 5 transactions |
| **Steps** | 1. GET `/api/v1/inventory/transactions?item_id=<id>` |
| **Expected Result** | HTTP 200; 5 transactions theo thứ tự thời gian |
| **Actual Result** | |
| **Status** | Not Run |

### TC-INV-009
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-INV-009 |
| **Category** | INV |
| **Title** | Inventory của item thuộc shop khác → 404 |
| **Priority** | P1 |
| **Preconditions** | Login shopA; item_id thuộc shopB |
| **Steps** | 1. POST transaction với item_id của shopB |
| **Expected Result** | HTTP 404 |
| **Actual Result** | |
| **Status** | Not Run |

### TC-INV-010
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-INV-010 |
| **Category** | INV |
| **Title** | Reconciliation report |
| **Priority** | P3 |
| **Preconditions** | Nhiều transactions trong khoảng thời gian |
| **Steps** | 1. GET `/api/v1/inventory/reconciliation?from=2026-01-01&to=2026-05-22` |
| **Expected Result** | HTTP 200; tổng stock_in, stock_out, adjustment khớp với quantity hiện tại |
| **Actual Result** | |
| **Status** | Not Run |

---

## TC-MEM — Members & Points

### TC-MEM-001
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-MEM-001 |
| **Category** | MEM |
| **Title** | Tạo member mới |
| **Priority** | P1 |
| **Preconditions** | Login `shop_admin` |
| **Steps** | 1. POST `/api/v1/members` với `{name:"Nguyễn Văn A", phone:"0901234567"}` |
| **Expected Result** | HTTP 201; `{data:{id, name, phone, points_balance:0, shop_id:"<active>"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-MEM-002
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-MEM-002 |
| **Category** | MEM |
| **Title** | Xóa member có active pre-order → FK RESTRICT |
| **Priority** | P1 |
| **Preconditions** | Member có pre-order với status `PENDING_CONFIRMATION` (non-terminal) |
| **Steps** | 1. DELETE `/api/v1/members/:id` |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"MEMBER_HAS_ACTIVE_PREORDERS"}, message:"Không thể xóa member có pre-order đang hoạt động"}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-MEM-003
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-MEM-003 |
| **Category** | MEM |
| **Title** | Xóa member chỉ có pre-order terminal → thành công |
| **Priority** | P1 |
| **Preconditions** | Member chỉ có pre-orders với status `CANCELLED` hoặc `REFUNDED` |
| **Steps** | 1. DELETE `/api/v1/members/:id` |
| **Expected Result** | HTTP 200; member bị xóa |
| **Actual Result** | |
| **Status** | Not Run |

### TC-MEM-004
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-MEM-004 |
| **Category** | MEM |
| **Title** | Earn points (positive): ghi vào ledger |
| **Priority** | P1 |
| **Preconditions** | Member `points_balance:100` |
| **Steps** | 1. POST `/api/v1/members/:id/points` với `{type:"earn", amount:50, reference_type:"manual", note:"Thưởng"}` |
| **Expected Result** | HTTP 201; member `points_balance:150`; ledger có entry `{type:"earn", amount:50, balance_after:150}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-MEM-005
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-MEM-005 |
| **Category** | MEM |
| **Title** | Redeem points: trừ từ ledger |
| **Priority** | P1 |
| **Preconditions** | Member `points_balance:200` |
| **Steps** | 1. POST points với `{type:"redeem", amount:80}` |
| **Expected Result** | HTTP 201; `points_balance:120` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-MEM-006
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-MEM-006 |
| **Category** | MEM |
| **Title** | Redeem quá số điểm hiện có → lỗi |
| **Priority** | P1 |
| **Preconditions** | Member `points_balance:50` |
| **Steps** | 1. POST points `{type:"redeem", amount:100}` |
| **Expected Result** | HTTP 422; `{ok:false, error:{code:"MEMBER_INSUFFICIENT_POINTS"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-MEM-007
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-MEM-007 |
| **Category** | MEM |
| **Title** | Adjust points (dương hoặc âm) qua ledger |
| **Priority** | P1 |
| **Preconditions** | Member `points_balance:100` |
| **Steps** | 1. POST points `{type:"adjust", amount:-30, note:"Điều chỉnh lỗi"}` |
| **Expected Result** | HTTP 201; `points_balance:70`; ledger entry `{type:"adjust", amount:-30}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-MEM-008
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-MEM-008 |
| **Category** | MEM |
| **Title** | Adjust points = 0 → validation error |
| **Priority** | P2 |
| **Preconditions** | Member tồn tại |
| **Steps** | 1. POST points `{type:"adjust", amount:0}` |
| **Expected Result** | HTTP 422; validation error — amount phải khác 0 |
| **Actual Result** | |
| **Status** | Not Run |

### TC-MEM-009 đến TC-MEM-015

| ID | Title | Priority | Expected |
|----|-------|----------|----------|
| TC-MEM-009 | Ledger audit trail đầy đủ | P1 | GET ledger trả toàn bộ lịch sử |
| TC-MEM-010 | Update thông tin member | P2 | HTTP 200; fields cập nhật |
| TC-MEM-011 | Search member theo tên/phone | P2 | Substring match |
| TC-MEM-012 | List members chỉ trả của active shop | P1 | Cross-tenant isolation |
| TC-MEM-013 | Member điểm không thể thay đổi trực tiếp | P1 | Bypass ledger bị từ chối |
| TC-MEM-014 | Xóa member không có pre-order | P2 | HTTP 200 |
| TC-MEM-015 | Member của shop khác → 404 | P1 | Cross-tenant protection |

---

## TC-SEC — Security

### TC-SEC-001
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SEC-001 |
| **Category** | SEC |
| **Title** | SQL Injection qua search parameter |
| **Priority** | P1 |
| **Preconditions** | Bất kỳ endpoint nào có query search |
| **Steps** | 1. GET `/api/v1/items?search='; DROP TABLE items; --` |
| **Expected Result** | HTTP 200 hoặc 400 nhưng không có SQL error; database không bị ảnh hưởng; items vẫn còn |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SEC-002
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SEC-002 |
| **Category** | SEC |
| **Title** | XSS trong item name |
| **Priority** | P1 |
| **Preconditions** | Login `shop_admin` |
| **Steps** | 1. POST item với `{name:"<script>alert('XSS')</script>"}` ; 2. GET item; 3. Render trong UI |
| **Expected Result** | Tên được lưu dưới dạng plain text (escaped); không thực thi script trong browser |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SEC-003
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SEC-003 |
| **Category** | SEC |
| **Title** | Cross-tenant: dùng token shopA đọc data shopB |
| **Priority** | P1 |
| **Preconditions** | Login shopA; biết item_id của shopB |
| **Steps** | 1. GET `/api/v1/items/:shopB_item_id` với cookie của shopA |
| **Expected Result** | HTTP 404; không leak thông tin item của shopB |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SEC-004
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SEC-004 |
| **Category** | SEC |
| **Title** | CSRF: gửi POST không có X-CSRF-Token header |
| **Priority** | P1 |
| **Preconditions** | Có cookie hợp lệ nhưng không có CSRF token |
| **Steps** | 1. POST `/api/v1/items` với cookie nhưng không có `X-CSRF-Token` |
| **Expected Result** | HTTP 403; `{ok:false, error:{code:"CSRF_TOKEN_MISSING"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SEC-005
| Trường | Nội dung |
|--------|---------|
| **ID** | TC-SEC-005 |
| **Category** | SEC |
| **Title** | CSRF: gửi X-CSRF-Token sai giá trị |
| **Priority** | P1 |
| **Preconditions** | Có cookie hợp lệ |
| **Steps** | 1. POST với header `X-CSRF-Token: invalid-token` |
| **Expected Result** | HTTP 403; `{ok:false, error:{code:"CSRF_TOKEN_INVALID"}}` |
| **Actual Result** | |
| **Status** | Not Run |

### TC-SEC-006 đến TC-SEC-010

| ID | Title | Priority | Expected |
|----|-------|----------|----------|
| TC-SEC-006 | Cookie flags: HttpOnly, Secure, SameSite | P1 | access_token cookie có đúng flags |
| TC-SEC-007 | JWT manipulation: thay đổi shop_id trong payload | P1 | Signature invalid → 401 |
| TC-SEC-008 | File upload bypass: đổi extension không phải đổi MIME | P1 | MIME check phải dựa trên content, không chỉ extension |
| TC-SEC-009 | Rate limiting: 429 sau N request/phút | P2 | 429 với Retry-After header |
| TC-SEC-010 | platform_super không bị giới hạn bởi TenantGuard | P2 | platform_super đọc được mọi shop |

---

_Tổng cộng: 110 test cases chi tiết. Bổ sung thêm khi cần theo phản hồi từ development team._
