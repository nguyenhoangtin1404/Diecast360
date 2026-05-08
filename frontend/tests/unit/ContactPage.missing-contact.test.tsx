// @vitest-environment jsdom

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { PublicShopContactResponse } from '../../src/types/shopContactPublic';
import { ContactPage } from '../../src/pages/ContactPage';

vi.mock('../../src/hooks/usePublicShopContact', () => ({
  usePublicShopContact: vi.fn(),
}));

import { usePublicShopContact } from '../../src/hooks/usePublicShopContact';

const usePublicShopContactMock = vi.mocked(usePublicShopContact);

function renderContact() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ContactPage />
    </QueryClientProvider>,
  );
}

describe('ContactPage when contact payload is missing', () => {
  beforeEach(() => {
    usePublicShopContactMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('shows fallback panel and refetch when data has no contact object', () => {
    const refetch = vi.fn();
    usePublicShopContactMock.mockReturnValue({
      data: {
        shop: { id: 's1', name: 'Shop', slug: 'shop' },
        appearance: {},
      } as unknown as PublicShopContactResponse,
      refetch,
    } as unknown as ReturnType<typeof usePublicShopContact>);

    renderContact();
    expect(screen.getByText('Không có nội dung liên hệ')).toBeTruthy();
    expect(screen.getByText(/Phản hồi từ máy chủ không chứa phần liên hệ/)).toBeTruthy();
    screen.getByRole('button', { name: 'Thử lại' }).click();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows fallback when data is undefined (e.g. race before cache hydrates)', () => {
    const refetch = vi.fn();
    usePublicShopContactMock.mockReturnValue({
      data: undefined,
      refetch,
    } as unknown as ReturnType<typeof usePublicShopContact>);

    renderContact();
    expect(screen.getByText('Không có nội dung liên hệ')).toBeTruthy();
    screen.getByRole('button', { name: 'Thử lại' }).click();
    expect(refetch).toHaveBeenCalled();
  });
});
