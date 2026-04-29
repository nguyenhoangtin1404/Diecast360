# Phase 16 Context: Trang chủ / catalog công khai theo từng shop (multi-tenant)

**Gathered:** 2026-04-29  
**Status:** Ready for execution (plans below)  
**Source:** Gap giữa Phase 14 (cô lập tenant admin/API) và trải nghiệm public hiện tại

## Vấn đề hiện trạng

- `GET /public/items` và `GET /public/items/:id` dùng `OptionalJwtAuthGuard` và chỉ lọc theo `shop_id` khi JWT có `active_shop_id`; **khách không đăng nhập** không gửi tenant → `PublicService` trả về **tất cả** item public trên deployment (không cô lập theo shop).
- Trang catalog (`PublicCatalogPage`) gọi API **không** truyền `shop_id` (khác với `PreOrdersPage` đã có `?shop_id=` + `sanitizeShopIdQueryParam`).
- Model `Shop` đã có `slug` unique — phù hợp URL thân thiện và link chia sẻ.

## Quyết định đã chốt (locked)

1. **Ngữ cảnh shop trên public** phải xác định được **mà không cần** người xem đăng nhập; ưu tiên **URL có thể chia sẻ** (path hoặc query — executor chọn một convention và giữ nhất quán trong phase).
2. **Định danh shop** chấp nhận **UUID** (`shop.id`) và/hoặc **`slug`** (`Shop.slug`); shop `is_active: false` → không phục vụ catalog public (404 hoặc 403 — chốt một mã và ghi contract).
3. **Ưu tiên explicit context hơn JWT** cho public: nếu request có `shop_id` (hoặc path slug) hợp lệ thì **bỏ qua** `active_shop_id` từ JWT cho việc lọc catalog/detail (tránh admin đang switch shop làm lệch trang public mà họ mở trong cùng trình duyệt).
4. **Backward compatibility:** build single-tenant hoặc link cũ không có shop — hỗ trợ **`VITE_PUBLIC_CATALOG_SHOP_ID`** (hoặc tên env đồng bộ với convention preorder) làm default; nếu multi-shop production và thiếu context → UX rõ ràng (hướng dẫn URL / chọn shop), không âm thầm gộp dữ liệu nhiều shop.

## Claude's discretion

- Chọn `/s/:slug` vs `/?shop_id=` vs `/shop/:slug` — cân nhắc SEO, độ dài URL, và sửa ít nhất `Layout`/nav links.
- Có cần endpoint `GET /public/shops/:slug` chỉ trả `{ id, name, slug }` cho header trang hay dùng metadata từ list — tùy executor.
- Cache HTTP/CDN cho response public có `shop_id` — optional trong phase này.

## Deferred (không làm trong phase 16)

- Trang landing liệt kê **tất cả** shop trên platform (marketplace directory).
- Subdomain per tenant (`shop-a.example.com`) — chỉ ghi note trong RESEARCH nếu cần roadmap sau.
