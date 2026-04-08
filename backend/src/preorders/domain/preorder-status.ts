export const PREORDER_STATUSES = [
  'cho_xac_nhan',
  'dang_cho_hang',
  'da_ve',
  'da_thanh_toan',
  'da_huy',
] as const;

export type PreOrderStatus = (typeof PREORDER_STATUSES)[number];
