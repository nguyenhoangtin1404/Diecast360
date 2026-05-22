---
title: "Hướng Dẫn Sử Dụng - User Manual"
document_id: "36"
version: "1.0"
date: "2026-05-22"
author: "BA/PO Team - Diecast360"
status: "Final"
audience: "Shop Owner / Shop Admin"
---

# Hướng Dẫn Sử Dụng Diecast360

## Mục Lục

1. [Giới Thiệu](#1-giới-thiệu)
2. [Đăng Nhập Hệ Thống](#2-đăng-nhập-hệ-thống)
3. [Tổng Quan Giao Diện](#3-tổng-quan-giao-diện)
4. [Quản Lý Sản Phẩm](#4-quản-lý-sản-phẩm)
5. [Bán Hàng Qua Facebook](#5-bán-hàng-qua-facebook)
6. [Quản Lý Pre-Order](#6-quản-lý-pre-order)
7. [Quản Lý Kho](#7-quản-lý-kho)
8. [Quản Lý Hội Viên](#8-quản-lý-hội-viên)
9. [Báo Cáo](#9-báo-cáo)
10. [Tính Năng AI](#10-tính-năng-ai)
11. [Cài Đặt Shop](#11-cài-đặt-shop)
12. [Quản Lý Nhân Viên](#12-quản-lý-nhân-viên)
13. [FAQ và Xử Lý Sự Cố](#13-faq-và-xử-lý-sự-cố)

---

## 1. Giới Thiệu

### Diecast360 là gì?

**Diecast360** là ứng dụng web quản lý toàn diện dành cho các shop kinh doanh mô hình xe diecast tỉ lệ 1:64. Diecast360 giúp bạn:

- **Quản lý kho hàng** một cách chuyên nghiệp với đầy đủ thông tin sản phẩm
- **Chụp và trưng bày ảnh 360°** giúp khách hàng xem sản phẩm mọi góc độ
- **Xử lý đơn pre-order** theo đúng quy trình từ đặt cọc đến thanh toán
- **Tích điểm hội viên** tự động theo từng giao dịch
- **Bán hàng qua Facebook** nhanh hơn với tính năng auto-post và copy caption
- **Báo cáo doanh thu** trực quan theo ngày/tuần/tháng

### Lợi ích chính

| Tính năng | Lợi ích |
|----------|---------|
| Ảnh 360° (Spin Viewer) | Khách hàng tự xem sản phẩm, giảm câu hỏi lặp |
| AI Caption | Tạo nội dung Facebook chuyên nghiệp trong 3 giây |
| Pre-order Tracker | Không bỏ sót đơn hàng nào |
| Điểm hội viên | Tăng tỷ lệ khách mua lại |
| Multi-shop | Một tài khoản, quản lý nhiều shop |

---

## 2. Đăng Nhập Hệ Thống

### Bước đăng nhập

1. Mở trình duyệt và truy cập: `https://app.diecast360.com`
2. Nhập **Email** và **Mật khẩu** do Admin cung cấp
3. Nhấn nút **Đăng nhập**
4. Nếu tài khoản có nhiều shop, chọn shop cần làm việc từ dropdown **Chọn Shop**

> **Lưu ý bảo mật**: Không chia sẻ mật khẩu. Phiên đăng nhập kéo dài 7 ngày (có thể thay đổi theo cài đặt). Sau 7 ngày không hoạt động, hệ thống tự đăng xuất.

### Quên mật khẩu

Hiện tại, tính năng reset mật khẩu tự động chưa được triển khai. Liên hệ **Shop Admin** hoặc **Admin hệ thống** để được reset mật khẩu.

### Chuyển đổi shop

Nếu tài khoản của bạn thuộc nhiều shop:

1. Nhấp vào **tên shop** ở góc trên bên phải header
2. Chọn **Đổi Shop** từ menu dropdown
3. Chọn shop muốn chuyển sang từ danh sách
4. Hệ thống tự tải lại dữ liệu của shop mới

---

## 3. Tổng Quan Giao Diện

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: [Logo Diecast360]   [Tên Shop ▼]   [Avatar ▼]  │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  SIDEBAR   │              NỘI DUNG CHÍNH                │
│            │                                             │
│ 📦 Sản phẩm│  Dashboard / Trang hiện tại                │
│ 🛒 Pre-order│                                           │
│ 📦 Kho     │                                             │
│ 👥 Hội viên│                                             │
│ 📊 Báo cáo │                                             │
│ ⚙️ Cài đặt │                                             │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

### Các khu vực chính

- **Header**: Tên shop đang hoạt động, avatar và menu tài khoản
- **Sidebar (thanh bên trái)**: Điều hướng giữa các module
- **Nội dung chính**: Hiển thị nội dung của module đang chọn
- **Dashboard**: Trang đầu tiên sau khi đăng nhập — tóm tắt tổng quan

### Dashboard

Dashboard hiển thị:
- Số lượng đơn pre-order theo trạng thái (đang chờ, đã về hàng, v.v.)
- Doanh thu tháng hiện tại
- Top sản phẩm được đặt nhiều nhất
- Hoạt động gần đây

---

## 4. Quản Lý Sản Phẩm

### 4.1 Tạo Sản Phẩm Mới

1. Vào **Sidebar → Sản phẩm** → Nhấn **+ Thêm sản phẩm**
2. Điền đầy đủ thông tin:

| Trường | Bắt buộc | Mô tả |
|--------|---------|-------|
| Tên sản phẩm | ✅ | Tên đầy đủ của mô hình (VD: "Hot Wheels RLC Camaro 2024") |
| Hãng sản xuất (Brand) | | Matchbox, Hot Wheels, Tomica,... |
| Series | | Tên series (VD: "Red Line Club") |
| Tỉ lệ | | 1:64, 1:43, 1:18,... |
| Năm sản xuất | | Năm phát hành mô hình |
| Mô tả | | Mô tả chi tiết, có thể dùng AI để tạo |
| Giá bán (VNĐ) | ✅ | Giá niêm yết |
| Số lượng | | Tồn kho hiện tại |
| Trạng thái | ✅ | con_hang / giu_cho / da_ban |
| Công khai (is_public) | | Bật để hiển thị trên trang public |

3. Nhấn **Lưu** để tạo sản phẩm

> **Mẹo**: Dùng nút **"Tạo mô tả bằng AI"** để tự động sinh mô tả sản phẩm chuyên nghiệp.

### 4.2 Upload Ảnh Sản Phẩm

1. Mở trang chỉnh sửa sản phẩm
2. Kéo thả ảnh vào vùng upload hoặc nhấn **Chọn ảnh**
3. Hỗ trợ: JPG, PNG, WebP — tối đa 10 MB mỗi ảnh
4. **Đặt ảnh bìa**: Kéo ảnh muốn làm bìa lên vị trí đầu tiên, hoặc nhấn biểu tượng ⭐ trên ảnh
5. **Sắp xếp thứ tự**: Kéo thả để thay đổi thứ tự hiển thị
6. Nhấn **Lưu ảnh**

### 4.3 Tạo Bộ Ảnh 360° (SpinSet)

Tính năng này cho phép khách hàng xoay sản phẩm 360° trên trình duyệt.

**Yêu cầu**: Tối thiểu 8 frame, tối đa 48 frame. Khuyến nghị 24 frame cho chất lượng tốt nhất.

**Các bước:**

1. Mở sản phẩm → Tab **Ảnh 360°** → Nhấn **Tạo SpinSet mới**
2. Đặt tên cho SpinSet (VD: "Góc chính diện")
3. Upload ảnh theo thứ tự từ frame 0 (đầu tiên) đến frame cuối
   - Ảnh phải được chụp xoay đều nhau (VD: 24 frame = mỗi frame xoay 15°)
   - Thứ tự upload = thứ tự hiển thị khi xoay
4. Kiểm tra preview bằng cách kéo chuột trên ảnh preview
5. Nếu muốn đây là SpinSet mặc định, bật toggle **Đặt làm mặc định**
6. Nhấn **Lưu SpinSet**

> **Lưu ý**: Một sản phẩm có thể có nhiều SpinSet (VD: góc chính diện, góc dưới, góc trên). SpinSet mặc định sẽ hiển thị trước tiên cho khách.

### 4.4 Xuất Bản Sản Phẩm

Để sản phẩm hiển thị trên trang public:

1. Mở sản phẩm → Tìm toggle **Công khai (is_public)**
2. Bật toggle → Nhấn **Lưu**
3. Kiểm tra bằng cách xem **Link public** của sản phẩm

> **Lưu ý**: Sản phẩm có trạng thái `da_ban` sẽ KHÔNG hiển thị trên trang public, ngay cả khi bật is_public.

### 4.5 Trạng Thái Kho

| Trạng thái | Ký hiệu | Ý nghĩa | Số lượng |
|-----------|---------|---------|---------|
| **Còn hàng** | `con_hang` | Có sẵn, sẵn sàng bán | > 0 |
| **Giữ chỗ** | `giu_cho` | Đã có khách đặt, không bán thêm | Bất kỳ |
| **Đã bán** | `da_ban` | Hết hàng, đã bán xong | Luôn = 0 |

**Khi đổi sang `da_ban`**: Hệ thống tự động đặt số lượng về 0.

### 4.6 Xóa Sản Phẩm (Soft Delete)

Diecast360 dùng **xóa mềm** (soft delete) — dữ liệu không bị mất vĩnh viễn.

- **Xóa**: Nhấn nút **Xóa** → Xác nhận → Sản phẩm ẩn khỏi danh sách
- **Khôi phục**: Vào bộ lọc → Chọn **Đã xóa** → Tìm sản phẩm → Nhấn **Khôi phục**

### 4.7 Tìm Kiếm và Lọc

Thanh tìm kiếm ở trên cùng danh sách sản phẩm hỗ trợ:
- Tìm theo tên, hãng, series
- Lọc theo trạng thái (con_hang / giu_cho / da_ban)
- Lọc theo trạng thái công khai
- Lọc theo ngày tạo

### 4.8 Xuất CSV

1. Vào **Sản phẩm** → Nhấn nút **Xuất CSV**
2. Chọn bộ lọc (nếu muốn xuất một phần)
3. File CSV sẽ được tải về máy
4. Mở bằng Excel hoặc Google Sheets

---

## 5. Bán Hàng Qua Facebook

### 5.1 Copy Caption

1. Vào danh sách sản phẩm hoặc trang chi tiết sản phẩm
2. Nhấn nút **Copy Caption**
3. Caption được copy vào clipboard — paste vào Facebook post

Caption mẫu được tạo tự động theo template:
```
🚗 [Tên sản phẩm]
🏷️ Hãng: [Brand] | Series: [Series]
📦 Tình trạng: Còn hàng
💰 Giá: [Giá] VNĐ

[Mô tả ngắn]

👉 Xem ảnh 360°: [Link public]
📞 Inbox để đặt hàng!
```

### 5.2 Copy Link Public

1. Trên trang sản phẩm → Nhấn **Copy Link**
2. Link có dạng: `https://app.diecast360.com/public/items/{id}`
3. Khách hàng dùng link này để xem sản phẩm và ảnh 360°

### 5.3 Lưu Link Bài Facebook

Sau khi đăng bài Facebook, lưu link bài lại để tra cứu sau:

1. Copy URL bài Facebook vừa đăng
2. Vào trang sản phẩm → Trường **Link Facebook**
3. Dán URL → Nhấn **Lưu**

### 5.4 Tự Động Đăng Bài (Nếu Cấu Hình)

Nếu Shop đã cấu hình Facebook Page Access Token:

1. Vào trang sản phẩm → Tab **Facebook**
2. Xem trước caption (có thể chỉnh sửa)
3. Chọn **Đăng lên Facebook Page**
4. Nhấn **Đăng ngay** hoặc **Lên lịch**
5. Bài sẽ tự động đăng lên Facebook Page của shop

---

## 6. Quản Lý Pre-Order

### 6.1 Sơ Đồ Trạng Thái

```
PENDING_CONFIRMATION
    │
    ├──────────────► CANCELLED (terminal)
    │
    ▼
WAITING_FOR_GOODS
    │
    ├──────────────► CANCELLED (terminal)
    │
    ▼
ARRIVED
    │
    ├──────────────► CANCELLED (terminal)
    │
    ▼
PAID (terminal)
    │
    ▼
REFUNDED (terminal)
```

| Trạng thái | Ý nghĩa |
|-----------|---------|
| **PENDING_CONFIRMATION** | Khách vừa đặt, chờ xác nhận cọc |
| **WAITING_FOR_GOODS** | Đã xác nhận, đang chờ hàng về |
| **ARRIVED** | Hàng đã về, thông báo khách thanh toán |
| **PAID** | Đã thanh toán đầy đủ, hoàn thành |
| **CANCELLED** | Đã hủy (không thể hoàn tác) |
| **REFUNDED** | Đã hoàn tiền (chỉ từ PAID) |

### 6.2 Tạo Pre-Order Mới

1. **Cách 1**: Từ trang sản phẩm → Nhấn **Tạo Pre-Order**
2. **Cách 2**: Vào **Pre-Order → + Thêm mới**
3. Điền thông tin:
   - Chọn sản phẩm (Item)
   - Chọn/tạo khách hàng (Member)
   - Số lượng đặt
   - Giá đặt cọc
   - Ghi chú (nguồn đặt: inbox, comment, v.v.)
4. Nhấn **Tạo đơn**

### 6.3 Xem Danh Sách và Chuyển Trạng Thái

1. Vào **Pre-Order** → Xem danh sách tất cả đơn
2. Lọc theo trạng thái, thời gian, sản phẩm
3. Nhấp vào đơn → Xem chi tiết
4. Nhấn **Chuyển trạng thái** → Chọn trạng thái mới
5. Thêm ghi chú nếu cần → Xác nhận

> **Quan trọng**: Các trạng thái terminal (PAID, CANCELLED, REFUNDED) **không thể đổi sang trạng thái khác**.

### 6.4 Pre-Order Summary Dashboard

Tại trang **Pre-Order → Dashboard**:
- Số đơn theo từng trạng thái
- Tổng giá trị đơn đang chờ thanh toán
- Danh sách đơn cần xử lý ngay (ARRIVED quá X ngày)

---

## 7. Quản Lý Kho

### 7.1 Nhập Hàng (Stock In)

Khi nhận hàng mới:

1. Vào **Kho → Nhập hàng**
2. Chọn sản phẩm
3. Nhập số lượng nhận thực tế
4. Nhập giá nhập (nếu muốn theo dõi giá vốn)
5. Thêm ghi chú (số hóa đơn, tên nhà cung cấp)
6. Nhấn **Xác nhận nhập kho**

Hệ thống tự động cộng vào tồn kho hiện tại của sản phẩm.

### 7.2 Xuất Hàng (Stock Out)

Khi bán hàng tại quầy (không qua pre-order):

1. Vào **Kho → Xuất hàng**
2. Chọn sản phẩm
3. Nhập số lượng xuất
4. Thêm ghi chú (tên khách hàng, lý do)
5. Nhấn **Xác nhận xuất kho**

### 7.3 Điều Chỉnh Tồn Kho (Adjustment)

Khi kiểm kê phát hiện sai lệch:

1. Vào **Kho → Điều chỉnh**
2. Chọn sản phẩm
3. Nhập số lượng thực tế đang có
4. Hệ thống tự tính chênh lệch (dương/âm)
5. Thêm lý do điều chỉnh (bắt buộc)
6. Nhấn **Xác nhận điều chỉnh**

### 7.4 Xem Lịch Sử Giao Dịch

1. Vào **Kho → Lịch sử**
2. Lọc theo sản phẩm, loại giao dịch, thời gian
3. Mỗi dòng hiển thị: ngày, loại, sản phẩm, số lượng, người thực hiện

### 7.5 Kiểm Tra Reconciliation

Tính năng đối chiếu tồn kho lý thuyết vs. thực tế:

1. Vào **Kho → Reconciliation**
2. Chọn khoảng thời gian
3. Xem báo cáo: tồn đầu kỳ + nhập - xuất = tồn cuối kỳ
4. So sánh với kiểm kê thực tế

---

## 8. Quản Lý Hội Viên

### 8.1 Thêm Hội Viên Mới

1. Vào **Hội viên → + Thêm hội viên**
2. Điền thông tin:
   - Họ tên (bắt buộc)
   - Số điện thoại (bắt buộc, dùng để tìm kiếm)
   - Facebook URL (để liên kết với inbox)
   - Email
   - Ngày sinh (để nhận ưu đãi sinh nhật)
3. Nhấn **Lưu**

### 8.2 Xem Thông Tin và Điểm Tích Lũy

1. Vào **Hội viên** → Tìm và chọn hội viên
2. Trang chi tiết hiển thị:
   - Thông tin liên hệ
   - **Hạng thành viên** (Bronze/Silver/Gold/Platinum)
   - **Điểm hiện tại**
   - Lịch sử điểm (từng giao dịch)
   - Lịch sử pre-order

### 8.3 Điều Chỉnh Điểm Thủ Công

Chỉ dùng trong trường hợp đặc biệt (lỗi hệ thống, khuyến mãi riêng):

1. Vào trang chi tiết hội viên
2. Nhấn **Điều chỉnh điểm**
3. Nhập số điểm cần thêm (dương) hoặc trừ (âm)
4. Nhập lý do điều chỉnh (bắt buộc)
5. Xác nhận

> Mọi thay đổi điểm đều được ghi vào **ledger** và không thể xóa.

### 8.4 Quản Lý Hạng Thành Viên (Tiers)

Hạng tự động nâng khi hội viên tích đủ điểm:

| Hạng | Điểm tối thiểu | Quyền lợi |
|------|--------------|---------|
| Bronze | 0 | Điểm tích lũy cơ bản |
| Silver | 500 | 1.2x điểm cho mỗi đơn |
| Gold | 2000 | 1.5x điểm + ưu tiên hàng về |
| Platinum | 5000 | 2x điểm + ưu đãi đặc biệt |

Cài đặt điểm và tier: Vào **Cài đặt → Loyalty**.

---

## 9. Báo Cáo

### 9.1 Báo Cáo Tổng Hợp (Summary)

Vào **Báo cáo → Summary**:

1. Chọn khoảng thời gian: **7 ngày / 30 ngày / 90 ngày**
2. Xem các chỉ số:
   - Tổng đơn pre-order
   - Tổng doanh thu (đơn PAID)
   - Số hội viên mới
   - Sản phẩm được đặt nhiều nhất

### 9.2 Xu Hướng (Trends)

Vào **Báo cáo → Xu hướng**:
- Biểu đồ đường theo ngày/tuần
- So sánh với kỳ trước
- Xuất báo cáo ra CSV

---

## 10. Tính Năng AI

### 10.1 Tạo Mô Tả Sản Phẩm Bằng AI

1. Khi tạo/chỉnh sửa sản phẩm → Ô **Mô tả** → Nhấn **✨ Tạo bằng AI**
2. Hệ thống dùng thông tin tên, hãng, series, năm để tạo mô tả
3. Xem trước và chỉnh sửa nếu cần
4. Nhấn **Áp dụng** để điền vào ô mô tả

### 10.2 Tạo Caption Facebook Bằng AI

1. Vào trang sản phẩm → Tab **Facebook** → Nhấn **✨ Tạo Caption AI**
2. Chọn tone (chuyên nghiệp / thân thiện / phấn khích)
3. Xem trước caption
4. Nhấn **Copy** hoặc **Đăng luôn**

### 10.3 Import Sản Phẩm Từ Ảnh (AI Draft)

Tính năng nhận diện sản phẩm từ ảnh chụp:

1. Vào **Sản phẩm → + Thêm từ ảnh**
2. Upload ảnh sản phẩm (ảnh hộp hoặc ảnh xe)
3. AI tự động nhận diện và điền: tên, hãng, series
4. Kiểm tra và chỉnh sửa thông tin
5. Nhấn **Tạo sản phẩm**

> **Lưu ý**: Tính năng AI cần kết nối internet ổn định. Nếu AI không nhận diện được, điền thủ công.

---

## 11. Cài Đặt Shop

Vào **Cài đặt** từ sidebar.

### 11.1 Thông Tin Liên Hệ (Contact)

Điền thông tin hiển thị trên trang public của shop:
- Tên shop
- Số điện thoại
- Email liên hệ
- Địa chỉ
- Link Facebook Page
- Giờ hoạt động

### 11.2 Giao Diện (Appearance)

Tùy chỉnh thương hiệu shop:
- **Logo**: Upload logo shop (PNG/SVG, nền trong)
- **Màu chủ đạo**: Chọn màu sắc theme (hex color picker)
- **Banner**: Ảnh banner trang chủ public

### 11.3 Cài Đặt Loyalty (Điểm Tích Lũy)

- **Tỷ lệ tích điểm**: VD: cứ 10.000 VNĐ = 1 điểm
- **Ngưỡng tier**:
  - Silver: X điểm
  - Gold: Y điểm
  - Platinum: Z điểm
- **Hệ số nhân điểm** theo tier
- **Điểm hết hạn**: bao nhiêu tháng không dùng thì điểm hết hạn

---

## 12. Quản Lý Nhân Viên

### Các vai trò (Role)

| Role | Quyền hạn |
|------|---------|
| **Shop Admin** | Toàn quyền trong shop: tạo/xóa/sửa mọi thứ |
| **Shop Staff** | Chỉ xem (read-only) — không tạo/sửa/xóa |

### Thêm Nhân Viên

1. Vào **Cài đặt → Nhân viên → + Thêm nhân viên**
2. Nhập email của nhân viên (phải có tài khoản hệ thống)
3. Chọn role: **Shop Staff**
4. Nhấn **Thêm**

> Nhân viên mới nhận thông báo qua email (nếu cấu hình email).

### Xóa Nhân Viên

1. Vào **Cài đặt → Nhân viên**
2. Tìm nhân viên cần xóa
3. Nhấn biểu tượng xóa (🗑️) → Xác nhận

---

## 13. FAQ và Xử Lý Sự Cố

### Câu hỏi thường gặp

**Q: Tại sao sản phẩm của tôi không hiển thị trên trang public?**
A: Kiểm tra:
1. Toggle **Công khai (is_public)** đã bật chưa?
2. Trạng thái có phải `da_ban` không? (`da_ban` không hiển thị public)
3. Shop có đang ở trạng thái **active** không?

**Q: Upload ảnh bị lỗi "File quá lớn"?**
A: Mỗi ảnh tối đa 10 MB. Dùng phần mềm nén ảnh (VD: Squoosh.app) để giảm kích thước trước khi upload.

**Q: SpinSet 360° bị giật/không mượt?**
A: Frame không đều nhau hoặc thiếu frame. Đảm bảo:
- Số frame đủ (khuyến nghị 24 hoặc 36)
- Góc xoay đều nhau giữa các frame
- Ảnh có cùng kích thước và nền

**Q: Điểm hội viên chưa được cộng sau khi đơn PAID?**
A: Điểm chỉ được cộng khi đơn chuyển sang trạng thái **PAID**. Kiểm tra trạng thái đơn. Nếu đơn đã PAID mà chưa có điểm, liên hệ Admin hệ thống.

**Q: Tôi lỡ bấm CANCELLED, có thể hủy không?**
A: **Không thể**. CANCELLED là trạng thái cuối (terminal). Nếu khách vẫn muốn mua, tạo đơn pre-order mới.

**Q: Tính năng AI không hoạt động?**
A: Kiểm tra:
1. Kết nối internet
2. Thử lại sau 1 phút (có thể do giới hạn API tạm thời)
3. Liên hệ Admin nếu vẫn không hoạt động

**Q: Quên mật khẩu, phải làm sao?**
A: Liên hệ **Shop Admin** của bạn hoặc gửi email đến đội hỗ trợ Diecast360.

### Liên Hệ Hỗ Trợ

| Vấn đề | Liên hệ |
|--------|---------|
| Quên mật khẩu, phân quyền | Shop Admin của bạn |
| Lỗi kỹ thuật, bug | Email: support@diecast360.com |
| Câu hỏi về sử dụng | Group Zalo/Facebook nội bộ |

---

*Tài liệu này dành cho Shop Owner và Shop Admin của Diecast360.*
*Phiên bản: 1.0 — Cập nhật: 2026-05-22*
