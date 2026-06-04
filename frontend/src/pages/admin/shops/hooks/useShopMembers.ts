import React, { useCallback, useState } from 'react';
import { apiClient } from '../../../../api/client';
import type { Shop, ShopMemberRow } from '../types';
import {
  analyzePasswordStrength,
  isPasswordStrongEnough,
  PASSWORD_POLICY_MESSAGE,
  passwordStrengthLabelColor,
  passwordStrengthMeterFill,
} from './usePasswordStrength';

function shopMembersFromApiResponse(
  res: unknown,
): {
  members: ShopMemberRow[];
  pagination: { page: number; page_size: number; total: number; total_pages: number };
} {
  if (!res || typeof res !== 'object') {
    return { members: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 1 } };
  }
  const r = res as {
    data?: {
      members?: ShopMemberRow[];
      pagination?: { page?: number; page_size?: number; total?: number; total_pages?: number };
    };
    members?: ShopMemberRow[];
    pagination?: { page?: number; page_size?: number; total?: number; total_pages?: number };
  };
  const members = r.data?.members ?? r.members ?? [];
  const p = r.data?.pagination ?? r.pagination ?? {};
  return {
    members: Array.isArray(members) ? members : [],
    pagination: {
      page: p.page ?? 1,
      page_size: p.page_size ?? 20,
      total: p.total ?? 0,
      total_pages: p.total_pages ?? 1,
    },
  };
}

export function useShopMembers(
  onActionSuccess: (msg: string) => void,
  fetchShops: () => Promise<void>,
) {
  const [membersListShopId, setMembersListShopId] = useState<string | null>(null);
  const [membersListShopName, setMembersListShopName] = useState('');
  const [membersList, setMembersList] = useState<ShopMemberRow[]>([]);
  const [membersListLoading, setMembersListLoading] = useState(false);
  const [membersListError, setMembersListError] = useState<string | null>(null);
  const [membersPage, setMembersPage] = useState(1);
  const [membersPageSize, setMembersPageSize] = useState<10 | 20 | 50 | 100>(20);
  const [membersTotal, setMembersTotal] = useState(0);
  const [membersTotalPages, setMembersTotalPages] = useState(1);
  const [membersResetTarget, setMembersResetTarget] = useState<{
    userId: string;
    email: string;
    fullName: string | null;
  } | null>(null);
  const [memberResetNewPassword, setMemberResetNewPassword] = useState('');
  const [memberResetPasswordFieldError, setMemberResetPasswordFieldError] = useState<
    string | null
  >(null);
  const [memberResetSubmitError, setMemberResetSubmitError] = useState<string | null>(null);
  const [memberResetSaving, setMemberResetSaving] = useState(false);
  const [memberAccountActionUserId, setMemberAccountActionUserId] = useState<string | null>(null);

  const closeMemberResetModal = useCallback(() => {
    setMembersResetTarget(null);
    setMemberResetNewPassword('');
    setMemberResetPasswordFieldError(null);
    setMemberResetSubmitError(null);
  }, []);

  const loadMembersList = useCallback(
    async (shopId: string, page: number, pageSize: 10 | 20 | 50 | 100) => {
      setMembersListLoading(true);
      setMembersListError(null);
      try {
        const res = await apiClient.get(`/admin/shops/${shopId}/members`, {
          params: { page, page_size: pageSize },
        });
        const parsed = shopMembersFromApiResponse(res);
        setMembersList(parsed.members);
        setMembersPage(parsed.pagination.page);
        setMembersPageSize(parsed.pagination.page_size as 10 | 20 | 50 | 100);
        setMembersTotal(parsed.pagination.total);
        setMembersTotalPages(parsed.pagination.total_pages || 1);
      } catch (err: unknown) {
        const msg =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: string }).message ?? '')
            : '';
        setMembersListError(msg ? msg : 'Không tải được danh sách thành viên.');
      } finally {
        setMembersListLoading(false);
      }
    },
    [],
  );

  const openMembersListModal = useCallback(async (s: Shop) => {
    setMembersListShopId(s.id);
    setMembersListShopName(s.name);
    setMembersListError(null);
    setMembersList([]);
    setMembersPage(1);
    setMembersPageSize(20);
    setMembersTotal(0);
    setMembersTotalPages(1);
    setMembersResetTarget(null);
    setMemberResetNewPassword('');
    setMemberResetPasswordFieldError(null);
    setMemberResetSubmitError(null);
    await loadMembersList(s.id, 1, 20);
  }, [loadMembersList]);

  const closeMembersListModal = useCallback(() => {
    setMembersListShopId(null);
    setMembersListError(null);
    setMembersList([]);
    setMembersPage(1);
    setMembersPageSize(20);
    setMembersTotal(0);
    setMembersTotalPages(1);
    setMembersResetTarget(null);
    setMemberResetNewPassword('');
    setMemberResetPasswordFieldError(null);
    setMemberResetSubmitError(null);
    setMemberAccountActionUserId(null);
  }, []);

  const refreshMembersList = useCallback(async (shopId: string, page: number, pageSize: 10 | 20 | 50 | 100) => {
    try {
      await loadMembersList(shopId, page, pageSize);
    } catch {
      /* keep existing list */
    }
  }, [loadMembersList]);

  const handleMemberAccountActive = useCallback(async (row: ShopMemberRow, is_active: boolean) => {
    if (!membersListShopId) return;
    if (is_active) {
      if (!confirm(`Mở khóa tài khoản ${row.user.email}? Họ có thể đăng nhập lại.`)) {
        return;
      }
    } else {
      if (
        !confirm(
          `Khóa tài khoản ${row.user.email}? Họ sẽ không đăng nhập được cho đến khi mở khóa.`,
        )
      ) {
        return;
      }
    }
    setMemberAccountActionUserId(row.user_id);
    try {
      await apiClient.patch(
        `/admin/shops/${membersListShopId}/members/${row.user_id}/active`,
        { is_active },
      );
      onActionSuccess(is_active ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
      await refreshMembersList(membersListShopId, membersPage, membersPageSize);
      await fetchShops();
    } catch {
      alert(is_active ? 'Mở khóa tài khoản thất bại.' : 'Khóa tài khoản thất bại.');
    } finally {
      setMemberAccountActionUserId(null);
    }
  }, [membersListShopId, membersPage, membersPageSize, onActionSuccess, refreshMembersList, fetchShops]);

  const openMemberResetPassword = useCallback((row: ShopMemberRow) => {
    setMemberResetNewPassword('');
    setMemberResetPasswordFieldError(null);
    setMemberResetSubmitError(null);
    setMembersResetTarget({
      userId: row.user_id,
      email: row.user.email,
      fullName: row.user.full_name,
    });
  }, []);

  const handleMemberResetSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!membersListShopId || !membersResetTarget) return;
    const pwd = memberResetNewPassword.trim();
    if (!pwd) {
      setMemberResetPasswordFieldError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (!isPasswordStrongEnough(pwd)) {
      setMemberResetPasswordFieldError(PASSWORD_POLICY_MESSAGE);
      return;
    }
    setMemberResetPasswordFieldError(null);
    setMemberResetSubmitError(null);
    setMemberResetSaving(true);
    try {
      await apiClient.post(
        `/admin/shops/${membersListShopId}/members/${membersResetTarget.userId}/reset-password`,
        { password: pwd },
      );
      closeMemberResetModal();
      onActionSuccess('Đã đặt lại mật khẩu thành viên.');
    } catch (err: unknown) {
      const maybe = err as {
        message?: string;
        response?: { data?: { message?: string } };
        data?: { message?: string };
      };
      setMemberResetSubmitError(
        maybe.response?.data?.message ||
          maybe.data?.message ||
          maybe.message ||
          'Đặt lại mật khẩu thất bại.',
      );
    } finally {
      setMemberResetSaving(false);
    }
  }, [membersListShopId, membersResetTarget, memberResetNewPassword, closeMemberResetModal, onActionSuccess]);

  const handleMembersPageSizeChange = useCallback(async (nextSize: 10 | 20 | 50 | 100) => {
    setMembersPageSize(nextSize);
    if (!membersListShopId) return;
    await loadMembersList(membersListShopId, 1, nextSize);
  }, [membersListShopId, loadMembersList]);

  const handleMembersPrevPage = useCallback(async () => {
    if (!membersListShopId || membersPage <= 1) return;
    await loadMembersList(membersListShopId, membersPage - 1, membersPageSize);
  }, [membersListShopId, membersPage, membersPageSize, loadMembersList]);

  const handleMembersNextPage = useCallback(async () => {
    if (!membersListShopId || membersPage >= membersTotalPages) return;
    await loadMembersList(membersListShopId, membersPage + 1, membersPageSize);
  }, [membersListShopId, membersPage, membersTotalPages, membersPageSize, loadMembersList]);

  const resetModalProps = {
    open: Boolean(membersResetTarget),
    fullName: membersResetTarget?.fullName ?? null,
    email: membersResetTarget?.email ?? '',
    password: memberResetNewPassword,
    passwordError: memberResetPasswordFieldError,
    submitError: memberResetSubmitError,
    saving: memberResetSaving,
    onClose: closeMemberResetModal,
    onSubmit: handleMemberResetSubmit,
    onPasswordChange: (v: string) => {
      setMemberResetNewPassword(v);
      if (memberResetPasswordFieldError) setMemberResetPasswordFieldError(null);
    },
    analyze: analyzePasswordStrength,
    labelColor: passwordStrengthLabelColor,
    meterFill: passwordStrengthMeterFill,
  };

  return {
    membersListShopId,
    membersListShopName,
    membersList,
    membersListLoading,
    membersListError,
    membersPage,
    membersPageSize,
    membersTotal,
    membersTotalPages,
    memberAccountActionUserId,
    setMembersPageSize,
    loadMembersList,
    openMembersListModal,
    closeMembersListModal,
    openMemberResetPassword,
    closeMemberResetModal,
    handleMemberAccountActive,
    handleMembersPageSizeChange,
    handleMembersPrevPage,
    handleMembersNextPage,
    resetModalProps,
  };
}
