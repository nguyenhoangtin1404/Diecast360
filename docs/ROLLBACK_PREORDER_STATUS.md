# Rollback Plan: preorder ItemStatus

## Bối cảnh

Migration `20260522000000_add_preorder_item_status` đã chạy lệnh:
```sql
ALTER TYPE "ItemStatus" ADD VALUE 'preorder';
```

## Giới hạn kỹ thuật

`ALTER TYPE ... ADD VALUE` **không thể rollback** bằng down migration trên PostgreSQL.
PostgreSQL không có lệnh `DROP VALUE` từ enum đã có dữ liệu.

## Phương án A — Feature flag (nhanh, không cần DB change, khuyến nghị trước)

1. Deploy hotfix ẩn `preorder` khỏi status dropdown trong `ItemDetailPage.tsx` và `ItemsTable.tsx`
2. Xóa `preorder` khỏi `ALLOWED_STATUS_TRANSITIONS` trong `items.service.ts`
3. Kết quả: không có item mới nào có thể reach trạng thái `preorder`
4. Thời gian deploy: ~10 phút

## Phương án B — Data migration + type recreation (triệt để, cần maintenance window)

1. Chạy data migration: `UPDATE "Item" SET status = 'con_hang' WHERE status = 'preorder'`
2. `ALTER TABLE "Item" ALTER COLUMN status TYPE text`
3. `DROP TYPE "ItemStatus"`
4. `CREATE TYPE "ItemStatus" AS ENUM ('con_hang', 'giu_cho', 'da_ban')`
5. `ALTER TABLE "Item" ALTER COLUMN status TYPE "ItemStatus" USING status::"ItemStatus"`
6. Tạo Prisma migration mới phản ánh schema sau khi drop `preorder`
7. Ước tính downtime: 5–15 phút tuỳ table size

## Khuyến nghị

Áp **Phương án A** trước để mua thời gian điều tra, sau đó lên kế hoạch **Phương án B** có maintenance window được thông báo.

## Liên hệ

Nếu có item đang ở `preorder` status khi incident xảy ra, phải notify admin của shop trước khi force-migrate về `con_hang`.
