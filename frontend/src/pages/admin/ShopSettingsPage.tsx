import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Palette } from 'lucide-react';
import { apiClient, uploadFile } from '../../api/client';
import { useAuth } from '../../hooks/useAuth';
import { useShop } from '../../hooks/useShop';
import { jsonStableStringify } from '../../utils/jsonStableStringify';
import { buildShopContactPatch, parseShopContactFormDefaults } from './shops/shopContactForm';
import { buildAppearancePatch } from './shops/shopSettingsForm';
import type { ShopContactFormState } from './shops/types/shopContact';
import type { ShopAppearanceFormState } from '@/types/shopAppearance';
import { parseAppearanceFormDefaults } from '@/utils/shopAppearance';
import { ShopContactFields } from './shops/ShopContactFields';
import { publicShopContactQueryKey } from '../../hooks/usePublicShopContact';
import { fetchShopSettings, shopSettingsQueryKey } from '../../hooks/shopSettingsQuery';
import { notifyShopAppearanceUpdated } from '../../utils/shopThemeBridge';
import styles from './shopSettingsPage.module.css';
import { cn } from '@/lib/utils';

/** Match backend shop-branding upload cap (see ShopsService.uploadAppearanceAsset). */
const MAX_BRANDING_UPLOAD_BYTES = 2 * 1024 * 1024;

/** `#RGB` / `#RRGGBB` for `<input type="color" />`; otherwise null (keyword / invalid). */
function normalizeHexForColorInput(raw: string): string | null {
  const t = raw.trim();
  const full6 = /^#([0-9a-f]{6})$/i.exec(t);
  if (full6) return `#${full6[1].toLowerCase()}`;
  const short3 = /^#([0-9a-f]{3})$/i.exec(t);
  if (short3) {
    const [r, g, b] = short3[1].split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

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

  const shopSettingsQueryKeyResolved = shopSettingsQueryKey(activeShop?.id ?? null);

  const roleForActiveShop =
    activeShop?.id && user?.shop_roles?.length
      ? user.shop_roles.find((r) => r.shop_id === activeShop.id)?.role ?? null
      : null;

  /** PATCH /shop-settings: RolesGuard allows shop_admin; legacy tenant super_admin is treated as admin. */
  const canEditSettings =
    roleForActiveShop === 'shop_admin' || roleForActiveShop === 'super_admin';

  const settingsQuery = useQuery({
    queryKey: shopSettingsQueryKeyResolved,
    queryFn: fetchShopSettings,
    enabled: Boolean(activeShop?.id),
  });

  /* Sync form from server when GET /shop-settings resolves (or refetches) — TanStack Query v5 has no useQuery onSuccess */
  useEffect(() => {
    const row = settingsQuery.data;
    if (!row) return;
    setContact(parseShopContactFormDefaults(row.contact_json));
    setAppearance(parseAppearanceFormDefaults(row.appearance_json));
  }, [settingsQuery.data]);

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
      await queryClient.invalidateQueries({ queryKey: ['shop-settings'] });
      if (activeShop?.id) {
        await queryClient.invalidateQueries({ queryKey: publicShopContactQueryKey(activeShop.id) });
      }
      notifyShopAppearanceUpdated();
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
    if (file.size > MAX_BRANDING_UPLOAD_BYTES) {
      setSaveOk(null);
      setSaveError(`File quá lớn (tối đa ${Math.floor(MAX_BRANDING_UPLOAD_BYTES / (1024 * 1024))}MB).`);
      return;
    }
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
      notifyShopAppearanceUpdated();
      await queryClient.invalidateQueries({ queryKey: ['shop-settings'] });
      if (activeShop?.id) {
        await queryClient.invalidateQueries({ queryKey: publicShopContactQueryKey(activeShop.id) });
      }
      setSaveOk(kind === 'logo' ? 'Đã upload logo.' : 'Đã upload favicon.');
    } catch (err: unknown) {
      setSaveError(extractApiErrorMessage(err, 'Upload thất bại.'));
    } finally {
      if (kind === 'logo') setUploadingLogo(false);
      else setUploadingFavicon(false);
    }
  };

  const contactFieldStyles = {
    formRow: {},
    modalLabel: {},
    modalInput: {},
    modalHint: {},
    sectionTitle: {},
  };

  if (settingsQuery.isLoading) {
    return (
      <div className={styles.container}>
        <p className={styles.mutedCenter}>Đang tải cấu hình...</p>
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div className={styles.container}>
        <p className={styles.errorCenter}>Không tải được cấu hình. Kiểm tra đã chọn shop và đăng nhập.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.titleRow}>
          <div className={styles.titleIcon} aria-hidden>
            <Palette size={22} strokeWidth={2} />
          </div>
          <h1 className={styles.title}>Cấu hình shop</h1>
        </div>
        <p className={styles.subtitle}>
          Chỉnh nội dung trang liên hệ công khai và giao diện (mở rộng) cho shop:{' '}
          <strong>{activeShop?.name ?? settingsQuery.data?.name}</strong>
          <span className={styles.shopMetaSlug}> · slug {activeShop?.slug ?? settingsQuery.data?.slug}</span>
        </p>
      </header>

      {!canEditSettings && activeShop?.id ? (
        <p className={styles.alertReadonly}>
          Bạn không có quyền chỉnh sửa cấu hình shop này (chỉ <strong>quản trị shop</strong> được lưu; tài khoản nhân
          viên chỉ xem).
        </p>
      ) : null}

      {saveOk ? <p className={styles.alertSuccess}>{saveOk}</p> : null}
      {saveError ? <p className={styles.alertError}>{saveError}</p> : null}

      <form onSubmit={onSubmit} className={styles.formStack}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Trang liên hệ (công khai)</h2>
          <p className={styles.cardIntro}>
            Hiển thị tại <code className={styles.inlineCode}>/contact</code> với{' '}
            <code className={styles.inlineCode}>?shop_id=</code> (slug hoặc UUID). Để trống rồi lưu để xóa giá trị.
          </p>
          <ShopContactFields
            idPrefix="shop-settings"
            value={contact}
            onChange={setContact}
            disabled={!canEditSettings}
            styles={contactFieldStyles}
            classNames={{
              root: styles.contactFieldsGrid,
              formRow: styles.formRow,
              label: styles.label,
              input: styles.input,
              textarea: styles.textarea,
              hint: styles.hint,
              sectionTitle: styles.contactSectionTitle,
              hoursScheduleRow: styles.contactRowFull,
            }}
          />
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Giao diện (chuẩn bị mở rộng)</h2>
          <p className={styles.cardIntro}>
            Dữ liệu lưu trong <code className={styles.inlineCode}>appearance_json</code>. Áp dụng lên catalog công
            khai có thể làm ở bước sau.
          </p>

          <div className={styles.brandingRow}>
            <div className={styles.formRow}>
              <div className={styles.brandingUploadRow}>
                <input
                  id="appearance-logo-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={!canEditSettings || uploadingLogo}
                  className={styles.fileInput}
                  onChange={(e) => {
                    void handleBrandingFile('logo', e.target.files);
                    e.target.value = '';
                  }}
                />
                {uploadingLogo ? (
                  <span className={styles.hint}>Đang upload logo...</span>
                ) : (
                  <span className={styles.hint}>Hoặc chọn ảnh: JPEG, PNG, WebP · tối đa 2MB.</span>
                )}
              </div>
              {appearance.logo_url.trim() ? (
                <img
                  src={appearance.logo_url.trim()}
                  alt="Logo xem trước"
                  className={styles.previewLogo}
                />
              ) : null}
            </div>
            <div className={styles.formRow}>
              <div className={styles.brandingUploadRow}>
                <input
                  id="appearance-favicon-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={!canEditSettings || uploadingFavicon}
                  className={styles.fileInput}
                  onChange={(e) => {
                    void handleBrandingFile('favicon', e.target.files);
                    e.target.value = '';
                  }}
                />
                {uploadingFavicon ? (
                  <span className={styles.hint}>Đang upload favicon...</span>
                ) : (
                  <span className={styles.hint}>Hoặc chọn ảnh: JPEG, PNG, WebP · tối đa 2MB.</span>
                )}
              </div>
              {appearance.favicon_url.trim() ? (
                <img
                  src={appearance.favicon_url.trim()}
                  alt="Favicon xem trước"
                  className={styles.previewFavicon}
                />
              ) : null}
            </div>
          </div>

          <div className={styles.colorPairRow}>
            <div className={styles.formRow}>
              <label className={styles.label} htmlFor="appearance-primary">
                Màu chủ (hex hoặc tên màu)
              </label>
              <div className={styles.colorRow}>
                <input
                  id="appearance-primary"
                  className={cn(styles.input, styles.inputGrow)}
                  value={appearance.primary_color}
                  onChange={(e) => setAppearance((a) => ({ ...a, primary_color: e.target.value }))}
                  disabled={!canEditSettings}
                  autoComplete="off"
                />
                <input
                  type="color"
                  aria-label="Chọn màu chủ bằng bảng màu"
                  title="Chọn màu chủ"
                  value={normalizeHexForColorInput(appearance.primary_color) ?? '#4f46e5'}
                  onChange={(e) => setAppearance((a) => ({ ...a, primary_color: e.target.value }))}
                  disabled={!canEditSettings}
                  className={styles.colorPicker}
                />
              </div>
              <p className={styles.hint}>Ví dụ #4f46e5 hoặc indigo.</p>
            </div>
            <div className={styles.formRow}>
              <label className={styles.label} htmlFor="appearance-accent">
                Màu nhấn
              </label>
              <div className={styles.colorRow}>
                <input
                  id="appearance-accent"
                  className={cn(styles.input, styles.inputGrow)}
                  value={appearance.accent_color}
                  onChange={(e) => setAppearance((a) => ({ ...a, accent_color: e.target.value }))}
                  disabled={!canEditSettings}
                  autoComplete="off"
                />
                <input
                  type="color"
                  aria-label="Chọn màu nhấn bằng bảng màu"
                  title="Chọn màu nhấn"
                  value={normalizeHexForColorInput(appearance.accent_color) ?? '#7c3aed'}
                  onChange={(e) => setAppearance((a) => ({ ...a, accent_color: e.target.value }))}
                  disabled={!canEditSettings}
                  className={styles.colorPicker}
                />
              </div>
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.label} htmlFor="appearance-font">
              Font (CSS font-family)
            </label>
            <input
              id="appearance-font"
              className={styles.input}
              value={appearance.font_family}
              onChange={(e) => setAppearance((a) => ({ ...a, font_family: e.target.value }))}
              placeholder="Inter, system-ui, sans-serif"
              disabled={!canEditSettings}
            />
          </div>
        </section>

        <div className={styles.actions}>
          <button
            type="submit"
            disabled={saveMutation.isPending || !canEditSettings}
            className={styles.buttonPrimary}
          >
            {saveMutation.isPending ? 'Đang lưu...' : 'Lưu cấu hình'}
          </button>
        </div>
      </form>
    </div>
  );
};
