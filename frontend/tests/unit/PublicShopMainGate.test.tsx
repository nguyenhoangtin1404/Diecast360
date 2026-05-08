// @vitest-environment jsdom

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PublicShopMainGate } from '../../src/components/public/PublicShopMainGate';
import { ROUTES, publicRouteNeedsCatalogShopContact } from '../../src/config/routes';

vi.mock('../../src/hooks/usePublicShopContext', () => ({
  usePublicShopContext: vi.fn(),
}));

vi.mock('../../src/hooks/usePublicShopContact', () => ({
  usePublicShopContact: vi.fn(),
}));

import { usePublicShopContext } from '../../src/hooks/usePublicShopContext';
import { usePublicShopContact } from '../../src/hooks/usePublicShopContact';

const usePublicShopContextMock = vi.mocked(usePublicShopContext);
const usePublicShopContactMock = vi.mocked(usePublicShopContact);

function renderAtPath(path: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="*"
            element={
              <PublicShopMainGate>
                <div>INNER</div>
              </PublicShopMainGate>
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('publicRouteNeedsCatalogShopContact', () => {
  it('returns false for preorder and my-orders paths', () => {
    expect(publicRouteNeedsCatalogShopContact(ROUTES.preorders)).toBe(false);
    expect(publicRouteNeedsCatalogShopContact(`${ROUTES.preorders}/extra`)).toBe(false);
    expect(publicRouteNeedsCatalogShopContact(ROUTES.myOrders)).toBe(false);
    expect(publicRouteNeedsCatalogShopContact(`${ROUTES.myOrders}/x`)).toBe(false);
  });

  it('returns true for catalog, contact, and item detail', () => {
    expect(publicRouteNeedsCatalogShopContact(ROUTES.home)).toBe(true);
    expect(publicRouteNeedsCatalogShopContact(ROUTES.contact)).toBe(true);
    expect(publicRouteNeedsCatalogShopContact('/items/abc')).toBe(true);
  });

  it('returns true for unrelated public paths (only exact preorder/my-orders bases are excluded)', () => {
    expect(publicRouteNeedsCatalogShopContact('/preorders-legacy')).toBe(true);
    expect(publicRouteNeedsCatalogShopContact('/preordersfoo')).toBe(true);
    expect(publicRouteNeedsCatalogShopContact('/my-orders-archive')).toBe(true);
    expect(publicRouteNeedsCatalogShopContact('/contact/support')).toBe(true);
    expect(publicRouteNeedsCatalogShopContact('/unknown-public')).toBe(true);
  });
});

describe('PublicShopMainGate', () => {
  beforeEach(() => {
    usePublicShopContextMock.mockReset();
    usePublicShopContactMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders children without contact gate on preorder route', () => {
    usePublicShopContextMock.mockReturnValue({
      effectiveShopId: '',
      queryShopId: '',
      envShopId: '',
      authLoading: false,
      shopContextReady: true,
      publicApiShopReady: false,
    });
    usePublicShopContactMock.mockReturnValue({
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePublicShopContact>);

    renderAtPath(ROUTES.preorders);
    expect(screen.getByText('INNER')).toBeTruthy();
  });

  it('renders children without contact gate on my-orders route even when contact query is pending', () => {
    usePublicShopContextMock.mockReturnValue({
      effectiveShopId: 'shop-x',
      queryShopId: '',
      envShopId: '',
      authLoading: false,
      shopContextReady: true,
      publicApiShopReady: true,
    });
    usePublicShopContactMock.mockReturnValue({
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePublicShopContact>);

    renderAtPath(ROUTES.myOrders);
    expect(screen.getByText('INNER')).toBeTruthy();
    expect(screen.queryByText('Đang tải cửa hàng…')).toBeNull();
  });

  it('shows initial spinner while shop context is not ready', () => {
    usePublicShopContextMock.mockReturnValue({
      effectiveShopId: '',
      queryShopId: '',
      envShopId: '',
      authLoading: true,
      shopContextReady: false,
      publicApiShopReady: false,
    });
    usePublicShopContactMock.mockReturnValue({
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePublicShopContact>);

    renderAtPath(ROUTES.home);
    expect(screen.getByText('Đang tải…')).toBeTruthy();
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText('INNER')).toBeNull();
  });

  it('shows missing shop when catalog route has no public shop scope', () => {
    usePublicShopContextMock.mockReturnValue({
      effectiveShopId: '',
      queryShopId: '',
      envShopId: '',
      authLoading: false,
      shopContextReady: true,
      publicApiShopReady: false,
    });
    usePublicShopContactMock.mockReturnValue({
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePublicShopContact>);

    renderAtPath(ROUTES.home);
    expect(screen.getByText('Chưa chọn cửa hàng')).toBeTruthy();
    expect(screen.queryByText('INNER')).toBeNull();
  });

  it('shows spinner while shop contact is pending', () => {
    usePublicShopContextMock.mockReturnValue({
      effectiveShopId: 'shop-a',
      queryShopId: 'shop-a',
      envShopId: '',
      authLoading: false,
      shopContextReady: true,
      publicApiShopReady: true,
    });
    usePublicShopContactMock.mockReturnValue({
      isPending: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePublicShopContact>);

    renderAtPath(ROUTES.home);
    expect(screen.getByText('Đang tải cửa hàng…')).toBeTruthy();
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText('INNER')).toBeNull();
  });

  it('renders children when contact query has settled', () => {
    usePublicShopContextMock.mockReturnValue({
      effectiveShopId: 'shop-a',
      queryShopId: 'shop-a',
      envShopId: '',
      authLoading: false,
      shopContextReady: true,
      publicApiShopReady: true,
    });
    usePublicShopContactMock.mockReturnValue({
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePublicShopContact>);

    renderAtPath(ROUTES.contact);
    expect(screen.getByText('INNER')).toBeTruthy();
  });

  it('renders children on item detail path when contact query settled', () => {
    usePublicShopContextMock.mockReturnValue({
      effectiveShopId: 'slug-1',
      queryShopId: 'slug-1',
      envShopId: '',
      authLoading: false,
      shopContextReady: true,
      publicApiShopReady: true,
    });
    usePublicShopContactMock.mockReturnValue({
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePublicShopContact>);

    renderAtPath('/items/uuid-123');
    expect(screen.getByText('INNER')).toBeTruthy();
  });

  it('shows retry when contact query failed', () => {
    const refetch = vi.fn();
    usePublicShopContextMock.mockReturnValue({
      effectiveShopId: 'shop-a',
      queryShopId: 'shop-a',
      envShopId: '',
      authLoading: false,
      shopContextReady: true,
      publicApiShopReady: true,
    });
    usePublicShopContactMock.mockReturnValue({
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof usePublicShopContact>);

    renderAtPath(ROUTES.home);
    expect(screen.getByText('Không tải được cấu hình cửa hàng')).toBeTruthy();
    screen.getByRole('button', { name: 'Thử lại' }).click();
    expect(refetch).toHaveBeenCalled();
  });
});
