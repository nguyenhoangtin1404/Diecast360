import type { FormEvent } from 'react';

type EditFormState = {
  full_name: string;
  email: string;
  phone: string;
};

type MemberEditModalProps = {
  open: boolean;
  form: EditFormState;
  isSubmitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onFormChange: (next: EditFormState) => void;
  onSubmit: (event: FormEvent) => void;
};

export function MemberEditModal(props: MemberEditModalProps) {
  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="relative w-full max-w-xl">
        <div className="absolute -top-3 -right-3 z-10">
          <button
            type="button"
            onClick={props.onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow"
            aria-label="Đóng modal sửa hội viên"
          >
            ×
          </button>
        </div>
        <form onSubmit={props.onSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Sửa thông tin hội viên</h2>
          <div className="grid gap-2">
            <input
              required
              value={props.form.full_name}
              onChange={(event) => props.onFormChange({ ...props.form, full_name: event.target.value })}
              placeholder="Họ tên"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={props.form.email}
              onChange={(event) => props.onFormChange({ ...props.form, email: event.target.value })}
              placeholder="Email (tuỳ chọn)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              value={props.form.phone}
              onChange={(event) => props.onFormChange({ ...props.form, phone: event.target.value })}
              placeholder="Số điện thoại (tuỳ chọn)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-indigo-400"
              disabled={props.isSubmitting}
            >
              {props.isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            {props.errorMessage && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {props.errorMessage}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
