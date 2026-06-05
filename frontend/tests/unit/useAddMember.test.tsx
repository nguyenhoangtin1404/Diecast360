// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAddMember } from '../../src/pages/admin/shops/hooks/useAddMember';
import { PASSWORD_POLICY_MESSAGE } from '../../src/pages/admin/shops/hooks/usePasswordStrength';

const h = vi.hoisted(() => ({
  apiPost: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));

vi.mock('../../src/api/client', () => ({
  apiClient: {
    post: (...args: unknown[]) => h.apiPost(...args),
  },
}));

describe('useAddMember', () => {
  const onSuccess = vi.fn();
  const fetchShops = vi.fn(async () => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    h.apiPost.mockResolvedValue({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('opens modal and resets form fields', () => {
    const { result } = renderHook(() => useAddMember(onSuccess, fetchShops));

    act(() => {
      result.current.setMemberEmail('old@example.com');
      result.current.openMemberModal('shop-99');
    });

    expect(result.current.memberModalShopId).toBe('shop-99');
    expect(result.current.memberEmail).toBe('');
    expect(result.current.memberRole).toBe('shop_admin');
  });

  it('requires email before submit', async () => {
    const { result } = renderHook(() => useAddMember(onSuccess, fetchShops));

    act(() => {
      result.current.openMemberModal('shop-1');
    });

    await act(async () => {
      await result.current.handleAddShopAdmin('shop-1');
    });

    expect(result.current.memberEmailError).toBe(
      'Vui lòng nhập email để thêm quản trị shop.',
    );
    expect(h.apiPost).not.toHaveBeenCalled();
  });

  it('rejects invalid email format', async () => {
    const { result } = renderHook(() => useAddMember(onSuccess, fetchShops));

    act(() => {
      result.current.openMemberModal('shop-1');
      result.current.setMemberEmail('not-an-email');
    });

    await act(async () => {
      await result.current.handleAddShopAdmin('shop-1');
    });

    expect(result.current.memberEmailError).toBe(
      'Email không đúng định dạng (vd: ten@example.com).',
    );
    expect(h.apiPost).not.toHaveBeenCalled();
  });

  it('rejects weak optional password', async () => {
    const { result } = renderHook(() => useAddMember(onSuccess, fetchShops));

    act(() => {
      result.current.openMemberModal('shop-1');
      result.current.setMemberEmail('new@example.com');
      result.current.setMemberPassword('weak');
    });

    await act(async () => {
      await result.current.handleAddShopAdmin('shop-1');
    });

    expect(result.current.memberPasswordError).toBe(PASSWORD_POLICY_MESSAGE);
    expect(h.apiPost).not.toHaveBeenCalled();
  });

  it('posts member with role and optional fields on success', async () => {
    const { result } = renderHook(() => useAddMember(onSuccess, fetchShops));

    act(() => {
      result.current.openMemberModal('shop-1');
      result.current.setMemberEmail('staff@example.com');
      result.current.setMemberFullName('Staff User');
      result.current.setMemberPassword('Abcd1234!');
      result.current.setMemberRole('shop_staff');
    });

    await act(async () => {
      await result.current.handleAddShopAdmin('shop-1');
    });

    expect(h.apiPost).toHaveBeenCalledWith('/admin/shops/shop-1/members', {
      email: 'staff@example.com',
      role: 'shop_staff',
      password: 'Abcd1234!',
      full_name: 'Staff User',
    });
    expect(onSuccess).toHaveBeenCalledWith(
      'Đã thêm thành viên (Nhân viên shop) thành công.',
    );
    expect(result.current.memberModalShopId).toBeNull();
    expect(fetchShops).toHaveBeenCalled();
  });

  it('omits password and full_name when empty', async () => {
    const { result } = renderHook(() => useAddMember(onSuccess, fetchShops));

    act(() => {
      result.current.openMemberModal('shop-1');
      result.current.setMemberEmail('admin@example.com');
    });

    await act(async () => {
      await result.current.handleAddShopAdmin('shop-1');
    });

    expect(h.apiPost).toHaveBeenCalledWith('/admin/shops/shop-1/members', {
      email: 'admin@example.com',
      role: 'shop_admin',
    });
  });
});
