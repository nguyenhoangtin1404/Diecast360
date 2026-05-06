import { memo } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { ShopContactFormState } from './types/shopContact';
import { isOptionalHttpUrl, isOptionalTelDisplay } from './shopContactForm';

type FieldStyles = {
  formRow: CSSProperties;
  modalLabel: CSSProperties;
  modalInput: CSSProperties;
  modalHint: CSSProperties;
  sectionTitle: CSSProperties;
};

type ContactFieldsClassNames = {
  /** Wrapper around all fields (e.g. CSS grid) */
  root?: string;
  /** Applied to each form row wrapper */
  formRow?: string;
  /** Applied to every field label */
  label?: string;
  /** Applied to every input field */
  input?: string;
  /** Applied to textarea fields */
  textarea?: string;
  /** Applied to helper hint text */
  hint?: string;
  /** Applied to each section heading row (e.g. full grid width) */
  sectionTitle?: string;
  /** Applied to specific rows that should span all columns */
  hoursScheduleRow?: string;
};

type Props = {
  idPrefix: string;
  value: ShopContactFormState;
  onChange: (next: ShopContactFormState) => void;
  styles: FieldStyles;
  intro?: ReactNode;
  disabled?: boolean;
  classNames?: ContactFieldsClassNames;
};

export const ShopContactFields = memo(function ShopContactFields({
  idPrefix,
  value,
  onChange,
  styles,
  intro,
  disabled,
  classNames,
}: Props) {
  const set = (patch: Partial<ShopContactFormState>) => onChange({ ...value, ...patch });
  const setPhone = (patch: Partial<ShopContactFormState['phone']>) =>
    onChange({ ...value, phone: { ...value.phone, ...patch } });
  const setFacebook = (patch: Partial<ShopContactFormState['facebook']>) =>
    onChange({ ...value, facebook: { ...value.facebook, ...patch } });
  const setZalo = (patch: Partial<ShopContactFormState['zalo']>) =>
    onChange({ ...value, zalo: { ...value.zalo, ...patch } });
  const setHours = (patch: Partial<ShopContactFormState['hours']>) =>
    onChange({ ...value, hours: { ...value.hours, ...patch } });
  const rowClassName = classNames?.formRow;
  const labelClassName = classNames?.label;
  const inputClassName = classNames?.input;
  const textareaClassName = classNames?.textarea;
  const hintClassName = classNames?.hint;
  const isFacebookUrlValid = isOptionalHttpUrl(value.facebook.url);
  const isZaloUrlValid = isOptionalHttpUrl(value.zalo.url);
  const isPhoneTelValid = isOptionalTelDisplay(value.phone.tel);

  return (
    <div className={classNames?.root}>
      {intro}
      <div style={styles.formRow} className={rowClassName}>
        <label style={styles.modalLabel} className={labelClassName} htmlFor={`${idPrefix}-contact-title`}>
          Tiêu đề trang
        </label>
        <input
          id={`${idPrefix}-contact-title`}
          style={styles.modalInput}
          className={inputClassName}
          value={value.page_title}
          onChange={(e) => set({ page_title: e.target.value })}
          autoComplete="off"
          placeholder="Ví dụ: Liên hệ với chúng tôi"
          disabled={disabled}
        />
      </div>
      <div style={styles.formRow} className={rowClassName}>
        <label style={styles.modalLabel} className={labelClassName} htmlFor={`${idPrefix}-contact-sub`}>
          Mô tả dưới tiêu đề
        </label>
        <input
          id={`${idPrefix}-contact-sub`}
          style={styles.modalInput}
          className={inputClassName}
          value={value.page_subtitle}
          onChange={(e) => set({ page_subtitle: e.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      <div style={styles.sectionTitle} className={classNames?.sectionTitle}>
        Điện thoại
      </div>
      <div style={styles.formRow} className={rowClassName}>
        <label style={styles.modalLabel} className={labelClassName} htmlFor={`${idPrefix}-phone-tel`}>
          Số gọi (tel, có thể gồm +)
        </label>
        <input
          id={`${idPrefix}-phone-tel`}
          type="text"
          inputMode="tel"
          style={styles.modalInput}
          className={inputClassName}
          value={value.phone.tel}
          onChange={(e) => setPhone({ tel: e.target.value })}
          autoComplete="off"
          placeholder="+84856694766"
          disabled={disabled}
          aria-invalid={!isPhoneTelValid}
          title={
            !isPhoneTelValid
              ? 'Số gọi chỉ nên gồm chữ số, +, khoảng trắng, dấu ngoặc hoặc gạch ngang.'
              : undefined
          }
        />
        {!isPhoneTelValid ? (
          <p style={styles.modalHint} className={hintClassName}>
            Số gọi không hợp lệ. Chỉ dùng chữ số và các ký tự + ( ) - khoảng trắng (ví dụ +84 85 669 4766).
          </p>
        ) : null}
      </div>
      <div style={styles.formRow} className={rowClassName}>
        <label style={styles.modalLabel} className={labelClassName} htmlFor={`${idPrefix}-phone-label`}>
          Dòng hiển thị (nếu trống sẽ dùng số gọi)
        </label>
        <input
          id={`${idPrefix}-phone-label`}
          style={styles.modalInput}
          className={inputClassName}
          value={value.phone.label}
          onChange={(e) => setPhone({ label: e.target.value })}
          autoComplete="off"
          placeholder="0856694766"
          disabled={disabled}
        />
      </div>
      <div style={styles.formRow} className={rowClassName}>
        <label style={styles.modalLabel} className={labelClassName} htmlFor={`${idPrefix}-phone-hint`}>
          Gợi ý phụ
        </label>
        <input
          id={`${idPrefix}-phone-hint`}
          style={styles.modalInput}
          className={inputClassName}
          value={value.phone.hint}
          onChange={(e) => setPhone({ hint: e.target.value })}
          autoComplete="off"
          placeholder="Gọi ngay để được tư vấn"
          disabled={disabled}
        />
      </div>

      <div style={styles.sectionTitle} className={classNames?.sectionTitle}>
        Facebook
      </div>
      <div style={styles.formRow} className={rowClassName}>
        <label style={styles.modalLabel} className={labelClassName} htmlFor={`${idPrefix}-fb-url`}>
          URL (https)
        </label>
        <input
          id={`${idPrefix}-fb-url`}
          type="url"
          style={styles.modalInput}
          className={inputClassName}
          value={value.facebook.url}
          onChange={(e) => setFacebook({ url: e.target.value })}
          autoComplete="off"
          placeholder="https://www.facebook.com/..."
          disabled={disabled}
          aria-invalid={!isFacebookUrlValid}
          title={!isFacebookUrlValid ? 'URL Facebook cần bắt đầu bằng http:// hoặc https://' : undefined}
        />
        {!isFacebookUrlValid ? (
          <p style={styles.modalHint} className={hintClassName}>
            URL Facebook không hợp lệ. Vui lòng nhập link đầy đủ bắt đầu bằng http:// hoặc https://.
          </p>
        ) : null}
      </div>
      <div style={styles.formRow} className={rowClassName}>
        <label style={styles.modalLabel} className={labelClassName} htmlFor={`${idPrefix}-fb-label`}>
          Text link (tùy chọn)
        </label>
        <input
          id={`${idPrefix}-fb-label`}
          style={styles.modalInput}
          className={inputClassName}
          value={value.facebook.label}
          onChange={(e) => setFacebook({ label: e.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      <div style={styles.sectionTitle} className={classNames?.sectionTitle}>
        Zalo
      </div>
      <div style={styles.formRow} className={rowClassName}>
        <label style={styles.modalLabel} className={labelClassName} htmlFor={`${idPrefix}-zalo-url`}>
          URL (https)
        </label>
        <input
          id={`${idPrefix}-zalo-url`}
          type="url"
          style={styles.modalInput}
          className={inputClassName}
          value={value.zalo.url}
          onChange={(e) => setZalo({ url: e.target.value })}
          autoComplete="off"
          placeholder="https://zalo.me/..."
          disabled={disabled}
          aria-invalid={!isZaloUrlValid}
          title={!isZaloUrlValid ? 'URL Zalo cần bắt đầu bằng http:// hoặc https://' : undefined}
        />
        {!isZaloUrlValid ? (
          <p style={styles.modalHint} className={hintClassName}>
            URL Zalo không hợp lệ. Vui lòng nhập link đầy đủ bắt đầu bằng http:// hoặc https://.
          </p>
        ) : null}
      </div>
      <div style={styles.formRow} className={rowClassName}>
        <label style={styles.modalLabel} className={labelClassName} htmlFor={`${idPrefix}-zalo-label`}>
          Dòng hiển thị
        </label>
        <input
          id={`${idPrefix}-zalo-label`}
          style={styles.modalInput}
          className={inputClassName}
          value={value.zalo.label}
          onChange={(e) => setZalo({ label: e.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </div>

      <div style={styles.sectionTitle} className={classNames?.sectionTitle}>
        Giờ làm việc
      </div>
      <div
        style={styles.formRow}
        className={[rowClassName, classNames?.hoursScheduleRow].filter(Boolean).join(' ')}
      >
        <label style={styles.modalLabel} className={labelClassName} htmlFor={`${idPrefix}-hours-line`}>
          Dòng lịch (có thể dùng **in đậm**)
        </label>
        <textarea
          id={`${idPrefix}-hours-line`}
          style={{ ...styles.modalInput, minHeight: '72px', resize: 'vertical' as const }}
          className={textareaClassName}
          value={value.hours.schedule_line}
          onChange={(e) => setHours({ schedule_line: e.target.value })}
          placeholder="**Thứ 2 - Chủ nhật:** 9:00 - 21:00"
          disabled={disabled}
        />
        <p style={styles.modalHint} className={hintClassName}>
          Hỗ trợ markdown cơ bản để làm nổi bật nội dung giờ mở cửa.
        </p>
      </div>
      <div style={styles.formRow} className={rowClassName}>
        <label style={styles.modalLabel} className={labelClassName} htmlFor={`${idPrefix}-hours-foot`}>
          Dòng chú thích dưới
        </label>
        <input
          id={`${idPrefix}-hours-foot`}
          style={styles.modalInput}
          className={inputClassName}
          value={value.hours.footer_note}
          onChange={(e) => setHours({ footer_note: e.target.value })}
          autoComplete="off"
          disabled={disabled}
        />
      </div>
    </div>
  );
});
