import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Member, MemberPointsMutationType } from '../../../types/member';

type AdjustFormState = {
  type: MemberPointsMutationType;
  points: string;
  reason: string;
  note: string;
};

type PointsAdjustmentFormProps = {
  selectedMember: Member | null;
  form: AdjustFormState;
  isSubmitting: boolean;
  errorMessage: string | null;
  onFormChange: (next: AdjustFormState) => void;
  onSubmit: () => void;
};

export function PointsAdjustmentForm(props: PointsAdjustmentFormProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!props.selectedMember) return;
    setIsConfirmOpen(true);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-slate-900">Điều chỉnh điểm</h2>
      {!props.selectedMember && <p className="text-sm text-slate-500">Chọn hội viên để điều chỉnh điểm.</p>}
      {props.selectedMember && (
        <div className="grid gap-2">
          <div className="text-sm text-slate-700">
            <strong>{props.selectedMember.full_name}</strong> —{' '}
            {props.selectedMember.points_balance.toLocaleString('vi-VN')} điểm
          </div>
          <select
            value={props.form.type}
            onChange={(event) =>
              props.onFormChange({
                ...props.form,
                type: event.target.value as MemberPointsMutationType,
              })
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="earn">Cộng điểm</option>
            <option value="redeem">Trừ điểm</option>
            <option value="adjust">Điều chỉnh</option>
          </select>
          <input
            type="number"
            min={props.form.type === 'adjust' ? -999999 : 1}
            max={1000000}
            value={props.form.points}
            onChange={(event) => props.onFormChange({ ...props.form, points: event.target.value })}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            value={props.form.reason}
            onChange={(event) => props.onFormChange({ ...props.form, reason: event.target.value })}
            placeholder="Lý do"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={props.form.note}
            onChange={(event) => props.onFormChange({ ...props.form, note: event.target.value })}
            placeholder="Ghi chú"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
            disabled={props.isSubmitting}
          >
            {props.isSubmitting ? 'Đang cập nhật...' : 'Lưu biến động điểm'}
          </button>
          {props.errorMessage && (
            <p className="text-sm font-medium text-rose-600" data-testid="members-adjust-error">
              {props.errorMessage}
            </p>
          )}
        </div>
      )}
      {isConfirmOpen && props.selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Xác nhận điều chỉnh điểm</h3>
            <p className="mt-2 text-sm text-slate-600">
              Áp dụng thao tác <span className="font-semibold text-slate-900">{props.form.type}</span> với{' '}
              <span className="font-semibold text-slate-900">{props.form.points}</span> điểm cho hội viên{' '}
              <span className="font-semibold text-slate-900">{props.selectedMember.full_name}</span>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => setIsConfirmOpen(false)}
                disabled={props.isSubmitting}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                onClick={() => {
                  setIsConfirmOpen(false);
                  props.onSubmit();
                }}
                disabled={props.isSubmitting}
              >
                {props.isSubmitting ? 'Đang cập nhật...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
