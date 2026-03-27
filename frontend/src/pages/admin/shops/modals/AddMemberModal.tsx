import React from 'react';
import { styles } from '../../ShopsPage.styles';

type Props = {
  open: boolean;
  shopId: string;
  memberError: string | null;
  memberSuccess: string | null;
  memberFullName: string;
  memberEmail: string;
  memberEmailError: string | null;
  adding: boolean;
  memberEmailInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onFullNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onEmailBlur: () => void;
  onSubmit: () => void | Promise<void>;
  passwordField: React.ReactNode;
};

const AddMemberModal: React.FC<Props> = ({
  open,
  shopId,
  memberError,
  memberSuccess,
  memberFullName,
  memberEmail,
  memberEmailError,
  adding,
  memberEmailInputRef,
  onClose,
  onFullNameChange,
  onEmailChange,
  onEmailBlur,
  onSubmit,
  passwordField,
}) => {
  if (!open) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalTitle}>Thêm quản trị shop</div>

        {memberError && <p style={styles.error}>{memberError}</p>}
        {memberSuccess && <p style={styles.success}>{memberSuccess}</p>}

        <div style={styles.formRow}>
          <label style={styles.modalLabel} htmlFor={`member-full-name-${shopId}`}>
            Tên hiển thị
          </label>
          <input
            id={`member-full-name-${shopId}`}
            style={styles.modalInput}
            value={memberFullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            placeholder="vd: Nguyễn Văn Anh"
          />
        </div>

        <div style={styles.formRow}>
          <label
            style={{ ...styles.modalLabel, ...(memberEmailError ? styles.modalLabelInvalid : {}) }}
            htmlFor={`member-email-${shopId}`}
          >
            Email <span style={{ color: '#b91c1c' }}>*</span>
          </label>
          {memberEmailError && (
            <span id={`member-email-error-${shopId}`} role="alert" style={styles.modalFieldError}>
              {memberEmailError}
            </span>
          )}
          <input
            ref={memberEmailInputRef}
            id={`member-email-${shopId}`}
            style={{ ...styles.modalInput, ...(memberEmailError ? styles.modalInputInvalid : {}) }}
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={memberEmailError ? true : undefined}
            aria-describedby={memberEmailError ? `member-email-error-${shopId}` : undefined}
            value={memberEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            onBlur={onEmailBlur}
            placeholder="vd: user@example.com"
          />
        </div>

        <div style={styles.formRow}>{passwordField}</div>

        <div style={styles.modalActions}>
          <button type="button" style={styles.modalCancelBtn} onClick={onClose} disabled={adding}>
            Hủy
          </button>
          <button type="button" style={styles.modalConfirmBtn} onClick={onSubmit} disabled={adding}>
            {adding ? 'Đang thêm...' : 'Thêm quản trị shop'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
