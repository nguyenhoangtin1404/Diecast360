# Diecast360 — Frontend

React 19 + Vite 7 + TanStack Query + Tailwind CSS 3.

## Scripts

```bash
npm run dev          # Vite dev server (http://localhost:5173)
npm run build        # TypeScript compile + Vite production build
npm run preview      # Preview production build locally
npm run lint         # ESLint
npm run test:unit    # Vitest unit tests
npm run test:e2e     # Playwright E2E tests (xem bên dưới)
```

## Biến môi trường

Tạo `frontend/.env` từ `frontend/.env.example`:

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `VITE_API_BASE_URL` | Base URL của backend API; rỗng/`auto` gọi same-origin `/api/v1` qua Vite proxy khi dev | `auto` hoặc `http://localhost:3000/api/v1` |
| `VITE_ADMIN_SEMANTIC_SEARCH_ENABLED` | Bật UI semantic search trong admin items | `false` |
| `VITE_MAX_SPINNER_FRAMES` | Số frame tối đa cho spinner 360° | `48` |
| `VITE_PUBLIC_PREORDER_SHOP_ID` | Shop ID mặc định cho pre-order public / single-tenant deploy | — |
| `VITE_PUBLIC_CATALOG_SHOP_ID` | Shop mặc định cho catalog public khi URL không có `?shop_id=` | — |

## E2E Testing (Playwright)

```bash
# Cài browser (lần đầu)
npx playwright install chromium

# Chạy tests
npm run test:e2e                              # toàn bộ suite (53 tests)
npm run test:e2e -- tests/e2e/auth.spec.ts   # 1 file
npm run test:e2e -- --ui                     # Playwright UI mode
npm run test:e2e -- --headed                 # có browser head
npm run test:e2e -- --debug                  # Playwright Inspector (local only)
```

Test files nằm trong `tests/e2e/`. Shared helpers (mock factories, `authenticatedPage` fixture) trong `tests/e2e/fixtures/index.ts`.

## Cấu trúc thư mục

```
src/
  api/            # fetch wrappers cho từng domain (items, members, reports, ...)
  components/     # UI components dùng chung
  config/         # cấu hình (api base URL, ...)
  constants/      # hằng số (spinner limits, ...)
  contexts/       # React contexts (AuthContext, ShopContext)
  hooks/          # custom hooks
  pages/          # pages (admin/, public/)
  types/          # TypeScript types cho domain model
tests/
  e2e/            # Playwright E2E specs
```
