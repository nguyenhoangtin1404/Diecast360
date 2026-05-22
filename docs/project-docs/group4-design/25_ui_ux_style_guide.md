---
title: UI/UX Style Guide — Diecast360
version: 1.0.0
date: 2026-05-22
author: UI/UX Design Team
group: Group 4 — Design
---

# UI/UX Style Guide — Diecast360

Tài liệu này định nghĩa các nguyên tắc và quy ước UX cho toàn bộ sản phẩm Diecast360. Mọi quyết định thiết kế cần được đối chiếu với tài liệu này trước khi implement.

---

## 1. Design Principles

Diecast360 tuân theo 4 nguyên tắc cốt lõi, theo thứ tự ưu tiên:

### 1.1 Clarity — Rõ ràng

> "Người dùng không nên phải đoán. Thông tin quan trọng phải thấy ngay."

- Hierarchy thị giác rõ ràng: heading → sub-heading → body → caption
- Status luôn có màu sắc + label (không chỉ màu)
- Số tiền luôn có đơn vị (₫), ngày tháng luôn có format nhất quán
- Action quan trọng nhất = button to nhất, màu nổi nhất

### 1.2 Efficiency — Hiệu quả

> "Admin cần quản lý hàng trăm items nhanh. Ít click nhất có thể."

- Bulk actions cho operations lặp lại
- Keyboard shortcuts cho power users (↑↓ navigate table, Enter open detail)
- Filter + search kết hợp, không cần submit form
- Default values hợp lý (status = con_hang, scale = 1:64)
- Autosave draft khi edit long forms

### 1.3 Trust — Tin tưởng

> "Thông tin tài chính, tồn kho, đơn hàng — sai là mất tiền."

- Confirm dialog trước mọi destructive action
- Toast feedback sau mỗi write operation (thành công hoặc thất bại)
- Hiển thị timestamp "Cập nhật lần cuối" trên các entity quan trọng
- Không tự động redirect sau update (để user kiểm tra)
- Rõ ràng ai đang xem dữ liệu của shop nào (multi-tenant indicator)

### 1.4 Delight — Thú vị

> "Collector yêu thích trải nghiệm premium. Không flashy, nhưng polished."

- Spinner 360° là killer feature — phải mượt mà
- Micro-interactions tinh tế: hover scale trên ảnh, smooth transitions
- Image loading blur-up (không blink trắng)
- Empty states có hình minh hoạ, không chỉ là text khô khan

---

## 2. Voice & Tone

### 2.1 Brand Personality

Diecast360 nói chuyện như một **người bạn am hiểu xe mô hình** — không phải robot, không phải salesman.

| Thuộc tính | ✓ Nên | ✗ Tránh |
|---|---|---|
| Giọng điệu | Thân thiện, tự tin | Trịnh trọng, lạnh lùng |
| Ngôn ngữ | Tiếng Việt tự nhiên | Từ vay mượn không cần thiết |
| Độ dài | Ngắn gọn, đủ ý | Dài dòng, lặp lại |
| Cảm xúc | Tích cực, hỗ trợ | Lo ngại, đổ lỗi |

### 2.2 Nguyên tắc viết

1. **Ngắn gọn hơn tốt hơn**: "Lưu" thay vì "Nhấn để lưu thay đổi"
2. **Chủ động**: "Lưu thành công" thay vì "Item đã được lưu thành công bởi hệ thống"
3. **Cụ thể**: "Giá phải lớn hơn 0" thay vì "Dữ liệu không hợp lệ"
4. **Tích cực**: "Thêm ảnh đầu tiên" thay vì "Chưa có ảnh nào"
5. **Nhất quán**: Dùng một từ cho một khái niệm, không thay đổi giữa các màn

---

## 3. Writing Guidelines (Tiếng Việt)

### 3.1 Button Labels

| Context | ✓ Dùng | ✗ Tránh |
|---|---|---|
| Create | Thêm, Tạo, Tải lên | Submit, OK, Xác nhận |
| Save | Lưu, Lưu thay đổi | Save, Update |
| Delete | Xoá | Remove, Delete |
| Cancel action | Huỷ | Cancel, Đóng, Thoát |
| Close modal | Đóng | Cancel |
| Confirm dangerous | Xoá (red btn) | OK, Đồng ý |
| Navigate | Xem chi tiết, Xem tất cả | More, Click here |
| Filter/Search | Tìm kiếm, Lọc | Search, Filter |
| Export | Xuất CSV | Download |

### 3.2 Success Messages (Toast)

```
✓ Lưu thành công
✓ Item "Toyota Supra MK4" đã được tạo
✓ Ảnh đã được tải lên (3 ảnh)
✓ Trạng thái đã chuyển sang "Chờ hàng về"
✓ Link đã được sao chép
✓ Giao dịch kho đã ghi nhận: +10 Toyota Supra MK4
```

### 3.3 Error Messages (Toast + Inline)

**Nguyên tắc**: Nói lỗi gì, tại sao, và cách sửa.

```
✗ Không thể lưu — Vui lòng kiểm tra lại các trường bắt buộc
✗ Tên sản phẩm không được để trống
✗ Giá bán phải lớn hơn 0
✗ Số lượng không được âm
✗ File quá lớn — Tối đa 5MB mỗi ảnh
✗ Định dạng không hỗ trợ — Chỉ chấp nhận JPG, PNG, WebP
✗ Không thể kết nối server — Vui lòng thử lại sau
✗ Phiên đăng nhập hết hạn — Vui lòng đăng nhập lại
✗ Không thể xoá thành viên này — Còn đơn hàng chưa hoàn tất
```

### 3.4 Empty States

| Màn hình | Tiêu đề | Mô tả | CTA |
|---|---|---|---|
| Items list | Chưa có sản phẩm nào | Thêm sản phẩm đầu tiên để bắt đầu. | Thêm Item |
| Pre-orders | Chưa có đơn hàng nào | Đơn đặt trước sẽ xuất hiện ở đây. | — |
| Members | Chưa có thành viên | Thành viên đăng ký qua trang public sẽ xuất hiện ở đây. | — |
| Images tab | Chưa có ảnh | Tải lên ảnh sản phẩm để hiển thị trên catalog. | Tải ảnh lên |
| Spinner tab | Chưa có frames | Upload 24 frames để kích hoạt tính năng xem 360°. | Upload frames |
| Inventory | Chưa có giao dịch | Lịch sử nhập/xuất kho sẽ hiển thị tại đây. | — |
| Search result | Không tìm thấy kết quả | Thử tìm với từ khoá khác hoặc xoá bộ lọc. | Xoá filter |

### 3.5 Confirmation Dialogs

```
Tiêu đề: Xoá [tên item]?
Body: Hành động này không thể hoàn tác.
Buttons: [Huỷ] [Xoá]

Tiêu đề: Huỷ đơn hàng #DC-PO-001?
Body: Đơn hàng của khách Minh Tuấn sẽ bị huỷ. Điểm thưởng (nếu có) sẽ được hoàn lại.
Buttons: [Giữ đơn] [Huỷ đơn]

Tiêu đề: Chuyển trạng thái sang "Hàng đã về"?
Body: Khách hàng sẽ được thông báo khi trạng thái thay đổi.
Buttons: [Huỷ] [Xác nhận]
```

### 3.6 Format Numbers & Dates

```javascript
// Tiền tệ (VND, không số thập phân)
850000 → "850.000₫"
Formatter: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

// Ngày giờ
2026-05-22T10:30:00 → "22/05/2026 10:30"
Relative: "2 giờ trước", "Hôm qua", "3 ngày trước"

// Số lượng
0 → "0" (hiện màu đỏ nếu stock)
1000 → "1.000"

// Điểm
2500 → "2.500 điểm"
```

---

## 4. Navigation Patterns

### 4.1 Admin Sidebar

```
Cấu trúc cây:
├── Dashboard
├── Items (badge: tổng items)
├── Pre-orders (badge: đang mở)
├── Inventory
├── Members (badge: tier mới)
├── Membership Tiers
└── Cài đặt Shop
    ├── Thông tin liên hệ
    ├── Giao diện
    └── Chương trình điểm
```

**Collapsible behavior:**
- Desktop: `w-64` mặc định; nút collapse → `w-16` (icon only)
- Mobile: hidden mặc định; hamburger → overlay sidebar `w-64`
- State persist: `localStorage`

**Active state:**
```html
class="bg-indigo-700 text-white" // active
class="text-indigo-200 hover:bg-white/10 hover:text-white" // inactive
```

**Badge indicator:**
- Đỏ với số: pre-orders mới cần action
- Không có badge nếu không có gì cần xử lý

### 4.2 Breadcrumbs

- Chỉ dùng khi depth ≥ 2
- Separator: `/` (dấu gạch chéo), màu `text-slate-400`
- Trang hiện tại: `text-slate-900 font-medium` (không phải link)
- Mobile: ẩn breadcrumb giữa, chỉ hiện `← Quay lại`

### 4.3 Tabs

**Horizontal tabs (Item detail):**
```html
<div class="border-b border-slate-200">
  <nav class="flex gap-0 -mb-px overflow-x-auto">
    <button class="px-4 py-2.5 text-sm font-medium border-b-2
                   border-indigo-500 text-indigo-600">
      Thông tin
    </button>
    <button class="px-4 py-2.5 text-sm font-medium border-b-2
                   border-transparent text-slate-500 hover:text-slate-700">
      Ảnh
    </button>
  </nav>
</div>
```

- Mobile: `overflow-x-auto` để scroll tab bar
- Không wrap tabs sang dòng thứ 2

**Vertical tabs (Shop Settings):**
- `hidden sm:block` left column `w-48`
- Mobile: horizontal scroll tabs

---

## 5. Form Design Patterns

### 5.1 Layout

```
Label
Input field
Helper text / Error message
```

- Label luôn ở trên input (không placeholder-as-label)
- Required indicator: `*` đỏ sau label, KHÔNG phải `(bắt buộc)`
- Nhóm liên quan trong `<fieldset>` với `<legend>`
- Spacing giữa fields: `space-y-5`

### 5.2 Field Order

Sắp xếp theo logic người dùng nghĩ, không theo schema DB:

**Item form:**
1. Tên sản phẩm *(bắt buộc)*
2. Thương hiệu (brand) *(bắt buộc)*
3. Thương hiệu xe (car_brand)
4. Mẫu xe (model_brand)
5. Tỉ lệ (scale)
6. Tình trạng (condition)
7. Trạng thái (status) *(bắt buộc)*
8. Giá bán *(bắt buộc)*
9. Số lượng
10. Hiển thị công khai (is_public toggle)
11. Mô tả
12. Ghi chú nội bộ
13. Nội dung Facebook

### 5.3 Validation

**Inline validation** (không phải chỉ submit):
- Validate `onBlur` (khi rời khỏi field)
- Validate `onChange` sau lần submit đầu tiên
- Không validate khi đang type (trừ format check như số điện thoại)

**Error message position:**
```html
<div class="space-y-1">
  <label class="block text-sm font-medium text-slate-700">
    Giá bán <span class="text-red-500">*</span>
  </label>
  <input class="border-red-300 focus:ring-red-500 ..." />
  <p class="text-xs text-red-600 flex items-center gap-1">
    <svg class="w-3 h-3"><!-- exclamation --></svg>
    Giá bán phải lớn hơn 0
  </p>
</div>
```

### 5.4 Helper Text

Dùng helper text để giải thích, không để làm placeholder:

```
Tên sản phẩm
[Toyota Supra MK4 Orange]
Tên hiển thị trên catalog và Facebook post.
```

```
Nội dung Facebook
[textarea]
Nội dung này sẽ được dùng khi copy caption. Hỗ trợ emoji.
```

### 5.5 Toggle vs Checkbox

- **Toggle** (switch): bật/tắt trạng thái, hiệu lực ngay — ví dụ: `is_public`
- **Checkbox**: lựa chọn trong form, hiệu lực khi submit — ví dụ: bulk select

### 5.6 Submit Area

```html
<!-- Cuối form — sticky bottom trên mobile -->
<div class="flex items-center justify-between pt-6 border-t border-slate-200
            sticky bottom-0 bg-white py-4 mt-8">
  <button class="btn-ghost text-red-600">Xoá item</button>
  <div class="flex gap-3">
    <button class="btn-secondary">Huỷ</button>
    <button class="btn-primary" type="submit">Lưu thay đổi</button>
  </div>
</div>
```

---

## 6. Data Display Patterns

### 6.1 Table vs Cards — Khi nào dùng gì

| Scenario | Dùng Table | Dùng Cards |
|---|---|---|
| Admin list (nhiều cột dữ liệu) | ✓ | — |
| Public catalog | — | ✓ |
| Lịch sử điểm / giao dịch | ✓ | — |
| Dashboard KPI | — | ✓ (stat cards) |
| Mobile view của admin list | — | ✓ (card collapse) |

### 6.2 Responsive Table Strategies

**Strategy 1: Priority columns** (ẩn cột ít quan trọng)
```html
<th class="hidden md:table-cell">Ngày tạo</th>
<td class="hidden md:table-cell">22/05/2026</td>
```

**Strategy 2: Card collapse** (mobile hiện card thay table)
```html
<!-- Desktop: table -->
<div class="hidden md:block">
  <table>...</table>
</div>
<!-- Mobile: cards -->
<div class="md:hidden space-y-3">
  <div class="bg-white rounded-lg border p-4">...</div>
</div>
```

**Strategy 3: Horizontal scroll** (đơn giản nhất)
```html
<div class="overflow-x-auto -mx-4 px-4">
  <table class="min-w-full">...</table>
</div>
```

### 6.3 Sort Indicators

```html
<!-- Unsorted -->
<th class="cursor-pointer select-none hover:bg-slate-100">
  Giá
  <svg class="inline w-4 h-4 text-slate-400"><!-- chevron-up-down --></svg>
</th>

<!-- Sorted ascending -->
<th class="cursor-pointer select-none bg-slate-50">
  Giá
  <svg class="inline w-4 h-4 text-indigo-500"><!-- chevron-up --></svg>
</th>
```

---

## 7. Loading States

### 7.1 Skeleton Screens

Dùng cho: page load lần đầu, tab switch, filter change.

```html
<!-- Item card skeleton -->
<div class="animate-pulse">
  <div class="aspect-square bg-slate-200 rounded-lg mb-3"></div>
  <div class="space-y-2">
    <div class="h-3 bg-slate-200 rounded w-1/3"></div>
    <div class="h-4 bg-slate-200 rounded w-3/4"></div>
    <div class="h-5 bg-slate-200 rounded w-1/2"></div>
  </div>
</div>

<!-- Table row skeleton -->
<tr class="animate-pulse">
  <td class="px-4 py-3"><div class="h-4 bg-slate-200 rounded w-3/4"></div></td>
  <td class="px-4 py-3"><div class="h-4 bg-slate-200 rounded w-1/2"></div></td>
  <td class="px-4 py-3"><div class="h-6 bg-slate-200 rounded-full w-20"></div></td>
</tr>
```

**Quy tắc:**
- Hiện ngay khi request bắt đầu (không delay)
- Giữ nguyên số lượng "rows" như lần load trước (nếu biết)
- Skeleton shape phải gần giống content thực

### 7.2 Inline Spinners

Dùng cho: button loading, small updates.

```html
<!-- Button with spinner -->
<button disabled class="btn-primary opacity-75 cursor-not-allowed">
  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"><!-- spinner --></svg>
  Đang lưu...
</button>
```

### 7.3 Progress Bar

Dùng cho: file upload, multi-step operations.

```html
<!-- Upload progress -->
<div class="w-full bg-slate-200 rounded-full h-1.5 mt-2">
  <div class="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
       style="width: 45%"></div>
</div>
<p class="text-xs text-slate-500 mt-1">Đang tải lên... 45%</p>
```

### 7.4 Global Page Loading

```html
<!-- Top progress bar (NProgress-style) -->
<div class="fixed top-0 left-0 right-0 z-50 h-0.5 bg-indigo-600
            animate-[slideIn_1s_ease-in-out_infinite]"></div>
```

---

## 8. Error States

### 8.1 Inline Form Errors

- Hiện dưới field, font `text-xs text-red-600`
- Kèm icon `ExclamationCircleIcon w-3 h-3`
- Input border: `border-red-300 focus:ring-red-500`

### 8.2 Toast Notifications

Xem Design System (File 23, Section 7.7) cho chi tiết visual.

**Thứ tự ưu tiên**: Error > Warning > Info > Success

**Stacking**: Toast mới nhất ở trên cùng (top of stack, bottom-right corner)

### 8.3 Error Pages

#### 404 — Không tìm thấy trang

```
┌─────────────────────────────────────┐
│                                     │
│           404                       │
│    🔍 Oops! Trang này không tồn tại │
│                                     │
│    Trang bạn tìm kiếm đã bị xoá    │
│    hoặc chưa bao giờ tồn tại.      │
│                                     │
│    [← Quay lại trang trước]         │
│    [🏠 Về trang chủ]                │
│                                     │
└─────────────────────────────────────┘
```

#### 500 — Lỗi server

```
┌─────────────────────────────────────┐
│                                     │
│           500                       │
│    ⚙️ Có lỗi xảy ra                 │
│                                     │
│    Chúng tôi đang xử lý sự cố.     │
│    Vui lòng thử lại sau ít phút.   │
│                                     │
│    [↻ Thử lại]                      │
│                                     │
└─────────────────────────────────────┘
```

#### Network Error (offline)

```html
<!-- Banner ở top -->
<div class="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white
            text-sm font-medium text-center py-2">
  ⚠️ Mất kết nối internet — Dữ liệu có thể chưa được lưu
</div>
```

### 8.4 API Error Handling

| HTTP Code | Message hiện với user |
|---|---|
| 400 | Hiện lỗi cụ thể từ `error.details` |
| 401 | "Phiên đăng nhập hết hạn" → redirect login |
| 403 | "Bạn không có quyền thực hiện thao tác này" |
| 404 | "Không tìm thấy dữ liệu" |
| 422 | Hiện lỗi validation cụ thể |
| 500 | "Có lỗi xảy ra, vui lòng thử lại" |
| Network | "Không thể kết nối server" |

---

## 9. Empty States

### 9.1 Anatomy

```
┌─────────────────────────────────────┐
│                                     │
│          [Illustration]             │
│          48×48px icon               │
│          text-slate-300             │
│                                     │
│        Tiêu đề (text-base           │
│        font-medium text-slate-600)  │
│                                     │
│        Mô tả ngắn (text-sm         │
│        text-slate-500 max-w-xs)     │
│                                     │
│        [CTA Button - optional]      │
│                                     │
└─────────────────────────────────────┘
```

### 9.2 Tone cho Empty States

- **Có CTA**: Năng động, hướng dẫn hành động
  - "Chưa có items nào. Hãy thêm sản phẩm đầu tiên!"
- **Không có CTA**: Trung lập, informational
  - "Chưa có giao dịch nào trong khoảng thời gian này."
- **Search no results**: Gợi ý cách sửa
  - "Không tìm thấy kết quả cho 'xxx'. Thử từ khoá khác hoặc xoá bộ lọc."

### 9.3 Filter Empty State

Khi filter active mà không có kết quả → hiện thêm "Xoá filter" để thoát nhanh.

---

## 10. Responsive Design

### 10.1 Breakpoints

| Breakpoint | px | Devices |
|---|---|---|
| `default` | 0+ | Mobile portrait |
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Wide screen |

### 10.2 Mobile-First Approach

Viết CSS mobile trước, dùng `md:` `lg:` để override:

```html
<!-- Mobile: stacked, Desktop: side-by-side -->
<div class="flex flex-col lg:flex-row gap-6">
  <div class="w-full lg:w-3/5">Viewer</div>
  <div class="w-full lg:w-2/5">Info</div>
</div>
```

### 10.3 Touch Targets

- **Minimum**: 44×44px cho mọi interactive element
- Buttons: `min-h-[44px] px-4` hoặc `p-3` cho icon buttons
- Table row actions trên mobile: dùng swipe gesture hoặc context menu
- Links trong đoạn văn: underline để dễ nhận biết

### 10.4 Admin Mobile Adaptation

Admin app được thiết kế cho desktop nhưng phải usable trên tablet:

| Feature | Desktop | Tablet | Mobile |
|---|---|---|---|
| Sidebar | `w-64` visible | `w-16` icon | Hidden, drawer |
| Table | Full columns | Priority columns | Card list |
| Forms | 2-column | Single column | Single column |
| Tabs | Text + icon | Text only | Icon only, scroll |
| Filters | Inline bar | Collapsible | Bottom sheet |

---

## 11. Accessibility (WCAG 2.1 AA)

### 11.1 Color Contrast

| Context | Minimum ratio | Check tool |
|---|---|---|
| Body text trên white | 4.5:1 | WebAIM Contrast Checker |
| Large text (≥18px bold, ≥24px) | 3:1 | |
| UI components & states | 3:1 | |
| Focus indicators | 3:1 vs background | |

**Các cặp màu đã kiểm tra đạt AA:**

| Text | Background | Ratio |
|---|---|---|
| `slate-900 (#0f172a)` | `white` | 19.1:1 ✓ |
| `slate-700 (#334155)` | `white` | 9.0:1 ✓ |
| `indigo-600 (#4f46e5)` | `white` | 5.1:1 ✓ |
| `white` | `indigo-600 (#4f46e5)` | 5.1:1 ✓ |
| `green-700 (#15803d)` | `green-100 (#dcfce7)` | 5.2:1 ✓ |
| `red-600 (#dc2626)` | `white` | 4.6:1 ✓ |

### 11.2 Keyboard Navigation

```
Tab         → Focus next interactive element
Shift+Tab   → Focus previous
Enter/Space → Activate button, toggle
Escape      → Close modal, dropdown
Arrow keys  → Navigate within menu, table rows
```

**Focus visible:**
```html
<!-- Không tắt outline, dùng ring thay thế -->
<button class="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
```

### 11.3 ARIA Labels

```html
<!-- Icon-only buttons -->
<button aria-label="Xoá ảnh">
  <svg aria-hidden="true"><!-- trash --></svg>
</button>

<!-- Status badge -->
<span role="status" aria-label="Trạng thái: Còn hàng">
  Còn hàng
</span>

<!-- Toggle -->
<button role="switch" aria-checked="true" aria-label="Hiển thị công khai">
  <!-- toggle UI -->
</button>

<!-- Modal -->
<div role="dialog" aria-labelledby="modal-title" aria-modal="true">
  <h2 id="modal-title">Xác nhận xoá</h2>
</div>

<!-- Table -->
<table>
  <caption class="sr-only">Danh sách sản phẩm</caption>
  <th scope="col">Tên sản phẩm</th>
  <th scope="row">Toyota Supra MK4</th>
</table>
```

### 11.4 Screen Reader

- Alt text cho tất cả ảnh sản phẩm: `alt="[Tên xe] - [Thương hiệu]"`
- Decorative images: `alt=""` (empty)
- Spinner 360° viewer: `aria-label="Xem xe 360° - kéo để xoay"`
- Loading states: `aria-busy="true"` trên container
- Live regions cho toast: `aria-live="polite"` (success) / `aria-live="assertive"` (error)

---

## 12. Image Guidelines

### 12.1 Aspect Ratios

| Context | Ratio | Class |
|---|---|---|
| Item card (catalog) | 1:1 | `aspect-square` |
| Item detail viewer | 4:3 hoặc 1:1 | `aspect-[4/3]` |
| Spinner 360° | 1:1 | `aspect-square` |
| Hero section | 16:9 | `aspect-video` |
| Thumbnail (table) | 1:1 | `w-10 h-10` |
| Shop logo | variable | `h-8 w-auto` |

### 12.2 Object Fit

```html
<!-- Item card -->
<img class="w-full h-full object-cover" />

<!-- Logo -->
<img class="h-8 w-auto object-contain" />

<!-- Thumbnail -->
<img class="w-10 h-10 rounded object-cover" />
```

### 12.3 Lazy Loading

```html
<!-- Native lazy loading -->
<img loading="lazy" src="..." alt="..." />

<!-- Above the fold: eager load -->
<img loading="eager" src="..." alt="..." />
```

### 12.4 Blur-Up Loading Pattern

```html
<!-- Low-quality placeholder → full image -->
<div class="relative overflow-hidden bg-slate-100">
  <!-- Placeholder blur -->
  <img src="tiny-blur.jpg" class="absolute inset-0 w-full h-full object-cover
                                   blur-sm scale-110 transition-opacity"
       aria-hidden="true" />
  <!-- Full image -->
  <img src="full-image.jpg" class="relative w-full h-full object-cover
                                    opacity-0 transition-opacity duration-500
                                    [.loaded_&]:opacity-100"
       onload="this.closest('.relative').classList.add('loaded')" />
</div>
```

---

## 13. Spinner 360° UX

### 13.1 Interaction Model

| Input | Action |
|---|---|
| Mouse drag (horizontal) | Rotate frames theo delta X |
| Touch swipe (horizontal) | Rotate frames theo delta X |
| Arrow keys (← →) | Step 1 frame |
| Scroll (nếu enabled) | Rotate frames |
| Click autoplay button | Bắt đầu/dừng autoplay |

### 13.2 Sensitivity

```javascript
// Pixel per frame
const DRAG_SENSITIVITY = 8; // px để chuyển 1 frame
const TOUCH_SENSITIVITY = 6; // mobile nhạy hơn một chút

// Autoplay
const AUTOPLAY_FPS = 2; // frames per second
const AUTOPLAY_INTERVAL = 1000 / AUTOPLAY_FPS; // 500ms
```

### 13.3 Frame Preloading Strategy

```javascript
// 1. Load frame mặc định (default frame) ngay lập tức
// 2. Load các frame kế tiếp theo thứ tự: ±1, ±2, ±3...
// 3. Chỉ allow interaction sau khi ≥ 6 frames đã load
// 4. Hiện progress: "Đang tải... 12/24 frames"
```

### 13.4 Loading State

```html
<div class="aspect-square bg-slate-900 rounded-lg flex items-center justify-center">
  <div class="text-center">
    <!-- Circular progress -->
    <svg class="animate-spin w-12 h-12 text-indigo-500 mx-auto mb-3"><!-- spinner --></svg>
    <p class="text-sm text-slate-400">Đang tải... 8/24 frames</p>
    <div class="w-32 bg-slate-700 rounded-full h-1 mt-2 mx-auto">
      <div class="bg-indigo-500 h-1 rounded-full" style="width: 33%"></div>
    </div>
  </div>
</div>
```

### 13.5 Hint Animation

Khi viewer load xong lần đầu:
1. Hiện hint text "← Kéo để xoay →" trong 2 giây
2. Animate xe tự quay 0→5→0 frames (gợi ý interaction)
3. Sau đó dừng lại ở default frame

### 13.6 Fallback

Nếu item không có spinner (frames = 0): hiện gallery ảnh bình thường.
Nếu item không có ảnh: hiện placeholder icon `PhotoIcon` trên nền `bg-slate-100`.

---

## 14. Status Indicators

### 14.1 Item Status Color Coding

| Status | Màu đèn | Badge | Ý nghĩa |
|---|---|---|---|
| `con_hang` | 🟢 Green | Còn hàng | Có thể mua / pre-order |
| `giu_cho` | 🟡 Amber | Giữ chỗ | Đang được giữ cho khách |
| `da_ban` | ⚫ Slate | Đã bán | Không còn |

Quy tắc: **Không bao giờ dùng màu đơn thuần** — luôn kèm text label.

### 14.2 Pre-Order Status Flow

```
Chờ xác nhận (yellow) 
    ↓ ✓ hoặc ✗
Chờ hàng về (blue) ←→ Đã huỷ (red)
    ↓
Hàng đã về (indigo) ←→ Đã huỷ (red)
    ↓
Đã thanh toán (green) ←→ Đã hoàn tiền (purple)
```

Visual trong UI:
```html
<!-- Status timeline trong pre-order detail -->
<ol class="relative border-l-2 border-slate-200 ml-4 space-y-4">
  <li class="ml-4">
    <div class="absolute w-3 h-3 bg-green-500 rounded-full -left-1.5 top-1"></div>
    <time class="text-xs text-slate-500">22/05 10:00</time>
    <p class="text-sm font-medium text-slate-900">Chờ xác nhận</p>
  </li>
  <li class="ml-4">
    <div class="absolute w-3 h-3 bg-blue-500 rounded-full -left-1.5 top-1"></div>
    <time class="text-xs text-slate-500">22/05 10:15</time>
    <p class="text-sm font-medium text-slate-900">Chờ hàng về</p>
  </li>
  <li class="ml-4 opacity-40">
    <div class="absolute w-3 h-3 bg-slate-300 rounded-full -left-1.5 top-1"></div>
    <p class="text-sm text-slate-500">Hàng đã về</p>
  </li>
</ol>
```

---

## 15. Micro-interactions

### 15.1 Hover Effects

```css
/* Item card — image zoom */
.card-image: hover → scale(1.05), duration: 300ms

/* Button — darken */
.btn-primary: hover → bg-indigo-700, duration: 150ms

/* Table row — highlight */
tr: hover → bg-slate-50, duration: 100ms

/* Nav item — lighten */
.nav-item: hover → bg-white/10, duration: 150ms

/* Toggle switch */
input[type=checkbox]: transition → width 200ms ease-in-out
```

### 15.2 Transition Choreography

**Modal open:**
1. Backdrop fade in: `opacity-0 → opacity-100`, 200ms
2. Panel scale: `scale-95 opacity-0 → scale-100 opacity-100`, 200ms

**Toast enter:**
1. Slide in từ phải: `translateX(100%) → translateX(0)`, 300ms ease-out
2. Auto dismiss: fade out `opacity-100 → opacity-0`, 200ms

**Slide-over:**
1. `translateX(100%) → translateX(0)`, 300ms ease-out
2. Backdrop `opacity-0 → opacity-100`, 300ms

**Page navigation (admin):**
- Content area: `opacity-0 → opacity-100`, 150ms
- Không slide (admin app dùng transition nhẹ)

### 15.3 Feedback Animation

```html
<!-- Copy to clipboard success -->
<button onclick="copyToClipboard()">
  <!-- Sau khi copy: icon thay thành check 1.5 giây -->
  <svg id="copy-icon"><!-- copy --></svg>
  <svg id="check-icon" class="hidden text-green-500"><!-- check --></svg>
</button>

<!-- Like/save toggle -->
<button class="transition-transform active:scale-90">
  <svg class="transition-colors hover:text-red-500"><!-- heart --></svg>
</button>
```

---

## 16. Do's and Don'ts

### 16.1 Layout & Spacing

| ✓ Do | ✗ Don't |
|---|---|
| Dùng Tailwind spacing scale (4, 6, 8...) | Dùng arbitrary values `p-[13px]` |
| Consistent `gap-4` hoặc `gap-6` trong grid | Mix `gap-3` và `gap-5` trong cùng một page |
| Sticky header/actions trên mobile | Để form action bị scroll khỏi màn |
| `max-w-7xl mx-auto` cho content | Full-width không có max-width |

### 16.2 Colors

| ✓ Do | ✗ Don't |
|---|---|
| Status màu + label text | Chỉ dùng màu để phân biệt |
| `text-slate-900` cho text quan trọng | `text-black` |
| `text-slate-500` cho text phụ | `text-gray-400` (inconsistent) |
| Hover darken 1 shade | Hover thay đổi màu hoàn toàn |
| Focus ring `ring-indigo-500` | `outline: none` không có thay thế |

### 16.3 Typography

| ✓ Do | ✗ Don't |
|---|---|
| Hierarchy rõ ràng H1→H2→body | Tất cả text cùng size |
| `font-mono` cho số tiền, ID | `font-sans` cho code/ID |
| `line-clamp-2` cho card titles | Text tràn ra ngoài card |
| Dùng `truncate` cho danh sách dài | Cho text wrap làm vỡ layout |

### 16.4 Forms

| ✓ Do | ✗ Don't |
|---|---|
| Validate `onBlur`, show error rõ ràng | Submit mới validate |
| Disable button khi đang submit | Cho double-submit xảy ra |
| Autofocus field đầu tiên khi mở form | Không focus → user phải click |
| Confirm dialog trước destructive action | Xoá không cần xác nhận |
| Nhớ giá trị filter khi quay lại list | Reset filter mỗi lần navigate |

### 16.5 Loading & Error

| ✓ Do | ✗ Don't |
|---|---|
| Skeleton screen cho initial load | Spinner trắng toàn trang |
| Toast với thông tin cụ thể | "Thành công" / "Lỗi" chung chung |
| Retry button khi network error | Chỉ hiện lỗi, không có cách thoát |
| Giữ old data khi refetch fail | Clear dữ liệu khi có lỗi |

### 16.6 Accessibility

| ✓ Do | ✗ Don't |
|---|---|
| Alt text mô tả cho ảnh sản phẩm | `alt="image"` hoặc không có alt |
| `aria-label` cho icon buttons | Icon button không có label |
| Focus trap trong modal | Focus ra ngoài modal khi đang mở |
| Color contrast ≥ 4.5:1 | Text màu nhạt trên nền sáng |
| Keyboard accessible dropdown | Dropdown chỉ dùng được với mouse |

---

*Tài liệu này là tài liệu sống — cập nhật mỗi sprint khi có quyết định thiết kế mới.*

*Đồng bộ với: Design System (File 23) — Wireframe Descriptions (File 24)*
