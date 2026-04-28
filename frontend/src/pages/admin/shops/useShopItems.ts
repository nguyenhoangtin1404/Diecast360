import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../../../api/client';
import { useDebouncedValue } from './useDebouncedValue';
import type { Shop, ShopItemRow } from './types';

function shopItemsFromApiResponse(
  res: unknown,
): { items: ShopItemRow[]; pagination: { page: number; page_size: number; total: number; total_pages: number } } {
  if (!res || typeof res !== 'object') {
    return { items: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 1 } };
  }
  const r = res as {
    data?: { items?: ShopItemRow[]; pagination?: { page?: number; page_size?: number; total?: number; total_pages?: number } };
    items?: ShopItemRow[];
    pagination?: { page?: number; page_size?: number; total?: number; total_pages?: number };
  };
  const items = r.data?.items ?? r.items ?? [];
  const p = r.data?.pagination ?? r.pagination ?? {};
  return {
    items: Array.isArray(items) ? items : [],
    pagination: {
      page: p.page ?? 1,
      page_size: p.page_size ?? 20,
      total: p.total ?? 0,
      total_pages: p.total_pages ?? 1,
    },
  };
}

export function useShopItems() {
  const [itemsListShopId, setItemsListShopId] = useState<string | null>(null);
  const [itemsListShopName, setItemsListShopName] = useState('');
  const [shopItems, setShopItems] = useState<ShopItemRow[]>([]);
  const [shopItemsLoading, setShopItemsLoading] = useState(false);
  const [shopItemsError, setShopItemsError] = useState<string | null>(null);
  // Use a ref instead of state: itemsQuery is only needed to track the last
  // executed search (to avoid duplicate debounce triggers) and is never rendered.
  // Using state would require calling setState inside the debounce effect, which
  // triggers cascading renders and fails the react-hooks/set-state-in-effect rule.
  const itemsQueryRef = useRef('');
  const [itemsDraftQuery, setItemsDraftQuery] = useState('');
  const [itemsPage, setItemsPage] = useState(1);
  const [itemsPageSize, setItemsPageSize] = useState<10 | 20 | 50 | 100>(20);
  const [itemsTotal, setItemsTotal] = useState(0);
  const [itemsTotalPages, setItemsTotalPages] = useState(1);
  const debouncedItemsQuery = useDebouncedValue(itemsDraftQuery, 300);

  const loadShopItems = useCallback(
    async (shopId: string, page: number, pageSize: 10 | 20 | 50 | 100, q: string) => {
      setShopItemsLoading(true);
      setShopItemsError(null);
      try {
        const res = await apiClient.get(`/admin/shops/${shopId}/items`, {
          params: {
            page,
            page_size: pageSize,
            ...(q.trim() ? { q: q.trim() } : {}),
          },
        });
        const parsed = shopItemsFromApiResponse(res);
        setShopItems(parsed.items);
        setItemsPage(parsed.pagination.page);
        setItemsPageSize(parsed.pagination.page_size as 10 | 20 | 50 | 100);
        setItemsTotal(parsed.pagination.total);
        setItemsTotalPages(parsed.pagination.total_pages || 1);
      } catch (err: unknown) {
        const msg =
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message?: string }).message ?? '')
            : '';
        setShopItemsError(msg || 'Không tải được danh sách mặt hàng.');
      } finally {
        setShopItemsLoading(false);
      }
    },
    [],
  );

  const openShopItemsModal = useCallback(async (s: Shop) => {
    setItemsListShopId(s.id);
    setItemsListShopName(s.name);
    setItemsDraftQuery('');
    itemsQueryRef.current = '';
    setItemsPage(1);
    setItemsPageSize(20);
    setItemsTotal(0);
    setItemsTotalPages(1);
    setShopItems([]);
    await loadShopItems(s.id, 1, 20, '');
  }, [loadShopItems]);

  const closeShopItemsModal = useCallback(() => {
    setItemsListShopId(null);
    setItemsListShopName('');
    setShopItems([]);
    setShopItemsError(null);
  }, []);

  const handleShopItemsSearchSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemsListShopId) return;
    const nextQuery = itemsDraftQuery.trim();
    itemsQueryRef.current = nextQuery;
    await loadShopItems(itemsListShopId, 1, itemsPageSize, nextQuery);
  }, [itemsDraftQuery, itemsListShopId, itemsPageSize, loadShopItems]);

  const handleShopItemsPageSizeChange = useCallback(async (value: 10 | 20 | 50 | 100) => {
    if (!itemsListShopId) return;
    setItemsPageSize(value);
    await loadShopItems(itemsListShopId, 1, value, itemsQueryRef.current);
  }, [itemsListShopId, loadShopItems]);

  const handleShopItemsChangePage = useCallback(async (nextPage: number) => {
    if (!itemsListShopId) return;
    if (nextPage < 1 || nextPage > itemsTotalPages) return;
    await loadShopItems(itemsListShopId, nextPage, itemsPageSize, itemsQueryRef.current);
  }, [itemsListShopId, itemsTotalPages, itemsPageSize, loadShopItems]);

  useEffect(() => {
    if (!itemsListShopId) return;
    const nextQuery = debouncedItemsQuery.trim();
    if (nextQuery === itemsQueryRef.current) return;
    itemsQueryRef.current = nextQuery;
    void loadShopItems(itemsListShopId, 1, itemsPageSize, nextQuery);
  }, [debouncedItemsQuery, itemsListShopId, itemsPageSize, loadShopItems]);

  return {
    itemsListShopId,
    itemsListShopName,
    shopItems,
    shopItemsLoading,
    shopItemsError,
    itemsDraftQuery,
    itemsPage,
    itemsPageSize,
    itemsTotal,
    itemsTotalPages,
    setItemsDraftQuery,
    openShopItemsModal,
    closeShopItemsModal,
    handleShopItemsSearchSubmit,
    handleShopItemsPageSizeChange,
    handleShopItemsChangePage,
  };
}
