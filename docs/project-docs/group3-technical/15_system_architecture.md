---
title: "Tài liệu Kiến trúc Hệ thống"
document_id: "DOC-15"
version: "1.0.0"
created_date: "2026-05-22"
author: "Tech Lead / Solution Architect"
status: "Approved"
---

# 15. System Architecture Document — Diecast360

## Mục lục
1. [Architecture Overview](#1-architecture-overview)
2. [Component Architecture](#2-component-architecture)
3. [Deployment Architecture](#3-deployment-architecture)
4. [Data Flow Diagrams](#4-data-flow-diagrams)
5. [Security Architecture](#5-security-architecture)
6. [Integration Architecture](#6-integration-architecture)
7. [Scalability Considerations](#7-scalability-considerations)
8. [Technology Decisions Rationale](#8-technology-decisions-rationale)

---

## 1. Architecture Overview

Diecast360 là một **SaaS multi-tenant platform** phục vụ các cửa hàng bán đồ chơi mô hình diecast. Hệ thống được thiết kế theo kiến trúc **layered monolith** cho backend và **SPA** cho frontend, tách biệt hoàn toàn qua REST API.

### 1.1 Layered Architecture (Backend)

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP/HTTPS Layer                       │
│              (Nginx / Cloudflare Tunnel)                  │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                  NestJS Application                       │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Middleware Layer                        │ │
│  │  Helmet | CORS | CookieParser | RateLimiter         │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               Guard Layer                           │ │
│  │  JwtAuthGuard | TenantGuard | RolesGuard | CSRF     │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │             Controller Layer                        │ │
│  │  Route handlers, DTO validation, response mapping  │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Service Layer                          │ │
│  │  Business logic, state machines, orchestration     │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌──────────────┬──────────────┬────────────────────────┐ │
│  │ PrismaService│StorageService│   External Clients     │ │
│  │  (ORM/DB)   │ (Local/R2)   │ (OpenAI/Pinecone/FB)   │ │
│  └──────────────┴──────────────┴────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼──────────────────┐
        ▼               ▼                  ▼
┌──────────────┐ ┌─────────────┐  ┌─────────────────┐
│  PostgreSQL  │ │  Local FS   │  │  Cloudflare R2  │
│ (Neon Cloud) │ │  (UPLOAD_DIR│  │  (S3-compatible)│
└──────────────┘ └─────────────┘  └─────────────────┘
```

### 1.2 High-Level System Context

```
                    ┌──────────────┐
                    │  Browser     │
                    │ (Shop Admin) │
                    └──────┬───────┘
                           │ HTTPS
                    ┌──────▼───────┐
                    │  Cloudflare  │
                    │   Pages      │
                    │  (React SPA) │
                    └──────┬───────┘
                           │ HTTPS / REST API
              ┌────────────▼─────────────┐
              │     Cloudflare Tunnel    │
              │    (HTTPS → localhost)   │
              └────────────┬─────────────┘
                           │
              ┌────────────▼─────────────┐
              │   Backend Server         │
              │  (NestJS on RPi/VPS)     │
              │  Port 3000               │
              └────────────┬─────────────┘
              ┌────────────┼──────────────────────┐
              │            │                      │
    ┌─────────▼──┐  ┌──────▼──────┐  ┌───────────▼────────┐
    │  Neon DB   │  │  Local/R2   │  │  External APIs     │
    │ PostgreSQL │  │  Storage    │  │  OpenAI / Pinecone │
    │  (Cloud)   │  │             │  │  Facebook Graph    │
    └────────────┘  └─────────────┘  └────────────────────┘
```

---

## 2. Component Architecture

### 2.1 Frontend Architecture (React 19 SPA)

```
frontend/src/
├── main.tsx                    # App entry point
├── App.tsx                     # Router setup
├── components/                 # Shared UI components
│   ├── ui/                     # Atomic: Button, Input, Modal
│   ├── layout/                 # Header, Sidebar, Layout
│   └── domain/                 # Domain-specific: ItemCard, SpinViewer
├── pages/                      # Route-level page components
│   ├── auth/                   # Login, CSRF handling
│   ├── items/                  # List, Detail, Create, Edit
│   ├── members/                # Member management
│   ├── preorders/              # Pre-order management
│   ├── inventory/              # Inventory transactions
│   ├── reports/                # Dashboard, trends
│   └── public/                 # Public catalog (shop slug)
├── hooks/                      # Custom React hooks
│   ├── useAuth.ts
│   ├── useItems.ts
│   └── useTenantScope.ts
├── services/                   # API service layer (typed)
│   ├── api.ts                  # Axios instance + interceptors
│   ├── items.service.ts
│   └── auth.service.ts
├── stores/                     # Zustand global state (auth, shop)
└── types/                      # TypeScript types / interfaces
```

**Data flow trong Frontend:**
```
User Action → React Component
           → Custom Hook (useItems, useMembers, ...)
           → TanStack Query (cache, invalidation)
           → API Service (typed axios call)
           → Backend REST API
           → Response → Envelope unwrap
           → Update UI (optimistic / server-side)
```

### 2.2 Backend Architecture (NestJS 11 Modules)

```
backend/src/
├── main.ts                     # Bootstrap, Helmet, CORS, global pipes
├── app.module.ts               # Root module
├── auth/                       # JWT auth, cookies, CSRF, refresh tokens
├── items/                      # Item CRUD, da_ban invariant
├── item-images/                # Upload, Sharp processing, cover management
├── spinner/                    # 360° spin sets + frames
├── public/                     # Public catalog (unauthenticated)
├── shops/                      # Shop CRUD (platform_super only)
├── shop-settings/              # Shop appearance, loyalty config
├── categories/                 # Category management (global + per-shop)
├── inventory/                  # Inventory transactions, reconciliation
├── preorders/                  # Pre-order state machine
├── members/                    # Member CRM, tier management
├── reports/                    # Aggregated analytics
├── ai/                         # OpenAI integration, AI drafts
├── facebook/                   # Facebook Graph API posting
├── media/                      # Signed media URL generation
├── storage/                    # Storage abstraction (Local/R2)
├── common/                     # Guards, decorators, interceptors, filters
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── tenant.guard.ts
│   │   ├── roles.guard.ts
│   │   └── csrf.guard.ts
│   ├── decorators/
│   ├── filters/                # Global exception filter
│   └── interceptors/           # Response envelope interceptor
└── prisma/                     # PrismaService, schema, migrations
```

### 2.3 Database Layer

PostgreSQL 16 trên Neon Cloud với hai connection strings:
- `DATABASE_URL`: Pooling URL (PgBouncer) — cho runtime queries
- `DIRECT_URL`: Direct URL — cho Prisma migrations

```
Neon Project
├── Main Branch (production)
│   ├── Connection pooler (port 5432 pooled)
│   └── Direct connection (port 5432 direct)
└── Dev Branch (development / migration testing)
```

### 2.4 Storage Layer

```typescript
// Storage abstraction interface
interface IStorageService {
  save(buffer: Buffer, filename: string, folder: string): Promise<string>;
  delete(filePath: string): Promise<void>;
  getSignedUrl(filePath: string, ttlSeconds: number): Promise<string>;
}

// Implementations:
// - LocalStorageService  → writes to UPLOAD_DIR on disk
// - R2StorageService     → uploads to Cloudflare R2 via S3 SDK
```

---

## 3. Deployment Architecture

### 3.1 Production Topology

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet / User                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
            ┌──────────────┴───────────────┐
            │                              │
            ▼                              ▼
┌───────────────────────┐      ┌──────────────────────┐
│   Cloudflare Pages    │      │  Cloudflare R2       │
│   (Static hosting)    │      │  (Object Storage)    │
│                       │      │                      │
│  - React 19 SPA build │      │  - Item images       │
│  - Auto CDN globally  │      │  - Spinner frames    │
│  - HTTPS by default   │      │  - Thumbnails        │
│  - Custom domain      │      │  - Signed URLs       │
└──────────┬────────────┘      └──────────────────────┘
           │ API Calls
           ▼
┌───────────────────────┐
│  Cloudflare Tunnel    │
│  (cloudflared daemon) │
│  Public HTTPS URL →   │
│  localhost:3000       │
└──────────┬────────────┘
           │
           ▼
┌───────────────────────────────────────────┐
│   Backend Server (RPi 5 / VPS)            │
│                                           │
│   ┌───────────────────────────────────┐   │
│   │  PM2 Process Manager              │   │
│   │  ├── NestJS App (port 3000)       │   │
│   │  └── Auto-restart on crash        │   │
│   └───────────────────────────────────┘   │
│                                           │
│   ┌───────────────────────────────────┐   │
│   │  Local Storage (UPLOAD_DIR)       │   │
│   │  (fallback khi STORAGE_DRIVER=    │   │
│   │   local)                          │   │
│   └───────────────────────────────────┘   │
└──────────────────┬────────────────────────┘
                   │ TLS (Neon pooler)
                   ▼
┌───────────────────────────────────────────┐
│   Neon PostgreSQL (Cloud)                 │
│                                           │
│   - Serverless autoscaling                │
│   - Connection pooling (PgBouncer)        │
│   - Automated backups                     │
│   - Branching for dev/staging             │
└───────────────────────────────────────────┘
```

### 3.2 CI/CD Pipeline

```
Developer pushes → GitHub
    │
    ├── GitHub Actions (backend)
    │   └── pnpm test → pnpm build → SSH deploy to server
    │
    └── Cloudflare Pages (frontend)
        └── Auto-build on push → pnpm build → CDN deploy
```

---

## 4. Data Flow Diagrams

### 4.1 Authentication Flow

```
Browser                  NestJS Backend              Neon DB
  │                           │                          │
  │── GET /api/v1/auth/csrf ──►│                          │
  │                           │ Generate CSRF token      │
  │◄── {csrfToken} ───────────│                          │
  │                           │                          │
  │── POST /api/v1/auth/login ►│                          │
  │   Body: {email, password} │                          │
  │   Header: X-CSRF-Token    │                          │
  │                           │── SELECT user WHERE ────►│
  │                           │   email = $1             │
  │                           │◄── user row ─────────────│
  │                           │ bcrypt.compare(password) │
  │                           │ Sign JWT (15m)           │
  │                           │ Create refresh token (7d)│
  │                           │── INSERT refresh_tokens ►│
  │◄── 200 {ok,data:{me}} ────│                          │
  │    Set-Cookie: access_token (HttpOnly, Secure)       │
  │    Set-Cookie: refresh_token (HttpOnly, Secure)      │
  │                           │                          │
  │   [Subsequent requests]   │                          │
  │── GET /api/v1/items ──────►│                          │
  │   Cookie: access_token    │                          │
  │                           │ JwtAuthGuard: verify JWT │
  │                           │ TenantGuard: set shop_id │
  │◄── 200 {ok, data} ────────│                          │
```

### 4.2 Image Upload Flow

```
Browser           NestJS Backend         Sharp        Storage      Neon DB
  │                    │                   │              │            │
  │─POST /item-images──►│                  │              │            │
  │  multipart/form-data│                  │              │            │
  │  field: file        │                  │              │            │
  │                    │ JwtAuthGuard ✓    │              │            │
  │                    │ TenantGuard ✓     │              │            │
  │                    │ Validate MIME     │              │            │
  │                    │ Validate size     │              │            │
  │                    │──resize(800x600)──►│             │            │
  │                    │                   │             │            │
  │                    │──thumbnail(200x150)►            │            │
  │                    │◄──processed buffers─┤            │            │
  │                    │                               │            │
  │                    │──save(fullBuffer)─────────────►│            │
  │                    │──save(thumbBuffer)────────────►│            │
  │                    │◄──{filePath, thumbPath}────────│            │
  │                    │                               │            │
  │                    │──INSERT item_images──────────────────────►│
  │                    │◄──{id, ...}──────────────────────────────│
  │◄──200 {ok, data}───│                                           │
```

### 4.3 Public Catalog Flow

```
Anonymous Browser     NestJS Backend (PublicModule)      Neon DB
      │                          │                          │
      │─ GET /api/v1/public/items?shop_id=xxx ──────────────►│
      │  (No auth required)      │                          │
      │                          │ Validate shop_id param   │
      │                          │── SELECT shops WHERE ───►│
      │                          │   id=$1 AND is_active=true│
      │                          │◄── shop row ─────────────│
      │                          │                          │
      │                          │── SELECT items WHERE ───►│
      │                          │   shop_id=$1             │
      │                          │   AND is_public=true     │
      │                          │   AND status != 'da_ban' │
      │                          │   AND deleted_at IS NULL │
      │                          │   ORDER BY created_at DESC│
      │                          │   LIMIT/OFFSET           │
      │                          │◄── items[] ──────────────│
      │                          │                          │
      │                          │ Map to public DTO        │
      │                          │ (exclude internal fields)│
      │◄── 200 {ok, data, meta} ─│                          │
```

### 4.4 Pre-Order Status Transition Flow

```
Admin Browser         NestJS Backend              Neon DB
     │                      │                        │
     │─PATCH /preorders/:id/status ──────────────────►│ (check current status)
     │  {status: "WAITING_FOR_GOODS"}                │
     │                      │ Validate transition     │
     │                      │ (state machine check)  │
     │                      │── BEGIN TRANSACTION ───►│
     │                      │── UPDATE pre_orders ───►│
     │                      │   SET status=$1         │
     │                      │◄── updated row ─────────│
     │                      │                         │
     │                      │ [if PAID → earn points] │
     │                      │── INSERT member_points ─►│
     │                      │   _ledger               │
     │                      │── UPDATE members        ►│
     │                      │   SET points_balance    │
     │                      │── COMMIT ───────────────►│
     │◄──200 {ok, data} ────│                         │
```

---

## 5. Security Architecture

### 5.1 Defense in Depth Layers

```
Layer 1: Network
  - HTTPS mandatory (Cloudflare Tunnel cung cấp TLS termination)
  - CORS whitelist: chỉ FRONTEND_URL được phép

Layer 2: Application (Middleware)
  - Helmet.js: HTTP security headers (CSP, HSTS, X-Frame-Options)
  - Rate limiting: throttle per IP (configurable per endpoint)
  - Request size limits: MAX_UPLOAD_MB cho file uploads

Layer 3: Authentication
  - JWT access token (15m expiry) trong HttpOnly cookie
  - Refresh token (7d) trong HttpOnly cookie riêng biệt
  - Token hash lưu DB để enable revocation
  - CSRF double-submit: X-CSRF-Token header so với signed cookie

Layer 4: Authorization
  - JwtAuthGuard: verify JWT trên tất cả protected routes
  - TenantGuard: inject active_shop_id, enforce shop scoping
  - RolesGuard: kiểm tra platform_role hoặc user_shop_roles
  - shop_staff: read-only → 403 trên POST/PATCH/DELETE

Layer 5: Data Access
  - Prisma ORM: parameterized queries, không raw SQL injection
  - Mọi query có thể được tenant-scoped đều PHẢI có WHERE shop_id = $active
  - Soft delete: deleted_at IS NULL filter tự động

Layer 6: Storage
  - Media URLs signed với TTL (không public direct access)
  - File type validation: ALLOWED_MIME whitelist
  - File size validation: MAX_UPLOAD_MB
```

### 5.2 Cookie Security Configuration

```typescript
// Cấu hình cookie production
{
  httpOnly: true,          // Không accessible qua JS
  secure: true,            // Chỉ HTTPS (COOKIE_SECURE=true)
  sameSite: 'strict',      // CSRF protection bổ sung (COOKIE_SAME_SITE)
  signed: true,            // Cookie signing với COOKIE_SECRET
  maxAge: 15 * 60 * 1000  // access_token: 15 phút
}
```

### 5.3 RBAC Matrix

| Role | Platform Admin | Shop CRUD | Item CRUD | Member Read | Member Write | Reports |
|------|---------------|-----------|-----------|-------------|--------------|---------|
| `platform_super` | ✅ | ✅ | ✅ (any shop) | ✅ | ✅ | ✅ |
| `shop_admin` | ❌ | ❌ (own shop only) | ✅ | ✅ | ✅ | ✅ |
| `shop_staff` | ❌ | ❌ | Read only | ✅ | ❌ | ✅ |
| Anonymous | ❌ | ❌ | Public only | ❌ | ❌ | ❌ |

---

## 6. Integration Architecture

### 6.1 OpenAI Integration

```
AI Module (backend/src/ai/)
  │
  ├── POST /api/v1/ai/ai-description
  │   1. Nhận item images (URLs hoặc base64)
  │   2. Gửi GPT-4 Vision request với system prompt
  │   3. Parse JSON response → AiItemDraft record
  │   4. Trả về draft để admin confirm/reject
  │
  └── POST /api/v1/ai/fb-post
      1. Nhận item data
      2. Gửi GPT request với Facebook post template
      3. Trả về generated post content
```

### 6.2 Pinecone Vector Search Integration

```
Vector Sync Flow:
  Item Created/Updated
       │
       ▼
  vector_sync_tasks (queue)
       │
       ▼
  Background worker (cron)
       │
       ├── Fetch item data
       ├── Generate embedding (OpenAI Embeddings API)
       └── Upsert to Pinecone index
           (namespace = shop_id)

Search Flow:
  POST /api/v1/ai/search
       │
       ├── Generate query embedding
       ├── Query Pinecone (filter: shop_id)
       └── Fetch matching items from DB
```

### 6.3 Facebook Graph API Integration

```
Facebook Module (backend/src/facebook/)
  │
  └── POST /api/v1/items/:id/facebook-posts
      1. Validate FACEBOOK_PAGE_ACCESS_TOKEN
      2. Upload images to Facebook (if any)
      3. POST /page-id/feed với content + photos
      4. Nhận post_id từ Graph API response
      5. INSERT facebook_posts record
      6. Trả về post URL
```

### 6.4 Cloudflare R2 Integration

```
R2StorageService implements IStorageService
  │
  ├── SDK: @aws-sdk/client-s3 (S3-compatible API)
  ├── Endpoint: https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com
  ├── Bucket: R2_BUCKET
  │
  ├── save()    → PutObjectCommand
  ├── delete()  → DeleteObjectCommand
  └── getSignedUrl() → getSignedUrl(GetObjectCommand, {expiresIn})
```

---

## 7. Scalability Considerations

### 7.1 Current Architecture Limits

| Component | Current Limit | Bottleneck |
|-----------|--------------|------------|
| Backend | Single process (PM2) | CPU-bound image processing |
| Database | Neon serverless pool | Cold start latency |
| Storage | Local FS hoặc R2 | Local FS không scale horizontally |
| Frontend | Cloudflare CDN | N/A (CDN scales automatically) |

### 7.2 Scaling Path

**Short term (current stage):**
- PM2 cluster mode (multi-core trên RPi 5 hoặc VPS)
- Sharp concurrency giới hạn để tránh OOM
- TanStack Query caching giảm API calls

**Medium term:**
- Migrate hoàn toàn sang R2 storage (không còn Local FS)
- Read replicas Neon cho reporting queries
- Redis cho session cache và rate limiting distributed

**Long term:**
- Tách image processing thành worker service riêng
- Queue-based processing (BullMQ) cho upload và AI tasks
- Multi-region deployment với Cloudflare Workers

### 7.3 Database Connection Strategy

```
Application (Runtime)    → DATABASE_URL (Neon Pooler - PgBouncer)
  - Max pool: 10 connections
  - Transaction pooling mode

Prisma Migrations         → DIRECT_URL (Neon Direct)
  - Bypass pooler (DDL statements không qua pooler)
  - Chỉ dùng trong migrate deploy
```

---

## 8. Technology Decisions Rationale

| Decision | Chosen | Alternatives Considered | Key Reason |
|----------|--------|------------------------|------------|
| Backend Framework | NestJS 11 | Express, Fastify, Hono | TypeScript-first, DI container, Guards phù hợp RBAC |
| ORM | Prisma 6 | TypeORM, Sequelize | Type safety, migration tooling, schema-first |
| Database | PostgreSQL 16 | MySQL, MongoDB | JSONB, UUID native, ENUM types, Neon cloud support |
| Frontend | React 19 | Vue 3, Svelte | Ecosystem, team familiarity, TanStack support |
| Build tool | Vite 7 | Webpack, CRA | HMR tốc độ, ESM native |
| State/Fetch | TanStack Query | SWR, RTK Query | Server state management, invalidation patterns |
| CSS | Tailwind CSS 3 | CSS Modules, MUI | Utility-first, không cần custom design system |
| Storage | Cloudflare R2 | AWS S3, local only | Zero egress fees, S3-compatible, giá rẻ |
| Cloud DB | Neon | RDS, Supabase | Serverless autoscaling, branching, free tier |
| Image | Sharp | Jimp, canvas | Native bindings, hiệu năng cao, WebP support |

Chi tiết đầy đủ cho từng quyết định xem tại [`21_tech_stack_justification.md`](21_tech_stack_justification.md).
