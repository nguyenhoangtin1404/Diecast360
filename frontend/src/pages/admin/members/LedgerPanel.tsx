import type { Pagination } from '../../../types/member';
import type { MemberLedgerEntry } from '../../../types/member';

type LedgerPanelProps = {
  entries: MemberLedgerEntry[];
  selectedMemberId: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  pagination: Pagination | null;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function LedgerPanel(props: LedgerPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Lịch sử điểm</h2>
      {props.isLoading && props.selectedMemberId && <p className="text-sm text-slate-500">Đang tải ledger...</p>}
      {!props.selectedMemberId && <p className="text-sm text-slate-500">Chọn hội viên để xem lịch sử.</p>}
      {props.errorMessage && (
        <p className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {props.errorMessage}
        </p>
      )}
      {props.selectedMemberId && props.entries.length === 0 && !props.isLoading && !props.errorMessage && (
        <p className="text-sm text-slate-500">Chưa có biến động điểm.</p>
      )}
      <ul className="space-y-2" data-testid="members-ledger-list">
        {props.entries.map((entry) => (
          <li key={entry.id} className="rounded-lg border border-slate-200 p-3 text-sm">
            <div className="font-semibold text-slate-800">
              {entry.type.toUpperCase()} · {entry.delta > 0 ? '+' : ''}
              {entry.delta} điểm
            </div>
            <div className="text-xs text-slate-500">{new Date(entry.created_at).toLocaleString('vi-VN')}</div>
            <div className="mt-1 text-slate-700">{entry.reason}</div>
            <div className="text-xs text-slate-500">
              Số dư sau giao dịch: {entry.balance_after.toLocaleString('vi-VN')} điểm
            </div>
          </li>
        ))}
      </ul>
      {props.pagination && props.pagination.total_pages > 1 && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
          <span className="text-slate-500">
            Trang {props.pagination.page}/{props.pagination.total_pages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={props.onPrevPage}
              disabled={props.pagination.page <= 1 || props.isLoading}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              Trước
            </button>
            <button
              type="button"
              onClick={props.onNextPage}
              disabled={props.pagination.page >= props.pagination.total_pages || props.isLoading}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
