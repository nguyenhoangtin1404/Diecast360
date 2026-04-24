import { useState } from 'react';
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
  const [confirmTier, setConfirmTier] = useState<MemberTier | null>(null);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Quản lý hạng hội viên</h2>
      <form onSubmit={props.onSubmit} className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">Tên hạng</span>
          <input
            required
            value={props.form.name}
            onChange={(event) => props.onFormChange({ ...props.form, name: event.target.value })}
            placeholder="Ví dụ: Silver"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            Điểm tối thiểu để đạt hạng
            <InfoTooltip text="Thành viên đạt từ số điểm này trở lên sẽ vào hạng này." />
          </span>
          <input
            type="number"
            min={0}
            value={props.form.min_points}
            onChange={(event) => props.onFormChange({ ...props.form, min_points: event.target.value })}
            placeholder="0"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            Bậc hạng
            <InfoTooltip text="Số bậc càng nhỏ thì hạng càng thấp (ví dụ Bạc = 1, Vàng = 2)." />
          </span>
          <input
            type="number"
            min={1}
            value={props.form.rank}
            onChange={(event) => props.onFormChange({ ...props.form, rank: event.target.value })}
            placeholder="1"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="mt-6 inline-flex min-h-[44px] self-start items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-corporate-btn transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-corporate-card-hover disabled:translate-y-0 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
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
                  Bậc hạng {tier.rank} · Từ {tier.min_points.toLocaleString('vi-VN')} điểm
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
              onClick={() => setConfirmTier(tier)}
              disabled={props.isDeleting}
            >
              Xoá
            </button>
          </div>
        ))}
      </div>

      {confirmTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Xác nhận xoá hạng hội viên</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn có chắc muốn xoá hạng <span className="font-semibold text-slate-900">"{confirmTier.name}"</span>? Hành
              động này không thể hoàn tác.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setConfirmTier(null)}
                disabled={props.isDeleting}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                onClick={() => {
                  props.onDelete(confirmTier.id);
                  setConfirmTier(null);
                }}
                disabled={props.isDeleting}
              >
                {props.isDeleting ? 'Đang xoá...' : 'Xoá hạng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function InfoTooltip(props: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500"
        tabIndex={0}
        aria-label={props.text}
      >
        i
      </span>
      <span className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 w-56 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {props.text}
      </span>
    </span>
  );
}
