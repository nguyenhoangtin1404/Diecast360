export const formatVndNumber = (value: number): string =>
  Math.round(value).toLocaleString('vi-VN');

export const formatVndLine = (value: number): string => `${formatVndNumber(value)}`;
