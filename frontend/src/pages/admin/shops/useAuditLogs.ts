import { useCallback, useState } from 'react';
import { apiClient } from '../../../api/client';
import type { Shop, ShopAuditLogRow } from './types';

function shopAuditLogsFromApiResponse(
  res: unknown,
): {
  logs: ShopAuditLogRow[];
  pagination: { page: number; page_size: number; total: number; total_pages: number };
} {
  if (!res || typeof res !== 'object') {
    return { logs: [], pagination: { page: 1, page_size: 20, total: 0, total_pages: 1 } };
  }
  const r = res as {
    data?: {
      logs?: ShopAuditLogRow[];
      pagination?: { page?: number; page_size?: number; total?: number; total_pages?: number };
    };
    logs?: ShopAuditLogRow[];
    pagination?: { page?: number; page_size?: number; total?: number; total_pages?: number };
  };
  const logs = r.data?.logs ?? r.logs ?? [];
  const p = r.data?.pagination ?? r.pagination ?? {};
  return {
    logs: Array.isArray(logs) ? logs : [],
    pagination: {
      page: p.page ?? 1,
      page_size: p.page_size ?? 20,
      total: p.total ?? 0,
      total_pages: p.total_pages ?? 1,
    },
  };
}

export function useAuditLogs() {
  const [auditModalShopId, setAuditModalShopId] = useState<string | null>(null);
  const [auditModalShopName, setAuditModalShopName] = useState('');
  const [auditLogs, setAuditLogs] = useState<ShopAuditLogRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditActionFilter, setAuditActionFilter] = useState<string>('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState<10 | 20 | 50 | 100>(20);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  const loadAuditLogs = useCallback(
    async (
      shopId: string,
      page: number,
      pageSize: 10 | 20 | 50 | 100,
      action: string,
    ) => {
      setAuditLoading(true);
      setAuditError(null);
      try {
        const res = await apiClient.get(`/admin/shops/${shopId}/audit-logs`, {
          params: {
            page,
            page_size: pageSize,
            ...(action ? { action } : {}),
          },
        });
        const parsed = shopAuditLogsFromApiResponse(res);
        setAuditLogs(parsed.logs);
        setAuditPage(parsed.pagination.page);
        setAuditPageSize(parsed.pagination.page_size as 10 | 20 | 50 | 100);
        setAuditTotalPages(parsed.pagination.total_pages || 1);
      } catch (err: unknown) {
        let msg = '';
        if (typeof err === 'object' && err !== null) {
          const o = err as { message?: unknown };
          if (typeof o.message === 'string') {
            msg = o.message;
          }
        }
        setAuditError(msg.trim() || 'Không tải được lịch sử hoạt động.');
      } finally {
        setAuditLoading(false);
      }
    },
    [],
  );

  const openAuditModal = useCallback(async (shop: Shop) => {
    setAuditModalShopId(shop.id);
    setAuditModalShopName(shop.name);
    setAuditActionFilter('');
    setAuditPage(1);
    setAuditPageSize(20);
    setAuditTotalPages(1);
    await loadAuditLogs(shop.id, 1, 20, '');
  }, [loadAuditLogs]);

  const closeAuditModal = useCallback(() => {
    setAuditModalShopId(null);
    setAuditModalShopName('');
    setAuditLogs([]);
    setAuditError(null);
  }, []);

  return {
    auditModalShopId,
    auditModalShopName,
    auditLogs,
    auditLoading,
    auditError,
    auditActionFilter,
    auditPage,
    auditPageSize,
    auditTotalPages,
    setAuditActionFilter,
    setAuditPageSize,
    loadAuditLogs,
    openAuditModal,
    closeAuditModal,
  };
}
