# Coding Standards & Conventions Guide — Diecast360

---
**Version:** 1.0
**Ngày tạo:** 2026-05-22
**Người tạo:** Tech Lead
**Dự án:** Diecast360

---

## Mục lục

1. [Nguyên tắc chung](#1-nguyên-tắc-chung)
2. [Quy ước đặt tên](#2-quy-ước-đặt-tên)
3. [Backend — NestJS](#3-backend--nestjs)
4. [Frontend — React](#4-frontend--react)
5. [Database & Prisma](#5-database--prisma)
6. [API Design](#6-api-design)
7. [Error Handling](#7-error-handling)
8. [Testing](#8-testing)
9. [Git & Commit Convention](#9-git--commit-convention)
10. [Code Review Checklist](#10-code-review-checklist)
11. [Security Checklist](#11-security-checklist)
12. [Documentation Standards](#12-documentation-standards)

---

## 1. Nguyên tắc chung

### 1.1 Triết lý code

> **"Code được đọc nhiều hơn viết. Ưu tiên rõ ràng hơn thông minh."**

- **Simplicity first** — Giải pháp đơn giản nhất giải được bài toán là giải pháp đúng.
- **Explicit over implicit** — Đặt tên rõ ràng hơn comment. Comment giải thích *tại sao*, không phải *cái gì*.
- **Fail fast** — Validate input sớm, throw error sớm, không để lỗi lan ra sâu.
- **DRY nhưng không over-abstract** — Extract chỉ khi đoạn code lặp lại ≥ 3 lần và context thực sự giống nhau.
- **YAGNI** — Không build feature không được yêu cầu. Không thêm "flexibility" chưa cần thiết.

### 1.2 Quy tắc bất biến của Diecast360

Những quy tắc sau **KHÔNG được vi phạm** dù bất kỳ lý do gì:

| Quy tắc | Mô tả |
|---------|-------|
| **Never edit applied migrations** | Chỉ tạo migration mới, không sửa file migration đã apply |
| **Tenant isolation** | Mọi query trên Item/PreOrder/Member/Inventory/PointsLedger phải filter `shop_id` |
| **Points via ledger** | Không mutate `points_balance` trực tiếp — chỉ qua `MemberPointsLedger` |
| **Pre-order state machine** | Không set status tùy ý — chỉ qua service state machine |
| **da_ban quantity** | Item `da_ban` luôn có `quantity = 0` |
| **frame_index continuity** | SpinFrame index phải liên tục 0..n-1 sau mọi thao tác |
| **No sensitive data in response** | Không trả `password_hash`, `token_hash` trong bất kỳ response nào |

---

## 2. Quy ước đặt tên

### 2.1 TypeScript / JavaScript

```typescript
// ✅ Variables, functions: camelCase
const itemCount = 10;
async function getItemById(id: string): Promise<Item> { ... }

// ✅ Classes, Interfaces, Types, Enums: PascalCase
class ItemsService { ... }
interface CreateItemDto { ... }
type ItemStatus = 'con_hang' | 'giu_cho' | 'da_ban';
enum PreOrderStatus { PENDING_CONFIRMATION = 'PENDING_CONFIRMATION' }

// ✅ Constants: UPPER_SNAKE_CASE
const MAX_SPINNER_FRAMES = 48;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ✅ Private class members: prefix underscore nếu getter public
class ItemsService {
  private readonly _prisma: PrismaService;
}

// ✅ Boolean variables: is/has/can/should prefix
const isPublic = true;
const hasDefaultSpinSet = spinSets.some(s => s.is_default);
const canDelete = !hasActivePreOrders;
```

### 2.2 Database / API

```
// ✅ Table names: snake_case plural
items, item_images, spin_sets, spin_frames, pre_orders

// ✅ Column names: snake_case
shop_id, is_public, created_at, deleted_at, fb_post_content

// ✅ API paths: kebab-case
/api/v1/spin-sets/:id/frames
/api/v1/preorders/admin/summary
/api/v1/shop-settings/branding-upload

// ✅ JSON request/response keys: snake_case
{ "item_id": "uuid", "is_public": false, "unit_price": 150000 }
```

### 2.3 File naming

```
// ✅ Backend files: kebab-case.type.ts
items.controller.ts
items.service.ts
create-item.dto.ts
jwt-auth.guard.ts
tenant.guard.ts

// ✅ Frontend files
// Components: PascalCase
ItemCard.tsx
Spinner360.tsx
// Hooks: camelCase với prefix 'use'
useItems.ts
useSpinSet.ts
// Services/utils: camelCase
itemsService.ts
formatPrice.ts
```

---

## 3. Backend — NestJS

### 3.1 Module structure

Mỗi module NestJS theo cấu trúc:

```
src/items/
├── items.module.ts          # Module declaration
├── items.controller.ts      # HTTP layer only
├── items.service.ts         # Business logic
├── dto/
│   ├── create-item.dto.ts   # Input validation
│   ├── update-item.dto.ts
│   └── query-items.dto.ts
└── items.types.ts           # Module-specific types (optional)
```

### 3.2 Controller rules

```typescript
// ✅ Controller chỉ làm: parse request, call service, return response
@Controller('items')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  async findAll(@Query() query: QueryItemsDto, @ActiveShop() shopId: string) {
    // Không có business logic ở đây
    return this.itemsService.findAll(shopId, query);
  }

  @Post()
  @Roles('shop_admin')
  @UseGuards(RolesGuard)
  async create(@Body() dto: CreateItemDto, @ActiveShop() shopId: string) {
    return this.itemsService.create(shopId, dto);
  }
}

// ❌ Không làm trong controller
async create(@Body() dto: CreateItemDto, @ActiveShop() shopId: string) {
  // BAD: business logic trong controller
  if (dto.status === 'da_ban') dto.quantity = 0;
  const item = await this.prisma.item.create({ data: { ...dto, shop_id: shopId } });
  return item;
}
```

### 3.3 Service rules

```typescript
// ✅ Service chứa toàn bộ business logic
@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(shopId: string, dto: CreateItemDto): Promise<Item> {
    // Business rule enforcement
    const data = { ...dto, shop_id: shopId };
    if (data.status === ItemStatus.da_ban) {
      data.quantity = 0; // Invariant: da_ban always quantity=0
    }
    return this.prisma.item.create({ data });
  }

  async findAll(shopId: string, query: QueryItemsDto) {
    // Always scope to shopId — tenant isolation
    const where: Prisma.ItemWhereInput = {
      shop_id: shopId,          // ✅ Tenant isolation
      deleted_at: null,         // ✅ Soft delete filter
    };
    if (query.status) where.status = query.status;
    // ...
  }
}
```

### 3.4 DTO validation

```typescript
// ✅ Dùng class-validator decorators
export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEnum(ItemStatus)
  @IsOptional()
  status?: ItemStatus = ItemStatus.con_hang;

  @IsInt()
  @Min(0)
  @IsOptional()
  quantity?: number = 1;

  @IsBoolean()
  @IsOptional()
  is_public?: boolean = false;

  @IsObject()
  @IsOptional()
  @ValidateNested()  // Nếu có nested validation
  attributes?: Record<string, string | number | boolean | null>;
}

// ✅ Transform trước validate
@Transform(({ value }) => parseInt(value))
@IsInt()
@Min(1)
page: number = 1;
```

### 3.5 Guards pattern

```typescript
// ✅ TenantGuard — luôn applied với route cần active shop
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.active_shop_id) {
      throw new HttpException(
        { ok: false, error: { code: 'MISSING_ACTIVE_SHOP' }, message: 'Vui lòng chọn shop trước khi thực hiện thao tác này.' },
        HttpStatus.BAD_REQUEST,
      );
    }
    return true;
  }
}

// ✅ RolesGuard — kiểm tra shop role
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;
    const user = context.switchToHttp().getRequest().user;
    // shop_staff là read-only cho mutating methods
    if (user.shop_role === ShopRole.shop_staff) {
      const method = context.switchToHttp().getRequest().method;
      if (['POST', 'PATCH', 'DELETE'].includes(method)) {
        throw new ForbiddenException();
      }
    }
    return true;
  }
}
```

### 3.6 Environment validation on bootstrap

```typescript
// ✅ Validate env khi khởi động — fail fast
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Validate required env vars
  const config = app.get(ConfigService);
  const required = ['JWT_SECRET', 'COOKIE_SECRET', 'DATABASE_URL'];
  for (const key of required) {
    if (!config.get(key)) throw new Error(`Missing required env: ${key}`);
  }
  if (config.get('JWT_SECRET').length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  // ...
}
```

---

## 4. Frontend — React

### 4.1 Component structure

```
src/
├── components/              # Shared/reusable components
│   ├── ui/                  # Design system primitives (Button, Input, Badge...)
│   ├── item/                # Domain-specific (ItemCard, ItemStatusBadge...)
│   └── layout/              # Layout components (Sidebar, Header...)
├── pages/                   # Route-level components
│   ├── admin/
│   └── public/
├── hooks/                   # Custom hooks
├── services/                # API call functions (typed)
├── types/                   # TypeScript types
└── utils/                   # Pure utility functions
```

### 4.2 Component pattern

```tsx
// ✅ Functional component với explicit props interface
interface ItemCardProps {
  item: Item;
  onCopyCaption?: (content: string) => void;
  className?: string;
}

export function ItemCard({ item, onCopyCaption, className }: ItemCardProps) {
  // State local to component
  const [isCopied, setIsCopied] = useState(false);

  // Event handlers
  const handleCopyCaption = useCallback(() => {
    if (item.fb_post_content) {
      navigator.clipboard.writeText(item.fb_post_content);
      setIsCopied(true);
      onCopyCaption?.(item.fb_post_content);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [item.fb_post_content, onCopyCaption]);

  return (
    <div className={cn('rounded-lg border bg-white shadow-sm', className)}>
      {/* ... */}
    </div>
  );
}
```

### 4.3 TanStack Query patterns

```typescript
// ✅ Query key conventions — [resource, ...params]
const QUERY_KEYS = {
  items: (shopId: string) => ['items', shopId] as const,
  item: (id: string) => ['item', id] as const,
  spinSets: (itemId: string) => ['spin-sets', itemId] as const,
  preorders: (shopId: string, status?: string) => ['preorders', shopId, status] as const,
};

// ✅ Query hook
export function useItems(shopId: string, query: QueryItemsParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.items(shopId), query],
    queryFn: () => itemsService.getAll(shopId, query),
    enabled: !!shopId,
  });
}

// ✅ Mutation với cache invalidation
export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateItemDto) => itemsService.create(dto),
    onSuccess: (_, variables) => {
      // Invalidate items list
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Tạo sản phẩm thất bại');
    },
  });
}
```

### 4.4 API service layer

```typescript
// ✅ Typed API service với envelope unwrapping
interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message: string;
}

async function apiCall<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // Send cookies
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.ok) throw new ApiError(json);
  return json.data;
}

// Service functions
export const itemsService = {
  getAll: (shopId: string, query: QueryItemsParams) =>
    apiCall<{ items: Item[]; pagination: Pagination }>(`/items?${qs(query)}`),

  create: (dto: CreateItemDto) =>
    apiCall<{ item: Item }>('/items', {
      method: 'POST',
      body: JSON.stringify(dto),
    }),
};
```

### 4.5 Error boundary

```tsx
// ✅ Wrap route-level components với ErrorBoundary
<ErrorBoundary
  fallback={<ErrorPage message="Đã xảy ra lỗi không mong muốn" />}
>
  <ItemDetailPage />
</ErrorBoundary>
```

---

## 5. Database & Prisma

### 5.1 Query patterns

```typescript
// ✅ Luôn filter deleted_at và shop_id cho tenant-scoped queries
const items = await this.prisma.item.findMany({
  where: {
    shop_id: shopId,    // Tenant isolation — KHÔNG ĐƯỢC BỎ
    deleted_at: null,   // Soft delete filter — KHÔNG ĐƯỢC BỎ
  },
});

// ✅ Pagination pattern
const [items, total] = await this.prisma.$transaction([
  this.prisma.item.findMany({ where, skip, take, orderBy }),
  this.prisma.item.count({ where }),
]);

// ✅ Transaction cho multi-step operations
await this.prisma.$transaction(async (tx) => {
  // Step 1: update item quantity
  await tx.item.update({ where: { id: itemId }, data: { quantity: newQty } });
  // Step 2: create inventory transaction
  await tx.inventoryTransaction.create({ data: { ... } });
});

// ✅ Soft delete — không dùng prisma.item.delete()
await this.prisma.item.update({
  where: { id, shop_id: shopId },
  data: { deleted_at: new Date() },
});
```

### 5.2 Migration rules

```bash
# ✅ Tạo migration mới
pnpm prisma migrate dev --name add_fb_post_content_to_items

# ❌ KHÔNG BAO GIỜ sửa file migration đã apply
# ❌ KHÔNG chạy prisma db push trên production

# ✅ Deploy migration
pnpm prisma migrate deploy  # Dùng DIRECT_URL
```

### 5.3 Schema conventions

```prisma
// ✅ UUID cho mọi PK
model Item {
  id        String   @id @default(uuid()) @db.Uuid
  shop_id   String?  @db.Uuid           // nullable chỉ với backward compat
  name      String
  // ...
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  deleted_at DateTime?                   // soft delete
}

// ✅ Composite PK cho join tables
model UserShopRole {
  user_id String @db.Uuid
  shop_id String @db.Uuid
  // ...
  @@id([user_id, shop_id])
}
```

---

## 6. API Design

### 6.1 Response envelope

```typescript
// ✅ Luôn dùng envelope chuẩn
// Success
{ "ok": true, "data": { ... }, "message": "Tạo sản phẩm thành công" }

// Error
{ "ok": false, "error": { "code": "NOT_FOUND", "details": [] }, "message": "Không tìm thấy sản phẩm" }

// ❌ Không trả trực tiếp
{ "id": "...", "name": "..." }  // BAD
```

### 6.2 HTTP status codes

```
200 OK          — GET, PATCH success
201 Created     — POST success (tạo mới)
400 Bad Request — Missing context (switch shop first)
401 Unauthorized — Auth failure
403 Forbidden   — Permission denied
404 Not Found   — Resource not found
409 Conflict    — Duplicate constraint
413 Payload Too Large — File too large
422 Unprocessable — Validation error / business rule
429 Too Many Requests — Rate limit
500 Internal Server Error — Unexpected
```

### 6.3 Error codes (đầy đủ)

```typescript
export const ERROR_CODES = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  PUBLIC_SHOP_REQUIRED: 'PUBLIC_SHOP_REQUIRED',
  UPLOAD_INVALID_TYPE: 'UPLOAD_INVALID_TYPE',
  UPLOAD_TOO_LARGE: 'UPLOAD_TOO_LARGE',
  SPIN_FRAME_INDEX_CONFLICT: 'SPIN_FRAME_INDEX_CONFLICT',
  ITEM_STATUS_TRANSITION_INVALID: 'ITEM_STATUS_TRANSITION_INVALID',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  FACEBOOK_AUTH_ERROR: 'FACEBOOK_AUTH_ERROR',
  FACEBOOK_PERMISSION_ERROR: 'FACEBOOK_PERMISSION_ERROR',
  FACEBOOK_PUBLISH_ERROR: 'FACEBOOK_PUBLISH_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;
```

---

## 7. Error Handling

### 7.1 Backend error handling

```typescript
// ✅ Throw HttpException với error code chuẩn
if (!item) {
  throw new HttpException(
    { ok: false, error: { code: 'NOT_FOUND' }, message: 'Không tìm thấy sản phẩm' },
    HttpStatus.NOT_FOUND,
  );
}

// ✅ Business rule violations
if (!isValidTransition(currentStatus, newStatus)) {
  throw new HttpException(
    {
      ok: false,
      error: { code: 'ITEM_STATUS_TRANSITION_INVALID', details: [{ current: currentStatus, requested: newStatus }] },
      message: `Không thể chuyển từ ${currentStatus} sang ${newStatus}`,
    },
    HttpStatus.UNPROCESSABLE_ENTITY,
  );
}

// ✅ Global exception filter — log đầy đủ server-side, trả về envelope chuẩn
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Log với request ID — KHÔNG LOG sensitive data
    this.logger.error({ requestId, error: exception });
    // Trả về response sạch — KHÔNG lộ stacktrace
    response.status(status).json({
      ok: false,
      error: { code: 'INTERNAL_SERVER_ERROR' },
      message: 'Đã xảy ra lỗi hệ thống',
    });
  }
}
```

### 7.2 Frontend error handling

```typescript
// ✅ Centralized error handling trong service
class ApiError extends Error {
  code: string;
  details: unknown[];
  constructor(response: { error: { code: string; details?: unknown[] }; message: string }) {
    super(response.message);
    this.code = response.error.code;
    this.details = response.error.details ?? [];
  }
}

// ✅ Handle specific error codes
if (error instanceof ApiError) {
  switch (error.code) {
    case 'AUTH_TOKEN_EXPIRED':
      // Trigger refresh
      await refreshToken();
      break;
    case 'VALIDATION_ERROR':
      // Show field errors
      showValidationErrors(error.details);
      break;
    default:
      toast.error(error.message);
  }
}
```

---

## 8. Testing

### 8.1 Test file naming

```
// Unit tests
items.service.spec.ts
tenant.guard.spec.ts

// E2E tests (Playwright)
tests/
├── auth.spec.ts
├── items.spec.ts
├── spinner.spec.ts
├── preorders.spec.ts
└── members.spec.ts
```

### 8.2 Test patterns

```typescript
// ✅ Unit test — mock dependencies
describe('ItemsService', () => {
  let service: ItemsService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ItemsService, { provide: PrismaService, useValue: mockDeep<PrismaClient>() }],
    }).compile();
    service = module.get(ItemsService);
    prisma = module.get(PrismaService);
  });

  it('should enforce quantity=0 when status=da_ban', async () => {
    prisma.item.create.mockResolvedValue({ ...mockItem, status: 'da_ban', quantity: 0 });
    const result = await service.create('shop-1', { name: 'Test', status: 'da_ban', quantity: 5 });
    expect(result.quantity).toBe(0);
  });
});

// ✅ E2E Playwright test
test('admin can create item', async ({ page }) => {
  await page.goto('/admin/items/new');
  await page.fill('[name="name"]', 'MiniGT Skyline R34');
  await page.selectOption('[name="status"]', 'con_hang');
  await page.click('button[type="submit"]');
  await expect(page.locator('.toast-success')).toContainText('Tạo sản phẩm thành công');
});
```

### 8.3 Coverage targets

| Layer | Target |
|-------|--------|
| Service unit tests | 80% coverage |
| Guard/pipe tests | 100% |
| E2E critical paths | 100% |
| API endpoints | 90% happy path + error cases |

---

## 9. Git & Commit Convention

### 9.1 Branch naming

```bash
# ✅ Feature branches
feature/DC-123-add-spinner-reorder
feature/DC-456-member-tier-upgrade

# ✅ Bug fixes
fix/DC-789-frame-index-not-compacted
fix/DC-012-csrf-missing-on-refresh

# ✅ Hotfixes (từ main)
hotfix/DC-100-tenant-isolation-public-catalog

# ✅ Chores
chore/update-prisma-6.2
chore/cleanup-unused-imports

# ✅ Docs
docs/update-api-contract-preorders

# ✅ AI-generated (Claude Code)
claude/feature-spinner-autoplay
```

### 9.2 Conventional Commits

```bash
# Format: <type>(<scope>): <description>
# Types: feat | fix | chore | docs | test | refactor | perf | ci

# ✅ Examples
feat(items): add ai-draft endpoint from photo upload
fix(spinner): compact frame_index after frame deletion
fix(auth): refresh token not rotating on concurrent requests
chore(deps): bump prisma from 6.1.0 to 6.2.0
docs(api): update preorder status transition table
test(members): add FK restrict test when deleting member with active preorder
refactor(storage): extract storage interface for local and r2 drivers
ci: add playwright e2e job to github actions workflow
perf(images): set sharp concurrency(1) to prevent OOM on low-RAM hosts

# ✅ Breaking changes
feat(auth)!: switch from Bearer-only to Cookie-primary auth

# Thân commit (khi cần giải thích thêm)
fix(public): add shop scope filter to prevent cross-tenant catalog

Public catalog endpoint was returning items from all shops when no
shop_id param or JWT active_shop was present in non-production env.
Production now returns PUBLIC_SHOP_REQUIRED (422) for anonymous requests.

Fixes #DC-301
```

### 9.3 PR template

```markdown
## Loại thay đổi
- [ ] ✨ Feature mới
- [ ] 🐛 Bug fix
- [ ] 🔧 Chore/refactor
- [ ] 📚 Docs
- [ ] 🧪 Tests

## Mô tả
<!-- Giải thích ngắn gọn tại sao thay đổi này cần thiết -->

## Thay đổi gì
<!-- Liệt kê các thay đổi chính -->

## Test
<!-- Bạn đã test như thế nào? -->
- [ ] Unit tests pass
- [ ] E2E tests pass (hoặc test thủ công nếu không có E2E cover)
- [ ] Đã test trên staging

## Checklist
- [ ] Code tuân thủ coding standards
- [ ] Không có `console.log` debug còn sót
- [ ] API changes đã cập nhật `docs/API_CONTRACT.md`
- [ ] DB changes có migration mới (không sửa migration cũ)
- [ ] Không hardcode secrets/URLs
- [ ] Không có cross-tenant data access
```

---

## 10. Code Review Checklist

### Reviewer checklist

```markdown
## Correctness
- [ ] Code làm đúng những gì PR description nói
- [ ] Edge cases được handle (null, empty array, 0, negative numbers)
- [ ] Không có off-by-one errors trong pagination/ordering

## Security
- [ ] Không có SQL injection (Prisma parameterized queries)
- [ ] Input được validate trước khi dùng
- [ ] Không trả `password_hash`, `token_hash` trong response
- [ ] Cross-tenant isolation: query có filter `shop_id`?
- [ ] Upload: check MIME type và file size

## Business Rules
- [ ] `da_ban` item enforce `quantity = 0`?
- [ ] Pre-order transition đi qua state machine?
- [ ] Points thay đổi qua ledger, không mutate trực tiếp?
- [ ] SpinFrame `frame_index` liên tục sau reorder/delete?

## Code Quality
- [ ] Không có unused imports, variables
- [ ] Không có `any` type (trừ khi justified)
- [ ] Tên biến/hàm rõ ràng
- [ ] Không có nested if quá 3 cấp
- [ ] Không có magic numbers (extract thành constant)

## Tests
- [ ] Unit tests cho business logic mới
- [ ] E2E tests cho user flow mới (nếu Playwright cover)
- [ ] Existing tests vẫn pass

## Documentation
- [ ] API thay đổi → `docs/API_CONTRACT.md` đã update
- [ ] Schema thay đổi → migration mới (không sửa cũ)
- [ ] Domain rule thay đổi → `docs/DOMAIN.md` đã update

## Performance
- [ ] Không có N+1 query (dùng Prisma `include` hoặc separate query)
- [ ] Không có missing index cho query mới
- [ ] Upload/image processing không block event loop
```

---

## 11. Security Checklist

### Pre-commit security check

```markdown
- [ ] Không commit file `.env`, `.env.local`, `.env.production`
- [ ] Không hardcode API keys, secrets, passwords trong code
- [ ] Không có `console.log` với sensitive data (password, token)
- [ ] HTTP-only cookies không bị expose qua response body
- [ ] CSRF token required cho tất cả POST/PATCH/DELETE (trừ login)
- [ ] Rate limiting applied cho endpoints nhạy cảm (login, upload, AI)
- [ ] File upload: validate MIME type và size trước khi process
- [ ] Không có `eval()`, `Function()`, hoặc dynamic code execution
- [ ] User input không được dùng trực tiếp trong file paths
```

---

## 12. Documentation Standards

### 12.1 Code comments

```typescript
// ✅ Comment giải thích TẠI SAO, không phải CÁI GÌ
// frame_index phải compact sau khi xóa để đảm bảo tính liên tục 0..n-1
// và tránh vi phạm constraint unique(spin_set_id, frame_index)
await this.reorderFrameIndexes(spinSetId, tx);

// ✅ TODO với ticket reference
// TODO(DC-456): Implement auto-tier-upgrade khi points vượt threshold

// ❌ Useless comment
// Get item by id
const item = await this.prisma.item.findUnique({ where: { id } });
```

### 12.2 Docs sync rule

> **Khi thay đổi code → phải cập nhật docs tương ứng TRƯỚC hoặc CÙNG LÚC với code.**

| Thay đổi | Docs cần update |
|---------|----------------|
| Thêm/sửa API endpoint | `docs/API_CONTRACT.md` |
| Thêm/sửa business rule | `docs/DOMAIN.md` |
| Thêm/sửa DB table/column | `docs/DB_SCHEMA.md` |
| Thêm/sửa env variable | `docs/ENV.md` |
| Thêm/sửa error code | `docs/ERROR_HANDLING.md` |
| Thay đổi deployment | `docs/DEPLOYMENT.md` |
| Thay đổi architecture | `docs/ARCHITECTURE.md` |

---

*Tài liệu này là nguồn tham chiếu cho mọi thành viên team. Khi có điểm chưa rõ hoặc cần exception, thảo luận với Tech Lead trước khi implement.*
