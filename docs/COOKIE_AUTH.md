# Cookie-Based Authentication Guide

## Tổng quan

Hệ thống Diecast360 sử dụng **HttpOnly Cookie-based Authentication** để đảm bảo bảo mật tối đa. Cách tiếp cận này:

- ✅ **Chống XSS**: JavaScript không thể đọc được HttpOnly cookies
- ✅ **Tự động gửi**: Browser tự động gửi cookies mỗi request
- ✅ **Chống CSRF**: Kết hợp SameSite attribute và double-submit token (`csrf_token` cookie + `X-CSRF-Token` header)
- ✅ **Secure flag**: Chỉ gửi qua HTTPS trong production

## Cấu hình môi trường

### Backend `.env`

```env
# Cookie Security Settings
COOKIE_SECRET=your-random-32-char-secret-here
COOKIE_SECURE=false        # Set to 'true' in production (HTTPS only)
COOKIE_SAME_SITE=lax       # 'lax' for dev, 'strict' for prod
FRONTEND_URL=http://localhost:5173
```

### Giải thích các biến

| Biến | Giá trị Dev | Giá trị Prod | Mô tả |
|------|-------------|--------------|-------|
| `COOKIE_SECRET` | random string | **MUST CHANGE** | Khóa bí mật để ký cookies |
| `COOKIE_SECURE` | `false` | `true` | Chỉ gửi cookies qua HTTPS |
| `COOKIE_SAME_SITE` | `lax` | `strict`, `lax`, hoặc **`none`** | `none` chỉ khi **frontend và API khác domain** (vd UI `www.shop.com`, API `api.shop.com`); bắt buộc `COOKIE_SECURE=true` và CORS đúng. Cùng site (subpath / reverse proxy) dùng `lax` hoặc `strict`. |
| `FRONTEND_URL` | `http://localhost:5173` | Your domain | CORS origin |
| `FRONTEND_URLS` | optional | Preview/admin domains | Danh sách origin bổ sung, tách bằng dấu phẩy |
| `CORS_ALLOW_LAN` | `true` nếu test qua LAN | `false` | Chỉ dùng dev; production boot sẽ reject nếu bật |
| `JWT_ALLOW_AUTHORIZATION_BEARER` | `true` | tùy policy | Đặt `false` nếu web chỉ dùng HttpOnly cookie và muốn tắt fallback `Authorization: Bearer` |

## Cookies được sử dụng

### `access_token`
- **Mục đích**: Xác thực API requests
- **MaxAge**: 15 phút
- **Path**: `/` (toàn domain)
- **HttpOnly**: ✅
- **Secure**: Theo cấu hình

### `refresh_token`
- **Mục đích**: Lấy access_token mới khi hết hạn
- **MaxAge**: 7 ngày
- **Path**: `/api/v1/auth` (chỉ auth endpoints)
- **HttpOnly**: ✅
- **Secure**: Theo cấu hình

### `csrf_token`
- **Mục đích**: Double-submit CSRF token cho request thay đổi trạng thái
- **MaxAge**: 7 ngày
- **Path**: `/`
- **HttpOnly**: ❌ (frontend phải đọc để gửi header)
- **Secure / SameSite**: Theo cấu hình giống auth cookies
- **Header bắt buộc**: `X-CSRF-Token: <csrf_token>` cho `POST`, `PATCH`, `DELETE`, trừ `POST /api/v1/auth/login`

## Flow hoạt động

### 1. Login
```
POST /api/v1/auth/login
Body: { email, password }

Response:
- Set-Cookie: access_token=... (HttpOnly)
- Set-Cookie: refresh_token=... (HttpOnly)
- Set-Cookie: csrf_token=... (readable)
- Body: { user: {...}, message: 'Login successful' }
```

### 2. API Request (tự động)
```
GET /api/v1/items
Cookie: access_token=... (browser tự động gửi)

Response: { ok: true, data: {...} }
```

### 3. Mutating request (CSRF double-submit)
```
PATCH /api/v1/items/:id
Cookie: access_token=...; csrf_token=...
X-CSRF-Token: <same value as csrf_token cookie>

Response: { ok: true, data: {...} }
```

Nếu client cần bootstrap/rotate token mà chưa login lại, gọi safe endpoint:

```
GET /api/v1/auth/csrf

Response:
- Set-Cookie: csrf_token=...
- Body: { csrf_token: "..." }
```

### 4. Token Refresh (tự động qua interceptor)
```
POST /api/v1/auth/refresh
Cookie: refresh_token=... (browser tự động gửi)
X-CSRF-Token: <csrf_token>

Response:
- Set-Cookie: access_token=... (mới)
- Set-Cookie: refresh_token=... (mới, token rotation)
- Set-Cookie: csrf_token=... (mới)
- Body: { message: 'Token refreshed successfully' }
```

### 5. Logout
```
POST /api/v1/auth/logout
Cookie: refresh_token=...
X-CSRF-Token: <csrf_token>

Response:
- Clear-Cookie: access_token
- Clear-Cookie: refresh_token
- Clear-Cookie: csrf_token
- Body: { message: 'Logout successful' }
```

## Frontend Implementation

### API Client (`src/api/client.ts`)
```typescript
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // CRITICAL: Enable cookie sending
});
```

### Auth Context (`src/contexts/AuthContext.tsx`)
- Không còn lưu token trong `localStorage`
- Auth state được xác định bằng cách gọi `/auth/me`
- Nếu thành công → đã đăng nhập
- Nếu 401 → chưa đăng nhập hoặc token hết hạn
- Với request mutating, client phải gửi `X-CSRF-Token` khớp cookie `csrf_token`; server trả `403 CSRF_INVALID` nếu thiếu hoặc sai.

## Backend Implementation

### JWT Strategy (`src/auth/strategies/jwt.strategy.ts`)
```typescript
// Custom extractor reads from HttpOnly cookie
const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }
  // Optional fallback to Authorization header
  if (allowAuthorizationBearer) {
    const authHeader = req?.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
  }
  return null;
};
```

### Cookie Parser (`src/main.ts`)
```typescript
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  const cookieSecret = process.env.COOKIE_SECRET;
  if (!cookieSecret || cookieSecret.trim().length < 32) {
    throw new Error('COOKIE_SECRET must be set and at least 32 characters long');
  }
  app.use(cookieParser(cookieSecret));
  
  // ... rest of config
}
```

### CSRF middleware (`src/common/middleware/csrf.middleware.ts`)
```typescript
// GET/HEAD/OPTIONS pass; POST /auth/login is exempt for login bootstrap.
// Other POST/PATCH/DELETE requests must send X-CSRF-Token equal to csrf_token cookie.
```

## Kiểm tra hoạt động

### Bước 1: Login
1. Mở DevTools → Application → Cookies
2. Thực hiện đăng nhập
3. Kiểm tra cookies `access_token` và `refresh_token` đã được set
4. Verify: `HttpOnly` = ✅

### Bước 2: Refresh page
1. Refresh trang
2. Nếu vẫn đăng nhập → cookies hoạt động đúng

### Bước 3: Verify XSS protection
1. Mở Console
2. Gõ: `document.cookie`
3. Không thấy `access_token` hoặc `refresh_token` → HttpOnly hoạt động

### Bước 4: Logout
1. Thực hiện logout
2. Kiểm tra cookies đã bị xóa

## Troubleshooting

### Vào admin ~1 giây rồi bị đá về login (UI và API khác domain)

Khi trang web chạy trên **domain A** (vd `https://www.dhtoys.store`) còn API trên **domain B** (vd `https://nhtin.name.vn`), request XHR là **cross-site**. Cookie `SameSite=Lax` hoặc `Strict` **không** được gửi kèm các request đó → API trả 401 → frontend thử refresh → không có `refresh_token` trong request → chuyển về `/admin/login`.

**Cách sửa trên backend (`.env` production):**

```env
COOKIE_SECURE=true
COOKIE_SAME_SITE=none
```

Rồi restart API. Giữ `FRONTEND_URL` / `FRONTEND_URLS` khớp origin thật của UI (đã có CORS `credentials: true`). CSRF double-submit vẫn bảo vệ các request đổi trạng thái.

**Cách khác (không cần `SameSite=None`):** phục vụ UI và API **cùng một site** (cùng eTLD+1 hoặc reverse proxy một domain, vd `https://www.dhtoys.store` + API `https://www.dhtoys.store/api`).

### Cookies không được set
- Kiểm tra CORS: `credentials: true` ở cả backend và frontend
- Kiểm tra `FRONTEND_URL` khớp với origin của frontend

### 401 liên tục
- Kiểm tra `COOKIE_SAME_SITE` phù hợp với môi trường
- Kiểm tra frontend có set `withCredentials: true`

### 403 `CSRF_INVALID` khi lưu dữ liệu
- Kiểm tra request `POST`/`PATCH`/`DELETE` có header `X-CSRF-Token`
- Kiểm tra cookie `csrf_token` tồn tại cùng domain/path với request API
- Gọi `GET /api/v1/auth/csrf` để lấy token mới nếu tab mở lâu hoặc cookie bị xóa
- `POST /api/v1/auth/login` là endpoint mutating duy nhất được miễn CSRF để bootstrap session

### Production checklist
- [ ] `COOKIE_SECRET` là chuỗi ngẫu nhiên dài > 32 ký tự
- [ ] `COOKIE_SECURE=true`
- [ ] `COOKIE_SAME_SITE` phù hợp: **`none`** nếu frontend và API **khác domain**, ngược lại `lax` hoặc `strict`
- [ ] HTTPS được sử dụng
- [ ] `FRONTEND_URL` là domain production
- [ ] Frontend gửi `X-CSRF-Token` cho mọi request mutating sau login/refresh

## So sánh với localStorage

| Tiêu chí | HttpOnly Cookie | localStorage |
|----------|-----------------|--------------|
| XSS Protection | ✅ Immune | ❌ Vulnerable |
| CSRF Protection | ⚠️ Cần SameSite | ✅ Safe |
| Auto-send | ✅ Yes | ❌ Manual |
| Server-side access | ✅ Yes | ❌ No |
| Size limit | ~4KB | ~5MB |
| Complexity | Medium | Simple |

**Kết luận**: HttpOnly Cookie là lựa chọn tốt hơn cho production khi kết hợp với SameSite attribute.
