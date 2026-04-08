# Diecast360 - Plan Cho Toan Bo Issues Da Gui

Ngay lap: 2026-03-04

## 1) Tong quan uu tien va thu tu

| Thu tu | Issue | Muc tieu |
|---|---|---|
| 1 | #58 - Responsive mobile | On dinh UI tren mobile truoc khi mo rong tinh nang |
| 2 | #57 - So luong + thuoc tinh dac biet | Chuan hoa du lieu san pham/kho |
| 3 | #13 - Quan ly Pre-Order | Them luong dat truoc va theo doi trang thai |
| 4 | #46 - Quan ly kho mo rong | Xay module kho cho shop quy mo lon hon |
| 5 | #49 - Bao cao thong ke | Co dashboard KPI ban hang/kho |
| 6 | #48 - Diem + hoi vien | Mo rong loyalty |
| 7 | #44 - Playwright automation | Tu dong hoa test E2E cho cac luong chinh |
| 8 | #33 - Playwright hardening/coverage | Tang do bao phu test + CI gate |

Ghi chu:
- #44 va #33 deu lien quan Playwright. Tach 2 giai doan: setup co ban -> mo rong coverage + chat luong CI.

## 2) Phu thuoc giua cac issue

- #58 la nen tang UI, can xong som de giam no UI debt.
- #57 la nen tang data model cho #46, #49, #13.
- #13 + #46 tao du lieu van hanh de #49 thong ke chinh xac.
- #48 su dung du lieu giao dich/khach hang, co the bat dau sau #13.
- #44 bat dau song song tu som, #33 la buoc nang cao sau khi cac luong chinh on.

## 3) Ke hoach chi tiet tung issue

## Issue #58 - Cap nhat giao dien responsive mobile

Muc tieu:
- Toan bo man admin chinh va public page dung tot tren <=768px.

Cong viec:
- Audit layout cac page: `ItemsPage`, `ItemDetailPage`, `FacebookPostsPage`, catalog public.
- Chuan hoa breakpoints, spacing, typography, table -> card/list tren mobile.
- Fix thao tac touch (button hit-area, horizontal overflow, sticky action).
- Test tay tren kich thuoc 390x844, 375x667, 768x1024.

DoD:
- Khong con horizontal scroll khong mong muon.
- Luong CRUD item + upload media + social selling dung tren mobile.

---

## Issue #57 - Them so luong va thuoc tinh dac biet cho san pham

Muc tieu:
- San pham co `quantity` + metadata linh hoat.

Cong viec:
- DB: them cot `quantity` (>=0), schema thuoc tinh mo rong (JSONB).
- API: cap nhat DTO create/update/get/list.
- UI: form nhap so luong + khu vuc thuoc tinh dac biet (key-value).
- Validation: quantity khong am, gioi han key/value hop ly.
- Migration + seed/update script du lieu cu.

DoD:
- Co the tao/sua san pham voi quantity va attributes.
- List/filter/sort theo quantity co ban.

---

## Issue #46 - Quan ly kho mo rong cho shop mo hinh

Muc tieu:
- Quan ly bien dong kho (nhap/xuat/dieu chinh), khong chi ton tai so luong tinh.

Cong viec:
- Tao bang giao dich kho: `inventory_transactions`.
- Logic service: nhap kho, ban ra, dieu chinh, rollback theo giao dich.
- UI: tab Lich su kho trong chi tiet item + bo loc theo ngay/loai.
- Rule: khong de ton kho am (hoac co co che cho phep + ly do).

DoD:
- Moi thay doi so luong de lai audit trail.
- Co the truy vet ly do thay doi ton kho.

---

## Issue #13 - Quan ly danh sach mo hinh Pre-Order

Muc tieu:
- Quan ly san pham pre-order va trang thai don dat truoc tren ca admin va public mobile.

Cong viec:
- DB: model `pre_orders` + state machine transition ro rang.
- API: CRUD pre-order, cap nhat coc, han giao du kien, public pre-order list, public my-orders, admin management summary.
- UI public mobile: `Mo hinh Dat truoc`, `Don hang cua toi`.
- UI admin mobile: `Tao Pre-Order Moi`, `Quan ly Pre-order`.
- Lien ket item ton kho/quantity sau khi pre-order chuyen thanh don that.

DoD:
- Theo doi duoc so luong dat truoc, coc va tien do giao.
- Khong xung dot voi luong item thong thuong.
- Bo 4 man hinh mobile MVP duoc deliver day du theo baseline.

---

## Issue #49 - Chuc nang bao cao thong ke

Muc tieu:
- Dashboard KPI cho quan ly kho va ban hang.

Cong viec:
- Xac dinh KPI: ton kho, toc do xoay vong, item sap het hang, pre-order pending, bai dang FB.
- API aggregate theo ngay/tuan/thang.
- UI dashboard: chart + card + bo loc thoi gian.
- Toi uu query/index.

DoD:
- Dashboard tai duoc trong nguong hieu nang chap nhan.
- So lieu khop voi nguon giao dich kho + pre-order.

---

## Issue #48 - Quan ly diem va hoi vien

Muc tieu:
- Co he thong tier membership va tich diem co ban.

Cong viec:
- DB: `members`, `member_points_ledger`, `membership_tiers`.
- Rule engine: cong/tru diem, nang/hạ hang, lich su diem.
- UI: trang thanh vien + chi tiet diem + thao tac dieu chinh admin.
- API bao mat thao tac diem (role + audit).

DoD:
- Moi bien dong diem co ledger.
- Co the tra cuu diem va hang cua thanh vien moi luc.

---

## Issue #44 - Xay dung Automation Test bang Playwright (Phase 1)

Muc tieu:
- Dat bo E2E nen tang cho cac luong quan trong.

Cong viec:
- Setup Playwright + config env + fixtures.
- Viet smoke tests:
  - Login admin
  - CRUD item co ban
  - Upload image co ban
  - Public catalog xem duoc item public
- Tich hop vao CI (job rieng, non-blocking luc dau).

DoD:
- Chay local va CI duoc.
- Co report artifact (trace/video/screenshot khi fail).

---

## Issue #33 - Playwright hardening va mo rong coverage (Phase 2)

Muc tieu:
- Nang cap E2E thanh gate chat luong cho release.

Cong viec:
- Them test cho:
  - Spinner 360 upload/reorder
  - Social selling (AI gen + save link FB)
  - Responsive smoke (mobile viewport)
- Retry strategy + test data isolation.
- Chuyen job Playwright thanh required check tren branch chinh.

DoD:
- Flaky rate thap.
- E2E tro thanh quality gate cho PR quan trong.

## 4) De xuat phan ky implementation

Phase A (1-2 sprint):
- #58, #57, #44

Phase B (1-2 sprint):
- #13, #46, #33

Phase C (1-2 sprint):
- #49, #48

## 5) Uu tien giao choi boi team

- FE-heavy: #58, #13 (public/admin mobile UI), mot phan #49, #48.
- BE/DB-heavy: #57, #13 (schema/API), #46.
- QA/DevEx-heavy: #44, #33.

## 6) Risk chinh can quan ly

- Drift schema khi lam dong thoi #57 + #46 + #13.
- Flaky E2E neu moi truong test khong on dinh.
- KPI sai neu mapping transaction kho khong chat.

Giam thieu:
- Chot migration sequence.
- Bat buoc test fixture/seed cho E2E.
- Validate KPI bang bo du lieu doi chieu mau.
