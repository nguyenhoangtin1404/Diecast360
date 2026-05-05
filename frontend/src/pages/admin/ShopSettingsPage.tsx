import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Palette } from 'lucide-react';
import { apiClient, uploadFile } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { useShop } from '../../hooks/useShop';
import { jsonStableStringify } from '../../utils/jsonStableStringify';
import { buildShopContactPatch, parseShopContactFormDefaults } from './shops/shopContactForm';
import { buildAppearancePatch, parseAppearanceFormDefaults } from './shops/shopSettingsForm';
import type { ShopContactFormState } from './shops/types/shopContact';
import type { ShopAppearanceFormState } from './shops/types/shopSettings';
import { ShopContactFields } from './shops/ShopContactFields';

type ShopSettingsApiRow = {
  id: string;
  name: string;
  slug: string;
  contact_json?: unknown;
  appearance_json?: unknown;
};

const card: CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '20px',
  boxShadow: '0 4px 14px rgba(15,23,42,0.06)',
};

const label: CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#374151',
};

const input: CSSProperties = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#111827',
  width: '100%',
  boxSizing: 'border-box',
};

const formRow: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '6px' };
const sectionTitle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#111827',
  marginTop: '8px',
  marginBottom: '4px',
};
const hint: CSSProperties = { fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: 1.45 };

function extractApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim()) return m.trim();
  }
  const nested = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  if (typeof nested === 'string' && nested.trim()) return nested.trim();
  return fallback;
}

export const ShopSettingsPage = () => {
  const { activeShop } = useShop();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [contact, setContact] = useState<ShopContactFormState>(() => parseShopContactFormDefaults(undefined));
  const [appearance, setAppearance] = useState<ShopAppearanceFormState>(() => parseAppearanceFormDefaults(undefined));
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const shopSettingsQueryKey = ['shop-settings', activeShop?.id ?? null] as const;

  const roleForActiveShop =
    activeShop?.id && user?.shop_roles?.length
      ? user.shop_roles.find((r) => r.shop_id === activeShop.id)?.role ?? null
      : null;

  /** PATCH /shop-settings: RolesGuard allows shop_admin; legacy tenant super_admin is treated as admin. */
  const canEditSettings =
    roleForActiveShop === 'shop_admin' || roleForActiveShop === 'super_admin';

  const settingsQuery = useQuery({
    queryKey: shopSettingsQueryKey,
    queryFn: async () => {
      const res = (await apiClient.get('/shop-settings')) as unknown;
      const wrapped = res as { data?: ShopSettingsApiRow };
      const row = wrapped?.data;
      if (row && typeof row === 'object' && typeof row.id === 'string') {
        return row;
      }
      throw new Error('Invalid shop settings response');
    },
    enabled: Boolean(activeShop?.id),
  });

  /* Sync form from server when GET /shop-settings resolves (or refetches) */
  /* eslint-disable react-hooks/set-state-in-effect -- hydrate local form from query result */
  useEffect(() => {
    const row = settingsQuery.data;
    if (!row) return;
    setContact(parseShopContactFormDefaults(row.contact_json));
    setAppearance(parseAppearanceFormDefaults(row.appearance_json));
  }, [settingsQuery.data]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!settingsQuery.data) {
        throw new Error('Chưa tải xong cấu hình.');
      }
      const serverContact = parseShopContactFormDefaults(settingsQuery.data.contact_json);
      const serverAppearance = parseAppearanceFormDefaults(settingsQuery.data.appearance_json);
      const nextContact = buildShopContactPatch(contact).contact;
      const nextAppearance = buildAppearancePatch(appearance);
      const patch: { contact?: typeof nextContact; appearance?: typeof nextAppearance } = {};
      if (jsonStableStringify(nextContact) !== jsonStableStringify(buildShopContactPatch(serverContact).contact)) {
        patch.contact = nextContact;
      }
      if (jsonStableStringify(nextAppearance) !== jsonStableStringify(buildAppearancePatch(serverAppearance))) {
        patch.appearance = nextAppearance;
      }
      if (Object.keys(patch).length === 0) {
        return { skipped: true as const };
      }
      return apiClient.patch('/shop-settings', patch);
    },
    onSuccess: async (res) => {
      setSaveError(null);
      if (res && typeof res === 'object' && 'skipped' in res && (res as { skipped?: boolean }).skipped) {
        setSaveOk('Không có thay đổi cần lưu.');
        return;
      }
      setSaveOk('Đã lưu cấu hình shop.');
      await queryClient.invalidateQueries({ queryKey: shopSettingsQueryKey });
    },
    onError: (err: unknown) => {
      setSaveError(extractApiErrorMessage(err, 'Lưu thất bại.'));
      setSaveOk(null);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSaveOk(null);
    setSaveError(null);
    saveMutation.mutate();
  };

  const handleBrandingFile = async (kind: 'logo' | 'favicon', fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file || !canEditSettings || !activeShop?.id) return;
    setSaveOk(null);
    setSaveError(null);
    if (kind === 'logo') setUploadingLogo(true);
    else setUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);
      const raw = await uploadFile<{ ok?: boolean; data?: { shop?: { appearance_json?: unknown } } }>(
        '/shop-settings/branding-upload',
        formData,
      );
      const appearanceJson = raw?.data?.shop?.appearance_json;
      if (appearanceJson !== undefined) {
        setAppearance(parseAppearanceFormDefaults(appearanceJson));
      }
      await queryClient.invalidateQueries({ queryKey: shopSettingsQueryKey });
      setSaveOk(kind === 'logo' ? 'Đã upload logo.' : 'Đã upload favicon.');
    } catch (err: unknown) {
      setSaveError(extractApiErrorMessage(err, 'Upload thất bại.'));
    } finally {
      if (kind === 'logo') setUploadingLogo(false);
      else setUploadingFavicon(false);
    }
  };

  if (settingsQuery.isLoading) {
    return (
      <div style={{ padding: '32px', maxWidth: '720px', margin: '0 auto' }}>
        <p style={{ color: '#64748b' }}>Đang tải cấu hình...</p>
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div style={{ padding: '32px', maxWidth: '720px', margin: '0 auto' }}>
        <p style={{ color: '#b91c1c' }}>Không tải được cấu hình. Kiểm tra đã chọn shop và đăng nhập.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px 48px', maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Palette size={28} style={{ color: '#4f46e5' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Cấu hình shop</h1>
      </div>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
        Chỉnh nội dung trang liên hệ công khai và giao diện (mở rộng) cho shop:{' '}
        <strong>{activeShop?.name ?? settingsQuery.data?.name}</strong>
        <span style={{ color: '#94a3b8' }}> · slug {activeShop?.slug ?? settingsQuery.data?.slug}</span>
      </p>

      {!canEditSettings && activeShop?.id ? (
        <p
          style={{
            ...hint,
            marginBottom: '16px',
            padding: '12px 14px',
            background: '#fef9c3',
            border: '1px solid #fde047',
            borderRadius: '8px',
            color: '#713f12',
          }}
        >
          Bạn không có quyền chỉnh sửa cấu hình shop này (chỉ <strong>quản trị shop</strong> được lưu; tài khoản nhân
          viên chỉ xem).
        </p>
      ) : null}

      {saveOk && <p style={{ color: '#15803d', marginBottom: '12px' }}>{saveOk}</p>}
      {saveError && <p style={{ color: '#b91c1c', marginBottom: '12px' }}>{saveError}</p>}

      <form onSubmit={onSubmit}>
        <div style={card}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 12px', color: '#111827' }}>
            Trang liên hệ (công khai)
          </h2>
          <p style={{ ...hint, marginBottom: '16px' }}>
            Hiển thị tại <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>/contact</code>{' '}
            với <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>?shop_id=</code> (slug
            hoặc UUID). Để trống rồi lưu để xóa giá trị.
          </p>
          <ShopContactFields
            idPrefix="shop-settings"
            value={contact}
            onChange={setContact}
            disabled={!canEditSettings}
            styles={{
              formRow,
              modalLabel: label,
              modalInput: input,
              modalHint: hint,
              sectionTitle: { ...sectionTitle, marginTop: '12px' },
            }}
          />
        </div>

        <div style={card}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: '#111827' }}>
            Giao diện (chuẩn bị mở rộng)
          </h2>
          <p style={{ ...hint, marginBottom: '16px' }}>
            Dữ liệu lưu trong <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>appearance_json</code>
            . Áp dụng lên catalog công khai có thể làm ở bước sau.
          </p>

          <div style={formRow}>
            <label style={label} htmlFor="appearance-logo">
              URL logo (https)
            </label>
            <input
              id="appearance-logo"
              style={input}
              value={appearance.logo_url}
              onChange={(e) => setAppearance((a) => ({ ...a, logo_url: e.target.value }))}
              placeholder="https://..."
              disabled={!canEditSettings}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <input
                id="appearance-logo-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={!canEditSettings || uploadingLogo}
                style={{ fontSize: '13px', maxWidth: '100%' }}
                onChange={(e) => {
                  void handleBrandingFile('logo', e.target.files);
                  e.target.value = '';
                }}
              />
              {uploadingLogo ? (
                <span style={{ ...hint, margin: 0 }}>Đang upload logo...</span>
              ) : (
                <span style={{ ...hint, margin: 0 }}>Hoặc chọn ảnh: JPEG, PNG, WebP · tối đa 2MB.</span>
              )}
            </div>
            {appearance.logo_url.trim() ? (
              <img
                src={appearance.logo_url.trim()}
                alt="Logo xem trước"
                style={{ marginTop: '8px', maxHeight: '56px', maxWidth: '220px', objectFit: 'contain' }}
              />
            ) : null}
          </div>
          <div style={formRow}>
            <label style={label} htmlFor="appearance-favicon">
              URL favicon (https)
            </label>
            <input
              id="appearance-favicon"
              style={input}
              value={appearance.favicon_url}
              onChange={(e) => setAppearance((a) => ({ ...a, favicon_url: e.target.value }))}
              placeholder="https://..."
              disabled={!canEditSettings}
            />
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <input
                id="appearance-favicon-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={!canEditSettings || uploadingFavicon}
                style={{ fontSize: '13px', maxWidth: '100%' }}
                onChange={(e) => {
                  void handleBrandingFile('favicon', e.target.files);
                  e.target.value = '';
                }}
              />
              {uploadingFavicon ? (
                <span style={{ ...hint, margin: 0 }}>Đang upload favicon...</span>
              ) : (
                <span style={{ ...hint, margin: 0 }}>Hoặc chọn ảnh: JPEG, PNG, WebP · tối đa 2MB.</span>
              )}
            </div>
            {appearance.favicon_url.trim() ? (
              <img
                src={appearance.favicon_url.trim()}
                alt="Favicon xem trước"
                style={{ marginTop: '8px', width: '32px', height: '32px', objectFit: 'contain' }}
              />
            ) : null}
          </div>
          <div style={formRow}>
            <label style={label} htmlFor="appearance-primary">
              Màu chủ (hex #RRGGBB hoặc tên màu đơn giản, ví dụ #4f46e5 hoặc indigo)
            </label>
            <input
              id="appearance-primary"
              style={input}
              value={appearance.primary_color}
              onChange={(e) => setAppearance((a) => ({ ...a, primary_color: e.target.value }))}
              disabled={!canEditSettings}
            />
          </div>
          <div style={formRow}>
            <label style={label} htmlFor="appearance-accent">
              Màu nhấn
            </label>
            <input
              id="appearance-accent"
              style={input}
              value={appearance.accent_color}
              onChange={(e) => setAppearance((a) => ({ ...a, accent_color: e.target.value }))}
              disabled={!canEditSettings}
            />
          </div>
          <div style={formRow}>
            <label style={label} htmlFor="appearance-font">
              Font (CSS font-family)
            </label>
            <input
              id="appearance-font"
              style={input}
              value={appearance.font_family}
              onChange={(e) => setAppearance((a) => ({ ...a, font_family: e.target.value }))}
              placeholder="Inter, system-ui, sans-serif"
              disabled={!canEditSettings}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saveMutation.isPending || !canEditSettings}
            style={{
              padding: '10px 20px',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: saveMutation.isPending || !canEditSettings ? 'not-allowed' : 'pointer',
              opacity: saveMutation.isPending || !canEditSettings ? 0.55 : 1,
            }}
          >
            {saveMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </form>
    </div>
  );
};
