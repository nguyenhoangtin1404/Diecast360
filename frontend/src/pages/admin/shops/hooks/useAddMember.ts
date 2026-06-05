import { useRef, useState } from 'react';
import { apiClient } from '../../../../api/client';
import { isPasswordStrongEnough, PASSWORD_POLICY_MESSAGE } from './usePasswordStrength';

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_FORMAT.test(email);
}

export function useAddMember(
  onSuccess: (msg: string) => void,
  fetchShops: () => Promise<void>,
) {
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
      onSuccess(`Đã thêm thành viên (${roleSuccessLabel}) thành công.`);
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

  return {
    memberModalShopId,
    memberEmail,
    memberPassword,
    memberFullName,
    memberAddingForShopId,
    memberError,
    memberSuccess,
    memberEmailError,
    memberPasswordError,
    memberRole,
    memberEmailInputRef,
    memberPasswordInputRef,
    setMemberEmail,
    setMemberPassword,
    setMemberFullName,
    setMemberRole,
    setMemberError,
    setMemberEmailError,
    setMemberPasswordError,
    openMemberModal,
    closeMemberModal,
    handleAddShopAdmin,
  };
}
