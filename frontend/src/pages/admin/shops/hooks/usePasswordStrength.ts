const PASSWORD_MIN_LENGTH = 8;

export type PasswordStrengthInfo = {
  label: string;
  labelKey: 'empty' | 'weak' | 'fair' | 'strong';
  meterLevel: 0 | 1 | 2 | 3;
  /** true when password is empty (optional field) or satisfies full strong policy */
  meetsPolicy: boolean;
};

export function analyzePasswordStrength(password: string): PasswordStrengthInfo {
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

export function isPasswordStrongEnough(password: string): boolean {
  if (!password) return true;
  return analyzePasswordStrength(password).meetsPolicy;
}

export const PASSWORD_POLICY_MESSAGE =
  `Mật khẩu phải ít nhất ${PASSWORD_MIN_LENGTH} ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.`;

export function passwordStrengthLabelColor(labelKey: PasswordStrengthInfo['labelKey']): string {
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

export function passwordStrengthMeterFill(labelKey: PasswordStrengthInfo['labelKey']): string {
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
