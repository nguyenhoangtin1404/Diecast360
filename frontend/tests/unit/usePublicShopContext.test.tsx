// @vitest-environment jsdom
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { usePublicShopContext } from '../../src/hooks/usePublicShopContext';

const useAuthMock = vi.fn();
const getPublicCatalogShopIdFromEnvMock = vi.fn();

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../src/api/config', () => ({
  getPublicCatalogShopIdFromEnv: () => getPublicCatalogShopIdFromEnvMock(),
}));

function wrapper(initialPath: string) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="*" element={<>{children}</>} />
        </Routes>
      </MemoryRouter>
    );
  };
}

describe('usePublicShopContext', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses shop_id from URL and sets shopContextReady and publicApiShopReady', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    getPublicCatalogShopIdFromEnvMock.mockReturnValue('');

    const { result } = renderHook(() => usePublicShopContext(), {
      wrapper: wrapper('/?shop_id=shop-a'),
    });

    expect(result.current.queryShopId).toBe('shop-a');
    expect(result.current.envShopId).toBe('');
    expect(result.current.effectiveShopId).toBe('shop-a');
    expect(result.current.shopContextReady).toBe(true);
    expect(result.current.publicApiShopReady).toBe(true);
  });

  it('prefers URL shop_id over env default', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    getPublicCatalogShopIdFromEnvMock.mockReturnValue('from-env');

    const { result } = renderHook(() => usePublicShopContext(), {
      wrapper: wrapper('/?shop_id=url-shop'),
    });

    expect(result.current.effectiveShopId).toBe('url-shop');
    expect(result.current.publicApiShopReady).toBe(true);
  });

  it('uses env default when URL has no shop_id', () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    getPublicCatalogShopIdFromEnvMock.mockReturnValue('env-default-shop');

    const { result } = renderHook(() => usePublicShopContext(), {
      wrapper: wrapper('/'),
    });

    expect(result.current.queryShopId).toBe('');
    expect(result.current.effectiveShopId).toBe('env-default-shop');
    expect(result.current.shopContextReady).toBe(true);
    expect(result.current.publicApiShopReady).toBe(true);
  });

  it('defers shopContextReady while auth loads and no URL/env shop', async () => {
    useAuthMock.mockReturnValue({ user: null, loading: true });
    getPublicCatalogShopIdFromEnvMock.mockReturnValue('');

    const { result, rerender } = renderHook(() => usePublicShopContext(), {
      wrapper: wrapper('/'),
    });

    expect(result.current.shopContextReady).toBe(false);
    expect(result.current.publicApiShopReady).toBe(false);

    useAuthMock.mockReturnValue({
      user: { active_shop_id: 'jwt-shop' },
      loading: false,
    });
    rerender();

    await waitFor(() => {
      expect(result.current.shopContextReady).toBe(true);
    });
    expect(result.current.effectiveShopId).toBe('jwt-shop');
    expect(result.current.publicApiShopReady).toBe(true);
  });

  it('when auth settled with no shop anywhere, shopContextReady true and publicApiShopReady false', async () => {
    useAuthMock.mockReturnValue({ user: null, loading: false });
    getPublicCatalogShopIdFromEnvMock.mockReturnValue('');

    const { result } = renderHook(() => usePublicShopContext(), {
      wrapper: wrapper('/'),
    });

    expect(result.current.shopContextReady).toBe(true);
    expect(result.current.effectiveShopId).toBe('');
    expect(result.current.publicApiShopReady).toBe(false);
  });

  it('uses JWT active_shop_id when no URL or env shop after auth loads', async () => {
    useAuthMock.mockReturnValue({ user: { active_shop_id: 'jwt-only' }, loading: false });
    getPublicCatalogShopIdFromEnvMock.mockReturnValue('');

    const { result } = renderHook(() => usePublicShopContext(), {
      wrapper: wrapper('/'),
    });

    expect(result.current.effectiveShopId).toBe('jwt-only');
    expect(result.current.publicApiShopReady).toBe(true);
  });
});
