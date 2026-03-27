import React from 'react';
import { styles } from '../../ShopsPage.styles';

type StrengthLabelKey = 'empty' | 'weak' | 'fair' | 'strong';
type PasswordStrengthInfo = {
  label: string;
  labelKey: StrengthLabelKey;
  meterLevel: 0 | 1 | 2 | 3;
  meetsPolicy: boolean;
};

type Props = {
  open: boolean;
  fullName: string | null;
  email: string;
  password: string;
  passwordError: string | null;
  submitError: string | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  onPasswordChange: (v: string) => void;
  analyze: (password: string) => PasswordStrengthInfo;
  labelColor: (key: StrengthLabelKey) => string;
  meterFill: (key: StrengthLabelKey) => string;
};

const ResetPasswordModal: React.FC<Props> = ({
  open,
  fullName,
  email,
  password,
  passwordError,
  submitError,
  saving,
  onClose,
  onSubmit,
  onPasswordChange,
  analyze,
  labelColor,
  meterFill,
}) => {
  if (!open) return null;

  const st = analyze(password);
  const c = password.length > 0 ? labelColor(st.labelKey) : '#6b7280';
  const meter = meterFill(st.labelKey);

  return (
    <div style={styles.modalOverlayNested} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalTitle}>Đặt lại mật khẩu</div>
        <p style={styles.modalHint}>
          {fullName?.trim() || '—'} · {email}
        </p>
        {submitError && <p style={styles.modalError}>{submitError}</p>}
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={styles.formRow}>
            <label
              style={{ ...styles.modalLabel, ...(passwordError ? styles.modalLabelInvalid : {}) }}
              htmlFor="reset-pwd-modal"
            >
              Mật khẩu mới{' '}
              {password.length > 0 && (
                <span style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 600, color: c }}>
                  · Độ mạnh: {st.label}
                </span>
              )}
            </label>
            {password.length > 0 && (
              <div style={styles.passwordStrengthMeter} aria-hidden>
                {[1, 2, 3].map((seg) => (
                  <div
                    key={seg}
                    style={{
                      ...styles.passwordStrengthSegment,
                      background: seg <= st.meterLevel ? meter : '#e5e7eb',
                    }}
                  />
                ))}
              </div>
            )}
            {passwordError && (
              <span role="alert" style={styles.modalFieldError}>
                {passwordError}
              </span>
            )}
            <input
              id="reset-pwd-modal"
              style={{ ...styles.modalInput, ...(passwordError ? styles.modalInputInvalid : {}) }}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
          </div>
          <div style={styles.modalActions}>
            <button type="button" style={styles.modalCancelBtn} onClick={onClose} disabled={saving}>
              Hủy
            </button>
            <button type="submit" style={styles.modalConfirmBtn} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
