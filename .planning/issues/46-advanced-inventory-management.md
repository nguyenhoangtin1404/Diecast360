# Issue #46 - Advanced Inventory Management

## Goal
Mo rong quan ly kho theo giao dich thay vi chi luu so luong tinh.

## Scope
- Inventory transactions, audit trail, admin UI lich su kho.

## Tasks
1. Tao bang `inventory_transactions`.
2. Xay logic nhap/xuat/dieu chinh ton kho.
3. Dam bao khong ton kho am (hoac co flag va ly do).
4. Them API lich su giao dich theo item.
5. Them UI tab "Lich su kho" trong item detail.
6. Them test cho transaction va race condition co ban.

## Deliverables
- Model + service + API inventory.
- UI theo doi bien dong kho.

## Done Criteria
- Moi thay doi ton kho co ban ghi audit.
- Truy vet duoc ai/ly do/thoi diem thay doi.
