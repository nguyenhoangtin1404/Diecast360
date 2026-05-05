import type { CSSProperties, ReactNode } from 'react';
import type { ShopContactFormState } from './types/shopContact';

type FieldStyles = {
  formRow: CSSProperties;
  modalLabel: CSSProperties;
  modalInput: CSSProperties;
  modalHint: CSSProperties;
  sectionTitle: CSSProperties;
};

type Props = {
  idPrefix: string;
  value: ShopContactFormState;
  onChange: (next: ShopContactFormState) => void;
  styles: FieldStyles;
  intro?: ReactNode;
  disabled?: boolean;
};

export function ShopContactFields({ idPrefix, value, onChange, styles, intro, disabled }: Props) {
  const set = (patch: Partial<ShopContactFormState>) => onChange({ ...value, ...patch });
  const setPhone = (patch: Partial<ShopContactFormState['phone']>) =>
    onChange({ ...value, phone: { ...value.phone, ...patch } });
  const setFacebook = (patch: Partial<ShopContactFormState['facebook']>) =>
    onChange({ ...value, facebook: { ...value.facebook, ...patch } });
  const setZalo = (patch: Partial<ShopContactFormState['zalo']>) =>
    onChange({ ...value, zalo: { ...value.zalo, ...patch } });
  const setHours = (patch: Partial<ShopContactFormState['hours']>) =>
    onChange({ ...value, hours: { ...value.hours, ...patch } });

  return (
    <>
      {intro}
      <div style={styles.formRow}>
        <label style={styles.modalLabel} htmlFor={`${idPrefix}-contact-title`}>
          Tiêu đề trang
        </label>
        <input
          id={`${idPrefix}-contact-title`}
          style={styles.modalInput}
          value={value.page_title}
          onChange={(e) => set({ page_title: e.target.value })}
          autoComplete="off"
          placeholder="Ví dụ: Liên hệ với chúng tôi"
          disabled={disabled}
        />
      </div>
      <div style={styles.formRow}>
        <label style={styles.modalLabel} htmlFor={`${idPrefix}-contact-sub`}>
          Mô tả dưới tiêu đề
        </label>
        <input
          id={`${idPrefix}-contact-sub`}
          style={styles.modalInput}
          value={value.page_subtitle}
          onChange={(e) => set({ page_subtitle: e.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      <div style={styles.sectionTitle}>Điện thoại</div>
      <div style={styles.formRow}>
        <label style={styles.modalLabel} htmlFor={`${idPrefix}-phone-tel`}>
          Số gọi (tel, có thể gồm +)
        </label>
        <input
          id={`${idPrefix}-phone-tel`}
          style={styles.modalInput}
          value={value.phone.tel}
          onChange={(e) => setPhone({ tel: e.target.value })}
          autoComplete="off"
          placeholder="+84856694766"
          disabled={disabled}
        />
      </div>
      <div style={styles.formRow}>
        <label style={styles.modalLabel} htmlFor={`${idPrefix}-phone-label`}>
          Dòng hiển thị (nếu trống sẽ dùng số gọi)
        </label>
        <input
          id={`${idPrefix}-phone-label`}
          style={styles.modalInput}
          value={value.phone.label}
          onChange={(e) => setPhone({ label: e.target.value })}
          autoComplete="off"
          placeholder="0856694766"
          disabled={disabled}
        />
      </div>
      <div style={styles.formRow}>
        <label style={styles.modalLabel} htmlFor={`${idPrefix}-phone-hint`}>
          Gợi ý phụ
        </label>
        <input
          id={`${idPrefix}-phone-hint`}
          style={styles.modalInput}
          value={value.phone.hint}
          onChange={(e) => setPhone({ hint: e.target.value })}
          autoComplete="off"
          placeholder="Gọi ngay để được tư vấn"
          disabled={disabled}
        />
      </div>

      <div style={styles.sectionTitle}>Facebook</div>
      <div style={styles.formRow}>
        <label style={styles.modalLabel} htmlFor={`${idPrefix}-fb-url`}>
          URL (https)
        </label>
        <input
          id={`${idPrefix}-fb-url`}
          style={styles.modalInput}
          value={value.facebook.url}
          onChange={(e) => setFacebook({ url: e.target.value })}
          autoComplete="off"
          placeholder="https://www.facebook.com/..."
          disabled={disabled}
        />
      </div>
      <div style={styles.formRow}>
        <label style={styles.modalLabel} htmlFor={`${idPrefix}-fb-label`}>
          Text link (tùy chọn)
        </label>
        <input
          id={`${idPrefix}-fb-label`}
          style={styles.modalInput}
          value={value.facebook.label}
          onChange={(e) => setFacebook({ label: e.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      <div style={styles.sectionTitle}>Zalo</div>
      <div style={styles.formRow}>
        <label style={styles.modalLabel} htmlFor={`${idPrefix}-zalo-url`}>
          URL (https)
        </label>
        <input
          id={`${idPrefix}-zalo-url`}
          style={styles.modalInput}
          value={value.zalo.url}
          onChange={(e) => setZalo({ url: e.target.value })}
          autoComplete="off"
          placeholder="https://zalo.me/..."
          disabled={disabled}
        />
      </div>
      <div style={styles.formRow}>
        <label style={styles.modalLabel} htmlFor={`${idPrefix}-zalo-label`}>
          Dòng hiển thị
        </label>
        <input
          id={`${idPrefix}-zalo-label`}
          style={styles.modalInput}
          value={value.zalo.label}
          onChange={(e) => setZalo({ label: e.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      <div style={styles.sectionTitle}>Giờ làm việc</div>
      <div style={styles.formRow}>
        <label style={styles.modalLabel} htmlFor={`${idPrefix}-hours-line`}>
          Dòng lịch (có thể dùng **in đậm**)
        </label>
        <textarea
          id={`${idPrefix}-hours-line`}
          style={{ ...styles.modalInput, minHeight: '72px', resize: 'vertical' as const }}
          value={value.hours.schedule_line}
          onChange={(e) => setHours({ schedule_line: e.target.value })}
          placeholder="**Thứ 2 - Chủ nhật:** 9:00 - 21:00"
          disabled={disabled}
        />
      </div>
      <div style={styles.formRow}>
        <label style={styles.modalLabel} htmlFor={`${idPrefix}-hours-foot`}>
          Dòng chú thích dưới
        </label>
        <input
          id={`${idPrefix}-hours-foot`}
          style={styles.modalInput}
          value={value.hours.footer_note}
          onChange={(e) => setHours({ footer_note: e.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </div>
    </>
  );
}
