import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

type InventoryTransactionType = 'stock_in' | 'stock_out' | 'adjustment';

interface InventoryTransaction {
  id: string;
  type: InventoryTransactionType;
  quantity: number;
  delta: number;
  resulting_quantity: number;
  reason: string;
  note?: string | null;
  actor_user_id?: string | null;
  created_at: string;
}

interface InventoryTimelineProps {
  itemId: string;
}

const TYPE_LABELS: Record<InventoryTransactionType, string> = {
  stock_in: 'Nhập kho',
  stock_out: 'Xuất kho',
  adjustment: 'Điều chỉnh',
};

export function InventoryTimeline({ itemId }: InventoryTimelineProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | InventoryTransactionType>('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['inventory-timeline', itemId, typeFilter],
    queryFn: async () => {
      const query = typeFilter === 'all' ? '' : `?type=${typeFilter}`;
      const response = await apiClient.get(`/inventory/items/${itemId}/transactions${query}`) as {
        data: { transactions: InventoryTransaction[]; current_quantity: number };
      };
      return response.data;
    },
    enabled: !!itemId,
  });

  return (
    <div style={{ marginTop: '20px', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Lịch sử kho</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(['all', 'stock_in', 'stock_out', 'adjustment'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTypeFilter(option)}
              style={{
                padding: '6px 10px',
                borderRadius: '999px',
                border: '1px solid #d1d5db',
                background: typeFilter === option ? '#111827' : '#fff',
                color: typeFilter === option ? '#fff' : '#111827',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {option === 'all' ? 'Tất cả' : TYPE_LABELS[option]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => refetch()}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Làm mới
          </button>
        </div>
      </div>

      <p style={{ margin: '8px 0 10px', fontSize: '12px', color: '#6b7280' }}>
        Tồn kho hiện tại: <strong>{data?.current_quantity ?? '-'}</strong>
      </p>

      {isLoading ? (
        <p style={{ fontSize: '13px', color: '#6b7280' }}>Đang tải lịch sử giao dịch...</p>
      ) : (data?.transactions?.length ?? 0) === 0 ? (
        <p style={{ fontSize: '13px', color: '#6b7280' }}>Chưa có giao dịch tồn kho cho sản phẩm này.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {data?.transactions.map((txn) => (
            <div
              key={txn.id}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px',
                display: 'grid',
                gridTemplateColumns: 'minmax(110px, auto) 1fr',
                gap: '8px 12px',
              }}
            >
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Loại</div>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>{TYPE_LABELS[txn.type]}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Biến động</div>
              <div style={{ fontSize: '13px' }}>
                {txn.delta > 0 ? '+' : ''}
                {txn.delta} (qty: {txn.quantity})
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Sau giao dịch</div>
              <div style={{ fontSize: '13px' }}>{txn.resulting_quantity}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Lý do</div>
              <div style={{ fontSize: '13px' }}>{txn.reason}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Thời điểm</div>
              <div style={{ fontSize: '13px' }}>{new Date(txn.created_at).toLocaleString('vi-VN')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
