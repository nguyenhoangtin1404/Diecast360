# Hướng dẫn sử dụng khu vực quản trị Diecast360 (Admin & Admin shop)

Tài liệu này dành cho **người vận hành cửa hàng** (không cần biết lập trình). Bạn chỉ cần trình duyệt web (Chrome, Edge, Safari, Firefox) và tài khoản được cấp.

**Tên miền chính của cửa hàng (bản triển khai DH Toys):** `https://www.dhtoys.store`  
Mọi đường dẫn trong tài liệu (dạng `/admin/...`, `/contact`, …) khi dùng thật trên mạng đều gắn **phía trước** tên miền này. Ví dụ: `/admin/login` → `https://www.dhtoys.store/admin/login`.

**Phạm vi:** Đây là tài liệu vận hành **gắn với một tenant / một tên miền cụ thể** (không phải thông tin bảo mật — hostname là địa chỉ công khai). Nếu bạn sao chép repo hoặc dùng **shop / tên miền khác**, hãy **tìm và thay** toàn bộ chuỗi `https://www.dhtoys.store` trong file này (hoặc trong bản PDF/HTML xuất ra) bằng URL gốc của bạn, **không** thêm dấu `/` thừa ở cuối (ví dụ đúng: `https://shop-cua-toi.com` + `/admin/login`).

---

## 1. Diecast360 là gì (một cách dễ hiểu)

- **Catalog công khai**: Khách xem danh sách mô hình, ảnh, xem xoay 360°, đặt trước (pre-order), xem liên hệ shop.
- **Khu vực quản trị (`/admin/…`)**: Nơi bạn nhập sản phẩm, cập nhật kho, cấu hình thương hiệu shop, xem báo cáo, quản lý hội viên, v.v.

Mỗi **shop** (cửa hàng) có dữ liệu **tách biệt**: sản phẩm, danh mục, cấu hình… thuộc shop bạn đang chọn.

---

## 2. Chuẩn bị trước khi vào quản trị

1. **Địa chỉ trang web (chính thức)**  
   Mở trang chủ: `https://www.dhtoys.store`  
   *(Nếu đội kỹ thuật cho bạn thử trên máy nội bộ, họ có thể đưa địa chỉ dạng `http://localhost:…` — cách dùng giống hệt, chỉ khác phần đầu URL.)*

2. **Đường dẫn đăng nhập quản trị**  
   Mở trực tiếp: `https://www.dhtoys.store/admin/login`

3. **Email và mật khẩu**  
   Do quản trị hệ thống hoặc chủ shop cấp. Nếu quên mật khẩu, liên hệ người quản lý tài khoản (hệ thống không mô tả trang “quên mật khẩu” trong tài liệu này).

4. **Sau khi đăng nhập thành công**  
   Trang đầu tiên thường là **Báo cáo**: `https://www.dhtoys.store/admin/reports`

### Link nhanh (đã gắn tên miền `https://www.dhtoys.store`)

| Khu vực | Địa chỉ đầy đủ |
|--------|----------------|
| Đăng nhập quản trị | `https://www.dhtoys.store/admin/login` |
| Báo cáo | `https://www.dhtoys.store/admin/reports` |
| Hội viên | `https://www.dhtoys.store/admin/members` |
| Sản phẩm | `https://www.dhtoys.store/admin/items` |
| AI tool (thêm SP từ ảnh) | `https://www.dhtoys.store/admin/items/import` |
| Danh mục (không có trong menu) | `https://www.dhtoys.store/admin/categories` |
| Pre-order | `https://www.dhtoys.store/admin/preorders` |
| Tạo pre-order | `https://www.dhtoys.store/admin/preorders/create` |
| Pre-order theo campaign | `https://www.dhtoys.store/admin/preorders/manage` |
| Bài đăng Facebook | `https://www.dhtoys.store/admin/facebook-posts` |
| Cấu hình shop | `https://www.dhtoys.store/admin/shop-settings` |
| Quản lý shop (quản trị nền tảng) | `https://www.dhtoys.store/admin/shops` |
| Trang chủ catalog (khách) | `https://www.dhtoys.store/` |
| Đặt trước (khách) | `https://www.dhtoys.store/preorders` |
| Đơn của tôi (khách) | `https://www.dhtoys.store/my-orders` |
| Liên hệ (khách) | `https://www.dhtoys.store/contact` |

---

## 3. Các loại quyền bạn có thể gặp

| Vai trò (trong hệ thống) | Bạn là ai | Điểm quan trọng |
|--------------------------|-----------|------------------|
| **Quản trị shop** (`shop_admin`) | Chủ shop / người được ủy quyền đầy đủ cho một shop | Được **lưu cấu hình shop**, tạo danh mục mới cho shop, quản lý sản phẩm, pre-order, v.v. |
| **Nhân viên shop** (`shop_staff`) | Nhân viên xem dữ liệu / hỗ trợ vận hành | Quyền hiện tại là **chỉ đọc** cho thao tác API đổi dữ liệu (`POST`/`PATCH`/`DELETE`) trừ route được kỹ thuật đánh dấu ngoại lệ. Trang cấu hình shop ở chế độ xem. |
| **Quản trị nền tảng** (`platform_super`) | Đội vận hành / kỹ thuật tổng | Thấy thêm mục **Quản lý shop** trên menu, có thể tạo shop, thêm thành viên, bật/tắt shop, v.v. |

Nếu bạn thấy menu **Quản lý shop** (biểu tượng cửa hàng), bạn đang ở nhóm quản trị nền tảng.

---

## 4. Giao diện quản trị: làm quen trong 2 phút

### 4.1 Thanh menu bên trái (máy tính)

Sau khi đăng nhập, bên trái có các mục (thứ tự có thể giống sau):

- **Báo cáo**
- **Hội viên**
- **Sản phẩm**
- **AI tool**
- **Pre-order**
- **Bài đăng FB**
- **Cấu hình shop**
- **Quản lý shop** (chỉ khi bạn là quản trị nền tảng)

### 4.2 Điện thoại / máy tính bảng

- Menu có thể **ẩn** sau nút **ba gạch** ở góc; chạm để mở/đóng.
- Phía trên có vùng hiển thị **tài khoản** và nút **Đăng xuất**.

### 4.3 Chọn đúng shop đang làm việc

Gần logo Diecast360 ở sidebar có **ô chọn shop** (hoặc hiển thị tên một shop nếu bạn chỉ có một shop).

**Cách dùng:**

1. Nhìn tên shop hiện tại (chấm xanh = đang hoạt động).
2. Nếu có danh sách, mở dropdown và chọn shop khác.
3. Hệ thống sẽ **đổi ngữ cảnh** sang shop đó: sản phẩm, báo cáo, cấu hình… đều theo shop vừa chọn.

> **Lưu ý:** Luôn kiểm tra tên shop trước khi sửa sản phẩm hoặc lưu cấu hình để tránh nhầm sang shop khác.

### 4.4 Về catalog công khai (khách hàng)

- Logo / tên shop ở header catalog thường theo **shop** (tham số `?shop_id=` hoặc cấu hình mặc định của hệ thống).
- Để xem trước sau khi chỉnh sản phẩm: mở trang chủ catalog và tìm sản phẩm (nếu đã bật **Công khai** — xem mục Sản phẩm).

---

## 5. Đăng nhập và đăng xuất (từng bước)

### Đăng nhập

1. Mở trình duyệt, vào `https://www.dhtoys.store/admin/login`.
2. Nhập **email**.
3. Nhập **mật khẩu**.
4. Nhấn nút đăng nhập.
5. Nếu báo lỗi: đọc dòng chữ đỏ — thường là sai mật khẩu hoặc tài khoản không có quyền. Thử lại hoặc liên hệ quản trị.

### Đăng xuất

1. Nhấn **Đăng xuất** (biểu tượng “ra khỏi cửa”).
2. Phiên làm việc trên trình duyệt này kết thúc; người khác dùng chung máy nên đăng xuất khi xong.

---

## 6. Báo cáo (`/admin/reports`)

**Mục đích:** Xem nhanh tình hình shop trong **7 / 30 / 90 ngày** gần đây (tồn kho, pre-order, bài Facebook, v.v. — theo dữ liệu hệ thống thu thập).

**Cách dùng:**

1. Vào menu **Báo cáo**.
2. Chọn khoảng thời gian: **7 ngày**, **30 ngày**, hoặc **90 ngày**.
3. Đọc các ô tổng hợp và (nếu có) biểu đồ / lịch theo ngày.
4. Nếu trang báo “Đang tải…” lâu: chờ thêm hoặc tải lại trang (F5).

---

## 7. Hội viên (`/admin/members`)

**Mục đích:** Quản lý khách **hội viên** của shop: danh sách, tạo mới, sửa thông tin, **điểm thưởng**, **hạng (tier)**, xem **lịch sử giao dịch điểm**.

**Luồng làm việc gợi ý:**

1. Vào **Hội viên**.
2. Ô tìm kiếm: gõ tên, email hoặc số điện thoại (nếu có), nhấn tìm / chờ danh sách lọc.
3. **Thêm hội viên:** mở form tạo, điền họ tên, email, số điện thoại theo yêu cầu màn hình, xác nhận.
4. **Sửa hội viên:** chọn một người, mở chỉnh sửa, cập nhật, lưu.
5. **Điểm:** chọn hội viên, dùng form điều chỉnh điểm (cộng/trừ/điều chỉnh — theo nút bạn thấy), điền **lý do** rõ ràng để sau này đối soát.
6. **Hạng (tier):** cấu hình các mức hạng (tên, thứ hạng, điểm tối thiểu) theo chính sách shop.
7. **Sổ cái / ledger:** xem lịch sử thay đổi điểm của hội viên được chọn (phân trang nếu có nhiều dòng).

---

## 8. Sản phẩm — danh sách (`/admin/items`)

**Mục đích:** Xem toàn bộ sản phẩm trong shop đang chọn, tìm kiếm, xuất file, thêm mới, xóa, bật/tắt hiển thị công khai.

### 8.1 Tìm kiếm

1. Ở ô tìm kiếm, gõ từ khóa (tên, đặc điểm…).
2. Đợi khoảng nửa giây sau khi ngừng gõ (hệ thống có thể tìm sau khi bạn tạm dừng nhập).
3. Một số triển khai bật **tìm kiếm ngữ nghĩa (AI)**; nếu không bận, vẫn tìm theo từ khóa thông thường.

### 8.2 Các nút chính trên thanh công cụ

- **Thêm sản phẩm:** Mở form wizard tạo sản phẩm mới (nhiều bước — xem mục 9).
- **Thêm sản phẩm (AI):** Chuyển sang trang **AI tool** để tạo nhanh từ ảnh (mục 10).
- **Xuất dữ liệu:** Tải file **CSV** về máy (Excel có thể mở được). Dùng để sao lưu hoặc chỉnh hàng loạt offline (nếu quy trình của bạn cho phép).

### 8.3 Đọc bảng sản phẩm

Các cột thường gặp:

- **Hình ảnh** (ảnh bìa).
- **Tên** sản phẩm.
- **Trạng thái kho:**  
  - **Còn hàng**  
  - **Giữ chỗ**  
  - **Đã bán**
- **SL** — số lượng.
- **Công khai** — khi bật, sản phẩm có thể hiện trên catalog khách xem (tùy cài đặt triển khai).
- **Facebook** — trạng thái / liên quan bài đăng.
- **Giá.**
- **Thao tác:** sửa, xóa, v.v.

### 8.4 Bật / tắt công khai

1. Tìm sản phẩm trên bảng.
2. Nhấn biểu tượng **mắt** (hiện) / **mắt gạch** (ẩn) tùy thiết kế nút.
3. Nếu lỗi, trình duyệt có thể báo popup — chụp màn hình gửi bộ phận kỹ thuật.

### 8.5 Xóa sản phẩm

1. Nhấn **xóa** (thùng rác).
2. Xác nhận trong hộp thoại (thao tác **không hoàn tác** dễ dàng).
3. Chỉ xóa khi chắc chắn.

### 8.6 Copy nội dung bán hàng Facebook

- Nếu sản phẩm đã có **nội dung sale** (fb), có thể có nút **sao chép** nội dung ra clipboard để dán lên Facebook.
- Nếu chưa có nội dung, hệ thống sẽ báo khi bạn nhấn copy.

### 8.7 Nút “chia sẻ” / Facebook trên dòng sản phẩm

Có thể đưa bạn tới trang chi tiết sản phẩm, phần **bán hàng mạng xã hội** (tham số `section=social-selling` trên URL). Dùng để soạn / đăng nội dung liên quan Facebook.

### 8.8 Phân trang

Cuối bảng: **Trang trước / Trang sau** (hoặc số trang) khi sản phẩm nhiều.

---

## 9. Sản phẩm — chi tiết & wizard 4 bước (`/admin/items/:id` hoặc `/admin/items/new`)

Khi **Thêm sản phẩm**, bạn vào luồng tạo mới. Với sản phẩm đã có, mở từ bảng (sửa).

Hệ thống chia **4 bước** (có thể chuyển bằng nút trên đầu trang hoặc **Bước trước / Bước tiếp**):

| Bước | Tên trên giao diện | Bạn làm gì |
|------|-------------------|------------|
| 1 | **Thông tin cơ bản** | Tên, mô tả, giá, số lượng, thương hiệu xe/mô hình, tỉ lệ (ví dụ 1:64), tình trạng mới/cũ, trạng thái kho, có công khai hay không, thuộc tính tùy chỉnh… |
| 2 | **Hình ảnh** | Tải ảnh sản phẩm, chọn ảnh bìa, sắp xếp nếu có. |
| 3 | **Ảnh 360** | Tạo **bộ ảnh xoay** (spin set), tải các khung hình theo thứ tự; có thể xem trước viewer 360°. |
| 4 | **AI gen nội dung FB** | Gợi ý nội dung mô tả / SEO / bullet, nội dung bài Facebook, liên kết bài đăng, (nếu được cấu hình) đăng lên Facebook. |

**Quy tắc quan trọng:**

- Khi nhấn **Bước tiếp** hoặc **Bước trước**, hệ thống **tự lưu** dữ liệu hiện tại (bạn sẽ thấy gợi ý chữ trên màn hình).
- Với sản phẩm **mới**, chưa lưu bước 1 thì thường **chưa cho nhảy** sang bước 2–4 (tránh thiếu dữ liệu gốc).
- Khi **hoàn tất** ở bước cuối, nếu thiếu ảnh hoặc thiếu 360, hệ thống có thể **cảnh báo** và đề nghị quay lại bước 2 hoặc 3; bạn vẫn có thể xác nhận tiếp tục nếu chấp nhận đăng bán “chưa đủ media”.

**Danh mục nhanh trong form sản phẩm:**  
Có thể có khu vực **quản lý / chọn danh mục** (hãng xe, hãng mô hình) ngay trong trang chi tiết — tiện khi nhập liệu mà không cần rời trang.

**Dòng thời gian kho (inventory timeline):**  
Một số shop dùng phần hiển thị **lịch sử nhập/xuất/kho** trên trang sản phẩm để đối soát.

---

## 10. AI tool — thêm nhanh từ ảnh (`/admin/items/import`)

**Mục đích:** Tải một loạt **ảnh sản phẩm** (hộp, đáy hộp, tổng quan…) để AI **đoán** thương hiệu, tỉ lệ, màu, mã… rồi tạo bản nháp.

**Cách làm:**

1. Vào menu **AI tool**.
2. Kéo thả ảnh hoặc bấm chọn file (nên **từ 3 ảnh trở lên** để kết quả tốt hơn — theo gợi ý trên màn hình).
3. Chờ phân tích (có biểu tượng quay).
4. Xem **độ tin cậy %** từng trường AI điền — **luôn kiểm tra và sửa tay** trước khi lưu.
5. Chỉnh tên, mô tả, giá, tình trạng mới/cũ… ở form bên phải.
6. Nhấn **Confirm & Save Item** (hoặc nút tương đương) để tạo sản phẩm thật trong kho.
7. Nếu có cảnh báo “ảnh draft chưa import hết”, hệ thống vẫn có thể tạo sản phẩm nhưng bạn nên vào **chi tiết sản phẩm** để bổ sung ảnh sau.

Nút **Discard** (bỏ) dùng khi muốn **hủy bản nháp** hiện tại và upload lại từ đầu.

---

## 11. Pre-order

### 11.1 Trung tâm Pre-order (`/admin/preorders`)

**Mục đích:** Xem danh sách các đơn pre-order, lọc theo trạng thái, chuyển trạng thái theo quy trình bán hàng.

**Các trạng thái (nhãn tiếng Việt trên giao diện):**

- **Chờ xác nhận**
- **Chờ hàng về**
- **Đã về hàng**
- **Đã thanh toán**
- **Đã hoàn tiền**
- **Đã hủy**

**Cách dùng:**

1. Vào **Pre-order**.
2. (Tùy chọn) Chọn **Lọc trạng thái** để chỉ xem một loại đơn.
3. Với từng đơn, các nút **Chuyển sang: …** cho biết bước tiếp theo **được phép** trong hệ thống — chỉ nhấn đúng bước quy định (ví dụ: xác nhận trước, chờ hàng, về hàng, thanh toán, hoặc hủy).
4. Hai liên kết quan trọng:
   - **Tạo Pre-Order Mới** — mở form tạo đơn thủ công (mục 11.2).
   - **Quản lý theo campaign** — xem theo **từng chiến dịch / sản phẩm mục tiêu** (mục 11.3).

### 11.2 Tạo Pre-Order mới (`/admin/preorders/create`)

1. Vào **Tạo Pre-Order Mới** (từ trang Pre-order hoặc URL trên).
2. Điền các ô: sản phẩm (thường chọn `item_id`), số lượng, giá, cọc, đã thanh toán, ngày dự kiến (nếu có ô ngày giờ), ghi chú, URL ảnh cover (nếu dùng)…
3. Hệ thống **kiểm tra hợp lệ** (ví dụ: cọc không được lớn hơn tổng giá trị đơn, số lượng phải là số nguyên dương). Nếu báo lỗi đỏ, đọc và sửa đúng ô được nói tới.
4. Gửi / Lưu. Thành công thì thường **tự chuyển** về danh sách Pre-order sau khoảng một giây.

> Gợi ý: Trang **Quản lý theo campaign** có nút **Thêm người tham gia** gắn sẵn `item_id` của campaign — tiết kiệm thao tác.

### 11.3 Quản lý theo campaign (`/admin/preorders/manage`)

1. Vào **Quản lý theo campaign**.
2. Nếu có nhiều trang đơn, dùng **Trang trước / Trang sau** (50 đơn mỗi trang).
3. Phần **Tổng quan campaign**: chọn **campaign** trong danh sách (thường gắn với **một sản phẩm / mặt hàng** làm “trục” chiến dịch).
4. Xem **số đơn đang mở** và **doanh thu dự kiến** (tổng theo các đơn đang xét).
5. **Danh sách người tham gia:** với mỗi người, có các nút chuyển trạng thái tương tự trang danh sách tổng.
6. Liên kết **Xem chi tiết campaign** mở trang **chi tiết sản phẩm** của mặt hàng đó để chỉnh mô tả, ảnh, v.v.

### 11.4 In phiếu / tạo ảnh phiếu đặt hàng

Bạn có thể thấy cụm nút **In phiếu** và **Tạo ảnh / Chia sẻ** ở danh sách pre-order, danh sách người tham gia campaign, sau khi tạo đơn thủ công, hoặc trên trang **Đơn hàng của tôi**.

**In phiếu:**

1. Nhấn **In phiếu** trên đơn cần in.
2. Chờ modal **Xem trước và in phiếu** mở ra. Kiểm tra tên shop, khách hàng, sản phẩm, tiền cọc/đã thu/còn lại.
3. Chọn khổ giấy **58mm (K57)** hoặc **80mm (K80)** đúng với máy in. Trình duyệt sẽ nhớ lựa chọn này cho lần sau trên cùng thiết bị.
4. Nhấn **In ngay**. Nếu trình duyệt hỏi chọn máy in, chọn máy in nhiệt đã pair.
5. Nếu trình duyệt báo chặn cửa sổ in, cho phép popup cho trang admin rồi bấm lại **In ngay**.

**Tạo ảnh / Chia sẻ:**

1. Nhấn **Tạo ảnh / Chia sẻ** để xuất phiếu thành PNG.
2. Trên điện thoại có hỗ trợ chia sẻ file, hệ thống mở bảng chia sẻ để gửi qua Zalo/Messenger hoặc ứng dụng khác.
3. Nếu thiết bị không hỗ trợ chia sẻ file trực tiếp, trình duyệt tải file PNG về máy.

> iPhone/iPad không in trực tiếp được với máy in Bluetooth không hỗ trợ AirPrint như MP-210. Hãy dùng **Tạo ảnh / Chia sẻ**, rồi in hoặc gửi ảnh từ ứng dụng khác.

---

## 12. Bài đăng Facebook (`/admin/facebook-posts`)

**Mục đích:** Lọc sản phẩm theo trạng thái **đã đăng / chưa đăng** Facebook và tìm nhanh theo tên.

**Cách dùng:**

1. Vào **Bài đăng FB**.
2. Chọn bộ lọc: **Tất cả**, **Đã đăng**, **Chưa đăng**.
3. (Tùy chọn) Gõ từ khóa ở ô tìm.
4. Mở chi tiết sản phẩm (biểu tượng mắt / liên kết — tùy giao diện) để chỉnh nội dung hoặc đăng từ **bước 4** của wizard sản phẩm.

---

## 13. Cấu hình shop (`/admin/shop-settings`)

**Mục đích:** Thiết lập **trang liên hệ công khai** và **giao diện thương hiệu** (logo, favicon, màu chủ, màu nhấn, font).

### 13.1 Ai được sửa?

- **Quản trị shop** và tài khoản **super_admin** legacy trên shop: **được lưu**.
- **Nhân viên shop:** vào xem được nhưng **không** nhấn lưu thay đổi (màn hình báo rõ).

### 13.2 Trang liên hệ (công khai)

Các mục bạn có thể chỉnh (theo form trong hệ thống):

- **Tiêu đề trang**, **mô tả dưới tiêu đề**
- **Điện thoại** (số hiển thị dạng gọi được, có thể có `+`)
- **Facebook** (URL)
- **Zalo** (URL)
- **Giờ mở cửa** / lịch (nếu shop dùng)
- Các trường khác hiển thị trên form

**Mẹo:** Để trống một trường rồi **Lưu** thường có nghĩa là **xóa** giá trị đó trên trang công khai (theo gợi ý trên màn hình).

Trang liên hệ công khai của khách có dạng:  
`https://www.dhtoys.store/contact?shop_id=…`  
(phần `shop_id` là ID hoặc slug shop — kỹ thuật viên có thể gửi link đầy đủ cho bạn).

### 13.3 Giao diện (logo, màu, font)

1. **Logo / Favicon:** Chọn file ảnh **JPEG, PNG hoặc WebP**, dung lượng **tối đa 2 MB** mỗi file.
2. **Màu chủ / Màu nhấn:** Có thể gõ mã màu dạng `#RRGGBB` hoặc tên màu (ví dụ `indigo`), hoặc dùng **bảng chọn màu** nhỏ bên cạnh.
3. **Font:** Nhập chuỗi font CSS (ví dụ `Inter, system-ui, sans-serif`) nếu đội thiết kế hướng dẫn.

### 13.4 Lưu

1. Cuối trang, nhấn **Lưu cấu hình**.
2. Nếu “Không có thay đổi cần lưu” — bạn chưa sửa gì so với máy chủ.
3. Nếu lỗi validation (số điện thoại / URL không hợp lệ), sửa theo dòng báo đỏ rồi lưu lại.

Sau khi lưu, catalog / admin có thể **cập nhật logo màu** sau một lúc (tải lại trang nếu chưa thấy).

---

## 14. Quản lý shop — dành cho quản trị nền tảng (`/admin/shops`)

**Chỉ hiện** khi tài khoản của bạn là **platform_super**.

**Mục đích:** Tạo shop mới, đổi tên/slug, **bật/tắt shop**, xem **số mặt hàng**, **số thành viên**, **nhật ký hoạt động**, **thêm thành viên** (email, mật khẩu mạnh, họ tên), gán vai trò **Quản trị shop** hoặc **Nhân viên shop**, reset mật khẩu, khóa/mở tài khoản (tùy chức năng hiển thị trên modal).

**Luồng gợi ý:**

1. Vào **Quản lý shop**.
2. **Tạo shop mới:** điền tên (và slug nếu được hướng dẫn), gửi form.
3. Trên **thẻ shop**, quan sát chấm màu: xanh = đang hoạt động, xám = đã tắt.
4. Dùng các nút: **Sửa**, **Tắt shop**, **Mở lại shop** (khi shop đang tắt), **Thêm thành viên**, **Xem mặt hàng**, **Xem thành viên**, **Lịch sử**.
5. Khi **thêm thành viên**, mật khẩu thường phải **đủ mạnh** (độ dài, chữ hoa, chữ thường, số, ký tự đặc biệt — form có thanh “độ mạnh”).

---

## 15. Trang Danh mục (`/admin/categories`) — lưu ý đặc biệt

Trang này quản lý **Hãng xe** và **Hãng mô hình** (hai loại tab).

**Cách vào:** Gõ trực tiếp trên trình duyệt:  
`https://www.dhtoys.store/admin/categories`  
vì **menu sidebar hiện không có mục “Danh mục”** — bạn nên **đánh dấu bookmark** link này để khỏi nhớ.

**Thao tác:**

1. Chọn tab **Hãng xe** hoặc **Hãng mô hình**.
2. **Thêm:** nút thêm mới, nhập tên, lưu.
3. **Sửa / Bật / Tắt / Xóa:** dùng các biểu tượng trên từng dòng (bút, công tắc, thùng rác).
4. **Quyền tạo mới:**  
   - **Quản trị shop** tạo danh mục **thuộc shop** đang chọn.  
   - **Nhân viên shop** có quyền xem; thao tác tạo / sửa / bật tắt / xóa bị backend chặn theo chính sách chỉ đọc.
   - **Quản trị nền tảng** có thể tạo danh mục **toàn cục** (dùng cho nhiều shop) — tùy cách triển khai dữ liệu.

Luôn **chọn đúng shop** ở ô ShopSelector trước khi thao tác danh mục của shop.

---

## 16. Khách hàng & đặt trước (tham khảo cho admin)

Các trang **công khai** (không cần quyền admin), gắn với tên miền chính:

- **Trang chủ catalog:** `https://www.dhtoys.store/`
- **Đặt trước:** `https://www.dhtoys.store/preorders`
- **Đơn hàng của tôi** (khách theo dõi đơn đã đặt): `https://www.dhtoys.store/my-orders`
- **Liên hệ:** `https://www.dhtoys.store/contact` (thường thêm `?shop_id=…` để đúng shop)
- **Chi tiết một sản phẩm:** `https://www.dhtoys.store/items/{id}` — thay `{id}` bằng mã sản phẩm (copy từ admin hoặc từ URL khi xem thử).

Admin không cần nhớ hết URL; quan trọng là khi **bật Công khai** và cấu hình shop đúng, khách sẽ thấy nội dung tương ứng.

---

## 17. Xử lý sự cố thường gặp (FAQ ngắn)

**Đăng nhập xong bị đẩy ra ngoài / về lại trang login**  
- Phiên hết hạn hoặc cookie bị chặn. Thử trình duyệt khác, tắt chế độ chặn cookie của trang, hoặc liên hệ kỹ thuật.

**Tôi sửa shop nhưng không thấy nút Lưu**  
- Bạn có thể là **nhân viên shop** — chỉ **quản trị shop** mới lưu được Cấu hình shop.

**Tìm sản phẩm không ra**  
- Kiểm tra lại **shop đang chọn**.  
- Thử bỏ bớt từ khóa.  
- Kiểm tra sản phẩm có đang ở trang khác của phân trang không.

**Upload ảnh / logo báo lỗi**  
- Kiểm tra **định dạng** (JPEG/PNG/WebP) và **dung lượng** (logo/favicon tối đa 2 MB).  
- Thử ảnh nhỏ hơn hoặc nén ảnh trước.

**Pre-order không có nút chuyển trạng thái**  
- Đơn đã ở trạng thái **cuối chuỗi** (ví dụ đã hủy / đã thanh toán — tùy luật nghiệp vụ) hoặc không còn bước hợp lệ tiếp theo.

**Bấm “In ngay” nhưng không thấy hộp thoại in**
- Trình duyệt có thể đang chặn popup in. Cho phép popup cho trang admin rồi thử lại. Nếu dùng iPhone/iPad hoặc máy in không xuất hiện, dùng **Tạo ảnh / Chia sẻ**.

**Trang “Loading…” mãi sau đăng nhập**  
- Mạng chậm hoặc máy chủ bảo trì. Tải lại trang; nếu vẫn lỗi, gửi thời điểm + ảnh chụp màn hình cho bộ phận kỹ thuật.

---

## 18. Bản tóm tắt một trang (checklist hàng ngày)

1. Đăng nhập `https://www.dhtoys.store/admin/login`.  
2. Kiểm tra **shop đang chọn**.  
3. Vào **Báo cáo** xem nhanh hôm nay / tuần.  
4. Cập nhật **Sản phẩm** (giá, trạng thái, ảnh, 360).  
5. Xử lý **Pre-order** (lọc “Chờ xác nhận”, chuyển trạng thái đúng quy trình).  
6. Kiểm tra **Bài đăng FB** nếu shop bán qua Facebook.  
7. **Cấu hình shop** khi đổi hotline / link FB / logo.  
8. **Đăng xuất** khi rời máy dùng chung.

---

*Tài liệu được soạn dựa trên mã nguồn ứng dụng Diecast360 (frontend admin + luồng nghiệp vụ liên quan). Nếu giao diện được cập nhật, một số tên nút hoặc vị trí có thể thay đổi nhẹ; khi đó hãy ưu tiên những gì hiển thị trên màn hình thực tế.*

**Cập nhật nội dung:** tháng 5/2026 — khi đổi menu, quyền hoặc URL trong code, nên rà soát lại các mục tương ứng trong file này.
