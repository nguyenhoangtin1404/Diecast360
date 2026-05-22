---
title: "Maintenance & Support Runbook"
document_id: "37"
version: "1.0"
date: "2026-05-22"
author: "DevOps & QA Team - Diecast360"
status: "Final"
---

# Maintenance & Support Runbook — Diecast360

## Mục Lục

1. [Tổng Quan và Danh Bạ](#1-tổng-quan-và-danh-bạ)
2. [Bảo Trì Định Kỳ](#2-bảo-trì-định-kỳ)
3. [Incident Response Playbooks](#3-incident-response-playbooks)
4. [Quy Trình Rollback](#4-quy-trình-rollback)
5. [Backup và Phục Hồi](#5-backup-và-phục-hồi)
6. [Performance Tuning](#6-performance-tuning)
7. [Quản Lý Dependencies](#7-quản-lý-dependencies)

---

## 1. Tổng Quan và Danh Bạ

### On-Call Contacts

| Vai trò | Họ tên | Liên hệ | Giờ phản hồi |
|---------|--------|---------|-------------|
| Tech Lead (on-call chính) | [Tech Lead Name] | Zalo/Phone: xxx | 24/7 P1 |
| DevOps | [DevOps Name] | Zalo/Phone: xxx | Business hours |
| Backend Dev (on-call) | [Backend Dev Name] | Zalo/Phone: xxx | 24/7 P1 |
| QA Lead | [QA Name] | Zalo/Phone: xxx | Business hours |
| PM | [PM Name] | Phone: xxx | Business hours |

### Escalation Path

```
P1/P2 Incident
   │
   ▼ (0-30 phút)
On-Call Dev → Check logs, thử restart
   │ Không giải quyết được
   ▼ (30-60 phút)
Tech Lead → Deeper investigation
   │ Cần quyết định business
   ▼
PM → Notify customers nếu downtime kéo dài
```

### Công cụ cần thiết khi On-Call

- [ ] SSH access vào server (IP + key)
- [ ] Cloudflare Dashboard login
- [ ] Neon Console login
- [ ] PM2 commands (xem [docs/35_system_admin_guide.md](35_system_admin_guide.md))
- [ ] `.env` backup ở vị trí an toàn (password manager)

---

## 2. Bảo Trì Định Kỳ

### Hàng Ngày (5-10 phút)

```bash
# 1. Kiểm tra health endpoint
curl -s https://api.diecast360.com/api/v1/health | jq '.data.status'
# Kỳ vọng: "ok"

# 2. Kiểm tra PM2 status
pm2 status
# Kỳ vọng: diecast360-api → status: online, restarts: ổn định (không tăng liên tục)

# 3. Review error log 24h qua
pm2 logs diecast360-api --err --lines 50 | grep -v "INFO"

# 4. Kiểm tra disk space
df -h / /home/pi/diecast360/uploads/ 2>/dev/null || df -h /
```

**Ngưỡng cảnh báo hàng ngày:**
- Disk > 80%: dọn log cũ, liên hệ DevOps
- PM2 restarts > 5 lần trong ngày: kiểm tra lỗi, báo Dev
- Error rate tăng đột biến: báo Dev ngay

---

### Hàng Tuần (30-60 phút)

**Thứ Hai hàng tuần:**

- [ ] **Verify DB backup**: Kiểm tra backup đêm qua có thành công không
  ```bash
  ls -lh /backup/db/ | head -5
  # File mới nhất phải < 24h tuổi và > 0 bytes
  ```

- [ ] **Disk space check chi tiết**:
  ```bash
  du -sh /home/pi/diecast360/uploads/*/
  du -sh /var/log/pm2/
  ```

- [ ] **PM2 log rotation** (nếu chưa tự động):
  ```bash
  pm2 flush diecast360-api  # Dọn log cũ
  ```

- [ ] **Kiểm tra Neon connection pool**:
  ```bash
  psql "$DATABASE_URL" -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"
  ```

- [ ] **Review Cloudflare Analytics**: Vào dashboard Cloudflare Pages và R2 xem traffic bất thường

---

### Hàng Tháng (2-3 giờ)

**Đầu mỗi tháng:**

- [ ] **Security patches — OS**:
  ```bash
  sudo apt-get update
  sudo apt-get upgrade -y
  sudo reboot  # Nếu có kernel update (thực hiện ngoài giờ cao điểm)
  ```

- [ ] **Dependency audit**:
  ```bash
  cd /home/pi/diecast360
  pnpm audit
  # Review các lỗ hổng critical và high
  # Tham khảo phần 7 để update an toàn
  ```

- [ ] **R2 storage audit**: Xem bucket usage trên Cloudflare Dashboard, xác nhận không có file orphan

- [ ] **Review PM2 logs** của tháng qua để phát hiện xu hướng lỗi

- [ ] **Kiểm tra SSL cert** (Cloudflare quản lý tự động, nhưng vẫn xác nhận):
  ```bash
  curl -vI https://api.diecast360.com/api/v1/health 2>&1 | grep -E "expire|SSL"
  ```

- [ ] **Test restore DB backup** (test ở môi trường staging, không phải production):
  ```bash
  pg_restore --dbname="$STAGING_DATABASE_URL" --clean /backup/db/latest.dump
  ```

---

### Hàng Quý (nửa ngày)

- [ ] **Xoay vòng JWT_SECRET** (xem [docs/35: Section 7](35_system_admin_guide.md))
  - **Cảnh báo**: Tất cả user bị logout. Thực hiện lúc ít user nhất.

- [ ] **Xoay vòng Cookie Secret**

- [ ] **Gia hạn Facebook Long-Lived Token** (60 ngày, thực hiện mỗi 45 ngày)

- [ ] **Review và update Dependencies**:
  ```bash
  pnpm outdated  # Liệt kê packages cần update
  ```

- [ ] **Kiểm tra Neon plan và usage**: Đảm bảo không vượt giới hạn free/paid tier

- [ ] **SLA Review**: Xem lại uptime tháng qua và đối chiếu với SLA

---

## 3. Incident Response Playbooks

### INC-01: Backend Service Down

**Triệu chứng**: API trả 503/502, health check thất bại, frontend báo "Không kết nối được"

```bash
# Bước 1: Kiểm tra PM2
pm2 status
pm2 logs diecast360-api --err --lines 30

# Bước 2: Thử restart
pm2 restart diecast360-api

# Bước 3: Kiểm tra sau restart (chờ 15 giây)
sleep 15
curl http://localhost:3000/api/v1/health

# Bước 4: Nếu vẫn fail, kiểm tra lỗi chi tiết
pm2 logs diecast360-api --err --lines 100

# Bước 5: Kiểm tra port có bị chiếm không
ss -tlnp | grep 3000

# Bước 6: Nếu port bị chiếm bởi process khác
lsof -i :3000
kill -9 <PID>
pm2 start diecast360-api
```

**Nguyên nhân thường gặp:**
- OOM (Out of Memory) → Node.js process bị kill → PM2 đang restart
- Uncaught exception → Check error logs
- Port conflict → Kill process chiếm port

**Thời gian xử lý kỳ vọng**: < 5 phút cho restart đơn giản

---

### INC-02: Lỗi Kết Nối Database

**Triệu chứng**: API trả lỗi 500 với message "Database connection", log có "ECONNREFUSED" hoặc "SSL connection error"

```bash
# Bước 1: Kiểm tra Neon status
# Truy cập: https://neon.tech/docs/status (hoặc status.neon.tech)

# Bước 2: Test kết nối DB trực tiếp
psql "$DATABASE_URL" -c "SELECT 1;" 2>&1

# Bước 3: Kiểm tra DATABASE_URL hợp lệ
grep DATABASE_URL /home/pi/diecast360/backend/.env

# Bước 4: Kiểm tra số connection hiện tại
psql "$DATABASE_URL" -c "SELECT count(*), state FROM pg_stat_activity WHERE datname='diecast360' GROUP BY state;"

# Bước 5: Nếu Neon bị wakeup delay (serverless), thêm retry config
# Đây là behavior bình thường của Neon free tier
# Xem phần Performance Tuning - Neon Serverless Wakeup

# Bước 6: Restart PM2 (reset connection pool)
pm2 restart diecast360-api
```

**Nếu Neon có incident (status page đỏ)**: Chờ Neon phục hồi. Không có action nào từ phía team.

---

### INC-03: Upload Ảnh Thất Bại

**Triệu chứng**: API trả 500/413 khi upload, log có lỗi ENOENT/EACCES/ENOSPC

```bash
# Bước 1: Kiểm tra disk space
df -h /home/pi/diecast360/uploads/

# Bước 2: Kiểm tra quyền thư mục
ls -la /home/pi/diecast360/uploads/
# Cần: drwxr-xr-x owned by pi (hoặc user chạy PM2)

# Bước 3: Fix quyền nếu sai
chown -R pi:pi /home/pi/diecast360/uploads/
chmod -R 755 /home/pi/diecast360/uploads/

# Bước 4: Nếu dùng R2, kiểm tra connectivity
curl -s https://r2.cloudflarestorage.com/ | head -5
grep "R2_" /home/pi/diecast360/backend/.env  # Kiểm tra keys còn đúng không

# Bước 5: Test upload nhỏ
curl -X POST https://api.diecast360.com/api/v1/items/1/images \
  -H "Cookie: <session>" \
  -F "file=@test_small.jpg"  # File < 1MB
```

**Nếu disk đầy**: Dọn upload cũ (orphan files không liên kết item nào) và log:
```bash
# Xóa PM2 logs cũ
pm2 flush
# Xóa backup DB cũ hơn 14 ngày
find /backup/db/ -name "*.dump" -mtime +14 -delete
```

---

### INC-04: Lỗi Authentication

**Triệu chứng**: Người dùng không đăng nhập được, bị logout liên tục, lỗi "Invalid token" hoặc "CSRF token mismatch"

```bash
# Bước 1: Kiểm tra JWT_SECRET trong .env
grep JWT_SECRET /home/pi/diecast360/backend/.env
# Phải có giá trị, không được trống

# Bước 2: Kiểm tra cookie config
grep -E "COOKIE_|CORS_|SESSION_" /home/pi/diecast360/backend/.env

# Bước 3: Test login thủ công
curl -c cookies.txt -X POST https://api.diecast360.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password"}'

# Bước 4: Lấy CSRF token và test
curl -b cookies.txt https://api.diecast360.com/api/v1/auth/csrf
# Copy csrf_token từ response

# Bước 5: Test request với CSRF
curl -b cookies.txt \
  -H "X-CSRF-Token: <csrf_token>" \
  https://api.diecast360.com/api/v1/auth/me

# Bước 6: Nếu CORS issue, kiểm tra CORS_ORIGINS
grep CORS_ORIGINS /home/pi/diecast360/backend/.env
# Phải bao gồm https://app.diecast360.com
```

**Nếu vừa thay đổi JWT_SECRET**: Bình thường — tất cả user cần đăng nhập lại.

---

### INC-05: Cloudflared Tunnel Down

**Triệu chứng**: HTTPS API không truy cập được từ internet, nhưng localhost:3000 vẫn OK

```bash
# Bước 1: Kiểm tra cloudflared status
sudo systemctl status cloudflared

# Bước 2: Xem log cloudflared
sudo journalctl -u cloudflared --since "30 minutes ago"

# Bước 3: Restart cloudflared
sudo systemctl restart cloudflared

# Bước 4: Kiểm tra sau restart
sleep 10
curl -s https://api.diecast360.com/api/v1/health

# Bước 5: Nếu vẫn fail, kiểm tra credentials
cloudflared tunnel info diecast360-api

# Bước 6: Fallback - nếu có IP public thẳng
# Cấu hình DNS trỏ thẳng vào IP server (bypass tunnel)
# Liên hệ DevOps để thực hiện
```

---

### INC-06: AI Features Không Hoạt Động

**Triệu chứng**: Tính năng tạo mô tả AI, caption AI, hoặc AI import ảnh không phản hồi

```bash
# Bước 1: Kiểm tra OpenAI API key
grep OPENAI_API_KEY /home/pi/diecast360/backend/.env

# Bước 2: Test OpenAI connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models | jq '.data[0].id'

# Bước 3: Kiểm tra quota/billing tại https://platform.openai.com/usage
# Nếu quota hết: nạp thêm credit hoặc dùng API key khác

# Bước 4: Rotate API key (nếu bị lộ)
# 1. Tạo key mới tại https://platform.openai.com/api-keys
# 2. Cập nhật .env
# 3. Reload PM2

# Bước 5: Kiểm tra Pinecone (nếu lỗi liên quan vector search)
grep PINECONE_ /home/pi/diecast360/backend/.env
curl -H "Api-Key: $PINECONE_API_KEY" \
  "https://controller.us-east-1.pinecone.io/databases" | jq '.'
```

---

### INC-07: Lỗi Đăng Bài Facebook

**Triệu chứng**: Tính năng post Facebook trả lỗi OAuthException hoặc Invalid token

```bash
# Bước 1: Kiểm tra token trong .env
grep FACEBOOK_ /home/pi/diecast360/backend/.env

# Bước 2: Test token
curl -G "https://graph.facebook.com/me" \
  --data-urlencode "access_token=$FACEBOOK_PAGE_ACCESS_TOKEN" \
  | jq '.error // .id'

# Bước 3: Nếu token hết hạn, thực hiện quy trình gia hạn
# (Xem docs/35: Section 7 - Xoay vòng Facebook Token)

# Bước 4: Kiểm tra quyền của App
curl -G "https://graph.facebook.com/me/permissions" \
  --data-urlencode "access_token=$FACEBOOK_PAGE_ACCESS_TOKEN" \
  | jq '.data[]|select(.status=="granted")|.permission'
# Cần: pages_manage_posts, pages_read_engagement
```

---

### INC-08: Memory Usage Cao

**Triệu chứng**: PM2 báo memory > 400MB, server chậm, có thể OOM kill

```bash
# Bước 1: Xem memory hiện tại
pm2 show diecast360-api | grep memory

# Bước 2: Nếu > 450MB, restart ngay (PM2 cũng tự restart theo max_memory_restart)
pm2 restart diecast360-api

# Bước 3: Theo dõi sau restart
pm2 monit  # Xem memory trend

# Bước 4: Nếu leak tái diễn, kiểm tra xem có job nào đang chạy không
pm2 logs diecast360-api | grep -i "sharp\|image\|process"

# Bước 5: Kiểm tra system memory
free -m
# Nếu system RAM cũng thấp, kiểm tra process khác
ps aux --sort=-%mem | head -10

# Bước 6: Báo Dev Team để investigate root cause
# Attach log và memory profile
```

**Nguyên nhân thường gặp**: Sharp image processing không giải phóng bộ nhớ sau batch upload lớn.

**Fix tạm thời**: Restart PM2. **Fix lâu dài**: Dev Team cần giới hạn concurrency Sharp.

---

### INC-09: Migration Thất Bại

**Triệu chứng**: Deploy mới thất bại với lỗi "Migration checksum mismatch" hoặc "Schema drift detected"

```bash
# Bước 1: DỪNG LẠI - Không chạy thêm lệnh migration nào
# Bước 2: Xem trạng thái migration
pnpm prisma migrate status 2>&1 | tee /tmp/migration_status.log

# Bước 3: Ghi lại lỗi đầy đủ và liên hệ Tech Lead NGAY

# Bước 4: Nếu cần rollback khẩn cấp:
# a. Giữ nguyên code version hiện tại (không deploy thêm)
# b. Restore từ backup DB (xem phần 5)
# c. Thông báo downtime cho users

# TUYỆT ĐỐI KHÔNG:
# - Không sửa file migration đã apply
# - Không chạy prisma migrate reset trong production
# - Không xóa entries trong bảng _prisma_migrations
```

---

### INC-10: Pinecone/Vector Search Lỗi

**Triệu chứng**: AI search không trả kết quả, log có lỗi Pinecone connection

```bash
# Bước 1: Kiểm tra API key
grep PINECONE_ /home/pi/diecast360/backend/.env

# Bước 2: Kiểm tra status Pinecone
# https://status.pinecone.io/

# Bước 3: Test index status
curl -H "Api-Key: $PINECONE_API_KEY" \
  "https://controller.$PINECONE_ENVIRONMENT.pinecone.io/databases/$PINECONE_INDEX_NAME" \
  | jq '.status'

# Bước 4: Nếu index không ready, chờ hoặc liên hệ Pinecone support

# Bước 5: Feature degradation - vô hiệu hóa tạm thời AI search
# Set PINECONE_ENABLED=false trong .env → pm2 reload
# App sẽ fallback về PostgreSQL full-text search
```

---

## 4. Quy Trình Rollback

### Rollback Code

```bash
# Trên server
cd /home/pi/diecast360

# 1. Xem git log để tìm commit cần rollback về
git log --oneline -10

# 2. Checkout commit ổn định trước đó
git checkout <commit_hash>

# 3. Cài dependencies (phòng trường hợp thay đổi)
cd backend && pnpm install --frozen-lockfile

# 4. Build lại
pnpm build

# 5. KHÔNG chạy migrate deploy (giữ schema hiện tại)

# 6. Reload PM2
pm2 reload diecast360-api

# 7. Kiểm tra
curl https://api.diecast360.com/api/v1/health
```

### Rollback Database Migration

> **Cảnh báo**: Rollback DB migration là thao tác nguy hiểm. Chỉ thực hiện khi:
> - Migration mới vừa chạy (trong vòng 1 giờ)
> - Chưa có dữ liệu production được write vào column/table mới

```bash
# Cách duy nhất an toàn: Restore từ backup
# Xem phần 5 - Backup & Recovery

# KHÔNG dùng: prisma migrate reset (xóa hết dữ liệu)
# KHÔNG dùng: DROP TABLE thủ công trừ khi được Tech Lead xác nhận
```

---

## 5. Backup và Phục Hồi

### Chiến lược Backup

| Loại | Tần suất | Nơi lưu | Thời gian giữ |
|------|---------|---------|--------------|
| DB full dump | Hàng ngày 02:00 | `/backup/db/` + Remote | 30 ngày |
| DB schema | Hàng tuần | `/backup/schema/` | 90 ngày |
| Uploads (local) | Hàng ngày 03:00 | External HDD + Cloud | 14 ngày |
| .env backup | Sau mỗi thay đổi | Password manager | Permanent |

### RTO / RPO Targets

| Scenario | RPO (mất data tối đa) | RTO (thời gian phục hồi) |
|----------|----------------------|------------------------|
| DB crash | 24 giờ (backup hàng ngày) | 1 giờ |
| Server crash (có backup) | 24 giờ | 2 giờ |
| Cloudflare Pages down | 0 (static files) | N/A (Cloudflare SLA) |
| Accidental data deletion | 24 giờ | 1 giờ |

### Quy Trình Phục Hồi DB

```bash
# Bước 1: Dừng backend (tránh write trong quá trình restore)
pm2 stop diecast360-api

# Bước 2: Liệt kê backup có sẵn
ls -lh /backup/db/ | sort -k6,7 | tail -5

# Bước 3: Restore
pg_restore \
  --dbname="$DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  /backup/db/diecast360_YYYYMMDD_020000.dump

# Bước 4: Verify
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM items;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM pre_orders;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM members;"

# Bước 5: Chạy lại migration (nếu rollback về schema cũ hơn code)
pnpm prisma migrate deploy

# Bước 6: Khởi động lại backend
pm2 start diecast360-api

# Bước 7: Kiểm tra
curl https://api.diecast360.com/api/v1/health
```

### Backup Cloudflare R2

R2 hỗ trợ versioning (bật trong Cloudflare Dashboard). Để restore file từ R2:
1. Vào Cloudflare Dashboard → R2 → bucket `diecast360-prod`
2. Browse đến file cần restore
3. Xem Version history → Chọn version → Restore

---

## 6. Performance Tuning

### Node.js Memory Tuning

```bash
# Trong ecosystem.config.js
node_args: '--max-old-space-size=512',
# 512 MB phù hợp cho Raspberry Pi 4 (4GB)
# Tăng lên 1024 nếu server có RAM > 4GB

# Theo dõi GC pressure
pm2 logs diecast360-api | grep -i "garbage\|heap\|memory"
```

### PostgreSQL Connection Pool (Prisma)

Trong `backend/.env`:

```bash
# Neon pooler (dùng cho app queries)
DATABASE_URL="postgresql://...@ep-xxx.pooler.neon.tech/diecast360?pgbouncer=true&connection_limit=10"

# Neon direct (dùng cho migrations)
DIRECT_URL="postgresql://...@ep-xxx.neon.tech/diecast360"
```

Giá trị `connection_limit`:
- Free tier Neon: tối đa 20 → dùng 10
- Paid tier: tăng tùy plan

### Sharp Image Processing

Trong backend code, Sharp phải có concurrency giới hạn:

```typescript
// Đúng (đã fix sau INC-02 tháng 12/2025)
import sharp from 'sharp';
sharp.concurrency(1);  // Giới hạn 1 thread tránh OOM trên Pi

// Sai (không giới hạn - gây OOM)
// sharp.concurrency(0);  // 0 = số CPU core
```

Nếu phát hiện code chưa có `sharp.concurrency(1)`, báo Dev Team ngay.

### Neon Serverless Wakeup

Neon free tier có thể "ngủ" sau 5 phút không hoạt động. Giải pháp:

```bash
# Thêm cronjob ping DB mỗi 4 phút
*/4 * * * * psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1

# Hoặc dùng health endpoint (đã tự ping DB)
*/4 * * * * curl -s https://api.diecast360.com/api/v1/health > /dev/null
```

---

## 7. Quản Lý Dependencies

### Quy Trình Cập Nhật Package An Toàn

```bash
# Bước 1: Xem packages nào cần update
cd /home/pi/diecast360
pnpm outdated

# Bước 2: Audit lỗ hổng bảo mật
pnpm audit

# Bước 3: Update patch versions (an toàn)
pnpm update  # Chỉ update trong semver range của package.json

# Bước 4: Update specific package
pnpm add <package>@latest --save-exact

# Bước 5: Chạy test suite trước khi deploy
cd backend && pnpm test
cd ../frontend && pnpm test

# Bước 6: Test E2E (Playwright)
cd frontend && pnpm playwright test

# Bước 7: Deploy nếu test pass (xem quy trình deploy trong docs 35)
```

### Packages Nhạy Cảm (Update Thận Trọng)

| Package | Lý do thận trọng |
|---------|----------------|
| `@prisma/client`, `prisma` | Schema migration có thể break |
| `@nestjs/core`, `@nestjs/common` | Breaking changes giữa major version |
| `sharp` | API thay đổi giữa versions |
| `jsonwebtoken` | Auth critical path |
| `bcrypt` | Auth critical path |

---

*Tài liệu này cần được review và cập nhật hàng quý.*
*Runbook version: 1.0 — Ngày tạo: 2026-05-22*
