# Issue #57 - Quantity and Custom Attributes

## Goal
Them so luong ton kho va tap thuoc tinh dac biet cho tung san pham.

## Scope
- DB schema, API DTO, service logic, admin UI.

## Tasks
1. Them `quantity` vao model san pham (>= 0).
2. Them truong metadata mo rong (JSON) cho thuoc tinh dac biet.
3. Cap nhat create/update/get/list API.
4. Cap nhat ItemDetail UI de sua quantity va attributes.
5. Them migration va script map du lieu cu.
6. Them unit test cho validation quantity/attributes.

## Deliverables
- Migration DB.
- Backend + frontend patch.
- Test cover cho validation chinh.

## Done Criteria
- Co the tao/sua item voi quantity + attributes.
- Gia tri quantity khong am.
- Du lieu hien thi dung tren list/detail.
