---
title: Wireframe Descriptions — Diecast360
version: 1.0.0
date: 2026-05-22
author: UI/UX Design Team
group: Group 4 — Design
---

# Wireframe Descriptions — Diecast360

Tài liệu mô tả chi tiết layout và hành vi của từng màn hình. Dùng làm tài liệu tham chiếu cho designer (Figma/wireframe) và developer (implementation guide).

---

## PHẦN A — ADMIN SCREENS

---

### A1. Login Page

#### Layout

```
┌─────────────────────────────────────────────────┐
│                                                 │
│                  (full screen)                  │
│           bg-gradient: slate-900 → indigo-950   │
│                                                 │
│         ┌───────────────────────────┐           │
│         │  ⬡  Diecast360            │           │
│         │  "Quản lý shop của bạn"  │           │
│         │                           │           │
│         │  [Email         ]         │           │
│         │  [Mật khẩu      ] [👁]    │           │
│         │                           │           │
│         │  ☐ Nhớ đăng nhập          │           │
│         │                           │           │
│         │  [  Đăng nhập   ]         │           │
│         │                           │           │
│         │  ─── hoặc ───             │           │
│         │  Quên mật khẩu?           │           │
│         └───────────────────────────┘           │
│                                                 │
│         © 2026 Diecast360                       │
└─────────────────────────────────────────────────┘
```

#### Components Used
- Card: `bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm`
- Logo: centered, `h-10`
- Email input: `type="email"` với icon envelope bên trái
- Password input: `type="password"` + toggle show/hide icon
- Checkbox: "Nhớ đăng nhập"
- Submit button: `btn-primary w-full lg`

#### Interaction Notes
- Enter key submit form
- Submit disable button + hiện spinner khi đang xử lý
- Redirect đến `/admin/dashboard` sau login thành công

#### Error State

```
│  ┌─ Alert error ─────────────────────────────┐  │
│  │  ✕  Email hoặc mật khẩu không đúng.       │  │
│  └───────────────────────────────────────────┘  │
│  [Email    ] ← border-red-300                    │
│  [Mật khẩu ] ← border-red-300                   │
```

#### Loading State
- Button: `disabled` + spinner icon + text "Đang đăng nhập..."

#### Responsive
- Mobile: full-screen card, `p-6`
- Desktop: card centered, `max-w-sm`

---

### A2. Dashboard

#### Layout

```
┌──────────┬────────────────────────────────────────┐
│ SIDEBAR  │  HEADER                                │
│  w-64    │  [Shop Name]           [Avatar ▾]      │
│          ├────────────────────────────────────────┤
│  ⬡ Logo  │  CONTENT                               │
│          │                                        │
│  📊 Dashboard  │  Chào buổi sáng, Minh! 👋        │
│  📦 Items      │                                  │
│  🛒 Pre-orders │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│  📋 Inventory  │  │ KPI  │ │ KPI  │ │ KPI  │ │ KPI  │
│  👥 Members    │  │ Card │ │ Card │ │ Card │ │ Card │
│  🏅 Tiers      │  └──────┘ └──────┘ └──────┘ └──────┘
│  ⚙️ Cài đặt   │                                  │
│          │  ┌─────────────────────────────────┐  │
│          │  │  Biểu đồ doanh thu 30 ngày       │  │
│          │  │  (Line chart)                    │  │
│          │  └─────────────────────────────────┘  │
│          │                                        │
│  ──────  │  ┌────────────────┐ ┌───────────────┐ │
│  Avatar  │  │ Pre-orders     │ │ Items sắp hết  │ │
│  Logout  │  │ gần đây        │ │ hàng           │ │
│          │  └────────────────┘ └───────────────┘ │
└──────────┴────────────────────────────────────────┘
```

#### KPI Cards (4 cards, grid-cols-4)

| Card | Icon | Metric | Delta |
|---|---|---|---|
| Tổng Items | `CubeIcon indigo` | 248 | +12 tháng này |
| Pre-orders đang mở | `ShoppingCartIcon amber` | 37 | +5 hôm nay |
| Doanh thu tháng | `BanknotesIcon green` | 12.4M₫ | +8% vs tháng trước |
| Thành viên mới | `UserPlusIcon blue` | 14 | 30 ngày qua |

#### Quick Actions (row of buttons)
- [+ Thêm Item] [+ Nhập hàng] [Xem báo cáo]

#### Chart Area
- Line chart: trục X = ngày (30 ngày), trục Y = doanh thu
- Toggle: "Pre-orders" / "Doanh thu" / "Items mới"
- Height: `h-64`

#### Bottom Row (2 columns)
- **Pre-orders gần đây**: List 5 pre-orders mới nhất (item name, member, status chip, thời gian)
- **Items sắp hết hàng**: List items có `quantity ≤ 3`, link "Nhập hàng"

#### Responsive
- Mobile: sidebar collapse → hamburger menu; KPI cards `grid-cols-2`; chart full-width; bottom row stack
- Tablet: sidebar `w-16` (icon only); KPI `grid-cols-2`

#### Loading State
- KPI cards: skeleton (`animate-pulse`)
- Chart: placeholder với `bg-slate-100 rounded animate-pulse h-64`

---

### A3. Items List

#### Layout

```
┌──────────┬────────────────────────────────────────────┐
│ SIDEBAR  │  HEADER                                    │
│          ├────────────────────────────────────────────┤
│          │  Items                    [+ Thêm item]    │
│          │                                            │
│          │  [🔍 Tìm theo tên, thương hiệu...]         │
│          │                                            │
│          │  [Status ▾] [Thương hiệu ▾] [Công khai ▾] │
│          │  [Xe ▾]    [Scale ▾]    [Xoá filter]       │
│          │                                            │
│          │  ┌──────────────────────────────────────┐  │
│          │  │ □ │ Thumb │ Tên ↕ │ Brand │ Status │ 360°│ Công khai │ Giá ↕ │ Tồn │ ⋯ │
│          │  ├──┼───────┼───────┼───────┼────────┼────┼───────────┼───────┼─────┼───┤
│          │  │ □ │  🖼   │ Supra │ HW    │ Còn hàng│ ✓  │  toggle  │ 850k │  5  │ ⋯ │
│          │  │ □ │  🖼   │ Civic │ M2    │ Giữ chỗ │    │  toggle  │ 320k │  0  │ ⋯ │
│          │  └──────────────────────────────────────┘  │
│          │                                            │
│          │  [◀ Trước] 1 2 3 ... 13 [Tiếp ▶]          │
│          │  Hiển thị 1–20 của 248                     │
└──────────┴────────────────────────────────────────────┘
```

#### Filter Bar Components
- Search: debounce 300ms, clear button (×) khi có giá trị
- Status filter: multi-select dropdown (con_hang, giu_cho, da_ban)
- Thương hiệu (brand): multi-select dropdown
- Công khai: radio group [Tất cả | Công khai | Riêng tư]
- Xe (car_brand): searchable dropdown
- Scale: multi-select

#### Table Columns (sortable: *)

| Col | Width | Sortable | Notes |
|---|---|---|---|
| Checkbox | 36px | — | Bulk select |
| Thumbnail | 56px | — | 1:1 cover image, `rounded` |
| Tên sản phẩm | flex | ✓ | `font-medium`, truncate |
| Thương hiệu | 120px | ✓ | text-sm |
| Trạng thái | 120px | — | Status badge |
| 360° | 48px | — | `✓` nếu có spinner |
| Công khai | 100px | — | Toggle switch |
| Giá | 100px | ✓ | `font-mono`, right-align |
| Tồn kho | 72px | ✓ | Red if 0 |
| Actions | 80px | — | Edit / … menu |

#### Row Actions (dropdown "…")
- Sửa → `/admin/items/:id/edit`
- Xem chi tiết → `/admin/items/:id`
- Nhân bản
- Xoá (confirm dialog)

#### Bulk Actions (hiện khi chọn ≥ 1 row)
```
│  3 items đã chọn   [Đổi status ▾]  [Xoá]  [Bỏ chọn]  │
```

#### Empty State
```
│         📦                              │
│   Chưa có sản phẩm nào                  │
│   Hãy thêm sản phẩm đầu tiên            │
│          [+ Thêm Item]                  │
```

#### Loading State
- Skeleton rows: 10 rows với `animate-pulse`

#### Responsive
- Mobile: ẩn các cột phụ, chỉ giữ Thumbnail + Tên + Status + Actions
- Horizontal scroll cho table trên tablet nhỏ

---

### A4. Item Detail Page

#### Layout (Tabs)

```
┌──────────┬────────────────────────────────────────────────┐
│ SIDEBAR  │  Breadcrumb: Items / Toyota Supra MK4          │
│          │                                                │
│          │  Toyota Supra MK4 Orange        [Sửa] [Xoá]   │
│          │  Hot Wheels · 1:64 · Còn hàng                  │
│          │                                                │
│          │  [Thông tin] [Ảnh] [Spinner 360°] [Facebook]   │
│          ├────────────────────────────────────────────────┤
│          │  TAB CONTENT (xem bên dưới)                    │
└──────────┴────────────────────────────────────────────────┘
```

#### Tab: Thông tin

```
┌────────────────────────────┬──────────────────────────────┐
│  LEFT — Form fields         │  RIGHT — Preview card        │
│                            │                              │
│  Tên: [Toyota Supra MK4]   │  ┌──────────────────────┐   │
│  Thương hiệu: [Hot Wheels] │  │    [Cover image]     │   │
│  Xe: [Toyota]              │  │    aspect-square     │   │
│  Mẫu: [Supra]              │  └──────────────────────┘   │
│  Tỉ lệ: [1:64]             │                              │
│  Tình trạng: [Mới]         │  Toyota Supra MK4            │
│  Giá: [850,000]            │  Hot Wheels / 1:64           │
│  Số lượng: [5]             │  850.000₫                    │
│  Status: [Còn hàng ▾]      │  ● Còn hàng                  │
│  Công khai: [toggle ON]    │                              │
│                            │  [Copy link] [Copy caption]  │
│  Mô tả:                    │                              │
│  [textarea 4 rows]         │                              │
│                            │                              │
│  Ghi chú nội bộ:           │                              │
│  [textarea 3 rows]         │                              │
│                            │                              │
│  Nội dung FB:              │                              │
│  [textarea 5 rows]         │                              │
│                            │                              │
│  [Lưu thay đổi]  [Huỷ]     │                              │
└────────────────────────────┴──────────────────────────────┘
```

#### Tab: Ảnh

```
│  [+ Tải ảnh lên]                              │
│                                               │
│  ┌───┬───┬───┬───┐                            │
│  │🖼 ⭐│🖼  │🖼  │🖼  │  ← grid-cols-4 gap-3    │
│  │cover│   │   │   │                          │
│  └───┴───┴───┴───┘                            │
│                                               │
│  [Drop zone: kéo thả ảnh vào đây]            │
│                                               │
│  Mỗi ảnh:                                     │
│  [⭐ Cover] [🗑 Xoá]  ← hover actions         │
│  Drag handle (≡) để sắp xếp lại               │
```

- Cover star: click để set làm cover → toast "Đã cập nhật ảnh bìa"
- Xoá: confirm "Xoá ảnh này?" → xoá ngay
- Reorder: drag-and-drop (react-beautiful-dnd hoặc @dnd-kit)
- Max: unlimited (upload limit do server)

#### Tab: Spinner 360°

```
│  ┌──────────────────────────────────────────────────┐  │
│  │           PREVIEW VIEWER (Spinner360)             │  │
│  │           aspect-square max-w-sm mx-auto          │  │
│  │           "Kéo để xoay" hint                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Khung hình: 24/24  [Set mặc định: Frame 12]           │
│                                                        │
│  [+ Upload frames]  [Xoá tất cả]                       │
│                                                        │
│  ┌──┬──┬──┬──┬──┬──┐                                   │
│  │01│02│03│04│05│06│  ← grid-cols-6 thumbnails          │
│  │  │  │  │★ │  │  │  ← ★ = default frame              │
│  └──┴──┴──┴──┴──┴──┘                                   │
│  (drag handles để sắp xếp lại)                         │
```

- Upload frames: chấp nhận bulk upload, tự sort theo tên file
- Default frame: frame hiển thị khi viewer load lần đầu
- Xoá frame: click frame → panel actions bên phải

#### Tab: Facebook

```
│  Posts Facebook liên kết                               │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │  📎  https://fb.com/...                         │   │
│  │      "Toyota Supra MK4 đẹp quá! 🔥"           │   │
│  │      22/05/2026 · [Mở link] [Xoá]              │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  [+ Thêm link Facebook]                                │
```

#### Action Buttons (header)
- **Sửa**: mở form edit (inline hoặc trang edit riêng)
- **Xoá**: confirm dialog → xoá → redirect về list
- **Copy Caption**: copy `fb_post_content` vào clipboard → toast
- **Copy Link**: copy public URL → toast

#### Responsive
- Tab headers: scroll horizontal trên mobile
- Tab Thông tin: single column trên mobile, 2 cột trên desktop
- Tab Ảnh: `grid-cols-2` mobile, `grid-cols-4` desktop

---

### A5. Pre-Orders List

#### Layout

```
│  Pre-orders                          [Export CSV]    │
│                                                      │
│  [Tất cả (89)] [Chờ XN (12)] [Chờ hàng (25)]        │
│  [Đã về (10)] [Đã TT (30)] [Đã huỷ (8)] [Hoàn (4)]  │
│                                                      │
│  [🔍 Tìm theo tên KH, item...]   [Ngày ▾]            │
│                                                      │
│  ┌─────────────────────────────────────────────┐     │
│  │ # │ Item │ Khách hàng │ SL │ Giá │ Status │ TG │ ⋯│
│  ├───┼──────┼────────────┼────┼─────┼────────┼────┼──┤
│  │001│Supra │ Minh Tuấn  │ 1  │850k │ Chờ XN │ 2h │ ⋯│
│  └─────────────────────────────────────────────┘     │
```

#### Status Tab Bar
- Active tab: `border-b-2 border-indigo-600 text-indigo-600`
- Badge count: `ml-1 px-1.5 py-0.5 text-xs bg-slate-100 rounded-full`

#### Row Actions ("…" menu)
- Xem chi tiết
- **Chuyển trạng thái**: sub-menu với các transitions hợp lệ
  - PENDING_CONFIRMATION → [Chờ hàng về] [Huỷ]
  - WAITING_FOR_GOODS → [Hàng đã về] [Huỷ]
  - ARRIVED → [Đã thanh toán] [Huỷ]
  - PAID → [Hoàn tiền]
  - Terminal states: không hiện action chuyển status

#### Pre-Order Detail (slide-over panel bên phải)

```
┌────────────────────────────────────────┐
│  ✕  Pre-order #DC-PO-001              │
├────────────────────────────────────────┤
│  📦 Toyota Supra MK4 Orange            │
│     [Ảnh thumb]  Hot Wheels · 850k    │
├────────────────────────────────────────┤
│  👤 Thông tin khách hàng               │
│     Minh Tuấn · 0912345678            │
│     minh@email.com                    │
│     Địa chỉ: Q1, TP.HCM               │
├────────────────────────────────────────┤
│  📋 Chi tiết đặt hàng                  │
│     Số lượng: 1 · Giá: 850.000₫       │
│     Phí ship: 30.000₫                  │
│     Tổng cộng: 880.000₫               │
│     Ghi chú: "..."                    │
├────────────────────────────────────────┤
│  🔄 Lịch sử trạng thái                 │
│     ● Chờ xác nhận (22/05 10:00)      │
│     ● Chờ hàng về   (22/05 10:15)     │
│     ○ ...                             │
├────────────────────────────────────────┤
│  [Chuyển: Hàng đã về ▾]  [Huỷ order] │
└────────────────────────────────────────┘
```

---

### A6. Inventory

#### Layout

```
│  Quản lý kho                                         │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │  FORM TẠO GIAO DỊCH                             │ │
│  │                                                 │ │
│  │  Item: [🔍 Tìm item...              ]            │ │
│  │                                                 │ │
│  │  Loại: [● Nhập hàng] [○ Xuất kho] [○ Điều chỉnh]│ │
│  │                                                 │ │
│  │  Số lượng: [____]   Tồn hiện tại: 5            │ │
│  │  Lý do: [________________________]              │ │
│  │  Ghi chú: [_______________________]             │ │
│  │                                                 │ │
│  │  [  Xác nhận giao dịch  ]                       │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  LỊCH SỬ GIAO DỊCH                 [Export ▾]        │
│  [🔍 Tìm item...]  [Loại ▾]  [Ngày ▾]               │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ TG │ Item │ Loại │ SL │ Trước │ Sau │ Người │   │
│  ├────┼──────┼──────┼────┼───────┼─────┼───────┤   │
│  │22/5│Supra │ Nhập │+10 │  5    │ 15  │ Admin │   │
│  └──────────────────────────────────────────────┘   │
```

#### Transaction Types
- **Nhập hàng** (stock_in): positive delta, tăng quantity
- **Xuất kho** (stock_out): negative delta, không áp dụng cho da_ban
- **Điều chỉnh** (adjustment): set số lượng tuyệt đối, nhập lý do bắt buộc

#### Validation
- Số lượng > 0 với stock_in
- Không xuất kho quá số tồn hiện tại
- Item da_ban: chỉ cho phép điều chỉnh về 0

---

### A7. Members

#### Members List

```
│  Thành viên                           [+ Thêm thủ công]  │
│                                                           │
│  [🔍 Tìm theo tên, email, SĐT]   [Tier ▾]                │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Tên │ Liên hệ │ Tier │ Điểm │ Pre-orders │ Ngày đăng │ │
│  ├─────┼─────────┼──────┼──────┼────────────┼──────────┤ │
│  │ Minh│ 091...  │ ★Gold│ 2500 │     12     │ 01/01/26  │ │
│  └────────────────────────────────────────────────────┘  │
```

#### Member Detail (slide-over)

```
┌──────────────────────────────────────────┐
│  ✕  Nguyễn Minh Tuấn                    │
│     ★ Gold · 2,500 điểm                 │
├──────────────────────────────────────────┤
│  THÔNG TIN CÁ NHÂN                       │
│  Email:  minh@email.com                  │
│  SĐT:    0912 345 678                    │
│  Ngày sinh: 14/04/1990                   │
│  Địa chỉ: Q1, TP.HCM                    │
├──────────────────────────────────────────┤
│  LỊCH SỬ ĐIỂM                            │
│  Tổng: 2,500 điểm                        │
│  ┌────────────────────────────────────┐  │
│  │ TG │ Mô tả │ Delta │ Số dư │ Ref  │  │
│  │22/5│Pre-order PAID│+250│2500│#001 │  │
│  │15/5│Pre-order PAID│+180│2250│#002 │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  PRE-ORDERS (12 đơn)                     │
│  [3 đang mở] [9 đã hoàn thành]          │
└──────────────────────────────────────────┘
```

---

### A8. Shop Settings

#### Layout (Tabs)

```
│  Cài đặt Shop                                 │
│                                               │
│  [Liên hệ] [Giao diện] [Chương trình điểm]   │
│                                               │
│  ─── TAB: LIÊN HỆ ───                         │
│  Tên shop: [Diecast Heaven]                   │
│  Địa chỉ: [Q1, TP.HCM]                       │
│  SĐT: [028 1234 5678]                         │
│  Facebook: [https://fb.com/...]               │
│  Zalo: [...]                                  │
│  Giờ mở cửa: [...]                            │
│                                               │
│  ─── TAB: GIAO DIỆN ───                       │
│  Logo: [Upload zone] [Preview]                │
│  Favicon: [Upload zone] [Preview]             │
│  Màu chủ đạo: [Color picker]                  │
│  Tiêu đề trang: [...]                         │
│  Mô tả shop: [textarea]                       │
│                                               │
│  ─── TAB: CHƯƠNG TRÌNH ĐIỂM ───               │
│  Tỉ lệ điểm: [1000]₫ = [1] điểm             │
│  Tier Bronze: từ [0] đến [999] điểm          │
│  Tier Silver: từ [1000] đến [4999] điểm      │
│  Tier Gold: từ [5000] điểm trở lên           │
│                                               │
│  [Lưu cài đặt]                                │
```

---

### A9. Platform Admin — Shops

#### Layout

```
│  [Platform] Quản lý Shops          [+ Tạo shop]  │
│                                                  │
│  [🔍 Tìm shop...]   [Trạng thái ▾]               │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ Shop │ Owner │ Items │ Pre-orders │ Status │ ⋯│ │
│  ├──────┼───────┼───────┼────────────┼────────┼──┤ │
│  │ DC.. │ Minh  │  248  │     37     │ ● Active│⋯│ │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Row actions: [Xem shop] [Đăng nhập as] [Deactivate] │
```

---

## PHẦN B — PUBLIC SCREENS

---

### B1. Catalog Page

#### Layout

```
┌──────────────────────────────────────────────────────────┐
│  TOP NAV                                                 │
│  [Logo + Shop name]  Catalog  Pre-orders  Liên hệ  [☰]  │
├──────────────────────────────────────────────────────────┤
│  HERO SECTION                                            │
│  bg-gradient: indigo-950 → slate-900                     │
│  ┌──────────────────────────────────────────────────┐    │
│  │     [Shop Logo]                                  │    │
│  │     Diecast Heaven                               │    │
│  │     "Chuyên mô hình xe 1:64 chất lượng cao"     │    │
│  └──────────────────────────────────────────────────┘    │
├──────────────────────────────────────────────────────────┤
│  FILTER BAR (sticky)                                     │
│  [🔍 Tìm sản phẩm...]   [Filter ▾]   Sắp xếp: [Mới ▾]  │
│  Active filters: [Hot Wheels ✕] [1:64 ✕]                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌───────┬─────────────────────────────────────────┐    │
│  │FILTER │  ITEM GRID                               │    │
│  │SIDEBAR│                                          │    │
│  │       │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │    │
│  │Status │  │ Card │ │ Card │ │ Card │ │ Card │   │    │
│  │□ Còn  │  └──────┘ └──────┘ └──────┘ └──────┘   │    │
│  │□ Giữ  │                                          │    │
│  │□ Hết  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │    │
│  │       │  │ Card │ │ Card │ │ Card │ │ Card │   │    │
│  │Brand  │  └──────┘ └──────┘ └──────┘ └──────┘   │    │
│  │□ HW   │                                          │    │
│  │□ M2   │  [Xem thêm / Pagination]                 │    │
│  │□ MBX  │                                          │    │
│  │       │                                          │    │
│  │Scale  │                                          │    │
│  │□ 1:64 │                                          │    │
│  │□ 1:43 │                                          │    │
│  └───────┴─────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

#### Item Card (Public)

```
┌─────────────────────┐
│  [Cover image 1:1]  │
│  [360° badge]       │
│  [Status badge]     │
├─────────────────────┤
│  Hot Wheels / 1:64  │
│  Toyota Supra MK4   │
│  850.000₫           │
└─────────────────────┘
```

#### Filter Sidebar (desktop)
- Hiển thị: `lg:block` (ẩn trên mobile)
- Width: `w-56 flex-shrink-0`
- Position: sticky top

#### Filter Mobile (Bottom Sheet)
- Trigger: nút [Filter ▾] trên mobile
- Slide-up panel từ dưới màn hình
- Height: `70vh max-h-[80vh]`
- Overlay backdrop

#### Empty State
```
│       📭                              │
│   Không tìm thấy sản phẩm nào        │
│   Thử thay đổi bộ lọc hoặc           │
│   tìm kiếm với từ khoá khác          │
│   [Xoá filter]                       │
```

#### Loading State
- Skeleton cards: 8 cards, `animate-pulse`

#### Responsive Behavior
| Breakpoint | Columns | Filter | Sort |
|---|---|---|---|
| Mobile (`< sm`) | 2 | Bottom sheet | Dropdown |
| Tablet (`sm-lg`) | 3 | Hidden, icon trigger | Dropdown |
| Desktop (`lg+`) | 4 | Sidebar visible | Dropdown |

---

### B2. Item Detail Page

#### Layout

```
┌──────────────────────────────────────────────────────────┐
│  TOP NAV                                                 │
├──────────────────────────────────────────────────────────┤
│  Breadcrumb: Trang chủ › Catalog › Toyota Supra MK4      │
├───────────────────────────────┬──────────────────────────┤
│  VIEWER SECTION (lg:w-3/5)   │  INFO SIDEBAR (lg:w-2/5) │
│                              │                          │
│  ┌──────────────────────────┐│  Toyota Supra MK4        │
│  │                          ││  Orange / 1:64           │
│  │   Spinner 360° Viewer    ││                          │
│  │   (or gallery fallback)  ││  850.000₫                │
│  │                          ││  ● Còn hàng              │
│  │  ← Kéo để xoay →        ││                          │
│  │                          ││  ─── Thông số ───        │
│  └──────────────────────────┘│  Thương hiệu: Hot Wheels │
│  [⟳Auto] [Frame 12/24]      ││  Xe: Toyota Supra        │
│  [🔲 Toàn màn hình]         ││  Scale: 1:64             │
│                              ││  Tình trạng: Mới         │
│  ─── Gallery thumbnails ─── ││                          │
│  [🖼][🖼][🖼][🖼]          ││  ─── Đặt trước ───       │
│                              ││  Tên: [_____________]   │
│  ─── Mô tả sản phẩm ───     ││  SĐT: [_____________]   │
│  Lorem ipsum...              ││  Email: [___________]   │
│                              ││  Ghi chú: [_________]   │
│                              ││                          │
│                              ││  [Đặt trước ngay]       │
│                              ││                          │
│                              ││  [📤 Chia sẻ Facebook]  │
└───────────────────────────────┴──────────────────────────┘
```

#### Viewer States

| State | UI |
|---|---|
| Has spinner (≥24 frames) | Spinner360 viewer chính, gallery là thumbnails |
| Has images only | Gallery slider (lightbox-style) |
| No media | Placeholder `bg-slate-100` với icon camera |

#### Spinner 360° Viewer Controls
- Drag horizontal → rotate frames
- Autoplay toggle: `⟳ Auto / ‖ Dừng`
- Frame counter: `font-mono text-xs`
- Fullscreen: expand viewer to overlay

#### Pre-Order Form
- Chỉ hiện khi `status = con_hang`
- Submit → confirmation modal: "Xác nhận đặt trước Toyota Supra MK4 với giá 850.000₫?"
- Success state: show order number + hướng dẫn tiếp theo

#### Responsive
- Mobile: viewer full-width, info section bên dưới, form dưới cùng
- Desktop: 3:2 split (viewer:info)

---

### B3. Pre-Orders Public Page

#### Layout

```
│  PRE-ORDERS ĐANG MỞ                                      │
│  "Đặt hàng trước — Nhận hàng khi về"                     │
│                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                     │
│  │ [Cover] │ │ [Cover] │ │ [Cover] │                     │
│  │         │ │         │ │         │                     │
│  │ Supra   │ │ Civic   │ │ Mustang │                     │
│  │ Hot Whl │ │ M2 Mach │ │ MBX     │                     │
│  │ 850.000₫│ │ 320.000₫│ │ 180.000₫│                     │
│  │ ● Chờ   │ │ ● Chờ   │ │ ● Đã về │                     │
│  │ [Đặt]  │ │ [Đặt]  │ │ [Hết]  │                     │
│  └─────────┘ └─────────┘ └─────────┘                     │
```

#### Campaign Card
- Cover image: `aspect-[3/2]`
- Status badge: overlay bottom-left
- CTA: disabled khi `ARRIVED`, `PAID`, `CANCELLED`

---

### B4. My Orders Page

#### Layout

```
│  ĐƠN HÀNG CỦA TÔI                                       │
│  Nhập SĐT hoặc email để xem đơn:                         │
│  [0912 345 678    ]  [Xem đơn]                           │
│                                                          │
│  ─── Kết quả ───                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  #DC-PO-001 · Toyota Supra MK4                  │    │
│  │  Đặt ngày 22/05/2026 · 850.000₫                │    │
│  │  ● Chờ hàng về                                  │    │
│  └─────────────────────────────────────────────────┘    │
```

---

### B5. Contact Page

#### Layout

```
│  LIÊN HỆ                                                 │
│                                                          │
│  ┌─────────────────────┬────────────────────────────┐   │
│  │  THÔNG TIN SHOP     │  BẢN ĐỒ (Google Maps embed)│   │
│  │                     │                            │   │
│  │  📍 Địa chỉ         │                            │   │
│  │     Q1, TP.HCM      │  [iframe Google Maps]     │   │
│  │                     │                            │   │
│  │  📞 Điện thoại      │                            │   │
│  │     028 1234 5678   │                            │   │
│  │                     │                            │   │
│  │  🕐 Giờ mở cửa      │                            │   │
│  │     8:00 — 21:00    │                            │   │
│  │     T2 — CN         │                            │   │
│  │                     │                            │   │
│  │  [Facebook] [Zalo]  │                            │   │
│  └─────────────────────┴────────────────────────────┘   │
```

---

## PHẦN C — SHARED PATTERNS

### C1. Page Header Pattern (Admin)

```html
<div class="flex items-center justify-between mb-6">
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Tên trang</h1>
    <p class="text-sm text-slate-500 mt-1">Mô tả ngắn</p>
  </div>
  <div class="flex items-center gap-3">
    <!-- CTA buttons -->
  </div>
</div>
```

### C2. Breadcrumb Pattern

```html
<nav class="flex items-center gap-1 text-sm mb-4">
  <a href="/admin/items" class="text-slate-500 hover:text-slate-700">Items</a>
  <span class="text-slate-400">/</span>
  <span class="text-slate-900 font-medium">Toyota Supra MK4</span>
</nav>
```

### C3. Confirmation Dialog Pattern

Tất cả destructive actions (xoá, huỷ pre-order, deactivate) phải có confirm dialog:

```
┌────────────────────────────────┐
│  ⚠️  Xác nhận xoá              │
├────────────────────────────────┤
│  Bạn sắp xoá "Toyota Supra    │
│  MK4". Hành động này không    │
│  thể hoàn tác.                │
├────────────────────────────────┤
│  [Huỷ]         [Xoá]          │
└────────────────────────────────┘
```

### C4. Slide-Over Panel (Detail)

Dùng cho: Member detail, Pre-order detail trên màn rộng.

```
┌────────────────────────────────────────────────────┐
│  Backdrop: bg-black/30                             │
│                                          ┌─────────┤
│                                          │  Panel  │
│                                          │  w-96   │
│                                          │  slide  │
│                                          │  from   │
│                                          │  right  │
│                                          └─────────┘
```

- Animation: `translate-x-full → translate-x-0`, duration 300ms
- On mobile: full-screen bottom sheet thay thế

---

*Tài liệu này đồng bộ với Design System (File 23) và Style Guide (File 25).*
