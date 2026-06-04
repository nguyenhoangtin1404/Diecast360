import React from 'react';
import { styles } from '../ShopsPage.styles';
import {
  analyzePasswordStrength,
  isPasswordStrongEnough,
  PASSWORD_POLICY_MESSAGE,
  passwordStrengthLabelColor,
  passwordStrengthMeterFill,
} from './hooks/usePasswordStrength';

type Props = {
  shopId: string;
  value: string;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
  onError: (v: string | null) => void;
};

const MemberPasswordField: React.FC<Props> = ({ shopId, value, error, inputRef, onChange, onError }) => {
  const pwdStrength = analyzePasswordStrength(value);
  const strengthLabelColor =
    value.length > 0
      ? passwordStrengthLabelColor(pwdStrength.labelKey)
      : passwordStrengthLabelColor('empty');
  const meterActive = passwordStrengthMeterFill(pwdStrength.labelKey);

  return (
    <>
      <label
        style={{
          ...styles.modalLabel,
          ...(error ? styles.modalLabelInvalid : {}),
        }}
        htmlFor={`member-password-${shopId}`}
      >
        Mật khẩu
        {value.length > 0 && (
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
      {value.length > 0 && (
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
      {error && (
        <span
          id={`member-password-error-${shopId}`}
          role="alert"
          style={styles.modalFieldError}
        >
          {error}
        </span>
      )}
      <input
        ref={inputRef}
        id={`member-password-${shopId}`}
        style={{
          ...styles.modalInput,
          ...(error ? styles.modalInputInvalid : {}),
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          const t = value.trim();
          if (t === '') {
            onError(null);
            return;
          }
          if (!isPasswordStrongEnough(t)) {
            onError(PASSWORD_POLICY_MESSAGE);
          } else {
            onError(null);
          }
        }}
        placeholder="********"
        type="password"
        autoComplete="new-password"
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [
            value.length > 0 ? `member-password-strength-${shopId}` : null,
            error ? `member-password-error-${shopId}` : null,
          ]
            .filter(Boolean)
            .join(' ') || undefined
        }
      />
    </>
  );
};

export default MemberPasswordField;
