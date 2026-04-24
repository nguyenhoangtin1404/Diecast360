import { test, expect, authMePayload, authLoginPayload, apiError, type Route } from './fixtures';

const unauthResponse = { status: 401, json: { ok: false, data: null, message: 'Unauthenticated' } };

test.describe('Authentication smoke', () => {
  test('login page renders form and branding', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill(unauthResponse),
    );

    await page.goto('/admin/login');

    await expect(page.getByRole('heading', { name: /Đăng nhập/i })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /Đăng nhập/i })).toBeVisible();
  });

  test('successful login redirects to admin reports', async ({ page }) => {
    // Phase 1: user is unauthenticated — render login page
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill(unauthResponse),
    );

    await page.goto('/admin/login');

    // Phase 2: add success routes AFTER navigation.
    // Playwright routes are matched LIFO, so these override the 401 handler
    // for all subsequent requests made after the login button is clicked.
    await page.route('**/api/v1/auth/login', (route: Route) =>
      route.fulfill({ json: authLoginPayload() }),
    );
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill({ json: authMePayload() }),
    );
    await page.route('**/api/v1/auth/csrf', (route: Route) =>
      route.fulfill({ status: 200, json: {} }),
    );

    await page.locator('#email').fill('admin@example.com');
    await page.locator('#password').fill('password123');
    await page.getByRole('button', { name: /Đăng nhập/i }).click();

    await expect(page).toHaveURL(/\/admin\/reports/, { timeout: 10_000 });
  });

  test('shows error message on bad credentials', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill(unauthResponse),
    );

    await page.goto('/admin/login');

    // Register login error AFTER goto — consistent with LIFO route pattern in this suite
    await page.route('**/api/v1/auth/login', (route: Route) =>
      route.fulfill(apiError('Email hoặc mật khẩu không đúng', 401)),
    );

    await page.locator('#email').fill('wrong@example.com');
    await page.locator('#password').fill('wrong');
    await page.getByRole('button', { name: /Đăng nhập/i }).click();

    await expect(page.getByText(/Email hoặc mật khẩu không đúng/i)).toBeVisible();
  });

  test('protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route: Route) =>
      route.fulfill(unauthResponse),
    );

    await page.goto('/admin/items');

    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10_000 });
  });
});
