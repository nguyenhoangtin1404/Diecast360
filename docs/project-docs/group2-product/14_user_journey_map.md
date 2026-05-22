---
title: User Journey Map
version: 1.0
created: 2026-05-22
author: BA/PO Team
project: Diecast360
---

# User Journey Map — Diecast360

## 3 Personas

| Persona | Tên | Vai trò | Mục tiêu chính |
|---------|-----|---------|----------------|
| Persona 1 | Anh Minh | Shop Owner / Shop Admin | Vận hành shop diecast chuyên nghiệp, tăng doanh thu |
| Persona 2 | Bạn Linh | Shop Staff (nhân viên) | Xử lý vận hành hàng ngày: kho, đơn hàng |
| Persona 3 | Chị Mai | End Customer (khách mua) | Tìm và mua mô hình diecast yêu thích |

---

## Journey 1: Anh Minh — Shop Owner

### Profile

- **Tên:** Nguyễn Văn Minh, 34 tuổi
- **Nghề nghiệp:** Chủ shop diecast "Minh Diecast", bán online qua Facebook
- **Kinh nghiệm tech:** Trung bình (dùng smartphone thành thạo, không rành dev)
- **Pain point hiện tại:** Quản lý Excel + Messenger mất 3-4 tiếng/ngày, hay bị trùng đơn, khách inbox nhiều
- **Mục tiêu:** Tiết kiệm thời gian, bán được nhiều hàng hơn, trông chuyên nghiệp hơn

---

### Phase 1: Setup Shop (Ngày 1)

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Nhận link từ platform owner → Đăng nhập lần đầu → Đổi mật khẩu → Điền thông tin shop (tên, địa chỉ, SĐT, logo) → Cấu hình template caption Facebook → Cấu hình loyalty (earn rate, tier) |
| **Touchpoints** | Email mời, trang login, form cài đặt shop, trang cấu hình loyalty |
| **Emotions** | Hào hứng tò mò (đầu) → Hơi lo lắng khi gặp nhiều setting → Nhẹ nhõm khi xong |
| **Pain Points** | Form setup có nhiều trường, không biết cấu hình loyalty như thế nào là đúng; thiếu giá trị mẫu (placeholder) |
| **Opportunities** | Onboarding wizard step-by-step; template cấu hình sẵn cho shop diecast tiêu biểu; in-app tooltip giải thích từng trường |

---

### Phase 2: Thêm Hàng Đầu tiên (Ngày 1–3)

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Vào "Thêm sản phẩm" → Thử tính năng AI (upload ảnh model xe) → Review AI draft → Sửa tên/giá → Lưu → Upload ảnh cover và ảnh chi tiết → Tạo SpinSet (batch upload 24 frame) → Preview spinner → Nhập caption Facebook → Save |
| **Touchpoints** | Form tạo item, AI draft review, image upload, SpinSet editor, spinner preview |
| **Emotions** | Thích thú khi AI điền tự động → Ấn tượng với spinner preview → Tự hào khi item trông đẹp |
| **Pain Points** | Chụp 24 frame đúng chuẩn mất công (cần hướng dẫn góc chụp); AI đôi khi nhận nhầm brand |
| **Opportunities** | Hướng dẫn chụp ảnh spinner (video tutorial ngắn); AI confidence score để biết cần check kỹ không; template chụp 24 frame (vòng tròn 15°/frame) |

---

### Phase 3: Publish & Bán Hàng (Ngày 3–7)

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Toggle "Publish" → Copy caption → Mở Facebook → Paste + đăng bài → Copy link → Đăng kèm link catalog → Lưu link bài đã đăng vào hệ thống → Nhận notification có pre-order mới |
| **Touchpoints** | Toggle is_public, nút Copy Caption, nút Copy Link, Facebook Page, FacebookPost log |
| **Emotions** | Phấn khích khi bài đăng đẹp, chuyên nghiệp → Vui khi pre-order đầu tiên đến → Tự tin hơn khi link catalog được chia sẻ |
| **Pain Points** | Phải mở 2 tab (Diecast360 + Facebook), quy trình nhiều bước; khách inbox hỏi thêm vẫn phải trả lời Messenger |
| **Opportunities** | One-click share trực tiếp lên Facebook (v2 với Graph API); notification realtime khi có pre-order; auto-populate Facebook post với ảnh cover từ catalog |

---

### Phase 4: Xử lý Pre-Order Hàng Ngày

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Mở dashboard buổi sáng → Xem pre-order mới (PENDING_CONFIRMATION) → Xác nhận → Liên hệ khách (Zalo/phone) → Khi hàng về: cập nhật → ARRIVED → Khách lấy hàng: cập nhật → PAID → Nhập tiền kho → Điểm tự động cộng cho member |
| **Touchpoints** | Dashboard widget, bảng pre-order, dropdown status, inventory form |
| **Emotions** | Hài lòng khi quy trình rõ ràng → Yên tâm khi biết chính xác đơn nào cần xử lý → Vui khi thấy doanh thu dashboard |
| **Pain Points** | Vẫn phải liên hệ khách ngoài hệ thống (Zalo/điện thoại); muốn có email/SMS tự động gửi khách |
| **Opportunities** | Email/SMS notification tự động khi status thay đổi; template tin nhắn nhanh tích hợp Zalo OA (v2) |

---

### Phase 5: Quản lý Kho & Báo cáo

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Nhập kho khi hàng mới về → Kiểm kê hàng tuần → Xem báo cáo tháng → Xem top item bán chạy → Xem member VIP → Lên kế hoạch nhập hàng |
| **Touchpoints** | Form nhập kho, lịch sử transaction, dashboard báo cáo, danh sách member |
| **Emotions** | Tự tin khi số liệu rõ ràng → Bất ngờ khi thấy item nào bán tốt → Hài lòng khi thấy khách VIP tích điểm nhiều |
| **Pain Points** | Muốn báo cáo chi tiết hơn theo từng thương hiệu; muốn biết lợi nhuận (cần nhập giá vốn) |
| **Opportunities** | Thêm trường giá vốn để tính profit margin; báo cáo phân tích theo brand; forecast nhập hàng dựa trên lịch sử bán |

---

### Emotion Journey — Anh Minh

```
Cảm xúc:  Hào hứng → Lo lắng → Ấn tượng → Phấn khích → Tự tin → Hài lòng
Thời gian: Setup     → Config  → AI+Spinner → Publish  → Pre-order → Báo cáo
           (Ngày 1)             (Ngày 1-3)   (Ngày 3)  (Tuần 1)   (Tháng 1)
```

**Khoảnh khắc WOW:** Lần đầu xem spinner 360° của mô hình mình chụp → "Cái này giống ứng dụng ngoại mà!"

**Khoảnh khắc PAIN:** Chụp 24 frame đúng thứ tự không đơn giản → cần tutorial chi tiết hơn

---

## Journey 2: Bạn Linh — Shop Staff

### Profile

- **Tên:** Trần Thị Linh, 22 tuổi
- **Nghề nghiệp:** Nhân viên bán hàng tại "Minh Diecast" (làm thêm bán thời gian)
- **Kinh nghiệm tech:** Khá (dùng app thành thạo, hay dùng TikTok, Shopee)
- **Pain point:** Phải ghi chép tay, dễ quên đơn, phải nhắn Messenger từng khách
- **Mục tiêu:** Làm việc nhanh, ít sai sót, không cần hỏi anh Minh liên tục

---

### Phase 1: Onboarding (Ngày đầu làm việc)

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Nhận tài khoản từ anh Minh → Đăng nhập → Xem qua giao diện → Đọc hướng dẫn sử dụng ngắn → Làm quen với danh sách item và pre-order |
| **Touchpoints** | Email tài khoản, trang login, dashboard, user guide PDF/in-app |
| **Emotions** | Hơi lo không biết dùng → Nhẹ nhõm khi giao diện quen thuộc → Tự tin sau 30 phút |
| **Pain Points** | Không có guided tour interactive; phải tự khám phá |
| **Opportunities** | Onboarding tour cho staff (khác với admin tour); highlight nhanh 3 tính năng dùng nhiều nhất |

---

### Phase 2: Nhận Hàng & Cập nhật Kho (Hàng tuần)

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Anh Minh báo có hàng về → Linh mở Diecast360 → Vào "Nhập kho" → Tìm item (search tên) → Nhập số lượng → Thêm note "Lô 15/5" → Xác nhận → Tồn kho cập nhật tự động |
| **Touchpoints** | Menu "Quản lý kho", form nhập kho, autocomplete tìm item |
| **Emotions** | Quen thuộc khi đã làm vài lần → Nhanh và tự tin sau tuần đầu |
| **Pain Points** | Autocomplete đôi khi hiện nhiều kết quả giống nhau (brand khác nhau nhưng tên xe giống); phải chọn đúng |
| **Opportunities** | Hiển thị rõ brand + tên + ảnh thumbnail trong autocomplete để tránh nhầm |

---

### Phase 3: Xử lý Pre-Order Hàng Ngày

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Mở tab Pre-Order mỗi sáng → Filter "PENDING_CONFIRMATION" → Xem danh sách → Liên hệ khách (Zalo ngoài app) → Sau khi xác nhận: đổi status → WAITING_FOR_GOODS → Ghi note nội bộ → Khi hàng về: đổi → ARRIVED → Nhắn khách → Khách đến lấy: đổi → PAID |
| **Touchpoints** | Bảng pre-order, filter status, dropdown chuyển status, note field |
| **Emotions** | Tập trung khi xử lý đơn → Vui khi hoàn thành đơn → Đôi khi stress khi nhiều đơn cùng lúc |
| **Pain Points** | Không có thông báo tự động cho khách → phải nhắn tay; không thấy được lịch sử liên lạc với khách |
| **Opportunities** | Note field rõ ràng hơn; history timeline đơn hàng với tất cả thay đổi; badge "Đơn chờ lâu" (> 48h PENDING) |

---

### Phase 4: Hỗ trợ Khách hỏi

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Khách inbox Facebook hỏi "Còn hàng X không?" → Linh mở Diecast360 → Search item → Xem tồn kho → Trả lời khách → Khách hỏi giá → Xem giá trong item detail → Trả lời |
| **Touchpoints** | Search item, item detail (tồn kho, giá), Facebook Messenger (ngoài app) |
| **Emotions** | Tự tin khi có thông tin chính xác → Không còn phải phán đoán hay hỏi anh Minh |
| **Pain Points** | Phải switch qua lại giữa Messenger và Diecast360; muốn có quick view không cần vào item detail |
| **Opportunities** | Quick view popup khi hover item trong list (tồn kho, giá, trạng thái); mobile-optimized list cho Linh dùng điện thoại |

---

### Emotion Journey — Bạn Linh

```
Cảm xúc:  Lo lắng → Nhẹ nhõm → Tự tin → Thoải mái → Thành thạo
Thời gian: Ngày 1  → Ngày 2-3  → Tuần 1  → Tuần 2-3  → Tháng 1+
```

**Khoảnh khắc WOW:** "Tồn kho tự động cập nhật khi nhập hàng, không cần tính tay nữa!"

**Khoảnh khắc PAIN:** "Phải nhắn từng khách riêng khi hàng về, mà danh sách dài lắm"

---

## Journey 3: Chị Mai — End Customer

### Profile

- **Tên:** Nguyễn Thị Mai, 29 tuổi
- **Nghề nghiệp:** Nhân viên văn phòng, sưu tầm diecast 1:64 như hobby
- **Kinh nghiệm:** Hay mua qua Facebook Group, đôi khi mua trên Shopee
- **Pain point:** Thường bị "sold out" khi hỏi muộn; ảnh Facebook nhỏ, không thấy rõ chi tiết; không biết bao giờ hàng về
- **Mục tiêu:** Tìm model yêu thích, xem kỹ trước khi mua, đặt trước không lo lỡ

---

### Phase 1: Khám phá Shop (Lần đầu)

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Thấy bài Facebook của "Minh Diecast" → Click link catalog trong bài → Mở trang `diecast360.app/s/minh-diecast` → Xem grid sản phẩm → Bị ấn tượng bởi ảnh đẹp + badge trạng thái rõ ràng |
| **Touchpoints** | Facebook post (external), link catalog, trang public catalog (grid view) |
| **Emotions** | Tò mò khi thấy link lạ → Ấn tượng ngay khi vào catalog chuyên nghiệp → Muốn xem thêm |
| **Pain Points** | Load lần đầu hơi lâu (nếu nhiều ảnh); chưa biết dùng filter |
| **Opportunities** | Above-the-fold hero section giới thiệu shop; skeleton loading để trải nghiệm tốt hơn; filter nổi bật và dễ thấy |

---

### Phase 2: Tìm kiếm & Filter

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Xem grid → Muốn tìm Honda → Dùng filter "Brand" → Chọn "Hot Wheels" → Xem kết quả → Thấy vài model Honda đẹp → Sort theo giá |
| **Touchpoints** | Filter panel, search bar, sort options, grid kết quả |
| **Emotions** | Vui khi tìm được đúng thứ mình muốn → Phân vân khi nhiều lựa chọn |
| **Pain Points** | Tên brand đôi khi viết không chuẩn (Hot Wheels vs HotWheels) → filter bỏ lọt |
| **Opportunities** | Autocomplete brand name với chuẩn hóa; tag/chip filter dễ bỏ chọn; breadcrumb filter đang áp dụng |

---

### Phase 3: Xem Chi tiết & SpinViewer

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Click vào item Honda Civic 1:64 → Trang chi tiết load → SpinViewer load xong → Chị Mai drag chuột xoay 360° → Xem từng góc: đầu xe, đuôi xe, nóc xe → Phóng to ảnh → Xem giá, mô tả, trạng thái → Quyết định đặt hàng |
| **Touchpoints** | Trang chi tiết item, SpinViewer (drag/swipe), lightbox ảnh, thông tin sản phẩm |
| **Emotions** | Ngạc nhiên thích thú khi spinner hoạt động → Hài lòng khi thấy rõ chi tiết → Tự tin quyết định mua |
| **Pain Points** | Trên mobile, spinner đôi khi scroll trang thay vì xoay (conflict gesture); cần chỉ dẫn "kéo để xoay" |
| **Opportunities** | Instruction tooltip "Kéo để xoay 360°" lần đầu dùng; lock scroll khi tương tác spinner; auto-play spinner khi load xong (nhẹ nhàng) |

---

### Phase 4: Tạo Pre-Order

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Click "Đặt hàng trước" → Form popup → Nhập tên "Nguyễn Thị Mai" → Nhập SĐT → Thêm ghi chú "Muốn màu đỏ nếu có" → Click "Xác nhận" → Nhận trang xác nhận với mã đơn → Screenshot giữ lại |
| **Touchpoints** | Nút "Đặt hàng trước", form pre-order, trang xác nhận |
| **Emotions** | Hơi lo khi chưa biết có đặt được không → Nhẹ nhõm khi form đơn giản → Yên tâm khi thấy mã đơn |
| **Pain Points** | Không nhận được email/SMS xác nhận → phải screenshot trang; không biết bao giờ hàng về |
| **Opportunities** | Email xác nhận tự động với mã đơn; estimated timeline (nếu shop điền); SMS OTP để xác nhận thật (v2) |

---

### Phase 5: Theo dõi & Nhận hàng

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Vài ngày sau: nhận Zalo từ shop "Hàng về rồi, bạn tới lấy nhé!" → Đến shop → Xem model thực tế → Hài lòng → Thanh toán chuyển khoản → Nhận điểm tích lũy (nếu là member) → Chia sẻ hình lên Facebook Group |
| **Touchpoints** | Zalo (external), shop vật lý, membership point lookup (optional) |
| **Emotions** | Vui khi nhận thông báo → Hào hứng khi đến lấy → Tự hào khi chia sẻ với cộng đồng |
| **Pain Points** | Hẹn giờ không thuận tiện; muốn biết sẵn trên web khi hàng về mà không cần shop nhắn |
| **Opportunities** | Email/SMS tự động khi status → ARRIVED; trang "Tra cứu đơn hàng" bằng SĐT + mã đơn |

---

### Phase 6: Quay lại & Tích điểm (Khách thân thiết)

| Khía cạnh | Chi tiết |
|-----------|----------|
| **Actions** | Sau 1 tháng: chị Mai đã mua 3 lần → Hỏi anh Minh về điểm → Anh Minh tra cứu hệ thống → Thông báo "Bạn có 150 điểm, đủ lên Silver" → Chị Mai vui → Tiếp tục mua vì có quyền lợi hơn |
| **Touchpoints** | Trang tra cứu điểm (qua SĐT), shop owner thông báo, tier badge |
| **Emotions** | Ngạc nhiên không biết có điểm → Vui và cảm thấy được trân trọng → Loyal hơn với shop |
| **Pain Points** | Không tự tra được điểm online; phụ thuộc vào shop chủ động báo |
| **Opportunities** | Trang tra cứu điểm public (nhập SĐT → xem điểm + tier + lịch sử); QR code trên trang item để save vào wallet |

---

### Emotion Journey — Chị Mai

```
Cảm xúc:  Tò mò → Ấn tượng → Thích thú → Yên tâm → Vui → Loyal
Thời gian: Khám phá → Xem catalog → SpinViewer → Pre-order → Nhận hàng → Tích điểm
           (Phút 1)   (Phút 2-5)   (Phút 5-10)  (Phút 10) (Ngày 7+)  (Tháng 1+)
```

**Khoảnh khắc WOW:** "Xoay 360° như cầm model trên tay vậy, chưa thấy shop diecast nào làm được!"

**Khoảnh khắc PAIN:** "Đặt xong mà không biết bao giờ hàng về, phải tự nhắn hỏi"

---

## Summary: Insight & Opportunities

### Top 5 Pain Points Cần Giải quyết Ngay

| # | Pain Point | Persona | Priority |
|---|-----------|---------|---------|
| 1 | Không có email/SMS tự động khi status thay đổi | Chị Mai + Anh Minh | High |
| 2 | Chụp 24 frame spinner đúng cách rất khó | Anh Minh | High |
| 3 | Conflict scroll/swipe với SpinViewer trên mobile | Chị Mai | Medium |
| 4 | Autocomplete nhập kho dễ nhầm item | Bạn Linh | Medium |
| 5 | Không tự tra cứu điểm member online | Chị Mai | Medium |

### Top 5 WOW Moments Cần Khuếch đại

| # | WOW Moment | Persona | Cơ hội |
|---|-----------|---------|--------|
| 1 | SpinViewer 360° | Chị Mai | Landing page showcase, social share |
| 2 | AI điền thông tin item | Anh Minh | Demo video, onboarding highlight |
| 3 | Copy caption 1 click | Anh Minh | Feature highlight trong onboarding |
| 4 | Tồn kho tự động cập nhật | Bạn Linh | Thay thế hoàn toàn Excel |
| 5 | Dashboard báo cáo realtime | Anh Minh | Decision-making empowerment |

### Metrics Đo Satisfaction theo Journey

| Journey | Key Metric | Target |
|---------|-----------|--------|
| Anh Minh — Setup | Thời gian setup shop đến publish item đầu tiên | < 2 giờ |
| Anh Minh — Daily | Thời gian xử lý pre-order (PENDING → update) | < 3 phút/đơn |
| Bạn Linh — Nhập kho | Thời gian nhập kho 1 item | < 1 phút |
| Chị Mai — Pre-order | Thời gian từ catalog → xác nhận pre-order | < 3 phút |
| Chị Mai — SpinViewer | Spinner load time | < 3 giây (4G) |
