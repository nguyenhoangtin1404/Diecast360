# Phase 16 Research: Public catalog scoped per shop

**Phase:** 16 — Per-Shop Public Homepage  
**Date:** 2026-04-29

## RESEARCH COMPLETE

## 1. Code anchors (executor must re-read before coding)

**Backend — tenant chỉ từ JWT khi có user:**

```11:16:backend/src/public/public.controller.ts
  @Get('items')
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() queryDto: QueryPublicItemsDto, @Req() req: Request) {
    const user = req.user as { active_shop_id?: string | null } | undefined;
    const tenantId = user?.active_shop_id ?? null;
    return this.publicService.findAll(queryDto, tenantId);
```

**Backend — khi `tenantId` null, không thêm `shop_id` vào where:**

```48:52:backend/src/public/public.service.ts
    const where: Prisma.ItemWhereInput = {
      deleted_at: null,
      is_public: true,
      ...(tenantId ? { shop_id: tenantId } : {}),
    };
```

**Frontend — catalog không truyền shop:**

```86:98:frontend/src/pages/PublicCatalogPage.tsx
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        page_size: '20',
      });
      ...
      const response = await apiClient.get(`/public/items?${params.toString()}`);
```

**Frontend — pattern sẵn có cho public + shop (reuse):**

- `frontend/src/utils/sanitizeShopId.ts`
- `frontend/src/pages/public/PreOrdersPage.tsx` (thứ tự query → env → JWT)

**Schema — slug shop:**

- `backend/prisma/schema.prisma` model `Shop`: `slug String @unique`

## 2. Resolution algorithm (recommended)

1. Parse optional public shop key from **query `shop_id`** and/or **path param** (if implemented).
2. If value matches UUID format → `prisma.shop.findFirst({ where: { id } })`.
3. Else → treat as **slug** → `findFirst({ where: { slug: normalized } })` (case policy: exact match DB slug).
4. If not found or `is_active === false` → **404** on list/detail (consistent with "shop not available").
5. Pass resolved `shop.id` as `tenantId` into `PublicService.findAll` / `findOne` **instead of** JWT `active_shop_id` when step 1 produced a tenant (per CONTEXT: explicit wins).

## 3. API contract notes

- Add optional query param `shop_id` to `GET /public/items` and `GET /public/items/:id` documented in `docs/API_CONTRACT.md`.
- Semantics: "restrict to this shop"; invalid/inactive → 404; omit + no default env → document aggregate vs error (align with CONTEXT).

## 4. Frontend routing (options)

| Approach | Pros | Cons |
|----------|------|------|
| `?shop_id=` only | Minimal router change | SEO weaker; easy to drop param on navigation |
| `/s/:slug/*` nested routes | Shareable, readable | More `App.tsx` / `Layout` link updates |
| `/shop/:slug` single segment prefix | Clear | Same as above |

**Recommendation:** Implement **query param first** (fastest, matches preorder) **or** path prefix if product wants clean links — pick one in plan 16-02 and test deep links (`/items/:id`).

## 5. Security / isolation

- Public endpoints must **never** return items whose `shop_id` ≠ resolved tenant when shop context is present.
- Slug is not secret; UUID in URL is guessable — rely on **public flag + shop scope**, not obscurity.
- Rate-limiting: reuse existing public throttle if any; no new requirement unless gaps found.

## 6. Testing strategy

- Extend `public.service.spec.ts` (or integration tests) for: slug resolve, inactive shop, cross-tenant item id with wrong shop returns 404.
- Playwright: two mocked shop IDs; assert list A does not show B's item title.

## Validation Architecture

- **Unit:** resolution helper + `PublicService` where-clause with `shop_id`.
- **Integration:** supertest `GET /public/items?shop_id=` with seeded shops (if test DB pattern exists).
- **E2E:** mocked API responses keyed by `shop_id` query (mirror preorder fixture style).
