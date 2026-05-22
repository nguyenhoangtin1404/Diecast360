---
title: "Tài liệu API Hoàn chỉnh"
document_id: "DOC-18"
version: "1.0.0"
created_date: "2026-05-22"
author: "Tech Lead / Solution Architect"
status: "Approved"
---

# 18. API Documentation — Diecast360

## Mục lục
1. [Overview](#1-overview)
2. [Authentication Endpoints](#2-authentication-endpoints)
3. [Platform Admin — Shops](#3-platform-admin--shops)
4. [Shop Settings](#4-shop-settings)
5. [Categories](#5-categories)
6. [Items](#6-items)
7. [Item Images](#7-item-images)
8. [Spinner (360°)](#8-spinner-360)
9. [AI Module](#9-ai-module)
10. [Public Endpoints](#10-public-endpoints)
11. [Pre-Orders](#11-pre-orders)
12. [Inventory](#12-inventory)
13. [Reports](#13-reports)
14. [Members](#14-members)
15. [Error Codes Reference](#15-error-codes-reference)

---

## 1. Overview

### Base URL
```
Production:  https://api.diecast360.vn/api/v1
Development: http://localhost:3000/api/v1
```

### Request Format
- Content-Type: `application/json` (body)
- Upload: `multipart/form-data`
- Encoding: UTF-8

### Authentication
| Method | Header / Cookie |
|--------|----------------|
| Primary | Cookie: `access_token=<jwt>` (HttpOnly) |
| Fallback | `Authorization: Bearer <jwt>` |
| Mutations | Header: `X-CSRF-Token: <token>` (bắt buộc) |

### Response Envelope

**Thành công:**
```json
{
  "ok": true,
  "data": { ... },
  "message": "Success"
}
```

**Lỗi:**
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }
  },
  "message": "Human readable message"
}
```

### Pagination

```json
{
  "ok": true,
  "data": [ ... ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "total_pages": 8
  }
}
```

Query params: `?page=1&limit=20`

### Signed Media URLs

```
GET /api/v1/media?d=<encoded_path>&s=<signature>
```

- `d`: base64url-encoded file path
- `s`: HMAC-SHA256 signature
- TTL: configurable (mặc định 1 giờ)

---

## 2. Authentication Endpoints

### 2.1 Get CSRF Token

```
GET /api/v1/auth/csrf
Auth: Not required
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "csrf_token": "abc123xyz..."
  }
}
```

*Side effect:* Set `csrf_token` signed cookie (HttpOnly)

---

### 2.2 Login

```
POST /api/v1/auth/login
Auth: Not required
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "email": "admin@shop.com",
  "password": "Secret123!"
}
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "me": {
      "id": "uuid",
      "email": "admin@shop.com",
      "full_name": "Nguyễn Văn A",
      "role": "shop_admin",
      "platform_role": null,
      "active_shop_id": "uuid",
      "active_shop": {
        "id": "uuid",
        "name": "Shop ABC",
        "slug": "shop-abc"
      }
    }
  }
}
```

*Side effects:*
- Set `access_token` cookie (HttpOnly, 15m)
- Set `refresh_token` cookie (HttpOnly, 7d)

**Errors:**
- `AUTH_INVALID_CREDENTIALS (401)` — email/password sai

---

### 2.3 Refresh Token

```
POST /api/v1/auth/refresh
Auth: refresh_token cookie
Headers: X-CSRF-Token: <token>
```

**Response 200:**
```json
{
  "ok": true,
  "data": { "refreshed": true }
}
```

*Side effects:* Set new `access_token` cookie + new `refresh_token` cookie (rotation)

**Errors:**
- `AUTH_TOKEN_EXPIRED (401)` — refresh token hết hạn hoặc revoked

---

### 2.4 Logout

```
POST /api/v1/auth/logout
Auth: Required
Headers: X-CSRF-Token: <token>
```

**Response 200:**
```json
{ "ok": true, "data": null, "message": "Logged out" }
```

*Side effects:* Revoke refresh token, clear cookies

---

### 2.5 Get Current User

```
GET /api/v1/auth/me
Auth: Required
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "email": "admin@shop.com",
    "full_name": "Nguyễn Văn A",
    "role": "shop_admin",
    "platform_role": null,
    "active_shop_id": "uuid",
    "shops": [
      { "id": "uuid", "name": "Shop ABC", "role": "shop_admin" }
    ]
  }
}
```

---

### 2.6 Switch Active Shop

```
POST /api/v1/auth/switch-shop
Auth: Required
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{ "shop_id": "uuid" }
```

**Response 200:**
```json
{ "ok": true, "data": { "active_shop_id": "uuid" } }
```

**Errors:**
- `AUTH_FORBIDDEN (403)` — user không thuộc shop này

---

## 3. Platform Admin — Shops

> Tất cả endpoints này yêu cầu `platform_super` role.

### 3.1 List Shops

```
GET /api/v1/shops
Auth: platform_super
Query: ?page=1&limit=20&is_active=true
```

**Response 200:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "Shop ABC",
      "slug": "shop-abc",
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20, "total_pages": 1 }
}
```

---

### 3.2 Create Shop

```
POST /api/v1/shops
Auth: platform_super
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "name": "Shop XYZ",
  "slug": "shop-xyz",
  "is_active": true,
  "contact_json": {
    "phone": "0901234567",
    "email": "contact@shopxyz.com"
  }
}
```

**Response 201:**
```json
{
  "ok": true,
  "data": { "id": "uuid", "name": "Shop XYZ", "slug": "shop-xyz", ... }
}
```

**Errors:**
- `VALIDATION_ERROR (422)` — slug đã tồn tại hoặc format sai

---

### 3.3 Get Shop

```
GET /api/v1/shops/:id
Auth: platform_super
```

---

### 3.4 Update Shop

```
PATCH /api/v1/shops/:id
Auth: platform_super
Headers: X-CSRF-Token: <token>
```

---

### 3.5 Shop Audit Logs

```
GET /api/v1/shops/:id/audit-logs
Auth: platform_super
Query: ?page=1&limit=50
```

**Response 200:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "action": "SHOP_UPDATED",
      "actor_user_id": "uuid",
      "actor_name": "Admin",
      "target_type": "shop",
      "target_id": "uuid",
      "metadata_json": { "changed_fields": ["name"] },
      "created_at": "2026-01-15T10:00:00Z"
    }
  ]
}
```

---

## 4. Shop Settings

### 4.1 Get Shop Settings

```
GET /api/v1/shop-settings
Auth: shop_admin
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "shop": {
      "id": "uuid",
      "name": "Shop ABC",
      "contact_json": { "phone": "...", "email": "..." },
      "appearance_json": { "logo_url": "...", "primary_color": "#ff6b00" },
      "loyalty_json": { "earn_rate": 1 }
    }
  }
}
```

---

### 4.2 Update Shop Settings

```
PATCH /api/v1/shop-settings
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "name": "Shop ABC Updated",
  "contact_json": { "phone": "0901234567" },
  "appearance_json": { "primary_color": "#123456" },
  "loyalty_json": { "earn_rate": 2 }
}
```

---

## 5. Categories

### 5.1 List Categories

```
GET /api/v1/categories
Auth: Required
Query: ?type=car_brand&is_active=true
```

**Response 200:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "Hot Wheels",
      "type": "car_brand",
      "is_active": true,
      "display_order": 1,
      "scope": "global"
    }
  ]
}
```

---

### 5.2 Create Category

```
POST /api/v1/categories
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "name": "Hot Wheels",
  "type": "car_brand",
  "display_order": 1
}
```

---

### 5.3 Update Category

```
PATCH /api/v1/categories/:id
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

---

### 5.4 Delete Category

```
DELETE /api/v1/categories/:id
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

---

## 6. Items

### 6.1 List Items

```
GET /api/v1/items
Auth: Required
Query:
  page=1&limit=20
  status=con_hang|giu_cho|da_ban
  q=<search_term>          (ILIKE search trên name)
  brand=<brand>
  car_brand=<car_brand>
  is_public=true|false
  sort=created_at|price|name
  order=desc|asc
```

**Response 200:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "Hot Wheels Ferrari",
      "scale": "1:64",
      "brand": "Hot Wheels",
      "car_brand": "Ferrari",
      "status": "con_hang",
      "quantity": 5,
      "price": 150000,
      "original_price": 200000,
      "is_public": true,
      "cover_image": {
        "thumbnail_url": "/api/v1/media?d=...&s=..."
      },
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": { "total": 150, "page": 1, "limit": 20, "total_pages": 8 }
}
```

---

### 6.2 Create Item

```
POST /api/v1/items
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "name": "Hot Wheels Ferrari F40",
  "description": "Xe mô hình tỷ lệ 1:64, màu đỏ",
  "scale": "1:64",
  "brand": "Hot Wheels",
  "car_brand": "Ferrari",
  "model_brand": null,
  "condition": "new",
  "price": 150000,
  "original_price": 200000,
  "status": "con_hang",
  "quantity": 10,
  "attributes": { "color": "red", "year": 2025 },
  "is_public": true
}
```

**Response 201:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "Hot Wheels Ferrari F40",
    ...
  }
}
```

**Errors:**
- `VALIDATION_ERROR (422)` — quantity > 0 khi status = da_ban

---

### 6.3 Get Item Detail

```
GET /api/v1/items/:id
Auth: Required
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "Hot Wheels Ferrari F40",
    "description": "...",
    "scale": "1:64",
    "brand": "Hot Wheels",
    "car_brand": "Ferrari",
    "status": "con_hang",
    "quantity": 10,
    "price": 150000,
    "original_price": 200000,
    "attributes": { "color": "red" },
    "is_public": true,
    "notes": "Internal note...",
    "images": [
      {
        "id": "uuid",
        "url": "/api/v1/media?d=...&s=...",
        "thumbnail_url": "/api/v1/media?d=...&s=...",
        "is_cover": true,
        "display_order": 0
      }
    ],
    "spin_sets": [
      {
        "id": "uuid",
        "label": "360°",
        "is_default": true,
        "frame_count": 24
      }
    ],
    "created_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### 6.4 Update Item

```
PATCH /api/v1/items/:id
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:** (partial update — chỉ gửi fields cần thay đổi)
```json
{
  "status": "da_ban",
  "quantity": 0
}
```

**Errors:**
- `ITEM_STATUS_TRANSITION_INVALID (422)` — nếu vi phạm business rule

---

### 6.5 Delete Item (Soft Delete)

```
DELETE /api/v1/items/:id
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Response 200:**
```json
{ "ok": true, "data": null, "message": "Item deleted" }
```

---

### 6.6 Get Item's Facebook Posts

```
GET /api/v1/items/:id/facebook-posts
Auth: Required
```

---

### 6.7 Publish Facebook Post

```
POST /api/v1/items/:id/facebook-posts
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "content": "Vừa về hàng Hot Wheels Ferrari F40 1:64 ...",
  "image_ids": ["uuid1", "uuid2"]
}
```

**Errors:**
- `FACEBOOK_AUTH_ERROR (401)` — access token không hợp lệ
- `FACEBOOK_PUBLISH_ERROR (502)` — Facebook API error

---

### 6.8 Export Items CSV

```
GET /api/v1/items/export/csv
Auth: shop_admin
Query: (same filter params as list)
Response: text/csv download
```

---

## 7. Item Images

### 7.1 Upload Image

```
POST /api/v1/items/:itemId/images
Auth: shop_admin
Headers: X-CSRF-Token: <token>
Content-Type: multipart/form-data
Field: file (image file)
Query: ?is_cover=false&display_order=0
```

**Response 201:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "item_id": "uuid",
    "url": "/api/v1/media?d=...&s=...",
    "thumbnail_url": "/api/v1/media?d=...&s=...",
    "is_cover": false,
    "display_order": 0
  }
}
```

**Errors:**
- `UPLOAD_INVALID_TYPE (400)` — MIME type không được phép
- `UPLOAD_TOO_LARGE (413)` — file quá MAX_UPLOAD_MB

---

### 7.2 Update Image (Set Cover / Reorder)

```
PATCH /api/v1/items/:itemId/images/:imageId
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "is_cover": true,
  "display_order": 0
}
```

---

### 7.3 Reorder Images

```
PATCH /api/v1/items/:itemId/images/reorder
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "order": ["uuid1", "uuid2", "uuid3"]
}
```

---

### 7.4 Delete Image

```
DELETE /api/v1/items/:itemId/images/:imageId
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

---

## 8. Spinner (360°)

### 8.1 List Spin Sets for Item

```
GET /api/v1/items/:itemId/spin-sets
Auth: Required
```

**Response 200:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "item_id": "uuid",
      "label": "360°",
      "is_default": true,
      "frames": [
        {
          "id": "uuid",
          "frame_index": 0,
          "url": "/api/v1/media?d=...&s=...",
          "thumbnail_url": "/api/v1/media?d=...&s=..."
        }
      ]
    }
  ]
}
```

---

### 8.2 Create Spin Set

```
POST /api/v1/items/:itemId/spin-sets
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{ "label": "360°", "is_default": true }
```

---

### 8.3 Upload Spinner Frame

```
POST /api/v1/spinner/:setId/frames
Auth: shop_admin
Headers: X-CSRF-Token: <token>
Content-Type: multipart/form-data
Field: frame (image file)
Body (form fields): frame_index=0
```

**Response 201:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "spin_set_id": "uuid",
    "frame_index": 0,
    "url": "/api/v1/media?d=...&s=...",
    "thumbnail_url": "/api/v1/media?d=...&s=..."
  }
}
```

**Errors:**
- `SPIN_FRAME_INDEX_CONFLICT (409)` — frame_index đã tồn tại

---

### 8.4 Reorder Frames

```
PATCH /api/v1/spinner/:setId/frames/reorder
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "order": ["frameId0", "frameId1", "frameId2", ...]
}
```

---

### 8.5 Delete Frame

```
DELETE /api/v1/spinner/:setId/frames/:frameId
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

---

### 8.6 Delete Spin Set

```
DELETE /api/v1/spinner/:setId
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

---

## 9. AI Module

### 9.1 Generate Item Description (AI Draft)

```
POST /api/v1/ai/ai-description
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "image_urls": [
    "/api/v1/media?d=...&s=...",
    "/api/v1/media?d=...&s=..."
  ]
}
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "draft_id": "uuid",
    "ai_json": {
      "name": "Hot Wheels Ferrari F40 1:64",
      "brand": "Hot Wheels",
      "car_brand": "Ferrari",
      "scale": "1:64",
      "color": "red",
      "description": "Xe mô hình Hot Wheels Ferrari F40 tỷ lệ 1:64...",
      "suggested_price": 150000
    },
    "confidence_json": {
      "name": 0.95,
      "brand": 0.90,
      "scale": 0.85
    },
    "status": "PENDING"
  }
}
```

---

### 9.2 Confirm AI Draft → Create Item

```
POST /api/v1/ai/ai-draft/:draftId/confirm
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:** (override AI values nếu cần)
```json
{
  "name": "Hot Wheels Ferrari F40 1:64 Đỏ",
  "price": 160000,
  "quantity": 5,
  "status": "con_hang",
  "is_public": true
}
```

---

### 9.3 Reject AI Draft

```
POST /api/v1/ai/ai-draft/:draftId/reject
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

---

### 9.4 Generate Facebook Post Content

```
POST /api/v1/ai/fb-post
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{ "item_id": "uuid" }
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "content": "🚗 VỪA VỀ HÀNG: Hot Wheels Ferrari F40 1:64\n\n..."
  }
}
```

---

## 10. Public Endpoints

> Không yêu cầu xác thực. Bắt buộc có `shop_id` query param.

### 10.1 List Public Items

```
GET /api/v1/public/items
Auth: None
Query:
  shop_id=<uuid>  (bắt buộc)
  page=1&limit=20
  q=<search>
  brand=<brand>
  car_brand=<car_brand>
  sort=price|name|created_at
  order=asc|desc
```

**Response 200:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "Hot Wheels Ferrari F40",
      "scale": "1:64",
      "brand": "Hot Wheels",
      "car_brand": "Ferrari",
      "status": "con_hang",
      "price": 150000,
      "cover_image_thumbnail": "/api/v1/media?d=...&s=...",
      "has_spinner": true
    }
  ],
  "meta": { ... }
}
```

**Errors:**
- `PUBLIC_SHOP_REQUIRED (422)` — thiếu shop_id
- `NOT_FOUND (404)` — shop không tồn tại hoặc không active

---

### 10.2 Get Public Item Detail

```
GET /api/v1/public/items/:id
Auth: None
Query: shop_id=<uuid>
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "Hot Wheels Ferrari F40",
    "description": "...",
    "scale": "1:64",
    "brand": "Hot Wheels",
    "car_brand": "Ferrari",
    "price": 150000,
    "status": "con_hang",
    "images": [ { "url": "...", "thumbnail_url": "...", "is_cover": true } ],
    "spin_set": {
      "id": "uuid",
      "frames": [ { "frame_index": 0, "url": "..." } ]
    }
  }
}
```

---

### 10.3 Get Public Shop Info

```
GET /api/v1/public/shop
Auth: None
Query: shop_id=<uuid>
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "name": "Shop ABC",
    "contact_json": { "phone": "...", "facebook_url": "..." },
    "appearance_json": { "logo_url": "...", "primary_color": "#ff6b00" }
  }
}
```

---

## 11. Pre-Orders

### 11.1 Create Pre-Order

```
POST /api/v1/preorders
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "item_id": "uuid",
  "member_id": "uuid",
  "quantity": 1,
  "unit_price": 150000,
  "deposit_amount": 50000,
  "expected_arrival_at": "2026-03-01",
  "note": "Khách hỏi màu đỏ"
}
```

**Response 201:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "status": "PENDING_CONFIRMATION",
    "total_amount": 150000,
    ...
  }
}
```

---

### 11.2 Update Pre-Order Status

```
PATCH /api/v1/preorders/:id/status
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "status": "WAITING_FOR_GOODS",
  "note": "Đã đặt hàng với nhà cung cấp"
}
```

**Errors:**
- `ITEM_STATUS_TRANSITION_INVALID (422)` — vi phạm state machine
- `NOT_FOUND (404)` — pre-order không thuộc shop hiện tại

---

### 11.3 List Pre-Orders (Admin)

```
GET /api/v1/preorders
Auth: Required
Query:
  page=1&limit=20
  status=PENDING_CONFIRMATION|WAITING_FOR_GOODS|...
  member_id=<uuid>
  item_id=<uuid>
```

---

### 11.4 Get Pre-Order Detail

```
GET /api/v1/preorders/:id
Auth: Required
```

---

### 11.5 Public Pre-Order Cards (Shareable)

```
GET /api/v1/preorders/:id/card
Auth: None
```

**Response:** HTML card (hoặc JSON cho embed)

---

## 12. Inventory

### 12.1 Create Transaction

```
POST /api/v1/inventory
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "item_id": "uuid",
  "type": "stock_in",
  "quantity": 10,
  "reason": "Nhập hàng từ nhà cung cấp ABC",
  "note": "Hóa đơn số 12345"
}
```

**Response 201:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "type": "stock_in",
    "quantity": 10,
    "delta": 10,
    "resulting_quantity": 20,
    "created_at": "..."
  }
}
```

---

### 12.2 List Transactions

```
GET /api/v1/inventory
Auth: Required
Query:
  item_id=<uuid>
  type=stock_in|stock_out|adjustment
  page=1&limit=50
```

---

### 12.3 Reverse Transaction

```
POST /api/v1/inventory/:id/reverse
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{ "reason": "Nhập nhầm số lượng" }
```

---

### 12.4 Reconciliation

```
POST /api/v1/inventory/reconcile
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "item_id": "uuid",
  "actual_quantity": 8,
  "reason": "Kiểm kho ngày 22/05/2026"
}
```

---

## 13. Reports

### 13.1 Summary Report

```
GET /api/v1/reports/summary
Auth: shop_admin
Query: ?from=2026-01-01&to=2026-05-22
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "total_revenue": 15000000,
    "total_preorders": 45,
    "preorders_by_status": {
      "PENDING_CONFIRMATION": 5,
      "WAITING_FOR_GOODS": 12,
      "ARRIVED": 8,
      "PAID": 18,
      "CANCELLED": 2
    },
    "total_items": 230,
    "items_by_status": {
      "con_hang": 150,
      "giu_cho": 40,
      "da_ban": 40
    },
    "new_members": 12,
    "total_points_issued": 150000
  }
}
```

---

### 13.2 Trend Report

```
GET /api/v1/reports/trends
Auth: shop_admin
Query: ?from=2026-01-01&to=2026-05-22&group_by=week
```

**Response 200:**
```json
{
  "ok": true,
  "data": [
    {
      "period": "2026-W01",
      "revenue": 2500000,
      "preorders_completed": 8,
      "new_members": 3
    }
  ]
}
```

---

## 14. Members

### 14.1 List Members

```
GET /api/v1/members
Auth: Required
Query: ?page=1&limit=20&q=<name/phone>
```

---

### 14.2 Create Member

```
POST /api/v1/members
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "full_name": "Nguyễn Văn B",
  "phone": "0901234567",
  "email": "b@example.com"
}
```

---

### 14.3 Get Member Detail

```
GET /api/v1/members/:id
Auth: Required
```

**Response 200:**
```json
{
  "ok": true,
  "data": {
    "id": "uuid",
    "full_name": "Nguyễn Văn B",
    "phone": "0901234567",
    "points_balance": 5000,
    "tier": { "name": "Silver", "rank": 2 },
    "pre_orders_count": 8,
    "total_spent": 1200000
  }
}
```

---

### 14.4 Update Member

```
PATCH /api/v1/members/:id
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

---

### 14.5 Delete Member

```
DELETE /api/v1/members/:id
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Errors:**
- `CONFLICT (409)` — thành viên còn pre-orders không ở trạng thái terminal

---

### 14.6 Get Points Ledger

```
GET /api/v1/members/:id/ledger
Auth: Required
Query: ?page=1&limit=50
```

---

### 14.7 Adjust Points

```
POST /api/v1/members/:id/points
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "delta": 500,
  "reason": "Bù điểm sự cố hệ thống",
  "note": "Ticket #1234"
}
```

---

### 14.8 List Membership Tiers

```
GET /api/v1/members/tiers
Auth: Required
```

---

### 14.9 Create Tier

```
POST /api/v1/members/tiers
Auth: shop_admin
Headers: X-CSRF-Token: <token>
```

**Request Body:**
```json
{
  "name": "Gold",
  "rank": 3,
  "min_points": 10000
}
```

---

## 15. Error Codes Reference

| Code | HTTP Status | Mô tả |
|------|------------|-------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Email hoặc password sai |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT hoặc refresh token hết hạn |
| `AUTH_FORBIDDEN` | 403 | Không có quyền thực hiện hành động |
| `VALIDATION_ERROR` | 422 | Dữ liệu request không hợp lệ |
| `NOT_FOUND` | 404 | Resource không tồn tại trong shop |
| `PUBLIC_SHOP_REQUIRED` | 422 | Thiếu shop_id cho public endpoint |
| `UPLOAD_INVALID_TYPE` | 400 | MIME type không được phép |
| `UPLOAD_TOO_LARGE` | 413 | File vượt quá MAX_UPLOAD_MB |
| `SPIN_FRAME_INDEX_CONFLICT` | 409 | frame_index đã tồn tại trong spin set |
| `ITEM_STATUS_TRANSITION_INVALID` | 422 | Vi phạm business rule về status |
| `RATE_LIMIT_EXCEEDED` | 429 | Quá nhiều request trong khoảng thời gian |
| `FACEBOOK_AUTH_ERROR` | 401 | Facebook access token không hợp lệ |
| `FACEBOOK_PUBLISH_ERROR` | 502 | Facebook Graph API trả về lỗi |
| `INTERNAL_SERVER_ERROR` | 500 | Lỗi server không mong đợi |

**Response example cho lỗi validation:**
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "quantity",
        "constraints": ["quantity must not be less than 0"]
      },
      {
        "field": "price",
        "constraints": ["price must be an integer"]
      }
    ]
  },
  "message": "Validation failed"
}
```
