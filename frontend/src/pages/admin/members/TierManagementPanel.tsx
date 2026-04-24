import type { FormEvent } from 'react';
import type { MemberTier } from '../../../types/member';

type TierFormState = {
  name: string;
  rank: string;
  min_points: string;
};

type TierManagementPanelProps = {
  form: TierFormState;
  tiers: MemberTier[];
  isLoading: boolean;
  loadError: string | null;
  mutationError: string | null;
  isSubmitting: boolean;
  isDeleting: boolean;
  onFormChange: (next: TierFormState) => void;
  onSubmit: (event: FormEvent) => void;
  onDelete: (tierId: string) => void;
};

export function TierManagementPanel(props: TierManagementPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Quản lý hạng hội viên</h2>
      <form onSubmit={props.onSubmit} className="grid gap-2 md:grid-cols-4">
        <input
          required
          value={props.form.name}
          onChange={(event) => props.onFormChange({ ...props.form, name: event.target.value })}
          placeholder="Tên hạng (ví dụ: Silver)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={1}
          value={props.form.rank}
          onChange={(event) => props.onFormChange({ ...props.form, rank: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          min={0}
          value={props.form.min_points}
          onChange={(event) => props.onFormChange({ ...props.form, min_points: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
          disabled={props.isSubmitting}
        >
          {props.isSubmitting ? 'Đang thêm...' : 'Thêm hạng'}
        </button>
      </form>
      {props.isLoading && <p className="mt-3 text-sm text-slate-500">Đang tải danh sách hạng...</p>}
      {props.loadError && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {props.loadError}
        </p>
      )}
      {props.mutationError && (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {props.mutationError}
        </p>
      )}
      <div className="mt-3 space-y-2" data-testid="member-tier-list">
        {props.tiers.map((tier) => (
          <div key={tier.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm">
            <div>
              <div className="font-semibold text-slate-900">{tier.name}</div>
              <div className="text-xs text-slate-500">
                Rank {tier.rank} · Từ {tier.min_points.toLocaleString('vi-VN')} điểm
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
              onClick={() => props.onDelete(tier.id)}
              disabled={props.isDeleting}
            >
              Xoá
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
