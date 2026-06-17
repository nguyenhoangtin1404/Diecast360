# Thermal Printer Setup — MP-210 / K57-K80 Bluetooth

Hướng dẫn kết nối máy in nhiệt Bluetooth khổ 58mm hoặc 80mm (MP-210, ZJ-58, Xprinter hoặc tương đương) với thiết bị chạy admin panel.

Sau khi pair, dùng nút **"In phiếu"** trên trang Pre-order. Lần đầu in: chọn đúng máy in trong print dialog. Browser thường nhớ lựa chọn cho lần sau.

## Cách Diecast360 in phiếu

1. Nút **"In phiếu"** tải dữ liệu từ `GET /api/v1/preorders/:id/receipt` theo shop đang chọn.
2. Modal **"Xem trước và in phiếu"** render preview trong iframe và cho chọn khổ **58mm (K57)** hoặc **80mm (K80)**. Lựa chọn được lưu trên trình duyệt hiện tại.
3. Nút **"In ngay"** mở một popup in riêng; popup tự gọi `window.print()` sau `window.onload`. Nếu browser chặn popup, cho phép popup cho domain admin rồi bấm lại.
4. Nút **"Tạo ảnh / Chia sẻ"** xuất phiếu PNG. Nếu thiết bị hỗ trợ Web Share API thì mở sheet chia sẻ; nếu không thì tải file `phieu-dat-hang-*.png`.

> Iframe chỉ dùng để xem trước trong modal. Luồng in hiện tại cần popup để Chrome in đúng nội dung phiếu thay vì trang admin đang mở.

---

## Windows 10 / 11

1. Bật Bluetooth trên máy tính và trên MP-210 (giữ nút nguồn).
2. **Settings → Bluetooth & devices → Add device → Bluetooth** → chọn `MP-210` (hoặc `Xprinter`, `ZJ-58`).
3. Sau khi pair: **Settings → Bluetooth & devices → Printers & scanners** → tìm MP-210.
4. Click vào printer → **Printer properties → Advanced → Printing Defaults** → đổi Paper Size thành `Custom: 58mm × Auto` (hoặc width = 58mm, height = 0 / auto).
5. Mở admin panel trong Chrome/Edge → click "In phiếu" → trong print dialog chọn **MP-210** → in.

> Nếu Windows không tìm thấy driver phù hợp, cài driver ZJ-58 hoặc chọn "Generic / Text Only".

---

## Android 8+ (tablet / điện thoại)

1. Pair MP-210 qua **Settings → Connected devices → Bluetooth**.
2. Cài **Mopria Print Service** từ Play Store nếu chưa có (có sẵn trên Android 10+).
3. Mở Chrome → menu → **Print** → **All printers** → **Add printer** → chọn MP-210.
4. Quay lại admin panel, click **"In phiếu"** → print dialog xuất hiện với MP-210 trong danh sách → in.

> Nếu Chrome Android báo popup bị chặn sau khi bấm **"In ngay"**, bật quyền popup cho domain admin rồi thử lại. Nếu vẫn không ổn, dùng **"Tạo ảnh / Chia sẻ"** và in PNG từ ứng dụng ảnh.

---

## Raspberry Pi (Chromium + CUPS)

```bash
# 1. Pair qua bluetoothctl
bluetoothctl
  power on
  agent on
  scan on
  # Ghi lại MAC của MP-210, ví dụ: AA:BB:CC:DD:EE:FF
  pair AA:BB:CC:DD:EE:FF
  trust AA:BB:CC:DD:EE:FF
  connect AA:BB:CC:DD:EE:FF
  quit

# 2. Cài CUPS
sudo apt install cups -y
sudo usermod -aG lpadmin $USER

# 3. Mở CUPS web UI: http://localhost:631
# Administration → Add Printer → chọn MP-210 (Bluetooth)
# Driver: chọn "Generic Text Only" hoặc ZJ-58 PPD
# Media: Width = 58mm, Height = 0 (auto)

# 4. Khởi động lại CUPS
sudo systemctl restart cups
```

Sau khi thêm xong, Chromium sẽ thấy MP-210 trong print dialog.

---

## iOS / iPadOS

**MP-210 Bluetooth không hỗ trợ AirPrint** → `window.print()` không hoạt động với máy in này trên iOS.

Trong modal, nút **"In ngay"** bị vô hiệu hóa trên iOS. Thay thế: dùng nút **"Tạo ảnh / Chia sẻ"** để xuất phiếu dưới dạng ảnh PNG, sau đó in từ ứng dụng ảnh hoặc chia sẻ qua Zalo/Messenger.

---

## Khắc phục sự cố

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Print dialog không hiện sau khi bấm "In ngay" | Trình duyệt block popup in | Cho phép popup cho domain admin, rồi bấm "In ngay" lại |
| Print dialog hiện nhưng không có MP-210 | Chưa pair hoặc driver chưa cài | Làm lại bước pair + thêm printer qua CUPS/Settings |
| In ra giấy bị cắt / chữ quá to | Paper size chưa set đúng trên driver | Xem bước 4 (Windows) hoặc CUPS Media settings |
| In ra giấy trắng | Printer nhận lệnh nhưng không render | Thử driver "Generic Text Only" |
| Chữ bị vỡ / thiếu nét | Font render của driver | Thử đổi khổ giấy K57/K80 trong modal preview |
| Nút "In ngay" bị mờ (disabled) trên iOS | iOS không hỗ trợ non-AirPrint qua browser | Dùng "Tạo ảnh / Chia sẻ" thay thế |
| Logo không xuất hiện trong ảnh PNG | Logo không tải được qua URL signed media hoặc CORS | Phiếu vẫn được tạo; kiểm tra `shop.logo_url` và media endpoint nếu cần logo |
