/**
 * Shared item status labels and colors
 * Used in ItemsTable, FacebookPostsPage, etc.
 */
export type ItemStatus = 'con_hang' | 'giu_cho' | 'da_ban';

export const ITEM_STATUS_LABELS: Record<ItemStatus, { text: string; color: string }> = {
  con_hang: { text: 'Còn hàng', color: '#28a745' },
  giu_cho: { text: 'Giữ chỗ', color: '#ffc107' },
  da_ban: { text: 'Đã bán', color: '#6c757d' },
};
