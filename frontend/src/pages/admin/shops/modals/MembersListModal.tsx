import React from 'react';
import { KeyRound, Loader2, Lock, Unlock } from 'lucide-react';
import { styles } from '../../ShopsPage.styles';
import type { ShopMemberRow } from '../types';
import ResetPasswordModal from './ResetPasswordModal';

type Props = {
  open: boolean;
  shopName: string;
  members: ShopMemberRow[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: 10 | 20 | 50 | 100;
  total: number;
  totalPages: number;
  memberAccountActionUserId: string | null;
  onClose: () => void;
  onPageSizeChange: (v: 10 | 20 | 50 | 100) => void | Promise<void>;
  onPrevPage: () => void | Promise<void>;
  onNextPage: () => void | Promise<void>;
  onOpenResetPassword: (row: ShopMemberRow) => void;
  onToggleActive: (row: ShopMemberRow, active: boolean) => void | Promise<void>;
  roleLabel: (role: string) => string;
  resetModal: {
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
    analyze: (password: string) => {
      label: string;
      labelKey: 'empty' | 'weak' | 'fair' | 'strong';
      meterLevel: 0 | 1 | 2 | 3;
      meetsPolicy: boolean;
    };
    labelColor: (key: 'empty' | 'weak' | 'fair' | 'strong') => string;
    meterFill: (key: 'empty' | 'weak' | 'fair' | 'strong') => string;
  };
};

const MembersListModal: React.FC<Props> = ({
  open,
  shopName,
  members,
  loading,
  error,
  page,
  pageSize,
  total,
  totalPages,
  memberAccountActionUserId,
  onClose,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
  onOpenResetPassword,
  onToggleActive,
  roleLabel,
  resetModal,
}) => {
  if (!open) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalTitle}>Thành viên — {shopName}</div>
        <div style={styles.itemsToolbar}>
          <select
            value={pageSize}
            style={styles.itemsPageSizeSelect}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as 10 | 20 | 50 | 100)}
          >
            <option value={10}>10 / trang</option>
            <option value={20}>20 / trang</option>
            <option value={50}>50 / trang</option>
            <option value={100}>100 / trang</option>
          </select>
        </div>

        {error && <p style={styles.modalError}>{error}</p>}
        {loading ? (
          <p style={styles.modalHint}>Đang tải...</p>
        ) : (
          <div style={styles.membersListBox}>
            {members.length === 0 ? (
              <p style={styles.modalHint}>Chưa có thành viên.</p>
            ) : (
              members.map((row) => (
                <div key={row.user_id} style={styles.memberRow}>
                  <div style={styles.memberRowMain}>
                    <div style={styles.memberName}>{row.user.full_name?.trim() || '—'}</div>
                    <div style={styles.memberEmail}>{row.user.email}</div>
                    <div style={styles.memberRole}>
                      {roleLabel(row.role)}{' '}
                      {!row.user.is_active && <span style={styles.memberInactiveBadge}>(tài khoản tắt)</span>}
                    </div>
                  </div>
                  <div style={styles.memberRowActions}>
                    <button
                      type="button"
                      style={{ ...styles.memberResetBtn, opacity: memberAccountActionUserId === row.user_id ? 0.6 : 1 }}
                      onClick={() => onOpenResetPassword(row)}
                      title="Đặt lại mật khẩu đăng nhập"
                      disabled={memberAccountActionUserId === row.user_id}
                    >
                      <KeyRound size={16} aria-hidden style={{ marginRight: '6px' }} />
                      Đặt lại MK
                    </button>
                    {row.user.is_active ? (
                      <button
                        type="button"
                        style={{ ...styles.memberLockBtn, opacity: memberAccountActionUserId === row.user_id ? 0.6 : 1 }}
                        onClick={() => onToggleActive(row, false)}
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
                        style={{ ...styles.memberUnlockBtn, opacity: memberAccountActionUserId === row.user_id ? 0.6 : 1 }}
                        onClick={() => onToggleActive(row, true)}
                        title="Mở khóa tài khoản"
                        disabled={memberAccountActionUserId === row.user_id}
                      >
                        {memberAccountActionUserId === row.user_id ? (
                          <Loader2 size={16} className="animate-spin" aria-hidden />
                        ) : (
                          <Unlock size={16} aria-hidden style={{ marginRight: '6px' }} />
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
          <button type="button" style={styles.modalCancelBtn} onClick={onClose}>
            Đóng
          </button>
        </div>
        <div style={styles.itemsPaginationRow}>
          <span style={styles.modalHint}>
            Tổng {total} thành viên · Trang {page}/{totalPages}
          </span>
          <div style={styles.itemsPaginationBtns}>
            <button type="button" style={styles.modalCancelBtn} onClick={onPrevPage} disabled={page <= 1 || loading}>
              Trước
            </button>
            <button
              type="button"
              style={styles.modalCancelBtn}
              onClick={onNextPage}
              disabled={page >= totalPages || loading}
            >
              Sau
            </button>
          </div>
        </div>

        <ResetPasswordModal
          open={resetModal.open}
          fullName={resetModal.fullName}
          email={resetModal.email}
          password={resetModal.password}
          passwordError={resetModal.passwordError}
          submitError={resetModal.submitError}
          saving={resetModal.saving}
          onClose={resetModal.onClose}
          onSubmit={resetModal.onSubmit}
          onPasswordChange={resetModal.onPasswordChange}
          analyze={resetModal.analyze}
          labelColor={resetModal.labelColor}
          meterFill={resetModal.meterFill}
        />
      </div>
    </div>
  );
};

export default MembersListModal;
