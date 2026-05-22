# SLA Document (Service Level Agreement) — Diecast360

---
**Version:** 1.0
**Ngày tạo:** 2026-05-22
**Ngày hiệu lực:** 2026-06-01
**Người tạo:** PM + Tech Lead
**Dự án:** Diecast360

---

## Mục lục

1. [Các bên liên quan](#1-các-bên-liên-quan)
2. [Mô tả dịch vụ](#2-mô-tả-dịch-vụ)
3. [Giờ dịch vụ & Hỗ trợ](#3-giờ-dịch-vụ--hỗ-trợ)
4. [Service Level Objectives (SLO)](#4-service-level-objectives-slo)
5. [Phân loại sự cố & Thời gian phản hồi](#5-phân-loại-sự-cố--thời-gian-phản-hồi)
6. [Loại trừ khỏi SLA](#6-loại-trừ-khỏi-sla)
7. [Bảo trì theo kế hoạch](#7-bảo-trì-theo-kế-hoạch)
8. [Monitoring & Báo cáo](#8-monitoring--báo-cáo)
9. [Credits & Remedies](#9-credits--remedies)
10. [Quy trình Escalation](#10-quy-trình-escalation)
11. [Điều khoản thay đổi SLA](#11-điều-khoản-thay-đổi-sla)
12. [Chu kỳ Review](#12-chu-kỳ-review)
13. [Chữ ký](#13-chữ-ký)

---

## 1. Các bên liên quan

### 1.1 Nhà cung cấp dịch vụ (Service Provider)

| Thông tin | Chi tiết |
|-----------|---------|
| **Tên tổ chức** | Diecast360 Development Team |
| **Đại diện** | Nguyễn Hoàng Tin (PM / Tech Lead) |
| **Email** | nguyenhoangtin1404@gmail.com |
| **Vai trò** | Phát triển, vận hành và bảo trì hệ thống Diecast360 |

### 1.2 Khách hàng (Customer)

| Thông tin | Chi tiết |
|-----------|---------|
| **Đối tượng** | Shop Owner / Shop Admin sử dụng nền tảng Diecast360 |
| **Vai trò** | Quản lý shop, catalog, pre-order, members trên hệ thống |
| **Phạm vi** | Tất cả shops đang active trên nền tảng |

---

## 2. Mô tả dịch vụ

### 2.1 Các dịch vụ thuộc SLA

| Dịch vụ | Mô tả | Endpoint tham chiếu |
|---------|-------|-------------------|
| **Admin Web App** | Giao diện quản lý shop, items, pre-orders, members | `https://app.diecast360.vn/admin` |
| **Public Catalog** | Trang catalog công khai cho khách xem sản phẩm | `https://app.diecast360.vn/` |
| **REST API** | Backend API cho toàn bộ tính năng | `https://api.diecast360.vn/api/v1` |
| **Media Storage** | Lưu trữ và phục vụ ảnh sản phẩm, spinner frames | Cloudflare R2 + Signed URLs |
| **360° Spinner** | Viewer ảnh xoay 360° | Embedded trong catalog |

### 2.2 Các dịch vụ KHÔNG thuộc SLA này

- AI features (OpenAI API) — subject to OpenAI's own SLA
- Facebook integration — subject to Meta/Facebook API availability
- Vector search (Pinecone) — subject to Pinecone's SLA
- Neon PostgreSQL infrastructure — subject to Neon's SLA (mirrored in our SLA)

### 2.3 Môi trường

| Môi trường | Phạm vi SLA |
|-----------|------------|
| **Production** | ✅ Đầy đủ theo tài liệu này |
| **Staging** | ❌ Best-effort, không có SLA |
| **Development** | ❌ Không có SLA |

---

## 3. Giờ dịch vụ & Hỗ trợ

### 3.1 Giờ hoạt động hệ thống

| Dịch vụ | Giờ hoạt động |
|---------|-------------|
| **Web App & API** | 24/7/365 (self-service) |
| **Media storage** | 24/7/365 (Cloudflare R2) |
| **Monitoring** | 24/7 (automated health checks) |

### 3.2 Giờ hỗ trợ

| Loại hỗ trợ | Giờ | Kênh |
|------------|-----|------|
| **Business hours support** | Thứ 2 – Thứ 6, 9:00 – 18:00 GMT+7 | Email, Zalo |
| **P1 Critical on-call** | 24/7 | Zalo (emergency group) |
| **P2 High (ngoài giờ)** | Best-effort | Email |
| **Holidays** | P1 only | On-call |

### 3.3 Kênh liên hệ

| Kênh | Địa chỉ | Dùng cho |
|------|---------|---------|
| Email | support@diecast360.vn | P2/P3/P4, general questions |
| Zalo Group | [Diecast360 Support] | P1 Critical, urgent issues |
| GitHub Issues | github.com/nguyenhoangtin1404/Diecast360 | Bug reports, feature requests |

---

## 4. Service Level Objectives (SLO)

### 4.1 Availability

| Dịch vụ | SLO Target | SLA Guarantee | Measurement window |
|---------|-----------|--------------|-------------------|
| API (core endpoints) | 99.5% | 99.0% | Monthly |
| Admin Web App | 99.5% | 99.0% | Monthly |
| Public Catalog | 99.5% | 99.0% | Monthly |
| Media Delivery (R2) | 99.9% | 99.5% | Monthly |

> **Cách tính Availability:**
> `Availability = (Total minutes - Downtime minutes) / Total minutes × 100%`
>
> Downtime tính từ khi health check fail liên tục 3 lần (interval 1 phút) đến khi health check pass liên tục 3 lần.

**Allowed downtime per month (99% SLA):**
- Monthly: ~7.3 giờ
- Weekly: ~1.7 giờ

### 4.2 Performance

| Metric | SLO Target | SLA Guarantee | Measurement |
|--------|-----------|--------------|------------|
| API response time (p50) | < 150ms | < 300ms | Per endpoint, monthly avg |
| API response time (p95) | < 300ms | < 500ms | Per endpoint, monthly avg |
| API response time (p99) | < 1,000ms | < 2,000ms | Per endpoint, monthly avg |
| Image upload processing | < 5s | < 30s | Per request |
| 360° Spinner (24 frames) initial load | < 3s | < 5s | Time to first frame interactive |
| Database query (simple) | < 50ms | < 200ms | Server-side logged |
| Database failover (Neon HA) | < 30s | < 60s | Neon managed |

**Excluded from performance SLA:**
- AI-assisted features (ai-description, ai-draft, fb-post generation)
- Facebook Graph API calls
- First load after Neon serverless cold start (< 500ms one-time penalty)

### 4.3 Data Integrity

| Metric | SLO | Measurement |
|--------|-----|------------|
| Zero data loss for committed transactions | 100% | Audit |
| Backup RTO (Recovery Time Objective) | < 4 giờ | Tested quarterly |
| Backup RPO (Recovery Point Objective) | < 24 giờ | Neon continuous backup |
| Multi-tenant isolation | 100% (zero cross-tenant leaks) | Security audit |

---

## 5. Phân loại sự cố & Thời gian phản hồi

### 5.1 Phân loại sự cố

| Mức | Tên | Định nghĩa | Ví dụ |
|-----|-----|-----------|-------|
| **P1** | Critical | Hệ thống không thể sử dụng; data loss; security breach | API down, DB unreachable, cross-tenant data leak |
| **P2** | High | Tính năng core bị lỗi ảnh hưởng nhiều users | Upload ảnh fail, pre-order không tạo được, login fail |
| **P3** | Medium | Tính năng phụ bị lỗi, có workaround | Report không load, AI feature lỗi |
| **P4** | Low | Cosmetic, typo, minor UX issue, feature request | UI alignment, wording, enhancement |

### 5.2 SLA thời gian phản hồi

| Mức | First Response | Status Update | Resolution Target |
|-----|--------------|--------------|------------------|
| **P1 Critical** | 30 phút (24/7) | Mỗi 1 giờ | 4 giờ |
| **P2 High** | 2 giờ (business hours) | Mỗi 4 giờ | 24 giờ |
| **P3 Medium** | 8 giờ (business hours) | Daily | 72 giờ (3 ngày) |
| **P4 Low** | Trong sprint tiếp theo | — | Sprint tiếp theo |

> **Lưu ý:** Resolution time tính từ khi sự cố được xác nhận và phân loại. Các sự cố phụ thuộc vào bên thứ ba (Neon, Cloudflare, OpenAI) có thể vượt target.

### 5.3 Quy trình báo cáo sự cố

```
1. User phát hiện sự cố
   ↓
2. Báo cáo qua kênh phù hợp (Zalo P1, Email P2-P4)
   ↓
3. Support team acknowledge trong thời gian SLA
   ↓
4. Phân loại mức độ (P1/P2/P3/P4)
   ↓
5. Assign owner, bắt đầu investigate
   ↓
6. Update status định kỳ theo SLA
   ↓
7. Resolve + verify
   ↓
8. Close + post-mortem (nếu P1/P2)
```

---

## 6. Loại trừ khỏi SLA

Các trường hợp sau **KHÔNG** được tính vào downtime SLA:

### 6.1 Bảo trì theo kế hoạch

- Maintenance window đã được thông báo trước ≥ 48 giờ
- Xem chi tiết tại Mục 7

### 6.2 Sự cố do bên thứ ba

| Provider | Ảnh hưởng nếu down |
|---------|------------------|
| **Neon PostgreSQL** | Database unavailable → toàn bộ API down |
| **Cloudflare R2** | Media không tải được → spinner, images unavailable |
| **Cloudflare Pages** | Frontend unavailable |
| **Cloudflare Tunnel** | Backend API unreachable (nếu dùng tunnel) |
| **OpenAI API** | AI features unavailable |
| **Facebook Graph API** | Facebook integration unavailable |
| **Pinecone** | Vector search unavailable (fallback về basic search) |

### 6.3 Các trường hợp khác

- **Force majeure**: thiên tai, mất điện diện rộng, cyberattack quy mô lớn
- **Lạm dụng dịch vụ**: DDoS attack hướng vào shop, bot abuse
- **User error**: xóa nhầm dữ liệu, misconfiguration từ phía shop
- **Internet connectivity**: vấn đề mạng phía user/ISP
- **Free tier limits**: Neon, Pinecone, OpenAI free tier throttling

---

## 7. Bảo trì theo kế hoạch

### 7.1 Maintenance window thường xuyên

| Window | Thời gian | Tần suất | Thông báo trước |
|--------|---------|---------|----------------|
| **Planned maintenance** | Chủ nhật 2:00 – 4:00 GMT+7 | Hàng tuần (nếu cần) | 48 giờ |
| **Emergency maintenance** | Bất kỳ | Khi cần (hotfix P1) | ASAP, trong maintenance |

### 7.2 Quy trình thông báo bảo trì

1. PM gửi thông báo qua Email + Zalo Group ít nhất 48 giờ trước
2. Nội dung thông báo: thời gian, impact, lý do, contact nếu urgent
3. Reminder 2 giờ trước khi bắt đầu
4. Thông báo khi hoàn tất

### 7.3 Template thông báo bảo trì

```
[THÔNG BÁO BẢO TRÌ] Diecast360 — {Ngày}

Kính gửi các Shop Owners,

Hệ thống Diecast360 sẽ tạm ngừng hoạt động để bảo trì:
- Thời gian: {Ngày tháng}, {Giờ bắt đầu} – {Giờ kết thúc} GMT+7
- Tác động: {Mô tả ngắn tính năng bị ảnh hưởng}
- Lý do: {Nâng cấp DB / Deploy tính năng mới / ...}

Trong thời gian bảo trì, bạn không thể truy cập admin panel và catalog.

Chúng tôi sẽ thông báo khi hệ thống hoạt động trở lại.

Xin lỗi vì sự bất tiện này.
— Diecast360 Team
```

---

## 8. Monitoring & Báo cáo

### 8.1 Monitoring hiện tại

| Metric | Tool | Interval | Alert threshold |
|--------|------|---------|----------------|
| API Health (`/api/v1/health`) | UptimeRobot / Cron | Mỗi 1 phút | 3 lần fail liên tiếp |
| API Response time | Logged per request | Per request | p95 > 500ms |
| Server memory | PM2 monit | Realtime | > 400MB |
| Disk space (uploads) | Shell cron | Daily | > 80% full |
| DB connection | Health check | Mỗi 1 phút | Fail |
| Error rate | Application logs | Per minute | > 5% 5xx in 5min |

### 8.2 Báo cáo SLA hàng tháng

Vào ngày 5 hàng tháng, nhà cung cấp gửi báo cáo SLA tháng trước gồm:

| Mục | Nội dung |
|-----|---------|
| **Availability** | % uptime theo từng dịch vụ |
| **Performance** | p50/p95/p99 response time |
| **Incidents** | Danh sách incidents, severity, resolution time |
| **Planned maintenance** | Danh sách maintenance đã thực hiện |
| **SLA compliance** | Đạt / Không đạt từng metric |
| **Action items** | Actions từ incidents tháng trước |

### 8.3 Status page

Trạng thái hệ thống real-time: https://status.diecast360.vn *(kế hoạch)*

---

## 9. Credits & Remedies

### 9.1 SLA Credits

Nếu SLA không đạt trong một tháng, khách hàng được credit theo bảng sau:

| Availability đạt được | Credit |
|----------------------|--------|
| 99.0% – 99.5% | Không có credit (trong SLA 99%) |
| 98.0% – 99.0% | 10% phí tháng |
| 95.0% – 98.0% | 25% phí tháng |
| < 95.0% | 50% phí tháng |

> **Lưu ý:** Credits chỉ áp dụng cho các shops có hợp đồng trả phí. Với giai đoạn beta/free, credit được xem xét theo từng trường hợp.

### 9.2 Giới hạn Credit

- Tổng credit trong một tháng không vượt quá 50% phí tháng
- Credits không được chuyển thành tiền mặt
- Credits chỉ áp dụng cho tháng bị ảnh hưởng

### 9.3 Cách yêu cầu Credit

1. Gửi email đến support@diecast360.vn trong vòng 15 ngày sau tháng bị ảnh hưởng
2. Kèm theo: thời gian sự cố, tác động đến shop, mô tả ngắn
3. Team review và phản hồi trong 5 ngày làm việc

---

## 10. Quy trình Escalation

### 10.1 Escalation path

```
Level 1: Support Team
  → Acknowledge trong thời gian SLA
  → Investigate và cố gắng resolve
  ↓ (nếu không resolve trong 50% target time)
Level 2: Backend Dev on-call
  → Deep technical investigation
  → Implement fix
  ↓ (nếu P1 không resolve trong 2h)
Level 3: Tech Lead
  → Architecture decision
  → External vendor escalation (Neon, Cloudflare)
  ↓ (nếu cần)
Level 4: PM
  → Business decision
  → Customer communication
  → Executive escalation
```

### 10.2 Contacts

| Level | Người | Zalo | Email |
|-------|-------|------|-------|
| L1 Support | Rotating on-duty | Zalo group | support@diecast360.vn |
| L2 Backend | Backend Dev 1/2 | Personal Zalo | — |
| L3 Tech Lead | [Tech Lead Name] | Personal Zalo | — |
| L4 PM | Nguyễn Hoàng Tin | Personal Zalo | nguyenhoangtin1404@gmail.com |

---

## 11. Điều khoản thay đổi SLA

### 11.1 Quy trình thay đổi

- Bất kỳ thay đổi nào với SLA phải được thông báo **30 ngày trước**
- Thông báo qua email đến tất cả shop owners active
- Phiên bản SLA được version (v1.0, v1.1, v2.0...)
- Lịch sử version được lưu tại `docs/project-docs/group7-handover/`

### 11.2 Lịch sử phiên bản

| Version | Ngày hiệu lực | Thay đổi chính | Người phê duyệt |
|---------|--------------|---------------|----------------|
| 1.0 | 2026-06-01 | Phiên bản đầu tiên | Nguyễn Hoàng Tin |

---

## 12. Chu kỳ Review

| Review | Tần suất | Người tham gia |
|--------|---------|---------------|
| **SLA Performance Review** | Hàng tháng | PM + Tech Lead |
| **SLA Document Review** | Hàng quý | PM + Tech Lead + Shop representative |
| **Annual SLA Renewal** | Hàng năm | Tất cả parties |

Mục tiêu của quarterly review:
- Đánh giá SLA metrics có còn phù hợp không
- Điều chỉnh targets nếu cần (dựa trên data thực tế)
- Cập nhật contacts, maintenance windows
- Review incident patterns và action items

---

## 13. Chữ ký

### Nhà cung cấp dịch vụ

| Thông tin | |
|----------|--|
| **Họ tên** | Nguyễn Hoàng Tin |
| **Chức danh** | Project Manager / Tech Lead |
| **Email** | nguyenhoangtin1404@gmail.com |
| **Ngày ký** | _________________ |
| **Chữ ký** | _________________ |

---

### Khách hàng (Shop Owner Representative)

| Thông tin | |
|----------|--|
| **Họ tên** | _________________ |
| **Shop Name** | _________________ |
| **Email** | _________________ |
| **Ngày ký** | _________________ |
| **Chữ ký** | _________________ |

---

> **Tài liệu này có hiệu lực từ ngày ký và có giá trị đến khi được thay thế bởi phiên bản mới có chữ ký của cả hai bên.**

---

### Phụ lục A — Định nghĩa thuật ngữ

| Thuật ngữ | Định nghĩa |
|----------|-----------|
| **SLA** | Service Level Agreement — thỏa thuận mức dịch vụ |
| **SLO** | Service Level Objective — mục tiêu mức dịch vụ (nội bộ) |
| **Availability** | % thời gian hệ thống hoạt động bình thường |
| **Downtime** | Thời gian hệ thống không phục vụ được request |
| **p95** | Percentile 95 — 95% requests có response time dưới ngưỡng này |
| **RTO** | Recovery Time Objective — mục tiêu thời gian khôi phục |
| **RPO** | Recovery Point Objective — mục tiêu điểm khôi phục dữ liệu |
| **GMT+7** | Múi giờ Việt Nam (UTC+7) |
| **Business hours** | Thứ 2 – Thứ 6, 9:00 – 18:00 GMT+7 |
