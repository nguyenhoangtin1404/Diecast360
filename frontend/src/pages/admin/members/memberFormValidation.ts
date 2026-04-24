export function validateCreateMemberInput(input: {
  full_name: string;
  email?: string;
  phone?: string;
}): string | null {
  const name = input.full_name.trim();
  const email = (input.email || '').trim();
  const phone = (input.phone || '').trim();

  if (!name) return 'Họ tên là bắt buộc.';
  if (email && email.length > 190) {
    return 'Email không được vượt quá 190 ký tự.';
  }
  if (email && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
    return 'Email không hợp lệ.';
  }
  if (phone && !/^\+?[0-9()\-.\s]{8,20}$/.test(phone)) {
    return 'Số điện thoại không hợp lệ.';
  }
  return null;
}

export function validateAdjustPointsInput(input: {
  type: 'earn' | 'redeem' | 'adjust';
  points: number;
}): string | null {
  const { type, points } = input;
  const isAdjust = type === 'adjust';
  const isValidPositive = Number.isInteger(points) && points > 0;
  const isValidSignedAdjust =
    Number.isInteger(points) && points !== 0 && points >= -1000000 && points <= 1000000;
  if ((!isAdjust && !isValidPositive) || (isAdjust && !isValidSignedAdjust)) {
    return isAdjust
      ? 'Điểm điều chỉnh phải là số nguyên khác 0 và trong khoảng -1,000,000 đến 1,000,000.'
      : 'Điểm cộng/trừ phải là số nguyên dương.';
  }
  return null;
}
