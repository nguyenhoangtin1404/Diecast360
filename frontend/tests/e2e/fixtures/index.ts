import { test as base, expect, type Page, type Route } from '@playwright/test';

export type { Route };

// ---------------------------------------------------------------------------
// Shared mock data shapes
// ---------------------------------------------------------------------------

export type MockShop = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  role: string;
};

export type MockUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  active_shop_id: string;
  allowed_shop_ids: string[];
  allowed_shops: MockShop[];
};

// ---------------------------------------------------------------------------
// Default test user / shop — reuse across specs to keep mocks consistent
// ---------------------------------------------------------------------------

export const DEFAULT_SHOP: MockShop = {
  id: 'shop-1',
  name: 'Main Shop',
  slug: 'main-shop',
  is_active: true,
  role: 'shop_admin',
};

export const ADMIN_USER: MockUser = {
  id: 'u1',
  email: 'admin@example.com',
  full_name: 'Admin',
  role: 'shop_admin',
  active_shop_id: 'shop-1',
  allowed_shop_ids: ['shop-1'],
  allowed_shops: [DEFAULT_SHOP],
};

// ---------------------------------------------------------------------------
// Factory helpers — wrap payloads in the standard API envelope
// ---------------------------------------------------------------------------

export function apiOk<T>(data: T) {
  return { ok: true, data, message: '' };
}

export function apiError(message: string, status = 400) {
  return { status, json: { ok: false, data: null, message } };
}

/**
 * Stub `GET /api/v1/public/shops/:shopId/contact` so `PublicShopMainGate` can finish
 * (matches `usePublicShopContact` + standard `{ ok, data }` envelope).
 */
export async function routePublicShopContact(page: Page) {
  await page.route('**/api/v1/public/shops/*/contact', (route: Route) => {
    const m = route.request().url().match(/\/public\/shops\/([^/?#]+)\/contact/);
    const raw = m?.[1] ?? 'shop-a';
    const shopId = decodeURIComponent(raw);
    return route.fulfill({
      json: apiOk({
        shop: { id: shopId, name: `Shop ${shopId}`, slug: shopId },
        contact: {
          page_title: 'Liên hệ',
          page_subtitle: '',
        },
        appearance: {},
      }),
    });
  });
}

/** Builds the standard `/auth/me` success response envelope. */
export function authMePayload(user: MockUser = ADMIN_USER) {
  return apiOk({ user });
}

/**
 * Builds the standard `/auth/login` success response envelope.
 *
 * Intentionally separate from `authMePayload` so future fields specific to
 * the login response (e.g. `expires_at`, MFA status) can be added here
 * without affecting the `/auth/me` mock shape.
 */
export function authLoginPayload(user: MockUser = ADMIN_USER) {
  return apiOk({ user });
}

// ---------------------------------------------------------------------------
// Playwright fixtures — extend base `test` with reusable page setups
// ---------------------------------------------------------------------------

type TestFixtures = {
  /**
   * A page pre-wired with a mock `/auth/me` returning ADMIN_USER.
   *
   * Usage:
   *   import { test, expect } from './fixtures';
   *
   *   test('my test', async ({ authenticatedPage }) => {
   *     await authenticatedPage.goto('/admin/items');
   *     ...
   *   });
   *
   * For tests that need additional route mocks, set them up BEFORE calling
   * `goto` and AFTER receiving the `authenticatedPage` fixture (routes
   * registered later take priority — Playwright matches LIFO).
   */
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  // `use` is Playwright's fixture runner; name it to avoid tripping `react-hooks/rules-of-hooks` on `use*`.
  authenticatedPage: async ({ page }, runFixture) => {
    await stubAuthCsrf(page);
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ json: authMePayload() }),
    );
    await runFixture(page);
  },
});

/** Stub CSRF bootstrap so Vite proxy does not block admin flows in E2E. */
export async function stubAuthCsrf(page: Page) {
  await page.route('**/api/v1/auth/csrf', (route: Route) =>
    route.fulfill({ status: 200, json: { csrf_token: 'e2e-test-csrf-token' } }),
  );
}

export { expect };
