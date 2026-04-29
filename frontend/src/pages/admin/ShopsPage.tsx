import React, { useEffect, useState, useCallback, useRef } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { useIsSuperAdmin } from '../../hooks/useIsSuperAdmin';
import { styles } from './ShopsPage.styles';
import { useShopItems } from './shops/useShopItems';
import { useAuditLogs } from './shops/useAuditLogs';
import type { Shop, ShopAuditLogRow, ShopMemberRow } from './shops/types';
import ShopCard from './shops/ShopCard';
import ShopItemsModal from './shops/modals/ShopItemsModal';
import ShopAuditModal from './shops/modals/ShopAuditModal';
import MembersListModal from './shops/modals/MembersListModal';
import AddMemberModal from './shops/modals/AddMemberModal';

function shopRoleLabel(role: string): string {
  switch (role) {
    case 'shop_admin':
      return 'Quản trị shop';
    case 'shop_staff':
      return 'Nhân viên shop';
    case 'super_admin':
      return 'Super admin';
    default:
      return role;
  }
}

function shopAuditActionLabel(action: ShopAuditLogRow['action']): string {
  switch (action) {
    case 'add_shop_admin':
      return 'Thêm quản trị shop';
    case 'reset_member_password':
      return 'Reset mật khẩu';
    case 'set_member_active':
      return 'Khóa/Mở khóa tài khoản';
    case 'update_shop':
      return 'Cập nhật shop';
    case 'deactivate_shop':
      return 'Tắt shop';
    case 'activate_shop':
      return 'Mở lại shop';
    case 'set_platform_role':
      return 'Gán quyền platform';
    case 'set_shop_member_role':
      return 'Phân quyền thành viên shop';
    default:
      return action;
  }
}

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


interface CreateShopDto {
  name: string;
  slug?: string;
}

/** Basic email shape: local@domain.tld (covers typical addresses; server remains source of truth). */
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_FORMAT.test(email);
}

const PASSWORD_MIN_LENGTH = 8;

type PasswordStrengthInfo = {
  label: string;
  labelKey: 'empty' | 'weak' | 'fair' | 'strong';
  meterLevel: 0 | 1 | 2 | 3;
  /** true when password is empty (optional field) or satisfies full strong policy */
  meetsPolicy: boolean;
};

function analyzePasswordStrength(password: string): PasswordStrengthInfo {
  if (!password) {
    return { label: '—', labelKey: 'empty', meterLevel: 0, meetsPolicy: true };
  }
  const lenOk = password.length >= PASSWORD_MIN_LENGTH;
  const lower = /[a-z]/.test(password);
  const upper = /[A-Z]/.test(password);
  const digit = /\d/.test(password);
  const special = /[^A-Za-z0-9]/.test(password);
  const score = [lenOk, lower, upper, digit, special].filter(Boolean).length;
  const meetsPolicy = lenOk && lower && upper && digit && special;

  if (meetsPolicy) {
    return { label: 'Mạnh', labelKey: 'strong', meterLevel: 3, meetsPolicy: true };
  }
  if (score <= 2) {
    return { label: 'Yếu', labelKey: 'weak', meterLevel: 1, meetsPolicy: false };
  }
  return { label: 'Trung bình', labelKey: 'fair', meterLevel: 2, meetsPolicy: false };
}

function isPasswordStrongEnough(password: string): boolean {
  if (!password) return true;
  return analyzePasswordStrength(password).meetsPolicy;
}

const PASSWORD_POLICY_MESSAGE =
  `Mật khẩu phải ít nhất ${PASSWORD_MIN_LENGTH} ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.`;

function passwordStrengthLabelColor(labelKey: PasswordStrengthInfo['labelKey']): string {
  switch (labelKey) {
    case 'empty':
      return '#6b7280';
    case 'weak':
      return '#dc2626';
    case 'fair':
      return '#ca8a04';
    case 'strong':
      return '#16a34a';
  }
}

function passwordStrengthMeterFill(labelKey: PasswordStrengthInfo['labelKey']): string {
  switch (labelKey) {
    case 'weak':
      return '#fca5a5';
    case 'fair':
      return '#facc15';
    case 'strong':
      return '#22c55e';
    default:
      return '#e5e7eb';
  }
}

const ShopsPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = useIsSuperAdmin();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateShopDto>({ name: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberModalShopId, setMemberModalShopId] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberFullName, setMemberFullName] = useState('');
  const [memberAddingForShopId, setMemberAddingForShopId] = useState<string | null>(null);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);
  const [memberEmailError, setMemberEmailError] = useState<string | null>(null);
  const [memberPasswordError, setMemberPasswordError] = useState<string | null>(null);
  const [memberRole, setMemberRole] = useState<'shop_admin' | 'shop_staff'>('shop_admin');
  const memberEmailInputRef = useRef<HTMLInputElement | null>(null);
  const memberPasswordInputRef = useRef<HTMLInputElement | null>(null);

  const focusMemberEmailInput = () => {
    requestAnimationFrame(() => memberEmailInputRef.current?.focus());
  };

  const focusMemberPasswordInput = () => {
    requestAnimationFrame(() => memberPasswordInputRef.current?.focus());
  };

  const openMemberModal = (shopId: string) => {
    setMemberError(null);
    setMemberSuccess(null);
    setMemberEmail('');
    setMemberPassword('');
    setMemberFullName('');
    setMemberRole('shop_admin');
    setMemberEmailError(null);
    setMemberPasswordError(null);
    setMemberModalShopId(shopId);
  };

  const closeMemberModal = () => {
    setMemberModalShopId(null);
    setMemberEmailError(null);
    setMemberPasswordError(null);
  };

  const [shopActionError, setShopActionError] = useState<string | null>(null);
  const [shopActionSuccess, setShopActionSuccess] = useState<string | null>(null);
  const [shopActionLoadingId, setShopActionLoadingId] = useState<string | null>(null);

  const [editShopModalId, setEditShopModalId] = useState<string | null>(null);
  const [editShopName, setEditShopName] = useState('');
  const [editShopSaving, setEditShopSaving] = useState(false);
  const [editShopError, setEditShopError] = useState<string | null>(null);

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
  const [memberResetSubmitError, setMemberResetSubmitError] = useState<string | null>(
    null,
  );
  const [memberResetSaving, setMemberResetSaving] = useState(false);
  const [memberAccountActionUserId, setMemberAccountActionUserId] = useState<
    string | null
  >(null);

  const {
    itemsListShopId,
    itemsListShopName,
    shopItems,
    shopItemsLoading,
    shopItemsError,
    itemsDraftQuery,
    itemsPage,
    itemsPageSize,
    itemsTotal,
    itemsTotalPages,
    setItemsDraftQuery,
    openShopItemsModal,
    closeShopItemsModal,
    handleShopItemsSearchSubmit,
    handleShopItemsPageSizeChange,
    handleShopItemsChangePage,
  } = useShopItems();

  const {
    auditModalShopId,
    auditModalShopName,
    auditLogs,
    auditLoading,
    auditError,
    auditActionFilter,
    auditPage,
    auditPageSize,
    auditTotalPages,
    setAuditActionFilter,
    setAuditPageSize,
    loadAuditLogs,
    openAuditModal,
    closeAuditModal,
  } = useAuditLogs();

  const closeMemberResetModal = () => {
    setMembersResetTarget(null);
    setMemberResetNewPassword('');
    setMemberResetPasswordFieldError(null);
    setMemberResetSubmitError(null);
  };

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

  const openMembersListModal = async (s: Shop) => {
    setMembersListShopId(s.id);
    setMembersListShopName(s.name);
    setMembersListError(null);
    setMembersList([]);
    setMembersPage(1);
    setMembersPageSize(20);
    setMembersTotal(0);
    setMembersTotalPages(1);
    closeMemberResetModal();
    await loadMembersList(s.id, 1, 20);
  };


  const closeMembersListModal = () => {
    setMembersListShopId(null);
    setMembersListError(null);
    setMembersList([]);
    setMembersPage(1);
    setMembersPageSize(20);
    setMembersTotal(0);
    setMembersTotalPages(1);
    closeMemberResetModal();
    setMemberAccountActionUserId(null);
  };

  const refreshMembersList = async () => {
    if (!membersListShopId) return;
    try {
      await loadMembersList(membersListShopId, membersPage, membersPageSize);
    } catch {
      /* keep existing list */
    }
  };

  const handleMemberAccountActive = async (row: ShopMemberRow, is_active: boolean) => {
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
      setShopActionError(null);
      setShopActionSuccess(
        is_active ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.',
      );
      await refreshMembersList();
      await fetchShops();
    } catch {
      alert(is_active ? 'Mở khóa tài khoản thất bại.' : 'Khóa tài khoản thất bại.');
    } finally {
      setMemberAccountActionUserId(null);
    }
  };

  const openMemberResetPassword = (row: ShopMemberRow) => {
    setMemberResetNewPassword('');
    setMemberResetPasswordFieldError(null);
    setMemberResetSubmitError(null);
    setMembersResetTarget({
      userId: row.user_id,
      email: row.user.email,
      fullName: row.user.full_name,
    });
  };

  const handleMemberResetSubmit = async (e: React.FormEvent) => {
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
      setShopActionError(null);
      setShopActionSuccess('Đã đặt lại mật khẩu thành viên.');
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
  };

  const fetchShops = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/shops');
      setShops(res?.data || res || []);
    } catch {
      setError('Không thể tải danh sách shop.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleAddShopAdmin = async (shopId: string) => {
    setMemberError(null);
    setMemberSuccess(null);

    const email = memberEmail.trim();
    if (!email) {
      setMemberEmailError('Vui lòng nhập email để thêm quản trị shop.');
      focusMemberEmailInput();
      return;
    }
    if (!isValidEmail(email)) {
      setMemberEmailError('Email không đúng định dạng (vd: ten@example.com).');
      focusMemberEmailInput();
      return;
    }

    setMemberEmailError(null);

    const passwordTrim = memberPassword.trim();
    if (passwordTrim && !isPasswordStrongEnough(passwordTrim)) {
      setMemberPasswordError(PASSWORD_POLICY_MESSAGE);
      focusMemberPasswordInput();
      return;
    }
    setMemberPasswordError(null);
    setMemberAddingForShopId(shopId);

    try {
      const password = passwordTrim;
      const full_name = memberFullName.trim();

      const payload = {
        email,
        role: memberRole,
        ...(password ? { password } : {}),
        ...(full_name ? { full_name } : {}),
      };

      await apiClient.post(`/admin/shops/${shopId}/members`, payload);

      const roleSuccessLabel = memberRole === 'shop_staff' ? 'Nhân viên shop' : 'Quản trị shop';
      setShopActionError(null);
      setShopActionSuccess(`Đã thêm thành viên (${roleSuccessLabel}) thành công.`);
      setMemberModalShopId(null);
      setMemberEmailError(null);
      setMemberPasswordError(null);
      setMemberEmail('');
      setMemberPassword('');
      setMemberFullName('');
      await fetchShops();
    } catch (err: unknown) {
      const maybe = err as { message?: string; response?: { data?: { message?: string } } };
      setMemberError(
        maybe.response?.data?.message || maybe.message || 'Cấp shop_admin thất bại.',
      );
    } finally {
      setMemberAddingForShopId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post('/admin/shops', {
        name: form.name,
        ...(form.slug?.trim() ? { slug: form.slug.trim() } : {}),
      });
      setShowForm(false);
      setForm({ name: '' });
      await fetchShops();
    } catch (err: unknown) {
      // Backend errors are usually: { ok:false, error:{code}, message }
      const maybeAxiosError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      setError(
        maybeAxiosError?.response?.data?.message ||
          maybeAxiosError?.message ||
          'Tạo shop thất bại.',
      );
    } finally {
      setSaving(false);
    }
  };

  const renderMemberPasswordField = (shopId: string) => {
    const pwdStrength = analyzePasswordStrength(memberPassword);
    const strengthLabelColor =
      memberPassword.length > 0
        ? passwordStrengthLabelColor(pwdStrength.labelKey)
        : passwordStrengthLabelColor('empty');
    const meterActive = passwordStrengthMeterFill(pwdStrength.labelKey);

    return (
      <>
        <label
          style={{
            ...styles.modalLabel,
            ...(memberPasswordError ? styles.modalLabelInvalid : {}),
          }}
          htmlFor={`member-password-${shopId}`}
        >
          Mật khẩu
          {memberPassword.length > 0 && (
            <span
              id={`member-password-strength-${shopId}`}
              style={{
                marginLeft: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: strengthLabelColor,
              }}
            >
              · {pwdStrength.label} 
            </span>
          )}
        </label>
        {memberPassword.length > 0 && (
          <div style={styles.passwordStrengthMeter} aria-hidden>
            {[1, 2, 3].map((seg) => (
              <div
                key={seg}
                style={{
                  ...styles.passwordStrengthSegment,
                  background:
                    seg <= pwdStrength.meterLevel ? meterActive : '#e5e7eb',
                }}
              />
            ))}
          </div>
        )}
        {memberPasswordError && (
          <span
            id={`member-password-error-${shopId}`}
            role="alert"
            style={styles.modalFieldError}
          >
            {memberPasswordError}
          </span>
        )}
        <input
          ref={memberPasswordInputRef}
          id={`member-password-${shopId}`}
          style={{
            ...styles.modalInput,
            ...(memberPasswordError ? styles.modalInputInvalid : {}),
          }}
          value={memberPassword}
          onChange={(e) => {
            setMemberPassword(e.target.value);
            if (memberPasswordError) setMemberPasswordError(null);
            if (memberError) setMemberError(null);
          }}
          onBlur={() => {
            const t = memberPassword.trim();
            if (t === '') {
              setMemberPasswordError(null);
              return;
            }
            if (!isPasswordStrongEnough(t)) {
              setMemberPasswordError(PASSWORD_POLICY_MESSAGE);
            } else {
              setMemberPasswordError(null);
            }
          }}
          placeholder="********"
          type="password"
          autoComplete="new-password"
          aria-invalid={memberPasswordError ? true : undefined}
          aria-describedby={
            [
              memberPassword.length > 0
                ? `member-password-strength-${shopId}`
                : null,
              memberPasswordError ? `member-password-error-${shopId}` : null,
            ]
              .filter(Boolean)
              .join(' ') || undefined
          }
        />
      </>
    );
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Bạn chắc muốn tắt shop này?')) return;
    try {
      setShopActionError(null);
      setShopActionSuccess(null);
      setShopActionLoadingId(id);
      await apiClient.patch(`/admin/shops/${id}/deactivate`, {});
      await fetchShops();
    } catch {
      setShopActionError('Tắt shop thất bại.');
    } finally {
      setShopActionLoadingId(null);
    }
  };

  const handleActivate = async (id: string) => {
    if (!confirm('Bạn chắc muốn mở lại shop này?')) return;
    try {
      setShopActionError(null);
      setShopActionSuccess(null);
      setShopActionLoadingId(id);
      await apiClient.patch(`/admin/shops/${id}`, { is_active: true });
      await fetchShops();
      setShopActionSuccess('Đã mở lại shop thành công.');
    } catch {
      setShopActionError('Mở lại shop thất bại.');
    } finally {
      setShopActionLoadingId(null);
    }
  };

  const openEditShopModal = (shop: Shop) => {
    setEditShopError(null);
    setEditShopName(shop.name);
    setEditShopModalId(shop.id);
  };

  const closeEditShopModal = () => {
    setEditShopModalId(null);
    setEditShopError(null);
  };

  const handleEditShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShopModalId) return;
    const name = editShopName.trim();
    if (!name) {
      setEditShopError('Tên shop không được để trống.');
      return;
    }
    setEditShopError(null);
    setEditShopSaving(true);
    try {
      await apiClient.patch(`/admin/shops/${editShopModalId}`, { name });
      setEditShopModalId(null);
      setShopActionError(null);
      setShopActionSuccess('Đã cập nhật thông tin shop.');
      await fetchShops();
    } catch (err: unknown) {
      const maybe = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setEditShopError(
        maybe.response?.data?.message ||
          maybe.message ||
          'Cập nhật shop thất bại.',
      );
    } finally {
      setEditShopSaving(false);
    }
  };

  // Guard: non-super_admin gets a 403 from the API, but show UI message too
  if (user && !isSuperAdmin) {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Quản lý Shops</h1>
        <p style={styles.error}>Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Quản lý Shops</h1>
        <button
          id="create-shop-btn"
          style={styles.createBtn}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Hủy' : '+ Tạo shop mới'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {shopActionError && <p style={styles.error}>{shopActionError}</p>}
      {shopActionSuccess && <p style={styles.success}>{shopActionSuccess}</p>}

      {showForm && (
        <form onSubmit={handleCreate} style={styles.form}>
          <div style={styles.formRow}>
            <label style={styles.label} htmlFor="shop-name">Tên shop</label>
            <input
              id="shop-name"
              required
              style={styles.input}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ví dụ: Shop A"
            />
          </div>
          <div style={styles.formRow}>
            <label style={styles.label} htmlFor="shop-slug">Slug (tùy chọn)</label>
            <input
              id="shop-slug"
              style={styles.input}
              value={form.slug ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="Để trống để tự tạo từ tên shop"
              pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
            />
          </div>
          <button id="submit-shop-form" type="submit" style={styles.createBtn} disabled={saving}>
            {saving ? 'Đang tạo...' : 'Tạo shop'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : shops.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>Chưa có shop nào.</p>
      ) : (
        <div style={styles.grid}>
          {shops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              shopActionLoadingId={shopActionLoadingId}
              memberAddingForShopId={memberAddingForShopId}
              onOpenItems={openShopItemsModal}
              onOpenMembers={openMembersListModal}
              onOpenAudit={openAuditModal}
              onOpenEdit={openEditShopModal}
              onDeactivate={handleDeactivate}
              onActivate={handleActivate}
              onOpenAddMember={openMemberModal}
            />
          ))}
        </div>
      )}

      {editShopModalId && (() => {
        const editTargetShop = shops.find((s) => s.id === editShopModalId);
        if (!editTargetShop) return null;
        return (
          <div style={styles.modalOverlay} onClick={closeEditShopModal}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalTitle}>Sửa thông tin shop</div>
              {editShopError && <p style={styles.modalError}>{editShopError}</p>}
              <form onSubmit={handleEditShopSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={styles.formRow}>
                  <label style={styles.modalLabel} htmlFor={`edit-shop-name-${editTargetShop.id}`}>
                    Tên shop
                  </label>
                  <input
                    id={`edit-shop-name-${editTargetShop.id}`}
                    style={styles.modalInput}
                    value={editShopName}
                    onChange={(e) => {
                      setEditShopName(e.target.value);
                      if (editShopError) setEditShopError(null);
                    }}
                    required
                    autoComplete="off"
                    placeholder="Tên hiển thị của shop"
                  />
                </div>
                <p style={styles.modalHint}>
                  Shop URL <code style={styles.modalCode}>{editTargetShop.slug}</code> — slug không sửa trên form này.
                </p>
                <div style={styles.modalActions}>
                  <button type="button" style={styles.modalCancelBtn} onClick={closeEditShopModal} disabled={editShopSaving}>
                    Hủy
                  </button>
                  <button type="submit" style={styles.modalConfirmBtn} disabled={editShopSaving}>
                    {editShopSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      <AddMemberModal
        open={Boolean(memberModalShopId)}
        shopId={memberModalShopId ?? 'unknown'}
        memberError={memberError}
        memberSuccess={memberSuccess}
        memberFullName={memberFullName}
        memberEmail={memberEmail}
        memberEmailError={memberEmailError}
        memberRole={memberRole}
        adding={Boolean(memberModalShopId && memberAddingForShopId === memberModalShopId)}
        memberEmailInputRef={memberEmailInputRef}
        onClose={closeMemberModal}
        onFullNameChange={setMemberFullName}
        onEmailChange={(v) => {
          setMemberEmail(v);
          if (memberEmailError) setMemberEmailError(null);
          if (memberError) setMemberError(null);
        }}
        onEmailBlur={() => {
          const t = memberEmail.trim();
          if (t === '') {
            setMemberEmailError(null);
            return;
          }
          if (!isValidEmail(t)) {
            setMemberEmailError('Email không đúng định dạng (vd: ten@example.com).');
          } else {
            setMemberEmailError(null);
          }
        }}
        onRoleChange={setMemberRole}
        onSubmit={() => {
          if (!memberModalShopId) return;
          void handleAddShopAdmin(memberModalShopId);
        }}
        passwordField={renderMemberPasswordField(memberModalShopId ?? 'unknown')}
      />

      <ShopItemsModal
        open={Boolean(itemsListShopId)}
        shopName={itemsListShopName}
        draftQuery={itemsDraftQuery}
        pageSize={itemsPageSize}
        loading={shopItemsLoading}
        error={shopItemsError}
        items={shopItems}
        total={itemsTotal}
        page={itemsPage}
        totalPages={itemsTotalPages}
        onClose={closeShopItemsModal}
        onDraftQueryChange={setItemsDraftQuery}
        onSubmitSearch={handleShopItemsSearchSubmit}
        onChangePageSize={handleShopItemsPageSizeChange}
        onChangePage={handleShopItemsChangePage}
      />

      <ShopAuditModal
        open={Boolean(auditModalShopId)}
        shopId={auditModalShopId}
        shopName={auditModalShopName}
        logs={auditLogs}
        loading={auditLoading}
        error={auditError}
        actionFilter={auditActionFilter}
        page={auditPage}
        pageSize={auditPageSize}
        totalPages={auditTotalPages}
        onClose={closeAuditModal}
        onActionFilterChange={async (value) => {
          setAuditActionFilter(value);
          if (!auditModalShopId) return;
          await loadAuditLogs(auditModalShopId, 1, auditPageSize, value);
        }}
        onPageSizeChange={async (nextSize) => {
          setAuditPageSize(nextSize);
          if (!auditModalShopId) return;
          await loadAuditLogs(auditModalShopId, 1, nextSize, auditActionFilter);
        }}
        onPrevPage={async () => {
          if (!auditModalShopId || auditPage <= 1) return;
          await loadAuditLogs(auditModalShopId, auditPage - 1, auditPageSize, auditActionFilter);
        }}
        onNextPage={async () => {
          if (!auditModalShopId || auditPage >= auditTotalPages) return;
          await loadAuditLogs(auditModalShopId, auditPage + 1, auditPageSize, auditActionFilter);
        }}
        actionLabel={shopAuditActionLabel}
      />

      <MembersListModal
        open={Boolean(membersListShopId)}
        shopName={membersListShopName}
        members={membersList}
        loading={membersListLoading}
        error={membersListError}
        page={membersPage}
        pageSize={membersPageSize}
        total={membersTotal}
        totalPages={membersTotalPages}
        memberAccountActionUserId={memberAccountActionUserId}
        onClose={closeMembersListModal}
        onPageSizeChange={async (nextSize) => {
          setMembersPageSize(nextSize);
          if (!membersListShopId) return;
          await loadMembersList(membersListShopId, 1, nextSize);
        }}
        onPrevPage={async () => {
          if (!membersListShopId || membersPage <= 1) return;
          await loadMembersList(membersListShopId, membersPage - 1, membersPageSize);
        }}
        onNextPage={async () => {
          if (!membersListShopId || membersPage >= membersTotalPages) return;
          await loadMembersList(membersListShopId, membersPage + 1, membersPageSize);
        }}
        onOpenResetPassword={openMemberResetPassword}
        onToggleActive={handleMemberAccountActive}
        roleLabel={shopRoleLabel}
        resetModal={{
          open: Boolean(membersResetTarget),
          fullName: membersResetTarget?.fullName ?? null,
          email: membersResetTarget?.email ?? '',
          password: memberResetNewPassword,
          passwordError: memberResetPasswordFieldError,
          submitError: memberResetSubmitError,
          saving: memberResetSaving,
          onClose: closeMemberResetModal,
          onSubmit: handleMemberResetSubmit,
          onPasswordChange: (v) => {
            setMemberResetNewPassword(v);
            if (memberResetPasswordFieldError) setMemberResetPasswordFieldError(null);
          },
          analyze: analyzePasswordStrength,
          labelColor: passwordStrengthLabelColor,
          meterFill: passwordStrengthMeterFill,
        }}
      />
    </div>
  );
};

export default ShopsPage;
