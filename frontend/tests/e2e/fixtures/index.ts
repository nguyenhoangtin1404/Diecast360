import { test as base, expect, type Page, type Route } from '@playwright/test';

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

/** Builds the standard `/auth/me` success response envelope. */
export function authMePayload(user: MockUser = ADMIN_USER) {
  return apiOk({ user });
}

/** Builds the standard `/auth/login` success response envelope. */
export function authLoginPayload(user: MockUser = ADMIN_USER) {
  return apiOk({ user, token: 'test-token' });
}

// ---------------------------------------------------------------------------
// Playwright fixtures — extend base `test` with reusable page setups
// ---------------------------------------------------------------------------

type TestFixtures = {
  /** A page already wired with a mock `/auth/me` returning ADMIN_USER. */
  authenticatedPage: Page;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ json: authMePayload() }),
    );
    await use(page);
  },
});

export { expect };
