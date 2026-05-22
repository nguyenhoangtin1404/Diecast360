---
title: "Sequence Diagrams"
document_id: "DOC-19"
version: "1.0.0"
created_date: "2026-05-22"
author: "Tech Lead / Solution Architect"
status: "Approved"
---

# 19. Sequence Diagrams — Diecast360

## Mục lục
- [SD-01: User Login Flow](#sd-01-user-login-flow)
- [SD-02: Upload Item Image Flow](#sd-02-upload-item-image-flow)
- [SD-03: Upload Spinner Frame Flow](#sd-03-upload-spinner-frame-flow)
- [SD-04: Public Catalog Browse Flow](#sd-04-public-catalog-browse-flow)
- [SD-05: Pre-Order Status Transition](#sd-05-pre-order-status-transition)
- [SD-06: AI Draft Item Flow](#sd-06-ai-draft-item-flow)
- [SD-07: Facebook Post Publish Flow](#sd-07-facebook-post-publish-flow)
- [SD-08: Member Points Earn Flow](#sd-08-member-points-earn-flow)
- [SD-09: Token Refresh Flow](#sd-09-token-refresh-flow)
- [SD-10: Inventory Transaction with Reconciliation](#sd-10-inventory-transaction-with-reconciliation)

---

## SD-01: User Login Flow

**Mô tả:** Luồng đăng nhập hoàn chỉnh bao gồm lấy CSRF token, xác thực, và thiết lập cookie session.

```
Browser (React SPA)      NestJS AuthController    AuthService        PrismaService      DB (Neon)
        │                        │                     │                  │                 │
        │ 1. App khởi động       │                     │                  │                 │
        │──GET /auth/csrf ───────►│                     │                  │                 │
        │                        │ generateCsrfToken() │                  │                 │
        │                        │────────────────────►│                  │                 │
        │                        │                     │ crypto.random()  │                 │
        │                        │◄──── csrfToken ─────│                  │                 │
        │◄── 200 {csrf_token} ───│                     │                  │                 │
        │    Set-Cookie: csrf_token (HttpOnly, Signed) │                  │                 │
        │                        │                     │                  │                 │
        │ 2. User nhập form và submit                  │                  │                 │
        │──POST /auth/login ─────►│                     │                  │                 │
        │  Body: {email, pwd}    │                     │                  │                 │
        │  Header: X-CSRF-Token  │                     │                  │                 │
        │                        │ CsrfGuard: validate │                  │                 │
        │                        │ (header == cookie?) │                  │                 │
        │                        │                     │                  │                 │
        │                        │────login(email, pwd)►│                  │                 │
        │                        │                     │──findUnique ─────►│                 │
        │                        │                     │  (WHERE email=$1)│                 │
        │                        │                     │                  │──SELECT users──►│
        │                        │                     │                  │◄──── user row ──│
        │                        │                     │◄──── user ───────│                 │
        │                        │                     │                  │                 │
        │                        │                     │ bcrypt.compare(  │                 │
        │                        │                     │  password,       │                 │
        │                        │                     │  user.hash)      │                 │
        │                        │                     │                  │                 │
        │                        │                     │ [if invalid]     │                 │
        │                        │◄── throw AUTH_INVALID_CREDENTIALS ─────│                 │
        │◄── 401 {error} ────────│                     │                  │                 │
        │                        │                     │                  │                 │
        │                        │                     │ [if valid]       │                 │
        │                        │                     │ signJWT(payload) │                 │
        │                        │                     │ generateRefreshToken()             │
        │                        │                     │──INSERT refresh──►│                 │
        │                        │                     │   _tokens         │                 │
        │                        │                     │                  │──INSERT ────────►│
        │                        │                     │◄── saved ────────│                 │
        │                        │◄── {accessToken,    │                  │                 │
        │                        │     refreshToken,   │                  │                 │
        │                        │     me} ────────────│                  │                 │
        │◄── 200 {ok, data:{me}} │                     │                  │                 │
        │    Set-Cookie: access_token (HttpOnly, 15m)  │                  │                 │
        │    Set-Cookie: refresh_token (HttpOnly, 7d)  │                  │                 │
        │                        │                     │                  │                 │
        │ 3. Lưu user state vào Zustand store          │                  │                 │
        │    Redirect to dashboard                      │                  │                 │
```

**Ghi chú:**
- CSRF token được lấy khi app khởi động và lưu trong memory (không localStorage)
- Nếu tab đóng rồi mở lại, cookie vẫn còn nhưng cần fetch CSRF token mới
- `platform_super` user: `active_shop_id` = null trong JWT payload

---

## SD-02: Upload Item Image Flow

**Mô tả:** Luồng upload ảnh sản phẩm với Sharp processing và lưu vào storage.

```
Browser               NestJS                ImageController    ItemImageService    Sharp    StorageService    PrismaService    DB
   │                     │                        │                  │              │            │                 │             │
   │──POST /items/:id/images ────────────────────►│                  │              │            │                 │             │
   │  Content-Type: multipart/form-data           │                  │              │            │                 │             │
   │  Cookie: access_token                        │                  │              │            │                 │             │
   │  X-CSRF-Token: <token>                       │                  │              │            │                 │             │
   │  Body: file=<binary>                         │                  │              │            │                 │             │
   │                     │                        │                  │              │            │                 │             │
   │                     │  JwtAuthGuard: verify JWT               │              │            │                 │             │
   │                     │  TenantGuard: extract shopId            │              │            │                 │             │
   │                     │  CsrfGuard: validate header vs cookie   │              │            │                 │             │
   │                     │  Multer: parse multipart               │              │            │                 │             │
   │                     │                        │                  │              │            │                 │             │
   │                     │                        │──validateItem(itemId, shopId)──►│            │                 │             │
   │                     │                        │                  │──findFirst──────────────────────────────────►│             │
   │                     │                        │                  │◄──── item ──────────────────────────────────│             │
   │                     │                        │                  │              │            │                 │             │
   │                     │                        │                  │ validateMimeType(file.mimetype)              │             │
   │                     │                        │                  │ validateFileSize(file.size)                  │             │
   │                     │                        │                  │              │            │                 │             │
   │                     │                        │                  │──processImage(buffer)───►│            │                 │
   │                     │                        │                  │              │ resize(800x800)            │             │
   │                     │                        │                  │              │ → WebP quality:85          │             │
   │                     │                        │                  │              │ thumbnail(200x200)         │             │
   │                     │                        │                  │              │ → WebP quality:75          │             │
   │                     │                        │                  │◄── {fullBuf, thumbBuf} ──│            │                 │
   │                     │                        │                  │              │            │                 │             │
   │                     │                        │                  │──save(fullBuf, 'full') ──────────────►│                 │
   │                     │                        │                  │              │            │ [Local] write to UPLOAD_DIR   │
   │                     │                        │                  │              │            │ [R2] PutObjectCommand         │
   │                     │                        │                  │◄── filePath ──────────────│                 │             │
   │                     │                        │                  │──save(thumbBuf,'thumb')────────────────►│                 │
   │                     │                        │                  │◄── thumbPath ─────────────│                 │             │
   │                     │                        │                  │              │            │                 │             │
   │                     │                        │                  │──INSERT item_images ────────────────────────►│             │
   │                     │                        │                  │  {item_id, file_path,     │                 │──INSERT───►│
   │                     │                        │                  │   thumbnail_path,         │                 │◄── row ────│
   │                     │                        │                  │   is_cover, display_order}│                 │             │
   │                     │                        │                  │◄── imageRecord ─────────────────────────────│             │
   │                     │                        │◄── imageRecord ──│              │            │                 │             │
   │◄── 201 {ok, data:{id, url, thumbnail_url}} ──│                  │              │            │                 │             │
```

**Ghi chú:**
- Nếu `is_cover=true` trong query param: service UPDATE các ảnh khác thành `is_cover=false` trong transaction
- `url` trong response là signed URL path (không phải raw file path)

---

## SD-03: Upload Spinner Frame Flow

**Mô tả:** Luồng upload frame cho 360° spin viewer.

```
Browser               NestJS                SpinnerController    SpinnerService    Sharp    Storage    DB
   │                     │                        │                  │              │           │        │
   │──POST /spinner/:setId/frames ───────────────►│                  │              │           │        │
   │  field: frame (binary)                       │                  │              │           │        │
   │  form field: frame_index=5                   │                  │              │           │        │
   │                     │                        │                  │              │           │        │
   │                     │  Guards validate       │                  │              │           │        │
   │                     │                        │──validateSpinSet(setId, shopId)►│           │        │
   │                     │                        │                  │──findFirst──────────────────────►│
   │                     │                        │                  │◄── spinSet ──────────────────────│
   │                     │                        │                  │              │           │        │
   │                     │                        │                  │ checkFrameCount()        │        │
   │                     │                        │                  │ (count < MAX_SPINNER_FRAMES?)     │
   │                     │                        │                  │              │           │        │
   │                     │                        │                  │ checkFrameIndex(frame_index)      │
   │                     │                        │                  │ (already exists?)        │        │
   │                     │                        │                  │──findFirst(spin_set_id, frame_index)──►│
   │                     │                        │                  │◄── null (OK) ────────────────────│
   │                     │                        │                  │              │           │        │
   │                     │                        │                  │──processFrame(buffer)───►│           │
   │                     │                        │                  │              │ resize(1200x900)  │
   │                     │                        │                  │              │ → WebP q:90       │
   │                     │                        │                  │              │ thumb(300x225)    │
   │                     │                        │                  │◄── {full, thumb} ────────│           │
   │                     │                        │                  │              │           │        │
   │                     │                        │                  │──save(full)────────────────────────────►│ (storage)
   │                     │                        │                  │──save(thumb)───────────────────────────►│ (storage)
   │                     │                        │                  │◄── {filePath, thumbPath}─────────────────│
   │                     │                        │                  │              │           │        │
   │                     │                        │                  │──UPSERT spin_frames ───────────────────►│
   │                     │                        │                  │  ON CONFLICT (set, idx) DO UPDATE       │
   │                     │                        │                  │◄── frame record ───────────────────────│
   │                     │                        │◄── frame ────────│              │           │        │
   │◄── 201 {ok, data:{id, frame_index, url}} ────│                  │              │           │        │
```

**Ghi chú:**
- UPSERT cho phép replace frame nếu frame_index đã tồn tại (overwrite intent)
- Khi delete một frame, các frames sau phải được reorder để duy trì liên tục 0..n-1

---

## SD-04: Public Catalog Browse Flow

**Mô tả:** Anonymous user duyệt catalog công khai của một shop.

```
Anonymous Browser    Cloudflare CDN    NestJS PublicController    PublicService    DB
       │                   │                    │                     │              │
       │──GET /public/items?shop_id=abc ────────►│                    │              │
       │                   │                    │                    │              │
       │                   │                    │ (Không có JwtAuthGuard)          │
       │                   │                    │ Validate shop_id param present    │
       │                   │                    │──validateShop(shopId) ───────────►│
       │                   │                    │                    │──SELECT shops─►│
       │                   │                    │                    │◄── shop ──────│
       │                   │                    │                    │              │
       │                   │                    │                    │ [if !shop.is_active]
       │                   │◄── 404 NOT_FOUND ──│                    │              │
       │◄── 404 {error} ───│                    │                    │              │
       │                   │                    │                    │              │
       │                   │                    │                    │ [if active]  │
       │                   │                    │──getPublicItems() ──────────────►│
       │                   │                    │                    │ SELECT items  │
       │                   │                    │                    │   WHERE shop_id=$1
       │                   │                    │                    │   AND is_public=true
       │                   │                    │                    │   AND status != 'da_ban'
       │                   │                    │                    │   AND deleted_at IS NULL
       │                   │                    │                    │   WITH cover image
       │                   │                    │                    │   ORDER BY created_at DESC
       │                   │                    │                    │   LIMIT/OFFSET (pagination)
       │                   │                    │                    │◄── items[] ──│
       │                   │                    │◄── items[] ─────────│              │
       │                   │                    │                     │              │
       │                   │                    │ mapToPublicDto()    │              │
       │                   │                    │ (strip notes,       │              │
       │                   │                    │  fb_post_content,   │              │
       │                   │                    │  internal fields)   │              │
       │                   │                    │ Sign media URLs     │              │
       │                   │◄── 200 {ok, data, meta} ───────────────│              │
       │◄── 200 (cache hit or miss) ────────────│                    │              │
       │                   │                    │                    │              │
       │ Browser caches: TanStack Query staleTime=5min               │              │
```

**Ghi chú:**
- Không có auth guard — hoàn toàn public
- Rate limiting vẫn áp dụng theo IP
- Cloudflare CDN có thể cache response (nếu cấu hình Cache-Control header)

---

## SD-05: Pre-Order Status Transition

**Mô tả:** Luồng chuyển pre-order từ ARRIVED → PAID, bao gồm tính và cộng điểm thưởng.

```
Admin Browser    NestJS PreOrderController    PreOrderService    PrismaService ($transaction)    DB
     │                    │                        │                       │                      │
     │──PATCH /preorders/:id/status ──────────────►│                       │                      │
     │  {status: "PAID"}  │                        │                       │                      │
     │                    │                        │                       │                      │
     │                    │ Guards validate        │                       │                      │
     │                    │──transitionStatus(id, PAID, shopId) ──────────►│                      │
     │                    │                        │ BEGIN TRANSACTION ────►│                      │
     │                    │                        │                        │──SELECT pre_orders──►│
     │                    │                        │                        │  WHERE id=$1         │
     │                    │                        │                        │  FOR UPDATE          │
     │                    │                        │                        │◄── preOrder ─────────│
     │                    │                        │                        │                      │
     │                    │                        │ validateTransition(    │                      │
     │                    │                        │   current=ARRIVED,     │                      │
     │                    │                        │   next=PAID)           │                      │
     │                    │                        │ [if invalid transition]│                      │
     │                    │                        │◄── ROLLBACK ───────────│                      │
     │◄── 422 {ITEM_STATUS_TRANSITION_INVALID} ────│                        │                      │
     │                    │                        │                        │                      │
     │                    │                        │ [if valid: ARRIVED→PAID]                      │
     │                    │                        │──UPDATE pre_orders ────►│                      │
     │                    │                        │  SET status=PAID,       │──UPDATE ────────────►│
     │                    │                        │  completed_at=NOW()     │◄── updated ─────────│
     │                    │                        │                        │                      │
     │                    │                        │ [if member_id exists]  │                      │
     │                    │                        │──SELECT members ────────►│                      │
     │                    │                        │  + shop (loyalty_json)  │──SELECT ────────────►│
     │                    │                        │                        │◄── {member, shop} ───│
     │                    │                        │                        │                      │
     │                    │                        │ calculatePoints:       │                      │
     │                    │                        │   total × earn_rate/100│                      │
     │                    │                        │   = 150000 × 1/100 = 1500 points              │
     │                    │                        │                        │                      │
     │                    │                        │──INSERT member_points_ledger ────────────────►│
     │                    │                        │  {member_id, type=earn, │                      │
     │                    │                        │   delta=+1500,          │                      │
     │                    │                        │   balance_after=6500,  │                      │
     │                    │                        │   reference_type=pre_order,                   │
     │                    │                        │   reference_id=preOrderId}                    │
     │                    │                        │◄── ledger entry ────────│                      │
     │                    │                        │                        │                      │
     │                    │                        │──UPDATE members ─────────►│                      │
     │                    │                        │  SET points_balance +=  │──UPDATE ────────────►│
     │                    │                        │  1500                   │◄── OK ──────────────│
     │                    │                        │                        │                      │
     │                    │                        │ checkTierUpgrade(member)│                      │
     │                    │                        │  (compare points vs    │                      │
     │                    │                        │   tier thresholds)     │                      │
     │                    │                        │ [if tier upgrade]      │                      │
     │                    │                        │──UPDATE members ─────────►│──UPDATE ────────────►│
     │                    │                        │  SET tier_id=newTierId │◄── OK ──────────────│
     │                    │                        │                        │                      │
     │                    │                        │──COMMIT ────────────────►│                      │
     │                    │◄── {preOrder, pointsEarned} ────────────────────│                      │
     │◄── 200 {ok, data}──│                        │                        │                      │
```

---

## SD-06: AI Draft Item Flow

**Mô tả:** Upload ảnh → OpenAI phân tích → tạo draft → admin confirm → tạo item.

```
Admin Browser    NestJS AI Controller    AIService    OpenAI API    PrismaService    DB
     │                   │                  │              │               │             │
     │ 1. POST /ai/ai-description           │              │               │             │
     │──{image_urls:[...]} ────────────────►│              │               │             │
     │                   │                  │              │               │             │
     │                   │ Guards validate  │              │               │             │
     │                   │──createAiDraft() ►│              │               │             │
     │                   │                  │──INSERT ai_item_drafts ───────────────────►│
     │                   │                  │  status=PENDING              │             │
     │                   │                  │◄── draft {id} ───────────────────────────│
     │                   │                  │              │               │             │
     │                   │                  │──chat.completions.create() ─►│             │
     │                   │                  │  model: gpt-4-vision-preview │             │
     │                   │                  │  messages: [                 │             │
     │                   │                  │    {role:user, content:[     │             │
     │                   │                  │      {type:text, text:PROMPT}│             │
     │                   │                  │      {type:image_url, ...}   │             │
     │                   │                  │    ]}                        │             │
     │                   │                  │  ]                           │             │
     │                   │                  │  response_format:{json_object}            │
     │                   │                  │              │               │             │
     │                   │                  │◄── {choices[0].message} ─────│             │
     │                   │                  │              │               │             │
     │                   │                  │ Parse JSON response:         │             │
     │                   │                  │ {name, brand, scale, price,  │             │
     │                   │                  │  description, ...}           │             │
     │                   │                  │              │               │             │
     │                   │                  │──UPDATE ai_item_drafts ──────────────────►│
     │                   │                  │  SET ai_json=parsed,         │             │
     │                   │                  │  confidence_json={...}       │             │
     │                   │◄── {draft} ──────│              │               │             │
     │◄── 200 {ok, data:{draft}} ──────────│              │               │             │
     │                   │                  │              │               │             │
     │ [Admin review draft, chỉnh sửa]     │              │               │             │
     │                   │                  │              │               │             │
     │ 2. POST /ai/ai-draft/:id/confirm     │              │               │             │
     │──{name, price, qty, ...} ───────────►│              │               │             │
     │                   │                  │              │               │             │
     │                   │──confirmDraft() ─►│              │               │             │
     │                   │                  │──BEGIN TRANSACTION ──────────►│             │
     │                   │                  │──CREATE item ────────────────►│──INSERT ───►│
     │                   │                  │──UPDATE draft status=CONFIRMED►│──UPDATE ───►│
     │                   │                  │──COMMIT ─────────────────────►│             │
     │                   │◄── {item} ───────│              │               │             │
     │◄── 200 {ok, data:{item}} ───────────│              │               │             │
```

---

## SD-07: Facebook Post Publish Flow

**Mô tả:** Admin publish nội dung item lên Facebook Page.

```
Admin Browser    NestJS FacebookController    FacebookService    Graph API    PrismaService    DB
     │                    │                       │                 │               │             │
     │──POST /items/:id/facebook-posts ──────────►│                 │               │             │
     │  {content, image_ids:[...]} │              │                 │               │             │
     │                    │                       │                 │               │             │
     │                    │ Guards validate        │                 │               │             │
     │                    │──publishPost(itemId, dto) ─────────────►│               │             │
     │                    │                       │──fetchItem + images ──────────────────────────►│
     │                    │                       │◄── {item, images} ────────────────────────────│
     │                    │                       │                 │               │             │
     │                    │                       │ Validate PAGE_ACCESS_TOKEN     │             │
     │                    │                       │                 │               │             │
     │                    │                       │ [if images exist]              │             │
     │                    │                       │──POST /{page-id}/photos ───────►│             │
     │                    │                       │  {url: imageUrl, published:false}             │
     │                    │                       │◄── {id: photo_id} ─────────────│             │
     │                    │                       │ (repeat for each image)        │             │
     │                    │                       │                 │               │             │
     │                    │                       │──POST /{page-id}/feed ──────────►│             │
     │                    │                       │  {message: content,            │             │
     │                    │                       │   attached_media: [photo_ids]} │             │
     │                    │                       │◄── {id: post_id} ──────────────│             │
     │                    │                       │                 │               │             │
     │                    │                       │ postUrl = `https://facebook.com/{post_id}`    │
     │                    │                       │                 │               │             │
     │                    │                       │──INSERT facebook_posts ─────────────────────►│
     │                    │                       │  {item_id, post_url, content}  │             │
     │                    │◄── {facebookPost} ────│                 │               │             │
     │◄── 200 {ok, data:{post_url}} ─────────────│                 │               │             │
     │                    │                       │                 │               │             │
     │ [Error cases]      │                       │                 │               │             │
     │                    │◄── Graph API 401 ──────│◄── 401 OAuthException          │             │
     │◄── 401 {FACEBOOK_AUTH_ERROR} ─────────────│                 │               │             │
     │                    │◄── Graph API 5xx ──────│◄── 500 error                  │             │
     │◄── 502 {FACEBOOK_PUBLISH_ERROR} ──────────│                 │               │             │
```

---

## SD-08: Member Points Earn Flow

**Mô tả:** Khi pre-order chuyển sang PAID, hệ thống tự động tính và cộng điểm thưởng cho thành viên.

```
PreOrderService              MemberService         PrismaService ($tx)        DB
       │                          │                        │                    │
       │ [Trong transaction PAID] │                        │                    │
       │──earnPointsForPreOrder(preOrder, tx) ─────────────►│                   │
       │                          │                        │                    │
       │                          │──getShopLoyaltyConfig(shopId) ─────────────►│
       │                          │                        │──SELECT shops──────►│
       │                          │                        │◄── shop ───────────│
       │                          │                        │                    │
       │                          │ shop.loyalty_json = {earn_rate: 1}         │
       │                          │                        │                    │
       │                          │──getMember(memberId) ──►│                   │
       │                          │                        │──SELECT members───►│
       │                          │                        │◄── member ─────────│
       │                          │                        │                    │
       │                          │ pointsEarned = floor(  │                    │
       │                          │   total_amount × earn_rate / 100)          │
       │                          │ = floor(150000 × 1/100) = 1500            │
       │                          │                        │                    │
       │                          │──createLedgerEntry(tx) ►│                   │
       │                          │                        │──INSERT member_points_ledger
       │                          │                        │  {type:'earn',     │
       │                          │                        │   delta:+1500,     │
       │                          │                        │   balance_after:   │
       │                          │                        │   member.points + 1500,
       │                          │                        │   ref_type:'pre_order',
       │                          │                        │   ref_id:preOrder.id}
       │                          │                        │──INSERT ───────────►│
       │                          │                        │◄── ledger entry ───│
       │                          │                        │                    │
       │                          │──updateMemberBalance() ►│                   │
       │                          │                        │──UPDATE members────►│
       │                          │                        │  SET points_balance│
       │                          │                        │  = points_balance  │
       │                          │                        │  + 1500            │
       │                          │                        │◄── OK ─────────────│
       │                          │                        │                    │
       │                          │ checkAndUpgradeTier(   │                    │
       │                          │   member, newBalance,  │                    │
       │                          │   shop.tiers)          │                    │
       │                          │                        │                    │
       │                          │ newBalance=6500 >= Gold.min_points=5000    │
       │                          │──upgradeTier(tx) ──────►│                   │
       │                          │                        │──UPDATE members────►│
       │                          │                        │  SET tier_id=goldId│
       │                          │                        │◄── OK ─────────────│
       │◄── {pointsEarned: 1500, tierUpgraded: true} ──────│                   │
```

---

## SD-09: Token Refresh Flow

**Mô tả:** Khi access token hết hạn, frontend tự động dùng refresh token để lấy token mới.

```
Browser (Axios Interceptor)    NestJS AuthController    AuthService    PrismaService    DB
           │                           │                    │               │             │
           │ [API request với access_token hết hạn]        │               │             │
           │──GET /items ──────────────►│                   │               │             │
           │                           │ JwtAuthGuard:      │               │             │
           │                           │ verify token → EXPIRED             │             │
           │◄── 401 {AUTH_TOKEN_EXPIRED│                   │               │             │
           │                           │                   │               │             │
           │ Axios response interceptor catches 401        │               │             │
           │ Queue pending requests    │                   │               │             │
           │                           │                   │               │             │
           │──POST /auth/refresh ──────►│                   │               │             │
           │  Cookie: refresh_token    │                   │               │             │
           │  X-CSRF-Token: <token>    │                   │               │             │
           │                           │──refresh() ───────►│               │             │
           │                           │                    │──findFirst ───►│             │
           │                           │                    │  WHERE token_hash=$1        │
           │                           │                    │  AND revoked_at IS NULL     │
           │                           │                    │  AND expires_at > NOW()     │
           │                           │                    │◄── token ─────│             │
           │                           │                    │               │             │
           │                           │                    │ [if not found/expired]      │
           │                           │◄── throw AUTH_TOKEN_EXPIRED ──────│             │
           │◄── 401 (force logout) ────│                   │               │             │
           │                           │                   │               │             │
           │                           │                   │ [if valid]    │             │
           │                           │                   │ Revoke old token            │
           │                           │                   │──UPDATE refresh_tokens ─────►│
           │                           │                   │  SET revoked_at=NOW()       │
           │                           │                   │◄── OK ────────────────────────│
           │                           │                   │               │             │
           │                           │                   │ Issue new pair:             │
           │                           │                   │ signJWT(newPayload)         │
           │                           │                   │ generateRefreshToken()      │
           │                           │                   │──INSERT new refresh_token ──►│
           │                           │◄── {accessToken, refreshToken} ───│             │
           │◄── 200 Set-Cookie (new tokens) ────────────────│               │             │
           │                           │                   │               │             │
           │ Retry original request với token mới          │               │             │
           │──GET /items ──────────────►│                   │               │             │
           │◄── 200 {ok, data} ────────│                   │               │             │
```

---

## SD-10: Inventory Transaction with Reconciliation

**Mô tả:** Tạo giao dịch kho và xử lý kiểm kê (reconciliation) khi số lượng thực tế khác hệ thống.

```
Admin Browser    NestJS InventoryController    InventoryService    PrismaService    DB
     │                    │                        │                    │              │
     │ Scenario: Kiểm kê thực tế 8 units, hệ thống có 10 units        │              │
     │                    │                        │                    │              │
     │──POST /inventory/reconcile ────────────────►│                    │              │
     │  {item_id, actual_quantity:8, reason:"Kiểm kho"} │              │              │
     │                    │                        │                    │              │
     │                    │ Guards validate         │                    │              │
     │                    │──reconcile(dto, shopId) ►│                   │              │
     │                    │                        │──BEGIN TRANSACTION ►│              │
     │                    │                        │──findItem(item_id)  │──SELECT ────►│
     │                    │                        │  FOR UPDATE         │◄── item ────│
     │                    │                        │                    │              │
     │                    │                        │ currentQty = 10    │              │
     │                    │                        │ actualQty  = 8     │              │
     │                    │                        │ delta = 8 - 10 = -2│              │
     │                    │                        │                    │              │
     │                    │                        │──INSERT inventory_transactions ──►│
     │                    │                        │  {type:'adjustment',│              │
     │                    │                        │   quantity:8,       │              │
     │                    │                        │   delta:-2,         │──INSERT ────►│
     │                    │                        │   resulting_quantity:8,           │
     │                    │                        │   reason:"Kiểm kho"}│◄── tx ──────│
     │                    │                        │                    │              │
     │                    │                        │──UPDATE items ───────►│──UPDATE ───►│
     │                    │                        │  SET quantity=8     │◄── OK ──────│
     │                    │                        │──COMMIT ─────────────►│              │
     │                    │◄── {transaction} ───────│                    │              │
     │◄── 201 {ok, data} ─│                        │                    │              │
     │                    │                        │                    │              │
     │ Scenario: Đảo ngược giao dịch lỗi          │                    │              │
     │                    │                        │                    │              │
     │──POST /inventory/:id/reverse ──────────────►│                    │              │
     │  {reason:"Nhập nhầm"} │                    │                    │              │
     │                    │──reverseTransaction(id) ►│                   │              │
     │                    │                        │──BEGIN TRANSACTION ►│              │
     │                    │                        │──findOriginalTx(id) │──SELECT ────►│
     │                    │                        │◄── originalTx ─────│◄── tx ──────│
     │                    │                        │                    │              │
     │                    │                        │ reverseDelta = -originalTx.delta  │
     │                    │                        │ newQty = currentItem.qty +        │
     │                    │                        │          reverseDelta              │
     │                    │                        │                    │              │
     │                    │                        │──INSERT inventory_transactions ──►│
     │                    │                        │  {type:'reversal',  │──INSERT ────►│
     │                    │                        │   reversal_of_id:id,│◄── new tx ──│
     │                    │                        │   delta:reverseDelta}             │
     │                    │                        │──UPDATE items qty ───►│──UPDATE ───►│
     │                    │                        │──COMMIT ─────────────►│              │
     │◄── 201 {ok, data}──│                        │                    │              │
```
