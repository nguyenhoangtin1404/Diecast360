# Issue #58 - Mobile Responsive UI

## Goal
Cap nhat giao dien theo huong mobile-first, khong vo layout tren man hinh nho.

## Scope
- Admin: `ItemsPage`, `ItemDetailPage`, `FacebookPostsPage`, `CategoriesPage`.
- Public: `PublicCatalogPage`, `PublicItemDetailPage`.

## Tasks
1. Audit cac diem vo layout mobile (table, form 2 cot, nut hanh dong).
2. Chuan hoa breakpoint va spacing.
3. Chuyen table quan trong sang card/list tren mobile.
4. Tang hit-area cho button va thao tac touch.
5. Test tay tren 375x667, 390x844, 768x1024.

## Deliverables
- FE patch responsive cho cac page chinh.
- Checklist test mobile pass.

## Done Criteria
- Khong co horizontal scroll ngoai y muon.
- Luong CRUD item + media + social selling dung tren mobile.
