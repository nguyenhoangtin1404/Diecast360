# Phase 14 Context: Multi-Tenant Shop Management

## Business Objective
Với Diecast360, nền tảng cần hỗ trợ nhiều cửa hàng mô hình (Shop) hoạt động chung trên cùng một hệ thống nhưng dữ liệu tồn kho, hình ảnh và danh mục của mỗi cửa hàng phải hoàn toàn riêng biệt. 

## Architectural Decisions
- **Tenant Isolation**: Sử dụng `Shop` model làm tenant context. Mọi `Item` đều gắn với 1 `shop_id`.
- **RBAC**: Định nghĩa `UserShopRole` nối n-n giữa `User` và `Shop`, sử dụng 2 role: `super_admin` và `shop_admin`.
- **JWT + Cookie Context**: `active_shop_id` được quản lý ngầm qua JWT payload thay vì truyền qua HTTP Headers hay lưu ở LocalStorage phía Client, tránh giả mạo (spoofing).
- **NestJS Guards**: Sử dụng `TenantGuard` để extract `active_shop_id` từ Request (đã đi qua JwtStrategy) rồi inject `req.tenantId` cho các Service (ItemsService, ImagesService) query DB một cách an toàn.

## Security Constraints
Zero cross-tenant data leakage. Các endpoint CRUD Items, Images, Spinners không bao giờ được phép modify hay access data của shop khác. Super-Admin module (`/admin/shops`) được bảo vệ khắt khe bằng `@Roles('super_admin')`.
