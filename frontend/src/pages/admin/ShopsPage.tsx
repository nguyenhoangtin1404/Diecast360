import React, { useEffect, useState, useCallback, useRef } from 'react';
import { EyeOff, KeyRound, Loader2, Lock, Pencil, Unlock, UserPlus } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { styles } from './ShopsPage.styles';
import ShopMetaButton from './shops/ShopMetaButton';
import { useDebouncedValue } from './shops/useDebouncedValue';

interface Shop {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  _count?: { items: number; user_roles: number };
}

interface ShopMemberRow {
  user_id: string;
  shop_id: string;
  role: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    is_active: boolean;
  };
}

interface ShopItemRow {
  id: string;
  name: string;
  price: number | null;
  created_at: string;
  cover_image_url: string | null;
}

interface ShopAuditLogRow {
  id: string;
  action:
    | 'add_shop_admin'
    | 'reset_member_password'
    | 'set_member_active'
    | 'update_shop'
    | 'deactivate_shop'
    | 'activate_shop';
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor?: { id: string; email: string; full_name: string | null } | null;
}

function shopRoleLabel(role: string): string {
  switch (role) {
    case 'shop_admin':
      return 'Quản trị shop';
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
    default:
      return action;
  }
}

/** Unwrap standard API envelope `{ data: { members } }` or raw `{ members }`. */
function membersFromApiResponse(res: unknown): ShopMemberRow[] {
  if (!res || typeof res !== 'object') return [];
  const r = res as { data?: { members?: ShopMemberRow[] }; members?: ShopMemberRow[] };
  const list = r.data?.members ?? r.members;
  return Array.isArray(list) ? list : [];
}

function shopItemsFromApiResponse(
  res: unknown,
): { items: ShopItemRow[]; pagination: { page: number; page_size: number; total: number; total_pages: number } } {
  if (!res || typeof res !== 'object') {
    return { items: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 1 } };
  }
  const r = res as {
    data?: { items?: ShopItemRow[]; pagination?: { page?: number; page_size?: number; total?: number; total_pages?: number } };
    items?: ShopItemRow[];
    pagination?: { page?: number; page_size?: number; total?: number; total_pages?: number };
  };
  const items = r.data?.items ?? r.items ?? [];
  const p = r.data?.pagination ?? r.pagination ?? {};
  return {
    items: Array.isArray(items) ? items : [],
    pagination: {
      page: p.page ?? 1,
      page_size: p.page_size ?? 20,
      total: p.total ?? 0,
      total_pages: p.total_pages ?? 1,
    },
  };
}

function shopAuditLogsFromApiResponse(
  res: unknown,
): {
  logs: ShopAuditLogRow[];
  pagination: { page: number; page_size: number; total: number; total_pages: number };
} {
  if (!res || typeof res !== 'object') {
    return { logs: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 1 } };
  }
  const r = res as {
    data?: {
      logs?: ShopAuditLogRow[];
      pagination?: { page?: number; page_size?: number; total?: number; total_pages?: number };
    };
    logs?: ShopAuditLogRow[];
    pagination?: { page?: number; page_size?: number; total?: number; total_pages?: number };
  };
  const logs = r.data?.logs ?? r.logs ?? [];
  const p = r.data?.pagination ?? r.pagination ?? {};
  return {
    logs: Array.isArray(logs) ? logs : [],
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

  const [itemsListShopId, setItemsListShopId] = useState<string | null>(null);
  const [itemsListShopName, setItemsListShopName] = useState('');
  const [shopItems, setShopItems] = useState<ShopItemRow[]>([]);
  const [shopItemsLoading, setShopItemsLoading] = useState(false);
  const [shopItemsError, setShopItemsError] = useState<string | null>(null);
  const [itemsQuery, setItemsQuery] = useState('');
  const [itemsDraftQuery, setItemsDraftQuery] = useState('');
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPageSize, setItemsPageSize] = useState<10 | 20 | 50 | 100>(20);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsTotalPages, setItemsTotalPages] = useState(1);
  const debouncedItemsQuery = useDebouncedValue(itemsDraftQuery, 300);
  const [auditModalShopId, setAuditModalShopId] = useState<string | null>(null);
  const [auditModalShopName, setAuditModalShopName] = useState('');
  const [auditLogs, setAuditLogs] = useState<ShopAuditLogRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditActionFilter, setAuditActionFilter] = useState<string>('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState<10 | 20 | 50 | 100>(20);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  const closeMemberResetModal = () => {
    setMembersResetTarget(null);
    setMemberResetNewPassword('');
    setMemberResetPasswordFieldError(null);
    setMemberResetSubmitError(null);
  };

  const openMembersListModal = async (s: Shop) => {
    setMembersListShopId(s.id);
    setMembersListShopName(s.name);
    setMembersListError(null);
    setMembersList([]);
    closeMemberResetModal();
    setMembersListLoading(true);
     try {
      const res = await apiClient.get(`/admin/shops/${s.id}/members`, {
        params: { page_size: 100 },
      });
      setMembersList(membersFromApiResponse(res));
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message?: string }).message ?? '')
          : '';
      setMembersListError(
        msg ? msg : 'Không tải được danh sách thành viên.',
      );
    } finally {
      setMembersListLoading(false);
    }
  };

  const loadShopItems = useCallback(
    async (shopId: string, page: number, pageSize: 10 | 20 | 50 | 100, q: string) => {
      setShopItemsLoading(true);
      setShopItemsError(null);
      try {
        const res = await apiClient.get(`/admin/shops/${shopId}/items`, {
          params: {
            page,
            page_size: pageSize,
            ...(q.trim() ? { q: q.trim() } : {}),
          },
        });
        const parsed = shopItemsFromApiResponse(res);
        setShopItems(parsed.items);
        setItemsPage(parsed.pagination.page);
        setItemsPageSize(parsed.pagination.page_size as 10 | 20 | 50 | 100);
        setItemsTotal(parsed.pagination.total);
        setItemsTotalPages(parsed.pagination.total_pages || 1);
      } catch (err: unknown) {
        const msg =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: string }).message ?? '')
            : '';
        setShopItemsError(msg || 'Không tải được danh sách mặt hàng.');
      } finally {
        setShopItemsLoading(false);
      }
    },
    [],
  );

  const openShopItemsModal = async (s: Shop) => {
    setItemsListShopId(s.id);
    setItemsListShopName(s.name);
    setItemsDraftQuery('');
    setItemsQuery('');
    setItemsPage(1);
    setItemsPageSize(20);
    setItemsTotal(0);
    setItemsTotalPages(1);
    setShopItems([]);
    await loadShopItems(s.id, 1, 20, '');
  };

  const closeShopItemsModal = () => {
    setItemsListShopId(null);
    setItemsListShopName('');
    setShopItems([]);
    setShopItemsError(null);
  };

  const loadAuditLogs = useCallback(
    async (
      shopId: string,
      page: number,
      pageSize: 10 | 20 | 50 | 100,
      action: string,
    ) => {
      setAuditLoading(true);
      setAuditError(null);
      try {
        const res = await apiClient.get(`/admin/shops/${shopId}/audit-logs`, {
          params: {
            page,
            page_size: pageSize,
            ...(action ? { action } : {}),
          },
        });
        const parsed = shopAuditLogsFromApiResponse(res);
        setAuditLogs(parsed.logs);
        setAuditPage(parsed.pagination.page);
        setAuditPageSize(parsed.pagination.page_size as 10 | 20 | 50 | 100);
        setAuditTotalPages(parsed.pagination.total_pages || 1);
      } catch (err: unknown) {
        const msg =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: string }).message ?? '')
            : '';
        setAuditError(msg || 'Không tải được lịch sử hoạt động.');
      } finally {
        setAuditLoading(false);
      }
    },
    [],
  );

  const openAuditModal = async (shop: Shop) => {
    setAuditModalShopId(shop.id);
    setAuditModalShopName(shop.name);
    setAuditActionFilter('');
    setAuditPage(1);
    setAuditPageSize(20);
    setAuditTotalPages(1);
    await loadAuditLogs(shop.id, 1, 20, '');
  };

  const closeAuditModal = () => {
    setAuditModalShopId(null);
    setAuditModalShopName('');
    setAuditLogs([]);
    setAuditError(null);
  };

  const closeMembersListModal = () => {
    setMembersListShopId(null);
    setMembersListError(null);
    setMembersList([]);
    closeMemberResetModal();
    setMemberAccountActionUserId(null);
  };

  const refreshMembersList = async () => {
    if (!membersListShopId) return;
    try {
      const res = await apiClient.get(`/admin/shops/${membersListShopId}/members`, {
        params: { page_size: 100 },
      });
      setMembersList(membersFromApiResponse(res));
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

  const handleShopItemsSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemsListShopId) return;
    const nextQuery = itemsDraftQuery.trim();
    setItemsQuery(nextQuery);
    await loadShopItems(itemsListShopId, 1, itemsPageSize, nextQuery);
  };

  const handleShopItemsPageSizeChange = async (value: 10 | 20 | 50 | 100) => {
    if (!itemsListShopId) return;
    setItemsPageSize(value);
    await loadShopItems(itemsListShopId, 1, value, itemsQuery);
  };

  const handleShopItemsChangePage = async (nextPage: number) => {
    if (!itemsListShopId) return;
    if (nextPage < 1 || nextPage > itemsTotalPages) return;
    await loadShopItems(itemsListShopId, nextPage, itemsPageSize, itemsQuery);
  };

  useEffect(() => {
    if (!itemsListShopId) return;
    const nextQuery = debouncedItemsQuery.trim();
    if (nextQuery === itemsQuery) return;
    setItemsQuery(nextQuery);
    void loadShopItems(itemsListShopId, 1, itemsPageSize, nextQuery);
  }, [debouncedItemsQuery, itemsListShopId, itemsPageSize, itemsQuery, loadShopItems]);

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
        ...(password ? { password } : {}),
        ...(full_name ? { full_name } : {}),
      };

      await apiClient.post(`/admin/shops/${shopId}/members`, payload);

      setShopActionError(null);
      setShopActionSuccess('Đã cấp shop_admin thành công.');
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
      alert('Tắt shop thất bại.');
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

  const isSuperAdmin =
    user?.role === 'super_admin' ||
    user?.shop_roles?.some((r) => r.role === 'super_admin');

  // Guard: non-super_admin gets a 403 from the API, but show UI message too
  if (user && !isSuperAdmin) {
    return (
      <div className="mx-auto max-w-[900px] p-6">
        <h1 className="m-0 text-2xl font-bold">Quản lý Shops</h1>
        <p className="mb-4 text-red-500">Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="m-0 text-2xl font-bold">Quản lý Shops</h1>
        <button
          id="create-shop-btn"
          className="cursor-pointer rounded-lg border-none bg-indigo-500 px-4 py-2 font-semibold text-white"
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
            <div key={shop.id} style={{ ...styles.card, opacity: shop.is_active ? 1 : 0.5 }}>
              <div style={styles.cardHeader}>
                <span style={{ ...styles.dot, background: shop.is_active ? '#22c55e' : '#9ca3af' }} />
                <strong style={styles.shopName}>{shop.name}</strong>
                <code style={styles.slug}>{shop.slug}</code>
              </div>
              <div style={styles.meta}>
                <ShopMetaButton
                  style={styles.metaClickable}
                  onClick={() => openShopItemsModal(shop)}
                  title="Xem danh sách mặt hàng của shop"
                  label={`📦 ${shop._count?.items ?? 0} mặt hàng`}
                />
                <ShopMetaButton
                  style={styles.metaClickable}
                  onClick={() => openMembersListModal(shop)}
                  title="Xem danh sách thành viên shop"
                  label={`👥 ${shop._count?.user_roles ?? 0} thành viên`}
                />
                <ShopMetaButton
                  style={styles.metaClickable}
                  onClick={() => openAuditModal(shop)}
                  title="Xem lịch sử hoạt động"
                  label="🕘 Lịch sử"
                />
              </div>
              {shop.is_active && (
                <div style={styles.cardActionsRow}>
                  <div style={styles.cardActionsLeft}>
                    <button
                      type="button"
                      style={{
                        ...styles.iconBtnEdit,
                        opacity: shopActionLoadingId === shop.id ? 0.5 : 1,
                        cursor:
                          shopActionLoadingId === shop.id ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => openEditShopModal(shop)}
                      disabled={shopActionLoadingId === shop.id}
                      title="Sửa thông tin shop (tên shop)"
                      aria-label="Sửa thông tin shop"
                    >
                      <Pencil size={18} aria-hidden />
                    </button>
                    <button
                      type="button"
                      style={{
                        ...styles.iconBtnDanger,
                        opacity: shopActionLoadingId === shop.id ? 0.5 : 1,
                        cursor: shopActionLoadingId === shop.id ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => handleDeactivate(shop.id)}
                      disabled={shopActionLoadingId === shop.id}
                      title="Tắt shop — ẩn shop khỏi hoạt động (dữ liệu vẫn giữ)"
                      aria-label="Tắt shop — ẩn shop khỏi hoạt động"
                    >
                      <EyeOff size={18} aria-hidden />
                    </button>
                  </div>
                  <button
                    id={`add-shop-admin-${shop.id}`}
                    type="button"
                    style={{
                      ...styles.iconBtnSuccess,
                      opacity: memberAddingForShopId === shop.id ? 0.7 : 1,
                      cursor: memberAddingForShopId === shop.id ? 'wait' : 'pointer',
                    }}
                    disabled={memberAddingForShopId === shop.id}
                    onClick={() => openMemberModal(shop.id)}
                    title="Thêm quản lý — gán shop_admin (email / tạo tài khoản)"
                    aria-label="Thêm quản lý cho shop"
                  >
                    {memberAddingForShopId === shop.id ? (
                      <Loader2 size={18} className="animate-spin" aria-hidden />
                    ) : (
                      <UserPlus size={18} aria-hidden />
                    )}
                  </button>
                </div>
              )}
              {!shop.is_active && (
                <>
                  <span style={styles.inactiveLabel}>Đã tắt</span>
                  <button
                    style={styles.activateBtn}
                    onClick={() => handleActivate(shop.id)}
                    disabled={shopActionLoadingId === shop.id}
                    type="button"
                  >
                    {shopActionLoadingId === shop.id ? 'Đang mở...' : 'Mở lại shop'}
                  </button>
                </>
              )}

              {!shop.is_active && (
                <div style={styles.memberBox}>
                  <div style={styles.cardActionsLeft}>
                    <button
                      type="button"
                      style={{
                        ...styles.iconBtnEdit,
                        alignSelf: 'flex-start',
                        opacity: shopActionLoadingId === shop.id ? 0.5 : 1,
                        cursor:
                          shopActionLoadingId === shop.id ? 'not-allowed' : 'pointer',
                      }}
                      onClick={() => openEditShopModal(shop)}
                      disabled={shopActionLoadingId === shop.id}
                      title="Sửa thông tin shop (tên shop)"
                      aria-label="Sửa thông tin shop"
                    >
                      <Pencil size={18} aria-hidden />
                    </button>
                    <button
                      id={`add-shop-admin-${shop.id}`}
                      type="button"
                      style={{
                        ...styles.iconBtnSuccess,
                        opacity: memberAddingForShopId === shop.id ? 0.7 : 1,
                      }}
                      disabled={memberAddingForShopId === shop.id}
                      onClick={() => openMemberModal(shop.id)}
                      title="Thêm quản lý — gán shop_admin (email / tạo tài khoản)"
                      aria-label="Thêm quản lý cho shop"
                    >
                      {memberAddingForShopId === shop.id ? (
                        <Loader2 size={18} className="animate-spin" aria-hidden />
                      ) : (
                        <UserPlus size={18} aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {itemsListShopId === shop.id && (
                <div style={styles.modalOverlay} onClick={closeShopItemsModal}>
                  <div
                    style={{ ...styles.modal, maxWidth: '860px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={styles.modalTitle}>Mặt hàng — {itemsListShopName}</div>
                    <form style={styles.itemsToolbar} onSubmit={handleShopItemsSearchSubmit}>
                      <input
                        style={{ ...styles.modalInput, flex: 1 }}
                        placeholder="Tìm theo tên sản phẩm..."
                        value={itemsDraftQuery}
                        onChange={(e) => setItemsDraftQuery(e.target.value)}
                      />
                      <select
                        value={itemsPageSize}
                        style={styles.itemsPageSizeSelect}
                        onChange={(e) =>
                          handleShopItemsPageSizeChange(
                            Number(e.target.value) as 10 | 20 | 50 | 100,
                          )
                        }
                      >
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                        <option value={100}>100 / trang</option>
                      </select>
                      <button type="submit" style={styles.modalConfirmBtn}>
                        Tìm
                      </button>
                    </form>

                    {shopItemsError && <p style={styles.modalError}>{shopItemsError}</p>}
                    {shopItemsLoading ? (
                      <p style={styles.modalHint}>Đang tải...</p>
                    ) : (
                      <div style={styles.shopItemsTableWrap}>
                        {shopItems.length === 0 ? (
                          <p style={styles.modalHint}>Không có mặt hàng phù hợp.</p>
                        ) : (
                          <table style={styles.shopItemsTable}>
                            <thead>
                              <tr>
                                <th style={styles.shopItemsTh}>Ảnh</th>
                                <th style={styles.shopItemsTh}>Tên sản phẩm</th>
                                <th style={styles.shopItemsTh}>Giá</th>
                                <th style={styles.shopItemsTh}>Ngày nhập</th>
                              </tr>
                            </thead>
                            <tbody>
                              {shopItems.map((item) => (
                                <tr key={item.id}>
                                  <td style={styles.shopItemsTd}>
                                    {item.cover_image_url ? (
                                      <img
                                        src={item.cover_image_url}
                                        alt={item.name}
                                        style={styles.shopItemThumb}
                                      />
                                    ) : (
                                      <div style={styles.shopItemNoImage}>No image</div>
                                    )}
                                  </td>
                                  <td style={styles.shopItemsTd}>{item.name}</td>
                                  <td style={styles.shopItemsTd}>
                                    {item.price != null
                                      ? `${item.price.toLocaleString('vi-VN')} đ`
                                      : '—'}
                                  </td>
                                  <td style={styles.shopItemsTd}>
                                    {new Date(item.created_at).toLocaleDateString('vi-VN')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    <div style={styles.itemsPaginationRow}>
                      <span style={styles.modalHint}>
                        Tổng {itemsTotal} mặt hàng · Trang {itemsPage}/{itemsTotalPages}
                      </span>
                      <div style={styles.itemsPaginationBtns}>
                        <button
                          type="button"
                          style={styles.modalCancelBtn}
                          onClick={() => handleShopItemsChangePage(itemsPage - 1)}
                          disabled={itemsPage <= 1 || shopItemsLoading}
                        >
                          Trước
                        </button>
                        <button
                          type="button"
                          style={styles.modalCancelBtn}
                          onClick={() => handleShopItemsChangePage(itemsPage + 1)}
                          disabled={itemsPage >= itemsTotalPages || shopItemsLoading}
                        >
                          Sau
                        </button>
                        <button
                          type="button"
                          style={styles.modalConfirmBtn}
                          onClick={closeShopItemsModal}
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {auditModalShopId === shop.id && (
                <div style={styles.modalOverlay} onClick={closeAuditModal}>
                  <div
                    style={{ ...styles.modal, maxWidth: '820px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={styles.modalTitle}>Lịch sử hoạt động — {auditModalShopName}</div>
                    <div style={styles.itemsToolbar}>
                      <select
                        value={auditActionFilter}
                        style={styles.itemsPageSizeSelect}
                        onChange={async (e) => {
                          const value = e.target.value;
                          setAuditActionFilter(value);
                          if (auditModalShopId) {
                            await loadAuditLogs(auditModalShopId, 1, auditPageSize, value);
                          }
                        }}
                      >
                        <option value="">Tất cả hành động</option>
                        <option value="add_shop_admin">Thêm quản trị shop</option>
                        <option value="reset_member_password">Reset mật khẩu</option>
                        <option value="set_member_active">Khóa/Mở khóa tài khoản</option>
                        <option value="update_shop">Cập nhật shop</option>
                        <option value="deactivate_shop">Tắt shop</option>
                        <option value="activate_shop">Mở lại shop</option>
                      </select>
                      <select
                        value={auditPageSize}
                        style={styles.itemsPageSizeSelect}
                        onChange={async (e) => {
                          const nextSize = Number(e.target.value) as 10 | 20 | 50 | 100;
                          setAuditPageSize(nextSize);
                          if (auditModalShopId) {
                            await loadAuditLogs(auditModalShopId, 1, nextSize, auditActionFilter);
                          }
                        }}
                      >
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                        <option value={100}>100 / trang</option>
                      </select>
                    </div>

                    {auditError && <p style={styles.modalError}>{auditError}</p>}
                    {auditLoading ? (
                      <p style={styles.modalHint}>Đang tải...</p>
                    ) : (
                      <div style={styles.shopItemsTableWrap}>
                        {auditLogs.length === 0 ? (
                          <p style={styles.modalHint}>Chưa có bản ghi hoạt động.</p>
                        ) : (
                          <table style={styles.shopItemsTable}>
                            <thead>
                              <tr>
                                <th style={styles.shopItemsTh}>Thời gian</th>
                                <th style={styles.shopItemsTh}>Hành động</th>
                                <th style={styles.shopItemsTh}>Người thực hiện</th>
                                <th style={styles.shopItemsTh}>Chi tiết</th>
                              </tr>
                            </thead>
                            <tbody>
                              {auditLogs.map((log) => (
                                <tr key={log.id}>
                                  <td style={styles.shopItemsTd}>
                                    {new Date(log.created_at).toLocaleString('vi-VN')}
                                  </td>
                                  <td style={styles.shopItemsTd}>{shopAuditActionLabel(log.action)}</td>
                                  <td style={styles.shopItemsTd}>
                                    {log.actor?.full_name?.trim() || log.actor?.email || 'Hệ thống'}
                                  </td>
                                  <td style={styles.shopItemsTd}>
                                    {log.metadata ? (
                                      <code>{JSON.stringify(log.metadata)}</code>
                                    ) : (
                                      '—'
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}

                    <div style={styles.itemsPaginationRow}>
                      <span style={styles.modalHint}>
                        Trang {auditPage}/{auditTotalPages}
                      </span>
                      <div style={styles.itemsPaginationBtns}>
                        <button
                          type="button"
                          style={styles.modalCancelBtn}
                          onClick={async () => {
                            if (!auditModalShopId || auditPage <= 1) return;
                            await loadAuditLogs(
                              auditModalShopId,
                              auditPage - 1,
                              auditPageSize,
                              auditActionFilter,
                            );
                          }}
                          disabled={auditPage <= 1 || auditLoading}
                        >
                          Trước
                        </button>
                        <button
                          type="button"
                          style={styles.modalCancelBtn}
                          onClick={async () => {
                            if (!auditModalShopId || auditPage >= auditTotalPages) return;
                            await loadAuditLogs(
                              auditModalShopId,
                              auditPage + 1,
                              auditPageSize,
                              auditActionFilter,
                            );
                          }}
                          disabled={auditPage >= auditTotalPages || auditLoading}
                        >
                          Sau
                        </button>
                        <button type="button" style={styles.modalConfirmBtn} onClick={closeAuditModal}>
                          Đóng
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {membersListShopId === shop.id && (
                <div style={styles.modalOverlay} onClick={closeMembersListModal}>
                  <div
                    style={{ ...styles.modal, maxWidth: '560px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={styles.modalTitle}>
                      Thành viên — {membersListShopName}
                    </div>
                    {membersListError && (
                      <p style={styles.modalError}>{membersListError}</p>
                    )}
                    {membersListLoading ? (
                      <p style={styles.modalHint}>Đang tải...</p>
                    ) : (
                      <div style={styles.membersListBox}>
                        {membersList.length === 0 ? (
                          <p style={styles.modalHint}>Chưa có thành viên.</p>
                        ) : (
                          membersList.map((row) => (
                            <div key={row.user_id} style={styles.memberRow}>
                              <div style={styles.memberRowMain}>
                                <div style={styles.memberName}>
                                  {row.user.full_name?.trim() || '—'}
                                </div>
                                <div style={styles.memberEmail}>{row.user.email}</div>
                                <div style={styles.memberRole}>
                                  {shopRoleLabel(row.role)}{' '}
                                  {!row.user.is_active && (
                                    <span style={styles.memberInactiveBadge}>
                                      (tài khoản tắt)
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={styles.memberRowActions}>
                                <button
                                  type="button"
                                  style={{
                                    ...styles.memberResetBtn,
                                    opacity:
                                      memberAccountActionUserId === row.user_id ? 0.6 : 1,
                                  }}
                                  onClick={() => openMemberResetPassword(row)}
                                  title="Đặt lại mật khẩu đăng nhập"
                                  disabled={memberAccountActionUserId === row.user_id}
                                >
                                  <KeyRound size={16} aria-hidden style={{ marginRight: '6px' }} />
                                  Đặt lại MK
                                </button>
                                {row.user.is_active ? (
                                  <button
                                    type="button"
                                    style={{
                                      ...styles.memberLockBtn,
                                      opacity:
                                        memberAccountActionUserId === row.user_id ? 0.6 : 1,
                                    }}
                                    onClick={() => handleMemberAccountActive(row, false)}
                                    title="Khóa tài khoản — không cho đăng nhập"
                                    disabled={memberAccountActionUserId === row.user_id}
                                  >
                                    {memberAccountActionUserId === row.user_id ? (
                                      <Loader2 size={16} className="animate-spin" aria-hidden />
                                    ) : (
                                      <Lock size={16} aria-hidden style={{ marginRight: '6px' }} />
                                    )}
                                    Khóa TK
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    style={{
                                      ...styles.memberUnlockBtn,
                                      opacity:
                                        memberAccountActionUserId === row.user_id ? 0.6 : 1,
                                    }}
                                    onClick={() => handleMemberAccountActive(row, true)}
                                    title="Mở khóa tài khoản"
                                    disabled={memberAccountActionUserId === row.user_id}
                                  >
                                    {memberAccountActionUserId === row.user_id ? (
                                      <Loader2 size={16} className="animate-spin" aria-hidden />
                                    ) : (
                                      <Unlock
                                        size={16}
                                        aria-hidden
                                        style={{ marginRight: '6px' }}
                                      />
                                    )}
                                    Mở khóa
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                    <div style={styles.modalActions}>
                      <button
                        type="button"
                        style={styles.modalCancelBtn}
                        onClick={closeMembersListModal}
                      >
                        Đóng
                      </button>
                    </div>

                    {membersResetTarget && (
                      <div
                        style={styles.modalOverlayNested}
                        onClick={closeMemberResetModal}
                      >
                        <div
                          style={{ ...styles.modal, maxWidth: '420px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div style={styles.modalTitle}>Đặt lại mật khẩu</div>
                          <p style={styles.modalHint}>
                            {membersResetTarget.fullName?.trim() || '—'} ·{' '}
                            {membersResetTarget.email}
                          </p>
                          {memberResetSubmitError && (
                            <p style={styles.modalError}>{memberResetSubmitError}</p>
                          )}
                          <form
                            onSubmit={handleMemberResetSubmit}
                            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                          >
                            <div style={styles.formRow}>
                              {(() => {
                                const st = analyzePasswordStrength(memberResetNewPassword);
                                const c =
                                  memberResetNewPassword.length > 0
                                    ? passwordStrengthLabelColor(st.labelKey)
                                    : '#6b7280';
                                const meter = passwordStrengthMeterFill(st.labelKey);
                                return (
                                  <>
                                    <label
                                      style={{
                                        ...styles.modalLabel,
                                        ...(memberResetPasswordFieldError
                                          ? styles.modalLabelInvalid
                                          : {}),
                                      }}
                                      htmlFor={`reset-pwd-${membersResetTarget.userId}`}
                                    >
                                      Mật khẩu mới{' '}
                                      {memberResetNewPassword.length > 0 && (
                                        <span
                                          style={{
                                            marginLeft: '8px',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: c,
                                          }}
                                        >
                                          · Độ mạnh: {st.label}
                                        </span>
                                      )}
                                    </label>
                                    {memberResetNewPassword.length > 0 && (
                                      <div style={styles.passwordStrengthMeter} aria-hidden>
                                        {[1, 2, 3].map((seg) => (
                                          <div
                                            key={seg}
                                            style={{
                                              ...styles.passwordStrengthSegment,
                                              background:
                                                seg <= st.meterLevel ? meter : '#e5e7eb',
                                            }}
                                          />
                                        ))}
                                      </div>
                                    )}
                                    {memberResetPasswordFieldError && (
                                      <span
                                        role="alert"
                                        style={styles.modalFieldError}
                                      >
                                        {memberResetPasswordFieldError}
                                      </span>
                                    )}
                                    <input
                                      id={`reset-pwd-${membersResetTarget.userId}`}
                                      style={{
                                        ...styles.modalInput,
                                        ...(memberResetPasswordFieldError
                                          ? styles.modalInputInvalid
                                          : {}),
                                      }}
                                      type="password"
                                      autoComplete="new-password"
                                      value={memberResetNewPassword}
                                      onChange={(e) => {
                                        setMemberResetNewPassword(e.target.value);
                                        if (memberResetPasswordFieldError) {
                                          setMemberResetPasswordFieldError(null);
                                        }
                                      }}
                                    />
                                  </>
                                );
                              })()}
                            </div>
                            <div style={styles.modalActions}>
                              <button
                                type="button"
                                style={styles.modalCancelBtn}
                                onClick={closeMemberResetModal}
                                disabled={memberResetSaving}
                              >
                                Hủy
                              </button>
                              <button
                                type="submit"
                                style={styles.modalConfirmBtn}
                                disabled={memberResetSaving}
                              >
                                {memberResetSaving ? 'Đang lưu...' : 'Xác nhận'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editShopModalId === shop.id && (
                <div style={styles.modalOverlay} onClick={closeEditShopModal}>
                  <div
                    style={styles.modal}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={styles.modalTitle}>Sửa thông tin shop</div>
                    {editShopError && (
                      <p style={styles.modalError}>{editShopError}</p>
                    )}
                    <form
                      onSubmit={handleEditShopSubmit}
                      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                      <div style={styles.formRow}>
                        <label style={styles.modalLabel} htmlFor={`edit-shop-name-${shop.id}`}>
                          Tên shop
                        </label>
                        <input
                          id={`edit-shop-name-${shop.id}`}
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
                        Shop URL <code style={styles.modalCode}>{shop.slug}</code> — slug không sửa
                        trên form này.
                      </p>
                      <div style={styles.modalActions}>
                        <button
                          type="button"
                          style={styles.modalCancelBtn}
                          onClick={closeEditShopModal}
                          disabled={editShopSaving}
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          style={styles.modalConfirmBtn}
                          disabled={editShopSaving}
                        >
                          {editShopSaving ? 'Đang lưu...' : 'Lưu'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {memberModalShopId === shop.id && (
                <div
                  style={styles.modalOverlay}
                  onClick={closeMemberModal}
                >
                  <div
                    style={styles.modal}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={styles.modalTitle}>Thêm quản trị shop</div>

                    {memberError && <p style={styles.error}>{memberError}</p>}
                    {memberSuccess && <p style={styles.success}>{memberSuccess}</p>}

                    <div style={styles.formRow}>
                      <label style={styles.modalLabel} htmlFor={`member-full-name-${shop.id}`}>Tên hiển thị</label>
                      <input
                        id={`member-full-name-${shop.id}`}
                        style={styles.modalInput}
                        value={memberFullName}
                        onChange={(e) => setMemberFullName(e.target.value)}
                        placeholder="vd: Nguyễn Văn Anh"
                      />
                    </div>

                    <div style={styles.formRow}>
                      <label
                        style={{
                          ...styles.modalLabel,
                          ...(memberEmailError ? styles.modalLabelInvalid : {}),
                        }}
                        htmlFor={`member-email-${shop.id}`}
                      >
                        Email <span style={{ color: '#b91c1c' }}>*</span>
                      </label>
                      {memberEmailError && (
                        <span
                          id={`member-email-error-${shop.id}`}
                          role="alert"
                          style={styles.modalFieldError}
                        >
                          {memberEmailError}
                        </span>
                      )}
                      <input
                        ref={memberEmailInputRef}
                        id={`member-email-${shop.id}`}
                        style={{
                          ...styles.modalInput,
                          ...(memberEmailError ? styles.modalInputInvalid : {}),
                        }}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        aria-invalid={memberEmailError ? true : undefined}
                        aria-describedby={
                          memberEmailError ? `member-email-error-${shop.id}` : undefined
                        }
                        value={memberEmail}
                        onChange={(e) => {
                          setMemberEmail(e.target.value);
                          if (memberEmailError) setMemberEmailError(null);
                          if (memberError) setMemberError(null);
                        }}
                        onBlur={() => {
                          const t = memberEmail.trim();
                          if (t === '') {
                            setMemberEmailError(null);
                            return;
                          }
                          if (!isValidEmail(t)) {
                            setMemberEmailError(
                              'Email không đúng định dạng (vd: ten@example.com).',
                            );
                          } else {
                            setMemberEmailError(null);
                          }
                        }}
                        placeholder="vd: user@example.com"
                      />
                    </div>

                    <div style={styles.formRow}>{renderMemberPasswordField(shop.id)}</div>

                    

                    <div style={styles.modalActions}>
                      <button
                        type="button"
                        style={styles.modalCancelBtn}
                        onClick={closeMemberModal}
                        disabled={memberAddingForShopId === shop.id}
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        style={styles.modalConfirmBtn}
                        onClick={() => handleAddShopAdmin(shop.id)}
                        disabled={memberAddingForShopId === shop.id}
                      >
                        {memberAddingForShopId === shop.id
                          ? 'Đang thêm...'
                          : 'Thêm quản trị shop'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopsPage;
