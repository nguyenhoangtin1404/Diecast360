# Tech Stack Justification Document — Diecast360

---
**Version:** 1.0
**Ngày tạo:** 2026-05-22
**Người tạo:** Tech Lead
**Dự án:** Diecast360

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Backend Framework — NestJS 11](#2-backend-framework--nestjs-11)
3. [ORM — Prisma 6](#3-orm--prisma-6)
4. [Database — PostgreSQL 16](#4-database--postgresql-16)
5. [Managed DB — Neon PostgreSQL](#5-managed-db--neon-postgresql)
6. [Frontend Framework — React 19](#6-frontend-framework--react-19)
7. [Build Tool — Vite 7](#7-build-tool--vite-7)
8. [Data Fetching — TanStack Query](#8-data-fetching--tanstack-query)
9. [CSS Framework — Tailwind CSS 3](#9-css-framework--tailwind-css-3)
10. [Object Storage — Cloudflare R2](#10-object-storage--cloudflare-r2)
11. [Image Processing — Sharp](#11-image-processing--sharp)
12. [AI — OpenAI API + Pinecone](#12-ai--openai-api--pinecone)
13. [Package Manager — pnpm + Monorepo](#13-package-manager--pnpm--monorepo)
14. [Auth — JWT + HttpOnly Cookie + CSRF](#14-auth--jwt--httponly-cookie--csrf)
15. [Ma trận quyết định tổng hợp](#15-ma-trận-quyết-định-tổng-hợp)

---

## 1. Tổng quan

Tài liệu này ghi lại lý do lựa chọn từng công nghệ trong tech stack của Diecast360, các phương án thay thế đã cân nhắc, và trade-offs được chấp nhận. Mục tiêu là giúp team hiểu tại sao stack hiện tại được chọn, từ đó đưa ra quyết định hợp lý khi cần mở rộng hoặc thay thế.

### Nguyên tắc lựa chọn công nghệ

1. **Phù hợp với quy mô team** — 10 người, đa số fullstack, không cần over-engineering.
2. **DX (Developer Experience) tốt** — TypeScript end-to-end, type safety, tooling mạnh.
3. **Chi phí vận hành thấp** — self-host được, tránh vendor lock-in đắt tiền.
4. **Tài liệu tốt + ecosystem lớn** — dễ onboard thành viên mới, nhiều giải pháp khi gặp vấn đề.
5. **Production-ready** — đã được kiểm chứng ở nhiều dự án thương mại.

---

## 2. Backend Framework — NestJS 11

### Lý do chọn

| Tiêu chí | NestJS 11 | Express | Fastify | Hono |
|---------|-----------|---------|---------|------|
| TypeScript native | ✅ First-class | ⚠️ Manual setup | ⚠️ Partial | ✅ Good |
| Dependency Injection | ✅ Built-in IoC | ❌ Không có | ❌ Không có | ❌ Không có |
| Module system | ✅ Rõ ràng | ❌ Tự tổ chức | ❌ Tự tổ chức | ❌ Tự tổ chức |
| Guards/Interceptors | ✅ Built-in | ❌ Middleware only | ❌ Middleware only | ⚠️ Basic |
| Swagger/OpenAPI | ✅ @nestjs/swagger | ⚠️ Manual | ⚠️ Plugin | ❌ |
| Performance | ⚠️ Overhead nhẹ | ✅ Nhanh | ✅ Rất nhanh | ✅ Rất nhanh |
| Ecosystem | ✅ Lớn | ✅ Khổng lồ | ✅ Lớn | ⚠️ Nhỏ |
| Learning curve | ⚠️ Dốc | ✅ Thoải | ✅ Thoải | ✅ Thoải |

**Lý do quyết định:**
- **Dependency Injection + Module system** giúp tổ chức 12+ module (auth, items, spinner, preorders, members...) rõ ràng, dễ test.
- **Guards built-in** cho phép implement `JwtAuthGuard`, `TenantGuard`, `RolesGuard` đơn giản, tái sử dụng qua decorator.
- **TypeScript first-class** — toàn bộ codebase type-safe end-to-end với Prisma.
- **Performance overhead nhẹ** chấp nhận được vì bottleneck thực tế là I/O (DB, storage, AI), không phải framework overhead.

**Trade-offs chấp nhận:**
- NestJS có boilerplate nhiều hơn Express/Fastify.
- Cold start chậm hơn (quan trọng với serverless, nhưng ta self-host nên không ảnh hưởng).

---

## 3. ORM — Prisma 6

### Lý do chọn

| Tiêu chí | Prisma 6 | TypeORM | Sequelize | Drizzle | Raw SQL |
|---------|----------|---------|---------|---------|---------|
| Type safety | ✅ Xuất sắc | ⚠️ Partial | ❌ Yếu | ✅ Tốt | ❌ Không có |
| Schema migration | ✅ Declarative | ⚠️ Manual/auto | ⚠️ Manual | ✅ SQL-first | ❌ Manual |
| DX / ergonomics | ✅ Xuất sắc | ⚠️ Verbose | ⚠️ Old API | ✅ Tốt | ❌ Tedious |
| Relations | ✅ Intuitive | ✅ ORM style | ✅ ORM style | ⚠️ Verbose | ❌ Manual |
| JSONB support | ✅ Native | ⚠️ Limited | ⚠️ Limited | ✅ Native | ✅ |
| Generated client | ✅ Auto-typed | ❌ | ❌ | ❌ | ❌ |
| Maturity | ✅ v5+ stable | ✅ Lâu đời | ✅ Lâu đời | ⚠️ Tương đối mới | N/A |

**Lý do quyết định:**
- **Generated Prisma Client** với full TypeScript types từ schema — không cần viết interface entity thủ công.
- **Prisma Schema** là source of truth duy nhất: schema → migration → client types đồng nhất.
- **Migration system** rõ ràng, có thể review diff, không ambiguous như TypeORM sync mode.
- **JSONB support** tốt cho `attributes`, `contact_json`, `appearance_json`, `loyalty_json`.
- **`DATABASE_URL` / `DIRECT_URL` separation** hỗ trợ Neon pooler (pgBouncer) chuẩn.

**Trade-offs chấp nhận:**
- Không hỗ trợ complex raw relations bằng TypeORM ActiveRecord pattern — dùng `$queryRaw` khi cần.
- Prisma client generated code khá lớn, nhưng không ảnh hưởng production bundle (server-side).

---

## 4. Database — PostgreSQL 16

### Lý do chọn

| Tiêu chí | PostgreSQL 16 | MySQL 8 | MongoDB | SQLite |
|---------|--------------|---------|---------|--------|
| JSONB native | ✅ Tốt nhất | ⚠️ JSON basic | ✅ Native | ⚠️ Limited |
| UUID native | ✅ | ⚠️ VARCHAR | ✅ ObjectID | ⚠️ TEXT |
| ACID transactions | ✅ Full | ✅ Full | ⚠️ Limited | ✅ Full |
| Enum types | ✅ Native | ⚠️ ENUM | ❌ | ❌ |
| Full-text search | ✅ Built-in | ⚠️ Limited | ✅ Atlas search | ⚠️ Basic |
| Prisma support | ✅ First-class | ✅ | ✅ | ✅ |
| Scalability | ✅ Horizontal | ✅ | ✅ Horizontal | ❌ Single file |
| Managed options | ✅ Neon/Supabase/RDS | ✅ PlanetScale/RDS | ✅ Atlas | ❌ |

**Lý do quyết định:**
- **JSONB** cho `attributes` (item custom fields), `contact_json`, `appearance_json`, `loyalty_json` — query được, index được.
- **Native UUID** và **Enum types** cho code sạch, không cần convert.
- **Multi-tenant model** với row-level `shop_id` filtering tận dụng tốt PostgreSQL partial indexes.
- **Neon** (managed PostgreSQL) là first-class choice cho serverless/edge deployments.
- **Prisma support** tốt nhất cho PostgreSQL.

**Trade-offs chấp nhận:**
- RAM footprint lớn hơn MySQL/SQLite (~200-400MB) — giải quyết bằng memory limit trên low-RAM hosts.
- Single PostgreSQL instance là SPOF — mitigated bởi Neon managed HA.

---

## 5. Managed DB — Neon PostgreSQL

### Lý do chọn

| Tiêu chí | Neon | Supabase | PlanetScale | AWS RDS | Fly.io Postgres |
|---------|------|---------|------------|---------|----------------|
| PostgreSQL compatibility | ✅ Full | ✅ Full | ❌ MySQL | ✅ Full | ✅ Full |
| Free tier | ✅ Generous | ✅ | ✅ | ❌ | ✅ |
| Branching (DB branches) | ✅ Native | ❌ | ✅ | ❌ | ❌ |
| Serverless scaling | ✅ | ⚠️ | ✅ | ❌ | ❌ |
| Pooler (pgBouncer) | ✅ Built-in | ✅ | N/A | ❌ | ❌ |
| ap-southeast-1 region | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Prisma native support | ✅ Documented | ✅ | ✅ | ✅ | ✅ |
| Cost (production) | ✅ Thấp | ✅ | ✅ | ❌ Cao | ✅ |

**Lý do quyết định:**
- **Serverless PostgreSQL** — không trả tiền idle, phù hợp traffic pattern của shop diecast (không đều).
- **Database branching** — tạo staging DB riêng từ production snapshot dễ dàng.
- **Built-in pooler** — `DATABASE_URL` dùng pooler, `DIRECT_URL` dùng direct connection cho Prisma migrate.
- **ap-southeast-1** — region gần Việt Nam, latency tốt.

**Trade-offs chấp nhận:**
- Cold start khi DB serverless wakeup (~500ms lần đầu sau idle) — mitigated bởi health check polling.
- Vendor lock-in nhẹ (Neon-specific branching feature) — nhưng vẫn standard PostgreSQL, migrate được.

---

## 6. Frontend Framework — React 19

### Lý do chọn

| Tiêu chí | React 19 | Vue 3 | Angular 17 | Svelte 5 |
|---------|----------|-------|-----------|---------|
| Ecosystem size | ✅ Lớn nhất | ✅ Lớn | ✅ Lớn | ⚠️ Vừa |
| TypeScript | ✅ Excellent | ✅ Good | ✅ Native | ✅ Good |
| Component model | ✅ Hooks | ✅ Composition API | ⚠️ Complex | ✅ Reactive |
| Team familiarity | ✅ Cao nhất | ⚠️ | ❌ | ❌ |
| TanStack Query support | ✅ First-class | ✅ | ✅ | ✅ |
| SSR option | ✅ Next.js | ✅ Nuxt | ✅ | ✅ SvelteKit |
| Bundle size | ⚠️ Trung bình | ✅ Nhỏ hơn | ❌ Lớn | ✅ Nhỏ nhất |
| Learning resources | ✅ Phong phú nhất | ✅ | ✅ | ⚠️ |

**Lý do quyết định:**
- **Team familiarity** — toàn bộ frontend dev quen React, giảm ramp-up.
- **Ecosystem** — thư viện drag-drop, file upload, image gallery đều có React wrapper tốt.
- **React 19 features** — `use()` hook, improved transitions, better server components support.
- **TanStack Query** — first-class React support, là lựa chọn tự nhiên.

**Trade-offs chấp nhận:**
- Bundle size lớn hơn Svelte/Vue — chấp nhận được vì app là B2B admin + catalog, không phải landing page.
- Không dùng SSR (SPA only) — SEO không phải priority cho admin panel; public catalog có thể bổ sung sau.

---

## 7. Build Tool — Vite 7

### Lý do chọn

| Tiêu chí | Vite 7 | Webpack 5 | CRA | Parcel |
|---------|--------|---------|-----|--------|
| Dev server speed | ✅ Rất nhanh (ESM) | ❌ Chậm | ❌ Chậm | ✅ Nhanh |
| HMR | ✅ Instant | ⚠️ Chậm | ⚠️ Chậm | ✅ Tốt |
| Config đơn giản | ✅ | ❌ Phức tạp | ✅ (nhưng eject = hell) | ✅ |
| Plugin ecosystem | ✅ Vite plugins + Rollup | ✅ Webpack plugins | ❌ Locked | ⚠️ |
| TypeScript | ✅ Native | ⚠️ Loader cần | ✅ | ✅ |
| Env variables | ✅ `VITE_*` pattern | ⚠️ `process.env` | ✅ `REACT_APP_*` | ✅ |
| Production build | ✅ Rollup (tối ưu) | ✅ | ✅ | ✅ |

**Lý do quyết định:**
- **Dev server tức thì** — ESM native, không bundle lại toàn bộ app khi save file.
- **`VITE_*` env pattern** sạch và rõ ràng, không lẫn với Node.js env.
- **Proxy config** đơn giản — dev proxy `/api` → `localhost:3000` không cần CORS setup phức tạp.
- **Community + Tailwind CSS** — tích hợp plugin Tailwind trong Vite cực đơn giản.

---

## 8. Data Fetching — TanStack Query

### Lý do chọn

| Tiêu chí | TanStack Query v5 | SWR | Redux RTK Query | Apollo (nếu GraphQL) |
|---------|------------------|-----|----------------|---------------------|
| Caching | ✅ Sophisticated | ✅ Simple | ✅ Good | ✅ |
| Background refetch | ✅ | ✅ | ✅ | ✅ |
| Mutation + invalidation | ✅ Excellent | ⚠️ Manual | ✅ | ✅ |
| Pagination | ✅ Built-in | ⚠️ Manual | ✅ | ✅ |
| Optimistic updates | ✅ | ⚠️ | ✅ | ✅ |
| DevTools | ✅ Excellent | ❌ | ✅ | ✅ |
| Bundle size | ⚠️ ~13KB | ✅ ~4KB | ⚠️ + Redux | ❌ Lớn |
| TypeScript | ✅ Excellent | ✅ Good | ✅ Good | ✅ |

**Lý do quyết định:**
- **Cache invalidation pattern** rõ ràng — `queryKey: ['items', shopId]`, sau mutation `invalidateQueries(['items'])`.
- **Pagination built-in** — `keepPreviousData` cho trải nghiệm smooth khi phân trang.
- **Mutation hooks** với `onSuccess`/`onError` callbacks quản lý side effects sạch.
- **DevTools** giúp debug cache state trong development rất hiệu quả.
- Không cần Redux store riêng cho server state — giảm boilerplate đáng kể.

---

## 9. CSS Framework — Tailwind CSS 3

### Lý do chọn

| Tiêu chí | Tailwind CSS 3 | CSS Modules | Styled Components | MUI/Ant Design |
|---------|---------------|------------|------------------|---------------|
| Bundle size (prod) | ✅ PurgeCSS tiny | ✅ Nhỏ | ⚠️ Runtime overhead | ❌ Lớn |
| Customization | ✅ Hoàn toàn | ✅ | ✅ | ⚠️ Override khó |
| DX / speed | ✅ Rất nhanh | ⚠️ Chậm hơn | ⚠️ | ✅ |
| Design system | ✅ Sẵn có scale | ❌ Tự xây | ❌ Tự xây | ✅ Built-in |
| Responsive | ✅ `sm:md:lg:` | ⚠️ Media query | ✅ | ✅ |
| Dark mode | ✅ `dark:` class | ⚠️ | ✅ | ✅ |
| Component library | ⚠️ Cần tự xây | ❌ | ❌ | ✅ Sẵn |

**Lý do quyết định:**
- **Utility-first** cho phép design trực tiếp trong JSX, không context-switch sang CSS file.
- **Design tokens built-in** — spacing, color, typography scale nhất quán mà không cần thiết kế từ đầu.
- **PurgeCSS** — production bundle CSS rất nhỏ (chỉ giữ classes thực sự dùng).
- **Responsive prefix** (`sm:`, `md:`, `lg:`) trực quan, không cần nhớ media query syntax.
- **Không dùng MUI/Ant Design** vì: (1) override style khó, (2) bundle lớn, (3) opinionated design khó match brand.

**Trade-offs chấp nhận:**
- Không có component library sẵn → phải tự xây Design System (đã có doc #23).
- Class names dài trong JSX — chấp nhận được, có thể dùng `cn()` utility để gộp.

---

## 10. Object Storage — Cloudflare R2

### Lý do chọn

| Tiêu chí | Cloudflare R2 | AWS S3 | Local storage | Backblaze B2 |
|---------|--------------|-------|--------------|-------------|
| Egress cost | ✅ $0 (free egress) | ❌ $0.09/GB | ✅ $0 | ✅ $0.01/GB |
| S3-compatible API | ✅ | ✅ Native | ❌ | ✅ |
| CDN integration | ✅ Cloudflare CDN | ⚠️ CloudFront extra | ❌ | ❌ |
| Free tier | ✅ 10GB/month | ⚠️ 5GB limited | ✅ Unlimited | ✅ 10GB |
| Latency (SEA) | ✅ Cloudflare edge | ⚠️ ap-southeast region | ✅ Local | ⚠️ US-based |
| Presigned URLs | ✅ | ✅ | N/A | ✅ |
| Setup complexity | ✅ Đơn giản | ⚠️ IAM phức tạp | ✅ Trivial | ✅ |

**Lý do quyết định:**
- **Zero egress fees** — critical cho media-heavy app với spinner frames (24-48 ảnh/item).
- **S3-compatible API** → dùng `@aws-sdk/client-s3` không cần SDK riêng.
- **Cloudflare network** — latency tốt cho user Việt Nam qua Cloudflare edge.
- **Storage abstraction** — code dùng interface `StorageService`, dễ swap giữa `LocalStorage` ↔ `R2StorageService`.

**Trade-offs chấp nhận:**
- Cloudflare vendor lock-in — nhưng S3-compatible, migrate sang S3/B2 dễ dàng nếu cần.
- Presigned URL TTL — client cần refetch khi ảnh hết hạn (đã handle bằng `MEDIA_URL_TTL_MS`).

---

## 11. Image Processing — Sharp

### Lý do chọn

| Tiêu chí | Sharp | Jimp | Canvas | Imagemagick |
|---------|-------|------|--------|------------|
| Performance | ✅ Rất nhanh (libvips) | ❌ Chậm (pure JS) | ⚠️ | ✅ Tốt |
| Memory efficiency | ✅ Streaming | ❌ Load toàn bộ | ⚠️ | ✅ |
| Thumbnail generation | ✅ | ✅ | ✅ | ✅ |
| WebP output | ✅ | ⚠️ | ✅ | ✅ |
| Node.js native | ✅ | ✅ | ✅ | ❌ Binary |
| Low-RAM compat | ✅ `cache(false)` | ❌ | ⚠️ | ✅ |

**Lý do quyết định:**
- **Tốc độ** — libvips nhanh hơn Jimp 4-5x, quan trọng khi upload 48 spinner frames.
- **Streaming** — không load toàn bộ ảnh vào memory, critical trên Raspberry Pi (512MB RAM limit).
- **Config cho low-RAM**: `Sharp.cache(false)`, `Sharp.concurrency(1)` giảm OOM risk.

---

## 12. AI — OpenAI API + Pinecone

### Lý do chọn

**OpenAI API:**

| Tiêu chí | OpenAI GPT-4o | Gemini Pro | Claude API | Local LLM |
|---------|--------------|-----------|-----------|---------|
| Vision (image analysis) | ✅ GPT-4o | ✅ | ✅ | ⚠️ Hạn chế |
| Text generation quality | ✅ Tốt nhất | ✅ Tốt | ✅ Tốt | ⚠️ |
| API stability | ✅ | ✅ | ✅ | N/A |
| Cost | ⚠️ | ✅ Rẻ hơn | ✅ | ✅ Free |
| Vietnamese language | ✅ | ✅ | ✅ | ⚠️ |
| Team experience | ✅ Cao | ⚠️ | ⚠️ | ❌ |

**Pinecone (Vector Search):**

| Tiêu chí | Pinecone | pgvector | Weaviate | Qdrant |
|---------|---------|---------|---------|--------|
| Managed service | ✅ | ❌ Self-host | ✅ | ✅ |
| Free tier | ✅ | N/A | ✅ | ✅ |
| Performance | ✅ | ⚠️ | ✅ | ✅ |
| Node.js SDK | ✅ | ✅ psql driver | ✅ | ✅ |
| Setup complexity | ✅ Đơn giản | ⚠️ Extension | ⚠️ | ⚠️ |

**Lý do quyết định:**
- **OpenAI GPT-4o** — multimodal vision để phân tích ảnh diecast tạo AiItemDraft, sinh mô tả tiếng Việt tốt.
- **Pinecone** — managed, free tier đủ cho quy mô hiện tại, SDK đơn giản, không cần manage infrastructure.
- **Cả hai đều optional** — khi không cấu hình API key, feature AI/vector search gracefully disabled.

---

## 13. Package Manager — pnpm + Monorepo

### Lý do chọn

| Tiêu chí | pnpm | npm | yarn | turborepo |
|---------|------|-----|------|---------|
| Disk space | ✅ Content-addressable store | ❌ Duplicate | ⚠️ | N/A |
| Speed | ✅ Nhanh | ⚠️ | ✅ | N/A |
| Workspace support | ✅ Native | ✅ | ✅ | ✅ (trên pnpm) |
| Hoisting behavior | ✅ Strict | ⚠️ Phantom deps | ⚠️ | N/A |
| Lockfile | ✅ Deterministic | ✅ | ✅ | N/A |

**Lý do chọn monorepo (single repo, 2 packages):**
- **Shared types** — `@diecast360/types` package (nếu cần) chia sẻ type giữa backend/frontend.
- **Single git history** — dễ xem change liên quan giữa backend/frontend.
- **Atomic commits** — thay đổi API + frontend update trong 1 commit.

---

## 14. Auth — JWT + HttpOnly Cookie + CSRF

### Lý do chọn

| Tiêu chí | JWT Cookie | JWT localStorage | Session (DB) | OAuth only |
|---------|-----------|-----------------|-------------|-----------|
| XSS protection | ✅ JS không đọc được | ❌ Bị đánh cắp | ✅ | ✅ |
| CSRF risk | ⚠️ Cần mitigate | ✅ Không có | ⚠️ | N/A |
| Stateless | ✅ | ✅ | ❌ DB per request | N/A |
| Revocation | ✅ Refresh token table | ⚠️ Khó | ✅ | ✅ |
| Mobile/API support | ✅ Bearer fallback | ✅ | ⚠️ | ⚠️ |
| Complexity | ⚠️ CSRF + refresh | ✅ Đơn giản | ⚠️ | ✅ |

**Lý do quyết định:**
- **HttpOnly Cookie** — JavaScript không đọc được cookie, ngăn XSS token theft.
- **CSRF double-submit** — mitigate CSRF mà không cần server-side session state.
- **Refresh token table** — revocation support (logout all devices, block compromised tokens).
- **Bearer fallback** — hỗ trợ mobile app hoặc API client trong tương lai mà không refactor.

---

## 15. Ma trận quyết định tổng hợp

| Hạng mục | Lựa chọn | Điểm mạnh chính | Trade-off chính |
|---------|---------|----------------|----------------|
| Backend framework | NestJS 11 | DI, modules, guards | Boilerplate nhiều hơn Express |
| ORM | Prisma 6 | Type-safe client, declarative schema | Generated client lớn |
| Database | PostgreSQL 16 | JSONB, UUID, enum native | RAM footprint |
| Managed DB | Neon | Zero-egress, branching, pooler | Cold start |
| Frontend | React 19 | Ecosystem, team familiarity | Bundle size |
| Build tool | Vite 7 | Dev speed, HMR | - |
| Data fetching | TanStack Query | Cache, mutations | 13KB bundle |
| CSS | Tailwind CSS 3 | Utility-first, tiny prod | No component library |
| Object storage | Cloudflare R2 | Zero egress, S3 compat | Vendor lock-in nhẹ |
| Image processing | Sharp | Speed, memory-efficient | Native binary build |
| AI | OpenAI + Pinecone | Quality, managed | Cost, optional |
| Package manager | pnpm monorepo | Disk, speed, workspace | Learning curve nhẹ |
| Auth | JWT + Cookie + CSRF | XSS safe, revocable | Complexity |

---

*Tài liệu này cần được review và cập nhật khi có quyết định thay đổi công nghệ quan trọng.*
