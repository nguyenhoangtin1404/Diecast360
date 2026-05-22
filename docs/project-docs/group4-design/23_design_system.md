---
title: Design System — Diecast360
version: 1.0.0
date: 2026-05-22
author: UI/UX Design Team
group: Group 4 — Design
---

# Design System — Diecast360

---

## 1. Brand Identity

### 1.1 Thông tin cơ bản

| Thuộc tính | Giá trị |
|---|---|
| **Tên sản phẩm** | Diecast360 |
| **Tagline** | "Mọi góc nhìn, mọi chi tiết" |
| **Phụ đề** | Nền tảng quản lý và mua bán mô hình xe 1:64 |
| **Mô tả ngắn** | Web app chuyên biệt cho collector và shop diecast — từ quản lý kho, pre-order đến trải nghiệm xem xe 360°. |

### 1.2 Brand Personality

Diecast360 mang cá tính của một **người chơi xe lâu năm, chuyên nghiệp nhưng đam mê**:

- **Professional**: Giao diện admin gọn gàng, thông tin rõ ràng, workflow hiệu quả.
- **Collector Vibe**: Màu sắc deep indigo/slate gợi lên không gian trưng bày, showroom tối.
- **Trustworthy**: Typography nhất quán, spacing cẩn thận, không có yếu tố gây rối mắt.
- **Precise**: Như chi tiết trên mô hình xe — mỗi pixel có chủ đích.

### 1.3 Logo Usage

```
┌─────────────────────────┐
│  ⬡  Diecast360          │   ← Full logo: icon + wordmark
│                         │
│  ⬡                      │   ← Icon only (favicon, mobile)
│                         │
│  DIECAST360             │   ← Wordmark only (header light bg)
└─────────────────────────┘
```

- Icon: hexagon (gợi bánh xe, 360°) với chữ "D" hoặc vòng tròn
- Minimum size: 24×24px (icon), 120×32px (full logo)
- Clear space: 16px mọi phía

---

## 2. Color Palette

### 2.1 Primary — Indigo

Indigo là màu chủ đạo, gợi lên độ tin cậy và collector vibe cao cấp.

| Token | Tailwind Class | Hex | Sử dụng |
|---|---|---|---|
| `primary-950` | `indigo-950` | `#1e1b4b` | Dark sidebar background |
| `primary-900` | `indigo-900` | `#312e81` | Dark sidebar hover |
| `primary-800` | `indigo-800` | `#3730a3` | Button hover (dark) |
| `primary-700` | `indigo-700` | `#4338ca` | Button hover |
| `primary-600` | `indigo-600` | `#4f46e5` | **Primary button**, active nav |
| `primary-500` | `indigo-500` | `#6366f1` | Link, icon accent |
| `primary-400` | `indigo-400` | `#818cf8` | Light mode accent |
| `primary-200` | `indigo-200` | `#c7d2fe` | Chip background (active) |
| `primary-100` | `indigo-100` | `#e0e7ff` | Chip background (light) |
| `primary-50`  | `indigo-50`  | `#eef2ff` | Page background accent |

### 2.2 Secondary — Slate

Slate phục vụ nền, border, text thứ cấp.

| Token | Tailwind Class | Hex | Sử dụng |
|---|---|---|---|
| `slate-950` | `slate-950` | `#020617` | Body text dark mode |
| `slate-900` | `slate-900` | `#0f172a` | Sidebar dark |
| `slate-800` | `slate-800` | `#1e293b` | Card dark, table dark |
| `slate-700` | `slate-700` | `#334155` | Border dark |
| `slate-600` | `slate-600` | `#475569` | Icon muted, label |
| `slate-500` | `slate-500` | `#64748b` | Placeholder text |
| `slate-400` | `slate-400` | `#94a3b8` | Border light |
| `slate-300` | `slate-300` | `#cbd5e1` | Divider |
| `slate-200` | `slate-200` | `#e2e8f0` | Table border, input border |
| `slate-100` | `slate-100` | `#f1f5f9` | Table row hover, tag bg |
| `slate-50`  | `slate-50`  | `#f8fafc` | Page background |

### 2.3 Status Colors — Item Status

| Status | Tiếng Việt | Tailwind Badge | Hex text | Hex bg |
|---|---|---|---|---|
| `con_hang` | Còn hàng | `text-green-700 bg-green-100` | `#15803d` | `#dcfce7` |
| `giu_cho` | Giữ chỗ | `text-amber-700 bg-amber-100` | `#b45309` | `#fef3c7` |
| `da_ban` | Đã bán | `text-slate-600 bg-slate-100` | `#475569` | `#f1f5f9` |

### 2.4 Status Colors — Pre-Order Status

| Status | Tiếng Việt | Tailwind Badge | Hex text | Hex bg |
|---|---|---|---|---|
| `PENDING_CONFIRMATION` | Chờ xác nhận | `text-yellow-700 bg-yellow-100` | `#a16207` | `#fef9c3` |
| `WAITING_FOR_GOODS` | Chờ hàng về | `text-blue-700 bg-blue-100` | `#1d4ed8` | `#dbeafe` |
| `ARRIVED` | Hàng đã về | `text-indigo-700 bg-indigo-100` | `#4338ca` | `#e0e7ff` |
| `PAID` | Đã thanh toán | `text-green-700 bg-green-100` | `#15803d` | `#dcfce7` |
| `CANCELLED` | Đã huỷ | `text-red-600 bg-red-50` | `#dc2626` | `#fef2f2` |
| `REFUNDED` | Đã hoàn tiền | `text-purple-700 bg-purple-100` | `#7e22ce` | `#f3e8ff` |

### 2.5 Accent — Orange/Amber (CTA)

| Token | Tailwind Class | Hex | Sử dụng |
|---|---|---|---|
| `accent-600` | `orange-600` | `#ea580c` | Danger CTA, flash sale |
| `accent-500` | `orange-500` | `#f97316` | CTA hover |
| `accent-400` | `amber-400` | `#fbbf24` | Star rating, highlight |
| `accent-100` | `orange-100` | `#ffedd5` | Warning background |

### 2.6 Semantic Colors

| Semantic | Tailwind | Hex | Dùng cho |
|---|---|---|---|
| Success | `green-600` | `#16a34a` | Toast success, positive delta |
| Warning | `amber-500` | `#f59e0b` | Toast warning |
| Error | `red-600` | `#dc2626` | Toast error, form error |
| Info | `blue-500` | `#3b82f6` | Toast info |

### 2.7 Dark Mode Tokens

```css
/* light */
--bg-page:     #f8fafc;   /* slate-50 */
--bg-card:     #ffffff;
--bg-sidebar:  #1e1b4b;   /* indigo-950 */
--text-primary: #0f172a;  /* slate-900 */
--text-muted:  #64748b;   /* slate-500 */
--border:      #e2e8f0;   /* slate-200 */

/* dark */
--bg-page:     #0f172a;   /* slate-900 */
--bg-card:     #1e293b;   /* slate-800 */
--bg-sidebar:  #020617;   /* slate-950 */
--text-primary: #f1f5f9;  /* slate-100 */
--text-muted:  #94a3b8;   /* slate-400 */
--border:      #334155;   /* slate-700 */
```

---

## 3. Typography

### 3.1 Font Family

```css
/* UI chính */
font-family: 'Inter', system-ui, -apple-system, sans-serif;

/* Số, ID, code, SKU */
font-family: 'JetBrains Mono', 'Fira Code', monospace;

/* Tailwind config */
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
}
```

### 3.2 Type Scale

| Token | Tailwind | Size | Line Height | Dùng cho |
|---|---|---|---|---|
| `text-xs` | `text-xs` | 12px | 16px | Caption, helper text, meta |
| `text-sm` | `text-sm` | 14px | 20px | Table cell, label, badge |
| `text-base` | `text-base` | 16px | 24px | Body text, input value |
| `text-lg` | `text-lg` | 18px | 28px | Section heading, card title |
| `text-xl` | `text-xl` | 20px | 28px | Page sub-heading |
| `text-2xl` | `text-2xl` | 24px | 32px | Page heading, KPI value |
| `text-3xl` | `text-3xl` | 30px | 36px | Hero heading (public) |
| `text-4xl` | `text-4xl` | 36px | 40px | Display (catalog hero) |

### 3.3 Font Weight

| Weight | Tailwind | Dùng cho |
|---|---|---|
| 400 Regular | `font-normal` | Body text, description, table cell |
| 500 Medium | `font-medium` | Label, nav item, badge text |
| 600 Semibold | `font-semibold` | Card title, button, tab active |
| 700 Bold | `font-bold` | Page heading, KPI number, price |

### 3.4 Typography Patterns

```html
<!-- Page heading -->
<h1 class="text-2xl font-bold text-slate-900">Danh sách Items</h1>

<!-- Section heading -->
<h2 class="text-lg font-semibold text-slate-800">Thông tin cơ bản</h2>

<!-- Card title -->
<h3 class="text-sm font-semibold text-slate-700">Toyota Supra MK4</h3>

<!-- Body text -->
<p class="text-sm text-slate-600 leading-relaxed">Mô tả sản phẩm...</p>

<!-- Muted/helper -->
<p class="text-xs text-slate-500">Cập nhật lần cuối: 22/05/2026</p>

<!-- Price (mono) -->
<span class="font-mono text-lg font-bold text-slate-900">850.000₫</span>

<!-- ID/SKU -->
<code class="font-mono text-xs text-slate-500 bg-slate-100 px-1 rounded">
  #DC-00142
</code>
```

---

## 4. Spacing System

Base unit: **4px** (Tailwind default).

| Token | px | Dùng cho |
|---|---|---|
| `space-1` | 4px | Icon padding, chip gap |
| `space-2` | 8px | Button padding (sm), inline gap |
| `space-3` | 12px | Input padding, badge padding |
| `space-4` | 16px | Card padding (sm), section gap |
| `space-5` | 20px | Form field gap |
| `space-6` | 24px | Card padding (default), section |
| `space-8` | 32px | Section gap, modal padding |
| `space-10` | 40px | Page section gap |
| `space-12` | 48px | Major section separator |
| `space-16` | 64px | Hero padding, page top |

### Layout Spacing Rules

```
Page padding:        px-4 (mobile) → px-6 (md) → px-8 (lg)
Sidebar width:       w-64 (collapsed: w-16)
Content max-width:   max-w-7xl mx-auto
Card padding:        p-4 (sm) | p-6 (default) | p-8 (modal)
Table cell:          px-4 py-3
Form field gap:      space-y-5
```

---

## 5. Border Radius

| Token | Tailwind | px | Dùng cho |
|---|---|---|---|
| None | `rounded-none` | 0 | Table row divider |
| SM | `rounded-sm` | 2px | Input subtle |
| Base | `rounded` | 4px | Badge, chip, tag |
| MD | `rounded-md` | 6px | Button, input field |
| LG | `rounded-lg` | 8px | Card, dropdown |
| XL | `rounded-xl` | 12px | Modal, image card |
| 2XL | `rounded-2xl` | 16px | Feature card (public) |
| Full | `rounded-full` | 9999px | Avatar, pill badge |

---

## 6. Shadow System

| Token | Tailwind | Dùng cho |
|---|---|---|
| `shadow-sm` | `shadow-sm` | Input focus, table row hover |
| `shadow` | `shadow` | Card default |
| `shadow-md` | `shadow-md` | Dropdown, popover |
| `shadow-lg` | `shadow-lg` | Modal backdrop shadow |
| `shadow-xl` | `shadow-xl` | Toast, floating panel |
| `shadow-2xl` | `shadow-2xl` | Fullscreen overlay |

---

## 7. Component Library

### 7.1 Buttons

#### Variants

```html
<!-- Primary -->
<button class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold
               text-white bg-indigo-600 rounded-md hover:bg-indigo-700
               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
               disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
  Lưu thay đổi
</button>

<!-- Secondary -->
<button class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold
               text-slate-700 bg-white border border-slate-300 rounded-md
               hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500
               disabled:opacity-50 transition-colors">
  Huỷ
</button>

<!-- Danger -->
<button class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold
               text-white bg-red-600 rounded-md hover:bg-red-700
               focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
               disabled:opacity-50 transition-colors">
  Xoá
</button>

<!-- Ghost -->
<button class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
               text-slate-600 rounded-md hover:bg-slate-100 hover:text-slate-900
               focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors">
  Xem thêm
</button>
```

#### Sizes

| Size | Classes | Dùng cho |
|---|---|---|
| `sm` | `px-3 py-1.5 text-xs` | Table actions, compact UI |
| `md` | `px-4 py-2 text-sm` | Default (most forms) |
| `lg` | `px-6 py-3 text-base` | Primary CTA, hero buttons |

#### States

| State | Modifier | Notes |
|---|---|---|
| Default | — | Base styles |
| Hover | `hover:bg-indigo-700` | Darken 1 shade |
| Active | `active:bg-indigo-800` | Darken 2 shades |
| Focus | `focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2` | Accessibility |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed` | Giảm opacity |
| Loading | Thêm spinner icon + `disabled` prop | Không xử lý double-click |

---

### 7.2 Input Fields

```html
<!-- Text input - default -->
<div class="space-y-1">
  <label class="block text-sm font-medium text-slate-700">Tên sản phẩm</label>
  <input type="text"
    class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm
           text-slate-900 placeholder-slate-400 shadow-sm
           focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500
           disabled:bg-slate-50 disabled:text-slate-500"
    placeholder="Nhập tên sản phẩm" />
</div>

<!-- Input - error state -->
<div class="space-y-1">
  <label class="block text-sm font-medium text-slate-700">Giá bán</label>
  <input type="number"
    class="block w-full rounded-md border border-red-300 px-3 py-2 text-sm
           text-slate-900 focus:border-red-500 focus:ring-red-500
           focus:outline-none focus:ring-1" />
  <p class="text-xs text-red-600">Giá bán phải lớn hơn 0</p>
</div>

<!-- Select -->
<select class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm
               text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500
               focus:outline-none focus:ring-1 bg-white">
  <option value="">-- Chọn thương hiệu --</option>
</select>

<!-- Textarea -->
<textarea rows="4"
  class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm
         text-slate-900 placeholder-slate-400 shadow-sm resize-y
         focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
</textarea>
```

#### Input States

| State | Border | Ring | Text |
|---|---|---|---|
| Default | `border-slate-300` | — | `text-slate-900` |
| Focus | `border-indigo-500` | `ring-indigo-500` | `text-slate-900` |
| Error | `border-red-300` | `ring-red-500` | `text-slate-900` |
| Disabled | `border-slate-200` | — | `text-slate-500 bg-slate-50` |

---

### 7.3 Cards

#### Item Card (Public Catalog)

```html
<div class="group bg-white rounded-xl shadow overflow-hidden hover:shadow-lg transition-shadow">
  <!-- Cover image 1:1 -->
  <div class="aspect-square bg-slate-100 relative overflow-hidden">
    <img src="..." alt="..." class="w-full h-full object-cover
         group-hover:scale-105 transition-transform duration-300" />
    <!-- 360° badge -->
    <span class="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5
                 text-xs font-medium text-white bg-indigo-600 rounded-full">
      ⟳ 360°
    </span>
    <!-- Status badge -->
    <span class="absolute bottom-2 left-2 px-2 py-0.5 text-xs font-medium
                 text-green-700 bg-green-100 rounded-full">Còn hàng</span>
  </div>
  <!-- Info -->
  <div class="p-4">
    <p class="text-xs text-slate-500 mb-1">Hot Wheels / 1:64</p>
    <h3 class="text-sm font-semibold text-slate-900 line-clamp-2 mb-2">
      Toyota Supra MK4 Orange
    </h3>
    <p class="font-mono text-base font-bold text-slate-900">850.000₫</p>
  </div>
</div>
```

#### Stat Card (Admin Dashboard)

```html
<div class="bg-white rounded-lg shadow p-6">
  <div class="flex items-center justify-between mb-4">
    <p class="text-sm font-medium text-slate-600">Tổng Items</p>
    <div class="p-2 bg-indigo-100 rounded-lg">
      <svg class="w-5 h-5 text-indigo-600"><!-- cube icon --></svg>
    </div>
  </div>
  <p class="text-2xl font-bold text-slate-900">248</p>
  <p class="text-xs text-green-600 mt-1">+12 so với tháng trước</p>
</div>
```

#### List Card

```html
<div class="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
  <div class="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
    <img src="..." class="w-10 h-10 rounded object-cover flex-shrink-0" />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-slate-900 truncate">Toyota Supra</p>
      <p class="text-xs text-slate-500">Hot Wheels · 1:64</p>
    </div>
    <span class="text-sm font-mono font-semibold text-slate-900">850.000₫</span>
    <span class="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
      Còn hàng
    </span>
  </div>
</div>
```

---

### 7.4 Badges / Status Chips

```html
<!-- Con hàng -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
             text-green-700 bg-green-100">Còn hàng</span>

<!-- Giữ chỗ -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
             text-amber-700 bg-amber-100">Giữ chỗ</span>

<!-- Đã bán -->
<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
             text-slate-600 bg-slate-100">Đã bán</span>

<!-- Tier badge (Members) -->
<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
             text-amber-800 bg-amber-100 border border-amber-300">
  ★ Gold
</span>
```

#### Badge Color Map

| Loại | Text | Background | Border (optional) |
|---|---|---|---|
| Success/Còn hàng | `text-green-700` | `bg-green-100` | — |
| Warning/Giữ chỗ | `text-amber-700` | `bg-amber-100` | — |
| Neutral/Đã bán | `text-slate-600` | `bg-slate-100` | — |
| Info/Chờ hàng | `text-blue-700` | `bg-blue-100` | — |
| Primary/Active | `text-indigo-700` | `bg-indigo-100` | — |
| Danger/Huỷ | `text-red-600` | `bg-red-50` | `border-red-200` |
| Purple/Hoàn tiền | `text-purple-700` | `bg-purple-100` | — |

---

### 7.5 Tables

```html
<div class="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
  <table class="min-w-full divide-y divide-slate-200">
    <thead class="bg-slate-50">
      <tr>
        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider
                   cursor-pointer hover:text-slate-700 select-none">
          Tên sản phẩm
          <svg class="inline w-4 h-4 ml-1"><!-- sort icon --></svg>
        </th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Thương hiệu
        </th>
        <th class="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Trạng thái
        </th>
        <th class="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Giá
        </th>
        <th class="px-4 py-3"></th>
      </tr>
    </thead>
    <tbody class="bg-white divide-y divide-slate-100">
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <img src="..." class="w-8 h-8 rounded object-cover" />
            <span class="text-sm font-medium text-slate-900">Toyota Supra MK4</span>
          </div>
        </td>
        <td class="px-4 py-3 text-sm text-slate-600">Hot Wheels</td>
        <td class="px-4 py-3">
          <span class="badge-green">Còn hàng</span>
        </td>
        <td class="px-4 py-3 text-right font-mono text-sm font-semibold">850.000₫</td>
        <td class="px-4 py-3 text-right">
          <button class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Sửa</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

### 7.6 Modals & Dialogs

```
┌─────────────────────────────────────────┐
│ Backdrop: bg-black/50 fixed inset-0     │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Header (px-6 py-4 border-b)      │  │
│  │  Title: text-lg font-semibold     │  │
│  │                              ✕   │  │
│  ├───────────────────────────────────┤  │
│  │  Body (px-6 py-4)                 │  │
│  │  max-h-[70vh] overflow-y-auto     │  │
│  ├───────────────────────────────────┤  │
│  │  Footer (px-6 py-4 border-t)      │  │
│  │  [Huỷ]            [Xác nhận]      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

```html
<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <!-- Backdrop -->
  <div class="absolute inset-0 bg-black/50" />
  <!-- Modal -->
  <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
      <h3 class="text-lg font-semibold text-slate-900">Xác nhận xoá</h3>
      <button class="p-1 rounded-md hover:bg-slate-100 text-slate-500">✕</button>
    </div>
    <div class="px-6 py-4">
      <p class="text-sm text-slate-600">Bạn có chắc muốn xoá item này không?</p>
    </div>
    <div class="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
      <button class="btn-secondary">Huỷ</button>
      <button class="btn-danger">Xoá</button>
    </div>
  </div>
</div>
```

**Sizes**: `max-w-sm` (confirm dialog), `max-w-md` (form nhỏ), `max-w-2xl` (form lớn), `max-w-4xl` (image viewer)

---

### 7.7 Toasts / Notifications

```html
<!-- Toast container: fixed bottom-right -->
<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">

  <!-- Success toast -->
  <div class="flex items-start gap-3 bg-white rounded-lg shadow-xl border-l-4 border-green-500 p-4">
    <svg class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"><!-- check --></svg>
    <div class="flex-1">
      <p class="text-sm font-semibold text-slate-900">Lưu thành công</p>
      <p class="text-xs text-slate-500 mt-0.5">Item đã được cập nhật.</p>
    </div>
    <button class="text-slate-400 hover:text-slate-600">✕</button>
  </div>

  <!-- Error toast -->
  <div class="flex items-start gap-3 bg-white rounded-lg shadow-xl border-l-4 border-red-500 p-4">
    <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"><!-- x-circle --></svg>
    <div>
      <p class="text-sm font-semibold text-slate-900">Có lỗi xảy ra</p>
      <p class="text-xs text-slate-500 mt-0.5">Không thể kết nối server.</p>
    </div>
  </div>

</div>
```

| Type | Border | Icon | Thời gian auto-close |
|---|---|---|---|
| Success | `border-green-500` | check-circle | 3 giây |
| Error | `border-red-500` | x-circle | 5 giây (không auto) |
| Warning | `border-amber-500` | exclamation | 4 giây |
| Info | `border-blue-500` | information-circle | 3 giây |

---

### 7.8 Pagination

```html
<div class="flex items-center justify-between px-4 py-3 border-t border-slate-200">
  <p class="text-sm text-slate-600">
    Hiển thị <span class="font-medium">1–20</span> trong <span class="font-medium">248</span> items
  </p>
  <div class="flex items-center gap-1">
    <button class="px-3 py-1.5 text-sm rounded-md text-slate-600 hover:bg-slate-100
                   disabled:opacity-40 disabled:cursor-not-allowed">← Trước</button>
    <button class="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white font-medium">1</button>
    <button class="px-3 py-1.5 text-sm rounded-md text-slate-600 hover:bg-slate-100">2</button>
    <button class="px-3 py-1.5 text-sm rounded-md text-slate-600 hover:bg-slate-100">3</button>
    <span class="px-2 text-slate-400">...</span>
    <button class="px-3 py-1.5 text-sm rounded-md text-slate-600 hover:bg-slate-100">13</button>
    <button class="px-3 py-1.5 text-sm rounded-md text-slate-600 hover:bg-slate-100">Tiếp →</button>
  </div>
</div>
```

---

### 7.9 Upload Zones

```html
<!-- Drag-drop upload zone -->
<div class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center
            hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer
            [&.drag-over]:border-indigo-500 [&.drag-over]:bg-indigo-50">
  <svg class="mx-auto w-12 h-12 text-slate-400 mb-4"><!-- upload cloud --></svg>
  <p class="text-sm font-medium text-slate-700">
    Kéo thả ảnh vào đây, hoặc
    <span class="text-indigo-600 underline">chọn file</span>
  </p>
  <p class="text-xs text-slate-500 mt-1">PNG, JPG, WebP — tối đa 5MB mỗi ảnh</p>
  <input type="file" class="hidden" multiple accept="image/*" />
</div>
```

**States**: default / drag-over (`border-indigo-500 bg-indigo-50`) / uploading (progress bar) / error (`border-red-400`)

---

### 7.10 Spinner 360° Viewer Component

```
┌─────────────────────────────────────────────┐
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │                                     │   │
│   │         [Car image frame N]         │   │
│   │                                     │   │
│   │  ← Drag để xoay | Swipe on mobile → │   │
│   │                                     │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   [◀]  ━━━━━━●━━━━━━━━━━  [▶]  [⟳ Auto]   │
│         frame 12 / 24                       │
│                                             │
│   [🔲 Toàn màn hình]                        │
└─────────────────────────────────────────────┘
```

**Specs:**
- Container: `aspect-square` hoặc `aspect-[4/3]`, `bg-slate-900` (dark canvas)
- Cursor: `cursor-grab` → `cursor-grabbing` khi drag
- Loading state: skeleton shimmer + percentage loader
- Preload: tải tất cả frames vào `<img>` ẩn trước khi cho phép tương tác
- Autoplay: 2 fps mặc định, dừng khi user tương tác
- Touch: `touchstart`/`touchmove` → delta X → frame index
- Frame indicator: `font-mono text-xs text-slate-400`

---

### 7.11 Navigation

#### Admin Sidebar

```
┌──────────────────┐
│  ⬡ Diecast360   │  ← Logo (h-16 border-b)
├──────────────────┤
│  📊 Dashboard   │  ← Active: bg-indigo-700 text-white rounded-md
│  📦 Items       │  ← Hover: bg-white/10
│  🛒 Pre-orders  │
│  📋 Inventory   │
│  👥 Members     │
│  🏅 Tiers       │
│  ⚙️  Cài đặt    │
├──────────────────┤  ← border-t mt-auto
│  [Avatar] Tên   │  ← User profile
│  Đăng xuất      │
└──────────────────┘
```

```html
<!-- Sidebar nav item -->
<a href="/items"
   class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
          text-indigo-200 hover:bg-white/10 hover:text-white transition-colors
          [&.active]:bg-indigo-700 [&.active]:text-white">
  <svg class="w-5 h-5 flex-shrink-0"><!-- icon --></svg>
  <span class="truncate">Items</span>
</a>
```

#### Public Top Nav

```html
<header class="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
  <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-2">
      <img src="/logo.png" class="h-8 w-auto" />
      <span class="font-bold text-slate-900">Shop Name</span>
    </a>
    <!-- Nav links (desktop) -->
    <nav class="hidden md:flex items-center gap-6">
      <a class="text-sm font-medium text-slate-600 hover:text-indigo-600">Catalog</a>
      <a class="text-sm font-medium text-slate-600 hover:text-indigo-600">Pre-orders</a>
      <a class="text-sm font-medium text-slate-600 hover:text-indigo-600">Liên hệ</a>
    </nav>
    <!-- Mobile hamburger -->
    <button class="md:hidden p-2 rounded-md hover:bg-slate-100">
      <svg class="w-5 h-5"><!-- menu --></svg>
    </button>
  </div>
</header>
```

---

## 8. Icons

**Library**: [Heroicons v2](https://heroicons.com/) — outline style mặc định, solid cho active states.

```html
<!-- Cài đặt -->
npm install @heroicons/react

<!-- Sử dụng -->
import { CubeIcon } from '@heroicons/react/24/outline'
import { CubeIcon as CubeSolid } from '@heroicons/react/24/solid'

<CubeIcon class="w-5 h-5 text-slate-500" />
```

| Icon | Heroicon name | Dùng cho |
|---|---|---|
| Items/Hàng hoá | `CubeIcon` | Nav items, section |
| Pre-orders | `ShoppingCartIcon` | Nav, badge |
| Members | `UsersIcon` | Nav, section |
| Upload | `CloudArrowUpIcon` | Upload zones |
| 360° | `ArrowPathIcon` | Spinner badge |
| Settings | `Cog6ToothIcon` | Nav cài đặt |
| Dashboard | `ChartBarIcon` | Nav dashboard |
| Search | `MagnifyingGlassIcon` | Search inputs |
| Filter | `FunnelIcon` | Filter buttons |
| Edit | `PencilSquareIcon` | Edit actions |
| Delete | `TrashIcon` | Delete actions |
| Check | `CheckCircleIcon` | Success state |
| Error | `XCircleIcon` | Error state |
| Camera | `PhotoIcon` | Image tab |
| Sort | `ChevronUpDownIcon` | Table sort |
| Expand | `ArrowsPointingOutIcon` | Fullscreen |

---

## 9. Grid System

```css
/* Tailwind breakpoints */
sm:  640px   /* Mobile landscape, small tablet */
md:  768px   /* Tablet */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
2xl: 1536px  /* Wide screen */
```

### 12-Column Grid

```html
<!-- Responsive grid ví dụ -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <!-- Item cards -->
</div>

<!-- 2-column form layout -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div><!-- left column --></div>
  <div><!-- right column --></div>
</div>

<!-- Admin layout -->
<div class="flex min-h-screen">
  <aside class="w-64 fixed inset-y-0 left-0"><!-- sidebar --></aside>
  <main class="flex-1 ml-64 p-8"><!-- content --></main>
</div>
```

### Content Max-Width

| Context | Class |
|---|---|
| Trang admin (content) | `max-w-7xl mx-auto` |
| Form đơn | `max-w-2xl` |
| Modal | `max-w-md` → `max-w-2xl` |
| Public catalog | `max-w-7xl mx-auto` |
| Public item detail | `max-w-5xl mx-auto` |

---

## 10. Motion & Animation

```css
/* Transition durations */
transition-colors:    150ms   /* button hover, link hover */
transition-shadow:    200ms   /* card hover */
transition-transform: 300ms   /* image scale, slide-over */
transition-opacity:   200ms   /* modal fade, toast */

/* Easing */
ease-in-out   /* general UI */
ease-out      /* enter animations */
ease-in       /* exit animations */
```

### Tailwind Animation Classes

```html
<!-- Hover scale (item card image) -->
group-hover:scale-105 transition-transform duration-300

<!-- Fade in (modal, toast) -->
animate-[fadeIn_200ms_ease-out]

<!-- Spin (loading icon) -->
animate-spin

<!-- Pulse (skeleton loading) -->
animate-pulse bg-slate-200

<!-- Spinner 360° autoplay -->
/* Custom: requestAnimationFrame với delta time */
```

### Skeleton Loading

```html
<div class="animate-pulse space-y-3">
  <div class="aspect-square bg-slate-200 rounded-lg"></div>
  <div class="h-4 bg-slate-200 rounded w-3/4"></div>
  <div class="h-4 bg-slate-200 rounded w-1/2"></div>
</div>
```

---

*Document này là nguồn chân lý duy nhất cho visual language của Diecast360. Mọi thay đổi phải được cập nhật tại đây trước khi áp dụng vào code.*
