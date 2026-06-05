// @vitest-environment jsdom
import type { FormEvent } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useShopMembers } from '../../src/pages/admin/shops/hooks/useShopMembers';
import type { Shop, ShopMemberRow } from '../../src/pages/admin/shops/types';
import { PASSWORD_POLICY_MESSAGE } from '../../src/pages/admin/shops/hooks/usePasswordStrength';

const h = vi.hoisted(() => ({
  apiGet: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  apiPatch: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  apiPost: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

vi.mock('../../src/api/client', () => ({
  apiClient: {
    get: (...args: unknown[]) => h.apiGet(...args),
    patch: (...args: unknown[]) => h.apiPatch(...args),
    post: (...args: unknown[]) => h.apiPost(...args),
  },
}));

const shop: Shop = {
  id: 'shop-1',
  name: 'Shop A',
  slug: 'shop-a',
  is_active: true,
};

const memberRow: ShopMemberRow = {
  user_id: 'user-1',
  shop_id: 'shop-1',
  role: 'shop_admin',
  user: {
    id: 'user-1',
    email: 'admin@example.com',
    full_name: 'Admin',
    role: 'shop_admin',
    is_active: true,
  },
};

describe('useShopMembers', () => {
  const onActionSuccess = vi.fn();
  const fetchShops = vi.fn(async () => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn(() => true));
    h.apiGet.mockResolvedValue({
      data: {
        members: [memberRow],
        pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 },
      },
    });
    h.apiPatch.mockResolvedValue({});
    h.apiPost.mockResolvedValue({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads members when opening the list modal', async () => {
    const { result } = renderHook(() => useShopMembers(onActionSuccess, fetchShops));

    await act(async () => {
      await result.current.openMembersListModal(shop);
    });

    await waitFor(() => {
      expect(result.current.membersListLoading).toBe(false);
    });

    expect(h.apiGet).toHaveBeenCalledWith('/admin/shops/shop-1/members', {
      params: { page: 1, page_size: 20 },
    });
    expect(result.current.membersListShopId).toBe('shop-1');
    expect(result.current.membersList).toHaveLength(1);
    expect(result.current.membersList[0].user.email).toBe('admin@example.com');
  });

  it('fetches next page when handleMembersNextPage is called', async () => {
    h.apiGet
      .mockResolvedValueOnce({
        data: {
          members: [memberRow],
          pagination: { page: 1, page_size: 20, total: 40, total_pages: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          members: [memberRow],
          pagination: { page: 2, page_size: 20, total: 40, total_pages: 2 },
        },
      });

    const { result } = renderHook(() => useShopMembers(onActionSuccess, fetchShops));

    await act(async () => {
      await result.current.openMembersListModal(shop);
    });
    await waitFor(() => expect(result.current.membersPage).toBe(1));

    await act(async () => {
      await result.current.handleMembersNextPage();
    });

    expect(h.apiGet).toHaveBeenLastCalledWith('/admin/shops/shop-1/members', {
      params: { page: 2, page_size: 20 },
    });
    expect(result.current.membersPage).toBe(2);
  });

  it('patches member active state after confirm', async () => {
    const { result } = renderHook(() => useShopMembers(onActionSuccess, fetchShops));

    await act(async () => {
      await result.current.openMembersListModal(shop);
    });
    await waitFor(() => expect(result.current.membersListShopId).toBe('shop-1'));

    await act(async () => {
      await result.current.handleMemberAccountActive(memberRow, false);
    });

    expect(h.apiPatch).toHaveBeenCalledWith(
      '/admin/shops/shop-1/members/user-1/active',
      { is_active: false },
    );
    expect(onActionSuccess).toHaveBeenCalledWith('Đã khóa tài khoản.');
    expect(fetchShops).toHaveBeenCalled();
  });

  it('skips lock/unlock when confirm is cancelled', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false));

    const { result } = renderHook(() => useShopMembers(onActionSuccess, fetchShops));

    await act(async () => {
      await result.current.openMembersListModal(shop);
    });

    await act(async () => {
      await result.current.handleMemberAccountActive(memberRow, false);
    });

    expect(h.apiPatch).not.toHaveBeenCalled();
  });

  it('validates reset password before submit', async () => {
    const { result } = renderHook(() => useShopMembers(onActionSuccess, fetchShops));

    await act(async () => {
      await result.current.openMembersListModal(shop);
    });

    act(() => {
      result.current.openMemberResetPassword(memberRow);
    });

    expect(result.current.resetModalProps.open).toBe(true);

    await act(async () => {
      await result.current.resetModalProps.onSubmit({
        preventDefault: () => undefined,
      } as FormEvent);
    });

    expect(result.current.resetModalProps.passwordError).toBe('Vui lòng nhập mật khẩu mới.');
    expect(h.apiPost).not.toHaveBeenCalled();

    act(() => {
      result.current.resetModalProps.onPasswordChange('weak');
    });

    await act(async () => {
      await result.current.resetModalProps.onSubmit({
        preventDefault: () => undefined,
      } as FormEvent);
    });

    expect(result.current.resetModalProps.passwordError).toBe(PASSWORD_POLICY_MESSAGE);
    expect(h.apiPost).not.toHaveBeenCalled();
  });

  it('submits reset password when policy is met', async () => {
    const { result } = renderHook(() => useShopMembers(onActionSuccess, fetchShops));

    await act(async () => {
      await result.current.openMembersListModal(shop);
    });

    act(() => {
      result.current.openMemberResetPassword(memberRow);
      result.current.resetModalProps.onPasswordChange('Abcd1234!');
    });

    await act(async () => {
      await result.current.resetModalProps.onSubmit({
        preventDefault: () => undefined,
      } as FormEvent);
    });

    expect(h.apiPost).toHaveBeenCalledWith(
      '/admin/shops/shop-1/members/user-1/reset-password',
      { password: 'Abcd1234!' },
    );
    expect(onActionSuccess).toHaveBeenCalledWith('Đã đặt lại mật khẩu thành viên.');
    expect(result.current.resetModalProps.open).toBe(false);
  });
});
