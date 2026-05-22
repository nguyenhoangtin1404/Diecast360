---
title: "Tài liệu Đặc tả Kỹ thuật"
document_id: "DOC-16"
version: "1.0.0"
created_date: "2026-05-22"
author: "Tech Lead / Solution Architect"
status: "Approved"
---

# 16. Technical Specification Document — Diecast360

## Mục lục
1. [Backend Modules Chi tiết](#1-backend-modules-chi-tiết)
2. [Data Processing Pipeline](#2-data-processing-pipeline)
3. [Caching Strategy](#3-caching-strategy)
4. [Security Implementation](#4-security-implementation)
5. [Error Handling Implementation](#5-error-handling-implementation)
6. [Performance Considerations](#6-performance-considerations)
7. [API Versioning Strategy](#7-api-versioning-strategy)

---

## 1. Backend Modules Chi tiết

### 1.1 Auth Module (`backend/src/auth/`)

**Trách nhiệm:** Quản lý xác thực người dùng, JWT lifecycle, CSRF tokens, refresh token rotation.

**Endpoints:**
- `GET /api/v1/auth/csrf` — Phát CSRF token (signed cookie + response body)
- `POST /api/v1/auth/login` — Đăng nhập, phát JWT + refresh token cookies
- `POST /api/v1/auth/refresh` — Đổi refresh token lấy access token mới
- `POST /api/v1/auth/logout` — Revoke refresh token, clear cookies
- `GET /api/v1/auth/me` — Trả thông tin user hiện tại
- `POST /api/v1/auth/switch-shop` — Đổi active shop (cập nhật JWT payload)

**Key Service Methods:**
```typescript
class AuthService {
  async login(email: string, password: string): Promise<TokenPair>
  async refresh(refreshTokenRaw: string): Promise<TokenPair>
  async logout(userId: string, refreshTokenRaw: string): Promise<void>
  async generateCsrfToken(): Promise<string>
  async switchShop(userId: string, shopId: string): Promise<TokenPair>
  private async issueTokenPair(user: User, activeShopId?: string): Promise<TokenPair>
  private async hashToken(token: string): Promise<string>
}
```

**JWT Payload Structure:**
```typescript
interface JwtPayload {
  sub: string;           // user.id (UUID)
  email: string;
  role: UserRole;        // 'shop_admin' | 'shop_staff'
  platformRole: PlatformRole | null; // 'platform_super' | null
  activeShopId: string | null;
  iat: number;
  exp: number;
}
```

**Refresh Token Strategy:**
- Token lưu dạng hash (SHA-256) trong DB — raw token chỉ gửi qua cookie
- Rotation: mỗi lần refresh, token cũ bị revoke, token mới được tạo
- Revocation: `revoked_at` timestamp — không xóa record để audit trail

---

### 1.2 Items Module (`backend/src/items/`)

**Trách nhiệm:** CRUD cho sản phẩm diecast, quản lý trạng thái, tích hợp Facebook post.

**Business Rules quan trọng:**
- `status = 'da_ban'` → `quantity` PHẢI bằng `0` (enforced trong service, không phải DB)
- Soft delete: `deleted_at` timestamp, query luôn filter `deleted_at IS NULL`
- `shop_id` nullable chỉ cho backward compat — mọi item mới phải có `shop_id`

**Key DTOs:**
```typescript
class CreateItemDto {
  @IsString() @MinLength(1) name: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(ItemStatus) status: ItemStatus; // 'con_hang' | 'giu_cho' | 'da_ban'
  @IsInt() @Min(0) quantity: number;
  @IsInt() @Min(0) price: number;         // VND, không decimal
  @IsOptional() @IsInt() @Min(0) original_price?: number;
  @IsOptional() @IsString() brand?: string;
  @IsOptional() @IsString() car_brand?: string;
  @IsOptional() @IsString() model_brand?: string;
  @IsOptional() @IsEnum(ItemCondition) condition?: ItemCondition;
  @IsOptional() @IsObject() attributes?: Record<string, unknown>;
  @IsBoolean() is_public: boolean;
}
```

**State Transitions (status field):**
```
con_hang ↔ giu_cho  (freely mutable)
con_hang → da_ban   (quantity set to 0)
giu_cho  → da_ban   (quantity set to 0)
da_ban   → con_hang (phải đặt quantity > 0 explicitly)
```

---

### 1.3 Item Images Module (`backend/src/item-images/`)

**Trách nhiệm:** Upload, xử lý ảnh qua Sharp, quản lý thứ tự và cover image.

**Upload Pipeline:**
```
1. Multer intercept multipart (field: 'file')
2. Validate MIME type (ALLOWED_MIME env)
3. Validate file size (MAX_UPLOAD_MB env)
4. Sharp resize: 800x800 max, WebP format
5. Sharp thumbnail: 200x200, WebP format
6. StorageService.save() → filePath + thumbnailPath
7. Prisma INSERT item_images
8. Nếu is_cover=true → UPDATE khác is_cover=false
```

**Sharp Config:**
```typescript
const processImage = async (buffer: Buffer) => {
  const full = await sharp(buffer)
    .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const thumb = await sharp(buffer)
    .resize(200, 200, { fit: 'cover' })
    .webp({ quality: 75 })
    .toBuffer();

  return { full, thumb };
};
```

---

### 1.4 Spinner Module (`backend/src/spinner/`)

**Trách nhiệm:** Quản lý 360° spin sets và frames cho mỗi item.

**Business Rules:**
- Mỗi item chỉ có 1 spin set với `is_default=true`
- `frame_index` liên tục từ 0 đến n-1 (không có gap)
- `UNIQUE(spin_set_id, frame_index)` enforced ở DB
- Tối đa `MAX_SPINNER_FRAMES` frames (env var, default 48)
- Reorder: cập nhật `frame_index` trong một transaction

**Frame Upload:**
```typescript
// POST /api/v1/spinner/:setId/frames
// field: 'frame'
async uploadFrame(setId: string, file: Express.Multer.File, frameIndex: number) {
  // 1. Check frameIndex không conflict
  // 2. Sharp: 1200x900 cho viewer, 300x225 thumbnail
  // 3. StorageService.save()
  // 4. Prisma INSERT với ON CONFLICT DO UPDATE
}
```

**Reorder Frames:**
```typescript
// PATCH /api/v1/spinner/:setId/frames/reorder
// Body: { order: [frameId1, frameId2, ...] }
// Transaction: UPDATE frame_index theo vị trí trong array
```

---

### 1.5 Public Module (`backend/src/public/`)

**Trách nhiệm:** Endpoints công khai không cần xác thực — public catalog cho end customers.

**Scope isolation:**
- `shop_id` query param bắt buộc (hoặc cấu hình `VITE_PUBLIC_CATALOG_SHOP_ID`)
- Validate shop `is_active=true` trước mọi query
- Chỉ trả items với `is_public=true AND deleted_at IS NULL AND status != 'da_ban'`
- Response DTO: loại bỏ `notes`, `fb_post_content`, internal fields

**Endpoints:**
- `GET /api/v1/public/items` — Danh sách items (filter, paginate)
- `GET /api/v1/public/items/:id` — Chi tiết item + images + spin set
- `GET /api/v1/public/shop` — Thông tin shop (name, contact, appearance)

---

### 1.6 Shops Module (`backend/src/shops/`)

**Trách nhiệm:** Platform-level shop management — chỉ `platform_super`.

**Operations:** CRUD shops, manage users in shop, view audit logs.

**Audit Logging:**
```typescript
// Mọi thay đổi shop ghi vào shop_audit_logs
await this.prisma.shopAuditLog.create({
  data: {
    shop_id: shopId,
    actor_user_id: actorId,
    action: AuditAction.SHOP_UPDATED,
    target_type: 'shop',
    target_id: shopId,
    metadata_json: { changed_fields: ['name', 'is_active'] }
  }
});
```

---

### 1.7 Categories Module (`backend/src/categories/`)

**Trách nhiệm:** Quản lý danh mục xe (car_brand, model_brand).

- Category với `shop_id=null` → global (dùng cho tất cả shops)
- Category với `shop_id=X` → chỉ shop X
- Query: `WHERE (shop_id = $activeShopId OR shop_id IS NULL) AND is_active = true`
- `display_order` cho UI sorting

---

### 1.8 Inventory Module (`backend/src/inventory/`)

**Trách nhiệm:** Giao dịch kho hàng, reconciliation, reversal.

**Transaction Types:**
```typescript
enum InventoryTransactionType {
  STOCK_IN = 'stock_in',         // Nhập hàng
  STOCK_OUT = 'stock_out',       // Xuất hàng
  ADJUSTMENT = 'adjustment',     // Điều chỉnh (kiểm kê)
  REVERSAL = 'reversal',         // Đảo ngược giao dịch trước
  PRE_ORDER_RESERVE = 'pre_order_reserve', // Đặt hàng (giữ chỗ)
}
```

**Invariants:**
- `resulting_quantity` = quantity của item SAU giao dịch (ghi lại lịch sử)
- `delta` = số lượng thay đổi (dương/âm)
- `reversal_of_id` chỉ có giá trị khi type='reversal'
- Mỗi giao dịch ghi trong DB transaction cùng với UPDATE items.quantity

---

### 1.9 PreOrders Module (`backend/src/preorders/`)

**Trách nhiệm:** Quản lý đơn đặt hàng trước, state machine, tích hợp points.

**State Machine:**
```
PENDING_CONFIRMATION
    ├── → WAITING_FOR_GOODS
    └── → CANCELLED (terminal)
WAITING_FOR_GOODS
    ├── → ARRIVED
    └── → CANCELLED (terminal)
ARRIVED
    ├── → PAID
    └── → CANCELLED (terminal)
PAID
    └── → REFUNDED (terminal)
```

**Points Earn khi PAID:**
```typescript
async transitionToPaid(preOrderId: string, actorId: string) {
  return this.prisma.$transaction(async (tx) => {
    const preOrder = await tx.preOrder.update({ ... });
    
    if (preOrder.member_id && shop.loyalty_json?.earn_rate) {
      const pointsEarned = Math.floor(
        preOrder.total_amount * shop.loyalty_json.earn_rate / 100
      );
      
      await tx.memberPointsLedger.create({
        data: {
          member_id: preOrder.member_id,
          shop_id: preOrder.shop_id,
          type: 'earn',
          points: pointsEarned,
          delta: pointsEarned,
          balance_after: member.points_balance + pointsEarned,
          reason: 'pre_order_paid',
          reference_type: 'pre_order',
          reference_id: preOrderId,
        }
      });
      
      await tx.member.update({
        where: { id: preOrder.member_id },
        data: { points_balance: { increment: pointsEarned } }
      });
    }
  });
}
```

---

### 1.10 Members Module (`backend/src/members/`)

**Trách nhiệm:** CRM cho khách hàng thành viên, tier management, điểm thưởng.

**Tier Upgrade Logic:**
```typescript
// Sau mỗi lần points_balance thay đổi:
async checkAndUpgradeTier(memberId: string, shopId: string, tx: PrismaTransaction) {
  const member = await tx.member.findUnique({ ... });
  const tiers = await tx.membershipTier.findMany({
    where: { shop_id: shopId },
    orderBy: { rank: 'desc' }, // Cao nhất trước
  });
  
  const newTier = tiers.find(t => member.points_balance >= t.min_points);
  if (newTier && newTier.id !== member.tier_id) {
    await tx.member.update({
      where: { id: memberId },
      data: { tier_id: newTier.id }
    });
    // Ghi ledger entry cho tier upgrade event
  }
  // Note: Downgrade KHÔNG tự động
}
```

**Delete Member Safety:**
```typescript
async deleteMember(memberId: string, shopId: string) {
  const activePreOrders = await this.prisma.preOrder.count({
    where: {
      member_id: memberId,
      shop_id: shopId,
      status: { notIn: ['CANCELLED', 'REFUNDED'] } // non-terminal
    }
  });
  
  if (activePreOrders > 0) {
    throw new ConflictException('MEMBER_HAS_ACTIVE_PREORDERS');
  }
  
  await this.prisma.member.delete({ where: { id: memberId } });
}
```

---

### 1.11 Reports Module (`backend/src/reports/`)

**Trách nhiệm:** Analytics và báo cáo kinh doanh theo shop.

**Endpoints:**
- `GET /api/v1/reports/summary` — Tổng quan: doanh thu, số đơn, items
- `GET /api/v1/reports/trends` — Xu hướng theo thời gian (ngày/tuần/tháng)

**Query Strategy:**
- Dùng `DIRECT_URL` (không qua pooler) cho reporting queries nặng
- Group by date ranges với PostgreSQL `date_trunc`
- Filter `shop_id` bắt buộc

---

### 1.12 AI Module (`backend/src/ai/`)

**Trách nhiệm:** Tích hợp OpenAI để tự động tạo mô tả sản phẩm và nội dung Facebook.

**AI Draft Flow:**
```typescript
async createAiDraft(images: string[], shopId: string): Promise<AiItemDraft> {
  // 1. Lưu draft với status PENDING
  const draft = await this.prisma.aiItemDraft.create({ ... });
  
  // 2. Gọi OpenAI với Vision
  const completion = await this.openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: ITEM_EXTRACTION_PROMPT },
        ...images.map(url => ({ type: 'image_url', image_url: { url } }))
      ]
    }],
    response_format: { type: 'json_object' }
  });
  
  // 3. Parse và update draft
  const aiJson = JSON.parse(completion.choices[0].message.content);
  await this.prisma.aiItemDraft.update({
    where: { id: draft.id },
    data: { ai_json: aiJson, status: 'PENDING' }
  });
  
  return draft;
}
```

---

## 2. Data Processing Pipeline

### 2.1 Image Processing Pipeline

```
Input: Buffer (multipart upload)
  │
  ▼
Validation
  ├── MIME type: ALLOWED_MIME (e.g., image/jpeg,image/png,image/webp)
  └── Size: ≤ MAX_UPLOAD_MB × 1024 × 1024 bytes
  │
  ▼
Sharp Processing (concurrent, limited by Sharp.concurrency)
  ├── Full image: resize(800, 800, {fit:'inside'}) → WebP quality:85
  └── Thumbnail:  resize(200, 200, {fit:'cover'})  → WebP quality:75
  │
  ▼
Storage (StorageService.save)
  ├── Local: write to {UPLOAD_DIR}/{shop_id}/{yyyy/mm}/{uuid}.webp
  └── R2:    PutObject to {bucket}/{shop_id}/{yyyy/mm}/{uuid}.webp
  │
  ▼
Database (Prisma INSERT)
  └── item_images: { item_id, file_path, thumbnail_path, is_cover, display_order }
```

### 2.2 Spinner Frame Pipeline

```
Input: Buffer (multipart, field 'frame')
  │
  ▼
Validation: MIME + size (giống image)
  │
  ▼
Sharp Processing (frames cần độ phân giải cao hơn)
  ├── Full frame: resize(1200, 900, {fit:'inside'}) → WebP quality:90
  └── Thumbnail:  resize(300, 225, {fit:'cover'})   → WebP quality:75
  │
  ▼
Storage: {shop_id}/spinners/{spin_set_id}/{frame_index}.webp
  │
  ▼
Database: spin_frames { spin_set_id, frame_index, file_path, thumbnail_path }
  └── ON CONFLICT (spin_set_id, frame_index) DO UPDATE
```

### 2.3 AI Draft Confirmation Pipeline

```
Admin confirms AiItemDraft
  │
  ▼
POST /api/v1/ai/ai-draft/:id/confirm
  │
  ├── Validate draft status = PENDING
  ├── Extract fields từ ai_json (name, brand, price, ...)
  ├── Create Item (items table)
  ├── Update draft status = CONFIRMED
  └── Return created item
```

---

## 3. Caching Strategy

### 3.1 Frontend Caching (TanStack Query)

| Query | Cache Key | Stale Time | Refetch |
|-------|-----------|------------|---------|
| Items list | `['items', shopId, filters]` | 30s | On window focus |
| Item detail | `['items', itemId]` | 60s | On mutation |
| Public catalog | `['public', shopId, 'items', filters]` | 5 phút | Never (public) |
| Members list | `['members', shopId]` | 30s | On mutation |
| Reports | `['reports', shopId, period]` | 5 phút | Manual |
| Shop info | `['shop', shopId]` | 10 phút | On settings change |

**Invalidation Pattern:**
```typescript
// Sau khi tạo/sửa item:
await queryClient.invalidateQueries({ queryKey: ['items', shopId] });
// Sau khi upload ảnh:
await queryClient.invalidateQueries({ queryKey: ['items', itemId] });
// Sau khi transition preorder:
await queryClient.invalidateQueries({ queryKey: ['preorders', shopId] });
await queryClient.invalidateQueries({ queryKey: ['members', memberId] }); // points thay đổi
```

### 3.2 Media URL Caching

- Signed URLs có TTL cấu hình (ví dụ 1 giờ cho R2)
- Frontend không cache URL lâu hơn TTL
- `img` tags dùng signed URL trực tiếp — browser cache qua HTTP headers

### 3.3 Backend Caching

Hiện tại: không có backend cache layer (đủ cho scale hiện tại).

Roadmap: Redis cho:
- CSRF token validation (thay cookie-session)
- Rate limit counters distributed
- Session data nếu scale multi-instance

---

## 4. Security Implementation

### 4.1 JWT Implementation

```typescript
// JwtStrategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req.cookies?.['access_token'], // Cookie first
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Bearer fallback
      ]),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      platformRole: payload.platformRole,
      activeShopId: payload.activeShopId,
    };
  }
}
```

### 4.2 CSRF Implementation

```typescript
// CSRF Guard — áp dụng trên POST/PATCH/DELETE (trừ /auth/login)
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const headerToken = req.headers['x-csrf-token'];
    const cookieToken = req.signedCookies?.['csrf_token'];
    
    if (!headerToken || !cookieToken) return false;
    
    // Constant-time comparison để tránh timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(headerToken as string),
      Buffer.from(cookieToken)
    );
  }
}
```

### 4.3 Helmet Configuration

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', '*.r2.cloudflarestorage.com'],
      scriptSrc: ["'self'"],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  noSniff: true,
}));
```

### 4.4 Rate Limiting

```typescript
// Áp dụng globally
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 300,                  // 300 requests per window per IP
  message: { ok: false, error: { code: 'RATE_LIMIT_EXCEEDED' }, message: 'Too many requests' }
}));

// Endpoint nhạy cảm: POST /auth/login
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 lần/phút
async login(@Body() dto: LoginDto) { ... }
```

---

## 5. Error Handling Implementation

### 5.1 Global Exception Filter

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      response.status(status).json({
        ok: false,
        error: {
          code: exceptionResponse['code'] ?? 'HTTP_ERROR',
          details: exceptionResponse['details'] ?? null,
        },
        message: exceptionResponse['message'] ?? exception.message,
      });
    } else {
      // Unexpected error — không leak stacktrace
      console.error('Unexpected error:', exception);
      response.status(500).json({
        ok: false,
        error: { code: 'INTERNAL_SERVER_ERROR', details: null },
        message: 'An unexpected error occurred',
      });
    }
  }
}
```

### 5.2 Throwing Typed Errors

```typescript
// Service layer throw errors như sau:
throw new HttpException(
  {
    code: 'ITEM_STATUS_TRANSITION_INVALID',
    message: `Cannot transition from ${current} to ${next}`,
    details: { current_status: current, requested_status: next }
  },
  HttpStatus.UNPROCESSABLE_ENTITY
);
```

### 5.3 Validation Pipe

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,          // Strip unknown properties
  forbidNonWhitelisted: true, // Throw on unknown properties
  transform: true,          // Auto-transform types
  exceptionFactory: (errors) => new HttpException({
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: errors.map(e => ({
      field: e.property,
      constraints: Object.values(e.constraints ?? {})
    }))
  }, HttpStatus.UNPROCESSABLE_ENTITY)
}));
```

---

## 6. Performance Considerations

### 6.1 Sharp Concurrency Control

```typescript
// Trong ImageProcessingService
import sharp from 'sharp';

// Giới hạn concurrency để tránh OOM trên Raspberry Pi
sharp.concurrency(2); // Chỉ 2 threads Sharp cùng lúc

// Giải phóng cache sau processing
sharp.cache(false);
```

### 6.2 Node.js Memory Limits

```bash
# PM2 ecosystem.config.js
{
  name: 'diecast360-backend',
  script: 'dist/main.js',
  node_args: '--max-old-space-size=512', // 512MB cho RPi
  max_memory_restart: '450M',            // Restart nếu vượt 450MB
}
```

### 6.3 Database Connection Pooling

```typescript
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")     // Neon pooler
  directUrl = env("DIRECT_URL")       // Direct (migrations only)
}

// Neon pooler config: transaction mode (default)
// Pool size: match Neon plan limits (free: 25 connections)
```

### 6.4 Query Optimization

```typescript
// Luôn select chỉ fields cần thiết
const items = await this.prisma.item.findMany({
  where: { shop_id: shopId, deleted_at: null },
  select: {
    id: true, name: true, price: true, status: true,
    item_images: {
      where: { is_cover: true },
      select: { thumbnail_path: true },
      take: 1,
    }
  },
  orderBy: { created_at: 'desc' },
  take: limit,
  skip: offset,
});
```

### 6.5 Frontend Bundle Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          query: ['@tanstack/react-query'],
          ui: ['tailwind-merge', 'clsx'],
        }
      }
    }
  }
});
```

---

## 7. API Versioning Strategy

### 7.1 Chiến lược Versioning hiện tại

**URL-based versioning:** `/api/v1/...`

- Prefix `v1` trong toàn bộ route path
- Không dùng header-based hay content-type versioning
- Breaking changes → tạo `v2` namespace mới

### 7.2 Breaking Change Policy

**Breaking changes (cần v2):**
- Xóa field khỏi response
- Thay đổi kiểu dữ liệu field
- Thay đổi HTTP method của endpoint
- Xóa endpoint

**Non-breaking changes (vẫn v1):**
- Thêm optional field vào response
- Thêm optional field vào request body
- Thêm endpoint mới
- Thay đổi error message (không phải error code)

### 7.3 Deprecation Policy

```typescript
// Khi deprecate endpoint, thêm header warning
response.setHeader('Deprecation', 'true');
response.setHeader('Sunset', 'Thu, 31 Dec 2026 00:00:00 GMT');
response.setHeader('Link', '</api/v2/items>; rel="successor-version"');
```

### 7.4 NestJS Versioning Config

```typescript
// main.ts
app.enableVersioning({
  type: VersioningType.URI,
  prefix: 'api/v',
  defaultVersion: '1',
});
```
